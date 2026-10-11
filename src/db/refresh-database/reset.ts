
import { getDatabase } from '../index';
import { DATABASE_SCHEMA } from '../schema';

// -- DROP TABLE IF EXISTS reminders;
// -- DROP TABLE IF EXISTS progress_notes;
// -- DROP TABLE IF EXISTS assessment_scores;
// -- DROP TABLE IF EXISTS assessments;
// -- DROP TABLE IF EXISTS lesson_records;
// -- DROP TABLE IF EXISTS attendance;
// -- DROP TABLE IF EXISTS class_sessions;
// -- DROP TABLE IF EXISTS schema_migrations;

export async function resetDatabase(): Promise<void> {
  const db = await getDatabase();

  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DROP TABLE IF EXISTS class_enrollments;
      DROP TABLE IF EXISTS classes;
      DROP TABLE IF EXISTS students;
      DROP TABLE IF EXISTS schema_migrations;
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY NOT NULL,
        applied_at TEXT NOT NULL
      );
    `);

    await db.execAsync(DATABASE_SCHEMA);

    await db.runAsync(
      `INSERT INTO schema_migrations (version, applied_at)
       VALUES (?, ?)`,
      1,
      new Date().toISOString(),
    );
  });
}
