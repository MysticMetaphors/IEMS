import { createId } from './../ids';
import { getDatabase } from './../index';

export type EnrollmentStatus = 'active' | 'completed' | 'withdrawn';

export type EnrollmentInput = {
  studentId: string;
  classId: string;
  enrolledAt?: string; // ISO string, defaults to now
};

// Enroll a student in a class.
// UNIQUE (student_id, class_id) also covers soft-deleted rows, so if the
// student was enrolled before we revive that row instead of inserting a new one.
export async function enrollStudent(input: EnrollmentInput) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const enrolledAt = input.enrolledAt ?? now;

  const existing = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM class_enrollments
     WHERE student_id = ? AND class_id = ?`,
    input.studentId,
    input.classId
  );

  if (existing) {
    await db.runAsync(
      `UPDATE class_enrollments
       SET status = 'active',
           enrolled_at = ?,
           deleted_at = NULL,
           updated_at = ?,
           sync_status = 'pending'
       WHERE id = ?`,
      enrolledAt,
      now,
      existing.id
    );

    return existing.id;
  }

  const id = createId();

  await db.runAsync(
    `INSERT INTO class_enrollments (
      id, student_id, class_id, enrolled_at, status,
      created_at, updated_at, sync_status
    ) VALUES (?, ?, ?, ?, 'active', ?, ?, 'pending')`,
    id,
    input.studentId,
    input.classId,
    enrolledAt,
    now,
    now
  );

  return id;
}

// Students enrolled in a class.
export async function getEnrollmentsByClass(classId: string) {
  const db = await getDatabase();

  return db.getAllAsync<{
    id: string;
    student_id: string;
    name: string;
    email: string | null;
    phone: string | null;
    status: EnrollmentStatus;
    enrolled_at: string;
  }>(
    `SELECT
       e.id, e.student_id, s.name, s.email, s.phone,
       e.status, e.enrolled_at
     FROM class_enrollments e
     JOIN students s ON s.id = e.student_id
     WHERE e.class_id = ?
       AND e.deleted_at IS NULL
       AND s.deleted_at IS NULL
     ORDER BY s.name COLLATE NOCASE ASC`,
    classId
  );
}

// Classes a student is enrolled in.
export async function getEnrollmentsByStudent(studentId: string) {
  const db = await getDatabase();

  return db.getAllAsync<{
    id: string;
    class_id: string;
    name: string;
    subject: string | null;
    status: EnrollmentStatus;
    enrolled_at: string;
  }>(
    `SELECT
       e.id, e.class_id, c.name, c.subject,
       e.status, e.enrolled_at
     FROM class_enrollments e
     JOIN classes c ON c.id = e.class_id
     WHERE e.student_id = ?
       AND e.deleted_at IS NULL
       AND c.deleted_at IS NULL
     ORDER BY c.name COLLATE NOCASE ASC`,
    studentId
  );
}

export async function updateEnrollmentStatus(id: string, status: EnrollmentStatus) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE class_enrollments
     SET status = ?,
         updated_at = ?,
         sync_status = 'pending'
     WHERE id = ? AND deleted_at IS NULL`,
    status,
    now,
    id
  );
}

// Make a class's active roster match `studentIds` exactly.
// Newly checked students are enrolled (or revived); unchecked ones are removed.
export async function syncClassEnrollments(classId: string, studentIds: string[]) {
  const db = await getDatabase();

  const current = await db.getAllAsync<{ id: string; student_id: string }>(
    `SELECT id, student_id FROM class_enrollments
     WHERE class_id = ? AND status = 'active' AND deleted_at IS NULL`,
    classId
  );

  const selected = new Set(studentIds);
  const currentIds = new Set(current.map((e) => e.student_id));

  const toAdd = studentIds.filter((id) => !currentIds.has(id));
  const toRemove = current.filter((e) => !selected.has(e.student_id));

  if (toAdd.length === 0 && toRemove.length === 0) return;

  await db.withTransactionAsync(async () => {
    for (const studentId of toAdd) {
      await enrollStudent({ studentId, classId });
    }
    for (const enrollment of toRemove) {
      await removeEnrollment(enrollment.id);
    }
  });
}

// Make a student's active classes match `classIds` exactly.
// Newly checked classes are enrolled (or revived); unchecked ones are removed.
export async function syncStudentEnrollments(studentId: string, classIds: string[]) {
  const db = await getDatabase();

  const current = await db.getAllAsync<{ id: string; class_id: string }>(
    `SELECT id, class_id FROM class_enrollments
     WHERE student_id = ? AND status = 'active' AND deleted_at IS NULL`,
    studentId
  );

  const selected = new Set(classIds);
  const currentIds = new Set(current.map((e) => e.class_id));

  const toAdd = classIds.filter((id) => !currentIds.has(id));
  const toRemove = current.filter((e) => !selected.has(e.class_id));

  if (toAdd.length === 0 && toRemove.length === 0) return;

  await db.withTransactionAsync(async () => {
    for (const classId of toAdd) {
      await enrollStudent({ studentId, classId });
    }
    for (const enrollment of toRemove) {
      await removeEnrollment(enrollment.id);
    }
  });
}

// Soft delete: removes the student from the class but keeps the row for syncing.
export async function removeEnrollment(id: string) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE class_enrollments
     SET deleted_at = ?,
         updated_at = ?,
         sync_status = 'pending'
     WHERE id = ? AND deleted_at IS NULL`,
    now,
    now,
    id
  );
}