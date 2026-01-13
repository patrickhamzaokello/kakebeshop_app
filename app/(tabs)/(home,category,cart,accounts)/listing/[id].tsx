import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Linking,
  FlatList,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import apiService from "@/utils/apiBase";
import { useCartStore } from "@/utils/stores/useCartStore";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Types
interface ImageVariant {
  id: string;
  image: string;
  order: number;
}

interface ImageGroup {
  thumb?: ImageVariant;
  medium?: ImageVariant;
  large?: ImageVariant;
}

interface Category {
  id: string;
  name: string;
  allows_cart: boolean;
  is_contact_only: boolean;
}

interface Merchant {
  id: string;
  display_name: string;
  business_name: string;
  logo: string | null;
  rating: number;
  total_reviews: number;
  verified: boolean;
  business_phone?: string;
}

interface Tag {
  id: string;
  name: string;
}

interface Review {
  id: string;
  user_name: string;
  user_image: string | null;
  rating: number;
  comment: string;
  created_at: string;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  listing_type: "PRODUCT" | "SERVICE";
  category: Category;
  merchant: Merchant;
  price_type: "FIXED" | "RANGE" | "ON_REQUEST";
  price?: string;
  price_min?: string;
  price_max?: string;
  currency: string;
  is_price_negotiable: boolean;
  is_verified: boolean;
  is_featured: boolean;
  images: ImageGroup[];
  tags: Tag[];
  views_count: number;
  created_at: string;
}

interface SimilarListing {
  id: string;
  title: string;
  price: string;
  currency: string;
  primary_image: { image: string; thumbnail: string };
  merchant: { business_name: string };
}

