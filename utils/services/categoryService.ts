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
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 800));
    
            // Generate dummy data
            const allCategories = [
                {
                    id: 1,
                    name: "Electronics",
                    subcategories: [
                        {
                            id: 101,
                            name: "Smartphones",
                            image_url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400"
                        },
                        {
                            id: 102,
                            name: "Laptops",
                            image_url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400"
                        },
                        {
                            id: 103,
                            name: "Headphones",
                            image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"
                        },
                        {
                            id: 104,
                            name: "Cameras",
                            image_url: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400"
                        }
                    ]
                },
                {
                    id: 2,
                    name: "Fashion",
                    subcategories: [
                        {
                            id: 201,
                            name: "Men's Clothing",
                            image_url: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=400"
                        },
                        {
                            id: 202,
                            name: "Women's Clothing",
                            image_url: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400"
                        },
                        {
                            id: 203,
                            name: "Shoes",
                            image_url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400"
                        },
                        {
                            id: 204,
                            name: "Accessories",
                            image_url: "https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=400"
                        }
                    ]
                },
                {
                    id: 3,
                    name: "Home & Garden",
                    subcategories: [
                        {
                            id: 301,
                            name: "Furniture",
                            image_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400"
                        },
                        {
                            id: 302,
                            name: "Kitchen Appliances",
                            image_url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400"
                        },
                        {
                            id: 303,
                            name: "Decor",
                            image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400"
                        },
                        {
                            id: 304,
                            name: "Garden Tools",
                            image_url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400"
                        }
                    ]
                },
                {
                    id: 4,
                    name: "Sports & Outdoors",
                    subcategories: [
                        {
                            id: 401,
                            name: "Fitness Equipment",
                            image_url: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400"
                        },
                        {
                            id: 402,
                            name: "Camping Gear",
                            image_url: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=400"
                        },
                        {
                            id: 403,
                            name: "Sports Apparel",
                            image_url: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400"
                        },
                        {
                            id: 404,
                            name: "Bicycles",
                            image_url: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400"
                        }
                    ]
                },
                {
                    id: 5,
                    name: "Books & Media",
                    subcategories: [
                        {
                            id: 501,
                            name: "Fiction",
                            image_url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400"
                        },
                        {
                            id: 502,
                            name: "Non-Fiction",
                            image_url: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400"
                        },
                        {
                            id: 503,
                            name: "Music",
                            image_url: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400"
                        },
                        {
                            id: 504,
                            name: "Movies",
                            image_url: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400"
                        }
                    ]
                },
                {
                    id: 6,
                    name: "Beauty & Personal Care",
                    subcategories: [
                        {
                            id: 601,
                            name: "Skincare",
                            image_url: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400"
                        },
                        {
                            id: 602,
                            name: "Makeup",
                            image_url: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400"
                        },
                        {
                            id: 603,
                            name: "Hair Care",
                            image_url: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400"
                        },
                        {
                            id: 604,
                            name: "Fragrances",
                            image_url: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400"
                        }
                    ]
                },
                {
                    id: 7,
                    name: "Toys & Games",
                    subcategories: [
                        {
                            id: 701,
                            name: "Action Figures",
                            image_url: "https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?w=400"
                        },
                        {
                            id: 702,
                            name: "Board Games",
                            image_url: "https://images.unsplash.com/photo-1632501641765-e568d28b0015?w=400"
                        },
                        {
                            id: 703,
                            name: "Puzzles",
                            image_url: "https://images.unsplash.com/photo-1587731556938-38755b4803a6?w=400"
                        },
                        {
                            id: 704,
                            name: "Educational Toys",
                            image_url: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400"
                        }
                    ]
                },
                {
                    id: 8,
                    name: "Automotive",
                    subcategories: [
                        {
                            id: 801,
                            name: "Car Parts",
                            image_url: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400"
                        },
                        {
                            id: 802,
                            name: "Accessories",
                            image_url: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=400"
                        },
                        {
                            id: 803,
                            name: "Tools",
                            image_url: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400"
                        },
                        {
                            id: 804,
                            name: "Car Care",
                            image_url: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400"
                        }
                    ]
                },
                {
                    id: 9,
                    name: "Food & Beverages",
                    subcategories: [
                        {
                            id: 901,
                            name: "Snacks",
                            image_url: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400"
                        },
                        {
                            id: 902,
                            name: "Beverages",
                            image_url: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400"
                        },
                        {
                            id: 903,
                            name: "Organic Foods",
                            image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400"
                        },
                        {
                            id: 904,
                            name: "Gourmet Foods",
                            image_url: "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=400"
                        }
                    ]
                },
                {
                    id: 10,
                    name: "Pet Supplies",
                    subcategories: [
                        {
                            id: 1001,
                            name: "Pet Food",
                            image_url: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400"
                        },
                        {
                            id: 1002,
                            name: "Pet Toys",
                            image_url: "https://images.unsplash.com/photo-1548681528-6a5c45b66b42?w=400"
                        },
                        {
                            id: 1003,
                            name: "Pet Accessories",
                            image_url: "https://images.unsplash.com/photo-1444212477490-ca407925329e?w=400"
                        },
                        {
                            id: 1004,
                            name: "Pet Grooming",
                            image_url: "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=400"
                        }
                    ]
                }
            ];
    
            // Calculate pagination
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedResults = allCategories.slice(startIndex, endIndex);
            const totalCount = allCategories.length;
            const hasNext = endIndex < totalCount;
            const hasPrevious = page > 1;
    
            return {
                results: paginatedResults,
                hasMore: hasNext,
                count: totalCount,
                next: hasNext ? `page=${page + 1}` : null,
                previous: hasPrevious ? `page=${page - 1}` : null,
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

    async getMainCategoriesandSubcategoriesReal(page: number, limit: number) {
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