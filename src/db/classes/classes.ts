import generateColorPair from '@/lib/utils/color-pair';
import { createId, createSequentialId } from './../ids';
import { getDatabase } from './../index';

export type ClassStatus = 'active' | 'archived';

export type ClassInput = {
  name: string;
  description?: string | null;
  subject?: string | null;
  status?: ClassStatus;
};

export async function createClass(input: ClassInput) {
  const db = await getDatabase();
  const id = createId();
  const now = new Date().toISOString();
  const customId = await createSequentialId("classes");

  const { dark, light } = generateColorPair();
  const color = `${dark},${light}`;

  await db.runAsync(
    `INSERT INTO classes (
      id, custom_id, color, name, description, subject, status,
      created_at, updated_at, sync_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    id,
    customId,
    color,
    input.name.trim(),
    input.description?.trim() || null,
    input.subject?.trim() || null,
    input.status ?? 'active',
    now,
    now
  );

  return id;
}

export async function getClasses() {
  const db = await getDatabase();

  // student_count = students currently enrolled (active, not deleted)
  return db.getAllAsync<{
    id: string;
    custom_id: string;
    name: string;
    color: string;
    description: string | null;
    subject: string | null;
    status: ClassStatus;
    student_count: number;
  }>(
    `SELECT
       c.id, c.custom_id, c.color, c.name, c.description, c.subject, c.status,
       COUNT(e.id) AS student_count
     FROM classes c
     LEFT JOIN class_enrollments e
       ON e.class_id = c.id
      AND e.status = 'active'
      AND e.deleted_at IS NULL
     WHERE c.deleted_at IS NULL
     GROUP BY c.id
     ORDER BY c.name COLLATE NOCASE ASC`
  );
}

export async function updateClass(input: ClassInput & { id: string }) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE classes
     SET name = ?,
         description = ?,
         subject = ?,
         status = COALESCE(?, status),
         updated_at = ?,
         sync_status = 'pending'
     WHERE id = ? AND deleted_at IS NULL`,
    input.name.trim(),
    input.description?.trim() || null,
    input.subject?.trim() || null,
    input.status ?? null,
    now,
    input.id
  );
}

// Soft delete the class and its enrollments together so nothing is orphaned.
export async function deleteClass(id: string) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE class_enrollments
       SET deleted_at = ?,
           updated_at = ?,
           sync_status = 'pending'
       WHERE class_id = ? AND deleted_at IS NULL`,
      now,
      now,
      id
    );

    await db.runAsync(
      `UPDATE classes
       SET deleted_at = ?,
           updated_at = ?,
           sync_status = 'pending'
       WHERE id = ? AND deleted_at IS NULL`,
      now,
      now,
      id
    );
  });
}