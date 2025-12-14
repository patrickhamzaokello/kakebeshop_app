import {
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
  TouchableOpacityProps,
  ViewStyle,
} from "react-native";

export type ScreenWrapperProps = {
  style?: ViewStyle;
  children: React.ReactNode;
};

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
  
  export interface InputProps extends TextInputProps {
    icon?: React.ReactNode;
    containerStyle?: ViewStyle;
    inputStyle?: TextStyle;
    inputRef?: React.RefObject<TextInput>;
  }

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
  
  // Source interface
interface Source {
  id: number;
  name: string;
  base_url: string;
  news_url: string;
  is_active: boolean;
}

// Category interface
interface Category {
  id: number;
  name: string;
  slug: string;
}

// Author interface
interface Author {
  id: number;
  name: string;
  profile_url: string;
  source: Source;
}

// Tag interface
interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface SearchArticle extends Article{
  highlights: string[]; // Array of highlighted text snippets
}

// Main Article interface
interface Article {
  id: number;
  external_id: string;
  url: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  word_count: number;
  read_time_minutes: number;
  featured_image_url: string;
  image_caption: string;
  source: Source;
  category: Category;
  author: Author;
  tags: Tag[];
  published_at: string; // ISO date string
  scraped_at: string;   // ISO date string
  has_full_content: boolean;
  view_count: number;
}

interface ArticleComment {
  id: number;
  article: number;
  user: string; // email address of the user
  content: string;
  parent: number | null; // null for top-level comments, parent comment ID for replies
  created_at: string; // ISO 8601 datetime string
  updated_at: string; // ISO 8601 datetime string
  is_approved: boolean;
  replies: Comment[]; // recursive structure for nested replies
}

// Export all types
export type { Article, Author, Source, Category, Tag, ArticleComment,SearchArticle };