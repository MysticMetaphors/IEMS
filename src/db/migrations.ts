import type { SQLiteDatabase } from 'expo-sqlite';
import { DATABASE_SCHEMA } from './schema';

/**
 * Versioned schema migrations.
 *
 * How to change the database schema from now on:
 *   1. Append a new entry to MIGRATIONS with the next version number.
 *   2. Never edit or reorder an existing entry, and never edit DATABASE_SCHEMA
 *      (it is the frozen version 1 baseline). Devices that already ran a
 *      migration will not run it again, so edits to it never reach them.
 *
 * Applied versions are recorded in the `schema_migrations` table.
 */
export type Migration = {
  version: number;
  name: string;
  up: (db: SQLiteDatabase) => Promise<void>;
};

async function hasColumn(
  db: SQLiteDatabase,
  table: string,
  column: string,
): Promise<boolean> {
  const columns = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(${table})`,
  );

  return columns.some((c) => c.name === column);
}

/** Adds the column when it is missing. Returns true if it had to be added. */
async function addColumnIfMissing(
  db: SQLiteDatabase,
  table: string,
  column: string,
  definition: string,
): Promise<boolean> {
  if (await hasColumn(db, table, column)) {
    return false;
  }

  await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  return true;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'baseline schema',
    up: async (db) => {
      await db.execAsync(DATABASE_SCHEMA);
    },
  },
  {
    version: 2,
    name: 'catch up databases created from an older schema',
    // Before migrations were versioned, edits to the baseline schema never
    // reached devices that already had version 1 recorded, so some installs
    // are missing tables or columns (custom_id, color) that the app queries.
    // Everything here is idempotent, so it is a no-op on fresh installs.
    up: async (db) => {
      // Creates any missing tables and indexes; existing ones are left alone.
      await db.execAsync(DATABASE_SCHEMA);

      // SQLite cannot add a UNIQUE column with ALTER TABLE, so the uniqueness
      // is enforced with a separate unique index (NULLs are allowed to repeat).
      if (await addColumnIfMissing(db, 'students', 'custom_id', 'TEXT')) {
        await db.execAsync(
          `CREATE UNIQUE INDEX IF NOT EXISTS idx_students_custom_id
             ON students(custom_id)`,
        );
      }

      if (await addColumnIfMissing(db, 'classes', 'custom_id', 'TEXT')) {
        await db.execAsync(
          `CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_custom_id
             ON classes(custom_id)`,
        );
      }

      await addColumnIfMissing(db, 'classes', 'color', 'TEXT');
      await addColumnIfMissing(db, 'class_sessions', 'color', 'TEXT');
    },
  },
];

export const LATEST_SCHEMA_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

function assertMigrationsAreOrdered(): void {
  MIGRATIONS.forEach((migration, index) => {
    if (migration.version !== index + 1) {
      throw new Error(
        `Migration "${migration.name}" has version ${migration.version} but ` +
          `is at position ${index + 1}. Versions must be 1, 2, 3, ... in order.`,
      );
    }
  });
}

/**
 * Brings the database up to LATEST_SCHEMA_VERSION. Each pending migration runs
 * in its own transaction together with its version record, so a failure rolls
 * that migration back and it is retried on the next launch.
 */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  assertMigrationsAreOrdered();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const row = await db.getFirstAsync<{ version: number | null }>(
    'SELECT MAX(version) AS version FROM schema_migrations',
  );
  const currentVersion = row?.version ?? 0;

  if (currentVersion > LATEST_SCHEMA_VERSION) {
    throw new Error(
      `Database schema version ${currentVersion} is newer than this app ` +
        `supports (${LATEST_SCHEMA_VERSION}). Update the app before opening ` +
        `this database.`,
    );
  }

  for (const migration of MIGRATIONS) {
    if (migration.version <= currentVersion) {
      continue;
    }

    try {
      // The web build does not support exclusive transactions, so a regular
      // transaction is used. That is safe here because nothing else can reach
      // the database until getDatabase() resolves, which is after this runs.
      await db.withTransactionAsync(async () => {
        await migration.up(db);

        await db.runAsync(
          'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
          migration.version,
          new Date().toISOString(),
        );
      });
    } catch (error) {
      throw new Error(
        `Migration ${migration.version} (${migration.name}) failed: ` +
          `${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  }
}
