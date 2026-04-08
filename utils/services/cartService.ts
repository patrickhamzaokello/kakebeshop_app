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
      if (__DEV__) console.error("Error fetching cart:", error);
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
      if (__DEV__) console.error("Error fetching cart count:", error);
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
      if (__DEV__) console.error("Error updating cart item quantity:", error);
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
      if (__DEV__) console.error("Error removing cart item:", error);
      return false;
    }
  },

  // Clear entire cart
  async clearCart(): Promise<void> {
    try {
      await apiService.post("/api/v1/cart/clear/");
    } catch (error) {
      if (__DEV__) console.error("Error clearing cart:", error);
    }
  },

  // GET /api/v1/addresses/ — returns plain array (not paginated)
  async getAddresses(): Promise<any[]> {
    try {
      const response = await apiService.get("/api/v1/addresses/");
      if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data : response.data.results ?? [];
      }
      return [];
    } catch (error) {
      if (__DEV__) console.error("Error fetching addresses:", error);
      return [];
    }
  },

  // POST /api/v1/addresses/
  async createAddress(addressData: CreateAddress): Promise<boolean> {
    try {
      const response = await apiService.post("/api/v1/addresses/", addressData);
      return !!response.success;
    } catch (error) {
      if (__DEV__) console.error("Error saving address:", error);
      return false;
    }
  },

  // POST /api/v1/addresses/{id}/set-default/ — no body needed
  async setAddressAsDefault(addressId: string): Promise<boolean> {
    try {
      const response = await apiService.post(
        `/api/v1/addresses/${addressId}/set-default/`
      );
      return !!response.success;
    } catch (error) {
      if (__DEV__) console.error("Error setting address as default:", error);
      return false;
    }
  },

  // PUT /api/v1/addresses/{id}/ — full update, all fields required
  async updateAddressDetails(
    addressId: string,
    data: { label: string; region: string; district: string; area: string; landmark: string; latitude: string; longitude: string; is_default: boolean }
  ): Promise<boolean> {
    try {
      const response = await apiService.put(`/api/v1/addresses/${addressId}/`, data);
      return !!response.success;
    } catch (error) {
      if (__DEV__) console.error("Error updating address:", error);
      return false;
    }
  },

  // PATCH /api/v1/addresses/{id}/ — partial update
  async patchAddress(addressId: string, data: Partial<CreateAddress>): Promise<boolean> {
    try {
      const response = await apiService.patch(`/api/v1/addresses/${addressId}/`, data);
      return !!response.success;
    } catch (error) {
      if (__DEV__) console.error("Error patching address:", error);
      return false;
    }
  },

  // GET /api/v1/addresses/{id}/
  async getAddressById(addressId: string): Promise<any | null> {
    try {
      const response = await apiService.get(`/api/v1/addresses/${addressId}/`);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      if (__DEV__) console.error("Error fetching address by ID:", error);
      return null;
    }
  },

  // DELETE /api/v1/addresses/{id}/ — returns 204 no content
  async deleteAddressbyId(addressId: string): Promise<boolean> {
    try {
      const response = await apiService.delete(`/api/v1/addresses/${addressId}/`);
      return !!response.success;
    } catch (error: any) {
      // Rethrow with the server's message so the caller can display it
      const message = error?.message || error?.data?.error || "Failed to delete address";
      throw new Error(message);
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
      const response = await apiService.post("/api/v1/orders/checkout/", data);
      if (response.success && response.data) {
        // Backend: { success, message, data: { orders: [...], order_group: {...} } }
        return response.data.data;
      }
      return null;
    } catch (error) {
      if (__DEV__) console.error("Checkout error:", error);
      throw error;
    }
  },

  getOrdersByGroupID: async (groupID: string) => {
    try {
      const response = await apiService.get(
        `/api/v1/orders/order-groups/${groupID}/`
      );
      if (response.success && response.data) {
        // Backend: { success, data: { id, group_number, orders: [...], ... } }
        return response.data.data;
      }
      return null;
    } catch (error) {
      if (__DEV__) console.error("Error fetching order by group ID:", error);
      return null;
    }
  },

  getOrders: async () => {
    try {
      const response = await apiService.get(`/api/v1/orders/`);
      if (response.success && response.data) {
        // Backend: { success, count, data: [...] }
        return response.data.data ?? [];
      }
      return [];
    } catch (error) {
      if (__DEV__) console.error("Error fetching orders:", error);
      return [];
    }
  },

  getOrderbyID: async (orderID: string) => {
    try {
      const response = await apiService.get(`/api/v1/orders/${orderID}/`);
      if (response.success && response.data) {
        // Backend: { success, data: { ...order object... } }
        return response.data.data;
      }
      return null;
    } catch (error) {
      if (__DEV__) console.error("Error fetching order by ID:", error);
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
      if (__DEV__) console.error("Error canceling order", error);
      return null;
    }
  },
};
