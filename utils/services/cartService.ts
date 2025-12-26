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
  async updateCartItemQuantity(itemId: string, quantity: number): Promise<boolean> {
    try {
      const response = await apiService.patch(`/api/v1/cart/update/${itemId}/`, {
        quantity,
      });
      return !!response.success;
    } catch (error) {
      console.error("Error updating cart item quantity:", error);
      return false;
    }
  },

  // Remove cart item
  async removeCartItem(itemId: string): Promise<boolean> {
    try {
      const response = await apiService.delete(`/api/v1/cart/remove/${itemId}/`);
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
      const response = await apiService.delete(`/api/v1/addresses/${addressId}/`);
      return !!response.success;
    } catch (error) {
      console.error("Error deleting address:", error);
      return false;
    }
  }


};