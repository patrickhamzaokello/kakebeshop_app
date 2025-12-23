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
          router.push(`/listing/${metadata.articleId}`);
        }
        break;

      case "scheduled_digest":
        router.push({
          pathname: "/notifications",
          params: {
            articleIds: JSON.stringify(metadata.articleIds || []),
            articleCount: metadata.articleCount,
            title: "Scheduled Digest",
          },
        });

        break;

      default:
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
        return;
      }

      // Get Expo Push Token
      try {
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants?.easConfig?.projectId;
        if (!projectId) {
          return;
        }

        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
          })
        ).data;

        await postNotificationToken(token, "device", Platform.OS);

        return token;
      } catch (error) {
        if (error instanceof Error) {
        }

        return;
      }
    } else {
    }

    return token;
  };

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
      }
    });

    //Notification received listener
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {}
    );

    //Notification tap listener - ENHANCED
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const metadata = response.notification.request.content.data;

        // Extract metadata from notification data

        if (metadata) {
          handleNotificationTap(metadata);
        } else {
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
