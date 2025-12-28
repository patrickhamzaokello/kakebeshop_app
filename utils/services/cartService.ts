// services/cartService.ts
import apiService from "@/utils/apiBase";
import { Cart, CreateAddress } from "@/utils/types/models";

export const cartService = {
  // Fetch full cart data
  async getCart(): Promise<Cart | null> {
    try {
      const response = await apiService.get("/api/v1/cart/");
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching cart:", error);
      return null;
    }
  },

  // Fetch cart count only
  async getCartCount(): Promise<number> {
    try {
      const response = await apiService.get("/api/v1/cart/count/");
      if (response.success && response.data?.count !== undefined) {
        return response.data.count;
      }
      return 0;
    } catch (error) {
      console.error("Error fetching cart count:", error);
      return 0;
    }
  },

  // Update cart item quantity
  async updateCartItemQuantity(
    itemId: string,
    quantity: number
  ): Promise<boolean> {
    try {
      const response = await apiService.patch(
        `/api/v1/cart/update/${itemId}/`,
        {
          quantity,
        }
      );
      return !!response.success;
    } catch (error) {
      console.error("Error updating cart item quantity:", error);
      return false;
    }
  },

  // Remove cart item
  async removeCartItem(itemId: string): Promise<boolean> {
    try {
      const response = await apiService.delete(
        `/api/v1/cart/remove/${itemId}/`
      );
      return !!response.success;
    } catch (error) {
      console.error("Error removing cart item:", error);
      return false;
    }
  },

  // Clear entire cart
  async clearCart(): Promise<void> {
    try {
      await apiService.post("/api/v1/cart/clear/");
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  },

  // get addresses
  async getAddresses(): Promise<any[]> {
    try {
      const response = await apiService.get("/api/v1/addresses/");
      if (response.success && response.data) {
        return response.data.results;
      }
      return [];
    } catch (error) {
      console.error("Error fetching addresses:", error);
      return [];
    }
  },

  async createAddress(addressData: CreateAddress): Promise<boolean> {
    try {
      const response = await apiService.post("/api/v1/addresses/", addressData);
      return !!response.success;
    } catch (error) {
      console.error("Error saving address:", error);
      return false;
    }
  },

  async setAddressAsDefault(addressId: string, is_default: boolean): Promise<boolean> {
    try {
      const response = await apiService.post(
        `api/v1/addresses/${addressId}/set-default/`, is_default
      );
      return !!response.success;
    } catch (error) {
      console.error("Error setting address as default:", error);
      return false;
    }
  },

  
  async patchAddressDetails(addressId: string, is_default: boolean,label:string, landmark: string): Promise<boolean> {
    try {
      const response = await apiService.post(
        `/api/v1/addresses/${addressId}/`, {is_default, label, landmark}
      );
      return !!response.success;
    } catch (error) {
      console.error("Error setting address as default:", error);
      return false;
    }
  },

  async getAddressById(addressId: string): Promise<any | null> {
    try {
      const response = await apiService.get(`/api/v1/addresses/${addressId}/`);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching address by ID:", error);
      return null;
    }
  },

  async deleteAddressbyId(addressId: string): Promise<boolean> {
    try {
      const response = await apiService.delete(
        `/api/v1/addresses/${addressId}/`
      );
      return !!response.success;
    } catch (error) {
      console.error("Error deleting address:", error);
      return false;
    }
  },

  /**
   * Checkout - Create order from cart
   * Backend will:
   * 1. Validate cart items are still available
   * 2. Group items by merchant
   * 3. Create OrderIntent(s) - one per merchant
   * 4. Create OrderIntentItems from cart items automatically
   * 5. Clear the cart
   */
  checkout: async (data: {
    address_id: string;
    notes?: string;
    delivery_fee?: number;
    expected_delivery_date?: string;
  }) => {
    try {
      const response = await apiService.post("/api/v1/orders/checkout/", data); // Returns: { message: "Order(s) placed successfully", orders: [...] }
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Checkout error:", error);
      throw error;
    }
  },

  getOrdersByGroupID: async (groupID: string) => {
    try {
      const response = await apiService.get(
        `/api/v1/order-groups/${groupID}/`
      );
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching order by group ID:", error);
      return null;
    }
  },

  getOrders: async () => {
    try {
      const response = await apiService.get(
        `/api/v1/orders/`
      );
      if (response.success && response.data) {
        return response.data.results;
      }
      return [];
    } catch (error) {
      console.error("Error fetching orders:", error);
      return [];
    }
  },
  
  getOrderbyID: async (orderID: string) => {
    try {
      const response = await apiService.get(
        `/api/v1/orders/${orderID}/`
      );
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching order by ID:", error);
      return null;
    }
  },

  // allow the user to cancel the order in 5 minutes

  cancelOrder: async (orderID: string) => {
    try {
      const response = await apiService.post(
        `/api/v1/orders/${orderID}/cancel/`
      );
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Error canceling order", error);
      return null;
    }
  },
};
