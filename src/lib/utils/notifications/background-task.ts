import { syncNotifications } from "@/lib/utils/notifications/index";
import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";

/**
 * Lets the phone check for class issues even when the app is closed.
 * The OS decides when it runs (roughly every 15+ minutes, not guaranteed).
 *
 * Import this file once at the app entry (root _layout) so the task is
 * defined, then call registerNotificationBackgroundTask() on start.
 */

const TASK_NAME = "sync-class-notifications";

TaskManager.defineTask(TASK_NAME, async () => {
  try {
    await syncNotifications();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (e) {
    console.error(e);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerNotificationBackgroundTask() {
  if (await TaskManager.isTaskRegisteredAsync(TASK_NAME)) return;
  await BackgroundTask.registerTaskAsync(TASK_NAME, { minimumInterval: 15 }); // minutes
}