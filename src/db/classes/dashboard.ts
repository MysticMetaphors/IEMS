import { getDatabase } from './../index';
import type { SessionStatus } from './sessions';

type Db = Awaited<ReturnType<typeof getDatabase>>;

/* -------------------------------------------------------------------------- */
/*  KPI: completed classes this month vs last month                           */
/* -------------------------------------------------------------------------- */

async function countCompleted(db: Db, from: Date, to: Date) {
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM class_sessions s
     INNER JOIN classes c ON c.id = s.class_id AND c.deleted_at IS NULL
     WHERE s.deleted_at IS NULL
       AND s.status = 'completed'
       AND s.starts_at >= ?
       AND s.starts_at < ?`,
    from.toISOString(),
    to.toISOString()
  );
  return row?.count ?? 0;
}

/** Only "completed" sessions are counted. Months are calendar months (local time). */
export async function getCompletedClassSummary(now: Date = new Date()) {
  const db = await getDatabase();

  const lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [lastMonth, thisMonth] = await Promise.all([
    countCompleted(db, lastStart, thisStart),
    countCompleted(db, thisStart, nextStart),
  ]);

  return { thisMonth, lastMonth };
}

/* -------------------------------------------------------------------------- */
/*  Class issues                                                              */
/* -------------------------------------------------------------------------- */

export type IssueType =
  | 'missed' // still "scheduled", class time passed, no student marked
  | 'status_not_set' // still "scheduled", class time passed, attendance is complete
  | 'attendance_incomplete' // still "scheduled", class time passed, attendance partly marked
  | 'attendance_missing'; // status was set (completed) but some students were left unmarked

export type SessionIssue = {
  type: IssueType;
  severity: 'error' | 'warning';
  title: string;
  description: string;
};

export type SessionIssueRow = {
  id: string;
  class_id: string;
  class_name: string;
  class_custom_id: string | null;
  color: string | null;
  title: string | null;
  starts_at: string;
  ends_at: string;
  status: SessionStatus;
  total_students: number;
  marked_students: number;
  issues: SessionIssue[];
  /** "error" when any issue is an error (missed), otherwise "warning" */
  severity: 'error' | 'warning';
};

type RawIssueRow = Omit<SessionIssueRow, 'issues' | 'severity'>;

/**
 * Works out what the teacher forgot for a session whose time has already passed.
 * `total` = students enrolled in the class, `marked` = students with attendance.
 */
export function detectIssues(row: {
  status: SessionStatus;
  total_students: number;
  marked_students: number;
}): SessionIssue[] {
  const total = row.total_students;
  const marked = Math.min(row.marked_students, total);
  const unmarked = total - marked;

  if (row.status === 'scheduled') {
    // class time passed but the teacher never set the status
    if (total > 0 && marked === 0) {
      return [
        {
          type: 'missed',
          severity: 'error',
          title: 'Class missed',
          description: 'The class is still marked as scheduled and no student was marked.',
        },
      ];
    }

    if (unmarked === 0) {
      return [
        {
          type: 'status_not_set',
          severity: 'warning',
          title: 'Class status not updated',
          description:
            total === 0
              ? 'The class time has passed but it is still marked as scheduled.'
              : 'Student attendance is complete, but the class is still marked as scheduled. Mark it as completed.',
        },
      ];
    }

    return [
      {
        type: 'attendance_incomplete',
        severity: 'warning',
        title: 'Attendance incomplete',
        description: `${unmarked} of ${total} students were not marked, and the class is still marked as scheduled.`,
      },
    ];
  }

  if (row.status === 'completed' && unmarked > 0) {
    return [
      {
        type: 'attendance_missing',
        severity: 'warning',
        title: 'Attendance not marked',
        description:
          marked === 0
            ? 'The class is completed but no student attendance was recorded.'
            : `${unmarked} of ${total} students were not marked.`,
      },
    ];
  }

  return [];
}

/**
 * Sessions that already ended (within the last `lookbackDays` days) and have
 * something the teacher forgot. Cancelled sessions never raise issues.
 * Newest first.
 */
export async function getSessionIssues(
  options: { lookbackDays?: number; now?: Date } = {}
): Promise<SessionIssueRow[]> {
  const db = await getDatabase();
  const now = options.now ?? new Date();
  const since = new Date(now);
  since.setDate(since.getDate() - (options.lookbackDays ?? 30));

  // students = actively enrolled; marked = those of them with attendance for the session
  const rows = await db.getAllAsync<RawIssueRow>(
    `SELECT
       s.id, s.class_id, c.name AS class_name, c.custom_id AS class_custom_id,
       s.color, s.title,
       s.starts_at, s.ends_at, s.status,
       (SELECT COUNT(*)
          FROM class_enrollments e
          INNER JOIN students st ON st.id = e.student_id AND st.deleted_at IS NULL
         WHERE e.class_id = s.class_id
           AND e.status = 'active'
           AND e.deleted_at IS NULL) AS total_students,
       (SELECT COUNT(*)
          FROM attendance a
          INNER JOIN class_enrollments e
                  ON e.student_id = a.student_id
                 AND e.class_id = s.class_id
                 AND e.status = 'active'
                 AND e.deleted_at IS NULL
          INNER JOIN students st ON st.id = a.student_id AND st.deleted_at IS NULL
         WHERE a.session_id = s.id
           AND a.deleted_at IS NULL) AS marked_students
     FROM class_sessions s
     INNER JOIN classes c ON c.id = s.class_id AND c.deleted_at IS NULL
     WHERE s.deleted_at IS NULL
       AND s.status IN ('scheduled', 'completed')
       AND s.ends_at < ?
       AND s.ends_at >= ?
     ORDER BY s.starts_at DESC`,
    now.toISOString(),
    since.toISOString()
  );

  const result: SessionIssueRow[] = [];
  for (const row of rows) {
    const issues = detectIssues(row);
    if (issues.length === 0) continue;

    result.push({
      ...row,
      issues,
      severity: issues.some((i) => i.severity === 'error') ? 'error' : 'warning',
    });
  }

  return result;
}