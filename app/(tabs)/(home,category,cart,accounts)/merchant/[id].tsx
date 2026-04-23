import React, { useEffect, useState, useRef, useCallback } from "react";
import { Text } from "@/components/Text";
import { StyleSheet, View, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Linking, Alert, Dimensions, Animated, StatusBar, Share } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
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
const BANNER_H = 180;
const AVATAR_SIZE = 120;
const AVATAR_OVERLAP = 50;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(listing: Listing): string {
  if (listing.price_type === "ON_REQUEST") return "Price on request";
  if (listing.price_type === "RANGE" && listing.price_min && listing.price_max)
    return `${listing.currency} ${parseInt(
      listing.price_min
    ).toLocaleString()} – ${parseInt(listing.price_max).toLocaleString()}`;
  if (listing.price_type === "FIXED" && listing.price)
    return `${listing.currency} ${parseInt(listing.price).toLocaleString()}`;
  return "—";
}

function memberSince(dateString: string): { value: string; label: string } {
  const now = new Date();
  const joined = new Date(dateString);

  let years = now.getFullYear() - joined.getFullYear();
  let months = now.getMonth() - joined.getMonth();
  if (months < 0) { years--; months += 12; }

  const totalMonths = years * 12 + months;

  const joinLabel = joined.toLocaleDateString("en-US", { month: "short", year: "numeric" });

  if (totalMonths < 1)  return { value: "New",                                          label: `Joined ${joinLabel}` };
  if (totalMonths < 12) return { value: `${totalMonths} mo`,                            label: `Joined ${joinLabel}` };
  if (months === 0)     return { value: `${years} yr${years > 1 ? "s" : ""}`,           label: `Joined ${joinLabel}` };
                        return { value: `${years} yr${years > 1 ? "s" : ""} ${months} mo`, label: `Joined ${joinLabel}` };
}

// ─── Grid card ────────────────────────────────────────────────────────────────

