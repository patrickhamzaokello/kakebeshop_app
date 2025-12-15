import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
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

interface NotificationMetadata {
  userId: string;
  notificationType: "breaking_news" | "scheduled_digest";
  articleId?: string;
  articleIds?: string[];
  articleCount?: number;
  priority?: string;
  source: string;
}

interface PushNotificationManagerProps extends PropsWithChildren {
  // Optional navigation prop if you want to pass navigation from parent
  onNotificationTap?: (metadata: NotificationMetadata) => void;
}

const PushNotificationManager: React.FC<PushNotificationManagerProps> = ({
  children,
  onNotificationTap,
}) => {
  // Handle notification tap navigation
  const handleNotificationTap = (metadata: NotificationMetadata | any) => {
    console.log("Notification tapped with metadata:", metadata);

    if (onNotificationTap) {
      // Use callback if provided
      onNotificationTap(metadata);
      return;
    }

    // Default navigation handling based on notification type
    switch (metadata.notificationType) {
      case "breaking_news":
        // Navigate to single listing
        if (metadata.articleId) {
          console.log(`Navigating to article: ${metadata.articleId}`);

          router.push(`/article/${metadata.articleId}`);
        }
        break;

      case "scheduled_digest":
        router.push({
          pathname: "/(tabs)/(home)/notification/DailyDigestScreen",
          params: {
            articleIds: JSON.stringify(metadata.articleIds || []),
            articleCount: metadata.articleCount,
            title: "Scheduled Digest",
          },
        });

        break;

      default:
        console.warn("Unknown notification type, navigating to default screen");

        break;
    }
  };

  //Register for push notification
  const registerForPushNotificationsAsync = async (): Promise<
    string | undefined
  > => {
    let token;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      //Request permission if not already granted
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // check if permission are granted
      if (finalStatus !== "granted") {
        console.warn("Failed to get push token for push notification!");
        return;
      }

      // Get Expo Push Token
      try {
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants?.easConfig?.projectId;
        if (!projectId) {
          console.error("No project ID found. Please configure in app.json");
          return;
        }

        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
          })
        ).data;

        console.log("Project ID:", projectId);

        await postNotificationToken(token, "device", Platform.OS);
        // console.log('Push Notification Token:', token);

        return token;
      } catch (error) {
        console.error("Detail Error getting push token:", error);

        if (error instanceof Error) {
          console.error("Error name:", error.name);
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }

        return;
      }
    } else {
      console.warn("Must use physical device for Push Notifications");
    }

    return token;
  };

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {

        console.log("Push notification token:", token);
      }
    });

    //Notification received listener
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log(
          "Notification Received:",
          notification.request.content.data
        );
      }
    );

    //Notification tap listener - ENHANCED
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("Notification Response:", response);

        const metadata = response.notification.request.content.data;
        console.log("Notification metadata:", metadata);

        // Extract metadata from notification data

        if (metadata) {
          handleNotificationTap(metadata);
        } else {
          console.warn(
            "No metadata found in notification, navigating to default screen"
          );
        }
      });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return <>{children}</>;
};

export default PushNotificationManager;
