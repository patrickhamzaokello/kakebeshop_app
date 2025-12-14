import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { Article, SearchArticle } from "@/utils/types";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  searchSuggestions,
  SearchArticle as searchEndpoint,
} from "@/utils/apiEndpoints";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
  Keyboard,
  TouchableWithoutFeedback,
  Linking,
} from "react-native";

interface SearchSuggestionsResponse {
  suggestions: string[];
}

interface SearchArticlesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  page_size: number;
  total_pages: number;
  current_page: number;
  results: SearchArticle[];
}

export default function SearchScreen() {
  const [formData, setFormData] = useState({
    searchTerm: "",
  });

  const router = useRouter();
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy] = useState<string>("relevance");
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const navigateToArticle = (article: SearchArticle) => {
    if(article.has_full_content) {
      router.push(`/article/${article.id}`);
    } else  {
      Linking.openURL(article.url)
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Dismiss keyboard when clicking outside
  const dismissKeyboard = () => {
    Keyboard.dismiss();
    setFocusedField(null);
    setShowSuggestions(false);
  };

  // Fetch search suggestions
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const data: SearchSuggestionsResponse = await searchSuggestions(
        query
      );
      setSuggestions(data.suggestions || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  // Fetch search results
  const performSearch = useCallback(
    async (query: string, refresh = false, customSortBy?: string, page = 1, append = false) => {
      if (!query.trim()) {
        setSearchResults([]);
        setHasSearched(false);
        setCurrentPage(1);
        setTotalPages(0);
        setHasNextPage(false);
        return;
      }

      if (refresh) {
        setRefreshing(true);
      } else if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        // Use the current sortBy or the custom one passed
        const currentSort = customSortBy || sortBy;
        
        // Build the query string properly
        let searchQuery = query.trim();
        
        // Add page parameter
        searchQuery = `${searchQuery}&page=${page}`;
        
        // Add sort parameter if needed
        if (currentSort && currentSort !== 'relevance') {
          searchQuery = `${searchQuery}&sort_by=${currentSort}`;
        }
        
        console.log("Searching articles with query:", searchQuery);
        const data: SearchArticlesResponse = await searchEndpoint(searchQuery);
        
        if (append) {
          // Append new results to existing ones
          setSearchResults(prev => [...prev, ...(data.results || [])]);
        } else {
          // Replace existing results
          setSearchResults(data.results || []);
        }
        
        // Update pagination state
        setCurrentPage(data.current_page || page);
        setTotalPages(data.total_pages || 0);
        setHasNextPage(!!data.next);
        
        setHasSearched(true);
        setShowSuggestions(false);
      } catch (error) {
        console.error("Error performing search:", error);
        Alert.alert("Error", "Failed to search articles. Please try again.");
        if (!append) {
          setSearchResults([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [sortBy]
  );

  // Debounced suggestion fetching
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.searchTerm && focusedField === "searchTerm") {
        fetchSuggestions(formData.searchTerm);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [formData.searchTerm, focusedField, fetchSuggestions]);

  // Handle search submission
  const handleSearch = useCallback(() => {
    if (formData.searchTerm.trim()) {
      dismissKeyboard();
      performSearch(formData.searchTerm.trim());
    }
  }, [formData.searchTerm, performSearch]);

  // Handle suggestion selection
  const handleSuggestionPress = useCallback(
    (suggestion: string) => {
      setFormData((prev) => ({ ...prev, searchTerm: suggestion }));
      setShowSuggestions(false);
      dismissKeyboard();
      performSearch(suggestion);
    },
    [performSearch]
  );

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    setFormData({ searchTerm: "" });
    setSearchResults([]);
    setHasSearched(false);
    setShowSuggestions(false);
    setSuggestions([]);
    setCurrentPage(1);
    setTotalPages(0);
    setHasNextPage(false);
    dismissKeyboard();
  }, []);

  // Handle sort option selection
  const handleSortSelect = useCallback(
    (sortOption: string) => {
      setSortBy(sortOption);
      setShowSortOptions(false);
      // Reset pagination when changing sort
      setCurrentPage(1);
      setTotalPages(0);
      setHasNextPage(false);
      if (formData.searchTerm.trim()) {
        // Pass the new sort option directly to avoid using stale state
        performSearch(formData.searchTerm.trim(), false, sortOption, 1, false);
      }
    },
    [formData.searchTerm, performSearch]
  );

  const sortOptions = [
    { label: "All", value: "all" },
    { label: "Relevance", value: "relevance" },
    { label: "Most Popular", value: "popularity" },
    { label: "Newest First", value: "date_desc" },
    { label: "Oldest First", value: "date_asc" },
  ];

  // Handle refresh
  const onRefresh = useCallback(() => {
    if (formData.searchTerm.trim()) {
      setCurrentPage(1);
      setTotalPages(0);
      setHasNextPage(false);
      performSearch(formData.searchTerm.trim(), true, undefined, 1, false);
    }
  }, [formData.searchTerm, performSearch]);

  // Handle load more (pagination)
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !loadingMore && !loading && formData.searchTerm.trim()) {
      const nextPage = currentPage + 1;
      performSearch(formData.searchTerm.trim(), false, undefined, nextPage, true);
    }
  }, [hasNextPage, loadingMore, loading, currentPage, formData.searchTerm, performSearch]);

  // Handle end reached
  const onEndReached = useCallback(() => {
    handleLoadMore();
  }, [handleLoadMore]);

  // Handle input focus
  const handleInputFocus = () => {
    setFocusedField("searchTerm");
    if (formData.searchTerm && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle input blur
  const handleInputBlur = () => {
    // Delay hiding suggestions to allow tap on suggestion
    setTimeout(() => {
      setFocusedField(null);
      setShowSuggestions(false);
    }, 200);
  };

  const renderSearchArticleItem = ({ item }: { item: SearchArticle }) => (
    <View style={styles.articleItem}>
      <Pressable
        style={styles.articlePressable}
        onPress={() => navigateToArticle(item)}
      >
        <Image
          source={{ uri: item.featured_image_url }}
          style={styles.articleImage}
          contentFit="cover"
          transition={300}
        />

        <View style={styles.articleContent}>
          <View style={styles.topRow}>
            <Text style={styles.categoryText}>
              {item.category?.name || "General"}
            </Text>
            <Text style={styles.articleDate}>
              {formatDate(item.scraped_at)}
            </Text>
          </View>
          <Text style={styles.authorText} numberOfLines={2}>
            {item.source.name}
          </Text>
          <Text style={styles.articleTitle} numberOfLines={4}>
            {item.title}
          </Text>
        </View>
      </Pressable>
    </View>
  );

  const renderSuggestionItem = ({ item }: { item: string }) => (
    <Pressable
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
    >
      <Feather
        name="search"
        size={16}
        color="rgba(255, 255, 255, 0.6)"
        style={styles.suggestionIcon}
      />
      <Text style={styles.suggestionText} numberOfLines={1}>
        {item}
      </Text>
    </Pressable>
  );

  const renderEmptyState = () => {
    if (loading) return null;

    if (!hasSearched) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyEmoji}>🔍</Text>
          </View>
          <Text style={styles.emptyTitle}>Search Articles</Text>
          <Text style={styles.emptySubtext}>
            Enter a search term above to find articles that match your
            interests.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Text style={styles.emptyEmoji}>📄</Text>
        </View>
        <Text style={styles.emptyTitle}>No Results Found</Text>
        <Text style={styles.emptySubtext}>
          We couldn't find any articles matching "{formData.searchTerm}". Try
          different keywords or check your spelling.
        </Text>
        <Pressable
          style={styles.exploreButton}
          onPress={() => {
            handleClearSearch();
          }}
        >
          <Text style={styles.exploreButtonText}>Clear Search</Text>
        </Pressable>
      </View>
    );
  };

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoadingContainer}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={styles.footerLoadingText}>Loading more articles...</Text>
        </View>
      );
    }

    if (hasSearched && searchResults.length > 0 && !hasNextPage) {
      return (
        <View style={styles.footerEndContainer}>
          <Text style={styles.footerEndText}>
            You've reached the end of the results
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <ScreenWrapper style={styles.container} statusBarStyle="light-content">
        <View style={styles.header}>
        <Typo color={colors.white} fontWeight={"800"} size={25}>
          SEARCH
        </Typo>

          <TouchableWithoutFeedback>
            <View
              style={[
                styles.inputWrapper,
                (focusedField === "searchTerm" || formData.searchTerm) &&
                  styles.inputFocused,
              ]}
            >
              <Feather
                name="search"
                size={20}
                color="#9ca3af"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Search articles..."
                placeholderTextColor="#9ca3af"
                value={formData.searchTerm}
                onChangeText={(value) => handleInputChange("searchTerm", value)}
                keyboardType="default"
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onSubmitEditing={handleSearch}
              />
              {formData.searchTerm.length > 0 && (
                <Pressable onPress={handleClearSearch} style={styles.clearButton}>
                  <Feather name="x" size={18} color="#9ca3af" />
                </Pressable>
              )}
            </View>
          </TouchableWithoutFeedback>

          {/* Sort Options */}
          {hasSearched && searchResults.length > 0 && (
            <View style={styles.sortContainer}>
              <Pressable
                style={styles.sortButton}
                onPress={() => setShowSortOptions(!showSortOptions)}
              >
                <Text style={styles.sortButtonText}>
                  Sort by:{" "}
                  {sortOptions.find((opt) => opt.value === sortBy)?.label}
                </Text>
                <Feather
                  name={showSortOptions ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="rgba(255, 255, 255, 0.7)"
                />
              </Pressable>

              {showSortOptions && (
                <View style={styles.sortOptionsContainer}>
                  {sortOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.sortOption,
                        sortBy === option.value && styles.sortOptionActive,
                      ]}
                      onPress={() => handleSortSelect(option.value)}
                    >
                      <Text
                        style={[
                          styles.sortOptionText,
                          sortBy === option.value && styles.sortOptionActiveText,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {sortBy === option.value && (
                        <Feather name="check" size={16} color="#8B5CF6" />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={suggestions}
              keyExtractor={(item, index) => `${item}-${index}`}
              renderItem={renderSuggestionItem}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        )}

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Searching articles...</Text>
          </View>
        )}

        {/* Search Results */}
        {!loading && !showSuggestions && (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderSearchArticleItem}
            contentContainerStyle={[
              styles.listContainer,
              searchResults.length === 0 && styles.emptyListContainer,
            ]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FFFFFF"
              />
            }
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={renderFooter}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={10}
            getItemLayout={undefined}
          />
        )}
      </ScreenWrapper>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    justifyContent: "center",
    borderBottomWidth: 1,
    backgroundColor: colors.black,
    paddingBottom: 10,
    paddingHorizontal: 20,
    paddingTop: 25,
    borderBottomColor: colors.border,
  },
  inputContainer: {
    marginBottom: spacingY._4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.matteBlack,
    backgroundColor: colors.matteBlack + "10",
    borderRadius: 12,
    paddingHorizontal: spacingX._16,
    marginTop: 18,
    minHeight: verticalScale(52),
  },
  inputFocused: {
    borderColor: "#D9D9D9",
    backgroundColor: colors.matteBlack + "10",
  },
  emailDisplay: {
    backgroundColor: "#F8F9FA",
    borderColor: colors.primary,
  },
  inputIcon: {
    marginRight: spacingX._12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.white,
    paddingVertical: spacingY._4,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerRight: {
    width: 40,
    alignItems: "flex-end",
  },
  articleCount: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.7)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    textAlign: "center",
    minWidth: 28,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
  },
  suggestionsContainer: {
    backgroundColor: "#000000",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  suggestionIcon: {
    marginRight: 12,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "400",
  },
  listContainer: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  emptyListContainer: {
    flex: 1,
  },
  articleItem: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  articlePressable: {
    flex: 1,
    flexDirection: "row",
  },
  articleImage: {
    width: 100,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  articleContent: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#8B5CF6",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  articleDate: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.4)",
    fontWeight: "500",
  },
  articleTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    lineHeight: 20,
    flex: 1,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  authorText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
  },
  readTimeText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "500",
  },
  actionArea: {
    width: 60,
    justifyContent: "center",
    alignItems: "center",
    paddingRight: 16,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  removeIcon: {
    fontSize: 18,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.6)",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyEmoji: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  exploreButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "600",
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  sortContainer: {
    marginTop: 12,
    position: "relative",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  sortButtonText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  sortOptionsContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginTop: 4,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  sortOptionActive: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
  },
  sortOptionText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "400",
  },
  sortOptionActiveText: {
    color: "#8B5CF6",
    fontWeight: "500",
  },
  footerLoadingContainer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 12,
  },
  footerLoadingText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
  },
  footerEndContainer: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  footerEndText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.4)",
    fontWeight: "500",
    textAlign: "center",
  },
});