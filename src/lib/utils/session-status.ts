import type { ClassSessionRow, SessionStatus } from "@/db/classes/sessions";

/**
 * "missed" is NOT stored in the database (the table only allows scheduled /
 * completed / cancelled). It is worked out when displaying: a session whose
 * end time has already passed while its status is still "scheduled".
 */
export type DisplaySessionStatus = SessionStatus | "missed";

export function isMissed(
  session: Pick<ClassSessionRow, "status" | "ends_at">,
  now: number = Date.now()
) {
  return session.status === "scheduled" && Date.parse(session.ends_at) < now;
}

export function getDisplayStatus(
  session: Pick<ClassSessionRow, "status" | "ends_at">,
  now: number = Date.now()
): DisplaySessionStatus {
  return isMissed(session, now) ? "missed" : session.status;
}