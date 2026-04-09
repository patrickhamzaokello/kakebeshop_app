import React, { useState, useCallback } from "react";
import { Text } from "@/components/Text";
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Dimensions, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { listingDetailsService, WishlistItem } from "@/utils/services/listingDetailsService";
import { Listing } from "@/utils/types/models";
import { ListingImage } from "@/components/test/common/ListingImage";
import { useTheme } from "@/contexts/ThemeContext";

const { width } = Dimensions.get("window");
const PADDING = 16;
const GAP = 10;
const CARD_WIDTH = (width - PADDING * 2 - GAP) / 2;

function formatPrice(listing: Listing): string {
  if (listing.price_type === "ON_REQUEST") return "Price on request";
  if (listing.price_type === "RANGE" && listing.price_min && listing.price_max) {
    return `${listing.currency} ${parseInt(listing.price_min).toLocaleString()} – ${parseInt(listing.price_max).toLocaleString()}`;
  }
  if (listing.price_type === "FIXED" && listing.price) {
    return `${listing.currency} ${parseInt(listing.price).toLocaleString()}`;
  }
  return "Price not available";
}

function WishlistCard({
  item,
  colors,
  onRemove,
}: {
  item: WishlistItem;
  colors: any;
  onRemove: (listingId: string) => void;
}) {
  const { listing } = item;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() =>
        router.push({ pathname: "/listing/[id]", params: { id: listing.id } })
      }
      activeOpacity={0.85}
    >
      <View style={styles.imageWrapper}>
        <ListingImage
          primaryImage={listing.primary_image}
          style={styles.image}
        />
        {listing.is_featured && (
          <View style={[styles.featuredBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="star" size={10} color="#fff" />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => onRemove(listing.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="heart" size={18} color="#E60549" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardBody}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {listing.title}
        </Text>
        <Text style={[styles.merchant, { color: colors.textMuted }]} numberOfLines={1}>
          {listing.merchant.display_name}
        </Text>
        <Text style={[styles.price, { color: colors.textPrimary }]} numberOfLines={1}>
          {formatPrice(listing)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ colors }: { colors: any }) {
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconWrap, { backgroundColor: colors.surface }]}>
        <Ionicons name="heart-outline" size={40} color={colors.textMuted} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No favourites yet</Text>
      <Text style={[styles.emptyMsg, { color: colors.textMuted }]}>
        Tap the heart on any listing to save it here
      </Text>
      <TouchableOpacity
        style={[styles.browseBtn, { backgroundColor: colors.primary }]}
        onPress={() => router.replace("/(tabs)/(home)")}
        activeOpacity={0.8}
      >
        <Text style={styles.browseBtnText}>Browse Listings</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function WishlistMain() {
  const { colors, isDark } = useTheme();

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadItems = useCallback(async (pageNum = 1, append = false) => {
    const data = await listingDetailsService.getWishlist(pageNum);
    if (!data) return;
    const results = data.results ?? [];
    setItems((prev) => (append ? [...prev, ...results] : results));
    setHasMore(!!data.next);
  }, []);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(isDark ? "light-content" : "dark-content");
      setLoading(true);
      setPage(1);
      loadItems(1, false).finally(() => setLoading(false));
    }, [isDark, loadItems])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadItems(1, false);
    setRefreshing(false);
  };

  const onLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const next = page + 1;
    await loadItems(next, true);
    setPage(next);
    setLoadingMore(false);
  };

  const handleRemove = async (listingId: string) => {
    // Optimistic removal
    setItems((prev) => prev.filter((i) => i.listing.id !== listingId));
    await listingDetailsService.RemoveListingFromWishlist(listingId);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Favourites</Text>
            {!loading && (
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                {items.length} {items.length === 1 ? "item" : "items"} saved
              </Text>
            )}
          </View>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[styles.list, items.length === 0 && styles.listEmpty]}
          renderItem={({ item }) => (
            <WishlistCard item={item} colors={colors} onRemove={handleRemove} />
          )}
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
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.footer} />
            ) : null
          }
          ListEmptyComponent={<EmptyState colors={colors} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },

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

  list: { padding: PADDING, gap: GAP },
  listEmpty: { flex: 1 },
  row: { gap: GAP },
  footer: { paddingVertical: 16 },

  card: {
    width: CARD_WIDTH,
    borderRadius: 14,
    overflow: "hidden",
  },
  imageWrapper: {
    width: "100%",
    height: CARD_WIDTH,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 0,
  } as any,
  featuredBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },
  featuredText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  removeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },

  cardBody: { padding: 10, gap: 3 },
  title: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
  merchant: { fontSize: 11 },
  price: { fontSize: 13, fontWeight: "700", marginTop: 2 },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  emptyMsg: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  browseBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  browseBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
