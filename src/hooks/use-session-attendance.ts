import {
  getSessionAttendance,
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
import { errorMessage } from "@/lib/utils/error-message";
import { useEffect, useState } from "react";

type Options = {
  setError: (message: string | null) => void;
  onSaved?: () => void;
  onStatusApplied?: (id: string, status: SessionStatus) => void;
};

export function useSessionAttendance({ setError, onSaved, onStatusApplied }: Options) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<ClassSessionRow | null>(null);
  const [attendance, setAttendance] = useState<SessionAttendanceRow[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

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
    setError(null);
    setDrawerOpen(true);
  }

  async function handleAttendanceChange(studentId: string, status: AttendanceStatus) {
    if (!selected) return;

    const previous = attendance.find((r) => r.student_id === studentId)?.status ?? null;
    const setStatus = (s: AttendanceStatus | null) =>
      setAttendance((rows) =>
        rows.map((r) => (r.student_id === studentId ? { ...r, status: s } : r))
      );

    setError(null);
    setStatus(status);

    try {
      await saveAttendance({ session_id: selected.id, student_id: studentId, status });
      onSaved?.();
    } catch (e) {
      setStatus(previous);
      setError(errorMessage(e));
    }
  }

  async function handleMarkAllPresent() {
    if (!selected) return;

    const unmarkedIds = attendance.filter((r) => !r.status).map((r) => r.student_id);
    if (unmarkedIds.length === 0) return;

    const ids = new Set(unmarkedIds);
    const setStatus = (s: AttendanceStatus | null) =>
      setAttendance((rows) =>
        rows.map((r) => (ids.has(r.student_id) ? { ...r, status: s } : r))
      );

    setError(null);
    setStatus("present");

    try {
      await saveSessionAttendance(
        selected.id,
        unmarkedIds.map((student_id) => ({ student_id, status: "present" as const }))
      );
      onSaved?.();
    } catch (e) {
      setStatus(null);
      setError(errorMessage(e));
    }
  }

  async function handleStatusChange(status: SessionStatus) {
    if (!selected) return;
    const { id } = selected;
    const previous = selected.status;

    const apply = (s: SessionStatus) => {
      setSelected((prev) => (prev ? { ...prev, status: s } : prev));
      onStatusApplied?.(id, s);
    };

    setError(null);
    apply(status);

    try {
      await updateClassSessionStatus(id, status);
      onSaved?.();
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