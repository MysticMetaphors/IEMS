// import Filter from "@/assets/icons/filter.svg";
import Button from "@/components/button";
import SearchInput from "@/components/search-input";
import ClassDrawer, { ClassDrawerMode, ClassFormPayload, ClassItem } from "@/components/ui/class-drawer";
import Menu from "@/components/ui/menu";
import Modal from "@/components/ui/modal";
import Pagination from "@/components/ui/pagination";
import type { Student } from "@/components/ui/student-drawer";
import { createClass, deleteClass, getClasses, updateClass } from "@/db/classes/classes";
import { getEnrollmentsByClass, syncClassEnrollments } from "@/db/classes/enrollment";
import { getStudents } from "@/db/student/student";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

const PAGE_SIZE = 10;

// Delay before showing the confirm modal so the drawer has finished
// dismissing first (iOS can't present two modals at the same time).
const DRAWER_CLOSE_DELAY_MS = 300;

type DrawerState = {
  open: boolean;
  mode: ClassDrawerMode;
  classItem: ClassItem | null;
};

type DeleteState = {
  open: boolean;
  classItem: ClassItem | null;
};

export default function Classes() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [drawer, setDrawer] = useState<DrawerState>({
    open: false,
    mode: "add",
    classItem: null,
  });
  // Student ids enrolled in the class currently shown in the drawer.
  const [drawerStudentIds, setDrawerStudentIds] = useState<string[]>([]);

  const [deleteState, setDeleteState] = useState<DeleteState>({
    open: false,
    classItem: null,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Classes and students are loaded together (students feed the enroll checklist).
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");

      const [classResult, studentResult] = await Promise.all([getClasses(), getStudents()]);
      setClasses(classResult);
      setStudents(studentResult);
    } catch (err) {
      console.error("Failed to load classes:", err);
      setLoadError("Unable to load classes. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Search by class name, subject, or the enrolled student's name.
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return classes;

    return classes.filter((classItem) =>
      `${classItem.name} ${classItem.subject ?? ""} ${classItem.name ?? ""}`
        .toLowerCase()
        .includes(query)
    );
  }, [search, classes]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginated = filtered.slice(startIndex, endIndex);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  // ---- Drawer controls ----
  const fetchRosterIds = async (classId: string) => {
    const roster = await getEnrollmentsByClass(classId);
    return roster.filter((e) => e.status === "active").map((e) => e.student_id);
  };

  const openAdd = () => {
    setSaveError(null);
    setDrawerStudentIds([]);
    setDrawer({ open: true, mode: "add", classItem: null });
  };

  // View / edit need the current roster so the checkboxes start in the right state.
  const openExisting = async (mode: "view" | "edit", classItem: ClassItem) => {
    try {
      setSaveError(null);
      setDrawerStudentIds(await fetchRosterIds(classItem.id));
      setDrawer({ open: true, mode, classItem });
    } catch (err) {
      console.error("Failed to load class roster:", err);
      setLoadError("Unable to load the class details. Please try again.");
    }
  };

  const closeDrawer = () => {
    if (saving) return;
    setDrawer((prev) => ({ ...prev, open: false }));
  };

  // ---- Delete confirmation controls ----
  // Closes the drawer first (if it's open), then shows the confirm modal.
  const requestDelete = (classItem: ClassItem | null) => {
    if (!classItem) return;

    setDeleteError(null);
    setDrawer((prev) => ({ ...prev, open: false }));

    setTimeout(() => {
      setDeleteState({ open: true, classItem });
    }, DRAWER_CLOSE_DELAY_MS);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteState((prev) => ({ ...prev, open: false }));
  };

  // ---- CRUD handlers ----
  const handleCreate = async (input: ClassFormPayload) => {
    try {
      setSaving(true);
      setSaveError(null);

      const { studentIds, ...fields } = input;
      const id = await createClass(fields);
      await syncClassEnrollments(id, studentIds);

      setClasses(await getClasses());
      setSearch("");
      setPage(1);
      setDrawer((prev) => ({ ...prev, open: false }));
    } catch (err) {
      console.error("Failed to create class:", err);
      setSaveError("Unable to save the class. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (input: ClassFormPayload & { id: ClassItem["id"] }) => {
    try {
      setSaving(true);
      setSaveError(null);

      const { id, studentIds, ...fields } = input;
      await updateClass({ id, ...fields });
      await syncClassEnrollments(id, studentIds);

      const result = await getClasses();
      setClasses(result);

      // Go back to the details view showing the fresh data.
      const updated = result.find((c) => c.id === id) ?? null;
      setDrawerStudentIds(studentIds);
      setDrawer({ open: true, mode: "view", classItem: updated });
    } catch (err) {
      console.error("Failed to update class:", err);
      setSaveError("Unable to update the class. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    const classItem = deleteState.classItem;
    if (!classItem) return;

    try {
      setDeleting(true);
      setDeleteError(null);

      await deleteClass(classItem.id);

      setClasses(await getClasses());
      setPage(1);
      setDeleteState((prev) => ({ ...prev, open: false }));
    } catch (err) {
      console.error("Failed to delete class:", err);
      setDeleteError("Unable to delete the class. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

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
          <SearchInput value={search} onChangeText={handleSearch} className="flex-1" />
          {/* <Button LeftIcon={Filter} /> */}
          <Button label="New Class" onPress={openAdd} />
        </View>

        {/* Column headings */}
        <View className="flex flex-row items-center justify-between h-fit w-full">
          <Text className="font-inter-semibold text-[12px]">Classes</Text>
          <Text className="font-inter-semibold text-[12px]">Actions</Text>
        </View>

        {/* Class list */}
        <View className="flex gap-[10px]">
          {loading ? (
            <View className="items-center py-6">
              <ActivityIndicator />
              <Text className="font-inter text-[12px] text-muted mt-2">Loading classes...</Text>
            </View>
          ) : loadError && classes.length === 0 ? (
            <View className="items-center gap-3 py-6">
              <Text className="font-inter text-[12px] text-muted text-center">{loadError}</Text>

              <Pressable onPress={() => void loadData()}>
                <Text className="font-inter-semibold text-[12px]">Try again</Text>
              </Pressable>
            </View>
          ) : paginated.length === 0 ? (
            <Text className="font-inter text-[12px] text-muted text-center py-6">
              {search.trim() ? "No classes found" : "No classes yet. Add your first class."}
            </Text>
          ) : (
            paginated.map((classItem) => (
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
            ))
          )}
        </View>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={filtered.length}
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
        initial={drawer.classItem}
        students={students}
        initialStudentIds={drawerStudentIds}
        onClose={closeDrawer}
        onCreate={(input) => void handleCreate(input)}
        onUpdate={(input) => void handleUpdate(input)}
        onEdit={() => {
          setSaveError(null);
          setDrawer((prev) => ({ ...prev, mode: "edit" }));
        }}
        onDelete={() => requestDelete(drawer.classItem)}
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
              {deleteState.classItem?.name ?? "this class"}
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