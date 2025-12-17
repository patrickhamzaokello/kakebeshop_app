// stores/useCartStore.ts
import apiService from "@/utils/apiBase";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getItemAsync, setItemAsync, deleteItemAsync } from "expo-secure-store";
import { listingDetailsService } from "@/utils/services/listingDetailsService";

type CartState = {
  cartCount: number;
  isLoading: boolean;

  // Actions
  setCartCount: (count: number) => void;
  incrementCart: () => void;
  decrementCart: () => void;

  // API operations
  fetchCartCount: () => Promise<void>;
  addToCart: (
    listingID: string,
    quantity?: number
  ) => Promise<boolean>;
  removeFromCart: (productId: string | number) => Promise<boolean>;
  clearCart: () => Promise<void>;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartCount: 0,
      isLoading: false,

      setCartCount: (count: number) => set({ cartCount: count }),

      incrementCart: () => set((state) => ({ cartCount: state.cartCount + 1 })),
      decrementCart: () =>
        set((state) => ({ cartCount: Math.max(0, state.cartCount - 1) })),

      // Fetch cart count from backend
      fetchCartCount: async () => {
        set({ isLoading: true });
        try {
          const response = await apiService.get("/api/v1/cart/count/"); // Adjust endpoint
          if (response.success && response.data?.count !== undefined) {
            set({ cartCount: response.data.count });
          }
        } catch (error) {
          console.error("Failed to fetch cart count:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Add item to cart (optimistic UI update)
      addToCart: async (listingID: string, quantity = 1) => {
        // Optimistic update: show +1 immediately
        get().incrementCart();

        try {
          const response = await listingDetailsService.AddListingtoCart(
            listingID, quantity
          );

          if (response.success) {
            return true;
          } else {
            set((state) => ({ cartCount: state.cartCount - quantity }));
            return false;
          }
        } catch (error) {
          // Revert on network/error
          set((state) => ({ cartCount: state.cartCount - quantity }));
          console.error("Add to cart failed:", error);
          return false;
        }
      },

      // Remove item (simplified – adjust based on your backend)
      removeFromCart: async (productId: string | number): Promise<boolean> => {
        get().decrementCart();

        try {
          const response = await apiService.post("/cart/remove/", {
            product_id: productId,
          });

          if (!response.success) {
            get().incrementCart(); // revert
            return false;
          }
          return true;
        } catch (error) {
          get().incrementCart(); // revert
          console.error("Remove from cart failed:", error);
          return false;
        }
      },

      // Clear cart (e.g., after checkout)
      clearCart: async () => {
        try {
          await apiService.post("/cart/clear/");
          set({ cartCount: 0 });
        } catch (error) {
          console.error("Failed to clear cart:", error);
        }
      },
    }),
    {
      name: "cart-store", // key in secure store
      storage: createJSONStorage(() => ({
        setItem: setItemAsync,
        getItem: getItemAsync,
        removeItem: deleteItemAsync,
      })),
      partialize: (state) => ({
        cartCount: state.cartCount, // persist count for fast cold start
      }),
    }
  )
);
