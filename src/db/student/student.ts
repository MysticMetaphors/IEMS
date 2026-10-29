import { createId, createSequentialId } from './../ids';
import { getDatabase } from './../index';
import {
  containsPattern,
  LIKE_ESCAPE,
  pageBounds,
  type Page,
  type PageRequest,
} from './../pagination';

export type StudentRow = {
  id: string;
  custom_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

const STUDENT_COLUMNS = 'id, custom_id, name, email, phone, notes';

export type StudentInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
};

export async function createStudent(input: StudentInput) {
  const db = await getDatabase();
  const id = createId();
  const now = new Date().toISOString();
  const customId = await createSequentialId("students");

  await db.runAsync(
    `INSERT INTO students (
      id, custom_id, name, email, phone, notes,
      created_at, updated_at, sync_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    id,
    customId,
    input.name.trim(),
    input.email?.trim() || null,
    input.phone?.trim() || null,
    input.notes?.trim() || null,
    now,
    now
  );

  return id;
}

export async function getStudents(search?: string) {
  const db = await getDatabase();

  const query = `
    SELECT id, custom_id, name, email, phone, notes
    FROM students
    WHERE deleted_at IS NULL
      AND (
        ? IS NULL
        OR id LIKE '%' || ? || '%'
        OR name LIKE '%' || ? || '%'
        OR custom_id LIKE '%' || ? || '%'
      )
    ORDER BY name COLLATE NOCASE ASC
  `;

  const searchTerm = search?.trim() || null;

  return db.getAllAsync<StudentRow>(query, [
    searchTerm,
    searchTerm,
    searchTerm,
    searchTerm,
  ]);
}

/**
 * One page of students (name A-Z) plus the total that match `search`
 * (name or email contains it), so the list never has to load everyone.
 */
export async function getStudentsPage(
  request: PageRequest
): Promise<Page<StudentRow>> {
  const db = await getDatabase();
  const { limit, offset } = pageBounds(request);

  const where = ['deleted_at IS NULL'];
  const params: (string | number)[] = [];

  const pattern = containsPattern(request.search);
  if (pattern) {
    where.push(`(name LIKE ? ${LIKE_ESCAPE} OR email LIKE ? ${LIKE_ESCAPE})`);
    params.push(pattern, pattern);
  }

  const whereSql = where.join(' AND ');

  const [rows, countRow] = await Promise.all([
    db.getAllAsync<StudentRow>(
      `SELECT ${STUDENT_COLUMNS}
       FROM students
       WHERE ${whereSql}
       ORDER BY name COLLATE NOCASE ASC, id ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    ),
    db.getFirstAsync<{ total: number }>(
      `SELECT COUNT(*) AS total FROM students WHERE ${whereSql}`,
      params
    ),
  ]);

  return { rows, total: countRow?.total ?? 0 };
}

export async function getStudentById(id: string) {
  const db = await getDatabase();

  return db.getFirstAsync<StudentRow>(
    `SELECT ${STUDENT_COLUMNS}
     FROM students
     WHERE id = ? AND deleted_at IS NULL`,
    id
  );
}

export async function updateStudent(input: StudentInput & { id: string }) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE students
     SET name = ?,
         email = ?,
         phone = ?,
         notes = ?,
         updated_at = ?,
         sync_status = 'pending'
     WHERE id = ? AND deleted_at IS NULL`,
    input.name.trim(),
    input.email?.trim() || null,
    input.phone?.trim() || null,
    input.notes?.trim() || null,
    now,
    input.id
  );
}

// Soft delete: the row stays so the deletion can be synced later.
export async function deleteStudent(id: string) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE students
     SET deleted_at = ?,
         updated_at = ?,
         sync_status = 'pending'
     WHERE id = ? AND deleted_at IS NULL`,
    now,
    now,
    id
  );
}