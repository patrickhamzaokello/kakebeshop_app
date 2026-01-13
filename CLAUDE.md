# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KakebeShop is a React Native e-commerce marketplace application built with Expo. It allows users to browse listings, manage a shopping cart, and merchants to sell products. The app supports both email/password and social authentication (Google, Apple).

**Backend API:** `https://backend.kakebeshop.com`

## Key Commands

### Development
```bash
npm install              # Install dependencies
npm start                # Start Expo development server
npm run android          # Run on Android emulator/device
npm run ios              # Run on iOS simulator/device
npm run web              # Run on web browser
npm run lint             # Run ESLint
```

### EAS Build (Expo Application Services)
```bash
eas build --profile development    # Development build (com.kakebe.shop.dev)
eas build --profile preview        # Preview build (com.kakebe.shop.preview)
eas build --profile production     # Production build (com.kakebe.shop)
```

App variants use different bundle IDs to allow side-by-side installation.

## Architecture

### Routing Structure (Expo Router v6)

The app uses Expo Router with file-based routing and protected routes via `Stack.Protected`:

- **`app/_layout.tsx`** - Root layout with auth state management and route protection
  - Loading state: Shows `loading.tsx` while checking auth
  - Authenticated + Onboarded: Routes to `(tabs)`
  - Authenticated + Not Onboarded: Routes to `onboarding`
  - Not Authenticated: Routes to `welcome` or `(auth)` group

- **`app/(auth)/`** - Authentication flow (login, register, email verification, password reset)
- **`app/(tabs)/`** - Main tab navigation with 5 tabs:
  - `(home)` - Home/Product listing feed
  - `(category)` - Category search/browse
  - `(sell)` - Merchant selling interface
  - `(cart)` - Shopping cart with badge showing item count
  - `(accounts)` - User profile and settings

- **`app/(tabs)/(home,category,cart,accounts)/`** - Shared nested routes accessible from multiple tabs:
  - `listing/[id].tsx` - Product detail page
  - `merchant/[id].tsx` - Merchant profile page
  - `checkout/*` - Checkout flow (address, confirm, success)
  - `orders/`, `orderDetails/[id]` - Order management
  - `addresses/`, `savedAddress/` - Address management
  - `wishlist/`, `notification/`, `help/`, `privacy/`, `terms/`, etc.

### State Management (Zustand + Persist)

All stores use Zustand with persistence via `expo-secure-store`:

**`utils/authStore.ts`** - Authentication and user state
- Actions: `login()`, `loginWithSocial()`, `register()`, `logout()`, `verifyEmail()`, `forgotPassword()`, `resetPasswordComplete()`, `updateUserData()`, `completeOnboarding()`
- Protected routes check: `isLoggedIn && hasCompletedOnboarding`
- Stores: access/refresh tokens, user data in SecureStore

**`utils/stores/useCartStore.ts`** - Shopping cart state with optimistic updates
- Actions: `fetchCart()`, `fetchCartCount()`, `addToCart()`, `updateCartItemQuantity()`, `removeCartItem()`, `clearCart()`
- Optimistic UI: Updates cart count immediately, reverts on failure
- Syncs with backend and updates cart badge in tab bar

**`utils/stores/useCategoryStore.ts`** - Category data caching

### API Layer

**`utils/apiBase.ts`** - Singleton Axios instance with:
- Base URL: `https://backend.kakebeshop.com`
- Automatic JWT token injection (from SecureStore)
- Token refresh interceptor (handles 401 errors, refreshes token, retries failed requests)
- Auth endpoint exemptions (login, register, password reset don't need tokens)
- Request/response logging in `__DEV__` mode
- Centralized error handling

**`utils/apiEndpoints.ts`** - API endpoint constants

**`utils/services/`** - Service layer for specific features:
- `cartService.ts` - Cart operations
- `homeService.ts` - Home feed data
- `listingDetailsService.ts` - Product details and add to cart

### Type Definitions

**`utils/types/models.ts`** - Comprehensive TypeScript interfaces:
- `User`, `UserIntent`, `UserOnboarding`
- `Listing`, `ListingDetail`, `Merchant`, `MerchantDetails`
- `Cart`, `CartItem`, `CartListing`
- `Category`, `Location`, `Tag`
- `AuthVerificationResponse`, `PaginatedResponse<T>`

### Key Features

**Authentication Flow:**
1. User registers → email verification required → onboarding flow → main app
2. Social login (Google/Apple) → auto-creates account → onboarding if new user
3. Password reset: request email → verify code → set new password

**Protected Routes:**
- Uses `Stack.Protected` with `guard` prop to conditionally render routes
- Guards check `isLoggedIn` and `hasCompletedOnboarding` from `useAuthStore`

**Cart Badge:**
- Real-time cart count displayed in tab bar (see `app/(tabs)/_layout.tsx`)
- Count fetched on login, updated optimistically on cart operations

**Token Refresh:**
- Automatic retry of failed requests after token refresh
- Queue system prevents multiple simultaneous refresh calls
- Auto-logout on refresh failure

**Push Notifications:**
- Managed via `utils/PushNotificationManager.tsx` wrapper in root layout

### Theming

**`constants/theme.ts`** - Theme configuration with colors, spacing, typography

### Component Library

**`components/`**
- `CustomButton.tsx` - Standard button component
- `CustomBackButton.tsx` - Navigation back button
- `ScreenWrapper.tsx` - Standard screen container
- `SocialAuthButtons.tsx` - Google/Apple sign-in buttons
- `Carousel.tsx` - Image carousel
- `Typo.tsx` - Typography component
- `header/` - Header components

### Google Sign-In Configuration

Google Sign-in is configured in `app/_layout.tsx`:
```typescript
GoogleSignin.configure({
  iosClientId: "587787462511-lqie16rbc77p418sfpodcdffse0o8o3b.apps.googleusercontent.com",
  profileImageSize: 120,
});
```

### Path Aliases

TypeScript path alias `@/*` maps to project root (configured in `tsconfig.json`):
```typescript
import { useAuthStore } from "@/utils/authStore";
```

## Development Notes

- **Expo SDK Version:** ~54.0
- **React Version:** 19.1.0
- **React Native Version:** 0.81.5
- **TypeScript:** Strict mode enabled
- **Experiments enabled:** `typedRoutes` (for type-safe navigation), `reactCompiler` (for automatic optimizations)
- **Deep linking scheme:** `kakebeshop://` (configured in `app.config.ts`)
- All API responses should be typed using interfaces from `utils/types/models.ts`
- Cart operations use optimistic updates for better UX (update UI immediately, revert on failure)
- Auth tokens stored in SecureStore, never in AsyncStorage or plain state
- Use `__DEV__` flag for development-only logging
