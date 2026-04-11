// services/merchantservice.ts
import apiService from "@/utils/apiBase";
import { MerchantDetails } from "@/utils/types/models";

export type MerchantOrderStatus =
  | "NEW"
  | "CONTACTED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED";

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

  async getMyMerchantProfile(): Promise<MerchantDetails | null> {
    try {
      const response = await apiService.get("/api/v1/merchants/me/");
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      if (__DEV__) console.error("Error fetching own merchant profile:", error);
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

  // GET /merchants/me/orders/ — newest first, supports ?status= and pagination
  async getMerchantOrders(
    page: number = 1,
    status?: MerchantOrderStatus
  ): Promise<any> {
    try {
      const statusParam = status ? `&status=${status}` : "";
      const response = await apiService.get(
        `/api/v1/merchants/me/orders/?page=${page}${statusParam}`
      );
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      if (__DEV__) console.error("Error fetching merchant orders:", error);
      return null;
    }
  },

  // POST /merchants/me/update-logo/  { image_group_id }
  async updateMerchantLogo(imageGroupId: string): Promise<MerchantDetails | null> {
    try {
      const response = await apiService.post("/api/v1/merchants/me/update-logo/", {
        image_group_id: imageGroupId,
      });
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      if (__DEV__) console.error("Error updating merchant logo:", error);
      return null;
    }
  },

  // POST /merchants/me/update-cover-image/  { image_group_id }
  async updateMerchantCoverImage(imageGroupId: string): Promise<MerchantDetails | null> {
    try {
      const response = await apiService.post("/api/v1/merchants/me/update-cover-image/", {
        image_group_id: imageGroupId,
      });
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      if (__DEV__) console.error("Error updating merchant cover image:", error);
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

  // GET /api/v1/orders/orders/merchant-search/
  async merchantOrderSearch(params: {
    q?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
    min_amount?: string;
    max_amount?: string;
  }): Promise<any[]> {
    try {
      const query = new URLSearchParams();
      if (params.q)          query.append("q",          params.q);
      if (params.status)     query.append("status",     params.status);
      if (params.date_from)  query.append("date_from",  params.date_from);
      if (params.date_to)    query.append("date_to",    params.date_to);
      if (params.min_amount) query.append("min_amount", params.min_amount);
      if (params.max_amount) query.append("max_amount", params.max_amount);
      const response = await apiService.get(
        `/api/v1/orders/merchant-search/?${query.toString()}`
      );
      if (response.success && response.data) {
        // Backend: { success, count, data: [...] }
        return response.data.data ?? [];
      }
      return [];
    } catch (error) {
      if (__DEV__) console.error("Merchant order search error:", error);
      return [];
    }
  },

  /**
   * Search & filter the authenticated merchant's own listings.
   *
   * ── Backend endpoint spec ──────────────────────────────────────────────────
   *
   * GET /api/v1/listings/my_listings/
   *
   * Query parameters:
   *   page        integer   Page number (default: 1)
   *   page_size   integer   Items per page (default: 20, max: 100)
   *   search      string    Full-text search across title and description
   *   status      string    Filter by status: ACTIVE | PENDING | REJECTED |
   *                         INACTIVE | DRAFT | EXPIRED
   *   ordering    string    Sort field: created_at | -created_at (default) |
   *                         price | -price | views_count | -views_count
   *
   * Authentication: Bearer token required (merchant-only endpoint)
   *
   * Success response 200:
   * {
   *   count:        number,          // total items matching query
   *   total_pages:  number,
   *   current_page: number,
   *   next:         string | null,   // URL of next page
   *   previous:     string | null,
   *   results: [
   *     {
   *       id:              string,
   *       title:           string,
   *       description:     string,
   *       listing_type:    "PRODUCT" | "SERVICE",
   *       category_name:   string,
   *       price_type:      "FIXED" | "RANGE" | "ON_REQUEST",
   *       price:           string | null,
   *       price_min:       string | null,
   *       price_max:       string | null,
   *       currency:        string,
   *       status:          "ACTIVE" | "PENDING" | "REJECTED" | "INACTIVE" | "DRAFT" | "EXPIRED",
   *       is_featured:     boolean,
   *       is_verified:     boolean,
   *       views_count:     number,
   *       contact_count:   number,
   *       primary_image:   { image: string, thumbnail: string } | null,
   *       created_at:      string,   // ISO 8601
   *       updated_at:      string,
   *     }
   *   ]
   * }
   *
   * Error responses:
   *   401  Unauthorized — token missing or expired
   *   403  Forbidden — user is not a merchant
   * ──────────────────────────────────────────────────────────────────────────
   */
  async searchMyListings(params: {
    search?: string;
    status?: string;
    page?: number;
    ordering?: string;
  }): Promise<any> {
    try {
      const query = new URLSearchParams();
      if (params.page)     query.append("page",     String(params.page));
      if (params.search)   query.append("search",   params.search);
      if (params.status)   query.append("status",   params.status);
      if (params.ordering) query.append("ordering",  params.ordering);
      const response = await apiService.get(`/api/v1/listings/my_listings/?${query.toString()}`);
      if (response.success && response.data) return response.data;
      return null;
    } catch (error) {
      if (__DEV__) console.error("Error searching listings:", error);
      return null;
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