export default function ListingDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addToCart } = useCartStore();

  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similarListings, setSimilarListings] = useState<SimilarListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listingRes, reviewsRes, similarRes] = await Promise.all([
        apiService.get<Listing>(`/api/v1/listings/${id}/`),
        apiService.get<{ results: Review[] }>(`/api/v1/listings/${id}/reviews/`),
        apiService.get<{ results: SimilarListing[] }>(
          `/api/v1/listings/${id}/similar/`
        ),
      ]);

      if (listingRes.success && listingRes.data) {
        setListing(listingRes.data.results);
      }
      if (reviewsRes.success && reviewsRes.data) {
        setReviews(reviewsRes.data.results || []);
      }
      if (similarRes.success && similarRes.data) {
        setSimilarListings(similarRes.data.results || []);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (group: ImageGroup): string => {
    return group.large?.image || group.medium?.image || group.thumb?.image || "";
  };

  const formatPrice = (): string => {
    if (!listing) return "";
    if (listing.price_type === "ON_REQUEST") return "Price on request";
    if (listing.price_type === "FIXED") {
      return `${listing.currency} ${parseInt(listing.price || "0").toLocaleString()}`;
    }
    if (listing.price_type === "RANGE") {
      return `${listing.currency} ${parseInt(listing.price_min || "0").toLocaleString()} - ${parseInt(listing.price_max || "0").toLocaleString()}`;
    }
    return "";
  };

  const handleAddToCart = async () => {
    if (!listing || addingToCart) return;
    setAddingToCart(true);
    const success = await addToCart(listing.id, quantity);
    setAddingToCart(false);
    if (success) {
      setQuantity(1);
    }
  };

  const handleContactMerchant = () => {
    if (listing?.merchant.business_phone) {
      Linking.openURL(`tel:${listing.merchant.business_phone}`);
    }
  };

  const handleWishlist = async () => {
    if (!listing) return;
    try {
      if (isWishlisted) {
        await apiService.delete(`/api/v1/wishlist/${listing.id}/`);
      } else {
        await apiService.post("/api/v1/wishlist/", { listing: listing.id });
      }
      setIsWishlisted(!isWishlisted);
    } catch (e) {
      console.error("Wishlist error:", e);
    }
  };

  const handleMerchantPress = () => {
    if (listing) {
      router.push({ pathname: "/merchant/[id]", params: { id: listing.merchant.id } });
    }
  };

  const handleSimilarPress = (itemId: string) => {
    router.push({ pathname: "/listing/[id]", params: { id: itemId } });
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={14}
            color={star <= rating ? "#FBBF24" : "#D1D5DB"}
          />
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <StatusBar style="dark" />
        <ActivityIndicator size="small" color="#000" />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.centered}>
        <StatusBar style="dark" />
        <Text style={styles.errorText}>Listing not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.linkText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = listing.images.filter((img) => getImageUrl(img));
  const canAddToCart = listing.category.allows_cart && !listing.category.is_contact_only;
  const isContactOnly = listing.category.is_contact_only;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleWishlist} style={styles.headerBtn}>
            <Ionicons
              name={isWishlisted ? "heart" : "heart-outline"}
              size={24}
              color={isWishlisted ? "#EF4444" : "#000"}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Images */}
        {images.length > 0 ? (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                setImageIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
              }}
            >
              {images.map((img, i) => (
                <Image
                  key={i}
                  source={{ uri: getImageUrl(img) }}
                  style={styles.image}
                  contentFit="cover"
                />
              ))}
            </ScrollView>
            {images.length > 1 && (
              <View style={styles.pagination}>
                <Text style={styles.paginationText}>
                  {imageIndex + 1}/{images.length}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noImage}>
            <Ionicons name="image-outline" size={40} color="#D1D5DB" />
          </View>
        )}

        <View style={styles.content}>
          {/* Title & Price */}
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.price}>{formatPrice()}</Text>
          {listing.is_price_negotiable && listing.price_type !== "ON_REQUEST" && (
            <Text style={styles.negotiable}>Negotiable</Text>
          )}

          {/* Merchant */}
          <TouchableOpacity style={styles.merchantRow} onPress={handleMerchantPress}>
            {listing.merchant.logo ? (
              <Image source={{ uri: listing.merchant.logo }} style={styles.merchantLogo} />
            ) : (
              <View style={styles.merchantLogoPlaceholder}>
                <Text style={styles.merchantInitial}>
                  {listing.merchant.business_name.charAt(0)}
                </Text>
              </View>
            )}
            <View style={styles.merchantInfo}>
              <View style={styles.merchantNameRow}>
                <Text style={styles.merchantName}>{listing.merchant.business_name}</Text>
                {listing.merchant.verified && (
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                )}
              </View>
              <View style={styles.merchantRating}>
                <Ionicons name="star" size={12} color="#FBBF24" />
                <Text style={styles.ratingText}>
                  {listing.merchant.rating.toFixed(1)} ({listing.merchant.total_reviews})
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Quantity Selector (if cart allowed) */}
          {canAddToCart && (
            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Quantity</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityBtn}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Ionicons name="remove" size={20} color="#000" />
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityBtn}
                  onPress={() => setQuantity(quantity + 1)}
                >
                  <Ionicons name="add" size={20} color="#000" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>

          {/* Tags */}
          {listing.tags.length > 0 && (
            <View style={styles.section}>
              <View style={styles.tags}>
                {listing.tags.map((tag) => (
                  <View key={tag.id} style={styles.tag}>
                    <Text style={styles.tagText}>{tag.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Reviews */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Reviews</Text>
              {reviews.length > 0 && (
                <TouchableOpacity>
                  <Text style={styles.seeAll}>See all</Text>
                </TouchableOpacity>
              )}
            </View>

            {reviews.length > 0 ? (
              reviews.slice(0, 3).map((review) => (
                <View key={review.id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    {review.user_image ? (
                      <Image source={{ uri: review.user_image }} style={styles.reviewAvatar} />
                    ) : (
                      <View style={styles.reviewAvatarPlaceholder}>
                        <Text style={styles.reviewInitial}>
                          {review.user_name.charAt(0)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.reviewInfo}>
                      <Text style={styles.reviewName}>{review.user_name}</Text>
                      {renderStars(review.rating)}
                    </View>
                    <Text style={styles.reviewDate}>
                      {new Date(review.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </Text>
                  </View>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noReviews}>No reviews yet</Text>
            )}
          </View>

          {/* Similar Products */}
          {similarListings.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Similar products</Text>
            </View>
          )}
        </View>

        {/* Similar Products List */}
        {similarListings.length > 0 && (
          <FlatList
            data={similarListings}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.similarList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.similarItem}
                onPress={() => handleSimilarPress(item.id)}
              >
                <Image
                  source={{ uri: item.primary_image?.thumbnail || item.primary_image?.image }}
                  style={styles.similarImage}
                  contentFit="cover"
                />
                <Text style={styles.similarTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.similarPrice}>
                  {item.currency} {parseInt(item.price).toLocaleString()}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <SafeAreaView edges={["bottom"]} style={styles.bottomBar}>
        <View style={styles.bottomContent}>
          {isContactOnly ? (
            <TouchableOpacity style={styles.contactBtn} onPress={handleContactMerchant}>
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={styles.contactBtnText}>Contact seller</Text>
            </TouchableOpacity>
          ) : canAddToCart ? (
            <>
              <View style={styles.bottomPrice}>
                <Text style={styles.bottomPriceLabel}>Total</Text>
                <Text style={styles.bottomPriceValue}>
                  {listing.currency}{" "}
                  {(parseInt(listing.price || "0") * quantity).toLocaleString()}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.addToCartBtn, addingToCart && styles.addToCartBtnDisabled]}
                onPress={handleAddToCart}
                disabled={addingToCart}
              >
                {addingToCart ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.addToCartText}>Add to cart</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.contactBtn} onPress={handleContactMerchant}>
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={styles.contactBtnText}>Contact seller</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centered: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#6B7280",
  },
  linkText: {
    fontSize: 16,
    color: "#000",
    marginTop: 12,
  },

  // Header
  headerSafe: {
    backgroundColor: "#fff",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Scroll
  scroll: {
    flex: 1,
  },

  // Image
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: "#F9FAFB",
  },
  noImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.7,
    backgroundColor: "#F9FAFB",
    justifyContent: "center",
    alignItems: "center",
  },
  pagination: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  paginationText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "500",
  },

  // Content
  content: {
    padding: 20,
  },

  // Title & Price
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    lineHeight: 28,
  },
  price: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginTop: 8,
  },
  negotiable: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },

  // Merchant
  merchantRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
  },
  merchantLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
  },
  merchantLogoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  merchantInitial: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
  },
  merchantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  merchantNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  merchantName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  merchantRating: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    color: "#6B7280",
  },

  // Quantity
  quantitySection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
  },
  quantityLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#000",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  quantityBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  quantityValue: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
    minWidth: 24,
    textAlign: "center",
  },

  // Section
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
  },
  seeAll: {
    fontSize: 14,
    color: "#6B7280",
  },

  // Description
  description: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
    marginTop: 8,
  },

  // Tags
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
  },
  tagText: {
    fontSize: 13,
    color: "#374151",
  },

  // Reviews
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
  },
  reviewAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewInitial: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  reviewInfo: {
    flex: 1,
    marginLeft: 10,
  },
  reviewName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  stars: {
    flexDirection: "row",
    gap: 2,
    marginTop: 2,
  },
  reviewDate: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  reviewComment: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginTop: 8,
  },
  noReviews: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
  },

  // Similar
  similarList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  similarItem: {
    width: 140,
  },
  similarImage: {
    width: 140,
    height: 140,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  similarTitle: {
    fontSize: 14,
    color: "#000",
    marginTop: 8,
    lineHeight: 18,
  },
  similarPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginTop: 4,
  },

  // Bottom Bar
  bottomBar: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  bottomContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 16,
  },
  bottomPrice: {
    flex: 1,
  },
  bottomPriceLabel: {
    fontSize: 13,
    color: "#6B7280",
  },
  bottomPriceValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  addToCartBtn: {
    backgroundColor: "#000",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  addToCartBtnDisabled: {
    opacity: 0.7,
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  contactBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  contactBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
