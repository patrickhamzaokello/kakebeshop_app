import React, { useCallback, useEffect, useRef, useState } from "react";
import { Text } from "@/components/Text";
import { StyleSheet, View, TouchableOpacity, ScrollView, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useScrollToTop } from "@react-navigation/native";
import { spacingX, spacingY, radius } from "@/constants/theme";
import { useSectionData } from "@/hooks/useSectionData";
import { categoryService } from "@/utils/services/categoryService";
import { SeparateCarouselType } from "@/components/test/SeparateCarouselType";
import { ThrewColumnGridCategorySection } from "@/components/test/ThrewColumnGridCategorySection";
import { CategorySubCategorySection } from "@/components/test/CategorySubCategorySection";
import { useTheme } from "@/contexts/ThemeContext";

const PAGE_SIZE = 10;

export default function ExplorePage() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { colors } = useTheme();

  useScrollToTop(scrollRef);

  const carouselData = useSectionData(() => categoryService.getCurrentPromoAds());
  const mainCategoriesData = useSectionData(() => categoryService.getMaincategories());

  // ── Categories with subcategories — simple direct fetch, no hook ──────────
  const [categories, setCategories] = useState<any[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextPage, setNextPage] = useState(2);
  const isFetchingRef = useRef(false);

  const fetchCategories = useCallback(async (page: number, reset: boolean) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (reset) setListingsLoading(true);
    else setLoadingMore(true);

    try {
      const result = await categoryService.getMainCategoriesandSubcategories(page, PAGE_SIZE);
      if (__DEV__) console.log(`[categories] page=${page} results=${result.results.length} hasMore=${result.hasMore}`);

      setCategories(prev => reset ? result.results : [...prev, ...result.results]);
      setHasMore(result.hasMore ?? result.next != null);
      setNextPage(page + 1);
    } finally {
      isFetchingRef.current = false;
      if (reset) setListingsLoading(false);
      else setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories(1, true);
  }, [fetchCategories]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) fetchCategories(nextPage, false);
  }, [loadingMore, hasMore, nextPage, fetchCategories]);

  const refreshCategories = useCallback(async () => {
    setNextPage(2);
    await fetchCategories(1, true);
  }, [fetchCategories]);

  // ── Pull-to-refresh all ───────────────────────────────────────────────────
  const [refreshing, setRefreshing] = useState(false);

  const handleSearchPress = () => router.push("/(tabs)/(category)/search");

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      carouselData.refetch(),
      mainCategoriesData.refetch(),
      refreshCategories(),
    ]);
    setRefreshing(false);
  }, [carouselData.refetch, mainCategoriesData.refetch, refreshCategories]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      <SafeAreaView edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, {color: colors.textPrimary}]}>Explore</Text>
        </View>

        {/* Search Input */}
        <TouchableOpacity
          style={[styles.searchContainer, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={handleSearchPress}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={20} color={colors.neutral400} />
          <Text style={[styles.searchPlaceholder, { color: colors.neutral400 }]}>
            Search products, brands...
          </Text>
          <Ionicons
            name="options-outline"
            size={18}
            color={colors.neutral400}
          />
        </TouchableOpacity>
      </SafeAreaView>

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* cards for promos, horizontal scroll */}
          <SeparateCarouselType data={carouselData.data} loading={carouselData.loading} />

        {/* shop by category section header and horizontal scroll of 3 rows */}
        <ThrewColumnGridCategorySection
                        data={mainCategoriesData.data}
                        titleText={"Shop by Category"}
                        loading={mainCategoriesData.loading}
                        onCategoryPress={(category) => 
                            router.push({
                                pathname: '/category/[id]',
                                params: { id: category.id }
                            })
                        }
                    />

                    <CategorySubCategorySection
                                    data={categories}
                                    loading={listingsLoading}
                                    hasMore={hasMore}
                                    onLoadMore={loadMore}
                                    onexplorePress={(category) =>  router.push({
                                      pathname: '/category/[id]',
                                      params: { id: category.id }
                                  })
                              }
                                    onListingPress={(subcategory) =>
                                        router.push({
                                            pathname: '/category/[id]',
                                            params: { id: subcategory.id }
                                        })
                                    }
                                />

        {/* each category heading with grid of 4 cards showing sub categories (tile and image) */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacingX._16,
    paddingTop: spacingY._8,
    paddingBottom: spacingY._12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: spacingX._16,
    marginBottom: spacingY._12,
    paddingHorizontal: spacingX._16,
    paddingVertical: spacingY._12,
    borderRadius: radius._8,
    borderWidth: 1,
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: spacingX._12,
    fontSize: 15,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
});
