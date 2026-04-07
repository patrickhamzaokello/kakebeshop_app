import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Keyboard,
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { spacingX, spacingY, radius } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import apiService from "@/utils/apiBase";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImageAsset {
  id: string;
  image: string;
  width: number;
  height: number;
  variant: string;
  image_group_id: string;
}

interface Category { id: string; name: string; }
interface Tag { id: string; name: string; }
interface MerchantInfo { id: string; display_name: string; logo: string | null; verified: boolean; rating: number; }
interface Location { id: string; name: string; }

interface ListingResult {
  type: "listing";
  id: string;
  title: string;
  description: string;
  listing_type: "PRODUCT" | "SERVICE";
  price_type: "FIXED" | "RANGE" | "ON_REQUEST";
  price: number | null;
  price_min: number | null;
  price_max: number | null;
  currency: string;
  is_price_negotiable: boolean;
  primary_image: ImageAsset | null;
  is_featured: boolean;
  views_count: number;
  category: Category;
  tags: Tag[];
  merchant: MerchantInfo;
  location: Location | null;
  created_at: string;
  relevance_score: number;
}

interface MerchantResult {
  type: "merchant";
  id: string;
  title: string;
  business_name: string | null;
  description: string;
  logo: string | null;
  cover_image: string | null;
  rating: number;
  total_reviews: number;
  verified: boolean;
  featured: boolean;
  location: Location | null;
  created_at: string;
  relevance_score: number;
}

type SearchResult = ListingResult | MerchantResult;
type FilterType = "all" | "merchant" | "listing";
type SortOption = "relevance" | "newest" | "price_asc" | "price_desc" | "rating";

interface SearchResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    metadata: {
      query: string;
      filters: { type: string; category: string | null; location: string | null; price_range: { min: number | null; max: number | null } | null };
      sort: string;
    };
    results: SearchResult[];
  };
}

const TYPE_FILTERS = [
  { label: "All", value: "all" as FilterType },
  { label: "Merchants", value: "merchant" as FilterType, icon: "storefront-outline" as const },
  { label: "Listings", value: "listing" as FilterType, icon: "grid-outline" as const },
];

const SORT_OPTIONS = [
  { label: "Most Relevant", value: "relevance" as SortOption, icon: "star-outline" as const },
  { label: "Newest", value: "newest" as SortOption, icon: "time-outline" as const },
  { label: "Price: Low to High", value: "price_asc" as SortOption, icon: "arrow-up-outline" as const },
  { label: "Price: High to Low", value: "price_desc" as SortOption, icon: "arrow-down-outline" as const },
  { label: "Highest Rated", value: "rating" as SortOption, icon: "trophy-outline" as const },
];

// ─── Shimmer ──────────────────────────────────────────────────────────────────

