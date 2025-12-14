import { colors } from "@/constants/theme";
import {
  getAllCategories,
  postFavouriteCategories,
} from "@/utils/apiEndpoints";
import React, { useEffect, useState, useCallback } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Typo from "./Typo";
import { Category } from "@/utils/types";
import { transform } from "@babel/core";
import { useAuthStore } from "@/utils/authStore";

const CategoryChip = React.memo(
  ({
    category,
    isSelected,
    onToggle,
  }: {
    category: Category;
    isSelected: boolean;
    onToggle: (categoryId: string) => void;
  }) => {
    return (
      <Pressable
        style={[styles.chip, isSelected && styles.selectedChip]}
        onPress={() => onToggle(category.id.toString())}
      >
        {isSelected && (
          <View style={styles.checkIcon}>
            <Typo size={12} fontWeight={"700"} color={colors.white}>
              ✓
            </Typo>
          </View>
        )}

        {!isSelected && (
          <View
            style={[
              styles.circle,
              {
                width: 15,
                height: 15,
                borderRadius: 15 / 2,
                borderColor: "#a1a5aa",
                borderWidth: 1,
                backgroundColor: colors.white,
              },
            ]}
          />
        )}

        <Typo
          size={14}
          fontWeight={"500"}
          color={isSelected ? colors.black : colors.matteBlack}
        >
          {category.name}
        </Typo>
      </Pressable>
    );
  }
);

interface CategoryData {
  count: number;
  next: string | null;
  previous: string | null;
  results: Category[];
}

