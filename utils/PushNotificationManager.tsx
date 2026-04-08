import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import React, { PropsWithChildren, useEffect } from "react";
import { Platform } from "react-native";
import { postNotificationToken } from "./apiEndpoints";
import { router } from "expo-router";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─── Notification payload types ───────────────────────────────────────────────

type NotificationData =
  | { type: "order_update"; order_id: string }
  | { type: "new_order"; order_id: string }
  | { type: "new_listing"; listing_id: string }
  | { type: "promotion" }
  | { type: string; [key: string]: string }; // fallback for unknown types

// ─── Device ID ────────────────────────────────────────────────────────────────

const DEVICE_ID_KEY = "kakebe_device_id";

async function getOrCreateDeviceId(): Promise<string> {
  try {
    const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (stored) return stored;

    // Generate a simple unique ID from timestamp + random
    const newId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    await SecureStore.setItemAsync(DEVICE_ID_KEY, newId);
    return newId;
  } catch {
    return `fallback-${Date.now()}`;
  }
}

// ─── Tap navigation ───────────────────────────────────────────────────────────

function handleNotificationTap(data: NotificationData) {
  switch (data.type) {
    case "order_update":
    case "new_order":
      if (data.order_id) {
        router.push({ pathname: "/orderDetails/[id]", params: { id: data.order_id } });
      }
      break;

    case "new_listing":
      if (data.listing_id) {
        router.push({ pathname: "/listing/[id]", params: { id: data.listing_id } });
      }
      break;

    case "promotion":
      router.push("/(tabs)/(home)");
      break;

    default:
      break;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const PushNotificationManager: React.FC<PropsWithChildren> = ({ children }) => {
  const registerForPushNotificationsAsync = async (): Promise<string | undefined> => {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#E60549",
      });
    }

    if (!Device.isDevice) {
      if (__DEV__) console.log("[Push] Skipped — not a physical device");
      return;
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    const finalStatus =
      existing === "granted"
        ? existing
        : (await Notifications.requestPermissionsAsync()).status;

    if (finalStatus !== "granted") {
      if (__DEV__) console.log("[Push] Permission denied");
      return;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      if (__DEV__) console.warn("[Push] No EAS project ID found");
      return;
    }

    try {
      const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
      const deviceId = await getOrCreateDeviceId();
      await postNotificationToken(token, deviceId, Platform.OS);
      if (__DEV__) console.log("[Push] Token registered:", token);
      return token;
    } catch (error) {
      if (__DEV__) console.error("[Push] Token registration failed:", error);
    }
  };

  useEffect(() => {
    registerForPushNotificationsAsync();

    // Handle notifications received while the app is foregrounded
    const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
      if (__DEV__) console.log("[Push] Received in foreground:", notification.request.content.title);
    });

    // Handle taps while the app is running (background or foreground)
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as NotificationData;
      if (data?.type) handleNotificationTap(data);
    });

    // Handle taps that launched the app from a killed state
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = response.notification.request.content.data as NotificationData;
      if (data?.type) handleNotificationTap(data);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  return <>{children}</>;
};

export default PushNotificationManager;
