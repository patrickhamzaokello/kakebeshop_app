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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors, spacingX, spacingY, radius } from "@/constants/theme";
import { Listing } from "@/utils/types/models";
import { ListingImage } from "@/components/test/common/ListingImage";
import { MaterialIcons } from "@expo/vector-icons";
import apiService from "@/utils/apiBase";

// Types based on API documentation
interface SearchResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    metadata: {
      query: string;
      filters: {
        type: string;
        category: string | null;
        location: string | null;
        price_range: { min: number | null; max: number | null } | null;
      };
      sort: string;
    };
    results: SearchResult[];
  };
}

interface ImageAsset {
  id: string;
  image: string;
  width: number;
  height: number;
  variant: string;
  image_group_id: string;
}

interface Category {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

interface MerchantInfo {
  id: string;
  display_name: string;
  logo: string | null;
  verified: boolean;
  rating: number;
}

interface Location {
  id: string;
  name: string;
}

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

// Filter types
type FilterType = "all" | "merchant" | "listing";
type SortOption = "relevance" | "newest" | "price_asc" | "price_desc" | "rating";

interface FilterOption {
  label: string;
  value: FilterType | SortOption;
  icon?: string;
}

const TYPE_FILTERS: FilterOption[] = [
  { label: "All", value: "all" },
  { label: "Merchants", value: "merchant", icon: "storefront-outline" },
  { label: "Listings", value: "listing", icon: "grid-outline" },
];

const SORT_OPTIONS: FilterOption[] = [
  { label: "Most Relevant", value: "relevance", icon: "star-outline" },
  { label: "Newest", value: "newest", icon: "time-outline" },
  { label: "Price: Low to High", value: "price_asc", icon: "arrow-up-outline" },
  { label: "Price: High to Low", value: "price_desc", icon: "arrow-down-outline" },
  { label: "Highest Rated", value: "rating", icon: "trophy-outline" },
];

const ShimmerPlaceholder: React.FC<{ style?: any }> = ({ style }) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
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
  }, [animatedValue]);

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

const ListingShimmerCard = () => (
  <View style={styles.listingCard}>
    <View style={styles.imageContainer}>
      <ShimmerPlaceholder
        style={{
          width: "100%",
          height: 180,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        }}
      />
    </View>
    <View style={styles.listingDescription}>
      <ShimmerPlaceholder
        style={{
          width: "90%",
          height: 14,
          borderRadius: 4,
          marginBottom: 4,
        }}
      />
      <ShimmerPlaceholder
        style={{
          width: "60%",
          height: 12,
          borderRadius: 4,
          marginBottom: 8,
        }}
      />
      <ShimmerPlaceholder
        style={{
          width: "50%",
          height: 16,
          borderRadius: 4,
        }}
      />
    </View>
  </View>
);

const MerchantShimmerCard = () => (
  <View style={styles.merchantCard}>
    <ShimmerPlaceholder
      style={{
        width: 60,
        height: 60,
        borderRadius: 30,
      }}
    />
    <View style={{ flex: 1, gap: 6 }}>
      <ShimmerPlaceholder
        style={{
          width: "80%",
          height: 14,
          borderRadius: 4,
        }}
      />
      <ShimmerPlaceholder
        style={{
          width: "60%",
          height: 12,
          borderRadius: 4,
        }}
      />
      <ShimmerPlaceholder
        style={{
          width: "40%",
          height: 12,
          borderRadius: 4,
        }}
      />
    </View>
  </View>
);

