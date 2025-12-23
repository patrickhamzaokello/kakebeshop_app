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

  // Filter categories based on search
  const filteredCategories = parentCategories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCategoryPress = (category: Category) => {
    router.push({
      pathname: "/category/[id]",
      params: { 
        id: category.id,
        name: category.name,
      },
    });
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
            <Ionicons name="albums-outline" size={32} color="#999" />
          </View>
        )}
      </View>

      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName} numberOfLines={2}>
          {item.name}
        </Text>
        
        {item.subcategories_count > 0 && (
          <View style={styles.subcategoryBadge}>
            <Ionicons name="grid-outline" size={12} color="#666" />
            <Text style={styles.subcategoryCount}>
              {item.subcategories_count} subcategories
            </Text>
          </View>
        )}

        {item.listings_count > 0 && (
          <Text style={styles.listingsCount}>
            {item.listings_count} items
          </Text>
        )}
      </View>

      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (isLoadingParents) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Ionicons name="search-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>
          {searchQuery ? "No categories found" : "No categories available"}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search categories..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        // Performance optimizations for large lists
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        getItemLayout={(data, index) => ({
          length: 88, // Fixed height for better performance
          offset: 88 * index,
          index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },

  searchIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: "#000",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    height: 88, // Fixed height for getItemLayout
  },

  categoryImageContainer: {
    marginRight: 12,
  },

  categoryImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },

  placeholderImage: {
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },

  categoryInfo: {
    flex: 1,
    justifyContent: "center",
  },

  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },

  subcategoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },

  subcategoryCount: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },

  listingsCount: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },

  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 12,
  },
});