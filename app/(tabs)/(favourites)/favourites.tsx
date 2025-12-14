import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors } from "@/constants/theme";
import { Article } from "@/utils/types";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  Dimensions,
  Share,
} from "react-native";
import { getItemAsync, setItemAsync } from "expo-secure-store";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = width - (CARD_MARGIN * 2);

interface BookmarkedArticle extends Article {
  bookmarkedAt: string;
}

export default function BookmarksScreen() {
  const [bookmarks, setBookmarks] = useState<BookmarkedArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadBookmarks = async () => {
    try {
      const bookmarksData = await getItemAsync("bookmarkedArticles");
      if (bookmarksData) {
        const parsedBookmarks = JSON.parse(bookmarksData);
        // Sort by most recently bookmarked
        const sortedBookmarks = parsedBookmarks.sort(
          (a: BookmarkedArticle, b: BookmarkedArticle) =>
            new Date(b.bookmarkedAt).getTime() -
            new Date(a.bookmarkedAt).getTime()
        );
        setBookmarks(sortedBookmarks);
      } else {
        setBookmarks([]);
      }
    } catch (error) {
      setBookmarks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const removeBookmark = async (articleId: number) => {
    try {
      const updatedBookmarks = bookmarks.filter(
        (bookmark) => bookmark.id !== articleId
      );
      setBookmarks(updatedBookmarks);
      await setItemAsync(
        "bookmarkedArticles",
        JSON.stringify(updatedBookmarks)
      );
    } catch (error) {
      Alert.alert("Error", "Failed to remove bookmark");
    }
  };

  const handleRemoveBookmark = (articleId: number, title: string) => {
    Alert.alert(
      "Remove Bookmark",
      `Remove "${
        title.length > 40 ? title.substring(0, 40) + "..." : title
      }" from bookmarks?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeBookmark(articleId),
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBookmarks();
    setRefreshing(false);
  };

  const shareArticle = (article: BookmarkedArticle) => {
     
    try {
      Share.share({
        message: `${article.title}\n\nRead more at: ${article.url}`,
        title: article.title,
      });
    } catch (error) {
      Alert.alert("Error", "Unable to share article");
    }
  };

  const navigateToArticle = (articleId: number) => {
    router.push(`/article/${articleId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  // Refresh bookmarks when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadBookmarks();
    }, [])
  );

  useEffect(() => {
    loadBookmarks();
  }, []);

  const renderBookmarkCard = ({ item }: { item: BookmarkedArticle }) => (
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        {/* Main Article Content - Tappable */}
        <Pressable
          style={styles.articlePressable}
          onPress={() => navigateToArticle(item.id)}
          android_ripple={{ color: 'rgba(255, 255, 255, 0.1)' }}
        >
          {/* Image Container */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.featured_image_url }}
              style={styles.cardImage}
              contentFit="cover"
              transition={300}
            />
            <View style={styles.imageOverlay}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>
                  {item.category?.name || "General"}
                </Text>
              </View>
              <View style={styles.bookmarkStatusIndicator}>
                <Text style={styles.bookmarkStatusIcon}>📖</Text>
                <Text style={styles.bookmarkStatusText}>SAVED</Text>
              </View>
            </View>
          </View>

          {/* Content Container */}
          <View style={styles.cardContent}>
            <View style={styles.metaRow}>
              <Text style={styles.sourceText}>{item.source.name}</Text>
              <Text style={styles.bookmarkDate}>
                Saved {formatDate(item.bookmarkedAt)}
              </Text>
            </View>

            <Text style={styles.cardTitle} numberOfLines={3}>
              {item.title}
            </Text>

            <View style={styles.footerRow}>
              <View style={styles.authorContainer}>
                <Text style={styles.authorLabel}>By </Text>
                <Text style={styles.authorName}>
                  {item.author?.name || "Unknown"}
                </Text>
              </View>
              <View style={styles.readTimeContainer}>
                <Text style={styles.readTimeIcon}>⏱</Text>
                <Text style={styles.readTimeText}>{item.read_time_minutes}m read</Text>
              </View>
            </View>

            {/* Tap to Read Indicator */}
            <View style={styles.tapIndicator}>
              <Text style={styles.tapIndicatorText}>👆 Tap to read article</Text>
            </View>
          </View>
        </Pressable>

        {/* Action Bar - Separate from main content */}
        <View style={styles.actionBar}>
          <Pressable
            style={styles.shareButton}
            onPress={(e) => {
              e.stopPropagation();
              shareArticle(item);
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.actionIcon}>📤</Text>
            <Text style={styles.actionText}>Share</Text>
          </Pressable>

          <View style={styles.actionDivider} />

          <Pressable
            style={styles.removeButton}
            onPress={(e) => {
              e.stopPropagation();
              handleRemoveBookmark(item.id, item.title);
            }}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.actionIcon}>🗑️</Text>
            <Text style={styles.removeText}>Remove</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Text style={styles.emptyIcon}>📚</Text>
      </View>
      <Text style={styles.emptyTitle}>No bookmarks yet</Text>
      <Text style={styles.emptySubtext}>
        Save interesting articles to read them later
      </Text>
      <Pressable style={styles.exploreButton} onPress={() => router.push("/")}>
        <Text style={styles.exploreButtonText}>Discover articles</Text>
      </Pressable>
    </View>
  );

  if (isLoading) {
    return (
      <ScreenWrapper style={styles.container} statusBarStyle="light-content">
        <View style={styles.header}>
          <Typo color={colors.white} fontWeight="700" size={28}>
            Bookmarks
          </Typo>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading bookmarks...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper style={styles.container} statusBarStyle="light-content">
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Typo color={colors.white} fontWeight="700" size={28}>
            Bookmarks
          </Typo>
          {bookmarks.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{bookmarks.length}</Text>
            </View>
          )}
        </View>
        {bookmarks.length > 0 && (
          <Text style={styles.headerSubtext}>
            {bookmarks.length} saved article{bookmarks.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBookmarkCard}
        contentContainerStyle={[
          styles.listContainer,
          bookmarks.length === 0 && styles.emptyListContainer,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
            colors={['#FFFFFF']}
          />
        }
        ListEmptyComponent={renderEmptyState}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={10}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 20,
    backgroundColor: colors.black,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  countBadge: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
  },
  countText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  headerSubtext: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
  },
  listContainer: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  emptyListContainer: {
    flex: 1,
  },
  cardContainer: {
    marginHorizontal: CARD_MARGIN,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  articlePressable: {
    flex: 1,
  },
  imageContainer: {
    position: "relative",
    height: 200,
  },
  cardImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "space-between",
    padding: 16,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(139, 92, 246, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backdropFilter: "blur(10px)",
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  bookmarkButton: {
    alignSelf: "flex-end",
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: "blur(10px)",
  },
  bookmarkIcon: {
    fontSize: 18,
  },
  bookmarkStatusIndicator: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backdropFilter: "blur(10px)",
  },
  bookmarkStatusIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  bookmarkStatusText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  cardContent: {
    padding: 20,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sourceText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8B5CF6",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  bookmarkDate: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "500",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 24,
    marginBottom: 16,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  authorLabel: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "400",
  },
  authorName: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "600",
  },
  readTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  readTimeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  readTimeText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
  },
  tapIndicator: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  tapIndicatorText: {
    fontSize: 12,
    color: "rgba(139, 92, 246, 0.8)",
    fontWeight: "600",
  },
  actionBar: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  shareButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  removeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  actionDivider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: 16,
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  actionText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "600",
  },
  removeText: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    borderWidth: 2,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 40,
  },
  exploreButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#8B5CF6",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  exploreButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});