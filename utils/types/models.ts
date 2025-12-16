import {
    TextProps,
    TextStyle,
    TouchableOpacityProps,
    ViewStyle,
} from "react-native";




export interface User {
    id: string;
    username: string;
    name: string;
    email: string;
    profile_image: string | null;
    phone: string | null;
    bio: string | null;

    is_verified: boolean;
    phone_verified: boolean;
    is_merchant: boolean;

    intent: UserIntent | null;
    onboarding: UserOnboarding | null;
    merchant: Merchant | null;

    created_at: string;
    updated_at: string;
}
export interface UserIntent {
    id: string;
    user_email: string;
    user_name: string;
    intent: "sell" | "buy";
    intent_display: string;
    created_at: string;
    updated_at: string;
}

export interface UserOnboarding {
    id: string;
    user_email: string;
    user_name: string;
    intent_completed: boolean;
    categories_completed: boolean;
    profile_completed: boolean;
    is_onboarding_complete: boolean;
    progress_percentage: number;
    completed_at: string;
    created_at: string;
    updated_at: string;
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
    slug: string;
    icon: string | null;
    parent: string | null;
    children: Category[];
    allows_order_intent: boolean;
    allows_cart: boolean;
    is_contact_only: boolean;
    sort_order: number;
    is_active: boolean;
    created_at: string;
}

export interface Location {
    id: string;
    region: string;
    district: string;
    area: string;
    latitude: string;
    longitude: string;
    address: string;
    is_active: boolean;
    created_at: string;
}

export interface Tag {
    id: string;
    name: string;
    slug: string;
    created_at: string;
}

export interface ListingImageType {
    image: string;
    thumbnail: string;
}

export interface ListingDetailImageType {
    id: string;
    image: string;
    thumbnail: string;
    is_primary: boolean;
    sort_order: number;
    created_at: string;
}

export interface Merchant {
    id: string;
    display_name: string;
    business_name: string;
    logo: string;
    rating: number;
    total_reviews: number;
    verified: boolean;
    featured: boolean
}

export interface MerchantDetails {
    id: string;
    user_id: string;
    username: string;
    email: string;
    display_name: string;
    business_name: string;
    description: string;
    business_phone: string;
    business_email: string;
    logo: string | null;
    cover_image: string | null;

    verified: boolean;
    verification_date: string | null;
    featured: boolean;

    rating: number;
    total_reviews: number;
    status: "ACTIVE" | "SUSPENDED" | "BANNED";
    is_active: boolean;

    created_at: string;
    updated_at: string;
}


export interface Listing {
    id: string,
    merchant: Merchant,
    title: string,
    listing_type: string,
    category_name: string,
    price_type: string,
    price: string,
    price_min: string | null,
    price_max: string | null,
    currency: string ,
    is_featured: boolean,
    is_verified: boolean,
    views_count: number,
    primary_image: ListingImageType,
    created_at: string
}


export interface ListingDetail extends Listing   {
    description: string;
    category: Category;
    location: Location;
    tags: Tag[];
    currency: string;
    is_price_negotiable: boolean;
    status: string;
    rejection_reason: string;
    featured_until: string | null;
    views_count: number;
    contact_count: number;
    metadata: any;
    expires_at: string | null;
    updated_at: string;
    deleted_at: string | null;
    images: ListingDetailImageType[];
    business_hours: any[];
}

export interface HeaderData {
    profile: User;
    notificationsCount: number;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}



export type TypoProps = {
    size?: number;
    color?: string;
    fontWeight?: TextStyle["fontWeight"];
    children: any | null;
    style?: TextStyle;
    textProps?: TextProps;
};

export type BackButtonProps = {
    style?: ViewStyle;
    iconSize?: number;
};


export interface CustomButtonProps extends TouchableOpacityProps {
    style?: ViewStyle;
    onPress?: () => void;
    loading?: boolean;
    children: React.ReactNode;
}

export type UserType = {
    user_id?: string;
    email?: string | null;
    username?: string | null;
    full_name?: string | null;
    phone_number?: string | null;
    image?: any;
} | null;


export type AuthVerificationResponse = {
    expires_in: string;     // "10 minutes"
    message: string;        // "Code verified successfully"
    reset_token: string;    // "cw2kbu-..."
    success: boolean;       // true
    uidb64: string;         // "YjNhNTVmOGEt..."
};


