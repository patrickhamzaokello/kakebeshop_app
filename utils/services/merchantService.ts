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
      if (__DEV__) console.error("Error fetching merchant profile:", error);
      return null;
    }
  },

  async merchantProducts(merchantID: string, page: number = 1, limit: number = 20) {
    try {
      const response = await apiService.get(
        `/api/v1/merchants/${merchantID}/listings?page=${page}&limit=${limit}`
      );
      if (response.success && response.data) {
        return response.data.results;
      }
      return null;
    } catch (error) {
      if (__DEV__) console.error("Error fetching merchant products:", error);
      return null;
    }
  },

  async getMerchantOrders(page: number = 1): Promise<any> {
    try {
      const response = await apiService.get(`/api/v1/orders/merchant/?page=${page}`);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      if (__DEV__) console.error("Error fetching merchant orders:", error);
      return null;
    }
  },

  async confirmOrder(orderId: string): Promise<boolean> {
    try {
      const response = await apiService.post(`/api/v1/orders/${orderId}/confirm/`);
      return !!response.success;
    } catch (error) {
      if (__DEV__) console.error("Error confirming order:", error);
      return false;
    }
  },

  async completeOrder(orderId: string): Promise<boolean> {
    try {
      const response = await apiService.post(`/api/v1/orders/${orderId}/complete/`);
      return !!response.success;
    } catch (error) {
      if (__DEV__) console.error("Error completing order:", error);
      return false;
    }
  },

  async deleteListing(listingId: string): Promise<boolean> {
    try {
      const response = await apiService.delete(`/api/v1/listings/${listingId}/`);
      return !!response.success;
    } catch (error) {
      if (__DEV__) console.error("Error deleting listing:", error);
      return false;
    }
  },
};
