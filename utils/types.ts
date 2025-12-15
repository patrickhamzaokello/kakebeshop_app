import {
  TextProps,
  TextStyle,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";


import {
  User,
  CarouselImage,
  Category,
  Merchant,
  Listing,
  HeaderData,
  PaginatedResponse
} from '@/utils/models';

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