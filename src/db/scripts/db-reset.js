import { getDatabase } from '../index';
import { runMigrations } from '../migrations';

const TABLES_TO_DROP = [
  'attendance',
  'class_sessions',
  'class_enrollments',
  'classes',
  'students',
  'schema_migrations',
];

export async function resetDatabase() {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const table of TABLES_TO_DROP) {
      await db.execAsync(`DROP TABLE IF EXISTS ${table};`);
    }
  });

  await runMigrations(db);
}
