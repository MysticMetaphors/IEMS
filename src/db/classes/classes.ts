import generateColorPair from '@/lib/utils/color-pair';
import { createId, createSequentialId } from './../ids';
import { getDatabase } from './../index';
import {
  containsPattern,
  LIKE_ESCAPE,
  pageBounds,
  type Page,
  type PageRequest,
} from './../pagination';

export type ClassStatus = 'active' | 'archived';

export type ClassRow = {
  id: string;
  custom_id: string;
  name: string;
  color: string;
  description: string | null;
  subject: string | null;
  status: ClassStatus;
  student_count: number;
};

const CLASS_COLUMNS =
  'c.id, c.custom_id, c.color, c.name, c.description, c.subject, c.status';

// Wraps a query that selects CLASS_COLUMNS (aliased `p`) and adds student_count =
// students currently enrolled (active, not deleted). Because the count is
// computed outside the inner query, it only runs for the rows that survive its
// LIMIT instead of for every class.
function withStudentCount(inner: string) {
  return `SELECT
       p.id, p.custom_id, p.color, p.name, p.description, p.subject, p.status,
       (SELECT COUNT(*)
          FROM class_enrollments e
         WHERE e.class_id = p.id
           AND e.status = 'active'
           AND e.deleted_at IS NULL) AS student_count
     FROM (${inner}) p
     ORDER BY p.name COLLATE NOCASE ASC, p.id ASC`;
}

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
  return db.getAllAsync<ClassRow>(
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

/**
 * One page of classes (name A-Z) plus the total that match `search`
 * (class name and subject, as shown on screen), so the list never has to
 * load every class.
 */
export async function getClassesPage(
  request: PageRequest
): Promise<Page<ClassRow>> {
  const db = await getDatabase();
  const { limit, offset } = pageBounds(request);

  const where = ['c.deleted_at IS NULL'];
  const params: (string | number)[] = [];

  const pattern = containsPattern(request.search);
  if (pattern) {
    where.push(
      `(c.name || ' ' || COALESCE(c.subject, '')) LIKE ? ${LIKE_ESCAPE}`
    );
    params.push(pattern);
  }

  const whereSql = where.join(' AND ');

  const [rows, countRow] = await Promise.all([
    db.getAllAsync<ClassRow>(
      withStudentCount(
        `SELECT ${CLASS_COLUMNS}
         FROM classes c
         WHERE ${whereSql}
         ORDER BY c.name COLLATE NOCASE ASC, c.id ASC
         LIMIT ? OFFSET ?`
      ),
      [...params, limit, offset]
    ),
    db.getFirstAsync<{ total: number }>(
      `SELECT COUNT(*) AS total FROM classes c WHERE ${whereSql}`,
      params
    ),
  ]);

  return { rows, total: countRow?.total ?? 0 };
}

export async function getClassById(id: string) {
  const db = await getDatabase();

  return db.getFirstAsync<ClassRow>(
    withStudentCount(
      `SELECT ${CLASS_COLUMNS}
       FROM classes c
       WHERE c.id = ? AND c.deleted_at IS NULL`
    ),
    id
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