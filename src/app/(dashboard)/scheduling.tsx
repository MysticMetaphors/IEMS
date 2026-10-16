import CalendarIcon from "@/assets/icons/sidebar/scheduling.svg";
import Button from "@/components/button";
import type { ClassItem } from "@/components/ui/class-drawer";
import SessionDrawer, {
  type SessionDrawerMode,
  type SessionFormPayload,
} from "@/components/ui/class-session-drawer";
import Modal from "@/components/ui/modal";
import WeeklySchedule from "@/components/ui/schedule-view/weekly-schedule";
import { getClasses } from "@/db/classes/classes";
import {
  createClassSession,
  deleteClassSession,
  getClassSessions,
  updateClassSession,
  type ClassSessionRow,
} from "@/db/classes/sessions";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

// Monday 00:00 of the current week -> Monday 00:00 of the next week
function getWeekRange() {
  const from = new Date();
  from.setHours(0, 0, 0, 0); // Start of today

  const to = new Date(from);
  to.setDate(from.getDate() + 7); // 7 days total span

  return { from, to };
}

const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong. Please try again.";

export default function Scheduling() {
  const [search, setSearch] = useState("");

  const [sessions, setSessions] = useState<ClassSessionRow[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);

  // drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<SessionDrawerMode>("add");
  const [selected, setSelected] = useState<ClassSessionRow | null>(null);
  const [defaultStart, setDefaultStart] = useState<Date | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const { from, to } = getWeekRange();
    const [sessionRows, classRows] = await Promise.all([
      getClassSessions({ from, to }),
      getClasses(),
    ]);
    setSessions(sessionRows);
    setClasses(classRows);
  }, []);

  // refresh every time this screen is shown
  useFocusEffect(
    useCallback(() => {
      load().catch(console.error);
    }, [load])
  );

  // search by class name or session title
  const visibleSessions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sessions;
    return sessions.filter(
      (s) =>
        s.class_name.toLowerCase().includes(query) ||
        (s.title ?? "").toLowerCase().includes(query)
    );
  }, [sessions, search]);

  // Only active classes can get new sessions, but keep the class of the
  // session being viewed/edited even if it was archived since.
  const drawerClasses = useMemo(
    () => classes.filter((c) => c.status === "active" || c.id === selected?.class_id),
    [classes, selected]
  );

  function openAdd(start?: Date) {
    setSelected(null);
    setDefaultStart(start);
    setSaveError(null);
    setDrawerMode("add");
    setDrawerOpen(true);
  }

  function openView(session: ClassSessionRow) {
    setSelected(session);
    setDefaultStart(undefined);
    setSaveError(null);
    setDrawerMode("view");
    setDrawerOpen(true);
  }

  function closeDrawer() {
    if (isSaving) return;
    setDrawerOpen(false);
    setSaveError(null);
  }

  async function handleCreate(input: SessionFormPayload) {
    setIsSaving(true);
    setSaveError(null);
    try {
      await createClassSession(input);
      await load();
      setDrawerOpen(false);
    } catch (e) {
      setSaveError(errorMessage(e));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(input: SessionFormPayload & { id: string }) {
    setIsSaving(true);
    setSaveError(null);
    try {
      await updateClassSession(input);
      await load();
      setDrawerOpen(false);
    } catch (e) {
      setSaveError(errorMessage(e));
    } finally {
      setIsSaving(false);
    }
  }

  function handleDelete() {
    if (!selected) return;

    setDeleteError(null);
    setDeleteModalOpen(true);
    setDrawerOpen(false);
  }

  function closeDeleteModal() {
    if (deleting) return;

    setDeleteModalOpen(false);
    setDeleteError(null);
  }

  async function handleConfirmDelete() {
    if (!selected || deleting) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      await deleteClassSession(selected.id);
      await load();

      setDeleteModalOpen(false);
      setSelected(null);
    } catch (e) {
      setDeleteError(errorMessage(e));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <ScrollView
        className="flex-1 bg-white"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-[18px] pb-[200px]"
      >
        <View className="flex gap-[10px]">
          <View className="flex-row items-center gap-[10px] w-full">
            {/* Date Picker */}
            <View className="flex-1 min-w-0 flex-row items-center gap-[10px] border border-border bg-card rounded-[12px] px-[13px] h-[44px]">
              <Text className="flex-1 font-inter text-[12px]">Oct 17, 2026 - Oct 22, 2026</Text>

              <View className="shrink-0 items-center justify-center">
                <CalendarIcon
                  height={17}
                  width={17}
                  color="#6B7280"
                />
              </View>
            </View>

            {/* Schedule Button */}
            <View className="shrink-0">
              <Button
                label="Schedule Class"
                onPress={() => openAdd()}
              />
            </View>
          </View>
        </View>

        <View className="flex flex-row items-center justify-between h-fit w-full">
          <Text className="font-inter-semibold text-[12px]">Schedule Calendar (Week)</Text>
        </View>

        <WeeklySchedule
          sessions={visibleSessions}
          onSessionPress={openView}
          onSlotPress={openAdd}
        />
      </ScrollView>

      <SessionDrawer
        open={drawerOpen}
        mode={drawerMode}
        initial={selected}
        classes={drawerClasses}
        defaultStart={defaultStart}
        onClose={closeDrawer}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onEdit={() => {
          setSaveError(null);
          setDrawerMode("edit");
        }}
        onDelete={handleDelete}
        isSaving={isSaving}
        saveError={saveError}
      />

      <Modal
        title="Confirm Delete"
        visible={deleteModalOpen}
        onClose={closeDeleteModal}
        dismissOnBackdrop={false}
        showClose={false}
      >
        <View className="gap-[16px]">
          <Text className="font-inter text-[14px] text-muted">
            Are you sure you want to delete the session for {" "}
            <Text className="font-inter-semibold text-foreground">
              {selected?.class_name ?? "this class"}
            </Text>
            ?
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
      </Modal >
    </>
  );
}