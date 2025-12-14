import { getNotificationStats } from "@/utils/apiEndpoints";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useState, useEffect } from "react";
import { Image, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GradientBackground from "./GradientBackground";
import { useAuthStore } from "@/utils/authStore";
import { useHaptic } from "@/hooks/useHaptics";
const { trigger } = useHaptic();

interface ScreenWrapperProps {
  statusBarStyle?: "light-content" | "dark-content";
}

interface NotificationStats {
  unread_count: number;
  total_count: number;
  latest_notification?: any;
}

const SEARCH_TERMS = [
  "Search for products...",
  "Find great deals...",
  "Discover new items...",
  "What are you looking for?",
  "Search electronics...",
  "Browse fashion...",
  "Explore home goods...",
  "Find your next purchase...",
];

export default function Header({
  statusBarStyle = "dark-content",
}: ScreenWrapperProps) {
  const edgeInsets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [notificationStats, setNotificationStats] =
    useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchPlaceholder, setSearchPlaceholder] = useState(SEARCH_TERMS[0]);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Compute display name
  const displayName = user?.username || user?.email?.split("@")[0] || "User";
  const initials = (
    user?.username?.charAt(0) ||
    user?.email?.charAt(0) ||
    "U"
  ).toUpperCase();

  // Auto-alternating search placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => {
        const nextIndex = (prev + 1) % SEARCH_TERMS.length;
        setSearchPlaceholder(SEARCH_TERMS[nextIndex]);
        return nextIndex;
      });
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Load notification stats
  const loadNotificationStats = async () => {
    try {
      setLoading(true);
      const stats: NotificationStats = await getNotificationStats();
      setNotificationStats(stats);
    } catch (error) {
      console.error("Failed to load notification stats:", error);
      setNotificationStats(null);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(statusBarStyle);
      loadNotificationStats();
    }, [statusBarStyle])
  );

  useEffect(() => {
    loadNotificationStats();
  }, []);

  const unreadCount = notificationStats?.unread_count || 0;

  const handleSearchPress = async () => {
    await trigger("light");
    router.push("/(tabs)/(category)/categorymain"); // Navigate to search page
  };

  return (
    <View style={{ backgroundColor: "transparent" }}>
      <View
        style={{
          paddingHorizontal: 20,
          marginTop: edgeInsets.top + 10,
        }}
      >
        {/* Top Row: Profile and Notification */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 10,
          }}
        >
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
            {/* Real Avatar with Initials */}
            <View
              style={{
                width: 55,
                height: 55,
                borderRadius: 33,
                backgroundColor: "#FFFFFF",
                justifyContent: "center",
                alignItems: "center",
                marginRight: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: "#1A1A1A",
                }}
              >
                {initials}
              </Text>
            </View>

            {/* Greeting and Real Name */}
            <View>
              <Text style={{ fontSize: 15, color: "#666", fontWeight: "500" }}>
                Welcome Back
              </Text>
              <Text
                style={{
                  fontSize: 18,
                  color: "#000",
                  fontWeight: "800",
                  marginTop: 0,
                }}
              >
                {displayName}
              </Text>
            </View>
          </View>

          <View style={{ flex: 1, alignItems: "center" }}>
            {/* header center */}
          </View>

          <View style={{ flex: 1, alignItems: "flex-end", flexDirection: "row", justifyContent: "flex-end", gap: 10 }}>
            {/* Wishlist Icon */}
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 25,
                backgroundColor: "#FFFFFF",
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={async () => {
                await trigger("light");
                router.push("/wishlist");
              }}
            >
              <Ionicons
                name="heart-outline"
                size={20}
                color="#000"
              />
            </TouchableOpacity>

            {/* Notification Bell */}
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 25,
                backgroundColor: "#FFFFFF",
                justifyContent: "center",
                alignItems: "center",
                position: "relative",
              }}
              onPress={async () => {
                await trigger(unreadCount > 0 ? "success" : "light");
                router.push("/notificationHome");
              }}
              disabled={loading}
            >
              <Ionicons
                name={unreadCount > 0 ? "notifications" : "notifications-outline"}
                size={20}
                color="#000"
              />

              {/* Notification Badge */}
              {unreadCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    backgroundColor: "#FF3B30",
                    borderRadius: 10,
                    minWidth: 20,
                    height: 20,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 2,
                    borderWidth: 2,
                    borderColor: "#FFFFFF",
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 11,
                      fontWeight: "bold",
                      includeFontPadding: false,
                    }}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            marginTop: 12,
            marginBottom: 10,
          }}
          onPress={handleSearchPress}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={20} color="#999" />
          <Text
            style={{
              flex: 1,
              marginLeft: 12,
              fontSize: 15,
              color: "#999",
              fontWeight: "500",
            }}
            numberOfLines={1}
          >
            {searchPlaceholder}
          </Text>
          <Ionicons name="options-outline" size={18} color="#999" />
        </TouchableOpacity>
      </View>

      <GradientBackground />
    </View>
  );
}