import * as Notifications from "expo-notifications";

export async function testLocalNotification(): Promise<void> {
  try {
    const permission = await Notifications.requestPermissionsAsync();

    if (permission.status !== "granted") {
      console.warn("Notification permission not granted:", permission.status);
      return;
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "IEMS notification test",
        body: "If you can see this, local notifications are working.",
        sound: "default",
      },
      trigger: null, // Deliver immediately
    });

    console.log("Test notification scheduled:", id);
  } catch (error) {
    console.error("Local notification test failed:", error);
  }
}