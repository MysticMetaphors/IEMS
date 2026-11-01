// import Filter from "@/assets/icons/filter.svg";
import Button from "@/components/button";
import SearchInput from "@/components/search-input";
import ClassDrawer, { ClassDrawerMode, ClassFormPayload, ClassItem } from "@/components/ui/class-drawer";
import Menu from "@/components/ui/menu";
import Modal from "@/components/ui/modal";
import Pagination from "@/components/ui/pagination";
import { ListSkeleton } from "@/components/ui/skeleton";
import type { Student } from "@/components/ui/student-drawer";
import { createClass, deleteClass, getClassById, getClassesPage, updateClass } from "@/db/classes/classes";
import { getEnrollmentsByClass, syncClassEnrollments } from "@/db/classes/enrollment";
import { getStudents } from "@/db/student/student";
import { useEntityCrud } from "@/hooks/use-entity-crud";
import { usePagedList } from "@/hooks/use-paged-list";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const PAGE_SIZE = 10;

export default function Classes() {
  const {
    rows: classes, total, page, setPage, totalPages,
    startIndex, endIndex,
    search, setSearch,
    loading,
    error: listError,
    reload, retry, reset,
  } = usePagedList(getClassesPage, PAGE_SIZE);

  const [students, setStudents] = useState<Student[]>([]);
  const [drawerStudentIds, setDrawerStudentIds] = useState<string[]>([]);
  const {
    drawer, showDrawer, switchMode, closeDrawer,
    saving, saveError, setSaveError,
    deleteState, deleting, deleteError, requestDelete, closeDeleteModal,
    handleCreate, handleUpdate, handleConfirmDelete,
  } = useEntityCrud<
    ClassItem,
    ClassDrawerMode,
    ClassFormPayload,
    ClassFormPayload & { id: ClassItem["id"] }
  >({
    entity: "class",
    initialMode: "add",
    viewMode: "view",
    list: { reload, reset, setPage },
    create: async ({ studentIds, ...fields }) => {
      const id = await createClass(fields);
      await syncClassEnrollments(id, studentIds);
    },
    update: async ({ id, studentIds, ...fields }) => {
      await updateClass({ id, ...fields });
      await syncClassEnrollments(id, studentIds);
      const updated = await getClassById(id);
      setDrawerStudentIds(studentIds);
      return updated;
    },
    remove: (classItem) => deleteClass(classItem.id),
  });

  const [loadError, setLoadError] = useState("");
  const errorMessage = loadError || (listError ? "Unable to load classes. Please try again." : "");

  // ---- Drawer controls ----
  const fetchRosterIds = async (classId: string) => {
    const roster = await getEnrollmentsByClass(classId);
    return roster.filter((e) => e.status === "active").map((e) => e.student_id);
  };

  const openAdd = async () => {
    try {
      setSaveError(null);
      setStudents(await getStudents());
      setDrawerStudentIds([]);
      showDrawer("add")
    } catch (err) {
      console.error("Failed to load students:", err);
      setLoadError("Unable to load the students. Please try again.");
    }
  };

  const openExisting = async (mode: "view" | "edit", classItem: ClassItem) => {
    try {
      setSaveError(null);

      const [rosterIds, studentOptions] = await Promise.all([
        fetchRosterIds(classItem.id),
        getStudents(),
      ]);

      setStudents(studentOptions);
      setDrawerStudentIds(rosterIds);
      showDrawer(mode, classItem);
    } catch (err) {
      console.error("Failed to load class roster:", err);
      setLoadError("Unable to load the class details. Please try again.");
    }
  };

  const [studentId, setStudentId] = useState<string | null>(null);

  return (
    <>
      <ScrollView
        className="flex-1 bg-white"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-[18px] pb-[200px]"
      >
        {/* Search and create */}
        <View className="flex flex-row gap-[10px] max-w-full">
          <SearchInput value={search} onChangeText={setSearch} className="flex-1" />
          {/* <Button LeftIcon={Filter} /> */}
          <Button label="New Class" onPress={() => void openAdd()} />
        </View>

        {/* Column headings */}
        <View className="flex flex-row items-center justify-between h-fit w-full">
          <Text className="font-inter-semibold text-[12px]">Classes</Text>
          <Text className="font-inter-semibold text-[12px]">Actions</Text>
        </View>

        {/* Class list */}
        <View className="flex gap-[10px]">
          {loading ? (
            <ListSkeleton label="Loading classes" />
          ) : errorMessage && classes.length === 0 ? (
            <View className="items-center gap-3 py-6">
              <Text className="font-inter text-[12px] text-muted text-center">{errorMessage}</Text>

              <Pressable
                onPress={() => {
                  setLoadError("");
                  retry();
                }}
              >
                <Text className="font-inter-semibold text-[12px]">Try again</Text>
              </Pressable>
            </View>
          ) : classes.length === 0 ? (
            <Text className="font-inter text-[12px] text-muted text-center py-6">
              {search.trim() ? "No classes found" : "No classes yet. Add your first class."}
            </Text>
          ) : (
            classes.map((classItem) => (
              <View
                key={classItem.id}
                className="px-[16px] py-[13px] flex flex-row justify-between items-center rounded-[12px] border border-border bg-card"
              >
                <View className="flex-1 mr-3">
                  <Text className="font-inter-bold text-[12px] text-foreground">
                    {classItem.name}
                  </Text>

                  <Text className="font-inter text-[10px] font-normal text-muted">
                    {`${classItem.student_count} students enrolled`}
                  </Text>
                </View>
                <View className="items-center justify-center self-center">
                  <Menu
                    items={[
                      { label: "View Details", onPress: () => void openExisting("view", classItem) },
                      { label: "Edit Class", onPress: () => void openExisting("edit", classItem) },
                      {
                        label: "Delete",
                        type: "destructive",
                        onPress: () => requestDelete(classItem),
                      },
                    ]}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={total}
            startIndex={startIndex}
            endIndex={endIndex}
            itemLabel="classes"
            setPage={setPage}
          />
        )}
      </ScrollView>

      {/* One drawer for add / edit / view */}
      <ClassDrawer
        open={drawer.open}
        mode={drawer.mode}
        initial={drawer.item}
        students={students}
        initialStudentIds={drawerStudentIds}
        onClose={closeDrawer}
        onCreate={(input) => void handleCreate(input)}
        onUpdate={(input) => void handleUpdate(input)}
        onEdit={() => {
          setSaveError(null);
          switchMode("edit");
        }}
        onDelete={() => requestDelete(drawer.item)}
        isSaving={saving}
        saveError={saveError}
      />

      {/* Delete confirmation */}
      <Modal
        title="Confirm Delete"
        visible={deleteState.open}
        onClose={closeDeleteModal}
        dismissOnBackdrop={false}
        showClose={false}
      >
        <View className="gap-[16px]">
          <Text className="font-inter text-[14px] text-muted">
            Are you sure you want to delete{" "}
            <Text className="font-inter-semibold text-foreground">
              {deleteState.item?.name ?? "this class"}
            </Text>
            ? Its student enrollments will be removed too. This can't be undone.
          </Text>

          {deleteError ? (
            <Text className="font-inter text-[12px] text-red-600">{deleteError}</Text>
          ) : null}

          <View className="flex-row items-center justify-end gap-[16px]">
            <Pressable
              disabled={deleting}
              onPress={closeDeleteModal}
              className="items-center py-2 px-[12px]"
            >
              <Text className="font-inter-semibold text-[12px] text-muted">Cancel</Text>
            </Pressable>

            <Pressable
              disabled={deleting}
              onPress={() => void handleConfirmDelete()}
              className={`items-center rounded-[12px] bg-red-600 px-[16px] py-[10px] ${deleting ? "opacity-60" : ""}`}
            >
              <Text className="font-inter-semibold text-[12px] text-white">
                {deleting ? "Deleting..." : "Delete"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}