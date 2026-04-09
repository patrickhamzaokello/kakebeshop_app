import React, { useEffect, useState } from "react";
import { Text } from "@/components/Text";
import { View, TouchableOpacity, StyleSheet, Animated, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { HeaderData } from "@/utils/types/models";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";

interface HeaderSectionProps {
  data: HeaderData | null;
  loading: boolean;
  onSearch: () => void;
  onNotificationPress: () => void;
  onWishlistPress: () => void;
}

const SEARCH_TERMS = [
  "Search for products...",
  "Find great deals...",
  "Discover new items...",
  "What are you looking for?",
  "Search electronics...",
  "Browse fashion...",
  "Explore home goods...",
  "Speakers in Lira..",
];

const ShimmerPlaceholder: React.FC<{ style?: any }> = ({ style }) => {
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          backgroundColor: "#E0E0E0",
          opacity,
        },
        style,
      ]}
    />
  );
};

export const HeaderSection: React.FC<HeaderSectionProps> = ({
  data,
  loading,
  onSearch,
  onNotificationPress,
  onWishlistPress,
}) => {
  const { colors } = useTheme();
  const [searchPlaceholder, setSearchPlaceholder] = useState(SEARCH_TERMS[0]);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

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

  if (loading) {
    return (
      <LinearGradient colors={[colors.primarySoft, colors.background]} style={styles.container}>
        <View style={{ flex: 1 }}>
          <SafeAreaView />

          <View style={styles.topRow}>
            <View style={styles.userInfo}>
              {/* Avatar shimmer */}
              <ShimmerPlaceholder
                style={[styles.avatar, { borderRadius: 24 }]}
              />
              <View style={{ flex: 1 }}>
                {/* Welcome text shimmer */}
                <ShimmerPlaceholder
                  style={{
                    width: 140,
                    height: 14,
                    borderRadius: 4,
                    marginBottom: 6,
                  }}
                />
                {/* User name shimmer */}
                <ShimmerPlaceholder
                  style={{
                    width: 180,
                    height: 20,
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>

            <View style={styles.actionButtons}>
              {/* Wishlist button shimmer */}
              <ShimmerPlaceholder
                style={[styles.iconButton, { borderRadius: 4 }]}
              />
              {/* Notification button shimmer */}
              <ShimmerPlaceholder
                style={[styles.iconButton, { borderRadius: 4 }]}
              />
            </View>
          </View>

          {/* Search bar shimmer */}
          <ShimmerPlaceholder
            style={{
              height: 50,
              borderRadius: 4,
              width: "100%",
            }}
          />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.primarySoft, colors.background]} style={styles.container}>
      <View style={{ flex: 1 }}>
        <SafeAreaView />

        <View style={styles.topRow}>
          <View style={styles.userInfo}>
            {data?.profile.profile_image ? (
              <Image
                source={{ uri: data.profile.profile_image }}
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.textPrimary }]}>
                <Text style={[styles.avatarText, { color: colors.textInverse }]}>
                  {data?.profile.name
                    ?.split(" ")
                    .map((word) => word[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "U"}
                </Text>
              </View>
            )}
            <View>
              <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>Hey, Welcome back,</Text>
              <Text style={[styles.userName, { color: colors.textPrimary }]}>{data?.profile.name}</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.iconButton, { }]}
              onPress={onWishlistPress}
            >
              <Ionicons name="heart-outline" size={30} color={colors.iconColor} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconButton, { }]}
              onPress={onNotificationPress}
            >
              <Ionicons name="notifications-outline" size={30} color={colors.iconColor} />
              {(data?.notificationsCount ?? 0) > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.badgeText, { color: colors.textInverse }]}>
                    {data?.notificationsCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.inputBackground,
            borderRadius: 4,
            borderColor: colors.inputBorder,
            borderWidth: 1,
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
          onPress={onSearch}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={20} color={colors.textPlaceholder} />
          <Text
            style={{
              flex: 1,
              marginLeft: 12,
              fontSize: 15,
              color: colors.textPlaceholder,
              fontWeight: "500",
            }}
            numberOfLines={1}
          >
            {searchPlaceholder}
          </Text>
          <Ionicons name="options-outline" size={18} color={colors.textPlaceholder} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
  },
  welcomeText: {
    fontSize: 14,
  },
  userName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    position: "relative",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
});