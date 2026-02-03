// services/merchantservice.ts
import apiService from "@/utils/apiBase";
import { MerchantDetails } from "@/utils/types/models";

export const merchantBase = {
  async merchantProfile(merchantID: string): Promise<MerchantDetails | null> {
    try {
      const response = await apiService.get(`/api/v1/merchants/${merchantID}`);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching cart:", error);
      return null;
    }
  },

  async merchantProducts(merchantID: string, page: number = 1, limit: number = 20) {
    try {
      const response = await apiService.get(
        `/api/v1/merchants/${merchantID}/products?page=${page}&limit=${limit}`
      );
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching merchant products:", error);
      return null;
    }
  }

  
};
