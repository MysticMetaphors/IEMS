import { getDatabase } from '../index';
import { runMigrations } from '../migrations';

// Child tables first so the drops never violate a foreign key.
const TABLES_TO_DROP = [
  'attendance',
  'class_sessions',
  'class_enrollments',
  'classes',
  'students',
  'schema_migrations',
];

export async function resetDatabase(): Promise<void> {
  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    for (const table of TABLES_TO_DROP) {
      await db.execAsync(`DROP TABLE IF EXISTS ${table};`);
    }
  });

  // schema_migrations is gone, so this replays every migration from version 1
  // and leaves the database exactly as a fresh install would be.
  await runMigrations(db);
}