const ShimmerPlaceholder: React.FC<{ style?: any }> = ({ style }) => {
  const animVal = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animVal, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(animVal, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [animVal]);
  const opacity = animVal.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  return <Animated.View style={[{ backgroundColor: "#9E9E9E", opacity }, style]} />;
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SearchPage() {
  const { isDark, colors } = useTheme();
  const router = useRouter();
  const searchInputRef = useRef<TextInput>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [showSortModal, setShowSortModal] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [sortLabel, setSortLabel] = useState("Most Relevant");

  useEffect(() => {
    const t = setTimeout(() => searchInputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const performSearch = useCallback(
    async (query: string, pageNum = 1, append = false, type: FilterType = filterType, sort: SortOption = sortBy) => {
      if (!query.trim()) return;
      if (pageNum === 1) { setLoading(true); setResults([]); }
      else setLoadingMore(true);
      setHasSearched(true);
      try {
        const params: any = { q: query.trim(), page: pageNum, page_size: 20, sort };
        if (type !== "all") params.type = type;
        const res = await apiService.get<SearchResponse>("/api/v1/search/", { params });
        const newResults = res.data?.results?.results ?? [];
        if (append) setResults((prev) => [...prev, ...newResults]);
        else setResults(newResults);
        setTotalCount(res.data?.count ?? 0);
        setHasMore(res.data?.next !== null);
        setPage(pageNum);
      } catch {
        if (!append) { setResults([]); }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filterType, sortBy]
  );

  const handleSearchTextChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length >= 2) {
      debounceRef.current = setTimeout(() => performSearch(text, 1, false, filterType, sortBy), 500) as unknown as NodeJS.Timeout;
    } else {
      setResults([]); setHasSearched(false);
    }
  }, [filterType, sortBy, performSearch]);

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    Keyboard.dismiss();
    performSearch(searchQuery, 1, false, filterType, sortBy);
  }, [searchQuery, filterType, sortBy, performSearch]);

  const handleLoadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore && searchQuery.trim()) {
      performSearch(searchQuery, page + 1, true, filterType, sortBy);
    }
  }, [loading, loadingMore, hasMore, searchQuery, page, filterType, sortBy, performSearch]);

  const handleClear = () => {
    setSearchQuery(""); setResults([]); setHasSearched(false);
    setPage(1); setHasMore(true); setTotalCount(0);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    searchInputRef.current?.focus();
  };

  const handleTypeFilter = (type: FilterType) => {
    setFilterType(type); setPage(1);
    if (searchQuery.trim()) performSearch(searchQuery, 1, false, type, sortBy);
  };

  const handleSortChange = (opt: { label: string; value: SortOption }) => {
    setSortBy(opt.value); setSortLabel(opt.label); setShowSortModal(false); setPage(1);
    if (searchQuery.trim()) performSearch(searchQuery, 1, false, filterType, opt.value);
  };

  const formatPrice = (item: ListingResult): string => {
    if (item.price_type === "ON_REQUEST") return "Price on request";
    if (item.price_type === "RANGE" && item.price_min != null && item.price_max != null)
      return `${item.currency} ${item.price_min.toLocaleString()} – ${item.price_max.toLocaleString()}`;
    if (item.price != null) return `${item.currency} ${item.price.toLocaleString()}`;
    return "Price not available";
  };

  // ── Listing card ──
  const renderListingItem = (item: ListingResult) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.listingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => router.push({ pathname: "/listing/[id]", params: { id: item.id } })}
      activeOpacity={0.75}
    >
      <View style={styles.imageContainer}>
        {item.primary_image ? (
          <Image source={{ uri: item.primary_image.image }} style={styles.listingImage} resizeMode="cover" />
        ) : (
          <View style={[styles.listingImage, { backgroundColor: colors.backgroundSecondary, alignItems: "center", justifyContent: "center" }]}>
            <Ionicons name="image-outline" size={36} color={colors.textMuted} />
          </View>
        )}
        {item.is_featured && (
          <View style={[styles.featuredBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="star" size={10} color="#fff" />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.quickViewBtn}
          onPress={() => router.push(`/listing/${item.id}`)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.listingTitle, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.merchantRow}>
          {item.merchant.verified && <Ionicons name="checkmark-circle" size={12} color={colors.primary} />}
          <Text style={[styles.merchantName, { color: colors.textMuted }]} numberOfLines={1}>
            {item.merchant.display_name}
          </Text>
        </View>
        <Text style={[styles.listingPrice, { color: colors.primary }]}>{formatPrice(item)}</Text>
      </View>
    </TouchableOpacity>
  );

  // ── Merchant card ──
  const renderMerchantItem = (item: MerchantResult) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.merchantCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => router.push({ pathname: "/merchant/[id]", params: { id: item.id } })}
      activeOpacity={0.75}
    >
      {item.logo ? (
        <Image source={{ uri: item.logo }} style={styles.merchantLogo} />
      ) : (
        <View style={[styles.merchantLogo, { backgroundColor: colors.backgroundSecondary, alignItems: "center", justifyContent: "center" }]}>
          <Ionicons name="storefront-outline" size={26} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.merchantInfo}>
        <View style={styles.merchantHeader}>
          <Text style={[styles.merchantTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.title}
          </Text>
          {item.verified && <Ionicons name="checkmark-circle" size={15} color={colors.primary} />}
        </View>
        <Text style={[styles.merchantDesc, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.merchantFooter}>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color="#FFA500" />
            <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
              {item.rating.toFixed(1)} ({item.total_reviews})
            </Text>
          </View>
          {item.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color={colors.textMuted} />
              <Text style={[styles.locationText, { color: colors.textMuted }]}>{item.location.name}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // ── Grid layout ──
  const renderGrid = () => {
    const items: React.ReactNode[] = [];
    let i = 0;
    while (i < results.length) {
      const item = results[i];
      if (item.type === "merchant") {
        items.push(<View key={`m-${item.id}`} style={styles.fullWidthRow}>{renderMerchantItem(item)}</View>);
        i++;
      } else {
        const next = results[i + 1];
        if (next && next.type === "listing") {
          items.push(
            <View key={`r-${item.id}-${next.id}`} style={styles.listingRow}>
              {renderListingItem(item)}
              {renderListingItem(next as ListingResult)}
            </View>
          );
          i += 2;
        } else {
          items.push(
            <View key={`r-${item.id}`} style={styles.listingRow}>
              {renderListingItem(item)}
              <View style={{ width: "48%" }} />
            </View>
          );
          i++;
        }
      }
    }
    return items;
  };

  // ── Shimmer ──
  const renderShimmer = () => (
    <View style={styles.shimmerWrap}>
      {[0, 1].map((row) => (
        <View key={row} style={styles.listingRow}>
          {[0, 1].map((col) => (
            <View key={col} style={[styles.listingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ShimmerPlaceholder style={{ width: "100%", height: 160 }} />
              <View style={{ padding: 10, gap: 6 }}>
                <ShimmerPlaceholder style={{ width: "90%", height: 13, borderRadius: 4 }} />
                <ShimmerPlaceholder style={{ width: "60%", height: 11, borderRadius: 4 }} />
                <ShimmerPlaceholder style={{ width: "50%", height: 15, borderRadius: 4 }} />
              </View>
            </View>
          ))}
        </View>
      ))}
      <View style={[styles.merchantCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ShimmerPlaceholder style={{ width: 60, height: 60, borderRadius: 30 }} />
        <View style={{ flex: 1, gap: 6 }}>
          <ShimmerPlaceholder style={{ width: "75%", height: 13, borderRadius: 4 }} />
          <ShimmerPlaceholder style={{ width: "55%", height: 11, borderRadius: 4 }} />
          <ShimmerPlaceholder style={{ width: "40%", height: 11, borderRadius: 4 }} />
        </View>
      </View>
    </View>
  );

  // ── Empty/idle state ──
  const renderEmpty = () => (
    <View style={styles.emptyWrap}>
      <Ionicons
        name={hasSearched ? "alert-circle-outline" : "search"}
        size={64}
        color={colors.textMuted}
      />
      <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
        {hasSearched ? "No results found" : "Search Kakebe Shop"}
      </Text>
      <Text style={[styles.emptySub, { color: colors.textMuted }]}>
        {hasSearched
          ? "Try different keywords or adjust your filters"
          : "Find products, services, and trusted merchants"}
      </Text>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* ── Header ── */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.surface }}>
        {/* Search bar row */}
        <View style={[styles.searchRow, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={[styles.searchBox, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              ref={searchInputRef}
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search products, merchants…"
              placeholderTextColor={colors.textPlaceholder}
              value={searchQuery}
              onChangeText={handleSearchTextChange}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter chips + sort */}
        <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {TYPE_FILTERS.map((f) => {
              const active = filterType === f.value;
              return (
                <TouchableOpacity
                  key={f.value}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.primary : colors.backgroundSecondary,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => handleTypeFilter(f.value)}
                  activeOpacity={0.75}
                >
                  {f.icon && (
                    <Ionicons name={f.icon} size={14} color={active ? "#fff" : colors.textSecondary} />
                  )}
                  <Text style={[styles.chipText, { color: active ? "#fff" : colors.textSecondary }]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={[styles.sortBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
            onPress={() => setShowSortModal(true)}
            activeOpacity={0.75}
          >
            <Ionicons name="swap-vertical" size={16} color={colors.textSecondary} />
            <Text style={[styles.sortBtnText, { color: colors.textSecondary }]}>Sort</Text>
          </TouchableOpacity>
        </View>

        {/* Results count */}
        {hasSearched && !loading && (
          <View style={[styles.countBar, { backgroundColor: colors.backgroundSecondary, borderBottomColor: colors.border }]}>
            <Text style={[styles.countText, { color: colors.textMuted }]}>
              {totalCount} {totalCount === 1 ? "result" : "results"}
              {searchQuery ? ` for "${searchQuery}"` : ""}
            </Text>
            {sortBy !== "relevance" && (
              <Text style={[styles.sortedByText, { color: colors.textMuted }]}>· {sortLabel}</Text>
            )}
          </View>
        )}
      </SafeAreaView>

      {/* ── Results ── */}
      <View style={styles.resultsArea}>
        {loading ? (
          renderShimmer()
        ) : results.length > 0 ? (
          <ScrollView
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScroll={({ nativeEvent: { layoutMeasurement, contentOffset, contentSize } }) => {
              if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 120) {
                handleLoadMore();
              }
            }}
            scrollEventThrottle={400}
          >
            {renderGrid()}
            {loadingMore && (
              <View style={styles.loadMoreRow}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            )}
          </ScrollView>
        ) : (
          renderEmpty()
        )}
      </View>

      {/* ── Sort modal ── */}
      <Modal visible={showSortModal} transparent animationType="slide" onRequestClose={() => setShowSortModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowSortModal(false)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Sort By</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {SORT_OPTIONS.map((opt) => {
              const active = sortBy === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.sortRow, { borderBottomColor: colors.border }, active && { backgroundColor: colors.primary + "10" }]}
                  onPress={() => handleSortChange(opt)}
                  activeOpacity={0.75}
                >
                  <View style={styles.sortRowLeft}>
                    <Ionicons name={opt.icon} size={19} color={active ? colors.primary : colors.textMuted} />
                    <Text style={[styles.sortRowText, { color: active ? colors.primary : colors.textPrimary }, active && { fontWeight: "700" }]}>
                      {opt.label}
                    </Text>
                  </View>
                  {active && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </TouchableOpacity>
              );
            })}
            <View style={{ height: 16 }} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Styles (layout only — no colors) ────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
    fontWeight: "500",
  },

  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterScroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  sortBtnText: { fontSize: 13, fontWeight: "600" },

  countBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  countText: { fontSize: 13, fontWeight: "500" },
  sortedByText: { fontSize: 13 },

  resultsArea: { flex: 1 },
  listContent: { padding: 12, paddingBottom: 24 },

  shimmerWrap: { padding: 12, gap: 12 },

  listingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  fullWidthRow: { marginBottom: 10 },
  listingCard: {
    width: "48%",
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  imageContainer: { position: "relative" },
  listingImage: { width: "100%", height: 160 },
  featuredBadge: {
    position: "absolute", top: 7, left: 7,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 7, paddingVertical: 3,
    borderRadius: 4, gap: 3,
  },
  featuredText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  quickViewBtn: {
    position: "absolute", bottom: 7, right: 7,
    backgroundColor: "rgba(0,0,0,0.85)",
    width: 30, height: 30, borderRadius: 15,
    alignItems: "center", justifyContent: "center",
  },
  cardBody: { padding: 9, gap: 4 },
  listingTitle: { fontSize: 13, fontWeight: "600", lineHeight: 17 },
  merchantRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  merchantName: { fontSize: 11, flex: 1 },
  listingPrice: { fontSize: 13, fontWeight: "800" },

  merchantCard: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    width: "100%",
  },
  merchantLogo: { width: 58, height: 58, borderRadius: 29 },
  merchantInfo: { flex: 1, gap: 4 },
  merchantHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  merchantTitle: { fontSize: 15, fontWeight: "700", flex: 1 },
  merchantDesc: { fontSize: 13, lineHeight: 18 },
  merchantFooter: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 2 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 12, fontWeight: "500" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  locationText: { fontSize: 12 },

  loadMoreRow: { paddingVertical: 20, alignItems: "center" },

  emptyWrap: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: 60, paddingHorizontal: 32,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginTop: 16 },
  emptySub: { fontSize: 14, marginTop: 8, textAlign: "center", lineHeight: 20 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: "center", marginTop: 10, marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 17, fontWeight: "700" },
  sortRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sortRowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  sortRowText: { fontSize: 15 },
});
