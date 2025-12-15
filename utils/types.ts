import {
  User,
  CarouselImage,
  Category,
  Merchant,
  Listing,
  HeaderData,
  PaginatedResponse
} from '@/utils/types/models';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}

// API Response types
export type UserProfileResponse = ApiResponse<User>;
export type NotificationsCountResponse = ApiResponse<{ count: number }>;
export type CarouselResponse = ApiResponse<CarouselImage[]>;
export type CategoriesResponse = ApiResponse<Category[]>;
export type MerchantsResponse = ApiResponse<Merchant[]>;
export type ListingsResponse = ApiResponse<Listing[]>;
export type PaginatedListingsResponse = ApiResponse<PaginatedResponse<Listing>>;