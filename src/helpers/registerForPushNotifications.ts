import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

export async function registerForPushNotifications(): Promise<string | null> {
  let token: string | null = null;

  // Must be physical device
  if (!Device.isDevice) {
    console.warn("⚠️ Push notifications require a physical device");
    return null;
  }

  // Android notification channel (kept 100%)
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  // Permission flow (unchanged)
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("❌ Permission for notifications was not granted");
    return null;
  }

  // Token generation (unchanged)
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.error("❌ Missing EAS projectId — cannot get push token");
      return null;
    }

    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log("📱 Expo Push Token:", token);
  } catch (error) {
    console.error("❌ Error getting push token:", error);
    return null;
  }

  return token;
}
