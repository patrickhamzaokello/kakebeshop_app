import React, { useEffect, useRef } from "react";
import { Text } from "@/components/Text";
import { View, ScrollView, TouchableOpacity, StyleSheet, Animated, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Listing } from "@/utils/types/models";
import { SectionHeader } from "@/components/test/common/SectionHeader";
import { ListingImage } from "@/components/test/common/ListingImage";
import { useTheme } from "@/contexts/ThemeContext";

const CARD_WIDTH = 160;
const IMAGE_HEIGHT = 155;

interface FeaturedListingsProps {
  data: Listing[] | null;
  loading: boolean;
  onListingPress: (listing: Listing) => void;
  onSeeAll?: () => void;
}

// ─── Shimmer ────────────────────────────────────────────────────────────────

const ShimmerPlaceholder: React.FC<{ style?: any }> = ({ style }) => {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });

  return (
    <Animated.View style={[{ backgroundColor: colors.border, opacity }, style]} />
  );
};

const CardSkeleton: React.FC = () => {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <ShimmerPlaceholder style={styles.cardImage} />
      <View style={styles.cardBody}>
        <ShimmerPlaceholder style={{ height: 10, width: "55%", borderRadius: 4, marginBottom: 8 }} />
        <ShimmerPlaceholder style={{ height: 13, width: "90%", borderRadius: 4, marginBottom: 6 }} />
        <ShimmerPlaceholder style={{ height: 13, width: "70%", borderRadius: 4, marginBottom: 10 }} />
        <ShimmerPlaceholder style={{ height: 16, width: "60%", borderRadius: 4, marginBottom: 8 }} />
        <ShimmerPlaceholder style={{ height: 10, width: "80%", borderRadius: 4 }} />
      </View>
    </View>
  );
};

// ─── Price formatter ─────────────────────────────────────────────────────────

const formatPrice = (listing: Listing): string => {
  if (listing.price_type === "ON_REQUEST") return "Price on request";
  const currency = listing.currency || "UGX";
  if (listing.price_type === "RANGE") {
    const min = parseInt(listing.price_min || "0").toLocaleString();
    const max = parseInt(listing.price_max || "0").toLocaleString();
    return `${currency} ${min} – ${max}`;
  }
  return `${currency} ${parseInt(listing.price || "0").toLocaleString()}`;
};

// ─── Card ────────────────────────────────────────────────────────────────────

const ListingCard: React.FC<{ listing: Listing; onPress: () => void }> = ({
  listing,
  onPress,
}) => {
  const { colors } = useTheme();
  const isOnRequest = listing.price_type === "ON_REQUEST";

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {/* Image */}
      <View style={styles.imageWrapper}>
        <ListingImage primaryImage={listing.primary_image} style={styles.cardImage} />

        {/* Featured badge */}
        {listing.is_featured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={9} color="#fff" />
            <Text style={styles.featuredBadgeText}>Featured</Text>
          </View>
        )}

        {/* Listing type pill */}
        <View style={[styles.typePill, { backgroundColor: "rgba(0,0,0,0.52)" }]}>
          <Text style={styles.typePillText}>
            {listing.listing_type === "SERVICE" ? "Service" : "Product"}
          </Text>
        </View>
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        {/* Category */}
        {listing.category_name ? (
          <View style={[styles.categoryTag, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.categoryText, { color: colors.primary }]} numberOfLines={1}>
              {listing.category_name}
            </Text>
          </View>
        ) : null}

        {/* Title */}
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {listing.title}
        </Text>

        {/* Price */}
        <Text
          style={[
            styles.price,
            isOnRequest
              ? { color: colors.textMuted, fontSize: 11, fontWeight: "500" }
              : { color: colors.primary },
          ]}
          numberOfLines={1}
        >
          {formatPrice(listing)}
        </Text>

        {/* Merchant row */}
        <View style={styles.merchantRow}>
          <Ionicons name="storefront-outline" size={11} color={colors.textMuted} />
          <Text style={[styles.merchantName, { color: colors.textMuted }]} numberOfLines={1}>
            {listing.merchant?.display_name || "Merchant"}
          </Text>
          {listing.merchant?.verified && (
            <Ionicons name="checkmark-circle" size={11} color="#4CAF50" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main export ─────────────────────────────────────────────────────────────

export const FeaturedListings: React.FC<FeaturedListingsProps> = ({
  data,
  loading,
  onListingPress,
  onSeeAll,
}) => {
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={styles.container}>
        <SectionHeader title="Trending" onSeeAll={onSeeAll} showSeeAll={!!onSeeAll} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          scrollEnabled={false}
        >
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </ScrollView>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <SectionHeader title="Trending" onSeeAll={onSeeAll} showSeeAll={!!onSeeAll} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {data.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            onPress={() => onListingPress(listing)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },

  // Card
  card: {
    width: CARD_WIDTH,
    borderRadius: 14,
    marginRight: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  // Image area
  imageWrapper: {
    position: "relative",
  },
  cardImage: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: 0,
  },
  featuredBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#E60549",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featuredBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
  typePill: {
    position: "absolute",
    bottom: 8,
    right: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typePillText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 0.2,
  },

  // Body
  cardBody: {
    padding: 10,
    gap: 4,
  },
  categoryTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    marginBottom: 2,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
  price: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  merchantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  merchantName: {
    fontSize: 10,
    flex: 1,
  },
});
