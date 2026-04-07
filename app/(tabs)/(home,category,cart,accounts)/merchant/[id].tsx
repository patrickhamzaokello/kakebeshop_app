import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
  Dimensions,
  Animated,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import { merchantBase } from "@/utils/services/merchantService";
import { MerchantDetails, Listing } from "@/utils/types/models";
import { ListingImage } from "@/components/test/common/ListingImage";

const { width: W } = Dimensions.get("window");
const PAD = 16;
const GAP = 10;
const CARD_W = (W - PAD * 2 - GAP) / 2;
const BANNER_H = 210;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(listing: Listing): string {
  if (listing.price_type === "ON_REQUEST") return "Price on request";
  if (listing.price_type === "RANGE" && listing.price_min && listing.price_max)
    return `${listing.currency} ${parseInt(listing.price_min).toLocaleString()} – ${parseInt(listing.price_max).toLocaleString()}`;
  if (listing.price_type === "FIXED" && listing.price)
    return `${listing.currency} ${parseInt(listing.price).toLocaleString()}`;
  return "—";
}

function memberSince(dateString: string): string {
  const months = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24 * 30)
  );
  if (months < 1) return "New";
  if (months < 12) return `${months}mo`;
  const y = Math.floor(months / 12);
  return `${y}yr${y > 1 ? "s" : ""}`;
}

// ─── Listing card ─────────────────────────────────────────────────────────────

