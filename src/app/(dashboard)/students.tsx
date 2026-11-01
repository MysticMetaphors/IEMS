import Arrow from "@/assets/icons/arrow.svg";
import AddStudent from "@/assets/icons/user-add-fill.svg";
import Button from "@/components/button";
import SearchInput from "@/components/search-input";
import Menu from "@/components/ui/menu";
import Modal from "@/components/ui/modal";
import { ListSkeleton } from "@/components/ui/skeleton";
import StudentDrawer, { DrawerMode, Student, StudentFormPayload } from "@/components/ui/student-drawer";
import { getClasses } from "@/db/classes/classes";
import { getEnrollmentsByStudent, syncStudentEnrollments } from "@/db/classes/enrollment";
import { createStudent, deleteStudent, getStudentById, getStudentsPage, updateStudent } from "@/db/student/student";
import { useEntityCrud } from "@/hooks/use-entity-crud";
import { usePagedList } from "@/hooks/use-paged-list";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const PAGE_SIZE = 10;

export default function Students() {
  const {
    rows: students, total, page, setPage, totalPages,
    startIndex, endIndex,
    search, setSearch,
    loading,
    error: listError,
    reload, retry, reset,
  } = usePagedList(getStudentsPage, PAGE_SIZE);

  const [classes, setClasses] = useState<Awaited<ReturnType<typeof getClasses>>>([]);
  const [drawerClassIds, setDrawerClassIds] = useState<string[]>([]);
  const {
    drawer, showDrawer, switchMode, closeDrawer,
    saving, saveError, setSaveError,
    deleteState, deleting, deleteError, requestDelete, closeDeleteModal,
    handleCreate, handleUpdate, handleConfirmDelete,
  } = useEntityCrud<
    Student,
    DrawerMode,
    StudentFormPayload,
    StudentFormPayload & { id: Student["id"] }
  >({
    entity: "student",
    initialMode: "add",
    viewMode: "view",
    list: { reload, reset, setPage },
    create: async ({ classIds, ...fields }) => {
      const id = await createStudent(fields);
      await syncStudentEnrollments(id, classIds);
    },
    update: async ({ id, classIds, ...fields }) => {
      await updateStudent({ id, ...fields });
      await syncStudentEnrollments(id, classIds);
      const updated = await getStudentById(id);
      setDrawerClassIds(classIds);
      return updated;
    },
    remove: (student) => deleteStudent(student.id),
  });

  const [loadError, setLoadError] = useState("");
  const errorMessage = loadError || (listError ? "Unable to load students. Please try again." : "");

  const openDrawer = async (mode: DrawerMode, student: Student | null = null) => {
    setSaveError(null);

    try {
      const [classOptions, enrollments] = await Promise.all([
        getClasses(),
        student ? getEnrollmentsByStudent(student.id) : Promise.resolve(null),
      ]);

      setClasses(classOptions);
      setDrawerClassIds(
        enrollments
          ? enrollments.filter((e) => e.status === "active").map((e) => e.class_id)
          : []
      );
      showDrawer(mode, student);
    } catch (err) {
      console.error("Failed to load student classes:", err);
      setLoadError("Unable to load the student details. Please try again.");
    }
  };

  const isFirst = page === 1;
  const isLast = page >= totalPages;

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
          <SearchInput
            value={search}
            onChangeText={setSearch}
            className="flex-1"
          />

          <Button
            LeftIcon={AddStudent}
            label="New Student"
            onPress={() => openDrawer("add")}
          />
        </View>

        {/* Column headings */}
        <View className="flex flex-row items-center justify-between h-fit w-full">
          <Text className="font-inter-semibold text-[12px]">Students</Text>
          <Text className="font-inter-semibold text-[12px]">Actions</Text>
        </View>

        {/* Student list */}
        <View className="flex gap-[10px]">
          {loading ? (
            <ListSkeleton label="Loading students" />
          ) : errorMessage && students.length === 0 ? (
            <View className="items-center gap-3 py-6">
              <Text className="font-inter text-[12px] text-muted text-center">
                {errorMessage}
              </Text>

              <Pressable
                onPress={() => {
                  setLoadError("");
                  retry();
                }}
              >
                <Text className="font-inter-semibold text-[12px]">Try again</Text>
              </Pressable>
            </View>
          ) : students.length === 0 ? (
            <Text className="font-inter text-[12px] text-muted text-center py-6">
              {search.trim()
                ? "No students found"
                : "No students yet. Add your first student."}
            </Text>
          ) : (
            students.map((student) => (
              <View
                key={student.id}
                className="px-[16px] py-[13px] flex flex-row justify-between items-center rounded-[12px] border border-border bg-card"
              >
                <View className="flex-1 flex-row items-center gap-[10px] mr-3">
                  <View className="flex-1">
                    <Text className="font-inter-bold text-[12px] text-foreground">
                      {student.name}
                    </Text>

                    <Text className="font-inter text-[10px] text-muted">
                      {student.email || student.phone || "No contact information"}
                    </Text>
                  </View>
                </View>

                <View className="items-center justify-center self-center">
                  <Menu
                    items={[
                      { label: "View Details", onPress: () => openDrawer("view", student) },
                      { label: "Edit Student", onPress: () => openDrawer("edit", student) },
                      {
                        label: "Delete",
                        type: "destructive",
                        onPress: () => requestDelete(student),
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
          <View className="flex flex-row items-center justify-between gap-[10px]">
            <View className="flex flex-row gap-[10px]">
              <Pressable
                disabled={isFirst}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                className={`px-[13px] py-[15px] bg-card rounded-[12px] border border-border ${isFirst ? "opacity-40" : ""}`}
              >
                <Arrow height={15} width={24} style={{ color: "#A9A9A9" }} />
              </Pressable>

              <Pressable
                disabled={isLast}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={`px-[13px] py-[15px] bg-card rounded-[12px] border border-border ${isLast ? "opacity-40" : ""}`}
              >
                <Arrow
                  height={15}
                  width={24}
                  style={{
                    color: "#A9A9A9",
                    transform: [{ rotate: "180deg" }],
                  }}
                />
              </Pressable>
            </View>

            <Text className="font-inter-semibold text-[12px]">
              {total === 0
                ? "No results"
                : `Showing students ${startIndex + 1}–${Math.min(
                  endIndex,
                  total
                )} of ${total}`}
            </Text>
          </View>
        )}
      </ScrollView>

      <StudentDrawer
        open={drawer.open}
        mode={drawer.mode}
        initial={drawer.item}
        classes={classes}
        initialClassIds={drawerClassIds}
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
              {deleteState.item?.name ?? "this student"}
            </Text>
            ? This can't be undone.
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