import React, { useCallback, useState } from "react";
import { Text } from "@/components/Text";
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import apiService from "@/utils/apiBase";
import { useTheme } from "@/contexts/ThemeContext";
import { Listing as BaseListing } from "@/utils/types/models";

interface Listing extends BaseListing {
  status?: string;
}

const { width: W } = Dimensions.get("window");
const PAD = 16;
const GAP = 10;
const CARD_W = (W - PAD * 2 - GAP) / 2;

interface PaginatedResponse {
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  results: Listing[];
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE:   { label: "Active",   color: "#4CAF50", bg: "#4CAF5015" },
  INACTIVE: { label: "Inactive", color: "#FF9800", bg: "#FF980015" },
  PENDING:  { label: "Pending",  color: "#2196F3", bg: "#2196F315" },
  REJECTED: { label: "Rejected", color: "#F44336", bg: "#F4433615" },
};

function getStatus(s: string) {
  return STATUS[s] ?? { label: s, color: "#999", bg: "#99991510" };
}

function formatPrice(listing: Listing): string {
  if (listing.price_type === "ON_REQUEST") return "On request";
  if (listing.price_type === "RANGE" && listing.price_min && listing.price_max)
    return `${listing.currency} ${parseInt(listing.price_min).toLocaleString()} – ${parseInt(listing.price_max).toLocaleString()}`;
  if (listing.price_type === "FIXED" && listing.price)
    return `${listing.currency} ${parseInt(listing.price).toLocaleString()}`;
  return "—";
}

// ─── Listing card ─────────────────────────────────────────────────────────────

/**
 * Extract the best available image URL from a listing regardless of which
 * serializer shape the API returned:
 *   Shape A (list endpoint): { primary_image: { image, thumbnail } }
 *   Shape B (detail endpoint): { images: [{ thumb, medium, large }] }
 *   Shape C: { primary_image: { thumb, medium, large } }  (nested variant)
 */
function getListingImageUri(item: any): string | null {
  // Shape A — flat primary_image
  if (item.primary_image?.image) return item.primary_image.image;
  if (item.primary_image?.thumbnail) return item.primary_image.thumbnail;

  // Shape C — nested variant inside primary_image
  const pi = item.primary_image;
  if (pi?.large?.image) return pi.large.image;
  if (pi?.medium?.image) return pi.medium.image;
  if (pi?.thumb?.image) return pi.thumb.image;

  // Shape B — images array with variant groups
  const firstGroup = Array.isArray(item.images) ? item.images[0] : null;
  if (firstGroup?.large?.image) return firstGroup.large.image;
  if (firstGroup?.medium?.image) return firstGroup.medium.image;
  if (firstGroup?.thumb?.image) return firstGroup.thumb.image;
  // images might be a flat array of { image, thumbnail } objects
  if (firstGroup?.image) return firstGroup.image;
  if (firstGroup?.thumbnail) return firstGroup.thumbnail;

  return null;
}

