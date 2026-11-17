import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";

/**
 * What to refresh after each kind of write.
 *
 * Only queries that are on screen refetch right away; the rest are marked
 * stale and refetch the next time they are used. Every helper returns a
 * promise so a save can wait until the visible lists are up to date.
 */

const invalidate = (client: QueryClient, ...keys: readonly (readonly unknown[])[]) =>
  Promise.all(keys.map((queryKey) => client.invalidateQueries({ queryKey }))).then(
    () => undefined
  );

/** A class was created, edited or deleted (this includes its roster). */
export const invalidateAfterClassChange = (client: QueryClient) =>
  invalidate(
    client,
    queryKeys.classes.all,
    queryKeys.enrollments.all,
    queryKeys.sessions.all, // sessions show the class name and vanish with the class
    queryKeys.attendance.all,
    queryKeys.dashboard.all
  );

/** A student was created, edited or deleted (this includes their classes). */
export const invalidateAfterStudentChange = (client: QueryClient) =>
  invalidate(
    client,
    queryKeys.students.all,
    queryKeys.enrollments.all,
    queryKeys.classes.all, // class lists show how many students are enrolled
    queryKeys.attendance.all,
    queryKeys.dashboard.all
  );

/** A class session was created, edited, deleted or had its status changed. */
export const invalidateAfterSessionChange = (client: QueryClient) =>
  invalidate(
    client,
    queryKeys.sessions.all,
    queryKeys.attendance.all,
    queryKeys.dashboard.all
  );

/** Only a session's status changed (its attendance rows are untouched). */
export const invalidateAfterSessionStatusChange = (client: QueryClient) =>
  invalidate(client, queryKeys.sessions.all, queryKeys.dashboard.all);

/**
 * Attendance was marked. The open attendance list is already updated on
 * screen, so only what is derived from it (class issues) is refreshed.
 */
export const invalidateAfterAttendanceChange = (client: QueryClient) =>
  invalidate(client, queryKeys.dashboard.all);
