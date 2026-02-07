import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import { Category } from "@/utils/types/models";
import { SectionHeader } from "@/components/test/common/SectionHeader";
import { useTheme } from "@/contexts/ThemeContext";

const { width } = Dimensions.get("window");
const CARD_SPACING = 12;
const HORIZONTAL_PADDING = 16;
const CARD_WIDTH = (width - HORIZONTAL_PADDING * 2 - CARD_SPACING) / 2;
const CARD_HEIGHT = 70;

interface TwoColumnGridCategorySectionProps {
  data: Category[] | null;
  titleText: string;
  loading: boolean;
  onCategoryPress: (category: Category) => void;
  onSeeAll?: () => void;
  maxItems?: number; // Optional: limit items displayed
}

const ShimmerPlaceholder: React.FC<{ style?: any }> = ({ style }) => {
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          backgroundColor: "#F0D8D1",
          opacity,
        },
        style,
      ]}
    />
  );
};

export const TwoColumnGridCategorySection: React.FC<
  TwoColumnGridCategorySectionProps
> = ({
  titleText,
  data,
  loading,
  onCategoryPress,
  onSeeAll,
  maxItems = 6, // Default to showing 6 items (3 rows)
}) => {
  const { colors } = useTheme();
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.grid}>
          {Array.from({ length: 6 }).map((_, index) => (
            <View key={index} style={styles.shimmerCard}>
              <ShimmerPlaceholder
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 12,
                }}
              />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  // Limit the number of items displayed
  const displayData = data.slice(0, maxItems);

  return (
    <View style={styles.container}>
      <View style={[styles.grid]}>
        {displayData.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
            onPress={() => onCategoryPress(category)}
            activeOpacity={0.7}
          >
            <View style={styles.defaultIconContainer}>
              <FontAwesome6 name="layer-group" size={22} color="#E60549" />
            </View>
            <Text
              style={[styles.categoryTitle, { color: colors.textPrimary }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
  grid: {
    paddingHorizontal: HORIZONTAL_PADDING,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_SPACING,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  shimmerCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
  },
  defaultIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 16,
  },
});
