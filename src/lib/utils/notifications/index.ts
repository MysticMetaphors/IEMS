import { getSessionIssues, type SessionIssueRow } from "@/db/classes/dashboard";
import { getClassSessions, type ClassSessionRow } from "@/db/classes/sessions";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/**
 * Local notifications (sent by the phone itself, no server).
 *
 *  1. Class reminders  - 10 minutes and 1 minute before a class starts (scheduled ahead of time)
 *  2. Class issues     - forgotten attendance / status, missed classes (sent when detected)
 *
 * Nothing is saved: issues and upcoming classes are always derived from the
 * existing tables, and the same queries feed the in-app list (getNotificationFeed).
 */

export const REMINDER_MINUTES = [10, 1] as const;

const REMINDER_PREFIX = "class-reminder";
const ISSUES_ID = "class-issues";
const CHANNEL_REMINDERS = "class-reminders";
const CHANNEL_ISSUES = "class-issues";
const REMINDER_WINDOW_DAYS = 7; // only classes in the next 7 days get reminders
const MAX_SCHEDULED = 60; // iOS keeps only the 64 soonest local notifications

/* -------------------------------------------------------------------------- */
/*  Message text                                                              */
/* -------------------------------------------------------------------------- */

// October 2, 2026
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

// 12:00 AM - 3:30 AM
const formatTimeRange = (startIso: string, endIso: string) => {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${fmt(startIso)} - ${fmt(endIso)}`;
};

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

const sessionName = (s: { title: string | null; class_name: string }) => s.title || s.class_name;

const unmarkedOf = (row: SessionIssueRow) =>
  Math.max(0, row.total_students - row.marked_students);

/** One issue -> a specific sentence. */
export function singleIssueMessage(row: SessionIssueRow) {
  const name = sessionName(row);
  const when = `on ${formatDate(row.starts_at)} at ${formatTimeRange(row.starts_at, row.ends_at)}`;

  switch (row.issues[0].type) {
    case "missed":
      return `You have missed ${name} ${when}. No students were marked.`;

    case "status_not_set":
      return `You forgot to update the status of ${name} ${when}. All students are marked, so you can set it to completed.`;

    case "attendance_incomplete":
    case "attendance_missing": {
      const n = unmarkedOf(row);
      return `You have forgotten to mark (${n}) ${plural(n, "student", "students")} at ${name} ${when}`;
    }
  }
}

/**
 * 1 issue   -> "You have forgotten to mark (2) students at Thermodynamics Class on October 2, 2026 at 12:00 AM - 3:30 AM"
 * 2+ issues -> "You have missed 2 Classes and forgot to mark students attendance on 3 Classes"
 */
export function buildIssueMessage(rows: SessionIssueRow[]) {
  if (rows.length === 0) return null;

  if (rows.length === 1) {
    return { title: "Class Issue", body: singleIssueMessage(rows[0]) };
  }

  const hasType = (row: SessionIssueRow, ...types: string[]) =>
    row.issues.some((i) => types.includes(i.type));

  const missed = rows.filter((r) => hasType(r, "missed")).length;
  const attendance = rows.filter((r) => hasType(r, "attendance_missing", "attendance_incomplete")).length;
  const status = rows.filter((r) => hasType(r, "status_not_set")).length;

  const parts: string[] = [];
  if (missed) parts.push(`missed ${missed} ${plural(missed, "Class", "Classes")}`);
  if (attendance)
    parts.push(
      `forgot to mark students attendance on ${attendance} ${plural(attendance, "Class", "Classes")}`
    );
  if (status)
    parts.push(`forgot to update the status of ${status} ${plural(status, "Class", "Classes")}`);

  const joined =
    parts.length <= 2
      ? parts.join(" and ")
      : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;

  return { title: "Class Issues", body: `You have ${joined}` };
}

/* -------------------------------------------------------------------------- */
/*  Setup + permission                                                        */
/* -------------------------------------------------------------------------- */

export async function requestNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

/** Call once when the app starts. Returns whether notifications are allowed. */
export async function configureNotifications() {
  // show notifications even while the app is open
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_REMINDERS, {
      name: "Class reminders",
      importance: Notifications.AndroidImportance.HIGH,
    });
    await Notifications.setNotificationChannelAsync(CHANNEL_ISSUES, {
      name: "Class issues",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  return requestNotificationPermission();
}

/* -------------------------------------------------------------------------- */
/*  1. Class reminders: 10 minutes and 1 minute before                        */
/* -------------------------------------------------------------------------- */

const reminderId = (sessionId: string, minutes: number) =>
  `${REMINDER_PREFIX}:${sessionId}:${minutes}`;

/**
 * Rebuilds the reminders for the next 7 days. Old reminders are removed first,
 * so moved, cancelled, completed or deleted classes never fire a stale one.
 */
async function scheduleClassReminders(now: Date) {
  const to = new Date(now);
  to.setDate(to.getDate() + REMINDER_WINDOW_DAYS);

  const sessions = await getClassSessions({ from: now, to });

  const desired: { session: ClassSessionRow; minutes: number; fireAt: number }[] = [];
  for (const session of sessions) {
    if (session.status !== "scheduled") continue;

    const startMs = Date.parse(session.starts_at);
    if (startMs <= now.getTime()) continue;

    for (const minutes of REMINDER_MINUTES) {
      const fireAt = startMs - minutes * 60_000;
      if (fireAt <= now.getTime() + 1000) continue; // that moment already passed
      desired.push({ session, minutes, fireAt });
    }
  }

  const toSchedule = desired.sort((a, b) => a.fireAt - b.fireAt).slice(0, MAX_SCHEDULED);

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(`${REMINDER_PREFIX}:`))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );

  for (const { session, minutes, fireAt } of toSchedule) {
    await Notifications.scheduleNotificationAsync({
      identifier: reminderId(session.id, minutes),
      content: {
        title: `Class starting in ${minutes} ${plural(minutes, "minute", "minutes")}`,
        body: `${sessionName(session)} • ${formatTimeRange(session.starts_at, session.ends_at)}`,
        data: { kind: "class-reminder", sessionId: session.id, minutes },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(fireAt),
        channelId: CHANNEL_REMINDERS,
      },
    });
  }
}

/* -------------------------------------------------------------------------- */
/*  2. Class issues                                                           */
/* -------------------------------------------------------------------------- */

let lastIssueBody: string | null = null;

/**
 * Looks at the classes that already ended and notifies the teacher about what
 * they forgot. The same text is not sent twice (it is skipped while it is still
 * in the notification tray), and the notification is cleared once nothing is left.
 */
async function notifyClassIssues(now: Date) {
  const rows = await getSessionIssues({ now });
  const message = buildIssueMessage(rows);

  if (!message) {
    lastIssueBody = null;
    await Notifications.dismissNotificationAsync(ISSUES_ID).catch(() => { });
    return;
  }

  if (message.body === lastIssueBody) return;

  const presented = await Notifications.getPresentedNotificationsAsync();
  const alreadyShown = presented.some(
    (n) => n.request.identifier === ISSUES_ID && n.request.content.body === message.body
  );
  if (alreadyShown) {
    lastIssueBody = message.body;
    return;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: ISSUES_ID, // a newer issue message replaces the old one
    content: {
      title: message.title,
      body: message.body,
      data: { kind: "class-issues" },
    },
    trigger: Platform.OS === "android" ? { channelId: CHANNEL_ISSUES } : null, // null = now
  });
  lastIssueBody = message.body;
}

/* -------------------------------------------------------------------------- */
/*  Sync (call this whenever the data may have changed)                       */
/* -------------------------------------------------------------------------- */

let running: Promise<void> | null = null;
let rerun = false;

async function doSync() {
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return; // never prompt from here (it also runs in the background)

  const now = new Date();
  await Promise.all([scheduleClassReminders(now), notifyClassIssues(now)]);
}

/**
 * Reschedules the class reminders and sends the issue notification if needed.
 * Safe to call often: overlapping calls are merged into one extra run.
 */
export function syncNotifications(): Promise<void> {
  if (running) {
    rerun = true;
    return running;
  }

  running = (async () => {
    do {
      rerun = false;
      await doSync();
    } while (rerun);
  })().finally(() => {
    running = null;
  });

  return running;
}

/* -------------------------------------------------------------------------- */
/*  In-app notification list (built from the same queries, nothing stored)    */
/* -------------------------------------------------------------------------- */

export type AppNotification = {
  id: string;
  type: "issue" | "upcoming";
  severity: "error" | "warning" | "info";
  title: string;
  body: string;
  /** when it happened (issue: end of the class) or will happen (upcoming: start) */
  time: string;
  sessionId: string;
};

/**
 * What the app can show in its notification list:
 *  - summary: the same text the phone notification uses (null when there are no issues)
 *  - items:   classes starting in the next 24 hours (soonest first), then each issue (newest first)
 */
export async function getNotificationFeed(now: Date = new Date()) {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [rows, upcoming] = await Promise.all([
    getSessionIssues({ now }),
    getClassSessions({ from: now, to: tomorrow }),
  ]);

  const upcomingItems: AppNotification[] = upcoming
    .filter((s) => s.status === "scheduled" && Date.parse(s.starts_at) > now.getTime())
    .map((s) => ({
      id: `upcoming:${s.id}`,
      type: "upcoming",
      severity: "info",
      title: "Upcoming class",
      body: `${sessionName(s)} • ${formatTimeRange(s.starts_at, s.ends_at)}`,
      time: s.starts_at,
      sessionId: s.id,
    }));

  const issueItems: AppNotification[] = rows.map((row) => ({
    id: `issue:${row.id}`,
    type: "issue",
    severity: row.severity,
    title: row.issues[0].title,
    body: singleIssueMessage(row),
    time: row.ends_at,
    sessionId: row.id,
  }));

  return { summary: buildIssueMessage(rows), items: [...upcomingItems, ...issueItems] };
}