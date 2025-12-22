import apiService from "@/utils/apiBase";
import { Cart } from "@/utils/types/models";

export const cartService = {
  async getUserCart(): Promise<Cart | null> {
    try {
      const response = await apiService.get<Cart>(`/api/v1/cart/`);

      return response.data;
    } catch (error) {
      console.error("Error fetching listing details", error);
      return null;
    }
  },

  // Add these methods to your cartService.ts file

  /**
   * Update the quantity of a cart item
   */
  async updateCartItemQuantity(
    itemId: string,
    quantity: number
  ): Promise<void> {
    try {
      const response = await apiService.patch(`/api/v1/cart/update/${itemId}/`, {
        quantity,
      });

      if (!response.success) {
        throw new Error("Failed to update cart item quantity");
      }
    } catch (error) {
      console.error("Error updating cart item quantity:", error);
      throw error;
    }
  },

  /**
   * Remove an item from the cart
   */
  async removeCartItem(itemId: string): Promise<void> {
    try {
      const response = await apiService.delete(`/api/v1/cart/remove/${itemId}/`);

      if (!response.success) {
        throw new Error("Failed to remove cart item");
      }
    } catch (error) {
      console.error("Error removing cart item:", error);
      throw error;
    }
  },
};
