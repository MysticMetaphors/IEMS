import generateColorPair from '@/lib/utils/color-pair';
import { resetDatabase } from '@/db/scripts/db-reset';
import { createId } from '../ids';
import { getDatabase } from '../index';
import type { AttendanceStatus } from '../classes/attendance';

/**
 * Development seed data: 20 students, 15 classes, every student enrolled in 5
 * classes, and class sessions for today and the following days.
 *
 * Session dates are worked out from the current date every time the seeder
 * runs, so the schedule always starts today.
 */

/** How many days of sessions to create, counting today as the first. */
export const SEED_DAYS = 7;

/** How many classes each student is enrolled in. */
export const CLASSES_PER_STUDENT = 5;

// The teacher's daily timetable: [hour, minute] start times in local time, and how
// long every session lasts. Edit these two to change the schedule.
//
// A session can't overlap another one (the app rejects it), so every class shares
// these slots and each start must be at least SESSION_MINUTES after the one before.
// validateTimetable() below throws a clear error if they don't fit.
const DAILY_SLOTS: [number, number][] = [
  [9, 0],
  [11, 0],
  [13, 0],
  [15, 0],
  [17, 0],
];
const SESSION_MINUTES = 120;

const clock = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

/** Throws if the slots overlap, run past midnight or hold values that aren't times. */
export function validateTimetable(slots: [number, number][], sessionMinutes: number) {
  if (!Number.isInteger(sessionMinutes) || sessionMinutes <= 0) {
    throw new Error(`SESSION_MINUTES must be a positive whole number (got ${sessionMinutes}).`);
  }

  const starts = slots
    .map(([hour, minute]) => {
      if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        throw new Error(`DAILY_SLOTS has an invalid time: [${hour}, ${minute}].`);
      }
      return hour * 60 + minute;
    })
    .sort((a, b) => a - b);

  for (let i = 1; i < starts.length; i++) {
    if (starts[i] < starts[i - 1] + sessionMinutes) {
      throw new Error(
        `Seed timetable overlaps: ${clock(starts[i - 1])}-${clock(starts[i - 1] + sessionMinutes)} ` +
          `and ${clock(starts[i])}-${clock(starts[i] + sessionMinutes)}. ` +
          `Start slots at least ${sessionMinutes} minutes apart, or shorten SESSION_MINUTES.`
      );
    }
  }

  const last = starts[starts.length - 1];
  if (last !== undefined && last + sessionMinutes > 24 * 60) {
    throw new Error(
      `The last seed session (${clock(last)}-${clock(last + sessionMinutes)}) runs past midnight. ` +
        `Start it earlier or shorten SESSION_MINUTES.`
    );
  }
}

type StudentSeed = { name: string; email: string; phone: string; notes: string };
type ClassSeed = { name: string; subject: string; description: string };

const STUDENTS: StudentSeed[] = [
  { name: 'Maria Santos', email: 'maria.santos@example.com', phone: '+1 202 555 0101', notes: 'Nurse preparing for IELTS. Prefers morning sessions.' },
  { name: 'Juan Dela Cruz', email: 'juan.delacruz@example.com', phone: '+1 202 555 0102', notes: 'Call center agent improving accent and fluency.' },
  { name: 'Aiko Tanaka', email: 'aiko.tanaka@example.com', phone: '+1 202 555 0103', notes: 'University student. Shy at first, gains confidence in small groups.' },
  { name: 'Min-jun Kim', email: 'minjun.kim@example.com', phone: '+1 202 555 0104', notes: 'Software engineer who needs English for meetings and presentations.' },
  { name: 'Sofia Rossi', email: 'sofia.rossi@example.com', phone: '+1 202 555 0105', notes: 'Moving abroad next year. Focus on everyday conversation.' },
  { name: 'Carlos Mendoza', email: 'carlos.mendoza@example.com', phone: '+1 202 555 0106', notes: 'Sales manager. Wants stronger business vocabulary.' },
  { name: 'Yuki Nakamura', email: 'yuki.nakamura@example.com', phone: '+1 202 555 0107', notes: 'Strong reading, weaker listening. Works on podcasts at home.' },
  { name: 'Linh Nguyen', email: 'linh.nguyen@example.com', phone: '+1 202 555 0108', notes: 'Hotel receptionist practicing polite, professional phrases.' },
  { name: 'Amara Okafor', email: 'amara.okafor@example.com', phone: '+1 202 555 0109', notes: 'Fluent speaker polishing academic writing for a master’s program.' },
  { name: 'Lucas Meyer', email: 'lucas.meyer@example.com', phone: '+1 202 555 0110', notes: 'Engineer on a work visa. Evenings only.' },
  { name: 'Elena Petrova', email: 'elena.petrova@example.com', phone: '+1 202 555 0111', notes: 'Needs a TOEFL score of 100 for a scholarship application.' },
  { name: 'Rafael Ortiz', email: 'rafael.ortiz@example.com', phone: '+1 202 555 0112', notes: 'Restaurant owner learning to talk with international guests.' },
  { name: 'Hana Park', email: 'hana.park@example.com', phone: '+1 202 555 0113', notes: 'High school student. Struggles with verb tenses.' },
  { name: 'Ahmed Hassan', email: 'ahmed.hassan@example.com', phone: '+1 202 555 0114', notes: 'Doctor. Wants clearer pronunciation of medical terms.' },
  { name: 'Chloe Martin', email: 'chloe.martin@example.com', phone: '+1 202 555 0115', notes: 'Flight attendant. Already confident; wants advanced vocabulary.' },
  { name: 'Mateo Garcia', email: 'mateo.garcia@example.com', phone: '+1 202 555 0116', notes: 'Beginner. Learns best with visuals and short exercises.' },
  { name: 'Priya Sharma', email: 'priya.sharma@example.com', phone: '+1 202 555 0117', notes: 'Accountant. Writes well, hesitates when speaking.' },
  { name: 'Noah Bennett', email: 'noah.bennett@example.com', phone: '+1 202 555 0118', notes: 'Retired teacher learning for fun. Loves discussion topics.' },
  { name: 'Isabella Reyes', email: 'isabella.reyes@example.com', phone: '+1 202 555 0119', notes: 'Freelance designer. Needs email and client-message writing.' },
  { name: 'Takeshi Mori', email: 'takeshi.mori@example.com', phone: '+1 202 555 0120', notes: 'Business traveler. Often reschedules; notify early.' },
];

