import { createId } from './../ids';
import { getDatabase } from './../index';

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled';

export type ClassSessionInput = {
  class_id: string;
  title?: string | null;
  starts_at: string | Date;
  ends_at: string | Date;
  status?: SessionStatus;
};

export type ClassSessionRow = {
  id: string;
  class_id: string;
  class_name: string;
  class_custom_id: string | null;
  title: string | null;
  starts_at: string;
  ends_at: string;
  color: string | null;
  status: SessionStatus;
};

// Normalize to a UTC ISO string so text comparison / ORDER BY in SQLite
// always matches chronological order, and validate the range up front
// (the table also has CHECK (ends_at > starts_at)).
function normalizeRange(startsAt: string | Date, endsAt: string | Date) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Invalid session date.');
  }
  if (end.getTime() <= start.getTime()) {
    throw new Error('Session end time must be after its start time.');
  }

  return { starts_at: start.toISOString(), ends_at: end.toISOString() };
}

// The session color is derived from its parent class.
async function getClassColor(
  db: Awaited<ReturnType<typeof getDatabase>>,
  classId: string
) {
  const row = await db.getFirstAsync<{ color: string | null }>(
    `SELECT color FROM classes WHERE id = ? AND deleted_at IS NULL`,
    classId
  );

  if (!row) throw new Error('Class not found.');
  return row.color;
}

export async function createClassSession(input: ClassSessionInput) {
  const db = await getDatabase();
  const id = createId();
  const now = new Date().toISOString();

  const { starts_at, ends_at } = normalizeRange(
    input.starts_at,
    input.ends_at
  );

  const color = await getClassColor(db, input.class_id);
  const status = input.status ?? 'scheduled';

  // Check for overlapping classes unless this session is cancelled.
  if (status !== 'cancelled') {
    await checkClassSessionOverlap(db, starts_at, ends_at);
  }

  await db.runAsync(
    `INSERT INTO class_sessions (
      id, class_id, title, starts_at, ends_at, color, status,
      created_at, updated_at, sync_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    id,
    input.class_id,
    input.title?.trim() || null,
    starts_at,
    ends_at,
    color,
    status,
    now,
    now
  );

  return id;
}

/**
 * Sessions that overlap [from, to) -- e.g. one week for the schedule grid.
 * Both bounds are optional; classId narrows to a single class.
 */
export async function getClassSessions(
  options: { from?: string | Date; to?: string | Date; classId?: string } = {}
) {
  const db = await getDatabase();

  const where: string[] = ['s.deleted_at IS NULL', 'c.deleted_at IS NULL'];
  const params: string[] = [];

  if (options.from) {
    where.push('s.ends_at > ?');
    params.push(new Date(options.from).toISOString());
  }
  if (options.to) {
    where.push('s.starts_at < ?');
    params.push(new Date(options.to).toISOString());
  }
  if (options.classId) {
    where.push('s.class_id = ?');
    params.push(options.classId);
  }

  return db.getAllAsync<ClassSessionRow>(
    `SELECT
       s.id, s.class_id, c.name AS class_name, c.custom_id AS class_custom_id,
       s.title, s.starts_at, s.ends_at, s.color, s.status
     FROM class_sessions s
     INNER JOIN classes c ON c.id = s.class_id
     WHERE ${where.join(' AND ')}
     ORDER BY s.starts_at ASC`,
    ...params
  );
}

export async function getClassSessionById(id: string) {
  const db = await getDatabase();

  return db.getFirstAsync<ClassSessionRow>(
    `SELECT
       s.id, s.class_id, c.name AS class_name, c.custom_id AS class_custom_id,
       s.title, s.starts_at, s.ends_at, s.color, s.status
     FROM class_sessions s
     INNER JOIN classes c ON c.id = s.class_id
     WHERE s.id = ? AND s.deleted_at IS NULL`,
    id
  );
}

export async function updateClassSession(
  input: ClassSessionInput & { id: string }
) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const { starts_at, ends_at } = normalizeRange(
    input.starts_at,
    input.ends_at
  );

  // Re-derive the color in case the session was moved to another class.
  const color = await getClassColor(db, input.class_id);

  // Check for overlapping classes unless the session is cancelled.
  if (input.status !== 'cancelled') {
    await checkClassSessionOverlap(
      db,
      starts_at,
      ends_at,
      input.id
    );
  }

  await db.runAsync(
    `UPDATE class_sessions
     SET class_id = ?,
         title = ?,
         starts_at = ?,
         ends_at = ?,
         color = ?,
         status = COALESCE(?, status),
         updated_at = ?,
         sync_status = 'pending'
     WHERE id = ? AND deleted_at IS NULL`,
    input.class_id,
    input.title?.trim() || null,
    starts_at,
    ends_at,
    color,
    input.status ?? null,
    now,
    input.id
  );
}

// Change only the status (no need to resend the whole session).
export async function updateClassSessionStatus(id: string, status: SessionStatus) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE class_sessions
     SET status = ?,
         updated_at = ?,
         sync_status = 'pending'
     WHERE id = ? AND deleted_at IS NULL`,
    status,
    now,
    id
  );
}

// Soft delete so the change can still sync.
export async function deleteClassSession(id: string) {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `UPDATE class_sessions
     SET deleted_at = ?,
         updated_at = ?,
         sync_status = 'pending'
     WHERE id = ? AND deleted_at IS NULL`,
    now,
    now,
    id
  );
}

// Check if a new or updated session overlaps with any existing sessions (except itself).
async function checkClassSessionOverlap(
  db: Awaited<ReturnType<typeof getDatabase>>,
  startsAt: string,
  endsAt: string,
  excludeSessionId?: string
) {
  const params: string[] = [endsAt, startsAt];

  let excludeCondition = '';

  if (excludeSessionId) {
    excludeCondition = 'AND s.id != ?';
    params.push(excludeSessionId);
  }

  const overlappingSession = await db.getFirstAsync<{
    id: string;
    class_name: string;
    starts_at: string;
    ends_at: string;
  }>(
    `SELECT
       s.id,
       c.name AS class_name,
       s.starts_at,
       s.ends_at
     FROM class_sessions s
     INNER JOIN classes c ON c.id = s.class_id
     WHERE s.deleted_at IS NULL
       AND c.deleted_at IS NULL
       AND s.status != 'cancelled'
       AND s.starts_at < ?
       AND s.ends_at > ?
       ${excludeCondition}
     LIMIT 1`,
    ...params
  );

  if (overlappingSession) {
    throw new Error(
      `This schedule overlaps with another class: "${overlappingSession.class_name}" ` +
      `(${new Date(overlappingSession.starts_at).toLocaleString()} - ` +
      `${new Date(overlappingSession.ends_at).toLocaleString()}).`
    );
  }
}