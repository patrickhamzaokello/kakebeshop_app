import apiService from "@/utils/apiBase";
import {
  Listing,
  ListingDetail,
  CartCheckResponse,
  WishlistCheckResponse,
  SimilarFromMerchantResponse,
  SimilarFromMarketplaceResponse,
} from "@/utils/types/models";

export interface WishlistItem {
  id: string;
  listing: Listing;
  created_at: string;
}

export const listingDetailsService = {
  async getListingDetails(listingID: string): Promise<ListingDetail | null> {
    try {
      const response = await apiService.get<ListingDetail>(
        `/api/v1/listings/${listingID}/`
      );

      return response.data;
    } catch (error) {
      return null;
    }
  },

  async checkCartStatus(listingID: string): Promise<CartCheckResponse | null> {
    try {
      const response = await apiService.get<CartCheckResponse>(
        `/api/v1/cart/check/${listingID}/`
      );
      return response.data;
    } catch (error) {
      if (__DEV__) console.error("Error checking cart status", error);
      return null;
    }
  },

  async checkWishlistStatus(listingID: string): Promise<WishlistCheckResponse | null> {
    try {
      const response = await apiService.get<WishlistCheckResponse>(
        `/api/v1/wishlist/check/${listingID}/`
      );
      return response.data;
    } catch (error) {
      if (__DEV__) console.error("Error checking wishlist status", error);
      return null;
    }
  },

  async getSimilarFromMerchant(
    listingID: string,
    limit: number = 6
  ): Promise<SimilarFromMerchantResponse | null> {
    try {
      const response = await apiService.get<SimilarFromMerchantResponse>(
        `/api/v1/listings/${listingID}/similar-from-merchant/?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      if (__DEV__) console.error("Error fetching similar from merchant", error);
      return null;
    }
  },

  async getSimilarFromMarketplace(
    listingID: string,
    limit: number = 12,
    excludeMerchant: boolean = false
  ): Promise<SimilarFromMarketplaceResponse | null> {
    try {
      const response = await apiService.get<SimilarFromMarketplaceResponse>(
        `/api/v1/listings/${listingID}/similar-from-marketplace/?limit=${limit}&exclude_merchant=${excludeMerchant}`
      );
      return response.data;
    } catch (error) {
      if (__DEV__) console.error("Error fetching similar from marketplace", error);
      return null;
    }
  },

  async AddListingtoCart(listingID: string, quantity: number): Promise<any> {
    try {
      const response = await apiService.post(`/api/v1/cart/add/`, {
        listing_id: listingID,
        quantity: quantity,
      });

      return response;
    } catch (error) {
      if (__DEV__) console.error("Error adding listing to cart", error);
      return false;
    }
  },

  async AddListingtoWishlist(listingID: string): Promise<boolean> {
    try {
      const response = await apiService.post(`/api/v1/wishlist/add/`, {
        listing_id: listingID,
      });

      return response.data;
    } catch (error) {
      if (__DEV__) console.error("Error adding listing to wishlist", error);
      return false;
    }
  },

  async RemoveListingFromWishlist(listingID: string): Promise<boolean> {
    try {
      const response = await apiService.delete(
        `/api/v1/wishlist/remove/${listingID}/`
      );
      return response.success || false;
    } catch (error) {
      if (__DEV__) console.error("Error removing listing from wishlist", error);
      return false;
    }
  },

  async getWishlist(page: number = 1): Promise<{ results: WishlistItem[]; next: string | null } | null> {
    try {
      const response = await apiService.get(`/api/v1/wishlist/?page=${page}`);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      if (__DEV__) console.error("Error fetching wishlist", error);
      return null;
    }
  },
};