const CLASSES: ClassSeed[] = [
  { name: 'Beginner Conversation A1', subject: 'Conversation', description: 'First steps in speaking: greetings, introductions and simple questions.' },
  { name: 'Everyday English A2', subject: 'Conversation', description: 'Practical English for shopping, travel and daily routines.' },
  { name: 'Intermediate Conversation B1', subject: 'Conversation', description: 'Longer conversations, opinions and storytelling.' },
  { name: 'Advanced Discussion C1', subject: 'Conversation', description: 'Debates and current-affairs discussion at a near-native pace.' },
  { name: 'Grammar Essentials', subject: 'Grammar', description: 'Core tenses, articles and sentence structure from the ground up.' },
  { name: 'Grammar in Context B2', subject: 'Grammar', description: 'Conditionals, reported speech and the passive voice through real texts.' },
  { name: 'Business English', subject: 'Business', description: 'Meetings, negotiations and presentations in a work setting.' },
  { name: 'Email & Report Writing', subject: 'Writing', description: 'Clear, professional emails and short reports.' },
  { name: 'IELTS Speaking Prep', subject: 'Test Prep', description: 'Timed speaking practice with feedback on all three IELTS parts.' },
  { name: 'IELTS Writing Workshop', subject: 'Test Prep', description: 'Task 1 and Task 2 essay structure, planning and review.' },
  { name: 'TOEFL Preparation', subject: 'Test Prep', description: 'Integrated tasks, note-taking and test strategies.' },
  { name: 'Pronunciation Clinic', subject: 'Pronunciation', description: 'Sounds, stress and intonation drills with one-to-one correction.' },
  { name: 'Vocabulary Builder', subject: 'Vocabulary', description: 'Themed word sets, collocations and idioms with spaced review.' },
  { name: 'Listening Lab', subject: 'Listening', description: 'Podcasts, interviews and lectures with comprehension tasks.' },
  { name: 'Kids English Fun', subject: 'Kids', description: 'Games, songs and stories for young learners.' },
];

// Cycled through so the attendance data shows every status.
const ATTENDANCE_CYCLE: AttendanceStatus[] = [
  'present',
  'present',
  'present',
  'late',
  'absent',
  'excused',
];

// Same format the app uses: the year plus three digits, e.g. 2026001.
const customId = (year: number, n: number) => `${year}${String(n).padStart(3, '0')}`;