function ListingCard({ item, colors }: { item: Listing; colors: any }) {
  const status = getStatus(item.status ?? "ACTIVE");
  const imageUri = getListingImageUri(item);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() => router.push({ pathname: "/listing/[id]", params: { id: item.id } })}
      activeOpacity={0.85}
    >
      {/* Image */}
      <View style={styles.imageWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="image-outline" size={24} color={colors.textMuted} />
          </View>
        )}

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>

        {item.is_featured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={9} color="#fff" />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.cardBody}>
        {item.category_name ? (
          <Text style={[styles.category, { color: colors.textMuted }]} numberOfLines={1}>
            {item.category_name}
          </Text>
        ) : null}
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.price, { color: colors.primary }]} numberOfLines={1}>
          {formatPrice(item)}
        </Text>

        {/* Mini stats */}
        <View style={[styles.miniStats, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.miniStat}>
            <Ionicons name="eye-outline" size={11} color={colors.textMuted} />
            <Text style={[styles.miniStatVal, { color: colors.textSecondary }]}>
              {item.views_count ?? 0}
            </Text>
          </View>
          <View style={[styles.miniStatDivider, { backgroundColor: colors.border }]} />
          <View style={styles.miniStat}>
            <Ionicons name="chatbubble-outline" size={11} color={colors.textMuted} />
            <Text style={[styles.miniStatVal, { color: colors.textSecondary }]}>
              {(item as any).contact_count ?? 0}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Shimmer skeleton ─────────────────────────────────────────────────────────

function SkeletonCard({ colors }: { colors: any }) {
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={[styles.imageWrap, { backgroundColor: colors.backgroundSecondary }]} />
      <View style={styles.cardBody}>
        <View style={[styles.skelLine, { width: "60%", backgroundColor: colors.backgroundSecondary }]} />
        <View style={[styles.skelLine, { width: "90%", backgroundColor: colors.backgroundSecondary }]} />
        <View style={[styles.skelLine, { width: "45%", backgroundColor: colors.backgroundSecondary }]} />
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MerchantListings() {
  const { colors, isDark } = useTheme();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchListings = useCallback(async (pageNum = 1, append = false) => {
    try {
      setError(false);
      const response = await apiService.get<any>(
        `/api/v1/listings/my_listings/?page=${pageNum}`
      );
      if (response.success && response.data) {
        // Unwrap envelope: some endpoints return { success, data: { results } }
        // others return { results } directly.
        const payload = response.data?.results !== undefined
          ? response.data
          : (response.data?.data ?? response.data);

        if (__DEV__) {
          const first = payload?.results?.[0];
          console.log('[mylistings] first item images:', JSON.stringify({
            primary_image: first?.primary_image,
            images: first?.images,
          }, null, 2));
        }

        const results: Listing[] = payload?.results ?? [];
        const next: string | null = payload?.next ?? null;
        setListings((prev) => (append ? [...prev, ...results] : results));
        setHasMore(!!next);
        setPage(pageNum);
      } else {
        throw new Error("Failed");
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setPage(1);
      fetchListings(1, false);
    }, [fetchListings])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings(1, false);
  };

  const onLoadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchListings(page + 1, true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Listings</Text>
            {!loading && (
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                {listings.length} listing{listings.length !== 1 ? "s" : ""}
              </Text>
            )}
          </View>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      {/* Error state */}
      {error && !loading && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color="#E60549" />
          <Text style={styles.errorText}>Failed to load listings</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading skeletons */}
      {loading ? (
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          keyExtractor={(i) => String(i)}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={() => <SkeletonCard colors={colors} />}
          scrollEnabled={false}
        />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={[styles.grid, listings.length === 0 && { flex: 1 }]}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => <ListingCard item={item} colors={colors} />}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ paddingVertical: 16 }} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.surface }]}>
                <Ionicons name="pricetags-outline" size={38} color={colors.textMuted} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No listings yet</Text>
              <Text style={[styles.emptyMsg, { color: colors.textMuted }]}>
                Your active listings will appear here
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  headerSub: { fontSize: 12, textAlign: "center", marginTop: 1 },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#FFF0F3",
  },
  errorText: { flex: 1, fontSize: 13, color: "#E60549" },
  retryBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: "#E60549" },
  retryText: { fontSize: 12, fontWeight: "700", color: "#fff" },

  grid: { padding: PAD, gap: GAP },
  row: { gap: GAP },

  card: {
    width: CARD_W,
    borderRadius: 14,
    overflow: "hidden",
  },
  imageWrap: {
    width: "100%",
    height: CARD_W,
    position: "relative",
  },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },

  statusBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "700" },

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
  category: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  title: { fontSize: 12.5, fontWeight: "600", lineHeight: 18 },
  price: { fontSize: 13, fontWeight: "800" },

  miniStats: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    padding: 6,
    marginTop: 4,
  },
  miniStat: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3 },
  miniStatVal: { fontSize: 11, fontWeight: "600" },
  miniStatDivider: { width: 1, height: 16 },

  skelLine: { height: 10, borderRadius: 5, marginBottom: 6 },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  emptyMsg: { fontSize: 13, textAlign: "center", lineHeight: 20 },
});
