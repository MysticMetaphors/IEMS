import { getDatabase } from '../index';
import { runMigrations } from '../migrations';

// Children come before the tables they reference.
const DATA_TABLES = [
  'attendance',
  'class_sessions',
  'class_enrollments',
  'classes',
  'students',
];

const ACCOUNT_TABLES = ['auth_session', 'users'];

export async function resetDatabase({ keepAccount = false } = {}): Promise<void> {
  const db = await getDatabase();

  // The account tables are created by a migration, so keeping them means keeping
  // the migration history too and emptying the data tables instead of dropping them.
  if (keepAccount) {
    await db.withTransactionAsync(async () => {
      for (const table of DATA_TABLES) {
        await db.execAsync(`DELETE FROM ${table};`);
      }
    });
    return;
  }

  await db.withTransactionAsync(async () => {
    for (const table of [...DATA_TABLES, ...ACCOUNT_TABLES, 'schema_migrations']) {
      await db.execAsync(`DROP TABLE IF EXISTS ${table};`);
    }
  });

  await runMigrations(db);
}
