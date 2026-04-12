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

export interface ListingComment {
  id: string;
  listing: string;
  parent: string | null;
  user_id: string;
  user_name: string;
  body: string;
  reply_count?: number; // only on top-level comments, not replies
  is_owner: boolean;
  created_at: string;
  updated_at: string;
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

  async getComments(
    listingID: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ results: ListingComment[]; count: number; next: string | null } | null> {
    try {
      const response = await apiService.get(
        `/api/v1/listings/${listingID}/comments/?page=${page}&page_size=${pageSize}`
      );
      if (response.success && response.data) return response.data;
      return null;
    } catch (error) {
      if (__DEV__) console.error("Error fetching comments", error);
      return null;
    }
  },

  async getCommentCount(listingID: string): Promise<number | null> {
    try {
      const response = await apiService.get(
        `/api/v1/listings/${listingID}/comments/total/`
      );
      if (response.success && response.data) return response.data.total_comments ?? null;
      return null;
    } catch (error) {
      if (__DEV__) console.error("Error fetching comment count", error);
      return null;
    }
  },

  async postComment(
    listingID: string,
    body: string,
    parentID?: string
  ): Promise<ListingComment | null> {
    try {
      const payload: Record<string, string> = { body, listing: listingID };
      if (parentID) payload.parent = parentID;
      const response = await apiService.post(
        `/api/v1/listings/${listingID}/comments/`,
        payload
      );
      // POST response: { success: true, comment: {...} }
      if (response.success && response.data?.comment) return response.data.comment;
      return null;
    } catch (error) {
      if (__DEV__) console.error("Error posting comment", error);
      return null;
    }
  },

  async editComment(commentID: string, body: string): Promise<ListingComment | null> {
    try {
      const response = await apiService.patch(
        `/api/v1/listing-comments/${commentID}/`,
        { body }
      );
      // PATCH response: { success: true, comment: {...} }
      if (response.success && response.data?.comment) return response.data.comment;
      return null;
    } catch (error) {
      if (__DEV__) console.error("Error editing comment", error);
      return null;
    }
  },

  async deleteComment(commentID: string): Promise<boolean> {
    try {
      const response = await apiService.delete(
        `/api/v1/listing-comments/${commentID}/`
      );
      return !!response.success;
    } catch (error) {
      if (__DEV__) console.error("Error deleting comment", error);
      return false;
    }
  },

  async getCommentReplies(
    commentID: string,
    page: number = 1
  ): Promise<{ results: ListingComment[]; count: number; next: string | null } | null> {
    try {
      const response = await apiService.get(
        `/api/v1/listing-comments/${commentID}/replies/?page=${page}`
      );
      if (response.success && response.data) return response.data;
      return null;
    } catch (error) {
      if (__DEV__) console.error("Error fetching replies", error);
      return null;
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


