// stores/useCategoryStore.ts
import apiService from "@/utils/apiBase";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getItemAsync, setItemAsync, deleteItemAsync } from "expo-secure-store";

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  icon?: string;
  parent_id: string | null;
  subcategories_count: number;
  listings_count: number;
}

interface CategoryState {
  // Parent categories (cached)
  parentCategories: Category[];
  
  // Subcategories cache (key: parent_id, value: subcategories)
  subcategoriesCache: Record<string, Category[]>;
  
  // Currently selected parent category
  selectedParentId: string | null;
  
  // Loading states
  isLoadingParents: boolean;
  isLoadingSubcategories: Record<string, boolean>;
  
  // Search/filter
  searchQuery: string;
  
  // Actions
  setSearchQuery: (query: string) => void;
  setSelectedParent: (parentId: string | null) => void;
  
  // API operations
  fetchParentCategories: (forceRefresh?: boolean) => Promise<void>;
  fetchSubcategories: (parentId: string, forceRefresh?: boolean) => Promise<void>;
  clearCache: () => void;
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set, get) => ({
      parentCategories: [],
      subcategoriesCache: {},
      selectedParentId: null,
      isLoadingParents: false,
      isLoadingSubcategories: {},
      searchQuery: "",

      setSearchQuery: (query: string) => set({ searchQuery: query }),

      setSelectedParent: (parentId: string | null) => 
        set({ selectedParentId: parentId }),

      // Fetch parent categories
      fetchParentCategories: async (forceRefresh = false) => {
        const state = get();
        
        // Return cached data if available and not forcing refresh
        if (!forceRefresh && state.parentCategories.length > 0) {
          return;
        }

        set({ isLoadingParents: true });

        try {
          const response = await apiService.get("/api/v1/categories/parents/");
          
          if (response.success && response.data) {
            set({ parentCategories: response.data.results });
          }
        } catch (error) {
          console.error("Failed to fetch parent categories:", error);
        } finally {
          set({ isLoadingParents: false });
        }
      },

      // Fetch subcategories for a parent
      fetchSubcategories: async (parentId: string, forceRefresh = false) => {
        const state = get();
        
        // Return cached data if available and not forcing refresh
        if (!forceRefresh && state.subcategoriesCache[parentId]) {
          return;
        }

        set({ 
          isLoadingSubcategories: { 
            ...state.isLoadingSubcategories, 
            [parentId]: true 
          } 
        });

        try {
          const response = await apiService.get(
            `/api/v1/categories/${parentId}/subcategories/`
          );
          
          if (response.success && response.data) {
            set((state) => ({
              subcategoriesCache: {
                ...state.subcategoriesCache,
                [parentId]: response.data,
              },
            }));
          }
        } catch (error) {
          console.error(`Failed to fetch subcategories for ${parentId}:`, error);
        } finally {
          set((state) => ({
            isLoadingSubcategories: {
              ...state.isLoadingSubcategories,
              [parentId]: false,
            },
          }));
        }
      },

      // Clear all cached data
      clearCache: () => 
        set({ 
          parentCategories: [], 
          subcategoriesCache: {},
          selectedParentId: null,
        }),
    }),
    {
      name: "category-store",
      storage: createJSONStorage(() => ({
        setItem: setItemAsync,
        getItem: getItemAsync,
        removeItem: deleteItemAsync,
      })),
      partialize: (state) => ({
        parentCategories: state.parentCategories,
        subcategoriesCache: state.subcategoriesCache,
      }),
    }
  )
);