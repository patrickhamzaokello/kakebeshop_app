import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCategoryStore, Category } from "@/utils/stores/useCategoryStore";

export const CategoriesScreen: React.FC = () => {
  const router = useRouter();
  
  const {
    parentCategories,
    isLoadingParents,
    searchQuery,
    setSearchQuery,
    fetchParentCategories,
  } = useCategoryStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchParentCategories();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchParentCategories(true);
    setRefreshing(false);
  }, []);

  // Safely handle parentCategories - ensure it's always an array
  const categories = Array.isArray(parentCategories) ? parentCategories : [];

  // Filter categories based on search
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCategoryPress = (category: Category) => {
    router.push({
      pathname: "/category/[id]",
      params: { 
        id: category.id,
        name: category.name,
      },
    } as any);
  };

  const renderCategoryCard = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      activeOpacity={0.7}
      onPress={() => handleCategoryPress(item)}
    >
      <View style={styles.categoryImageContainer}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.categoryImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.categoryImage, styles.placeholderImage]}>
            <Ionicons name="albums-outline" size={28} color="#CCC" />
          </View>
        )}
      </View>

      <View style={styles.categoryContent}>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName} numberOfLines={2}>
            {item.name}
          </Text>
          
          <View style={styles.categoryMeta}>
            {item.subcategories_count > 0 && (
              <View style={styles.metaItem}>
                <Ionicons name="grid-outline" size={12} color="#999" />
                <Text style={styles.metaText}>
                  {item.subcategories_count}
                </Text>
              </View>
            )}

            {item.listings_count > 0 && (
              <View style={styles.metaItem}>
                <Ionicons name="pricetag-outline" size={12} color="#999" />
                <Text style={styles.metaText}>
                  {item.listings_count}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (isLoadingParents) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#E60549" />
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Ionicons name="search-outline" size={64} color="#CCC" />
        <Text style={styles.emptyTitle}>
          {searchQuery ? "No categories found" : "No categories available"}
        </Text>
        <Text style={styles.emptyText}>
          {searchQuery ? "Try a different search term" : "Check back later"}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery("")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories List */}
      <FlatList
        data={filteredCategories}
        renderItem={renderCategoryCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
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

  // Search
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "white",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 44,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1A1A1A",
  },

  // List
  listContent: {
    padding: 20,
    paddingTop: 0,
  },

  // Category Card
  categoryCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    flexDirection: "row",
  },
  categoryImageContainer: {
    width: 80,
    height: 80,
  },
  categoryImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 8,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  categoryMeta: {
    flexDirection: "row",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: "#999",
  },
  arrowContainer: {
    justifyContent: "center",
    paddingLeft: 8,
  },

  // Empty State
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
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
  },
});