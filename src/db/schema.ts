export const DATABASE_SCHEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (sync_status IN ('pending', 'synced', 'conflict'))
);

CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (sync_status IN ('pending', 'synced', 'conflict'))
);

CREATE TABLE IF NOT EXISTS class_enrollments (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT,
  student_id TEXT NOT NULL REFERENCES students(id),
  class_id TEXT NOT NULL REFERENCES classes(id),
  enrolled_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'withdrawn')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (sync_status IN ('pending', 'synced', 'conflict')),
  UNIQUE (student_id, class_id)
);

CREATE TABLE IF NOT EXISTS class_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT,
  class_id TEXT NOT NULL REFERENCES classes(id),
  title TEXT,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN (
      'scheduled', 'completed', 'cancelled'
    )),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (sync_status IN ('pending', 'synced', 'conflict')),
  CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT,
  session_id TEXT NOT NULL REFERENCES class_sessions(id),
  student_id TEXT NOT NULL REFERENCES students(id),
  status TEXT NOT NULL
    CHECK (status IN ('present', 'absent', 'late', 'excused')),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (sync_status IN ('pending', 'synced', 'conflict')),
  UNIQUE (session_id, student_id)
);

CREATE TABLE IF NOT EXISTS lesson_records (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT,
  session_id TEXT NOT NULL UNIQUE
    REFERENCES class_sessions(id),
  topic TEXT,
  notes TEXT,
  materials_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (sync_status IN ('pending', 'synced', 'conflict'))
);

CREATE TABLE IF NOT EXISTS assessments (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT,
  class_id TEXT NOT NULL REFERENCES classes(id),
  title TEXT NOT NULL,
  max_score REAL NOT NULL CHECK (max_score > 0),
  assessment_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (sync_status IN ('pending', 'synced', 'conflict'))
);

CREATE TABLE IF NOT EXISTS assessment_scores (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT,
  assessment_id TEXT NOT NULL REFERENCES assessments(id),
  student_id TEXT NOT NULL REFERENCES students(id),
  score REAL NOT NULL CHECK (score >= 0),
  feedback TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (sync_status IN ('pending', 'synced', 'conflict')),
  UNIQUE (assessment_id, student_id)
);

CREATE TABLE IF NOT EXISTS progress_notes (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT,
  student_id TEXT NOT NULL REFERENCES students(id),
  class_id TEXT REFERENCES classes(id),
  note TEXT NOT NULL,
  recorded_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (sync_status IN ('pending', 'synced', 'conflict'))
);

CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT,
  session_id TEXT REFERENCES class_sessions(id),
  title TEXT NOT NULL,
  remind_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'dismissed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (sync_status IN ('pending', 'synced', 'conflict'))
);

CREATE INDEX IF NOT EXISTS idx_enrollments_class
  ON class_enrollments(class_id, status);

CREATE INDEX IF NOT EXISTS idx_enrollments_student
  ON class_enrollments(student_id, status);

CREATE INDEX IF NOT EXISTS idx_sessions_start
  ON class_sessions(starts_at);

CREATE INDEX IF NOT EXISTS idx_sessions_class_start
  ON class_sessions(class_id, starts_at);

CREATE INDEX IF NOT EXISTS idx_attendance_student
  ON attendance(student_id, session_id);

CREATE INDEX IF NOT EXISTS idx_scores_student
  ON assessment_scores(student_id, assessment_id);

CREATE INDEX IF NOT EXISTS idx_reminders_time
  ON reminders(remind_at, status);

CREATE INDEX IF NOT EXISTS idx_students_sync
  ON students(sync_status, updated_at);

CREATE INDEX IF NOT EXISTS idx_classes_sync
  ON classes(sync_status, updated_at);

CREATE INDEX IF NOT EXISTS idx_sessions_sync
  ON class_sessions(sync_status, updated_at);
`;