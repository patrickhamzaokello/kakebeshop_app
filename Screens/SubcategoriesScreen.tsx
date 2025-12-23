import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCategoryStore, Category } from "@/utils/stores/useCategoryStore";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 48) / 2; // 2 columns with padding
const NUM_COLUMNS = 2;

export const SubcategoriesScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; name: string }>();
  
  const {
    subcategoriesCache,
    isLoadingSubcategories,
    fetchSubcategories,
  } = useCategoryStore();

  const [refreshing, setRefreshing] = useState(false);
  
  const parentId = params.id;
  const parentName = params.name;
  
  const subcategories = subcategoriesCache[parentId] || [];
  const isLoading = isLoadingSubcategories[parentId] || false;

  useEffect(() => {
    if (parentId) {
      fetchSubcategories(parentId);
    }
  }, [parentId]);

  const onRefresh = useCallback(async () => {
    if (parentId) {
      setRefreshing(true);
      await fetchSubcategories(parentId, true);
      setRefreshing(false);
    }
  }, [parentId]);

  const handleSubcategoryPress = (subcategory: Category) => {
    router.push({
      pathname: "/listing/[categoryId]",
      params: { 
        categoryId: subcategory.id,
        categoryName: subcategory.name,
      },
    });
  };

  const handleViewAllPress = () => {
    router.push({
      pathname: "/listing/[categoryId]",
      params: { 
        categoryId: parentId,
        categoryName: parentName,
      },
    });
  };

  const renderSubcategoryCard = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.subcategoryCard}
      activeOpacity={0.7}
      onPress={() => handleSubcategoryPress(item)}
    >
      <View style={styles.imageContainer}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.subcategoryImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.subcategoryImage, styles.placeholderImage]}>
            <Ionicons name="albums-outline" size={40} color="#999" />
          </View>
        )}
        
        {/* Overlay gradient for better text visibility */}
        <View style={styles.imageOverlay} />
      </View>

      <View style={styles.subcategoryInfo}>
        <Text style={styles.subcategoryName} numberOfLines={2}>
          {item.name}
        </Text>
        
        {item.listings_count > 0 && (
          <Text style={styles.listingsCount}>
            {item.listings_count} items
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>Browse by Subcategory</Text>
      <TouchableOpacity 
        style={styles.viewAllButton}
        onPress={handleViewAllPress}
      >
        <Text style={styles.viewAllText}>View All in {parentName}</Text>
        <Ionicons name="arrow-forward" size={16} color="#000" />
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Ionicons name="grid-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>No subcategories found</Text>
        <TouchableOpacity 
          style={styles.viewAllButtonLarge}
          onPress={handleViewAllPress}
        >
          <Text style={styles.viewAllButtonText}>
            View All Items in {parentName}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={subcategories}
        renderItem={renderSubcategoryCard}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        // Performance optimizations
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },

  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
  },

  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginRight: 6,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 16,
  },

  subcategoryCard: {
    width: ITEM_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },

  imageContainer: {
    position: "relative",
    width: "100%",
    height: ITEM_WIDTH * 0.75,
  },

  subcategoryImage: {
    width: "100%",
    height: "100%",
  },

  placeholderImage: {
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },

  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
    backgroundColor: "rgba(0,0,0,0.1)",
  },

  subcategoryInfo: {
    padding: 12,
  },

  subcategoryName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },

  listingsCount: {
    fontSize: 12,
    color: "#666",
  },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },

  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 12,
    marginBottom: 20,
  },

  viewAllButtonLarge: {
    backgroundColor: "#000",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },

  viewAllButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});