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
const ITEM_WIDTH = (width - 52) / 2; // 2 columns with 20px padding + 12px gap
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
            <Ionicons name="albums-outline" size={32} color="#CCC" />
          </View>
        )}
      </View>

      <View style={styles.subcategoryInfo}>
        <Text style={styles.subcategoryName} numberOfLines={2}>
          {item.name}
        </Text>
        
        {item.listings_count > 0 && (
          <View style={styles.listingsCount}>
            <Ionicons name="pricetag-outline" size={12} color="#999" />
            <Text style={styles.countText}>
              {item.listings_count}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Subcategories</Text>
        {subcategories.length > 0 && (
          <Text style={styles.headerCount}>
            {subcategories.length} {subcategories.length === 1 ? 'category' : 'categories'}
          </Text>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.viewAllButton}
        onPress={handleViewAllPress}
        activeOpacity={0.7}
      >
        <Ionicons name="apps-outline" size={16} color="#E60549" />
        <Text style={styles.viewAllText}>View All in {parentName}</Text>
        <Ionicons name="arrow-forward" size={16} color="#E60549" />
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#E60549" />
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Ionicons name="grid-outline" size={64} color="#CCC" />
        <Text style={styles.emptyTitle}>No subcategories found</Text>
        <Text style={styles.emptyText}>
          Browse all items in this category
        </Text>
        <TouchableOpacity 
          style={styles.viewAllButtonLarge}
          onPress={handleViewAllPress}
          activeOpacity={0.7}
        >
          <Text style={styles.viewAllButtonText}>
            View All in {parentName}
          </Text>
          <Ionicons name="arrow-forward" size={16} color="white" />
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
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#E60549"
          />
        }
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },

  // Header
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  headerCount: {
    fontSize: 14,
    color: "#999",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F8",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: "flex-start",
    gap: 6,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E60549",
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 12,
  },

  // Subcategory Card
  subcategoryCard: {
    width: ITEM_WIDTH,
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    height: ITEM_WIDTH * 0.8,
    backgroundColor: "#F5F5F5",
  },
  subcategoryImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  subcategoryInfo: {
    padding: 12,
  },
  subcategoryName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  listingsCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  countText: {
    fontSize: 12,
    color: "#999",
  },

  // Empty State
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginBottom: 24,
  },
  viewAllButtonLarge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E60549",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    gap: 8,
  },
  viewAllButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
  },
});