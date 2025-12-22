// stores/useCartStore.ts
import apiService from "@/utils/apiBase";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getItemAsync, setItemAsync, deleteItemAsync } from "expo-secure-store";
import { listingDetailsService } from "@/utils/services/listingDetailsService";
import { Cart } from "@/utils/types/models";
import { cartService } from "../services/cartService";


type CartState = {
  cartCount: number;
  cart: Cart | null;
  isLoading: boolean;
  isUpdating: boolean;

  // Actions
  setCartCount: (count: number) => void;
  incrementCart: () => void;
  decrementCart: () => void;
  setCart: (cart: Cart | null) => void;

  // API operations
  fetchCartCount: () => Promise<void>;
  fetchCart: () => Promise<void>;
  addToCart: (listingID: string, quantity?: number) => Promise<boolean>;
  updateCartItemQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  removeCartItem: (itemId: string) => Promise<boolean>;
  clearCart: () => Promise<void>;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartCount: 0,
      cart: null,
      isLoading: false,
      isUpdating: false,

      setCartCount: (count: number) => set({ cartCount: count }),

      incrementCart: () => set((state) => ({ cartCount: state.cartCount + 1 })),
      
      decrementCart: () =>
        set((state) => ({ cartCount: Math.max(0, state.cartCount - 1) })),

      setCart: (cart: Cart | null) => set({ cart }),

      // Fetch cart count from backend
      fetchCartCount: async () => {
        set({ isLoading: true });
        try {
          const cartcount = await cartService.getCartCount();
          if (cartcount) {
            set({ cartCount: cartcount });
          }
        } catch (error) {
          console.error("Failed to fetch cart count:", error);
        } finally {
          set({ isLoading: false });
        }
      },

      // Fetch full cart data
      fetchCart: async () => {
        set({ isLoading: true });
        try {
          const cart = await cartService.getCart();
          if (cart) {
            set({ 
              cart,
              cartCount: cart.total_items || 0,
            });
          }
        } catch (error) {
          console.error("Failed to fetch cart:", error);
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
            listingID,
            quantity
          );

          if (response.success) {
            // Refresh cart data to get updated state
            await get().fetchCart();
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

      // Update cart item quantity
      updateCartItemQuantity: async (itemId: string, quantity: number) => {
        const previousCart = get().cart;
        
        // Optimistic update
        if (previousCart) {
          const updatedItems = previousCart.items.map(item => {
            if (item.id === itemId) {
              const newSubtotal = (parseFloat(item.listing.price) * quantity).toString();
              return { ...item, quantity, subtotal: newSubtotal };
            }
            return item;
          });

          const newTotalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
          const newTotalPrice = updatedItems.reduce(
            (sum, item) => sum + parseFloat(item.subtotal),
            0
          ).toString();

          set({
            cart: {
              ...previousCart,
              items: updatedItems,
              total_items: newTotalItems,
              total_price: newTotalPrice,
            },
            cartCount: newTotalItems,
          });
        }

        set({ isUpdating: true });
        
        try {
       

          const updateCartItemQuantity = await cartService.updateCartItemQuantity(itemId, quantity);

          if (updateCartItemQuantity) {
            // Refresh to get accurate server state
            await get().fetchCart();
            return true;
          } else {
            // Revert on failure
            set({ cart: previousCart });
            return false;
          }
        } catch (error) {
          // Revert on error
          set({ cart: previousCart });
          console.error("Update cart item failed:", error);
          return false;
        } finally {
          set({ isUpdating: false });
        }
      },

      // Remove cart item
      removeCartItem: async (itemId: string) => {
        const previousCart = get().cart;
        
        // Optimistic update
        if (previousCart) {
          const removedItem = previousCart.items.find(item => item.id === itemId);
          const updatedItems = previousCart.items.filter(item => item.id !== itemId);
          
          const newTotalItems = Math.max(0, previousCart.total_items - (removedItem?.quantity || 0));
          const newTotalPrice = updatedItems.reduce(
            (sum, item) => sum + parseFloat(item.subtotal),
            0
          ).toString();

          set({
            cart: {
              ...previousCart,
              items: updatedItems,
              total_items: newTotalItems,
              total_price: newTotalPrice,
            },
            cartCount: newTotalItems,
          });
        }

        set({ isUpdating: true });

        try {
          const removeItem = await cartService.removeCartItem(itemId);
          if (removeItem) {
            // Refresh to ensure accuracy
            await get().fetchCart();
            return true;
          } else {
            // Revert on failure
            set({ cart: previousCart });
            return false;
          }
        } catch (error) {
          // Revert on error
          set({ cart: previousCart });
          console.error("Remove cart item failed:", error);
          return false;
        } finally {
          set({ isUpdating: false });
        }
      },

      // Clear cart (e.g., after checkout)
      clearCart: async () => {
        try {
          await apiService.post("/api/v1/cart/clear/");
          set({ cartCount: 0, cart: null });
        } catch (error) {
          console.error("Failed to clear cart:", error);
        }
      },
    }),
    {
      name: "cart-store",
      storage: createJSONStorage(() => ({
        setItem: setItemAsync,
        getItem: getItemAsync,
        removeItem: deleteItemAsync,
      })),
      partialize: (state) => ({
        cartCount: state.cartCount,
        cart: state.cart, // Also persist cart for offline access
      }),
    }
  )
);