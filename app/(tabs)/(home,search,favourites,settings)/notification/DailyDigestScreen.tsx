import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  ListRenderItem,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getArticleComments,
  getArticleDetailsBatch,
} from "@/utils/apiEndpoints";
import { router, useLocalSearchParams } from "expo-router";
import { Article } from "@/utils/types";
import { colors } from "@/constants/theme";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
const { width } = Dimensions.get("window");

export default function DailyDigestScreen() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const params = useLocalSearchParams();

  // Memoize parsed articleIds to prevent re-parsing on every render
  const articleIds = useMemo(() => {
    return params.articleIds
      ? JSON.parse(params.articleIds as string)
      : [];
  }, [params.articleIds]);

  const articleCount = params.articleCount;
  const title = params.title;

  // Load articles - removed articleIds from dependency array to prevent infinite loops
  const loadArticles = useCallback(async (forceRefresh = false) => {
    // Only proceed if we have articleIds and either it's a force refresh or we haven't loaded articles yet
    if (articleIds.length === 0) {
      setError("No articles available in this digest.");
      setLoading(false);
      return;
    }

    // Prevent unnecessary fetches if articles are already loaded and it's not a force refresh
    if (articles.length > 0 && !forceRefresh) {
      setLoading(false);
      return;
    }

    console.log("Loading articles with IDs:", articleIds);

    try {
      setError(null);
      console.log("Fetching articles for IDs:", articleIds);
      const fetchedArticles = await getArticleDetailsBatch(articleIds);
      setArticles(fetchedArticles);
    } catch (err) {
      setError("Failed to load articles. Please try again.");
      console.error("Load articles error:", err);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array since we'll pass articleIds as needed

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadArticles(true); // Force refresh
    setRefreshing(false);
  }, [loadArticles]);

  // Navigate to article detail
  const navigateToArticle = (article: Article) => {
     router.push(`/article/${article.id}`);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  // Render individual article item
  const renderArticleItem: ListRenderItem<Article> = ({
    item: article,
    index,
  }) => (
    <TouchableOpacity
      style={[styles.articleCard]}
      onPress={() => navigateToArticle(article)}
      activeOpacity={0.7}
    >
      {/* Article Image */}
      {article.featured_image_url && (
        <Image
          source={{ uri: article.featured_image_url }}
          style={styles.articleImage}
          resizeMode="cover"
        />
      )}

      {/* Article Content */}
      <View style={styles.articleContent}>
        {/* Category and Time */}
        <View style={styles.articleMeta}>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: colors.primary},
            ]}
          >
            <Typo style={styles.categoryText}>{article.category.name}</Typo>
          </View>
          <Typo style={styles.timeText}>{formatDate(article.scraped_at)}</Typo>
          {article.read_time_minutes && (
            <Typo style={styles.readTimeText}>{article.read_time_minutes} min read</Typo>
          )}
        </View>

        {/* Title */}
        <Typo
          style={
            styles.articleTitle
          }
          numberOfLines={4}
        >
          {article.title}
        </Typo>

        {/* Summary */}
        <Typo style={styles.articleSummary} numberOfLines={4}>
          {article.excerpt}
        </Typo>

        {/* Source and Read Status */}
        <View style={styles.articleFooter}>
          <View style={styles.sourceContainer}>
            <Ionicons name="newspaper-outline" size={14} color="#8E8E93" />
            <Typo style={styles.sourceText}>{article.source.name}</Typo>
          </View>
         
        </View>
      </View>
    </TouchableOpacity>
  );

  // Empty state component
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="newspaper-outline" size={64} color="#8E8E93" />
      <Typo style={styles.emptyTitle}>No Articles</Typo>
      <Typo style={styles.emptyText}>
        Your digest will appear here when articles are available.
      </Typo>
    </View>
  );

  // Footer component
  const renderFooterComponent = () => (
    <View style={styles.footer}>
      <Typo style={styles.footerText}>Stay informed with daily updates</Typo>
    </View>
  );

  // Key extractor for FlatList
  const keyExtractor = (item: Article) => item.id.toString();

  // Item separator
  const renderItemSeparator = () => <View style={styles.itemSeparator} />;

  // Effect to load articles only when articleIds change or on mount
  useEffect(() => {
    if (articleIds.length > 0) {
      loadArticles();
    }
  }, [articleIds.length]); // Only depend on the length to avoid infinite loops

  // Loading state
  if (loading && articles.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Typo style={styles.loadingText}>Loading your digest...</Typo>
        </View>
      </SafeAreaView>
    );
  }

  // Error state (only if no articles are loaded)
  if (error && articles.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
          <Typo style={styles.errorTitle}>Oops!</Typo>
          <Typo style={styles.errorText}>{error}</Typo>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadArticles(true)}>
            <Typo style={styles.retryButtonText}>Try Again</Typo>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        
        <View style={styles.headerContent}>
          <Typo style={styles.headerTitle}>Notification</Typo>
          <Typo style={styles.headerSubtitle}>
            Here are {articles.length} article{articles.length !== 1 ? "s" : ""} Just for you
          </Typo>
        </View>
        
      </View>

      {/* Articles FlatList */}
      <FlatList
        data={articles}
        renderItem={renderArticleItem}
        keyExtractor={keyExtractor}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={renderFooterComponent}
        ItemSeparatorComponent={renderItemSeparator}
        contentContainerStyle={styles.flatListContent}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={30}
        initialNumToRender={5}
        windowSize={10}
        // Optional: Add pull-to-refresh bounce effect
        bounces={true}
        // Optional: Add scroll to top functionality
        scrollsToTop={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#8E8E93",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1C1C1E",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 80,
    paddingBottom: 20,
    backgroundColor: colors.black
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 20,
    color: "#8E8E93",
    marginTop: 2,
  },
  shareButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: 16,
  },
  itemSeparator: {
    height: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1C1C1E",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 22,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: "center",
  },
  articleCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    
  },
  readArticleCard: {
    opacity: 0.7,
  },
  articleImage: {
    width: "100%",
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  articleContent: {
    padding: 16,
  },
  articleMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  categoryText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  timeText: {
    fontSize: 12,
    color: "#8E8E93",
    marginRight: 8,
  },
  readTimeText: {
    fontSize: 12,
    color: "#8E8E93",
  },
  articleTitle: {
    fontSize: 25,
    fontWeight: "900",
    color: "#1C1C1E",
    lineHeight: 30,
    marginBottom: 8,
  },
  readArticleTitle: {
    color: "#8E8E93",
  },
  articleSummary: {
    fontSize: 20,
    color: "#48484A",
    marginBottom: 12,
  },
  articleFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sourceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sourceText: {
    fontSize: 12,
    color: "#8E8E93",
    marginLeft: 4,
  },
  readIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  readText: {
    fontSize: 12,
    color: "#34C759",
    marginLeft: 4,
    fontWeight: "500",
  },
  footer: {
    padding: 32,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
  },
});