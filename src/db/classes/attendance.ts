import { createId } from './../ids';
import { getDatabase } from './../index';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export type AttendanceInput = {
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  /** undefined = keep the existing note, null / "" = clear it */
  notes?: string | null;
};

type Db = Awaited<ReturnType<typeof getDatabase>>;

// One row per student enrolled in the session's class (status is null = not marked yet).
export type SessionAttendanceRow = {
  student_id: string;
  student_name: string;
  student_custom_id: string | null;
  attendance_id: string | null;
  status: AttendanceStatus | null;
  notes: string | null;
};

export type StudentAttendanceRow = {
  id: string;
  session_id: string;
  status: AttendanceStatus;
  notes: string | null;
  starts_at: string;
  ends_at: string;
  session_title: string | null;
  class_id: string;
  class_name: string;
};

/**
 * Insert-or-update by (session_id, student_id). The table is UNIQUE on that
 * pair, so a plain INSERT would fail after a soft delete; this revives the
 * old row instead (deleted_at = NULL) and keeps its id.
 */
async function upsertAttendance(db: Db, input: AttendanceInput, now: string) {
  const keepNotes = input.notes === undefined ? 1 : 0;

  await db.runAsync(
    `INSERT INTO attendance (
      id, session_id, student_id, status, notes,
      created_at, updated_at, sync_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    ON CONFLICT(session_id, student_id) DO UPDATE SET
      status = excluded.status,
      notes = CASE WHEN ? = 1 THEN notes ELSE excluded.notes END,
      deleted_at = NULL,
      updated_at = excluded.updated_at,
      sync_status = 'pending'`,
    createId(),
    input.session_id,
    input.student_id,
    input.status,
    input.notes?.trim() || null,
    now,
    now,
    keepNotes
  );
}

async function assertSessionExists(db: Db, sessionId: string) {
  const row = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM class_sessions WHERE id = ? AND deleted_at IS NULL`,
    sessionId
  );
  if (!row) throw new Error('Session not found.');
}

/** Mark one student for one session (creates or updates). Returns the attendance id. */
export async function saveAttendance(input: AttendanceInput) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await assertSessionExists(db, input.session_id);

  const student = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM students WHERE id = ? AND deleted_at IS NULL`,
    input.student_id
  );
  if (!student) throw new Error('Student not found.');

  await upsertAttendance(db, input, now);

  const row = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM attendance WHERE session_id = ? AND student_id = ?`,
    input.session_id,
    input.student_id
  );
  return row!.id;
}

/** Save many students at once (e.g. "Mark all present" or the whole roster), in one transaction. */
export async function saveSessionAttendance(
  sessionId: string,
  entries: { student_id: string; status: AttendanceStatus; notes?: string | null }[]
) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await assertSessionExists(db, sessionId);

  await db.withTransactionAsync(async () => {
    for (const entry of entries) {
      await upsertAttendance(db, { session_id: sessionId, ...entry }, now);
    }
  });
}

/** The roster of a session: enrolled students + their attendance (if marked). */
export async function getSessionAttendance(sessionId: string) {
  const db = await getDatabase();

  return db.getAllAsync<SessionAttendanceRow>(
    `SELECT
       st.id AS student_id,
       st.name AS student_name,
       st.custom_id AS student_custom_id,
       a.id AS attendance_id,
       a.status AS status,
       a.notes AS notes
     FROM class_sessions s
     INNER JOIN class_enrollments e
       ON e.class_id = s.class_id
      AND e.status = 'active'
      AND e.deleted_at IS NULL
     INNER JOIN students st
       ON st.id = e.student_id
      AND st.deleted_at IS NULL
     LEFT JOIN attendance a
       ON a.session_id = s.id
      AND a.student_id = st.id
      AND a.deleted_at IS NULL
     WHERE s.id = ? AND s.deleted_at IS NULL
     ORDER BY st.name COLLATE NOCASE ASC`,
    sessionId
  );
}

/** Attendance history of one student, newest first. Optional class / date-range filters. */
export async function getStudentAttendance(
  studentId: string,
  options: { classId?: string; from?: string | Date; to?: string | Date } = {}
) {
  const db = await getDatabase();

  const where: string[] = ['a.student_id = ?', 'a.deleted_at IS NULL'];
  const params: string[] = [studentId];

  if (options.classId) {
    where.push('s.class_id = ?');
    params.push(options.classId);
  }
  if (options.from) {
    where.push('s.starts_at >= ?');
    params.push(new Date(options.from).toISOString());
  }
  if (options.to) {
    where.push('s.starts_at < ?');
    params.push(new Date(options.to).toISOString());
  }

  return db.getAllAsync<StudentAttendanceRow>(
    `SELECT
       a.id, a.session_id, a.status, a.notes,
       s.starts_at, s.ends_at, s.title AS session_title,
       c.id AS class_id, c.name AS class_name
     FROM attendance a
     INNER JOIN class_sessions s ON s.id = a.session_id AND s.deleted_at IS NULL
     INNER JOIN classes c ON c.id = s.class_id
     WHERE ${where.join(' AND ')}
     ORDER BY s.starts_at DESC`,
    ...params
  );
}

/** Change the status / note of an existing attendance record. */
export async function updateAttendance(input: {
  id: string;
  status: AttendanceStatus;
  notes?: string | null;
}) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE attendance
     SET status = ?,
         notes = ?,
         updated_at = ?,
         sync_status = 'pending'
     WHERE id = ? AND deleted_at IS NULL`,
    input.status,
    input.notes?.trim() || null,
    now,
    input.id
  );
}

// Soft delete = back to "not marked yet".
export async function deleteAttendance(id: string) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE attendance
     SET deleted_at = ?,
         updated_at = ?,
         sync_status = 'pending'
     WHERE id = ? AND deleted_at IS NULL`,
    now,
    now,
    id
  );
}

/** Counts for a roster from getSessionAttendance (for a summary line / badges). */
export function summarizeAttendance(rows: SessionAttendanceRow[]) {
  const summary = { present: 0, absent: 0, late: 0, excused: 0, unmarked: 0, total: rows.length };
  for (const row of rows) {
    if (row.status) summary[row.status] += 1;
    else summary.unmarked += 1;
  }
  return summary;
}