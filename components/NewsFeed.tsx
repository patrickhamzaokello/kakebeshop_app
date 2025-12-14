import { colors } from "@/constants/theme";
import { getLatestNews } from "@/utils/apiEndpoints";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from "react-native";
import Typo from "./Typo";
import { Article } from "@/utils/types";
import TopStoryComponent from "@/components/TopStoryComponent";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import { Ionicons } from "@expo/vector-icons";

const NewsArticle = React.memo(
  ({
    article,
    showImage = false,
  }: {
    article: Article;
    showImage: boolean;
  }) => {
    const formatTimeAgo = (publishedAt: string) => {
      const now = new Date();
      const publishedDate = new Date(publishedAt);
      const diffInMinutes = Math.floor(
        (now.getTime() - publishedDate.getTime()) / (1000 * 60)
      );
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInMinutes < 1) return "just now";
      if (diffInMinutes < 60)
        return diffInMinutes === 1 ? "1 min ago" : `${diffInMinutes} mins ago`;
      if (diffInHours < 24)
        return diffInHours === 1 ? "1 hr ago" : `${diffInHours} hrs ago`;
      return diffInDays === 1 ? "1 day ago" : `${diffInDays} days ago`;
    };

    const router = useRouter();
    // Layout for articles without full content
    if (!article.has_full_content) {
      return (
        <Pressable
          style={styles.newsarticle_withoutfullContent}
          onPress={() => Linking.openURL(article.url)}
        >
          {article.featured_image_url && (
            <Image
              source={{ uri: article.featured_image_url }}
              style={{
                width: "100%",
                height: 200,
                borderRadius: 8,
                opacity: 0.9,
              }}
              contentFit="cover"
              transition={1000}
              cachePolicy="memory-disk"
            />
          )}

          <View style={styles.noFullContentFooter}>
            <View style={styles.news_info}>
              <Typo size={14} fontWeight={"300"} color={colors.matteBlack}>
                {article.source?.name || "Unknown Author"}
              </Typo>
              <Typo size={14} fontWeight={"300"} color={colors.matteBlack}>
                •
              </Typo>
              <Typo size={14} fontWeight={"300"} color={colors.matteBlack}>
                {formatTimeAgo(article.scraped_at)}
              </Typo>
            </View>
          </View>

          <Typo size={22} fontWeight={"700"} color={colors.matteBlack}>
          {article.title}
        </Typo>

        

          <View
            style={{
              borderBottomColor: colors.lineseparator,
              borderBottomWidth: 1,
              paddingTop: 10,
              opacity: 0.6,
            }}
          />
        </Pressable>
      );
    }

    return (
      <Pressable
        style={showImage ? styles.topStory : styles.newsarticle}
        onPress={() => router.push(`/article/${article.id}`)}
      >
     
        <Typo size={22} fontWeight={"700"} color={colors.matteBlack}>
          {article.title}
        </Typo>

        {showImage && article.featured_image_url && (
          <Image
            source={{ uri: article.featured_image_url }}
            style={{ width: "100%", height: 170, borderRadius: 10 }}
            contentFit="cover"
            transition={1000}
            cachePolicy="memory-disk"
          />
        )}

        <Typo size={17} fontWeight={"400"} color={colors.matteBlack}>
          {article.excerpt}
        </Typo>

        <View style={styles.news_info}>
          <Typo size={15} fontWeight={"300"} color={colors.matteBlack}>
            {article.author?.name || "Unknown Author"}
          </Typo>
          <Typo size={15} fontWeight={"300"} color={colors.matteBlack}>
            •
          </Typo>
          <Typo size={15} fontWeight={"300"} color={colors.matteBlack}>
            {article.read_time_minutes} min read
          </Typo>
          <Typo size={15} fontWeight={"300"} color={colors.matteBlack}>
            •
          </Typo>
          <Typo size={15} fontWeight={"300"} color={colors.matteBlack}>
            {formatTimeAgo(article.scraped_at)}
          </Typo>
        </View>

             {/* Source and Read Status */}
      <View style={styles.articleFooter}>
        <View style={styles.sourceContainer}>
          <Ionicons name="newspaper-outline" size={14} color="#8E8E93" />
          <Typo style={styles.sourceText}>{article.source.name}</Typo>
        </View>
      </View>

        <View
          style={{
            borderBottomColor: colors.lineseparator,
            borderBottomWidth: 1,
          }}
        />
      </Pressable>
    );
  }
);

