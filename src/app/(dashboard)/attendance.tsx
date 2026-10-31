import Arrow from "@/assets/icons/arrow.svg";
import Filter from "@/assets/icons/filter.svg";
import Absent from "@/assets/icons/status/absent.svg";
import Not_Tagged from "@/assets/icons/status/not_tagged.svg";
import Present from "@/assets/icons/status/present.svg";
import Button from "@/components/button";
import SearchInput from "@/components/search-input";
import AttendanceDrawer from "@/components/ui/attendance-drawer";
import Pagination from "@/components/ui/pagination";
import { ListSkeleton } from "@/components/ui/skeleton";
import {
  getSessionAttendance,
  saveAttendance,
  saveSessionAttendance,
  type AttendanceStatus,
  type SessionAttendanceRow,
} from "@/db/classes/attendance";
import { getClassSessionsPage, type ClassSessionRow } from "@/db/classes/sessions";
import { usePagedList } from "@/hooks/use-paged-list";
import { getDisplayStatus, type DisplaySessionStatus } from "@/lib/utils/session-status";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const PAGE_SIZE = 10;

type StatusStyle = {
  Icon: typeof Present;
  bg: string;
  /** small label next to the title (only for statuses that need attention) */
  badge?: { label: string; bg: string; text: string };
};

// scheduled -> gray, completed -> green, missed -> red, cancelled -> gray + label
const STATUS_STYLE: Record<DisplaySessionStatus, StatusStyle> = {
  scheduled: { Icon: Not_Tagged, bg: "bg-gray-500/30" },
  completed: { Icon: Present, bg: "bg-green-500/30" },
  missed: {
    Icon: Absent,
    bg: "bg-red-500/30",
    badge: { label: "Missed", bg: "bg-red-500/15", text: "text-red-600" },
  },
  cancelled: {
    Icon: Not_Tagged,
    bg: "bg-gray-500/30",
    badge: { label: "Cancelled", bg: "bg-gray-500/15", text: "text-muted" },
  },
};

// Aug 7, 2026
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// 10:00 AM–10:30 AM
const formatTimeRange = (startIso: string, endIso: string) => {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${fmt(startIso)}–${fmt(endIso)}`;
};

const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong. Please try again.";

export default function Attendance() {
  // Newest session first. Only the current page is loaded; search and paging happen in SQLite.
  const {
    rows: sessions,
    total,
    page,
    setPage,
    totalPages,
    startIndex,
    endIndex,
    search,
    setSearch,
    loading,
    reload,
  } = usePagedList(getClassSessionsPage, PAGE_SIZE);

  // "now" decides which scheduled sessions are missed; refreshed every minute
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  // attendance drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<ClassSessionRow | null>(null);
  const [attendance, setAttendance] = useState<SessionAttendanceRow[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);

  // Reload the current page every time the screen is shown again. The first focus is
  // skipped because the list already loads itself when the screen mounts.
  const hasBeenFocused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());

      if (hasBeenFocused.current) {
        reload();
      } else {
        hasBeenFocused.current = true;
      }
    }, [reload])
  );

  // load the roster whenever a session is opened
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

  function openSession(session: ClassSessionRow) {
    setSelected(session);
    setDrawerError(null);
    setDrawerOpen(true);
  }

  // Saved right away. The row updates immediately and rolls back if saving fails.
  async function handleAttendanceChange(studentId: string, status: AttendanceStatus) {
    if (!selected) return;

    const previous = attendance.find((r) => r.student_id === studentId)?.status ?? null;
    setDrawerError(null);
    setAttendance((rows) =>
      rows.map((r) => (r.student_id === studentId ? { ...r, status } : r))
    );

    try {
      await saveAttendance({ session_id: selected.id, student_id: studentId, status });
    } catch (e) {
      setAttendance((rows) =>
        rows.map((r) => (r.student_id === studentId ? { ...r, status: previous } : r))
      );
      setDrawerError(errorMessage(e));
    }
  }

  // Only students without attendance yet; existing marks are left alone.
  async function handleMarkAllPresent() {
    if (!selected) return;

    const unmarkedIds = attendance.filter((r) => !r.status).map((r) => r.student_id);
    if (unmarkedIds.length === 0) return;

    const ids = new Set(unmarkedIds);
    setDrawerError(null);
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
      setDrawerError(errorMessage(e));
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
        <View className="flex flex-row gap-[10px] max-w-full">
          <SearchInput value={search} onChangeText={setSearch} className="flex-1" />
          <Button LeftIcon={Filter} />
        </View>

        <View className="flex flex-row items-center justify-between h-fit w-full">
          <Text className="font-inter-semibold text-[12px]">Class Sessions</Text>
          <Text className="font-inter-semibold text-[12px]">Actions</Text>
        </View>

        <View className="flex gap-[10px]">
          {loading ? (
            <ListSkeleton leading label="Loading class sessions" />
          ) : sessions.length === 0 ? (
            <Text className="font-inter text-[12px] text-muted text-center py-6">
              No sessions found
            </Text>
          ) : (
            sessions.map((session) => {
              const { Icon, bg, badge } = STATUS_STYLE[getDisplayStatus(session, now)];

              return (
                <Pressable
                  key={session.id}
                  onPress={() => openSession(session)}
                  className="px-[16px] py-[13px] flex flex-row justify-between items-center rounded-[12px] border border-border bg-card"
                >
                  <View className="flex flex-1 flex-row items-center gap-[10px]">
                    <View className={`p-[4px] rounded-full ${bg}`}>
                      <Icon height={26} width={26} />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-[6px]">
                        <Text
                          numberOfLines={1}
                          className="shrink font-inter-bold text-[12px] text-foreground"
                        >
                          {session.title || session.class_name}
                        </Text>
                        {badge ? (
                          <View className={`rounded-full px-[7px] py-[1px] ${badge.bg}`}>
                            <Text className={`font-inter-semibold text-[9px] ${badge.text}`}>
                              {badge.label}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text className="font-inter text-[10px] font-normal text-muted">
                        {formatDate(session.starts_at)} •{" "}
                        {formatTimeRange(session.starts_at, session.ends_at)}
                      </Text>
                    </View>
                  </View>

                  <Arrow
                    height={8}
                    width={8}
                    style={{
                      color: "#808080",
                      transform: [{ rotate: '180deg' }]
                    }}
                  />
                </Pressable>
              );
            })
          )}
        </View>

        {totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={total}
            startIndex={startIndex}
            endIndex={endIndex}
            itemLabel="sessions"
            setPage={setPage}
          />
        )}
      </ScrollView >

      <AttendanceDrawer
        open={drawerOpen}
        session={selected}
        attendance={attendance}
        attendanceLoading={attendanceLoading}
        onAttendanceChange={handleAttendanceChange}
        onMarkAllPresent={handleMarkAllPresent}
        onClose={() => setDrawerOpen(false)}
        error={drawerError}
      />
    </>
  );
}