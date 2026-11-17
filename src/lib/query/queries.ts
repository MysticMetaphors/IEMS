import { getSessionAttendance } from "@/db/classes/attendance";
import { getClasses } from "@/db/classes/classes";
import { getCompletedClassSummary, getSessionIssues } from "@/db/classes/dashboard";
import { getEnrollmentsByClass, getEnrollmentsByStudent } from "@/db/classes/enrollment";
import { getClassSessions } from "@/db/classes/sessions";
import { getStudents } from "@/db/student/student";
import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "./keys";

/**
 * Query definitions shared by `useQuery` (screens that render the data) and
 * `queryClient.fetchQuery` (code that needs the data once, such as opening a
 * drawer). Both read and fill the same cache.
 *
 * Always wrap the database function in an arrow: React Query passes a context
 * object to `queryFn`, which would land in an optional parameter like
 * `getStudents(search?)`.
 */

export const classesQuery = () =>
  queryOptions({
    queryKey: queryKeys.classes.list(),
    queryFn: () => getClasses(),
  });

export const studentsQuery = () =>
  queryOptions({
    queryKey: queryKeys.students.list(),
    queryFn: () => getStudents(),
  });

export const classEnrollmentsQuery = (classId: string) =>
  queryOptions({
    queryKey: queryKeys.enrollments.byClass(classId),
    queryFn: () => getEnrollmentsByClass(classId),
  });

export const studentEnrollmentsQuery = (studentId: string) =>
  queryOptions({
    queryKey: queryKeys.enrollments.byStudent(studentId),
    queryFn: () => getEnrollmentsByStudent(studentId),
  });

export const sessionsRangeQuery = (range: { from: Date; to: Date }) => {
  const from = range.from.toISOString();
  const to = range.to.toISOString();

  return queryOptions({
    queryKey: queryKeys.sessions.range(from, to),
    queryFn: () => getClassSessions({ from, to }),
  });
};

export const sessionAttendanceQuery = (sessionId: string) =>
  queryOptions({
    queryKey: queryKeys.attendance.bySession(sessionId),
    queryFn: () => getSessionAttendance(sessionId),
  });

// The dashboard results depend on the current time ("missed" once a class has
// ended), so they are always re-read when the screen is shown again.
export const completedSummaryQuery = () =>
  queryOptions({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: () => getCompletedClassSummary(new Date()),
    staleTime: 0,
  });

export const sessionIssuesQuery = () =>
  queryOptions({
    queryKey: queryKeys.dashboard.issues(),
    queryFn: () => getSessionIssues({ now: new Date() }),
    staleTime: 0,
  });
