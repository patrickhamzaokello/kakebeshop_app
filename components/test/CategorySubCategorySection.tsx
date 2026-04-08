import { radius, spacingX, spacingY } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useTheme } from "@/contexts/ThemeContext";

interface Subcategory {
  id: number;
  name: string;
  image_url: string;
}

interface Category {
  id: number;
  name: string;
  subcategories: Subcategory[];
}

interface CategorySubCategorySectionProps {
  data: Category[];
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onexplorePress: (category: Category) => void;
  onListingPress: (subcategory: Subcategory) => void;
}

export const CategorySubCategorySection: React.FC<
  CategorySubCategorySectionProps
> = ({ data, loading, hasMore, onLoadMore, onexplorePress, onListingPress }) => {

    const { colors } = useTheme();

  const renderSubcategory = (subcategory: Subcategory) => (
    <TouchableOpacity
      key={subcategory.id}
      style={[styles.subcategoryCard]}
      onPress={() => onListingPress(subcategory)}
      activeOpacity={0.7}
    >
      {subcategory.image_url ? (
        <Image
          source={{ uri: subcategory.image_url }}
          style={styles.subcategoryImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.subcategoryImage, styles.imagePlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
          <Ionicons name="image-outline" size={32} color={colors.neutral300} />
        </View>
      )}
      <Text style={[styles.subcategoryName, {color: colors.textPrimary}]} numberOfLines={2}>
        {subcategory.name}
      </Text>
    </TouchableOpacity>
  );

  const renderCategory = ({ item: category }: { item: Category }) => (
    <View style={styles.categorySection}>
      {/* Category Header */}
      <View style={styles.categoryHeader}>
        <Text style={[styles.categoryTitle, {color: colors.textPrimary}]}>{category.name}</Text>
        <TouchableOpacity
          onPress={() => onexplorePress(category)}
          activeOpacity={0.7}
          style={styles.exploreButton}
        >
          <Text style={[styles.exploreText,{color: colors.primary}]}>Explore more</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Subcategories Grid */}
      <View style={styles.subcategoriesGrid}>
        {(category.subcategories ?? []).map((subcategory) =>
          renderSubcategory(subcategory)
        )}
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="file-tray-outline" size={64} color={colors.neutral300} />
        <Text style={styles.emptyText}>No categories available</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={() => {
          if (hasMore && !loading) {
            onLoadMore();
          }
        }}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: spacingY._16,
  },
  categorySection: {
    marginBottom: spacingY._24,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacingX._16,
    marginBottom: spacingY._12,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  exploreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  exploreText: {
    fontSize: 14,
    fontWeight: "600",
  },
  subcategoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacingX._12,
  },
  subcategoryCard: {
    width: "48%",
    marginHorizontal: "1%",
    marginBottom: spacingY._12,
    borderRadius: radius._12,
    overflow: "hidden",
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  subcategoryImage: {
    width: "100%",
    height: 140,
  },
  subcategoryName: {
    paddingVertical: spacingY._8,
    paddingHorizontal: spacingX._8,
    fontSize: 14,
    fontWeight: "600",
  },
  
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  footerLoader: {
    paddingVertical: spacingY._16,
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacingY._32,
  },
  emptyText: {
    marginTop: spacingY._12,
    fontSize: 16,
    fontWeight: "500",
  },
});