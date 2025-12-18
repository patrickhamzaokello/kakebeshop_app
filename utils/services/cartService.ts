import apiService from "@/utils/apiBase";
import { Cart } from "@/utils/types/models";

export const listingDetailsService = {
  async getUserCartItems(listingID: string): Promise<Cart | null> {
    try {
      const response = await apiService.get<Cart>(
        `/api/v1/cart/`
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching listing details", error);
      return null;
    }
  },

  
};


