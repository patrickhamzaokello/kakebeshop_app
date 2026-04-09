import { SectionHeader } from "@/components/test/common/SectionHeader";
import { useTheme } from "@/contexts/ThemeContext";
import { Category } from "@/utils/types/models";
import React, { useEffect, useRef } from "react";
import { Text } from "@/components/Text";
import { Animated, Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.42;
const CARD_HEIGHT = 55;
const CARD_SPACING = 10;
const ROWS_PER_COLUMN = 3;

interface ThrewColumnGridCategorySectionProps {
  data: Category[] | null;
  titleText: string;
  loading: boolean;
  onCategoryPress: (category: Category) => void;
  onSeeAll?: () => void;
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
  globalIndex: number;
  onPress: (category: Category) => void;
  colors: any;
}> = ({ category, globalIndex, onPress, colors }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const initial = category.name?.charAt(0).toUpperCase() ?? "?";

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 320,
        delay: globalIndex * 45,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 320,
        delay: globalIndex * 45,
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

const organizeIntoColumns = (data: Category[]): Category[][] => {
  const columns: Category[][] = [];
  for (let i = 0; i < data.length; i += ROWS_PER_COLUMN) {
    columns.push(data.slice(i, i + ROWS_PER_COLUMN));
  }
  return columns;
};

export const ThrewColumnGridCategorySection: React.FC<
  ThrewColumnGridCategorySectionProps
> = ({ titleText, data, loading, onCategoryPress, onSeeAll }) => {
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={styles.container}>
        <SectionHeader
          title={titleText}
          onSeeAll={onSeeAll}
          showSeeAll={!!onSeeAll}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          scrollEnabled={false}
        >
          {[0, 1].map((col) => (
            <View key={col} style={styles.column}>
              {[0, 1, 2].map((row) => (
                <ShimmerCard key={row} delay={(col * 3 + row) * 80} />
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (!data || data.length === 0) return null;

  const columns = organizeIntoColumns(data);

  return (
    <View style={styles.container}>
      <SectionHeader
        title={titleText}
        onSeeAll={onSeeAll}
        showSeeAll={!!onSeeAll}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {columns.map((column, colIndex) => (
          <View key={colIndex} style={styles.column}>
            {column.map((category, rowIndex) => (
              <CategoryCard
                key={category.id}
                category={category}
                globalIndex={colIndex * ROWS_PER_COLUMN + rowIndex}
                onPress={onCategoryPress}
                colors={colors}
              />
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: CARD_SPACING + 5,
  },
  column: {
    gap: CARD_SPACING,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 0,
    overflow: "hidden",
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
    alignItems: "center",
    justifyContent: "center",
  },
  badgeLetter: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  categoryTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
    letterSpacing: -0.1,
    paddingHorizontal: 10,
  },
});