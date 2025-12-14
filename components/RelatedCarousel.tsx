import { colors } from "@/constants/theme";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  StyleSheet,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import Typo from "./Typo";
import { getRelatedArticles } from "@/utils/apiEndpoints";
import { useRouter } from "expo-router";

const { width: screenWidth } = Dimensions.get("window");
const ITEM_WIDTH = screenWidth * 0.9;
const SIDE_PEEK = (screenWidth - ITEM_WIDTH) / 2;

// Proper interface definitions
interface RelatedArticle {
  id: string;
  featured_image_url: string;
  title: string;
  published_at?: string;
  category: {
    id: string;
    name: string;
  };
  source: {
    id: string;
    name: string;
  }
  author: {
    id: string;
    name: string;
  };
}

interface RelatedCarouselProps {
  articleID: number | string;
  sectionHeading: string;
  onArticlePress?: (article: RelatedArticle) => void;
}

const RelatedCarousel: React.FC<RelatedCarouselProps> = ({
  articleID,
  sectionHeading,
  onArticlePress,
}) => {
  const flatListRef = useRef<FlatList<RelatedArticle>>(null);
  const router = useRouter();

  // State with proper typing
  const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch related articles with proper error handling
  const fetchRelatedArticles = useCallback(async () => {
    if (!articleID) {
      setError("No article ID provided");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const data = await getRelatedArticles(articleID);

      if (data && Array.isArray(data) && data.length > 0) {
        // Validate data structure
        const validArticles = data.filter(
          (article) =>
            article &&
            typeof article.title === "string" &&
            typeof article.featured_image_url === "string" &&
            article.title.trim() !== "" &&
            article.featured_image_url.trim() !== ""
        );

        setRelatedArticles(validArticles);
      } else {
        setRelatedArticles([]);
        setError("No related articles found");
      }
    } catch (fetchError) {
      console.error("Error fetching related articles:", fetchError);
      setError("Failed to load related articles");
      setRelatedArticles([]);
    } finally {
      setIsLoading(false);
    }
  }, [articleID]);

  useEffect(() => {
    fetchRelatedArticles();
  }, [fetchRelatedArticles]);

  // Handle article press with navigation
  const handleArticlePress = useCallback(
    (article: RelatedArticle) => {
      if (onArticlePress) {
        onArticlePress(article);
      } else {
        // Default navigation behavior
        router.push(`/article/${article.id}`);
      }
    },
    [onArticlePress, router]
  );

  // Render individual carousel item
  const renderItem = useCallback(
    ({ item, index }: { item: RelatedArticle; index: number }) => (
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => handleArticlePress(item)}
        activeOpacity={0.9}
        accessibilityLabel={`Read article: ${item.title}`}
        accessibilityRole="button"
      >
        <View style={styles.itemContainer}>
          <Image
            source={{ uri: item.featured_image_url }}
            style={styles.image}
          />
          {/* Category Tag */}
          <View style={styles.newTag}>
            <Typo
              size={12}
              fontWeight={"700"}
              color={colors.white}
              numberOfLines={1}
            >
              {/* ✅ FIXED: Safe category name access */}
              {item.category?.name || "News"}
            </Typo>
          </View>
          <View style={styles.feature_carousel_text}>
            <Typo
              size={20}
              fontWeight={"700"}
              color={colors.black}
              style={styles.titleText}
              numberOfLines={2}
            >
              {item.title}
            </Typo>
            <Typo
              size={15}
              fontWeight={"300"}
              color={colors.black}
              style={styles.subtitleText}
              numberOfLines={1}
            >
              {/* ✅ FIXED: Safe author name access with proper fallback */}
              Read Now → {item.author?.name ? `(by ${item.author.name})` : `(at ${item.source?.name})` || ""}
            </Typo>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [handleArticlePress]
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Typo size={16} color={colors.matteBlack} style={styles.loadingText}>
          Loading related articles...
        </Typo>
      </View>
    );
  }

  // Error state
  if (error && relatedArticles.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Typo size={16} color={colors.matteBlack} style={styles.errorText}>
          {error}
        </Typo>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchRelatedArticles}
        >
          <Typo size={14} fontWeight="600" color={colors.primary}>
            Retry
          </Typo>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state
  if (relatedArticles.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Typo size={16} color={colors.matteBlack}>
          No related articles available
        </Typo>
      </View>
    );
  }

  return (
    <>
      <View style={{ paddingBottom: 20, paddingHorizontal: 20 }}>
        <Typo size={25} fontWeight={"800"} color={colors.black}>
          {sectionHeading}
        </Typo>
      </View>
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={relatedArticles}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_WIDTH}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: SIDE_PEEK }}
          getItemLayout={(_, index) => ({
            length: ITEM_WIDTH,
            offset: ITEM_WIDTH * index,
            index,
          })}
        />
      </View>
    </>
  );
};

export default RelatedCarousel;

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  itemContainer: {
    width: ITEM_WIDTH,
  },
  image: {
    width: ITEM_WIDTH - 15,
    height: 180,
    resizeMode: "cover",
    borderRadius: 8,
  },
  feature_carousel_text: {
    gap: 10,
    paddingVertical: 20,
    width: ITEM_WIDTH - 20,
  },
  titleText: {
    textAlign: "left",
  },
  subtitleText: {
    textAlign: "left",
  },

  newTag: {
    position: "absolute",
    top: 10,
    left: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    gap: 16,
  },
  errorText: {
    textAlign: "center",
    paddingHorizontal: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
});