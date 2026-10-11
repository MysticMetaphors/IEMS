import * as SQLite from 'expo-sqlite';
import { DATABASE_SCHEMA } from "./schema";

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = initializeDatabase().catch((error) => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
}

async function initializeDatabase() {
  const db = await SQLite.openDatabaseAsync('iems.db');

  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync('PRAGMA journal_mode = WAL;');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const row = await db.getFirstAsync<{ version: number }>(
    'SELECT MAX(version) AS version FROM schema_migrations'
  );

  const currentVersion = row?.version ?? 0;

  // if (currentVersion < 1) {
  //   await db.withExclusiveTransactionAsync(async (tx) => {
  //     await tx.execAsync(DATABASE_SCHEMA);

  //     await tx.runAsync(
  //       'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
  //       1,
  //       new Date().toISOString()
  //     );
  //   });
  // }

  // web browser does not support exclusive transactions, so we use a regular transaction instead
  if (currentVersion < 1) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(DATABASE_SCHEMA);

      await db.runAsync(
        'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
        1,
        new Date().toISOString()
      );
    });
  }


  return db;
}