import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { Category } from "@/utils/types/models";
import { useTheme } from "@/contexts/ThemeContext";

const { width } = Dimensions.get("window");
const CARD_SPACING = 10;
const HORIZONTAL_PADDING = 16;
const CARD_WIDTH = (width - HORIZONTAL_PADDING * 2 - CARD_SPACING) / 2;
const CARD_HEIGHT = 55;

interface TwoColumnGridCategorySectionProps {
  data: Category[] | null;
  titleText: string;
  loading: boolean;
  onCategoryPress: (category: Category) => void;
  onSeeAll?: () => void;
  maxItems?: number;
}

// ─── Shimmer ────────────────────────────────────────────────────────────────

const ShimmerCard: React.FC<{ delay: number }> = ({ delay }) => {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.08, 0.2],
  });

  return (
    <Animated.View
      style={[styles.shimmerCard, { opacity, backgroundColor: "#888" }]}
    />
  );
};

// ─── Card ────────────────────────────────────────────────────────────────────

const CategoryCard: React.FC<{
  category: Category;
  index: number;
  onPress: (category: Category) => void;
  colors: any;
}> = ({ category, index, onPress, colors }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(14)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const initial = category.name?.charAt(0).toUpperCase() ?? "?";

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 340,
        delay: index * 55,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 340,
        delay: index * 55,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 3,
    }).start();
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
        width: CARD_WIDTH,
      }}
    >
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          },
        ]}
        onPress={() => onPress(category)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View
          style={[styles.badge, { backgroundColor: colors.primary + "18" }]}
        >
          <Text style={[styles.badgeLetter, { color: colors.primary }]}>
            {initial}
          </Text>
        </View>

        <Text
          style={[styles.categoryTitle, { color: colors.textPrimary }]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {category.name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Section ─────────────────────────────────────────────────────────────────

export const TwoColumnGridCategorySection: React.FC<
  TwoColumnGridCategorySectionProps
> = ({ titleText, data, loading, onCategoryPress, onSeeAll, maxItems = 6 }) => {
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <ShimmerCard key={i} delay={i * 80} />
          ))}
        </View>
      </View>
    );
  }

  if (!data || data.length === 0) return null;

  const displayData = data.slice(0, maxItems);

  return (
    <View style={styles.container}>
      {(titleText || onSeeAll) && (
        <View style={styles.header}>
          {titleText ? (
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {titleText}
            </Text>
          ) : null}
          {onSeeAll && (
            <TouchableOpacity
              onPress={onSeeAll}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[styles.seeAll, { color: colors.primary }]}>
                See all
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.grid}>
        {displayData.map((category, index) => (
          <CategoryCard
            key={category.id}
            category={category}
            index={index}
            onPress={onCategoryPress}
            colors={colors}
          />
        ))}
      </View>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: HORIZONTAL_PADDING,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  grid: {
    paddingHorizontal: HORIZONTAL_PADDING,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_SPACING,
  },
  card: {
    width: "100%",
    height: CARD_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: 0,
  },
  shimmerCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 0,
    overflow: "hidden",
  },
  badge: {
    width: CARD_HEIGHT,
    alignSelf: "stretch",
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeLetter: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
    letterSpacing: -0.1,
    paddingHorizontal: 12,
  },
});