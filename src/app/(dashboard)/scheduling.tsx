import CalendarIcon from "@/assets/icons/sidebar/scheduling.svg";
import Button from "@/components/button";
import type { ClassItem } from "@/components/ui/class-drawer";
import SessionDrawer, {
  type SessionDrawerMode,
  type SessionFormPayload,
} from "@/components/ui/class-session-drawer";
import Modal from "@/components/ui/modal";
import WeeklySchedule, {
  type ScheduleView,
} from "@/components/ui/schedule-view/weekly-schedule";
import SegmentedTabs from "@/components/ui/segmented-tabs";
import {
  getSessionAttendance,
  saveAttendance,
  saveSessionAttendance,
  type AttendanceStatus,
  type SessionAttendanceRow,
} from "@/db/classes/attendance";
import { getClasses } from "@/db/classes/classes";
import {
  createClassSession,
  deleteClassSession,
  getClassSessions,
  SessionStatus,
  updateClassSession,
  updateClassSessionStatus,
  type ClassSessionRow,
} from "@/db/classes/sessions";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";

const TABS = [{ label: "Day" }, { label: "Week" }];

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

// Oct 17, 2026
const formatDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const formatShort = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong. Please try again.";

export default function Scheduling() {
  // view + filter date
  const [activeTab, setActiveTab] = useState("Day");
  const [filterDate, setFilterDate] = useState<Date>(() => startOfDay(new Date()));
  const [showIosPicker, setShowIosPicker] = useState(false);
  const view: ScheduleView = activeTab === "Day" ? "day" : "week";

  const [sessions, setSessions] = useState<ClassSessionRow[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);

  // drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<SessionDrawerMode>("add");
  const [selected, setSelected] = useState<ClassSessionRow | null>(null);
  const [defaultStart, setDefaultStart] = useState<Date | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // attendance of the opened session
  const [attendance, setAttendance] = useState<SessionAttendanceRow[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filterKey = filterDate.getTime();

  // Day: [date, date + 1)   Week: [date, date + 7)  e.g. Oct 12 -> Oct 18
  const range = useMemo(() => {
    const from = startOfDay(new Date(filterKey));
    const days = view === "day" ? 1 : 7;
    return { from, to: addDays(from, days), lastDay: addDays(from, days - 1) };
  }, [filterKey, view]);

  const rangeLabel =
    view === "day"
      ? formatDate(range.from)
      : `${formatShort(range.from)} - ${formatDate(range.lastDay)}`;

  const load = useCallback(async () => {
    const [sessionRows, classRows] = await Promise.all([
      getClassSessions({ from: range.from, to: range.to }),
      getClasses(),
    ]);
    setSessions(sessionRows);
    setClasses(classRows);
  }, [range]);

  // refresh when the screen is shown or the view / date changes
  useFocusEffect(
    useCallback(() => {
      load().catch(console.error);
    }, [load])
  );

  // Only active classes can get new sessions, but keep the class of the
  // session being viewed/edited even if it was archived since.
  const drawerClasses = useMemo(
    () => classes.filter((c) => c.status === "active" || c.id === selected?.class_id),
    [classes, selected]
  );

  // load the roster whenever a session is opened in the drawer
  useEffect(() => {
    if (!drawerOpen || !selected) {
      setAttendance([]);
      return;
    }

    let cancelled = false;
    setAttendanceLoading(true);

    getSessionAttendance(selected.id)
      .then((rows) => {
        if (!cancelled) setAttendance(rows);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setAttendanceLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [drawerOpen, selected?.id]);

  // Saved right away. The row updates immediately and rolls back if saving fails.
  async function handleAttendanceChange(studentId: string, status: AttendanceStatus) {
    if (!selected) return;

    const previous = attendance.find((r) => r.student_id === studentId)?.status ?? null;
    setAttendance((rows) =>
      rows.map((r) => (r.student_id === studentId ? { ...r, status } : r))
    );

    try {
      await saveAttendance({ session_id: selected.id, student_id: studentId, status });
    } catch (e) {
      setAttendance((rows) =>
        rows.map((r) => (r.student_id === studentId ? { ...r, status: previous } : r))
      );
      setSaveError(errorMessage(e));
    }
  }

  // Only students without attendance yet; existing marks are left alone.
  async function handleMarkAllPresent() {
    if (!selected) return;

    const unmarkedIds = attendance.filter((r) => !r.status).map((r) => r.student_id);
    if (unmarkedIds.length === 0) return;

    const ids = new Set(unmarkedIds);
    setAttendance((rows) =>
      rows.map((r) => (ids.has(r.student_id) ? { ...r, status: "present" } : r))
    );

    try {
      await saveSessionAttendance(
        selected.id,
        unmarkedIds.map((student_id) => ({ student_id, status: "present" as const }))
      );
    } catch (e) {
      setAttendance((rows) =>
        rows.map((r) => (ids.has(r.student_id) ? { ...r, status: null } : r))
      );
      setSaveError(errorMessage(e));
    }
  }

  function openDatePicker() {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: filterDate,
        mode: "date",
        onChange: (event, picked) => {
          if (event.type === "set" && picked) setFilterDate(startOfDay(picked));
        },
      });
    } else {
      setShowIosPicker((prev) => !prev);
    }
  }

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

  async function handleStatusChange(status: SessionStatus) {
    if (!selected) return;
    const { id } = selected;
    const previous = selected.status;

    const apply = (s: SessionStatus) => {
      setSelected((prev) => (prev ? { ...prev, status: s } : prev));
      setSessions((rows) => rows.map((r) => (r.id === id ? { ...r, status: s } : r)));
    };

    apply(status);
    try {
      await updateClassSessionStatus(id, status);
    } catch (e) {
      apply(previous);
      setSaveError(errorMessage(e));
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
            {/* Date Picker (filter date) */}
            <Pressable
              onPress={openDatePicker}
              className="flex-1 min-w-0 flex-row items-center gap-[10px] border border-border bg-card rounded-[12px] px-[13px] h-[44px]"
            >
              <Text className="flex-1 font-inter text-[12px]">{formatDate(filterDate)}</Text>

              <View className="shrink-0 items-center justify-center">
                <CalendarIcon height={17} width={17} color="#6B7280" />
              </View>
            </Pressable>

            {/* Schedule Button */}
            <View className="shrink-0">
              <Button label="Schedule Class" onPress={() => openAdd()} />
            </View>
          </View>

          {Platform.OS === "ios" && showIosPicker ? (
            <DateTimePicker
              value={filterDate}
              mode="date"
              display="inline"
              onChange={(_, picked) => {
                if (picked) setFilterDate(startOfDay(picked));
              }}
            />
          ) : null}

          <SegmentedTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
        </View>

        <View className="flex flex-row items-center justify-between h-fit w-full gap-[12px]">
          <Text className="font-inter-semibold text-[12px]">
            Schedule Calendar ({view === "day" ? "Day" : "Week"})
          </Text>
          <Text className="font-inter text-[10px] text-muted">{rangeLabel}</Text>
        </View>

        <WeeklySchedule
          view={view}
          date={filterDate}
          sessions={sessions}
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
        attendance={attendance}
        attendanceLoading={attendanceLoading}
        showActions={true}
        onAttendanceChange={handleAttendanceChange}
        onMarkAllPresent={handleMarkAllPresent}
        onClose={closeDrawer}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onStatusChange={handleStatusChange}
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
            Are you sure you want to delete the session for{" "}
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
              className={`items-center rounded-[12px] bg-red-600 px-[16px] py-[10px] ${deleting ? "opacity-60" : ""
                }`}
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