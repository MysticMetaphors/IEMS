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

export async function getStudents() {
  const db = await getDatabase();

  return db.getAllAsync<{
    id: string;
    custom_id: string;
    name: string;
    email: string | null;
    phone: string | null;
    notes: string | null;
  }>(
    `SELECT id, custom_id, name, email, phone, notes
     FROM students
     WHERE deleted_at IS NULL
     ORDER BY name COLLATE NOCASE ASC`
  );
}