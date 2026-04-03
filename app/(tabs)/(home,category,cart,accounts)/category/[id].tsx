import React, { useCallback, useEffect, useState } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { spacingX, spacingY, radius } from "@/constants/theme";
import { useSectionData } from "@/hooks/useSectionData";
import { categoryService } from "@/utils/services/categoryService";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { AllListings } from "@/components/test/AllListings";
import { TwoColumnGridCategorySection } from "@/components/test/TwoColumnGridVerticalCategory";
import { useTheme } from '@/contexts/ThemeContext';


export default function CategoryDetailsPage() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();

  // Ensure id is a string (handle array case from paramrs)
  const categoryId = Array.isArray(params.id) ? params.id[0] : params.id;

  // Fetch category details and subcategories
  const categoryDetails = useSectionData(() =>
    categoryService.getCategoryDetails(categoryId)
  );

  const categorySubcategories = useSectionData(() =>
    categoryService.getCategorySubcategories(categoryId)
  );

  // Fetch category listings with infinite scroll
  const {
    data: categoriesListings,
    loading: listingsLoading,
    hasMore,
    loadMore,
    refresh: refreshListings,
  } = useInfiniteScroll(
    (page: number, limit: number) =>
      categoryService.getCategoryListings(categoryId, page, limit),
    10
  );

  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Pull to refresh all sections
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        categoryDetails.refetch(),
        categorySubcategories.refetch(),
        refreshListings(),
      ]);
    } catch (error) {
      if (__DEV__) {
        console.error("Error refreshing:", error);
      }
    } finally {
      setRefreshing(false);
    }
  }, [categoryDetails, categorySubcategories, refreshListings]);

  // Early return if no category ID
  if (!categoryId) {
    return (
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <SafeAreaView edges={["top"]} >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Category Not Found</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>

      <SafeAreaView edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: colors.textPrimary}]}>
            {categoryDetails.data?.name || "Category Details"}
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <TwoColumnGridCategorySection
          titleText="Categories"
          data={categorySubcategories.data}
          loading={categorySubcategories.loading}
          onCategoryPress={(category) => router.push(`/category/${category.id}`)}
          onSeeAll={() => router.push("/category")}
          maxItems={20} 
        />

        <AllListings
          data={categoriesListings}
          loading={listingsLoading}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onListingPress={(listing) =>
            router.push({
              pathname: "/listing/[id]",
              params: { id: listing.id },
            })
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacingX._16,
    paddingTop: spacingY._8,
    paddingBottom: spacingY._12,
  },
  backButton: {
    marginRight: spacingX._12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    flex: 1,
  },
  
  scrollView: {
    flex: 1,
  },
});
