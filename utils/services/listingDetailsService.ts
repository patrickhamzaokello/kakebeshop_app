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
};
