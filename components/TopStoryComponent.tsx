import Typo from "@/components/Typo";
import { colors } from "@/constants/theme";
import { getNewsTopStory } from "@/utils/apiEndpoints";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  Animated,
  Pressable,
} from "react-native";
import { usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
// Shimmer loading component
const ShimmerPlaceholder = ({
  width,
  height,
  borderRadius = 4,
}: {
  width: string | number;
  height: number;
  borderRadius?: number;
}) => {
  const shimmerValue = new Animated.Value(0);

  useEffect(() => {
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    shimmerAnimation.start();
    return () => shimmerAnimation.stop();
  }, []);

  const shimmerColor = shimmerValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["#E1E9EE", "#C7D2FE"],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: shimmerColor,
        },
      ]}
    />
  );
};

// Loading skeleton component
const TopStoryLoadingSkeleton = () => {
  return (
    <View style={styles.topStory}>
      {/* "Top Story" label skeleton */}
      <ShimmerPlaceholder width={100} height={18} />

      {/* Title skeleton - multiple lines */}
      <View style={{ gap: 8 }}>
        <ShimmerPlaceholder width="100%" height={32} />
        <ShimmerPlaceholder width="80%" height={32} />
      </View>

      {/* Excerpt skeleton - multiple lines */}
      <View style={{ gap: 6 }}>
        <ShimmerPlaceholder width="100%" height={24} />
        <ShimmerPlaceholder width="90%" height={24} />
        <ShimmerPlaceholder width="60%" height={24} />
      </View>

      {/* News info skeleton */}
      <View style={styles.news_info}>
        <ShimmerPlaceholder width={80} height={18} />
        <ShimmerPlaceholder width={20} height={18} />
        <ShimmerPlaceholder width={70} height={18} />
        <ShimmerPlaceholder width={20} height={18} />
        <ShimmerPlaceholder width={120} height={18} />
      </View>

      {/* Featured image skeleton */}
      <ShimmerPlaceholder width="100%" height={200} borderRadius={10} />
    </View>
  );
};

const TopStoryComponent = () => {
  const [topStory, setTopStory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchTopStory = async () => {
      try {
        const data = await getNewsTopStory();
        if (data) {
          setTopStory(data);
        }
      } catch (error) {
        throw error;
      } finally {
        setIsLoading(false);
      }
    };

    fetchTopStory();
  }, []);

  // Show loading skeleton while fetching data
  if (isLoading) {
    return <TopStoryLoadingSkeleton />;
  }

  // Show nothing if no story is available
  if (!topStory) {
    return null;
  }

  return (
    <Pressable
      style={styles.topStory}
      onPress={() => router.push(`/article/${topStory.id}`)}
    >
      <Typo size={15} fontWeight={"800"} color={colors.matteBlack}>
        Top Story
      </Typo>
      <Typo size={27} fontWeight={"800"} color={colors.matteBlack}>
        {topStory.title}
      </Typo>
    
      <Typo size={20} fontWeight={"300"} color={colors.matteBlack}>
        {topStory.excerpt}
      </Typo>

      <View style={styles.news_info}>
        <Typo size={15} fontWeight={"300"} color={colors.matteBlack}>
          {topStory.author.name}
        </Typo>
        <Typo size={15} fontWeight={"300"} color={colors.matteBlack}>
          •
        </Typo>
        <Typo size={15} fontWeight={"300"} color={colors.matteBlack}>
          {topStory.read_time_minutes} min read
        </Typo>
        <Typo size={15} fontWeight={"300"} color={colors.matteBlack}>
          •
        </Typo>
        <Typo size={15} fontWeight={"300"} color={colors.matteBlack}>
          {new Date(topStory.published_at).toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Typo>
      </View>

      <Image
        source={{ uri: topStory.featured_image_url }}
        style={{ width: "100%", height: 200, borderRadius: 10 }}
        contentFit="cover"
        transition={1000}
      />
        {/* Source and Read Status */}
        <View style={styles.articleFooter}>
        <View style={styles.sourceContainer}>
          <Ionicons name="newspaper-outline" size={14} color="#8E8E93" />
          <Typo style={styles.sourceText}>{topStory.source.name}</Typo>
        </View>
      </View>
    </Pressable>
  );
};

export default TopStoryComponent;

const styles = StyleSheet.create({
  topStory: {
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    paddingBottom: 20,
    paddingTop: 30,
    gap: 20,
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
});
