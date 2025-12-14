import { getNotificationStats } from "@/utils/apiEndpoints";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useState, useEffect, useRef } from "react";
import { Image, StatusBar, Text, TouchableOpacity, View, FlatList, Dimensions } from "react-native";
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

// Carousel banner data - replace with your actual images/promotions
const CAROUSEL_DATA = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80",
    title: "Summer Sale",
    subtitle: "Up to 50% off",
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
    title: "New Arrivals",
    subtitle: "Check out latest products",
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80",
    title: "Flash Deals",
    subtitle: "Limited time offers",
  },
  {
    id: "4",
    image: "https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=800&q=80",
    title: "Free Shipping",
    subtitle: "On orders over $50",
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CAROUSEL_WIDTH = SCREEN_WIDTH - 40; // Account for padding

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
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const carouselRef = useRef<FlatList>(null);

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

  // Auto-slide carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCarouselIndex((prev) => {
        const nextIndex = (prev + 1) % CAROUSEL_DATA.length;
        carouselRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, 4000); // Change every 4 seconds

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
    router.push("/search"); // Navigate to search page
  };

  const handleCarouselScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / CAROUSEL_WIDTH);
    setCurrentCarouselIndex(index);
  };

  const renderCarouselItem = ({ item }: { item: typeof CAROUSEL_DATA[0] }) => (
    <TouchableOpacity
      style={{
        width: CAROUSEL_WIDTH,
        height: 250,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#F5F5F5",
      }}
      activeOpacity={0.9}
      onPress={() => {
        // Navigate to promotion detail or category
        console.log("Carousel item pressed:", item.id);
      }}
    >
      <Image
        source={{ uri: item.image }}
        style={{
          width: "100%",
          height: "100%",
        }}
        resizeMode="cover"
      />
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          padding: 16,
        }}
      >
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 20,
            fontWeight: "800",
            marginBottom: 4,
          }}
        >
          {item.title}
        </Text>
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: "500",
          }}
        >
          {item.subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );

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

        {/* Image Carousel */}
        <View style={{ marginTop: 16, marginBottom: 10 }}>
          <FlatList
            ref={carouselRef}
            data={CAROUSEL_DATA}
            renderItem={renderCarouselItem}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            onScroll={handleCarouselScroll}
            scrollEventThrottle={16}
            snapToInterval={CAROUSEL_WIDTH}
            decelerationRate="fast"
            contentContainerStyle={{ paddingRight: 0 }}
            getItemLayout={(data, index) => ({
              length: CAROUSEL_WIDTH,
              offset: CAROUSEL_WIDTH * index,
              index,
            })}
            onScrollToIndexFailed={() => {
              // Handle scroll failure
            }}
          />

          {/* Pagination Dots */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              marginTop: 9,
            }}
          >
            {CAROUSEL_DATA.map((_, index) => (
              <View
                key={index}
                style={{
                  width: currentCarouselIndex === index ? 24 : 8,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor:
                    currentCarouselIndex === index ? "#000" : "#D1D1D1",
                  marginHorizontal: 2,
                }}
              />
            ))}
          </View>
        </View>
      </View>

      <GradientBackground />
    </View>
  );
}