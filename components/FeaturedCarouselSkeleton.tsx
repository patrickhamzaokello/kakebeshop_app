import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing, Dimensions } from "react-native";

const { width: screenWidth } = Dimensions.get("window");
const ITEM_WIDTH = screenWidth * 0.9;
const SIDE_PEEK = (screenWidth - ITEM_WIDTH) / 2;

interface FeaturedCarouselSkeletonProps {
  itemCount?: number;
}

const FeaturedCarouselSkeleton: React.FC<FeaturedCarouselSkeletonProps> = ({
  itemCount = 3,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    startAnimation();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const renderSkeletonItem = (index: number) => (
    <View key={index} style={styles.itemContainer}>
      {/* Image Skeleton */}
      <Animated.View style={[styles.imageSkeleton, { opacity }]} />

      {/* "New" Tag Skeleton */}
      <Animated.View style={[styles.newTagSkeleton, { opacity }]} />

      {/* Text Content Skeleton */}
      <View style={styles.textContainer}>
        {/* Title Lines */}
        <Animated.View style={[styles.titleLineSkeleton, { opacity }]} />

        {/* Subtitle Skeleton */}
        <Animated.View style={[styles.subtitleSkeleton, { opacity }]} />
      </View>
    </View>
  );

  const renderSkeletonIndicators = () => (
    <View style={styles.indicatorContainer}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.indicatorSkeleton,
            { opacity: index === 0 ? 0.7 : 0.3 },
          ]}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.carouselContainer}>
        {Array.from({ length: itemCount }).map((_, index) =>
          renderSkeletonItem(index)
        )}
      </View>
      {renderSkeletonIndicators()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    paddingTop: 20,
  },
  carouselContainer: {
    flexDirection: "row",
    paddingHorizontal: SIDE_PEEK,
  },
  itemContainer: {
    width: ITEM_WIDTH,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  imageSkeleton: {
    width: ITEM_WIDTH - 15,
    height: 180,
    backgroundColor: "#E1E9EE",
    borderRadius: 8,
  },
  newTagSkeleton: {
    position: "absolute",
    top: 10,
    left: 20,
    width: 40,
    height: 20,
    backgroundColor: "#E1E9EE",
    borderRadius: 4,
    zIndex: 1,
  },
  textContainer: {
    gap: 20,
    paddingVertical: 20,
    width: ITEM_WIDTH - 20,
    justifyContent: "center",
    alignItems: "center",
  },
  titleLineSkeleton: {
    width: "90%",
    height: 24,
    backgroundColor: "#E1E9EE",
    borderRadius: 4,
  },
  titleLineSkeletonShort: {
    width: "60%",
    height: 24,
    backgroundColor: "#E1E9EE",
    borderRadius: 4,
    marginTop: 8,
  },
  subtitleSkeleton: {
    width: "40%",
    height: 18,
    backgroundColor: "#E1E9EE",
    borderRadius: 4,
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  indicatorSkeleton: {
    width: 15,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 4,
    backgroundColor: "#E1E9EE",
  },
});

export default FeaturedCarouselSkeleton;