export default function SearchPage() {
  const router = useRouter();
  const searchInputRef = useRef<TextInput>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filter states
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [showSortModal, setShowSortModal] = useState(false);
  const [metadata, setMetadata] = useState<SearchResponse["results"]["metadata"] | null>(
    null
  );
  const [totalCount, setTotalCount] = useState(0);

  // Auto-focus the search input when the page mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const performSearch = useCallback(
    async (
      query: string,
      pageNum: number = 1,
      append: boolean = false,
      type: FilterType = filterType,
      sort: SortOption = sortBy
    ) => {
      if (!query.trim()) return;

      if (pageNum === 1) {
        setLoading(true);
        setResults([]);
      } else {
        setLoadingMore(true);
      }

      setHasSearched(true);

      try {
        const params: any = {
          q: query.trim(),
          page: pageNum,
          page_size: 20,
          sort: sort,
        };

        // Only add type filter if not "all"
        if (type !== "all") {
          params.type = type;
        }

        const response = await apiService.get<SearchResponse>("/api/v1/search/", {
          params,
        });

        const newResults = response.data.results.results || [];
        const searchMetadata = response.data.results.metadata;

        if (append) {
          setResults((prev) => [...prev, ...newResults]);
        } else {
          setResults(newResults);
        }

        setMetadata(searchMetadata);
        setTotalCount(response.data.count);
        setHasMore(response.data.next !== null);
        setPage(pageNum);
      } catch (error) {
        if (!append) {
          setResults([]);
          setMetadata(null);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filterType, sortBy]
  );

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    Keyboard.dismiss();
    performSearch(searchQuery, 1, false, filterType, sortBy);
  }, [searchQuery, filterType, sortBy, performSearch]);

  // Debounced search on text change
  const handleSearchTextChange = useCallback(
    (text: string) => {
      setSearchQuery(text);

      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Only search if text length >= 2
      if (text.trim().length >= 2) {
        debounceTimerRef.current = setTimeout(() => {
          performSearch(text, 1, false, filterType, sortBy);
        }, 500) as unknown as NodeJS.Timeout;
      } else {
        setResults([]);
        setHasSearched(false);
        setMetadata(null);
      }
    },
    [filterType, sortBy, performSearch]
  );

  const handleLoadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore && searchQuery.trim()) {
      performSearch(searchQuery, page + 1, true, filterType, sortBy);
    }
  }, [loading, loadingMore, hasMore, searchQuery, page, filterType, sortBy, performSearch]);

  const handleBack = () => {
    router.back();
  };

  const handleClear = () => {
    setSearchQuery("");
    setResults([]);
    setHasSearched(false);
    setPage(1);
    setHasMore(true);
    setMetadata(null);
    setTotalCount(0);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    searchInputRef.current?.focus();
  };

  const handleTypeFilterChange = (type: FilterType) => {
    setFilterType(type);
    setPage(1);
    if (searchQuery.trim()) {
      performSearch(searchQuery, 1, false, type, sortBy);
    }
  };

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
    setShowSortModal(false);
    setPage(1);
    if (searchQuery.trim()) {
      performSearch(searchQuery, 1, false, filterType, sort);
    }
  };

  const handleListingPress = (listing: ListingResult) => {
    router.push({
      pathname: "/listing/[id]",
      params: { id: listing.id },
    });
  };

  const handleMerchantPress = (merchant: MerchantResult) => {
    router.push({
      pathname: "/merchant/[id]",
      params: { id: merchant.id },
    });
  };

  const formatPrice = (result: ListingResult): string => {
    if (result.price_type === "ON_REQUEST") {
      return "Price on request";
    }

    if (result.price_type === "RANGE" && result.price_min && result.price_max) {
      return `${result.currency} ${result.price_min.toLocaleString()} - ${result.price_max.toLocaleString()}`;
    }

    if (result.price) {
      return `${result.currency} ${result.price.toLocaleString()}`;
    }

    return "Price not available";
  };

  const renderListingItem = (item: ListingResult) => (
    <TouchableOpacity
      style={styles.listingCard}
      onPress={() => handleListingPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {item.primary_image ? (
          <Image
            source={{ uri: item.primary_image.image }}
            style={styles.listingImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.listingImage, styles.placeholderImage]}>
            <Ionicons name="image-outline" size={40} color={colors.neutral300} />
          </View>
        )}
        {item.is_featured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={12} color="#fff" />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.quickViewButton}
          onPress={() => {
            if (item.id) {
              router.push(`/listing/${item.id}`);
            }
          }}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.listingDescription}>
        <Text style={styles.listingTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.merchantRow}>
          {item.merchant.verified && (
            <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
          )}
          <Text style={styles.merchantName} numberOfLines={1}>
            {item.merchant.display_name}
          </Text>
        </View>
        <Text style={styles.listingPrice}>{formatPrice(item)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderMerchantItem = (item: MerchantResult) => (
    <TouchableOpacity
      style={styles.merchantCard}
      onPress={() => handleMerchantPress(item)}
      activeOpacity={0.7}
    >
      {item.logo ? (
        <Image source={{ uri: item.logo }} style={styles.merchantLogo} />
      ) : (
        <View style={[styles.merchantLogo, styles.placeholderLogo]}>
          <Ionicons name="storefront-outline" size={28} color={colors.neutral400} />
        </View>
      )}
      <View style={styles.merchantInfo}>
        <View style={styles.merchantHeader}>
          <Text style={styles.merchantTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {item.verified && (
            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
          )}
        </View>
        <Text style={styles.merchantDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.merchantFooter}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFA500" />
            <Text style={styles.ratingText}>
              {item.rating.toFixed(1)} ({item.total_reviews})
            </Text>
          </View>
          {item.location && (
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={12} color={colors.neutral500} />
              <Text style={styles.locationText}>{item.location.name}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: SearchResult }) => {
    if (item.type === "listing") {
      return renderListingItem(item);
    } else {
      return renderMerchantItem(item);
    }
  };

  const renderShimmerGrid = () => (
    <View style={styles.shimmerContainer}>
      <View style={styles.row}>
        <ListingShimmerCard />
        <ListingShimmerCard />
      </View>
      <MerchantShimmerCard />
      <View style={styles.row}>
        <ListingShimmerCard />
        <ListingShimmerCard />
      </View>
      <MerchantShimmerCard />
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmptyState = () => {
    if (!hasSearched) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={64} color={colors.neutral200} />
          <Text style={styles.emptyTitle}>Search Kakebe Shop</Text>
          <Text style={styles.emptySubtitle}>
            Find products, services, and trusted merchants
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.neutral300} />
        <Text style={styles.emptyTitle}>No results found</Text>
        <Text style={styles.emptySubtitle}>
          Try different keywords or adjust your filters
        </Text>
      </View>
    );
  };

  const getSortLabel = (value: SortOption): string => {
    const option = SORT_OPTIONS.find((opt) => opt.value === value);
    return option?.label || "Sort";
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {/* Search Header */}
        <View style={styles.searchHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.black} />
          </TouchableOpacity>

          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={colors.neutral400} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search products, merchants..."
              placeholderTextColor={colors.neutral400}
              value={searchQuery}
              onChangeText={handleSearchTextChange}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="never"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClear} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={20} color={colors.neutral400} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Bar */}
        <View style={styles.filterBar}>
          {/* Type Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {TYPE_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.value}
                style={[
                  styles.filterChip,
                  filterType === filter.value && styles.filterChipActive,
                ]}
                onPress={() => handleTypeFilterChange(filter.value as FilterType)}
                activeOpacity={0.7}
              >
                {filter.icon && (
                  <Ionicons
                    name={filter.icon as any}
                    size={16}
                    color={
                      filterType === filter.value ? colors.white : colors.neutral600
                    }
                  />
                )}
                <Text
                  style={[
                    styles.filterChipText,
                    filterType === filter.value && styles.filterChipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Sort Button */}
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-vertical" size={18} color={colors.neutral600} />
            <Text style={styles.sortButtonText}>Sort</Text>
          </TouchableOpacity>
        </View>

        {/* Results Info */}
        {hasSearched && !loading && (
          <View style={styles.resultsInfo}>
            <Text style={styles.resultsInfoText}>
              {totalCount} {totalCount === 1 ? "result" : "results"}
              {metadata && metadata.query && ` for "${metadata.query}"`}
            </Text>
            {metadata && metadata.sort !== "relevance" && (
              <Text style={styles.sortedByText}>
                Sorted by: {getSortLabel(metadata.sort as SortOption)}
              </Text>
            )}
          </View>
        )}
      </SafeAreaView>

      {/* Results */}
      <View style={styles.resultsContainer}>
        {loading ? (
          renderShimmerGrid()
        ) : results.length > 0 ? (
          <FlatList
            data={results}
            renderItem={renderItem}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
          />
        ) : (
          renderEmptyState()
        )}
      </View>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort By</Text>
              <TouchableOpacity
                onPress={() => setShowSortModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color={colors.neutral600} />
              </TouchableOpacity>
            </View>

            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.sortOption}
                onPress={() => handleSortChange(option.value as SortOption)}
                activeOpacity={0.7}
              >
                <View style={styles.sortOptionLeft}>
                  {option.icon && (
                    <Ionicons
                      name={option.icon as any}
                      size={20}
                      color={
                        sortBy === option.value ? colors.primary : colors.neutral500
                      }
                    />
                  )}
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortBy === option.value && styles.sortOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
                {sortBy === option.value && (
                  <Ionicons name="checkmark" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral50,
  },
  safeArea: {
    backgroundColor: colors.white,
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacingX._12,
    paddingVertical: spacingY._10,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.neutral100,
    paddingHorizontal: spacingX._12,
    paddingVertical: spacingY._10,
    borderRadius: radius._8,
    borderWidth: 1,
    borderColor: colors.neutral200,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacingX._10,
    fontSize: 15,
    color: colors.black,
    fontWeight: "500",
    padding: 0,
  },
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacingY._12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
  },
  filterScrollContent: {
    paddingHorizontal: spacingX._16,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.neutral100,
    borderWidth: 1,
    borderColor: colors.neutral200,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.neutral600,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: spacingX._16,
    borderRadius: 20,
    backgroundColor: colors.neutral100,
    borderWidth: 1,
    borderColor: colors.neutral200,
  },
  sortButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.neutral600,
  },
  resultsInfo: {
    paddingHorizontal: spacingX._16,
    paddingVertical: spacingY._10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
  },
  resultsInfoText: {
    fontSize: 13,
    color: colors.neutral600,
    fontWeight: "500",
  },
  sortedByText: {
    fontSize: 12,
    color: colors.neutral500,
    marginTop: 2,
  },
  resultsContainer: {
    flex: 1,
  },
  listContent: {
    padding: spacingX._16,
    paddingBottom: spacingY._20,
  },
  shimmerContainer: {
    padding: spacingX._16,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  listingCard: {
    width: "48%",
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral100,
    overflow: "hidden",
    marginBottom: 12,
  },
  imageContainer: {
    position: "relative",
  },
  listingImage: {
    width: "100%",
    height: 180,
  },
  placeholderImage: {
    backgroundColor: colors.neutral100,
    alignItems: "center",
    justifyContent: "center",
  },
  featuredBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  featuredText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  quickViewButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  listingDescription: {
    padding: 10,
  },
  listingTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    color: colors.black,
  },
  merchantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  merchantName: {
    fontSize: 12,
    color: colors.neutral500,
    flex: 1,
  },
  listingPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.black,
  },
  merchantCard: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral100,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  merchantLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  placeholderLogo: {
    backgroundColor: colors.neutral100,
    alignItems: "center",
    justifyContent: "center",
  },
  merchantInfo: {
    flex: 1,
    gap: 4,
  },
  merchantHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  merchantTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.black,
    flex: 1,
  },
  merchantDescription: {
    fontSize: 13,
    color: colors.neutral600,
    lineHeight: 18,
  },
  merchantFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: colors.neutral600,
    fontWeight: "500",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  locationText: {
    fontSize: 12,
    color: colors.neutral500,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacingY._60,
    paddingHorizontal: spacingX._24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.neutral600,
    marginTop: spacingY._16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.neutral400,
    marginTop: spacingY._8,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: spacingY._24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.black,
  },
  sortOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._15,
  },
  sortOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sortOptionText: {
    fontSize: 15,
    color: colors.neutral700,
  },
  sortOptionTextActive: {
    color: colors.primary,
    fontWeight: "600",
  },
});