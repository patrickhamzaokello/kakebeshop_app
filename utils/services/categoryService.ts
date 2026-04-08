import apiService from "@/utils/apiBase";

import {
    CarouselImage,
    Category,
    Listing,
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
            const response = await apiService.get<any>('/api/v1/categories/parents/');
            return response.data.results;
        } catch (error) {
            return [];
        }
    },



    async getMainCategoriesandSubcategories(page: number, limit: number) {
        try {
            const response = await apiService.get<any>(
                `/api/v1/categories/with-subcategories/?page=${page}&limit=${limit}`
            );

            if (__DEV__) {
                console.log('[categories/with-subcategories] raw response.data:', JSON.stringify(response.data, null, 2));
            }

            // apiBase wraps the backend body as response.data.
            // Some endpoints wrap their payload in an inner `data` key — handle both shapes.
            const raw = response.data;
            const data = raw?.results !== undefined ? raw : (raw?.data ?? raw);

            if (__DEV__) {
                console.log('[categories/with-subcategories] resolved data:', JSON.stringify(data, null, 2));
            }

            return {
                results:  Array.isArray(data?.results) ? data.results : [],
                hasMore:  data?.hasMore  ?? (data?.next != null),
                count:    data?.count    ?? 0,
                next:     data?.next     ?? null,
                previous: data?.previous ?? null,
            };
        } catch (error) {
            if (__DEV__) console.error('[categories/with-subcategories] error:', error);
            return { results: [], hasMore: false, count: 0, next: null, previous: null };
        }
    },



    // get Category details
    async getCategoryDetails(categoryId: string): Promise<Category | null> {
        try {
            const response = await apiService.get<Category>(`/api/v1/categories/${categoryId}/details/`);
            return response.data;
        } catch (error) {
            return null;
        }
    },

    // get Category subcategories
    async getCategorySubcategories(categoryId: string){
        try {
            const response = await apiService.get<any>(`/api/v1/categories/${categoryId}/subcategories/`);
            return response.data.subcategories;
        } catch (error) {
            return [];
        }
    },

    // get category listings
    async getCategoryListings(categoryId: string, page: number, limit: number){
        try {
            const response = await apiService.get<PaginatedResponse<Listing>>(`/api/v1/categories/${categoryId}/listings/`, {
                params: { page, limit },
            });
            return response.data;
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