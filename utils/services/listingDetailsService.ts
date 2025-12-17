import apiService from "@/utils/apiBase";
import { ListingDetail } from "@/utils/types/models";

export const listingDetailsService = {
  async getListingDetails(listingID: string): Promise<ListingDetail | null> {
    try {
      const response = await apiService.get<ListingDetail>(
        `/api/v1/listings/${listingID}/`
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching listing details", error);
      return null;
    }
  },

  async AddListingtoCart(listingID: string, quantity: number): Promise<boolean> {
    try {
      const response = await apiService.post(
        `/api/v1/cart/add/`,
        {
          listing_id: listingID,
          quantity: quantity,
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error adding listing to cart", error);
      return false;
    }
  },

  async AddListingtoWishlist(listingID: string): Promise<boolean> {
    try {
      const response = await apiService.post(
        `/api/v1/wishlist/add/`,
        {
          listing_id: listingID,
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error adding listing to wishlist", error);
      return false;
    }
  }
};