function ListingCard({ item, colors }: { item: Listing; colors: any }) {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() => router.push({ pathname: "/listing/[id]", params: { id: item.id } })}
      activeOpacity={0.85}
    >
      <View style={styles.cardImageWrap}>
        <ListingImage primaryImage={item.primary_image} style={styles.cardImage as any} />
        {item.is_featured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={9} color="#fff" />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.cardPrice, { color: colors.primary }]} numberOfLines={1}>
          {formatPrice(item)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Stat chip ────────────────────────────────────────────────────────────────

function StatChip({ value, label, colors }: { value: string | number; label: string; colors: any }) {
  return (
    <View style={styles.statChip}>
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MerchantProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [merchant, setMerchant] = useState<MerchantDetails | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingListings, setLoadingListings] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  const headerBg = scrollY.interpolate({
    inputRange: [BANNER_H - 60, BANNER_H],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const bannerScale = scrollY.interpolate({
    inputRange: [-60, 0],
    outputRange: [1.08, 1],
    extrapolate: "clamp",
  });

  const load = useCallback(async () => {
    try {
      const [profile, products] = await Promise.all([
        merchantBase.merchantProfile(id),
        merchantBase.merchantProducts(id, 1, 40),
      ]);
      setMerchant(profile);
      setListings(products ?? []);
    } catch {
      Alert.alert("Error", "Failed to load merchant profile");
    } finally {
      setLoadingProfile(false);
      setLoadingListings(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i < Math.floor(rating) ? "star" : "star-outline"}
        size={12}
        color="#FFB800"
      />
    ));

  if (loadingProfile) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!merchant) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={52} color={colors.textMuted} />
        <Text style={[styles.notFoundText, { color: colors.textMuted }]}>Merchant not found</Text>
        <TouchableOpacity style={[styles.backPill, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
          <Text style={{ color: "#fff", fontWeight: "600" }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Header content (scrolls with the list) ──
  const Header = (
    <View>
      {/* Banner */}
      <View style={{ height: BANNER_H }}>
        <Animated.View style={[styles.banner, { transform: [{ scale: bannerScale }] }]}>
          {merchant.cover_image ? (
            <Image source={{ uri: merchant.cover_image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <LinearGradient
              colors={isDark ? ["#1A1A2E", "#16213E"] : ["#E60549", "#FF6B6B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.4)"]}
            style={styles.bannerScrim}
          />
        </Animated.View>

        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {merchant.logo ? (
            <Image source={{ uri: merchant.logo }} style={styles.avatar} resizeMode="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="storefront" size={32} color={colors.primary} />
            </View>
          )}
          {merchant.verified && (
            <View style={[styles.verifiedBadge, { backgroundColor: colors.surface }]}>
              <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
            </View>
          )}
        </View>
      </View>

      {/* Info section */}
      <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
        {/* Name row */}
        <View style={styles.nameRow}>
          <Text style={[styles.storeName, { color: colors.textPrimary }]}>{merchant.display_name}</Text>
          {merchant.verified && (
            <View style={styles.verifiedChip}>
              <Ionicons name="shield-checkmark" size={10} color="#4CAF50" />
              <Text style={styles.verifiedChipText}>Verified</Text>
            </View>
          )}
        </View>

        {merchant.business_name !== merchant.display_name && (
          <Text style={[styles.businessName, { color: colors.textMuted }]}>{merchant.business_name}</Text>
        )}

        {/* Stars */}
        <View style={styles.ratingRow}>
          <View style={{ flexDirection: "row", gap: 2 }}>{renderStars(merchant.rating)}</View>
          <Text style={[styles.ratingNum, { color: colors.textSecondary }]}>
            {merchant.rating > 0 ? merchant.rating.toFixed(1) : "—"}
          </Text>
          {merchant.total_reviews > 0 && (
            <Text style={[styles.ratingReviews, { color: colors.textMuted }]}>
              ({merchant.total_reviews})
            </Text>
          )}
        </View>

        {/* Description */}
        {!!merchant.description && (
          <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={3}>
            {merchant.description}
          </Text>
        )}

        {/* Stats */}
        <View style={[styles.statsRow, { backgroundColor: colors.backgroundSecondary }]}>
          <StatChip value={listings.length} label="Listings" colors={colors} />
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <StatChip value={merchant.total_reviews ?? 0} label="Reviews" colors={colors} />
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <StatChip value={memberSince(merchant.created_at)} label="Member" colors={colors} />
        </View>

        {/* Contact pills */}
        <View style={styles.contactRow}>
          {!!merchant.business_phone && (
            <TouchableOpacity
              style={[styles.contactPill, { backgroundColor: "#E6054910", borderColor: "#E6054930" }]}
              onPress={() => Linking.openURL(`tel:${merchant.business_phone.replace(/\s/g, "")}`)}
              activeOpacity={0.75}
            >
              <Ionicons name="call" size={14} color="#E60549" />
              <Text style={[styles.contactPillText, { color: "#E60549" }]}>{merchant.business_phone}</Text>
            </TouchableOpacity>
          )}
          {!!merchant.business_email && (
            <TouchableOpacity
              style={[styles.contactPill, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
              onPress={() => Linking.openURL(`mailto:${merchant.business_email}`)}
              activeOpacity={0.75}
            >
              <Ionicons name="mail-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.contactPillText, { color: colors.textSecondary }]}>{merchant.business_email}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Listings header */}
      <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Listings
          {listings.length > 0 && <Text style={{ color: colors.primary }}> · {listings.length}</Text>}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Collapsing sticky header */}
      <Animated.View
        style={[styles.stickyBar, { paddingTop: insets.top, opacity: headerBg, backgroundColor: colors.surface }]}
        pointerEvents="none"
      >
        <Text style={[styles.stickyTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {merchant.display_name}
        </Text>
      </Animated.View>

      {/* Floating back button */}
      <SafeAreaView edges={["top"]} style={styles.floatingNav} pointerEvents="box-none">
        <TouchableOpacity style={styles.floatingBackBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>

      <Animated.FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={Header}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            progressViewOffset={BANNER_H}
          />
        }
        renderItem={({ item }) => <ListingCard item={item} colors={colors} />}
        ListEmptyComponent={
          loadingListings ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No listings yet</Text>
              <Text style={[styles.emptyMsg, { color: colors.textMuted }]}>
                This seller hasn't posted any products yet
              </Text>
            </View>
          )
        }
        ListFooterComponent={<View style={{ height: 32 }} />}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 60 },
  notFoundText: { fontSize: 15 },
  backPill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 4 },

  stickyBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    height: 56 + 44,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stickyTitle: { fontSize: 16, fontWeight: "700" },

  floatingNav: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 30,
    padding: 12,
  },
  floatingBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },

  banner: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  bannerScrim: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },

  avatarWrap: {
    position: "absolute",
    bottom: -40,
    left: PAD,
    zIndex: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: "#fff",
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    borderRadius: 10,
    padding: 1,
  },

  infoSection: {
    paddingTop: 52,
    paddingHorizontal: PAD,
    paddingBottom: 20,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 2,
  },
  storeName: { fontSize: 20, fontWeight: "800", letterSpacing: -0.3, flexShrink: 1 },
  verifiedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },
  verifiedChipText: { fontSize: 10, fontWeight: "700", color: "#4CAF50" },
  businessName: { fontSize: 13, marginBottom: 6 },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 10,
  },
  ratingNum: { fontSize: 13, fontWeight: "700" },
  ratingReviews: { fontSize: 12 },

  description: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 14,
  },
  statChip: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
  statLabel: { fontSize: 11, fontWeight: "500" },
  statDivider: { width: 1, height: 26 },

  contactRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  contactPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  contactPillText: { fontSize: 13, fontWeight: "600" },

  sectionHeader: {
    paddingHorizontal: PAD,
    paddingTop: 18,
    paddingBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800" },

  gridContent: { paddingHorizontal: PAD, paddingBottom: 8 },
  gridRow: { gap: GAP, marginBottom: GAP },

  card: {
    width: CARD_W,
    borderRadius: 14,
    overflow: "hidden",
  },
  cardImageWrap: {
    width: "100%",
    height: CARD_W,
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
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
    borderRadius: 20,
  },
  featuredText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  cardBody: { padding: 10, gap: 3 },
  cardTitle: { fontSize: 12.5, fontWeight: "600", lineHeight: 18 },
  cardPrice: { fontSize: 13, fontWeight: "800" },

  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyMsg: { fontSize: 13, textAlign: "center", lineHeight: 20 },
});
