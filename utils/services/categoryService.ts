import apiService from "@/utils/apiBase";

import {
    CarouselImage,
    Category,
    Merchant,
    PaginatedResponse
} from '@/utils/types/models';

export const categoryService = {


    // Carousel images
    async getCurrentPromoAds(): Promise<CarouselImage[]> {
        try {
            const response = await apiService.get<PaginatedResponse<CarouselImage>>('/api/v1/banners/');
            return response.data.results;
        } catch (error) {
            return [];
        }
    },

    // Categories
    async getMaincategories(): Promise<Category[]> {
        try {
            const response = await apiService.get<Category[]>('/api/v1/categories/featured/');
            return response.data;
        } catch (error) {
            return [];
        }
    },

    // Featured Merchants
    async getMainCategoriesandSubcategories(page: number, limit: number) {
        try {
            const response = await apiService.get<PaginatedResponse<Category>>('/api/v1/listings/', {
                params: { page, limit },
            });

            // Transform to match our hook's expected format
            return {
                results: response.data.results,
                hasMore: response.data.next !== null,
                count: response.data.count,
                next: response.data.next,
                previous: response.data.previous,
            };
        } catch (error) {
            return {
                results: [],
                hasMore: false,
                count: 0,
                next: null,
                previous: null,
            };
        }
    },

    
};