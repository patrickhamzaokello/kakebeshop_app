import { colors } from "@/constants/theme";
import { getFeaturedNews } from "@/utils/apiEndpoints";
import { verticalScale } from "@/utils/styling";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Typo from "./Typo";
import FeaturedCarouselSkeleton from "./FeaturedCarouselSkeleton";

const { width: screenWidth } = Dimensions.get("window");
const ITEM_WIDTH = screenWidth * 0.9;
const SIDE_PEEK = (screenWidth - ITEM_WIDTH) / 2;

interface FeaturedItem {
  featured_image_url: string;
  title: string;
  image_caption: string;
  id: number;
  category: {
    id: number;
    name: string;
  };
}

const FeaturedCarousel: React.FC<any> = () => {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [featuredStories, setFeaturedStories] = useState<FeaturedItem[]>([]);
  const [isLoadingFeaturedStories, setIsLoadingFeaturedStories] =
    useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch featured stories
  useEffect(() => {
    const fetchFeaturedStories = async () => {
      try {
        setIsLoadingFeaturedStories(true);
        setError(null);
        const data = await getFeaturedNews();

        if (data && Array.isArray(data) && data.length > 0) {
          setFeaturedStories(data);
        } else {
          setFeaturedStories([]);
        }
      } catch (error) {
        setError("Failed to load featured stories");
        setFeaturedStories([]);
      } finally {
        setIsLoadingFeaturedStories(false);
      }
    };

    fetchFeaturedStories();
  }, []);

  // Auto-scroll effect (only runs when we have data)
  useEffect(() => {
    if (!featuredStories || featuredStories.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % featuredStories.length;
        flatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [featuredStories]);

  // Show loading skeleton while fetching data
  if (isLoadingFeaturedStories) {
    return <FeaturedCarouselSkeleton />;
  }

  // Show nothing if no stories are available or there was an error
  if (!featuredStories || featuredStories.length === 0) {
    return null;
  }

  const renderItem = ({ item }: { item: FeaturedItem }) => (
    <Pressable
      style={styles.itemContainer}
      onPress={() => router.push(`/article/${item.id}`)}
      id={item.id.toString()}
    >
      <Image
        source={{ uri: item.featured_image_url }}
        style={styles.image}
        contentFit="cover"
        placeholder="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzM1IiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMzNSAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMzUiIGhlaWdodD0iMTgwIiBmaWxsPSIjRjNGNEY2Ii8+Cjwvc3ZnPgo="
      />
      {/* "New" Tag */}
      <View style={styles.newTag}>
        <Typo
          size={12}
          fontWeight={"700"}
          color={colors.white}
          numberOfLines={1}
          textProps={{ ellipsizeMode: "tail" }}
        >
          {item.category.name || "News"}
        </Typo>
      </View>
      <View style={styles.feature_carousel_text}>
        <Typo
          size={20}
          fontWeight={"500"}
          color={colors.white}
          style={styles.titleText}
          numberOfLines={2}
        >
          {item.title}
        </Typo>
        <Typo
          size={15}
          fontWeight={"300"}
          color={colors.white}
          style={styles.subtitleText}
          numberOfLines={2}
        >
          Read More
        </Typo>
      </View>
    </Pressable>
  );

  const onScrollEnd = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / ITEM_WIDTH);
    setCurrentIndex(index);
  };

  const renderIndicators = () => (
    <View style={styles.indicatorContainer}>
      {featuredStories.map((_, index) => (
        <View
          key={index}
          style={[
            styles.indicator,
            {
              backgroundColor:
                index === currentIndex
                  ? colors.white
                  : "rgba(255, 255, 255, 0.3)",
            },
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={{paddingTop: 20}}>
      <View style={{ paddingBottom: 20, paddingHorizontal: 20 }}>
        <Typo size={20} fontWeight={"800"} color={colors.white}>
          FEATURED
        </Typo>
      </View>
      <View style={{ paddingBottom: 30 }}>
        <View style={styles.container}>
          <FlatList
            ref={flatListRef}
            data={featuredStories}
            renderItem={renderItem}
            keyExtractor={(item, index) => `featured-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={ITEM_WIDTH}
            decelerationRate="fast"
            contentContainerStyle={{ paddingHorizontal: SIDE_PEEK }}
            onMomentumScrollEnd={onScrollEnd}
            getItemLayout={(_, index) => ({
              length: ITEM_WIDTH,
              offset: ITEM_WIDTH * index,
              index,
            })}
          />
          {renderIndicators()}
        </View>
      </View>
    </View>
  );
};

export default FeaturedCarousel;

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  itemContainer: {
    width: ITEM_WIDTH,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: ITEM_WIDTH - 15,
    height: 180,
    borderRadius: 8,
  },
  feature_carousel_text: {
    gap: 20,
    paddingVertical: 20,
    width: ITEM_WIDTH - 20,
    justifyContent: "center",
    alignItems: "center",
  },
  titleText: {
    textAlign: "center",
    lineHeight: verticalScale(24),
  },
  subtitleText: {
    textAlign: "center",
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  indicator: {
    width: 15,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 4,
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
});
