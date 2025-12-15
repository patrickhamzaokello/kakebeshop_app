import apiService from "@/utils/apiBase";

import {CarouselImage, Category, HeaderData, Listing, Merchant, PaginatedResponse} from '@/utils/types/models';

export const homeService = {
    // Header data - combine user profile and notifications
    async getHeaderData(): Promise<HeaderData> {
        try {
            const [userResponse, notificationsResponse] = await Promise.all([
                apiService.get('/api/v1/categories/'),
                apiService.get('/api/v1/categories/'),
            ]);

            return {
                user: userResponse.data,
                notificationsCount: notificationsResponse.data.count || 0,
            };
        } catch (error) {
            console.error('Error fetching header data:', error);
            throw error;
        }
    },

    // Carousel images
    async getCarouselImages(): Promise<CarouselImage[]> {
        try {
            const response = await apiService.get<CarouselImage[]>('/api/v1/merchants');
            return response.data;
        } catch (error) {
            console.error('Error fetching carousel:', error);
            // Return empty array for graceful degradation
            return [];
        }
    },

    // Categories
    async getCategories(): Promise<Category[]> {
        try {
            const response = await apiService.get<PaginatedResponse<Category>>('/api/v1/categories/');
            return response.data.results;
        } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    },

    // Featured Merchants
    async getFeaturedMerchants(limit: number = 10): Promise<Merchant[]> {
        try {
            const response = await apiService.get<PaginatedResponse<Merchant>>('/api/v1/merchants', {
                params: { limit },
            });
            return response.data.results;
        } catch (error) {
            console.error('Error fetching merchants:', error);
            return [];
        }
    },

    // Featured Listings - filter by is_featured=true
    async getFeaturedListings(limit: number = 10): Promise<Listing[]> {
        try {
            const response = await apiService.get<PaginatedResponse<Listing>>('/api/v1/listings/', {
                params: {
                    is_featured: true,
                    limit,
                },
            });
            return response.data.results;
        } catch (error) {
            console.error('Error fetching featured listings:', error);
            return [];
        }
    },

    // All Listings with pagination
    async getAllListings(page: number = 1, limit: number = 10) {
        try {
            const response = await apiService.get<PaginatedResponse<Listing>>('/api/v1/listings/', {
                params: { page, limit },
            });

            // Transform to match our hook's expected format
            return {
                data: response.data.results,
                hasMore: response.data.next !== null,
                count: response.data.count,
                next: response.data.next,
                previous: response.data.previous,
            };
        } catch (error) {
            console.error('Error fetching listings:', error);
            return {
                data: [],
                hasMore: false,
                count: 0,
                next: null,
                previous: null,
            };
        }
    },
};