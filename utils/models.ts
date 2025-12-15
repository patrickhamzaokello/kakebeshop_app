export interface User {
    id: string;
    name: string;
    email: string;
    avatar: string;
}

export interface CarouselImage {
    id: string;
    image: string;
    link?: string;
    title?: string;
}

export interface Category {
    id: string;
    name: string;
    icon: string;
    slug: string;
}

export interface Merchant {
    id: string;
    name: string;
    rating: number;
    image: string;
    totalProducts: number;
    verified: boolean;
}

export interface Listing {
    id: string;
    title: string;
    price: number;
    currency: string;
    image: string;
    merchantId: string;
    merchantName: string;
    rating?: number;
    inStock: boolean;
}

export interface HeaderData {
    user: User;
    notificationsCount: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    page: number;
    totalPages: number;
    totalItems: number;
    hasMore: boolean;
}


