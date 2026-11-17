/**
 * Every query key in the app, in one place.
 *
 * Keys go from general to specific, so invalidating `classes.all` also
 * refreshes every class list, page and detail below it.
 */
export const queryKeys = {
  classes: {
    all: ["classes"] as const,
    list: () => ["classes", "list"] as const,
    /** Prefix for every paged class list (the page, search and size are appended). */
    pages: () => ["classes", "page"] as const,
  },
  students: {
    all: ["students"] as const,
    list: () => ["students", "list"] as const,
    pages: () => ["students", "page"] as const,
  },
  enrollments: {
    all: ["enrollments"] as const,
    byClass: (classId: string) => ["enrollments", "class", classId] as const,
    byStudent: (studentId: string) => ["enrollments", "student", studentId] as const,
  },
  sessions: {
    all: ["sessions"] as const,
    /** Sessions overlapping [from, to) — ISO strings so the key is stable. */
    range: (from: string, to: string) => ["sessions", "range", { from, to }] as const,
    pages: () => ["sessions", "page"] as const,
  },
  attendance: {
    all: ["attendance"] as const,
    bySession: (sessionId: string) => ["attendance", "session", sessionId] as const,
  },
  dashboard: {
    all: ["dashboard"] as const,
    summary: () => ["dashboard", "summary"] as const,
    issues: () => ["dashboard", "issues"] as const,
  },
};
