import { createId, createSequentialId } from './../ids';
import { getDatabase } from './../index';

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

  return db.getAllAsync<{
    id: string;
    custom_id: string;
    name: string;
    email: string | null;
    phone: string | null;
    notes: string | null;
  }>(query, [
    searchTerm,
    searchTerm,
    searchTerm,
    searchTerm,
  ]);
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