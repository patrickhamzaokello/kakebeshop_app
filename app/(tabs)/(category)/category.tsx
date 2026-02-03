import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  FlatList,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors, spacingX, spacingY, radius } from "@/constants/theme";
import { useSectionData } from "@/hooks/useSectionData";
import { categoryService } from "@/utils/services/categoryService";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { SeparateCarouselType } from "@/components/test/SeparateCarouselType";
import { ThrewColumnGridCategorySection } from "@/components/test/ThrewColumnGridCategorySection";

export default function ExplorePage() {
  const router = useRouter();

  // Section data hooks - inline functions are now safe
  const carouselData = useSectionData(() =>
    categoryService.getCurrentPromoAds()
  );
  const mainCategoriesData = useSectionData(() =>
    categoryService.getMaincategories()
  );


  const handleSearchPress = () => {
    router.push("/(tabs)/(category)/search");
  };

  const {
    data: listings,
    loading: listingsLoading,
    hasMore,
    loadMore,
    refresh: refreshListings,
  } = useInfiniteScroll(
    (page, limit) => categoryService.getMainCategoriesandSubcategories(page, limit),
    10
  );

  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Pull to refresh all sections
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      carouselData.refetch(),
      mainCategoriesData.refetch(),
      refreshListings(),
    ]);
    setRefreshing(false);
  }, [
    carouselData.refetch,
    mainCategoriesData.refetch,
    refreshListings,
  ]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore</Text>
        </View>

        {/* Search Input */}
        <TouchableOpacity
          style={styles.searchContainer}
          onPress={handleSearchPress}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={20} color={colors.neutral400} />
          <Text style={styles.searchPlaceholder}>
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

        {/* each category heading with grid of 4 cards showing sub categories (tile and image) */}
      </ScrollView>
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
  header: {
    paddingHorizontal: spacingX._16,
    paddingTop: spacingY._8,
    paddingBottom: spacingY._12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.black,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.neutral100,
    marginHorizontal: spacingX._16,
    marginBottom: spacingY._12,
    paddingHorizontal: spacingX._16,
    paddingVertical: spacingY._12,
    borderRadius: radius._8,
    borderWidth: 1,
    borderColor: colors.neutral200,
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: spacingX._12,
    fontSize: 15,
    color: colors.neutral400,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
});