export function buildSeedData(now: Date = new Date()) {
  validateTimetable(DAILY_SLOTS, SESSION_MINUTES);

  const nowIso = now.toISOString();
  const year = now.getFullYear();

  const students = STUDENTS.map((s, i) => ({
    ...s,
    id: createId(),
    custom_id: customId(year, i + 1),
  }));

  const classes = CLASSES.map((c, i) => {
    const { dark, light } = generateColorPair();

    return { ...c, id: createId(), custom_id: customId(year, i + 1), color: `${dark},${light}` };
  });

  // Student i joins classes i, i+3, i+6, i+9, i+12 (mod 15): five different classes
  // each, and the 100 enrollments spread evenly (6 or 7 students per class).
  const enrollments = students.flatMap((student, i) =>
    Array.from({ length: CLASSES_PER_STUDENT }, (_, k) => ({
      id: createId(),
      student_id: student.id,
      class_id: classes[(i + 3 * k) % classes.length].id,
      enrolled_at: nowIso,
    }))
  );

  // Today and the following days. Classes take the slots in turn, so each one
  // meets two or three times over the week.
  const sessions: {
    id: string;
    class_id: string;
    color: string;
    starts_at: string;
    ends_at: string;
    status: 'scheduled' | 'completed';
  }[] = [];

  for (let day = 0; day < SEED_DAYS; day++) {
    for (const [hour, minute] of DAILY_SLOTS) {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + day, hour, minute);
      const end = new Date(start.getTime() + SESSION_MINUTES * 60_000);
      const cls = classes[sessions.length % classes.length];

      sessions.push({
        id: createId(),
        class_id: cls.id,
        color: cls.color,
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        // Sessions earlier today have already happened: record them as done, with
        // attendance, so they don't show up as missed-class issues on the dashboard.
        status: end.getTime() <= now.getTime() ? 'completed' : 'scheduled',
      });
    }
  }

  const studentsByClass = new Map<string, string[]>();
  for (const e of enrollments) {
    studentsByClass.set(e.class_id, [...(studentsByClass.get(e.class_id) ?? []), e.student_id]);
  }

  const attendance = sessions
    .filter((s) => s.status === 'completed')
    .flatMap((session, sessionIndex) =>
      (studentsByClass.get(session.class_id) ?? []).map((student_id, studentIndex) => ({
        id: createId(),
        session_id: session.id,
        student_id,
        status: ATTENDANCE_CYCLE[(sessionIndex + studentIndex) % ATTENDANCE_CYCLE.length],
      }))
    );

  return { students, classes, enrollments, sessions, attendance };
}

/**
 * Deletes ALL local data and fills the database with the development seed data.
 * Development only: refuses to run in a production build.
 */
export async function seedDatabase() {
  if (!__DEV__) {
    throw new Error('Seeding is only available in development.');
  }

  // Build (and validate) the data BEFORE deleting anything, so a mistake in the
  // timetable above throws without wiping the database first.
  const now = new Date();
  const nowIso = now.toISOString();
  const data = buildSeedData(now);

  // Start from an empty database so the seed never collides with existing rows
  // (custom ids are unique) and running it twice gives the same result.
  await resetDatabase();

  const db = await getDatabase();

  // One transaction: either everything is seeded or nothing is.
  await db.withTransactionAsync(async () => {
    for (const s of data.students) {
      await db.runAsync(
        `INSERT INTO students (
          id, custom_id, name, email, phone, notes,
          created_at, updated_at, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        s.id, s.custom_id, s.name, s.email, s.phone, s.notes, nowIso, nowIso
      );
    }

    for (const c of data.classes) {
      await db.runAsync(
        `INSERT INTO classes (
          id, custom_id, color, name, description, subject, status,
          created_at, updated_at, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?, 'pending')`,
        c.id, c.custom_id, c.color, c.name, c.description, c.subject, nowIso, nowIso
      );
    }

    for (const e of data.enrollments) {
      await db.runAsync(
        `INSERT INTO class_enrollments (
          id, student_id, class_id, enrolled_at, status,
          created_at, updated_at, sync_status
        ) VALUES (?, ?, ?, ?, 'active', ?, ?, 'pending')`,
        e.id, e.student_id, e.class_id, e.enrolled_at, nowIso, nowIso
      );
    }

    for (const s of data.sessions) {
      await db.runAsync(
        `INSERT INTO class_sessions (
          id, class_id, title, starts_at, ends_at, color, status,
          created_at, updated_at, sync_status
        ) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, 'pending')`,
        s.id, s.class_id, s.starts_at, s.ends_at, s.color, s.status, nowIso, nowIso
      );
    }

    for (const a of data.attendance) {
      await db.runAsync(
        `INSERT INTO attendance (
          id, session_id, student_id, status,
          created_at, updated_at, sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
        a.id, a.session_id, a.student_id, a.status, nowIso, nowIso
      );
    }
  });

  return {
    students: data.students.length,
    classes: data.classes.length,
    enrollments: data.enrollments.length,
    sessions: data.sessions.length,
    attendance: data.attendance.length,
  };
}