const NewsGroup = React.memo(({ articles }: { articles: Article[] }) => {
  if (!articles || articles.length === 0) return null;

  return (
    <View>
      <NewsArticle article={articles[0]} showImage={true} />
      {articles.length > 1 && (
        <NewsArticle article={articles[1]} showImage={false} />
      )}
      {articles.length > 2 && (
        <NewsArticle article={articles[2]} showImage={false} />
      )}
    </View>
  );
});

interface NewsData {
  count: number;
  next: string | null;
  previous: string | null;
  results: Article[];
}

const NewsFeed = () => {
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const flatListRef = useRef<FlatList>(null);
  const scrollPosition = useRef({ scrollY: 0, lastPage: 1 });

  const fetchNews = async (page: number, url?: string) => {
    try {
      const data: NewsData = await getLatestNews(page);
      return data || null;
    } catch (error) {
      throw error;
    }
  };

  const loadInitialNews = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchNews(1);
      if (data) {
        setAllArticles(data.results);
        setNextUrl(data.next);
        setCurrentPage(1);
        setHasMore(!!data.next);
        // Reset scroll position on initial load
        scrollPosition.current = { scrollY: 0, lastPage: 1 };
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const loadMoreNews = useCallback(async () => {
    if (!nextUrl || isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      const data = await fetchNews(currentPage + 1, nextUrl);
      if (data) {
        // Store current scroll position before updating state
        const newArticles = [...allArticles, ...data.results];
        setAllArticles(newArticles);
        setNextUrl(data.next);
        setCurrentPage((prev) => prev + 1);
        setHasMore(!!data.next);
        scrollPosition.current.lastPage = currentPage + 1;
        // Maintain scroll position after loading more
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({
            offset: scrollPosition.current.scrollY,
            animated: false,
          });
        }, 0);
      }
    } catch (error) {
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextUrl, isLoadingMore, hasMore, currentPage, allArticles]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadInitialNews();
  }, [loadInitialNews]);

  useEffect(() => {
    loadInitialNews();
  }, [loadInitialNews]);

  const onEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore && !isRefreshing) {
      loadMoreNews();
    }
  }, [hasMore, isLoadingMore, isRefreshing, loadMoreNews]);

  const onScroll = useCallback(
    ({ nativeEvent }: { nativeEvent: { contentOffset: { y: number } } }) => {
      scrollPosition.current.scrollY = nativeEvent.contentOffset.y;
    },
    []
  );

  // Group articles into sets of 3
  const groupedArticles = [];
  for (let i = 0; i < allArticles.length; i += 3) {
    groupedArticles.push(allArticles.slice(i, i + 3));
  }

  const renderNewsGroup = useCallback(
    ({ item: articleGroup, index }: { item: Article[]; index: number }) => (
      <NewsGroup
        key={`group-${index}-${articleGroup[0]?.id}`}
        articles={articleGroup}
      />
    ),
    []
  );

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="large" color={colors.matteBlack} />
        <Typo size={16} fontWeight="400" color={colors.matteBlack}>
          Loading more articles...
        </Typo>
      </View>
    );
  }, [isLoadingMore]);

  const renderHeader = useCallback(
    () => (
      <View>
        <TopStoryComponent />
        <FeaturedCarousel />
      </View>
    ),
    []
  );

  const renderEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Typo>No news articles available</Typo>
      </View>
    ),
    []
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.white} />
        <Typo size={16} fontWeight="400" color={colors.white}>
          Loading news...
        </Typo>
      </View>
    );
  }

  return (
    <FlatList
      ref={flatListRef}
      data={groupedArticles}
      renderItem={renderNewsGroup}
      keyExtractor={(item, index) => `group-${index}-${item[0]?.id}`}
      style={{ backgroundColor: colors.black }}
      contentContainerStyle={{ paddingBottom: 30 }}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      onScroll={onScroll}
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
  );
};

const styles = StyleSheet.create({
  topStory: {
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    paddingBottom: 20,
    paddingTop: 20,
    gap: 20,
  },
  newsarticle: {
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    paddingBottom: 20,
    gap: 18,
  },

  newsarticle_withoutfullContent: {
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    paddingBottom: 20,
    gap: 6,
  },
  news_info: {
    flexDirection: "row",
    gap: 10,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.black,
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

  noFullContentArticle: {
    opacity: 0.95,
  },
  noFullContentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  noFullContentBadge: {
    backgroundColor: "#6B7280",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  externalLinkIcon: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  }, 

  noFullContentFooter: {
    gap: 6,
  },
});

export default NewsFeed;
