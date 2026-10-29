import Arrow from "@/assets/icons/arrow.svg";
import AddStudent from "@/assets/icons/user-add-fill.svg";
import Button from "@/components/button";
import SearchInput from "@/components/search-input";
import Menu from "@/components/ui/menu";
import Modal from "@/components/ui/modal";
import StudentDrawer, { DrawerMode, Student, StudentFormPayload } from "@/components/ui/student-drawer";
// import { ResetDatabaseButton } from "@/db/refresh-database/button";
import { getClasses } from "@/db/classes/classes";
import { getEnrollmentsByStudent, syncStudentEnrollments } from "@/db/classes/enrollment";
import { createStudent, deleteStudent, getStudentById, getStudentsPage, updateStudent } from "@/db/student/student";
import { usePagedList } from "@/hooks/use-paged-list";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

const PAGE_SIZE = 10;

// Delay before showing the confirm modal so the drawer has finished
// dismissing first (iOS can't present two modals at the same time).
const DRAWER_CLOSE_DELAY_MS = 300;

// All drawer state lives in one object. Closing only flips `open`, so the
// drawer keeps its mode/student while it animates out.
type DrawerState = {
  open: boolean;
  mode: DrawerMode;
  student: Student | null;
};

// Same idea for the delete confirmation: keep the student while it animates out.
type DeleteState = {
  open: boolean;
  student: Student | null;
};

export default function Students() {
  // Only the current page is loaded; search and paging happen in SQLite.
  const {
    rows: students,
    total,
    page,
    setPage,
    totalPages,
    startIndex,
    endIndex,
    search,
    setSearch,
    loading,
    error: listError,
    reload,
    retry,
    reset,
  } = usePagedList(getStudentsPage, PAGE_SIZE);

  const [drawer, setDrawer] = useState<DrawerState>({
    open: false,
    mode: "add",
    student: null,
  });

  const [deleteState, setDeleteState] = useState<DeleteState>({
    open: false,
    student: null,
  });

  // Classes feed the enroll checklist and are loaded when a drawer opens, not up front.
  // drawerClassIds is the shown student's current classes.
  const [classes, setClasses] = useState<Awaited<ReturnType<typeof getClasses>>>([]);
  const [drawerClassIds, setDrawerClassIds] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const errorMessage =
    loadError || (listError ? "Unable to load students. Please try again." : "");

  // ---- Drawer controls ----
  // The drawer needs every class for its checklist, plus (for an existing student) the
  // classes they are in so the checkboxes start correct. Both load here, when it opens.
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
      setDrawer({ open: true, mode, student });
    } catch (err) {
      console.error("Failed to load student classes:", err);
      setLoadError("Unable to load the student details. Please try again.");
    }
  };

  const closeDrawer = () => {
    if (saving) return;
    setDrawer((prev) => ({ ...prev, open: false }));
  };

  // ---- Delete confirmation controls ----
  // Closes the drawer first (if it's open), then shows the confirm modal.
  const requestDelete = (student: Student | null) => {
    if (!student) return;

    setDeleteError(null);
    setDrawer((prev) => ({ ...prev, open: false }));

    setTimeout(() => {
      setDeleteState({ open: true, student });
    }, DRAWER_CLOSE_DELAY_MS);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setDeleteState((prev) => ({ ...prev, open: false }));
  };

  // ---- CRUD handlers ----
  const handleCreate = async (input: StudentFormPayload) => {
    try {
      setSaving(true);
      setSaveError(null);

      const { classIds, ...fields } = input;
      const id = await createStudent(fields);
      await syncStudentEnrollments(id, classIds);

      // Show the first page with no search so the new student is visible.
      reset();
      setDrawer((prev) => ({ ...prev, open: false }));
    } catch (err) {
      console.error("Failed to create student:", err);
      setSaveError("Unable to save the student. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (input: StudentFormPayload & { id: Student["id"] }) => {
    try {
      setSaving(true);
      setSaveError(null);

      const { id, classIds, ...fields } = input;
      await updateStudent({ id, ...fields });
      await syncStudentEnrollments(id, classIds);

      // Reload the current page, and read the saved student directly because a rename
      // can move them to a different page.
      reload();
      const updated = await getStudentById(id);

      // Go back to the details view showing the fresh data.
      setDrawerClassIds(classIds);
      setDrawer({ open: true, mode: "view", student: updated });
    } catch (err) {
      console.error("Failed to update student:", err);
      setSaveError("Unable to update the student. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    const student = deleteState.student;
    if (!student) return;

    try {
      setDeleting(true);
      setDeleteError(null);

      await deleteStudent(student.id);

      setPage(1);
      reload();
      setDeleteState((prev) => ({ ...prev, open: false }));
    } catch (err) {
      console.error("Failed to delete student:", err);
      setDeleteError("Unable to delete the student. Please try again.");
    } finally {
      setDeleting(false);
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
            <View className="items-center py-6">
              <ActivityIndicator />
              <Text className="font-inter text-[12px] text-muted mt-2">
                Loading students...
              </Text>
            </View>
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

        {/* <ResetDatabaseButton /> */}

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

      {/* One drawer for add / edit / view */}
      <StudentDrawer
        open={drawer.open}
        mode={drawer.mode}
        initial={drawer.student}
        classes={classes}
        initialClassIds={drawerClassIds}
        onClose={closeDrawer}
        onCreate={(input) => void handleCreate(input)}
        onUpdate={(input) => void handleUpdate(input)}
        onEdit={() => {
          setSaveError(null);
          setDrawer((prev) => ({ ...prev, mode: "edit" }));
        }}
        onDelete={() => requestDelete(drawer.student)}
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
              {deleteState.student?.name ?? "this student"}
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