function GridCard({ item, colors }: { item: Listing; colors: any }) {
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

// ─── List row card ─────────────────────────────────────────────────────────────

function RowCard({ item, colors }: { item: Listing; colors: any }) {
  return (
    <TouchableOpacity
      style={[styles.rowCard, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
      onPress={() => router.push({ pathname: "/listing/[id]", params: { id: item.id } })}
      activeOpacity={0.82}
    >
      <View style={styles.rowImageWrap}>
        <ListingImage primaryImage={item.primary_image} style={styles.rowImage as any} />
        {item.is_featured && (
          <View style={styles.rowFeaturedDot}>
            <Ionicons name="star" size={9} color="#fff" />
          </View>
        )}
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.title}
        </Text>
        {item.category_name ? (
          <Text style={[styles.rowCategory, { color: colors.textMuted }]} numberOfLines={1}>
            {item.category_name}
          </Text>
        ) : null}
        <View style={styles.rowFooter}>
          <Text style={[styles.rowPrice, { color: colors.primary }]} numberOfLines={1}>
            {formatPrice(item)}
          </Text>
          {item.is_featured && (
            <View style={styles.rowFeaturedChip}>
              <Text style={styles.rowFeaturedText}>Featured</Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ alignSelf: "center" }} />
    </TouchableOpacity>
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
  const [gridView, setGridView] = useState(true);
  const [notAvailable, setNotAvailable] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
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
    } catch (err: any) {
      if (err?.statusCode === 404) {
        setNotAvailable(true);
      } else {
        Alert.alert("Error", "Failed to load merchant profile");
      }
    } finally {
      setLoadingProfile(false);
      setLoadingListings(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${merchant?.display_name} on our app!`,
      });
    } catch {}
  };

  if (loadingProfile) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (notAvailable) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <SafeAreaView edges={["top"]} style={styles.floatingNav} pointerEvents="box-none">
          <TouchableOpacity style={styles.floatingBtn} onPress={() => router.back()} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View />
        </SafeAreaView>
        <Ionicons name="storefront-outline" size={56} color={colors.textMuted} />
        <Text style={[styles.notFoundTitle, { color: colors.textPrimary }]}>
          Store Not Available
        </Text>
        <Text style={[styles.notFoundText, { color: colors.textMuted }]}>
          This seller's store is not currently available. They may still be setting up their account.
        </Text>
        <TouchableOpacity
          style={[styles.backPill, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!merchant) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons
          name="alert-circle-outline"
          size={52}
          color={colors.textMuted}
        />
        <Text style={[styles.notFoundText, { color: colors.textMuted }]}>
          Merchant not found
        </Text>
        <TouchableOpacity
          style={[styles.backPill, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tenure = memberSince(merchant.created_at);

  // ── Status badge config ───────────────────────────────────────────────────
  const statusConfig = (() => {
    if (merchant.status === "SUSPENDED")
      return { label: "Suspended", color: "#F59E0B", bg: "#FEF3C7", icon: "warning-outline" as const };
    if (merchant.status === "BANNED")
      return { label: "Banned", color: "#EF4444", bg: "#FEE2E2", icon: "ban-outline" as const };
    if (merchant.verified)
      return { label: "Verified", color: "#1D9BF0", bg: "#E8F5FD", icon: "checkmark-circle" as const };
    return { label: "Active", color: "#3B82F6", bg: "#DBEAFE", icon: "checkmark-circle-outline" as const };
  })();

  const Header = (
    <View>
      {/* ── Banner ── */}
      <View style={{ position: "relative", zIndex: 2, elevation: 2 }}>
        <View style={{ height: BANNER_H, overflow: "hidden" }}>
          <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: bannerScale }] }]}>
            {merchant.cover_image ? (
              <Image source={{ uri: merchant.cover_image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <LinearGradient
                colors={isDark ? ["#0F172A", "#1E293B"] : ["#1E293B", "#E60549"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            )}
            <LinearGradient colors={["transparent", "rgba(0,0,0,0.5)"]} style={styles.bannerScrim} />
          </Animated.View>
        </View>

        {/* Avatar straddles banner/info boundary */}
        <View style={styles.avatarWrap}>
          {merchant.logo ? (
            <Image source={{ uri: merchant.logo }} style={styles.avatar} resizeMode="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="storefront" size={36} color={colors.primary} />
            </View>
          )}
          {merchant.verified && (
            <View style={[styles.verifiedDot, { borderColor: colors.surface }]}>
              <Ionicons name="checkmark-sharp" size={16} color="#fff" />
            </View>
          )}
        </View>
      </View>

      {/* ── Info card ── */}
      <View style={[styles.infoCard, { backgroundColor: colors.surface, paddingTop: AVATAR_SIZE - AVATAR_OVERLAP + 14 }]}>

        {/* Name row + status badge */}
        <View style={styles.nameStatusRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.storeName, { color: colors.textPrimary }]} numberOfLines={1}>
              {merchant.display_name}
            </Text>
            {merchant.business_name !== merchant.display_name && (
              <Text style={[styles.businessName, { color: colors.textMuted }]} numberOfLines={1}>
                {merchant.business_name}
              </Text>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Ionicons name={statusConfig.icon} size={12} color={statusConfig.color} />
            <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          </View>
        </View>

        {merchant.featured && (
          <View style={styles.featuredStrip}>
            <Ionicons name="star" size={11} color="#F59E0B" />
            <Text style={styles.featuredStripText}>Featured Seller</Text>
          </View>
        )}

        {/* ── Stats row ── */}
        <View style={[styles.statsRow, { borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.textPrimary }]}>{listings.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Listings</Text>
          </View>
          <View style={[styles.statSep, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <View style={styles.ratingInline}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={[styles.statNum, { color: colors.textPrimary }]}>
                {merchant.rating > 0 ? merchant.rating.toFixed(1) : "—"}
              </Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              {merchant.total_reviews > 0 ? `${merchant.total_reviews} reviews` : "No reviews"}
            </Text>
          </View>
          <View style={[styles.statSep, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.textPrimary }]}>{tenure.value}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>{tenure.label}</Text>
          </View>
        </View>

        {/* ── Description ── */}
        {!!merchant.description && (
          <View style={[styles.descBlock, { borderColor: colors.border }]}>
            <Text
              style={[styles.descText, { color: colors.textSecondary }]}
              numberOfLines={descExpanded ? undefined : 3}
            >
              {merchant.description}
            </Text>
            {merchant.description.length > 120 && (
              <TouchableOpacity onPress={() => setDescExpanded(v => !v)} activeOpacity={0.7}>
                <Text style={[styles.descToggle, { color: colors.primary }]}>
                  {descExpanded ? "Show less" : "Read more"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Contact ── */}
        {(!!merchant.business_phone || !!merchant.business_email) && (
          <View style={[styles.contactBlock, { borderColor: colors.border }]}>
            <Text style={[styles.contactHeader, { color: colors.textPrimary }]}>Contact</Text>
            {!!merchant.business_phone && (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`tel:${merchant.business_phone.replace(/\s/g, "")}`)}
                activeOpacity={0.7}
              >
                <View style={[styles.contactIconWrap, { backgroundColor: "#E6054912" }]}>
                  <Ionicons name="call" size={15} color="#E60549" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.contactLabel, { color: colors.textMuted }]}>Phone</Text>
                  <Text style={[styles.contactValue, { color: colors.textPrimary }]}>{merchant.business_phone}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
            {!!merchant.business_phone && !!merchant.business_email && (
              <View style={[styles.contactDivider, { backgroundColor: colors.border }]} />
            )}
            {!!merchant.business_email && (
              <TouchableOpacity
                style={styles.contactRow}
                onPress={() => Linking.openURL(`mailto:${merchant.business_email}`)}
                activeOpacity={0.7}
              >
                <View style={[styles.contactIconWrap, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="mail" size={15} color={colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.contactLabel, { color: colors.textMuted }]}>Email</Text>
                  <Text style={[styles.contactValue, { color: colors.textPrimary }]} numberOfLines={1}>
                    {merchant.business_email}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* ── Listings bar ── */}
      <View style={[styles.listingsBar, {  borderTopColor: colors.border, marginBottom: 10 }]}>
        <View style={styles.listingsBarLeft}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Listings</Text>
          {listings.length > 0 && (
            <View style={styles.listingsCountBadge}>
              <Text style={styles.listingsCountText}>{listings.length}</Text>
            </View>
          )}
        </View>
        <View style={[styles.toggleGroup, { backgroundColor: colors.backgroundSecondary }]}>
          <TouchableOpacity
            style={[styles.toggleBtn, !gridView && { backgroundColor: colors.primary }]}
            onPress={() => setGridView(false)} activeOpacity={0.8}
          >
            <Ionicons name="list" size={15} color={!gridView ? "#fff" : colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, gridView && { backgroundColor: colors.primary }]}
            onPress={() => setGridView(true)} activeOpacity={0.8}
          >
            <Ionicons name="grid" size={15} color={gridView ? "#fff" : colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* ── Collapsing sticky header ── */}
      <Animated.View
        style={[
          styles.stickyBar,
          {
            paddingTop: insets.top,
            opacity: headerOpacity,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
        pointerEvents="none"
      >
        <Text
          style={[styles.stickyTitle, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {merchant.display_name}
        </Text>
      </Animated.View>

      {/* ── Floating nav (back + share) ── */}
      <SafeAreaView
        edges={["top"]}
        style={styles.floatingNav}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={styles.floatingBtn}
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Ionicons name="chevron-back" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.floatingBtn}
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Ionicons name="share-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* ── Main list ── */}
      <Animated.FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        numColumns={gridView ? 2 : 1}
        key={gridView ? "grid" : "list"} // forces remount on column change
        ListHeaderComponent={Header}
        columnWrapperStyle={gridView ? styles.gridRow : undefined}
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
        renderItem={({ item }) =>
          gridView
            ? <GridCard item={item} colors={colors} />
            : <RowCard item={item} colors={colors} />
        }
        ListEmptyComponent={
          loadingListings ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="cube-outline"
                size={48}
                color={colors.textMuted}
              />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No listings yet
              </Text>
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  notFoundTitle: { fontSize: 18, fontWeight: "700" },
  notFoundText: { fontSize: 14, textAlign: "center", lineHeight: 21 },
  backPill: { paddingHorizontal: 24, paddingVertical: 11, borderRadius: 22, marginTop: 4 },

  // ── Sticky bar ──
  stickyBar: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
    height: 56 + 44, justifyContent: "flex-end", alignItems: "center",
    paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stickyTitle: { fontSize: 16, fontWeight: "700" },

  // ── Floating nav ──
  floatingNav: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 30,
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 12, paddingTop: 12,
  },
  floatingBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.42)",
    alignItems: "center", justifyContent: "center",
  },

  // ── Banner ──
  bannerScrim: { position: "absolute", bottom: 0, left: 0, right: 0, height: 80 },

  // ── Avatar ──
  avatarWrap: {
    position: "absolute",
    bottom: -(AVATAR_SIZE - AVATAR_OVERLAP),
    left: PAD,
    zIndex: 2,
  },
  avatar: {
    width: AVATAR_SIZE, height: AVATAR_SIZE,
    borderRadius: 22, borderWidth: 3, borderColor: "#000",
  },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  verifiedDot: {
    position: "absolute", bottom: -4, right: -4,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "#1D9BF0", borderWidth: 3,
    alignItems: "center", justifyContent: "center",
  },

  // ── Info card ──
  infoCard: { paddingHorizontal: PAD, paddingBottom: 0 },

  nameStatusRow: {
    flexDirection: "row", alignItems: "flex-start",
    gap: 10, marginBottom: 4,
  },
  storeName: { fontSize: 21, fontWeight: "800", letterSpacing: -0.4 },
  businessName: { fontSize: 13, marginTop: 2 },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 20, marginTop: 2, alignSelf: "flex-start",
  },
  statusBadgeText: { fontSize: 11, fontWeight: "700" },

  featuredStrip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    marginBottom: 14,
  },
  featuredStripText: { fontSize: 12, fontWeight: "600", color: "#F59E0B" },

  // ── Stats row ──
  statsRow: {
    flexDirection: "row", alignItems: "stretch",
    borderWidth: StyleSheet.hairlineWidth, borderRadius: 16,
    marginBottom: 16, overflow: "hidden",
  },
  statItem: { flex: 1, alignItems: "center", paddingVertical: 14, gap: 4 },
  statNum: { fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontWeight: "500" },
  statSep: { width: StyleSheet.hairlineWidth },
  ratingInline: { flexDirection: "row", alignItems: "center", gap: 4 },

  // ── Description ──
  descBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14, paddingBottom: 16,
    gap: 6,
  },
  descText: { fontSize: 14, lineHeight: 22 },
  descToggle: { fontSize: 13, fontWeight: "600", marginTop: 2 },

  // ── Contact ──
  contactBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14, paddingBottom: 18,
  },
  contactHeader: { fontSize: 13, fontWeight: "700", marginBottom: 12, letterSpacing: 0.2 },
  contactRow: {
    flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6,
  },
  contactIconWrap: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  contactLabel: { fontSize: 11, fontWeight: "500", marginBottom: 1 },
  contactValue: { fontSize: 14, fontWeight: "600" },
  contactDivider: { height: StyleSheet.hairlineWidth, marginVertical: 4, marginLeft: 50 },

  // ── Listings bar ──
  listingsBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: PAD, paddingVertical: 13,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  listingsBarLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "800" },
  listingsCountBadge: {
    backgroundColor: "#E6054915", paddingHorizontal: 9,
    paddingVertical: 3, borderRadius: 20,
  },
  listingsCountText: { fontSize: 12, fontWeight: "700", color: "#E60549" },
  toggleGroup: {
    flexDirection: "row", borderRadius: 10, overflow: "hidden", padding: 3, gap: 3,
  },
  toggleBtn: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },

  // ── Grid ──
  gridContent: { paddingBottom: 8 },
  gridRow: { gap: GAP, marginBottom: GAP, paddingHorizontal: PAD },

  // ── Grid card ──
  card: { width: CARD_W, borderRadius: 14, overflow: "hidden" },
  cardImageWrap: { width: "100%", height: CARD_W, position: "relative" },
  cardImage: { width: "100%", height: "100%" },
  featuredBadge: {
    position: "absolute", top: 8, left: 8,
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#E60549", paddingHorizontal: 7,
    paddingVertical: 3, borderRadius: 20,
  },
  featuredText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  cardBody: { padding: 10, gap: 3 },
  cardTitle: { fontSize: 12.5, fontWeight: "600", lineHeight: 18 },
  cardPrice: { fontSize: 13, fontWeight: "800" },

  // ── Row card (list view) ──
  rowCard: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: PAD, paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowImageWrap: {
    width: 86, height: 86,
    borderRadius: 12, overflow: "hidden",
    flexShrink: 0, position: "relative",
  },
  rowImage: { width: "100%", height: "100%" },
  rowFeaturedDot: {
    position: "absolute", top: 6, left: 6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#E60549",
    alignItems: "center", justifyContent: "center",
  },
  rowBody: { flex: 1, gap: 3 },
  rowTitle: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  rowCategory: { fontSize: 12 },
  rowFooter: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  rowPrice: { fontSize: 14, fontWeight: "800" },
  rowFeaturedChip: {
    backgroundColor: "#E6054915",
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 10,
  },
  rowFeaturedText: { fontSize: 10, fontWeight: "700", color: "#E60549" },

  // ── Empty state ──
  emptyState: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 32, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyMsg: { fontSize: 13, textAlign: "center", lineHeight: 20 },
});
