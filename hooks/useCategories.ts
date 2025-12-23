// hooks/useCategories.ts
import { useCategoryStore } from '@/utils/stores/useCategoryStore';
import { useCallback, useMemo } from 'react';

/**
 * Custom hook for category operations with computed values
 */
export const useCategories = () => {
  const {
    parentCategories,
    subcategoriesCache,
    selectedParentId,
    isLoadingParents,
    isLoadingSubcategories,
    searchQuery,
    setSearchQuery,
    setSelectedParent,
    fetchParentCategories,
    fetchSubcategories,
    clearCache,
  } = useCategoryStore();

  /**
   * Get filtered parent categories based on search
   */
  const filteredParents = useMemo(() => {
    if (!searchQuery) return parentCategories;
    
    const query = searchQuery.toLowerCase();
    return parentCategories.filter((category) =>
      category.name.toLowerCase().includes(query)
    );
  }, [parentCategories, searchQuery]);

  /**
   * Get subcategories for currently selected parent
   */
  const currentSubcategories = useMemo(() => {
    if (!selectedParentId) return [];
    return subcategoriesCache[selectedParentId] || [];
  }, [selectedParentId, subcategoriesCache]);

  /**
   * Get currently selected parent category
   */
  const selectedParent = useMemo(() => {
    if (!selectedParentId) return null;
    return parentCategories.find((cat) => cat.id === selectedParentId) || null;
  }, [selectedParentId, parentCategories]);

  /**
   * Check if subcategories are loading for selected parent
   */
  const isLoadingCurrentSubcategories = useMemo(() => {
    if (!selectedParentId) return false;
    return isLoadingSubcategories[selectedParentId] || false;
  }, [selectedParentId, isLoadingSubcategories]);

  /**
   * Get subcategories for a specific parent
   */
  const getSubcategories = useCallback(
    (parentId: string) => {
      return subcategoriesCache[parentId] || [];
    },
    [subcategoriesCache]
  );

  /**
   * Check if subcategories are cached for a parent
   */
  const hasSubcategoriesCache = useCallback(
    (parentId: string) => {
      return !!subcategoriesCache[parentId];
    },
    [subcategoriesCache]
  );

  /**
   * Refresh both parent categories and current subcategories
   */
  const refreshAll = useCallback(async () => {
    await fetchParentCategories(true);
    
    if (selectedParentId) {
      await fetchSubcategories(selectedParentId, true);
    }
  }, [fetchParentCategories, fetchSubcategories, selectedParentId]);

  /**
   * Search categories (can be debounced in component)
   */
  const searchCategories = useCallback(
    (query: string) => {
      setSearchQuery(query);
    },
    [setSearchQuery]
  );

  /**
   * Select a parent category and fetch its subcategories
   */
  const selectParent = useCallback(
    async (parentId: string) => {
      setSelectedParent(parentId);
      await fetchSubcategories(parentId);
    },
    [setSelectedParent, fetchSubcategories]
  );

  /**
   * Clear selected parent
   */
  const clearSelection = useCallback(() => {
    setSelectedParent(null);
  }, [setSelectedParent]);

  return {
    // State
    parentCategories,
    filteredParents,
    currentSubcategories,
    selectedParent,
    selectedParentId,
    searchQuery,
    
    // Loading states
    isLoadingParents,
    isLoadingCurrentSubcategories,
    isLoadingSubcategories,
    
    // Computed values
    hasParents: parentCategories.length > 0,
    hasFilteredResults: filteredParents.length > 0,
    hasSubcategories: currentSubcategories.length > 0,
    
    // Actions
    fetchParentCategories,
    fetchSubcategories,
    selectParent,
    clearSelection,
    searchCategories,
    setSearchQuery,
    refreshAll,
    clearCache,
    
    // Utilities
    getSubcategories,
    hasSubcategoriesCache,
  };
};

// Example usage:
/*
import { useCategories } from '@/hooks/useCategories';

const MyComponent = () => {
  const {
    filteredParents,
    isLoadingParents,
    fetchParentCategories,
    selectParent,
    searchCategories,
  } = useCategories();

  useEffect(() => {
    fetchParentCategories();
  }, []);

  return (
    <View>
      <TextInput 
        onChangeText={searchCategories}
        placeholder="Search categories..."
      />
      <FlatList
        data={filteredParents}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => selectParent(item.id)}>
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};
*/