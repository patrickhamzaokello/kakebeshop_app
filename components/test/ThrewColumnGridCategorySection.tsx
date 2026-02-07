import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { Category } from "@/utils/types/models";
import { SectionHeader } from "@/components/test/common/SectionHeader";
import { useTheme } from "@/contexts/ThemeContext";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.42; // Responsive width (42% of screen)
const CARD_HEIGHT = 65; // Fixed height - more compact
const CARD_SPACING = 10;

interface ThrewColumnGridCategorySectionProps {
  data: Category[] | null;
  titleText: string;
  loading: boolean;
  onCategoryPress: (category: Category) => void;
  onSeeAll?: () => void;
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

  const { colors } = useTheme();

  return (
    <Animated.View
      style={[
        {
          backgroundColor: colors.card,
          opacity,
        },
        style,
      ]}
    />
  );
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
          {/* Create 2 columns of 3 rows each for shimmer */}
          {[0, 1].map((col) => (
            <View key={col} style={styles.column}>
              {[1, 2, 3].map((row) => (
                <View key={row} style={styles.shimmerCard}>
                  <ShimmerPlaceholder
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 8,
                    }}
                  />
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  // Organize data into columns (each column has 3 rows)
  const organizeIntoColumns = () => {
    if (!data) return [];

    const columns: Category[][] = [];
    let currentColumn: Category[] = [];

    data.forEach((category, index) => {
      currentColumn.push(category);

      // Every 3 items, start a new column
      if ((index + 1) % 3 === 0) {
        columns.push([...currentColumn]);
        currentColumn = [];
      }
    });

    // Add remaining items as last column
    if (currentColumn.length > 0) {
      columns.push(currentColumn);
    }

    return columns;
  };

  const columns = organizeIntoColumns();

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
            {column.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.card,
                  {
                    borderColor: colors.cardBorder,
                    backgroundColor: colors.card,
                  },
                ]}
                onPress={() => onCategoryPress(category)}
                activeOpacity={0.7}
              >
                <View style={styles.defaultIconContainer}>
                  <FontAwesome6
                    name="layer-group"
                    size={20}
                    color={colors.textPrimary}
                  />
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
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 30,
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
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  shimmerCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 8,
    overflow: "hidden",
  },
  categoryImage: {
    width: 34,
    height: 34,
    borderRadius: 6,
    marginRight: 10,
  },
  defaultIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 6,
    marginRight: 10,
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
