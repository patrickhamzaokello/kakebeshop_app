# Listing Details Page - Complete API Documentation

## Overview

This document provides comprehensive API documentation for building an optimized listing details page for the Kakebe Shop marketplace. It includes all necessary endpoints and their request/response formats to create a feature-rich product/service detail page.

**Base URL:** `https://backend.kakebeshop.com/api/v1`

---

## Table of Contents

1. [API Endpoints Summary](#api-endpoints-summary)
2. [Detailed API Documentation](#detailed-api-documentation)
3. [Recommended Page Sections](#recommended-page-sections)
4. [Integration Examples](#integration-examples)
5. [Error Handling](#error-handling)

---

## API Endpoints Summary

| Endpoint | Method | Auth Required | Purpose |
|----------|--------|---------------|---------|
| `/listings/{listing_id}/` | GET | Optional | Get listing details |
| `/cart/check/{listing_id}/` | GET | Required | Check if item is in cart |
| `/wishlist/check/{listing_id}/` | GET | Required | Check if item is in wishlist |
| `/listings/{listing_id}/similar-from-merchant/` | GET | Optional | Get similar items from same seller |
| `/listings/{listing_id}/similar-from-marketplace/` | GET | Optional | Get similar items from marketplace |

---

## Detailed API Documentation

### 1. Get Listing Details

**Endpoint:** `GET /listings/{listing_id}/`

**Description:** Retrieve complete details about a specific listing including images, merchant info, category, pricing, and metadata.

**Authentication:** Optional (public endpoint, but shows owner's draft listings if authenticated)

**URL Parameters:**
- `listing_id` (UUID) - The unique identifier of the listing

#### Request Example

```bash
curl --location 'https://backend.kakebeshop.com/api/v1/listings/5ef1e840-cb86-4678-bc17-cdf87b2f1c51/' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
--header 'Cookie: csrftoken=9LeFdlBKs9I4s1Dkk3j9tLTjejqetRhs'
```

#### Response (200 OK)

```json
{
    "id": "5ef1e840-cb86-4678-bc17-cdf87b2f1c51",
    "merchant": {
        "id": "c5846859-1f96-4190-be25-9dccc5e013d5",
        "display_name": "Brainwave Enterprise",
        "business_name": null,
        "logo": null,
        "rating": 0.0,
        "total_reviews": 0,
        "verified": true,
        "featured": false
    },
    "title": "Jonny",
    "description": "Drunk though ghjjjg. Hjjjj",
    "listing_type": "PRODUCT",
    "category": {
        "id": "696e650e-69ae-4027-927c-4c822169da97",
        "name": "Electronics",
        "slug": "electronics",
        "icon": null,
        "description": "",
        "parent": null,
        "parent_name": null,
        "children_count": 0,
        "allows_order_intent": false,
        "allows_cart": false,
        "is_contact_only": false,
        "is_featured": false,
        "sort_order": 0,
        "is_active": true,
        "created_at": "2026-01-07T04:32:57.117672Z",
        "updated_at": "2026-01-07T04:32:57.117702Z"
    },
    "tags": [],
    "price_type": "FIXED",
    "price": "8000.00",
    "price_min": null,
    "price_max": null,
    "currency": "UGX",
    "is_price_negotiable": false,
    "status": "ACTIVE",
    "rejection_reason": null,
    "is_verified": true,
    "verified_at": "2026-01-09T05:03:29.982055Z",
    "is_featured": false,
    "featured_until": null,
    "views_count": 0,
    "contact_count": 0,
    "metadata": null,
    "expires_at": null,
    "created_at": "2026-01-07T04:55:29.592135Z",
    "updated_at": "2026-01-07T04:58:46.813958Z",
    "business_hours": [],
    "is_active": true,
    "images": [
        {
            "thumb": {
                "id": "a912dcf0-e9c0-443a-8270-9c2bad807610",
                "image": "https://d358fwv1jl3jsn.cloudfront.net/listings/420466ad-6a7e-430d-bf17-bebf5bd2a455/4f5e8f56cdbd42bfa8a071a9e8428dc1/thumb.webp",
                "width": 240,
                "height": 240,
                "size_bytes": 14926,
                "order": 0
            },
            "medium": {
                "id": "52ecd9a0-1933-4a1e-ad73-72bd4ff59d7b",
                "image": "https://d358fwv1jl3jsn.cloudfront.net/listings/420466ad-6a7e-430d-bf17-bebf5bd2a455/f2c76ec5509f43d8b1f3d72c49c57db0/medium.webp",
                "width": 500,
                "height": 500,
                "size_bytes": 50506,
                "order": 0
            },
            "large": {
                "id": "901e7d73-4fec-4359-9240-5a538b171cf8",
                "image": "https://d358fwv1jl3jsn.cloudfront.net/listings/420466ad-6a7e-430d-bf17-bebf5bd2a455/128dd71dd88d44b4a6548b6c77990a6f/large.webp",
                "width": 720,
                "height": 720,
                "size_bytes": 89832,
                "order": 0
            }
        }
        // ... more images
    ]
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique listing identifier |
| `merchant` | Object | Seller information |
| `title` | String | Listing title |
| `description` | String | Detailed description |
| `listing_type` | String | "PRODUCT" or "SERVICE" |
| `category` | Object | Category information |
| `tags` | Array | Associated tags |
| `price_type` | String | "FIXED", "RANGE", or "ON_REQUEST" |
| `price` | Decimal | Fixed price (if price_type is FIXED) |
| `price_min` | Decimal | Minimum price (if price_type is RANGE) |
| `price_max` | Decimal | Maximum price (if price_type is RANGE) |
| `currency` | String | Currency code (e.g., "UGX") |
| `is_price_negotiable` | Boolean | Whether price is negotiable |
| `status` | String | Current listing status |
| `is_verified` | Boolean | Seller verification status |
| `is_featured` | Boolean | Featured listing status |
| `views_count` | Integer | Total views |
| `contact_count` | Integer | Number of times contacted |
| `business_hours` | Array | Operating hours (if applicable) |
| `images` | Array | Multiple image sizes (thumb, medium, large) |

---

### 2. Check if Item is in Cart

**Endpoint:** `GET /cart/check/{listing_id}/`

**Description:** Check if a specific listing is currently in the authenticated user's shopping cart.

**Authentication:** Required (Bearer Token)

**URL Parameters:**
- `listing_id` (UUID) - The unique identifier of the listing

#### Request Example

```bash
curl --location 'https://backend.kakebeshop.com/api/v1/cart/check/5ef1e840-cb86-4678-bc17-cdf87b2f1c51/' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
--header 'Cookie: csrftoken=9LeFdlBKs9I4s1Dkk3j9tLTjejqetRhs'
```

#### Response - Item NOT in Cart (200 OK)

```json
{
    "in_cart": false,
    "cart_item_id": null,
    "quantity": 0
}
```

#### Response - Item IN Cart (200 OK)

```json
{
    "in_cart": true,
    "cart_item_id": "987f6543-e21a-43d2-b345-567890123456",
    "quantity": 2
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `in_cart` | Boolean | Whether item is in user's cart |
| `cart_item_id` | UUID/null | Cart item ID if exists, null otherwise |
| `quantity` | Integer | Current quantity in cart (0 if not in cart) |

---

### 3. Check if Item is in Wishlist

**Endpoint:** `GET /wishlist/check/{listing_id}/`

**Description:** Check if a specific listing is in the authenticated user's wishlist.

**Authentication:** Required (Bearer Token)

**URL Parameters:**
- `listing_id` (UUID) - The unique identifier of the listing

#### Request Example

```bash
curl --location 'https://backend.kakebeshop.com/api/v1/wishlist/check/5ef1e840-cb86-4678-bc17-cdf87b2f1c51/' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
--header 'Cookie: csrftoken=9LeFdlBKs9I4s1Dkk3j9tLTjejqetRhs'
```

#### Response - Item NOT in Wishlist (200 OK)

```json
{
    "in_wishlist": false
}
```

#### Response - Item IN Wishlist (200 OK)

```json
{
    "in_wishlist": true
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `in_wishlist` | Boolean | Whether item is in user's wishlist |

---

### 4. Get Similar Listings from Same Merchant

**Endpoint:** `GET /listings/{listing_id}/similar-from-merchant/`

**Description:** Retrieve similar products/services from the same seller. Great for "More from this seller" sections.

**Authentication:** Optional (public endpoint)

**URL Parameters:**
- `listing_id` (UUID) - The reference listing ID

**Query Parameters:**
- `limit` (Integer, optional) - Number of results (default: 6, max: 20)
- `exclude_current` (Boolean, optional) - Exclude current listing (default: true)

#### Request Example

```bash
curl --location 'https://backend.kakebeshop.com/api/v1/listings/5ef1e840-cb86-4678-bc17-cdf87b2f1c51/similar-from-merchant/?limit=6' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
--header 'Cookie: csrftoken=9LeFdlBKs9I4s1Dkk3j9tLTjejqetRhs'
```

#### Response (200 OK)

```json
{
    "count": 2,
    "reference_listing": {
        "id": "5ef1e840-cb86-4678-bc17-cdf87b2f1c51",
        "title": "Jonny",
        "merchant_name": "Brainwave Enterprise"
    },
    "results": [
        {
            "id": "73d1d6ae-45d1-4fd4-93df-91e81ca37b9e",
            "merchant": {
                "id": "c5846859-1f96-4190-be25-9dccc5e013d5",
                "display_name": "Brainwave Enterprise",
                "business_name": null,
                "logo": null,
                "rating": 0.0,
                "total_reviews": 0,
                "verified": true,
                "featured": false
            },
            "title": "First one",
            "listing_type": "PRODUCT",
            "category_name": "Electronics",
            "price_type": "FIXED",
            "price": "5000.00",
            "price_min": null,
            "price_max": null,
            "currency": "UGX",
            "is_featured": false,
            "is_verified": true,
            "views_count": 0,
            "primary_image": {
                "id": "14d9367a-e677-43d2-bc98-fd8c9ab3682b",
                "image": "https://d358fwv1jl3jsn.cloudfront.net/listings/fe6655a3-ad2c-4724-99c3-2abe30741824/0e8b6c3308a247d4bf883d24f1d0a8ca/thumb.webp",
                "width": 240,
                "height": 240,
                "variant": "thumb",
                "image_group_id": "fe6655a3-ad2c-4724-99c3-2abe30741824"
            },
            "created_at": "2026-01-07T04:48:15.267878Z"
        },
        {
            "id": "29fd6054-5fa1-4df9-a09f-9ae9dd34ceb8",
            "merchant": {
                "id": "c5846859-1f96-4190-be25-9dccc5e013d5",
                "display_name": "Brainwave Enterprise",
                "business_name": null,
                "logo": null,
                "rating": 0.0,
                "total_reviews": 0,
                "verified": true,
                "featured": false
            },
            "title": "Funny Jim",
            "listing_type": "SERVICE",
            "category_name": "Electronics",
            "price_type": "FIXED",
            "price": "5000.00",
            "price_min": null,
            "price_max": null,
            "currency": "UGX",
            "is_featured": false,
            "is_verified": true,
            "views_count": 0,
            "primary_image": {
                "id": "3f0fb422-4776-4a8e-8b32-ed53a2464974",
                "image": "https://d358fwv1jl3jsn.cloudfront.net/listings/a8cd02fa-5611-4400-af70-43d96b0c1b75/c60925507bc041a08aa95157150be491/thumb.webp",
                "width": 240,
                "height": 240,
                "variant": "thumb",
                "image_group_id": "a8cd02fa-5611-4400-af70-43d96b0c1b75"
            },
            "created_at": "2026-01-07T19:49:15.286448Z"
        }
    ]
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `count` | Integer | Number of similar listings found |
| `reference_listing` | Object | Information about the reference listing |
| `results` | Array | Array of similar listing objects |

#### Prioritization Algorithm

The similar listings are returned in this priority order:
1. Same category + same listing type (highest priority)
2. Same category (any type)
3. Same listing type (any category)
4. Any other listings from the merchant

---

### 5. Get Similar Listings from Marketplace

**Endpoint:** `GET /listings/{listing_id}/similar-from-marketplace/`

**Description:** Retrieve similar products/services from across the entire marketplace. Uses advanced similarity matching based on category, tags, price range, and listing type.

**Authentication:** Optional (public endpoint)

**URL Parameters:**
- `listing_id` (UUID) - The reference listing ID

**Query Parameters:**
- `limit` (Integer, optional) - Number of results (default: 12, max: 50)
- `exclude_current` (Boolean, optional) - Exclude current listing (default: true)
- `exclude_merchant` (Boolean, optional) - Exclude same merchant (default: false)

#### Request Example

```bash
curl --location 'https://backend.kakebeshop.com/api/v1/listings/5ef1e840-cb86-4678-bc17-cdf87b2f1c51/similar-from-marketplace/?limit=12&exclude_merchant=true' \
--header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
--header 'Cookie: csrftoken=9LeFdlBKs9I4s1Dkk3j9tLTjejqetRhs'
```

#### Response (200 OK)

```json
{
    "count": 2,
    "reference_listing": {
        "id": "5ef1e840-cb86-4678-bc17-cdf87b2f1c51",
        "title": "Jonny",
        "category": "Electronics",
        "listing_type": "Product"
    },
    "results": [
        {
            "id": "73d1d6ae-45d1-4fd4-93df-91e81ca37b9e",
            "merchant": {
                "id": "c5846859-1f96-4190-be25-9dccc5e013d5",
                "display_name": "Brainwave Enterprise",
                "business_name": null,
                "logo": null,
                "rating": 0.0,
                "total_reviews": 0,
                "verified": true,
                "featured": false
            },
            "title": "First one",
            "listing_type": "PRODUCT",
            "category_name": "Electronics",
            "price_type": "FIXED",
            "price": "5000.00",
            "price_min": null,
            "price_max": null,
            "currency": "UGX",
            "is_featured": false,
            "is_verified": true,
            "views_count": 0,
            "primary_image": {
                "id": "14d9367a-e677-43d2-bc98-fd8c9ab3682b",
                "image": "https://d358fwv1jl3jsn.cloudfront.net/listings/fe6655a3-ad2c-4724-99c3-2abe30741824/0e8b6c3308a247d4bf883d24f1d0a8ca/thumb.webp",
                "width": 240,
                "height": 240,
                "variant": "thumb",
                "image_group_id": "fe6655a3-ad2c-4724-99c3-2abe30741824"
            },
            "created_at": "2026-01-07T04:48:15.267878Z"
        },
        {
            "id": "29fd6054-5fa1-4df9-a09f-9ae9dd34ceb8",
            "merchant": {
                "id": "c5846859-1f96-4190-be25-9dccc5e013d5",
                "display_name": "Brainwave Enterprise",
                "business_name": null,
                "logo": null,
                "rating": 0.0,
                "total_reviews": 0,
                "verified": true,
                "featured": false
            },
            "title": "Funny Jim",
            "listing_type": "SERVICE",
            "category_name": "Electronics",
            "price_type": "FIXED",
            "price": "5000.00",
            "price_min": null,
            "price_max": null,
            "currency": "UGX",
            "is_featured": false,
            "is_verified": true,
            "views_count": 0,
            "primary_image": {
                "id": "3f0fb422-4776-4a8e-8b32-ed53a2464974",
                "image": "https://d358fwv1jl3jsn.cloudfront.net/listings/a8cd02fa-5611-4400-af70-43d96b0c1b75/c60925507bc041a08aa95157150be491/thumb.webp",
                "width": 240,
                "height": 240,
                "variant": "thumb",
                "image_group_id": "a8cd02fa-5611-4400-af70-43d96b0c1b75"
            },
            "created_at": "2026-01-07T19:49:15.286448Z"
        }
    ]
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `count` | Integer | Number of similar listings found |
| `reference_listing` | Object | Information about the reference listing |
| `results` | Array | Array of similar listing objects |

#### Prioritization Algorithm

Listings are ranked using a sophisticated similarity score:
1. Same category + same type + matching tags (highest priority - weight 100)
2. Same category + same type (weight 80)
3. Same category (different type OK - weight 60)
4. Similar price range (±50%) + same type (weight 40)
5. Same listing type only (weight 20)

---

## Recommended Page Sections

Build an optimal listing details page with these sections:

### 1. Hero Section (Top)
**APIs Used:**
- `GET /listings/{id}/` - Main listing data
- `GET /cart/check/{id}/` - Cart status
- `GET /wishlist/check/{id}/` - Wishlist status

**Features:**
- ✅ Image gallery with zoom (thumb, medium, large variants)
- ✅ Title and description
- ✅ Price display (with currency formatting for UGX)
- ✅ "Add to Cart" button with quantity selector
- ✅ "Add to Wishlist" heart icon (filled if in wishlist)
- ✅ Share buttons (WhatsApp, Facebook, Twitter)
- ✅ View counter display
- ✅ Listing type badge (Product/Service)
- ✅ Featured/Verified badges

```jsx
// Example Hero Section Structure
<HeroSection>
  <ImageGallery images={listing.images} />
  <ProductInfo>
    <h1>{listing.title}</h1>
    <PricingSection price={listing.price} currency={listing.currency} />
    <ActionButtons>
      <AddToCartButton inCart={cartStatus.in_cart} />
      <WishlistButton inWishlist={wishlistStatus.in_wishlist} />
      <ShareButton />
    </ActionButtons>
  </ProductInfo>
</HeroSection>
```

### 2. Seller Information Section
**APIs Used:**
- `GET /listings/{id}/` - Merchant object

**Features:**
- ✅ Merchant name and logo
- ✅ Verification badge
- ✅ Rating and review count
- ✅ "View Store" button (link to merchant profile)
- ✅ "Contact Seller" button
- ✅ Response time indicator (if available)

```jsx
<SellerCard>
  <SellerAvatar src={listing.merchant.logo} />
  <SellerInfo>
    <h3>{listing.merchant.display_name}</h3>
    {listing.merchant.verified && <VerifiedBadge />}
    <Rating value={listing.merchant.rating} />
    <span>{listing.merchant.total_reviews} reviews</span>
  </SellerInfo>
  <ContactButton onClick={handleContact} />
</SellerCard>
```

### 3. Product Details Section
**APIs Used:**
- `GET /listings/{id}/` - Full listing details

**Features:**
- ✅ Full description with formatted text
- ✅ Category and subcategory
- ✅ Tags display
- ✅ Specifications (if in metadata)
- ✅ Business hours (if applicable for services)
- ✅ Location information
- ✅ Negotiability indicator

```jsx
<DetailsSection>
  <Description text={listing.description} />
  <Metadata>
    <CategoryBadge category={listing.category} />
    <Tags tags={listing.tags} />
    {listing.is_price_negotiable && <NegotiableBadge />}
  </Metadata>
  {listing.business_hours.length > 0 && (
    <BusinessHours hours={listing.business_hours} />
  )}
</DetailsSection>
```

### 4. Similar Items from Seller Section
**APIs Used:**
- `GET /listings/{id}/similar-from-merchant/`

**Features:**
- ✅ Horizontal scrollable product grid
- ✅ "More from {Seller Name}" heading
- ✅ Product cards with image, title, price
- ✅ Quick cart/wishlist actions on hover
- ✅ "View All" link to merchant store

```jsx
<SimilarFromMerchant>
  <SectionHeader>
    More from {merchantName}
    <ViewAllLink to={`/merchants/${merchantId}`} />
  </SectionHeader>
  <ProductGrid>
    {similarMerchantItems.map(item => (
      <ProductCard
        key={item.id}
        listing={item}
        showQuickActions
      />
    ))}
  </ProductGrid>
</SimilarFromMerchant>
```

### 5. Similar Items from Marketplace Section
**APIs Used:**
- `GET /listings/{id}/similar-from-marketplace/`

**Features:**
- ✅ Grid layout (3-4 columns on desktop)
- ✅ "You May Also Like" or "Similar Products" heading
- ✅ Product cards with merchant info
- ✅ Comparison highlights (price difference, features)
- ✅ Lazy loading for better performance

```jsx
<SimilarFromMarketplace>
  <SectionHeader>You May Also Like</SectionHeader>
  <ProductGrid columns={4}>
    {similarMarketplaceItems.map(item => (
      <ProductCard
        key={item.id}
        listing={item}
        showMerchantInfo
        showComparison
      />
    ))}
  </ProductGrid>
</SimilarFromMarketplace>
```

### 6. Sticky Action Bar (Mobile)
**APIs Used:**
- `GET /cart/check/{id}/`
- `GET /wishlist/check/{id}/`

**Features:**
- ✅ Fixed bottom bar on mobile
- ✅ Price display
- ✅ Add to Cart button
- ✅ Wishlist toggle
- ✅ Contact seller button

```jsx
<StickyActionBar visible={isScrolled}>
  <Price>{formatPrice(listing.price, listing.currency)}</Price>
  <ActionButtons>
    <CartButton inCart={cartStatus.in_cart} />
    <WishlistToggle inWishlist={wishlistStatus.in_wishlist} />
  </ActionButtons>
</StickyActionBar>
```

### 7. Breadcrumb Navigation
**APIs Used:**
- `GET /listings/{id}/` - Category object

**Features:**
- ✅ Home > Category > Subcategory > Product
- ✅ Clickable navigation
- ✅ SEO-friendly structure

```jsx
<Breadcrumbs>
  <Link to="/">Home</Link>
  <Link to={`/categories/${category.slug}`}>{category.name}</Link>
  <span>{listing.title}</span>
</Breadcrumbs>
```

### 8. Social Proof Section
**APIs Used:**
- `GET /listings/{id}/` - views_count, contact_count

**Features:**
- ✅ View count
- ✅ Contact count
- ✅ "Trending" badge if high engagement
- ✅ Social sharing count

```jsx
<SocialProof>
  <Stat icon="eye">{listing.views_count} views</Stat>
  <Stat icon="message">{listing.contact_count} inquiries</Stat>
  {listing.is_featured && <FeaturedBadge />}
</SocialProof>
```

---

## Integration Examples

### Complete Page Load Sequence

```javascript
// Step 1: Fetch main listing data
async function loadListingPage(listingId) {
  try {
    // Fetch all data in parallel
    const [
      listingData,
      cartStatus,
      wishlistStatus,
      similarMerchant,
      similarMarketplace
    ] = await Promise.all([
      fetchListingDetails(listingId),
      fetchCartStatus(listingId),
      fetchWishlistStatus(listingId),
      fetchSimilarFromMerchant(listingId, { limit: 6 }),
      fetchSimilarFromMarketplace(listingId, { limit: 12 })
    ]);

    // Update UI
    renderHeroSection(listingData, cartStatus, wishlistStatus);
    renderSellerSection(listingData.merchant);
    renderDetailsSection(listingData);
    renderSimilarMerchantSection(similarMerchant);
    renderSimilarMarketplaceSection(similarMarketplace);

  } catch (error) {
    handleError(error);
  }
}

// Helper functions
async function fetchListingDetails(id) {
  const response = await fetch(
    `https://backend.kakebeshop.com/api/v1/listings/${id}/`,
    {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    }
  );
  return response.json();
}

async function fetchCartStatus(id) {
  if (!isAuthenticated()) return { in_cart: false };
  
  const response = await fetch(
    `https://backend.kakebeshop.com/api/v1/cart/check/${id}/`,
    {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    }
  );
  return response.json();
}

async function fetchWishlistStatus(id) {
  if (!isAuthenticated()) return { in_wishlist: false };
  
  const response = await fetch(
    `https://backend.kakebeshop.com/api/v1/wishlist/check/${id}/`,
    {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    }
  );
  return response.json();
}

async function fetchSimilarFromMerchant(id, options = {}) {
  const params = new URLSearchParams({
    limit: options.limit || 6
  });
  
  const response = await fetch(
    `https://backend.kakebeshop.com/api/v1/listings/${id}/similar-from-merchant/?${params}`
  );
  return response.json();
}

async function fetchSimilarFromMarketplace(id, options = {}) {
  const params = new URLSearchParams({
    limit: options.limit || 12,
    exclude_merchant: options.excludeMerchant || false
  });
  
  const response = await fetch(
    `https://backend.kakebeshop.com/api/v1/listings/${id}/similar-from-marketplace/?${params}`
  );
  return response.json();
}
```

### React Implementation Example

```jsx
import { useState, useEffect } from 'react';

function ListingDetailsPage({ listingId }) {
  const [listing, setListing] = useState(null);
  const [cartStatus, setCartStatus] = useState({ in_cart: false });
  const [wishlistStatus, setWishlistStatus] = useState({ in_wishlist: false });
  const [similarMerchant, setSimilarMerchant] = useState({ results: [] });
  const [similarMarketplace, setSimilarMarketplace] = useState({ results: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPageData();
  }, [listingId]);

  async function loadPageData() {
    setLoading(true);
    try {
      const [
        listingRes,
        cartRes,
        wishlistRes,
        merchantRes,
        marketplaceRes
      ] = await Promise.all([
        fetch(`/api/v1/listings/${listingId}/`),
        fetch(`/api/v1/cart/check/${listingId}/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/v1/wishlist/check/${listingId}/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/v1/listings/${listingId}/similar-from-merchant/`),
        fetch(`/api/v1/listings/${listingId}/similar-from-marketplace/`)
      ]);

      const [
        listingData,
        cartData,
        wishlistData,
        merchantData,
        marketplaceData
      ] = await Promise.all([
        listingRes.json(),
        cartRes.json(),
        wishlistRes.json(),
        merchantRes.json(),
        marketplaceRes.json()
      ]);

      setListing(listingData);
      setCartStatus(cartData);
      setWishlistStatus(wishlistData);
      setSimilarMerchant(merchantData);
      setSimilarMarketplace(marketplaceData);
    } catch (error) {
      console.error('Error loading page:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSkeleton />;
  if (!listing) return <NotFound />;

  return (
    <div className="listing-details-page">
      {/* Hero Section */}
      <HeroSection
        listing={listing}
        cartStatus={cartStatus}
        wishlistStatus={wishlistStatus}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
      />

      {/* Seller Section */}
      <SellerCard merchant={listing.merchant} />

      {/* Details Section */}
      <ProductDetails listing={listing} />

      {/* Similar from Merchant */}
      {similarMerchant.results.length > 0 && (
        <SimilarListings
          title={`More from ${listing.merchant.display_name}`}
          listings={similarMerchant.results}
        />
      )}

      {/* Similar from Marketplace */}
      {similarMarketplace.results.length > 0 && (
        <SimilarListings
          title="You May Also Like"
          listings={similarMarketplace.results}
          showMerchant
        />
      )}
    </div>
  );
}
```

### Vue.js Implementation Example

```vue
<template>
  <div class="listing-page" v-if="!loading">
    <!-- Hero Section -->
    <div class="hero-section">
      <ImageGallery :images="listing.images" />
      
      <div class="product-info">
        <h1>{{ listing.title }}</h1>
        <p class="price">{{ formatPrice(listing.price) }} {{ listing.currency }}</p>
        
        <div class="actions">
          <button
            @click="handleAddToCart"
            :class="{ 'in-cart': cartStatus.in_cart }"
          >
            {{ cartStatus.in_cart ? 'In Cart' : 'Add to Cart' }}
          </button>
          
          <button
            @click="handleToggleWishlist"
            :class="{ 'in-wishlist': wishlistStatus.in_wishlist }"
          >
            <HeartIcon :filled="wishlistStatus.in_wishlist" />
          </button>
        </div>
      </div>
    </div>

    <!-- Seller Card -->
    <SellerCard :merchant="listing.merchant" />

    <!-- Similar from Merchant -->
    <section v-if="similarMerchant.results.length">
      <h2>More from {{ listing.merchant.display_name }}</h2>
      <ProductGrid :listings="similarMerchant.results" />
    </section>

    <!-- Similar from Marketplace -->
    <section v-if="similarMarketplace.results.length">
      <h2>You May Also Like</h2>
      <ProductGrid :listings="similarMarketplace.results" show-merchant />
    </section>
  </div>
</template>

<script>
export default {
  props: ['listingId'],
  
  data() {
    return {
      listing: null,
      cartStatus: { in_cart: false },
      wishlistStatus: { in_wishlist: false },
      similarMerchant: { results: [] },
      similarMarketplace: { results: [] },
      loading: true
    };
  },

  async mounted() {
    await this.loadPageData();
  },

  methods: {
    async loadPageData() {
      try {
        const [
          listingRes,
          cartRes,
          wishlistRes,
          merchantRes,
          marketplaceRes
        ] = await Promise.all([
          this.$api.get(`/listings/${this.listingId}/`),
          this.$api.get(`/cart/check/${this.listingId}/`),
          this.$api.get(`/wishlist/check/${this.listingId}/`),
          this.$api.get(`/listings/${this.listingId}/similar-from-merchant/`),
          this.$api.get(`/listings/${this.listingId}/similar-from-marketplace/`)
        ]);

        this.listing = listingRes.data;
        this.cartStatus = cartRes.data;
        this.wishlistStatus = wishlistRes.data;
        this.similarMerchant = merchantRes.data;
        this.similarMarketplace = marketplaceRes.data;
      } catch (error) {
        console.error('Error loading page:', error);
      } finally {
        this.loading = false;
      }
    },

    formatPrice(price) {
      return new Intl.NumberFormat('en-UG').format(price);
    }
  }
};
</script>
```

---

## Error Handling

### Common HTTP Status Codes

| Code | Description | Action |
|------|-------------|--------|
| 200 | Success | Process response data |
| 401 | Unauthorized | Redirect to login (for cart/wishlist endpoints) |
| 404 | Listing not found | Show "Product not found" page |
| 500 | Server error | Show error message, retry option |

### Error Handling Example

```javascript
async function handleApiCall(apiFunction) {
  try {
    const response = await apiFunction();
    
    if (!response.ok) {
      switch (response.status) {
        case 401:
          // Redirect to login
          window.location.href = '/login';
          break;
        case 404:
          // Show not found page
          showNotFoundPage();
          break;
        case 500:
          // Show error with retry
          showErrorMessage('Server error. Please try again.');
          break;
        default:
          showErrorMessage('Something went wrong');
      }
      return null;
    }
    
    return await response.json();
  } catch (error) {
    // Network error
    showErrorMessage('Network error. Check your connection.');
    return null;
  }
}
```

---

## Performance Optimization Tips

### 1. Parallel API Calls
Load all data simultaneously using `Promise.all()`:

```javascript
const [listing, cart, wishlist, similar] = await Promise.all([
  fetchListing(),
  fetchCart(),
  fetchWishlist(),
  fetchSimilar()
]);
```

### 2. Progressive Loading
Show critical content first, load recommendations later:

```javascript
// Load immediately
await loadListingAndStatus();
renderHeroSection();

// Load in background
loadSimilarListings().then(renderSimilarSections);
```

### 3. Image Optimization
Use appropriate image sizes:
- **Thumbnails (240x240)** - For grids and lists
- **Medium (500x500)** - For hover previews
- **Large (720x720)** - For main product view

### 4. Caching Strategy
```javascript
// Cache listing data for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

function getCachedListing(id) {
  const cached = localStorage.getItem(`listing_${id}`);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
  }
  return null;
}
```

### 5. Lazy Loading Similar Items
```javascript
// Load similar items only when user scrolls to section
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadSimilarListings();
      observer.disconnect();
    }
  });
});

observer.observe(document.getElementById('similar-section'));
```

---

## Complete Page Structure Checklist

### ✅ Essential Sections
- [ ] Hero section with images and primary CTA
- [ ] Pricing and action buttons (Add to Cart, Wishlist)
- [ ] Seller information card
- [ ] Full product description
- [ ] Similar items from seller
- [ ] Similar items from marketplace

### ✅ Enhanced Features
- [ ] Image zoom/lightbox functionality
- [ ] Social sharing buttons
- [ ] Breadcrumb navigation
- [ ] View/contact counters
- [ ] Verification badges
- [ ] Mobile sticky action bar
- [ ] Loading skeletons
- [ ] Error states
- [ ] Empty states (no similar items)

### ✅ User Experience
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Fast page load (<3 seconds)
- [ ] Smooth animations
- [ ] Accessible (WCAG compliant)
- [ ] SEO optimized
- [ ] Analytics tracking

### ✅ Security
- [ ] CSRF token handling
- [ ] Bearer token for authenticated requests
- [ ] XSS protection
- [ ] Input sanitization

---

## Analytics Events to Track

```javascript
// Track page view
trackEvent('listing_viewed', {
  listing_id: listingId,
  merchant_id: merchant.id,
  category: category.name,
  price: listing.price
});

// Track add to cart
trackEvent('add_to_cart', {
  listing_id: listingId,
  quantity: quantity,
  price: listing.price
});

// Track wishlist add
trackEvent('wishlist_added', {
  listing_id: listingId
});

// Track similar item click
trackEvent('similar_item_clicked', {
  source: 'merchant', // or 'marketplace'
  from_listing: currentListingId,
  to_listing: clickedListingId
});

// Track contact seller
trackEvent('contact_seller', {
  listing_id: listingId,
  merchant_id: merchant.id
});
```

---

## Conclusion

This comprehensive API documentation provides everything needed to build a feature-rich, performant listing details page for the Kakebe Shop marketplace. The combination of listing details, cart/wishlist checking, and intelligent similar item recommendations creates an optimal user experience that encourages engagement and conversions.

**Key Takeaways:**
- ✅ Use parallel API calls for faster page loads
- ✅ Implement progressive enhancement
- ✅ Provide clear user feedback for cart/wishlist states
- ✅ Leverage similar items to increase discovery
- ✅ Optimize images and implement lazy loading
- ✅ Handle errors gracefully
- ✅ Track analytics for continuous improvement

For support or questions, contact the Kakebe Shop API team.