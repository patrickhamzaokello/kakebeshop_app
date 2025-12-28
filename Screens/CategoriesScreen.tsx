import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCategoryStore, Category } from "@/utils/stores/useCategoryStore";

const { width } = Dimensions.get("window");
const LEFT_COLUMN_WIDTH = 110;
const SUBCATEGORY_COLUMNS = 3;
const SUBCATEGORY_ITEM_WIDTH = (width - LEFT_COLUMN_WIDTH - 40) / SUBCATEGORY_COLUMNS;

export const TwoColumnCategoriesScreen: React.FC = () => {
  const router = useRouter();
  
  const {
    parentCategories,
    subcategoriesCache,
    isLoadingParents,
    isLoadingSubcategories,
    fetchParentCategories,
    fetchSubcategories,
  } = useCategoryStore();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Safely handle parentCategories
  const categories = Array.isArray(parentCategories) ? parentCategories : [];

  useEffect(() => {
    fetchParentCategories();
  }, []);

  useEffect(() => {
    // Auto-select first category when categories load
    if (categories.length > 0 && !selectedCategoryId) {
      const firstCategory = categories[0];
      setSelectedCategoryId(firstCategory.id);
      fetchSubcategories(firstCategory.id, true);
    }
  }, [categories]);

  const handleCategoryPress = (category: Category) => {
    setSelectedCategoryId(category.id);
    fetchSubcategories(category.id, true);
  };

  const handleSubcategoryPress = (subcategory: Category) => {
    router.push({
      pathname: "/listing/[categoryId]",
      params: { 
        categoryId: subcategory.id,
        categoryName: subcategory.name,
      },
    } as any);
  };

  const handleViewAllPress = () => {
    if (selectedCategoryId) {
      const selectedCategory = categories.find(c => c.id === selectedCategoryId);
      router.push({
        pathname: "/listing/[categoryId]",
        params: { 
          categoryId: selectedCategoryId,
          categoryName: selectedCategory?.name || "All Items",
        },
      } as any);
    }
  };

  // Get current subcategories
  const currentSubcategories = selectedCategoryId 
    ? (subcategoriesCache[selectedCategoryId] || [])
    : [];
  
  const isLoadingCurrentSubcategories = selectedCategoryId 
    ? (isLoadingSubcategories[selectedCategoryId] || false)
    : false;

  const renderCategoryItem = ({ item }: { item: Category }) => {
    const isSelected = item.id === selectedCategoryId;
    
    return (
      <TouchableOpacity
        style={[styles.categoryItem, isSelected && styles.categoryItemSelected]}
        onPress={() => handleCategoryPress(item)}
        activeOpacity={0.7}
      >
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.categoryIcon}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.categoryIconPlaceholder}>
            <Ionicons name="albums-outline" size={24} color={isSelected ? "#E60549" : "#999"} />
          </View>
        )}
        
        <Text 
          style={[styles.categoryText, isSelected && styles.categoryTextSelected]} 
          numberOfLines={2}
        >
          {item.name}
        </Text>
        
        {isSelected && <View style={styles.selectedIndicator} />}
      </TouchableOpacity>
    );
  };

  const renderSubcategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.subcategoryItem}
      onPress={() => handleSubcategoryPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.subcategoryImageContainer}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.subcategoryImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.subcategoryImage, styles.subcategoryImagePlaceholder]}>
            <Ionicons name="albums-outline" size={20} color="#CCC" />
          </View>
        )}
      </View>
      
      <Text style={styles.subcategoryName} numberOfLines={2}>
        {item.name}
      </Text>
      
      {item.listings_count > 0 && (
        <Text style={styles.subcategoryCount}>
          {item.listings_count}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderSubcategoriesPanel = () => {
    const selectedCategory = categories.find(c => c.id === selectedCategoryId);

    if (isLoadingCurrentSubcategories) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E60549" />
        </View>
      );
    }

    if (currentSubcategories.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="grid-outline" size={48} color="#CCC" />
          <Text style={styles.emptyTitle}>No subcategories</Text>
          <Text style={styles.emptyText}>
            Browse all items in {selectedCategory?.name}
          </Text>
          <TouchableOpacity 
            style={styles.viewAllButtonLarge}
            onPress={handleViewAllPress}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllButtonText}>View All Items</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView 
        style={styles.subcategoriesPanel}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.subcategoriesHeader}>
          <Text style={styles.subcategoriesTitle}>
            {selectedCategory?.name}
          </Text>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={handleViewAllPress}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <Ionicons name="arrow-forward" size={14} color="#E60549" />
          </TouchableOpacity>
        </View>

        {/* Subcategories Grid */}
        <View style={styles.subcategoriesGrid}>
          {currentSubcategories.map((subcategory) => (
            <View key={subcategory.id} style={styles.subcategoryItemWrapper}>
              {renderSubcategoryItem({ item: subcategory })}
            </View>
          ))}
        </View>
      </ScrollView>
    );
  };

  if (isLoadingParents) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E60549" />
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="albums-outline" size={64} color="#CCC" />
        <Text style={styles.emptyTitle}>No categories available</Text>
        <Text style={styles.emptyText}>Check back later</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Left Column - Categories */}
      <View style={styles.leftColumn}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        />
      </View>

      {/* Right Column - Subcategories */}
      <View style={styles.rightColumn}>
        {renderSubcategoriesPanel()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FAFAFA",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 40,
  },

  // Left Column - Categories
  leftColumn: {
    width: LEFT_COLUMN_WIDTH,
    backgroundColor: "#F5F5F5",
    borderRightWidth: 1,
    borderRightColor: "#E5E5E5",
  },
  categoriesContent: {
    paddingVertical: 8,
  },
  categoryItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    position: "relative",
  },
  categoryItemSelected: {
    backgroundColor: "white",
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: 6,
  },
  categoryIconPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E5E5E5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    lineHeight: 16,
  },
  categoryTextSelected: {
    fontWeight: "600",
    color: "#E60549",
  },
  selectedIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "#E60549",
  },

  // Right Column - Subcategories
  rightColumn: {
    flex: 1,
    backgroundColor: "white",
  },
  subcategoriesPanel: {
    flex: 1,
  },
  subcategoriesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  subcategoriesTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    flex: 1,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#FFF5F8",
    borderRadius: 16,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E60549",
  },

  // Subcategories Grid
  subcategoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
  },
  subcategoryItemWrapper: {
    width: SUBCATEGORY_ITEM_WIDTH,
    padding: 4,
  },
  subcategoryItem: {
    alignItems: "center",
  },
  subcategoryImageContainer: {
    marginBottom: 6,
  },
  subcategoryImage: {
    width: SUBCATEGORY_ITEM_WIDTH - 16,
    height: SUBCATEGORY_ITEM_WIDTH - 16,
    borderRadius: 8,
  },
  subcategoryImagePlaceholder: {
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  subcategoryName: {
    fontSize: 12,
    color: "#1A1A1A",
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 2,
  },
  subcategoryCount: {
    fontSize: 11,
    color: "#999",
  },

  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginTop: 12,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
    marginBottom: 20,
  },
  viewAllButtonLarge: {
    backgroundColor: "#E60549",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
});