const SelectCategory = () => {
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(
    new Set()
  );
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isContinueLoading, setIsContinueLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { resetOnboarding, completeOnboarding } = useAuthStore();

  const fetchCategories = async (page: number, url?: string) => {
    try {
      const data: CategoryData = await getAllCategories(page);
      return data || null;
    } catch (error) {
      throw error;
    }
  };

  const loadInitialCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      const data = await fetchCategories(1);
      if (data) {
        setAllCategories(data.results);
        setNextUrl(data.next);
        setCurrentPage(1);
        setHasMore(!!data.next);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      // Deselect all
      setSelectedCategoryIds(new Set());
      setIsAllSelected(false);
    } else {
      // Select all
      const allIds = allCategories.map((c) => c.id.toString());
      setSelectedCategoryIds(new Set(allIds));
      setIsAllSelected(true);
    }
  }, [isAllSelected, allCategories]);

  const loadMoreCategories = useCallback(async () => {
    if (!nextUrl || isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      const data = await fetchCategories(currentPage + 1, nextUrl);
      if (data) {
        setAllCategories((prev) => [...prev, ...data.results]);
        setNextUrl(data.next);
        setCurrentPage((prev) => prev + 1);
        setHasMore(!!data.next);
      }
    } catch (error) {
      console.error("Error loading more categories:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextUrl, isLoadingMore, hasMore, currentPage]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadInitialCategories();
  }, [loadInitialCategories]);

  const toggleCategory = useCallback((categoryId: string) => {
    setSelectedCategoryIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  useEffect(() => {
    loadInitialCategories();
  }, [loadInitialCategories]);

  const onEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore && !isRefreshing) {
      loadMoreCategories();
    }
  }, [hasMore, isLoadingMore, isRefreshing, loadMoreCategories]);

  const renderCategory = useCallback(
    ({ item: category }: { item: Category }) => (
      <CategoryChip
        category={category}
        isSelected={selectedCategoryIds.has(category.id.toString())}
        onToggle={toggleCategory}
      />
    ),
    [selectedCategoryIds, toggleCategory]
  );

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="large" color={colors.matteBlack} />
        <Typo size={16} fontWeight="400" color={colors.matteBlack}>
          Loading more categories...
        </Typo>
      </View>
    );
  }, [isLoadingMore]);

  const renderHeader = useCallback(
    () => (
      <View style={styles.header}>
        <Typo size={30} fontWeight="800" color={colors.matteBlack}>
          Select your Favourite News Category
        </Typo>
        <Typo
          size={16}
          fontWeight="400"
          color={colors.matteBlack}
          style={styles.subtitle}
        >
          Pick atleast 5 categories of news that meets your interest.
        </Typo>

        {/* Add Select All / Deselect All button */}
        <Pressable style={styles.selectAllButton} onPress={handleSelectAll}>
          <Typo size={16} fontWeight="600" color={colors.black}>
            {isAllSelected ? "Deselect All" : "Select All"}
          </Typo>
        </Pressable>
      </View>
    ),
    [handleSelectAll, isAllSelected]
  );

  const renderEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Typo>No categories available</Typo>
      </View>
    ),
    []
  );

  const handleContinue = async () => {
    try {
      setIsContinueLoading(true);
      // Handle continue action with selected categories
      const response = await postFavouriteCategories(
        Array.from(selectedCategoryIds)
      );
      if (response.categories) {
        // Complete source selection
        completeOnboarding();

        // Optionally, navigate to the next screen or show a success message
        console.log("Source selection completed successfully!");
      } else {
        console.error(
          "Failed to post favourite categories:",
          response?.message || "Unknown error"
        );
      }
    } catch (error) {
      console.error("Error posting favourite categories:", error);
    } finally {
      setIsContinueLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.matteBlack} />
        <Typo size={16} fontWeight="400" color={colors.matteBlack}>
          Loading categories...
        </Typo>
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Typo size={18} fontWeight="600" color={colors.matteBlack}>
          Failed to load categories
        </Typo>
        <Typo
          size={14}
          fontWeight="400"
          color={colors.matteBlack}
          style={styles.errorMessage}
        >
          Something went wrong while fetching categories. Please try again.
        </Typo>
        <Pressable style={styles.retryButton} onPress={loadInitialCategories}>
          <Typo size={16} fontWeight="600" color={colors.white}>
            Retry
          </Typo>
        </Pressable>
      </View>
    );
  }

  const isContinueDisabled = selectedCategoryIds.size < 5 || isContinueLoading;

  return (
    <View style={styles.container}>
      <FlatList
        data={allCategories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id.toString()}
        style={styles.flatList}
        contentContainerStyle={styles.contentContainer}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyComponent}
        showsVerticalScrollIndicator={false}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={100}
        initialNumToRender={10}
        windowSize={10}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.matteBlack]}
            tintColor={colors.matteBlack}
          />
        }
      />

      <View style={styles.footer}>
        <Pressable
          style={[
            styles.continueButton,
            isContinueDisabled && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={isContinueDisabled}
        >
          {isContinueLoading ? (
            <>
              <ActivityIndicator size="small" color={colors.white} />
              <Typo size={18} fontWeight="600" color={colors.white}>
                Loading...
              </Typo>
            </>
          ) : (
            <>
              <Typo size={18} fontWeight="600" color={colors.white}>
                Continue
              </Typo>
              <Typo size={18} fontWeight="600" color={colors.white}>
                →
              </Typo>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flatList: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  header: {
    paddingTop: 30,
    paddingBottom: 40,
    alignItems: "flex-start",
    width: "100%",
  },
  subtitle: {
    marginTop: 12,
    lineHeight: 24,
  },
  circle: {
    justifyContent: "center",
    alignItems: "center",
  },
  selectAllButton: {
    marginTop: 20,
    backgroundColor: colors.white,
    borderColor: colors.black,
    borderWidth: 1.5,
    borderRadius: 25,
    width: "100%",
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  chip: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    minHeight: 40,
    gap: 8,
  },
  selectedChip: {
    backgroundColor: "#C8FF42", // Lime green background
    borderColor: "#C8FF42",
  },
  checkIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.black,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: colors.white,
  },
  continueButton: {
    backgroundColor: colors.black,
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  continueButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
    gap: 10,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: "center",
    backgroundColor: colors.white,
    gap: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
    backgroundColor: colors.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    gap: 16,
  },
  errorMessage: {
    textAlign: "center",
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: colors.black,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
});

export default SelectCategory;
