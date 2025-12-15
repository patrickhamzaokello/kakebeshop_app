import apiService from "@/utils/apiBase";

import {
    UserProfileResponse,
    NotificationsCountResponse,
    CarouselResponse,
    CategoriesResponse,
    MerchantsResponse,
    ListingsResponse,
    PaginatedListingsResponse,
} from '../types';
import {HeaderData} from "@/utils/models";

export const homeService = {
    // Header data
    async getHeaderData(): Promise<HeaderData> {
        const [profileRes, notificationsRes] = await Promise.all([
            apiService.get<UserProfileResponse>('/api/v1/tags'),
            apiService.get<NotificationsCountResponse>('/api/v1/notifications'),
        ]);

        console.log("profileRes");

        return {
            user: profileRes.data,
            notificationsCount: notificationsRes.data.count,
        };
    },

    // Carousel
    getCarouselImages: async () => {
        const response = await apiService.get<CarouselResponse>('/api/v1/campaigns');
        return response.data;
    },
    //
    // Categories
    getCategories: async () => {
        const response = await apiService.get<CategoriesResponse>('/api/v1/categories');
        return response.data;
    },
    //
    // Featured Merchants
    getFeaturedMerchants: async (limit: number = 10) => {
        const response = await apiService.get<MerchantsResponse>('/api/v1/merchants', {
            params: { limit },
        });
        return response.data;
    },
    //
    // Featured Listings
    getFeaturedListings: async (limit: number = 10) => {
        const response = await apiService.get<ListingsResponse>('/api/v1/listings', {
            params: { limit },
        });
        return response.data;
    },

    // All Listings with pagination
    getAllListings: async (page: number = 1, limit: number = 10) => {
        const response = await apiService.get<PaginatedListingsResponse>('/api/v1/listings', {
            params: { page, limit },
        });
        return response.data;
    },
};