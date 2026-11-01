import type { SessionAttendanceRow } from "@/db/classes/attendance";
import { useMemo } from "react";

export function useMarkedCount(attendance: SessionAttendanceRow[]) {
  const markedCount = useMemo(() => attendance.filter((r) => r.status).length, [attendance]);
  return { markedCount, hasUnmarked: markedCount < attendance.length };
}