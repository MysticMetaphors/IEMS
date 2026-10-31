import Arrow from "@/assets/icons/arrow.svg";
import Absent from "@/assets/icons/status/absent.svg";
import Not_Tagged from "@/assets/icons/status/not_tagged.svg";
import Present from "@/assets/icons/status/present.svg";
import Warning from "@/assets/icons/status/warning.svg";
import KPI from "@/components/dashboard/KPI";
import type { ClassItem } from "@/components/ui/class-drawer";
import SessionDrawer from "@/components/ui/class-session-drawer";
import { ListSkeleton } from "@/components/ui/skeleton";
import {
  getSessionAttendance,
  saveAttendance,
  saveSessionAttendance,
  type AttendanceStatus,
  type SessionAttendanceRow,
} from "@/db/classes/attendance";
import { getClasses } from "@/db/classes/classes";
import {
  getCompletedClassSummary,
  getSessionIssues,
  type SessionIssueRow,
} from "@/db/classes/dashboard";
import {
  getClassSessions,
  updateClassSessionStatus,
  type ClassSessionRow,
  type SessionStatus,
} from "@/db/classes/sessions";
import { Link, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

// TODO: replace with real counts when ready
const totalStudents = 0;
const totalClasses = 0;

const MAX_ISSUES = 10; // newest issues shown on the dashboard

// Static class names (dynamic `bg-${color}/30` strings are not picked up by Tailwind)
const TONE = {
  red: { Icon: Absent, bg: "bg-red-500/30", dot: "#DC2626" },
  orange: { Icon: Warning, bg: "bg-orange-500/30", dot: "#F97316" },
  green: { Icon: Present, bg: "bg-green-500/30", dot: "#16A34A" },
  gray: { Icon: Not_Tagged, bg: "bg-gray-500/30", dot: "#A9A9A9" },
};

// August 9, 2026
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

// 10:00 AM–10:30 AM
const formatTimeRange = (startIso: string, endIso: string) => {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${fmt(startIso)}–${fmt(endIso)}`;
};

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong. Please try again.";

const noop = () => { };

/** Row for today's classes. Issues (if any) decide the icon, otherwise the status does. */
function todayTone(session: ClassSessionRow, issue?: SessionIssueRow) {
  if (session.status === "cancelled") return TONE.red; // Absent icon: not answered
  if (issue) return issue.severity === "error" ? TONE.red : TONE.orange;
  if (session.status === "completed") return TONE.green;
  return TONE.gray; // upcoming
}

/** Row in "Class Issues": tap to expand and see what was forgotten. */
function IssueRow({
  row,
  expanded,
  onToggle,
  onOpen,
}: {
  row: SessionIssueRow;
  expanded: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const { Icon, bg } = row.severity === "error" ? TONE.red : TONE.orange;

  return (
    <Pressable
      onPress={onToggle}
      className={`gap-[12px] rounded-[12px] border border-border px-[16px] py-[13px] ${expanded ? "bg-white" : "bg-card"
        }`}
    >
      <View className="flex-row items-center justify-between gap-[10px]">
        <View className="flex flex-1 flex-row items-center gap-[10px]">
          <View className={`rounded-full p-[4px] ${bg}`}>
            <Icon height={26} width={26} />
          </View>
          <View className="flex-1">
            <Text numberOfLines={1} className="font-inter-bold text-[12px] text-foreground">
              {row.title || row.class_name}
            </Text>
            <Text className="font-inter text-[10px] font-normal text-muted">
              {formatDate(row.starts_at)} • {formatTimeRange(row.starts_at, row.ends_at)}
            </Text>
          </View>
        </View>

        <Arrow
          height={8}
          width={8}
          style={{
            color: expanded ? "#000000" : "#A9A9A9",
            transform: [{ rotate: expanded ? "270deg" : "90deg" }]
          }}
        />
      </View>

      {expanded ? (
        <>
          <View className="gap-[10px] rounded-[10px] border border-border bg-card px-[14px] py-[12px]">
            {row.issues.map((issue, index) => (
              <View
                key={issue.type}
                className={`gap-[3px] ${index > 0 ? "border-t border-border pt-[10px]" : ""}`}
              >
                <View className="flex-row items-center gap-[6px]">
                  <View
                    style={{
                      backgroundColor: issue.severity === "error" ? TONE.red.dot : TONE.orange.dot,
                    }}
                    className="h-[8px] w-[8px] rounded-full"
                  />
                  <Text className="font-inter-semibold text-[12px] text-foreground">
                    {issue.title}
                  </Text>
                </View>
                <Text className="font-inter text-[11px] text-muted">{issue.description}</Text>
              </View>
            ))}
          </View>

          {/* open the session to fix it (mark attendance / status) */}
          <Pressable
            onPress={onOpen}
            className="items-center rounded-[10px] border border-border bg-white py-[9px]"
          >
            <Text className="font-inter-semibold text-[12px] text-foreground">Open session</Text>
          </Pressable>
        </>
      ) : null}
    </Pressable>
  );
}

export default function Overview() {
  const [summary, setSummary] = useState({ thisMonth: 0, lastMonth: 0 });
  const [todaySessions, setTodaySessions] = useState<ClassSessionRow[]>([]);
  const [issues, setIssues] = useState<SessionIssueRow[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // True only until the first load finishes, so skeletons show instead of the
  // empty states ("No classes today", zero counts) that would be wrong at that point.
  // Later refreshes keep the current content on screen.
  const [loading, setLoading] = useState(true);

  // session drawer (view only: no edit / delete)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<ClassSessionRow | null>(null);
  const [attendance, setAttendance] = useState<SessionAttendanceRow[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const now = new Date();
    const dayStart = startOfDay(now);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const [completed, today, issueRows, classRows] = await Promise.all([
      getCompletedClassSummary(now),
      getClassSessions({ from: dayStart, to: dayEnd }),
      getSessionIssues({ now }),
      getClasses(),
    ]);

    setSummary(completed);
    setTodaySessions(today);
    setIssues(issueRows);
    setClasses(classRows);
  }, []);

  // refreshed every time the dashboard is shown
  useFocusEffect(
    useCallback(() => {
      // Also ends the skeletons if the first load fails, so they never spin forever.
      load()
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [load])
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

  function openSession(session: ClassSessionRow) {
    setSelected(session);
    setDrawerError(null);
    setDrawerOpen(true);
  }

  // Saved right away; the dashboard refreshes so issues disappear once fixed.
  async function handleAttendanceChange(studentId: string, status: AttendanceStatus) {
    if (!selected) return;

    const previous = attendance.find((r) => r.student_id === studentId)?.status ?? null;
    setDrawerError(null);
    setAttendance((rows) =>
      rows.map((r) => (r.student_id === studentId ? { ...r, status } : r))
    );

    try {
      await saveAttendance({ session_id: selected.id, student_id: studentId, status });
      load().catch(console.error);
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
      load().catch(console.error);
    } catch (e) {
      setAttendance((rows) =>
        rows.map((r) => (ids.has(r.student_id) ? { ...r, status: null } : r))
      );
      setDrawerError(errorMessage(e));
    }
  }

  // Session status (scheduled / completed / cancelled) saved right away.
  async function handleStatusChange(status: SessionStatus) {
    if (!selected) return;
    const { id } = selected;
    const previous = selected.status;

    // update the drawer and the list right away, roll back if saving fails
    const apply = (s: SessionStatus) => {
      setSelected((prev) => (prev ? { ...prev, status: s } : prev));
      setTodaySessions((rows) => rows.map((r) => (r.id === id ? { ...r, status: s } : r)));
    };

    setDrawerError(null);
    apply(status);
    try {
      await updateClassSessionStatus(id, status);
      load().catch(console.error);
    } catch (e) {
      apply(previous);
      setDrawerError(errorMessage(e));
    }
  }

  const issueBySession = useMemo(() => new Map(issues.map((i) => [i.id, i])), [issues]);
  const shownIssues = issues.slice(0, MAX_ISSUES);

  return (
    <>
      <ScrollView
        className="flex-1 bg-white"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-[18px] pb-[200px]"
      >
        <KPI
          loading={loading}
          completedThisMonth={summary.thisMonth}
          completedLastMonth={summary.lastMonth}
          totalClasses={totalClasses}
          totalStudents={totalStudents}
        />

        {/* Today's classes */}
        <View className="flex flex-row items-center justify-between h-fit w-full">
          <Text className="font-inter-semibold text-[12px]">Today's Classes {" "}
            {loading ? null : (
              <Text className="font-inter text-[12px] text-muted">({todaySessions.length})</Text>
            )}
          </Text>
          <Link href={'/(dashboard)/scheduling'} className="font-inter-semibold text-[12px] underline">View all</Link>
        </View>

        <View className="flex gap-[10px]">
          {loading ? (
            <ListSkeleton count={2} leading label="Loading today's classes" />
          ) : todaySessions.length === 0 ? (
            <Text className="font-inter text-[12px] text-muted text-center py-6">
              No classes today
            </Text>
          ) : (
            todaySessions.map((session) => {
              const { Icon, bg } = todayTone(session, issueBySession.get(session.id));

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
                      <Text numberOfLines={1} className="font-inter-bold text-[12px] text-foreground">
                        {session.title || session.class_name}
                      </Text>
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
                      color: "#A9A9A9",
                      transform: [{ rotate: "180deg" }]
                    }}
                  />
                </Pressable>
              );
            })
          )}
        </View>

        {/* Class issues */}
        <View className="flex flex-row items-center justify-between h-fit w-full">
          <Text className="font-inter-semibold text-[12px]">
            Class Issues{" "}
            {loading ? null : (
              <Text className="font-inter text-[12px] text-muted">({issues.length})</Text>
            )}
          </Text>
        </View>

        <View className="flex gap-[10px]">
          {loading ? (
            <ListSkeleton count={3} leading label="Loading class issues" />
          ) : shownIssues.length === 0 ? (
            <Text className="font-inter text-[12px] text-muted text-center py-6">
              No issues. Everything is up to date.
            </Text>
          ) : (
            shownIssues.map((row) => (
              <IssueRow
                key={row.id}
                row={row}
                expanded={expandedId === row.id}
                onToggle={() => setExpandedId((prev) => (prev === row.id ? null : row.id))}
                onOpen={() => openSession(row)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Same drawer as the Scheduling page, but view only (no edit / delete) */}
      <SessionDrawer
        open={drawerOpen}
        mode="view"
        initial={selected}
        classes={classes}
        showActions={false}
        attendance={attendance}
        attendanceLoading={attendanceLoading}
        onAttendanceChange={handleAttendanceChange}
        onMarkAllPresent={handleMarkAllPresent}
        onStatusChange={handleStatusChange}
        onClose={() => setDrawerOpen(false)}
        onCreate={noop}
        onUpdate={noop}
        onEdit={noop}
        onDelete={noop}
        isSaving={false}
        saveError={drawerError}
      />
    </>
  );
}