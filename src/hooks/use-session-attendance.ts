import {
  saveAttendance,
  saveSessionAttendance,
  type AttendanceStatus,
  type SessionAttendanceRow,
} from "@/db/classes/attendance";
import {
  updateClassSessionStatus,
  type ClassSessionRow,
  type SessionStatus,
} from "@/db/classes/sessions";
import type { Page } from "@/db/pagination";
import { errorMessage } from "@/lib/utils/error-message";
import {
  invalidateAfterAttendanceChange,
  invalidateAfterSessionStatusChange,
} from "@/lib/query/invalidate";
import { queryKeys } from "@/lib/query/keys";
import { sessionAttendanceQuery } from "@/lib/query/queries";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useState } from "react";

type Options = {
  setError: (message: string | null) => void;
};

const NO_ATTENDANCE: SessionAttendanceRow[] = [];

// Session queries hold either a plain list (a day / week) or a page of rows.
type SessionsCache = ClassSessionRow[] | Page<ClassSessionRow>;

/** Shows a new status in every cached session list right away. */
function patchSessionStatus(client: QueryClient, id: string, status: SessionStatus) {
  const patch = (rows: ClassSessionRow[]) =>
    rows.map((row) => (row.id === id ? { ...row, status } : row));

  client.setQueriesData<SessionsCache>({ queryKey: queryKeys.sessions.all }, (cached) => {
    if (!cached) return cached;
    return Array.isArray(cached) ? patch(cached) : { ...cached, rows: patch(cached.rows) };
  });
}

export function useSessionAttendance({ setError }: Options) {
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<ClassSessionRow | null>(null);

  const enabled = drawerOpen && selected !== null;
  const attendanceQuery = useQuery({
    ...sessionAttendanceQuery(selected?.id ?? ""),
    enabled,
  });

  // Rows are cached per session, so reopening a session shows them instantly.
  const attendance = enabled ? (attendanceQuery.data ?? NO_ATTENDANCE) : NO_ATTENDANCE;
  const attendanceLoading = enabled && attendanceQuery.isPending;

  function openSession(session: ClassSessionRow) {
    setSelected(session);
    setError(null);
    setDrawerOpen(true);
  }

  /** Changes the status of some students in the cached attendance list. */
  function patchAttendance(
    sessionId: string,
    studentIds: Set<string>,
    status: AttendanceStatus | null
  ) {
    queryClient.setQueryData<SessionAttendanceRow[]>(
      queryKeys.attendance.bySession(sessionId),
      (rows) =>
        rows?.map((row) => (studentIds.has(row.student_id) ? { ...row, status } : row))
    );
  }

  async function handleAttendanceChange(studentId: string, status: AttendanceStatus) {
    if (!selected) return;

    const sessionId = selected.id;
    const key = queryKeys.attendance.bySession(sessionId);

    // A refetch finishing after the change below would overwrite it.
    await queryClient.cancelQueries({ queryKey: key });

    const previous =
      queryClient
        .getQueryData<SessionAttendanceRow[]>(key)
        ?.find((r) => r.student_id === studentId)?.status ?? null;
    const ids = new Set([studentId]);

    setError(null);
    patchAttendance(sessionId, ids, status);

    try {
      await saveAttendance({ session_id: sessionId, student_id: studentId, status });
      void invalidateAfterAttendanceChange(queryClient);
    } catch (e) {
      patchAttendance(sessionId, ids, previous);
      setError(errorMessage(e));
    }
  }

  async function handleMarkAllPresent() {
    if (!selected) return;

    const sessionId = selected.id;
    const unmarkedIds = attendance.filter((r) => !r.status).map((r) => r.student_id);
    if (unmarkedIds.length === 0) return;

    const ids = new Set(unmarkedIds);

    await queryClient.cancelQueries({ queryKey: queryKeys.attendance.bySession(sessionId) });

    setError(null);
    patchAttendance(sessionId, ids, "present");

    try {
      await saveSessionAttendance(
        sessionId,
        unmarkedIds.map((student_id) => ({ student_id, status: "present" as const }))
      );
      void invalidateAfterAttendanceChange(queryClient);
    } catch (e) {
      patchAttendance(sessionId, ids, null);
      setError(errorMessage(e));
    }
  }

  async function handleStatusChange(status: SessionStatus) {
    if (!selected) return;
    const { id } = selected;
    const previous = selected.status;

    const apply = (s: SessionStatus) => {
      setSelected((prev) => (prev ? { ...prev, status: s } : prev));
      patchSessionStatus(queryClient, id, s);
    };

    // A refetch finishing after the change below would overwrite it.
    await queryClient.cancelQueries({ queryKey: queryKeys.sessions.all });

    setError(null);
    apply(status);

    try {
      await updateClassSessionStatus(id, status);
      void invalidateAfterSessionStatusChange(queryClient);
    } catch (e) {
      apply(previous);
      setError(errorMessage(e));
    }
  }

  return {
    drawerOpen,
    setDrawerOpen,
    selected,
    setSelected,
    attendance,
    attendanceLoading,
    openSession,
    handleAttendanceChange,
    handleMarkAllPresent,
    handleStatusChange,
  };
}
