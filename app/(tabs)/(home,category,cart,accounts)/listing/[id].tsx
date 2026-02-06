import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Share,
  Alert,
  Animated,
  Linking,
  Modal,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius, shadow, spacingX, spacingY } from "@/constants/theme";
import { listingDetailsService } from "@/utils/services/listingDetailsService";
import { useCartStore } from "@/utils/stores/useCartStore";
import { useAuthStore } from "@/utils/authStore";
import {
  ListingDetail,
  CartCheckResponse,
  WishlistCheckResponse,
  SimilarFromMerchantResponse,
  SimilarFromMarketplaceResponse,
  SimilarListingItem,
} from "@/utils/types/models";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_HEIGHT = SCREEN_WIDTH * 0.9;

// Shimmer Placeholder Component
const ShimmerPlaceholder: React.FC<{ style?: any }> = ({ style }) => {
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          backgroundColor: "#E0E0E0",
          opacity,
        },
        style,
      ]}
    />
  );
};

// Loading Skeleton Component
const ListingDetailsSkeleton = () => (
  <View style={styles.container}>
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      {/* Header skeleton */}
      <View style={styles.header}>
        <ShimmerPlaceholder style={{ width: 40, height: 40, borderRadius: 20 }} />
        <ShimmerPlaceholder style={{ width: 40, height: 40, borderRadius: 20 }} />
      </View>
    </SafeAreaView>

    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Image skeleton */}
      <ShimmerPlaceholder style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }} />

      <View style={styles.contentContainer}>
        {/* Title skeleton */}
        <ShimmerPlaceholder
          style={{ width: "80%", height: 24, borderRadius: 4, marginBottom: 8 }}
        />
        <ShimmerPlaceholder
          style={{ width: "60%", height: 24, borderRadius: 4, marginBottom: 16 }}
        />

        {/* Price skeleton */}
        <ShimmerPlaceholder
          style={{ width: "40%", height: 32, borderRadius: 4, marginBottom: 24 }}
        />

        {/* Seller card skeleton */}
        <View style={styles.sellerCard}>
          <ShimmerPlaceholder style={{ width: 50, height: 50, borderRadius: 25 }} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <ShimmerPlaceholder
              style={{ width: "70%", height: 16, borderRadius: 4, marginBottom: 8 }}
            />
            <ShimmerPlaceholder style={{ width: "50%", height: 12, borderRadius: 4 }} />
          </View>
        </View>

        {/* Description skeleton */}
        <ShimmerPlaceholder
          style={{ width: "100%", height: 80, borderRadius: 8, marginTop: 16 }}
        />
      </View>
    </ScrollView>
  </View>
);

// Similar Listing Card Component
const SimilarListingCard: React.FC<{
  item: SimilarListingItem;
  onPress: () => void;
  showMerchant?: boolean;
}> = ({ item, onPress, showMerchant = false }) => (
  <TouchableOpacity style={styles.similarCard} onPress={onPress} activeOpacity={0.7}>
    <Image
      source={
        item.primary_image?.image
          ? { uri: item.primary_image.image }
          : require("@/assets/images/placeholder.png")
      }
      style={styles.similarCardImage}
      resizeMode="cover"
    />
    <View style={styles.similarCardContent}>
      <Text style={styles.similarCardTitle} numberOfLines={2}>
        {item.title}
      </Text>
      {showMerchant && (
        <Text style={styles.similarCardMerchant} numberOfLines={1}>
          {item.merchant.display_name}
        </Text>
      )}
      <Text style={styles.similarCardPrice}>
        {item.currency} {parseFloat(item.price).toLocaleString()}
      </Text>
    </View>
  </TouchableOpacity>
);

// Main Component
export default function ListingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const { addToCart, fetchCart } = useCartStore();

  // State
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [cartStatus, setCartStatus] = useState<CartCheckResponse | null>(null);
  const [wishlistStatus, setWishlistStatus] = useState<WishlistCheckResponse | null>(null);
  const [similarMerchant, setSimilarMerchant] = useState<SimilarFromMerchantResponse | null>(
    null
  );
  const [similarMarketplace, setSimilarMarketplace] =
    useState<SimilarFromMarketplaceResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [contactModalVisible, setContactModalVisible] = useState(false);

  // Check if cart is allowed (only for FIXED price type)
  const isCartAllowed = listing?.price_type === "FIXED";

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    if (!id) return;

    try {
      // Fetch listing details first (required)
      const listingData = await listingDetailsService.getListingDetails(id);

      if (!listingData) {
        Alert.alert("Error", "Listing not found");
        router.back();
        return;
      }

      setListing(listingData);

      // Fetch additional data in parallel
      const promises: Promise<any>[] = [
        listingDetailsService.getSimilarFromMerchant(id, 6),
        listingDetailsService.getSimilarFromMarketplace(id, 12),
      ];

      // Only fetch cart/wishlist status if logged in
      if (isLoggedIn) {
        promises.push(
          listingDetailsService.checkCartStatus(id),
          listingDetailsService.checkWishlistStatus(id)
        );
      }

      const results = await Promise.all(promises);

      setSimilarMerchant(results[0]);
      setSimilarMarketplace(results[1]);

      if (isLoggedIn) {
        setCartStatus(results[2]);
        setWishlistStatus(results[3]);

        // Pre-fill quantity if item is already in cart
        if (results[2]?.in_cart && results[2]?.quantity) {
          setQuantity(results[2].quantity);
        }
      }
    } catch (error) {
      console.error("Error fetching listing details:", error);
      Alert.alert("Error", "Failed to load listing details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, isLoggedIn, router]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllData();
  }, [fetchAllData]);

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      Alert.alert("Login Required", "Please login to add items to cart", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push("/(auth)/login") },
      ]);
      return;
    }

    if (!id) return;

    setAddingToCart(true);
    try {
      const success = await addToCart(id, quantity);
      if (success) {
        setCartStatus({ in_cart: true, cart_item_id: null, quantity });
        Alert.alert("Success", "Item added to cart");
        await fetchCart();
      } else {
        Alert.alert("Error", "Failed to add item to cart");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to add item to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  // Handle wishlist toggle
  const handleWishlistToggle = async () => {
    if (!isLoggedIn) {
      Alert.alert("Login Required", "Please login to add items to wishlist", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push("/(auth)/login") },
      ]);
      return;
    }

    if (!id) return;

    setTogglingWishlist(true);
    try {
      if (wishlistStatus?.in_wishlist) {
        const success = await listingDetailsService.RemoveListingFromWishlist(id);
        if (success) {
          setWishlistStatus({ in_wishlist: false });
        }
      } else {
        const success = await listingDetailsService.AddListingtoWishlist(id);
        if (success) {
          setWishlistStatus({ in_wishlist: true });
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update wishlist");
    } finally {
      setTogglingWishlist(false);
    }
  };

  // Handle share
  const handleShare = async () => {
    if (!listing) return;

    try {
      await Share.share({
        title: listing.title,
        message: `Check out ${listing.title} on Kakebe Shop!\n\n${listing.currency} ${parseFloat(listing.price).toLocaleString()}`,
        url: `https://kakebeshop.com/listing/${id}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  // Handle similar listing press
  const handleSimilarListingPress = (listingId: string) => {
    router.push({
      pathname: "/listing/[id]",
      params: { id: listingId },
    });
  };

  // Handle merchant press
  const handleMerchantPress = () => {
    if (listing?.merchant?.id) {
      router.push({
        pathname: "/merchant/[id]",
        params: { id: listing.merchant.id },
      });
    }
  };

  // Format price based on price type
  const formatPrice = (price: string | null, currency: string) => {
    if (!price) return "";
    return `${currency} ${parseFloat(price).toLocaleString()}`;
  };

  // Get display price based on price type
  const getDisplayPrice = () => {
    if (!listing) return "";

    switch (listing.price_type) {
      case "FIXED":
        return formatPrice(listing.price, listing.currency);
      case "RANGE":
        const minPrice = listing.price_min
          ? parseFloat(listing.price_min).toLocaleString()
          : "0";
        const maxPrice = listing.price_max
          ? parseFloat(listing.price_max).toLocaleString()
          : "0";
        return `${listing.currency} ${minPrice} - ${maxPrice}`;
      case "ON_REQUEST":
        return "Contact for Price";
      default:
        return listing.price ? formatPrice(listing.price, listing.currency) : "Contact for Price";
    }
  };

  // Handle contact merchant
  const handleContactMerchant = () => {
    setContactModalVisible(true);
  };

  // Handle call merchant
  const handleCallMerchant = async () => {
    setContactModalVisible(false);

    // For now, we'll show an alert since we don't have the merchant phone in the current data
    // In a real implementation, you would get the phone from merchant details or a separate API call
    Alert.alert(
      "Contact Merchant",
      `Would you like to call ${listing?.merchant.display_name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call",
          onPress: () => {
            // If merchant has a phone number, use it
            // For demo, we'll show a placeholder
            Alert.alert("Info", "Merchant contact information will be available soon.");
            // Linking.openURL(`tel:+256700000000`);
          },
        },
      ]
    );
  };

  // Handle message merchant
  const handleMessageMerchant = () => {
    setContactModalVisible(false);

    // Navigate to a chat/message screen or show contact options
    Alert.alert(
      "Message Merchant",
      `Send a message to ${listing?.merchant.display_name} about "${listing?.title}"`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "WhatsApp",
          onPress: () => {
            // For demo - in production, get actual phone
            const message = encodeURIComponent(
              `Hi, I'm interested in your listing: ${listing?.title}`
            );
            // Linking.openURL(`https://wa.me/256700000000?text=${message}`);
            Alert.alert("Info", "WhatsApp contact will be available soon.");
          },
        },
        {
          text: "In-App Message",
          onPress: () => {
            // Navigate to in-app messaging
            Alert.alert("Info", "In-app messaging coming soon.");
          },
        },
      ]
    );
  };

  // Get images array
  const getImages = () => {
    if (!listing?.images || listing.images.length === 0) {
      return [];
    }
    return listing.images;
  };

  if (loading) {
    return <ListingDetailsSkeleton />;
  }

  if (!listing) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.gray400} />
        <Text style={styles.errorText}>Listing not found</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => router.back()}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = getImages();

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.black} />
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={24} color={colors.black} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleWishlistToggle}
              activeOpacity={0.7}
              disabled={togglingWishlist}
            >
              {togglingWishlist ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons
                  name={wishlistStatus?.in_wishlist ? "heart" : "heart-outline"}
                  size={24}
                  color={wishlistStatus?.in_wishlist ? colors.primary : colors.black}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          {images.length > 0 ? (
            <>
              {/* Main Large Image */}
              <Image
                source={{ uri: images[currentImageIndex]?.large?.image || images[currentImageIndex]?.thumb?.image }}
                style={styles.mainImage}
                resizeMode="cover"
              />

              {/* Thumbnail Selector */}
              {images.length > 1 && (
                <View style={styles.thumbnailContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.thumbnailScrollContent}
                  >
                    {images.map((image, index) => (
                      <TouchableOpacity
                        key={`thumb-${index}`}
                        style={[
                          styles.thumbnailWrapper,
                          index === currentImageIndex && styles.thumbnailWrapperActive,
                        ]}
                        onPress={() => setCurrentImageIndex(index)}
                        activeOpacity={0.7}
                      >
                        <Image
                          source={{ uri: image.thumb?.image }}
                          style={styles.thumbnailImage}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </>
          ) : (
            <Image
              source={require("@/assets/images/placeholder.png")}
              style={styles.mainImage}
              resizeMode="cover"
            />
          )}

          {/* Badges */}
          <View style={styles.badgesContainer}>
            {listing.is_featured && (
              <View style={[styles.badge, styles.featuredBadge]}>
                <Ionicons name="star" size={12} color={colors.white} />
                <Text style={styles.badgeText}>Featured</Text>
              </View>
            )}
            {listing.is_verified && (
              <View style={[styles.badge, styles.verifiedBadge]}>
                <Ionicons name="checkmark-circle" size={12} color={colors.white} />
                <Text style={styles.badgeText}>Verified</Text>
              </View>
            )}
          </View>

          {/* Image Counter */}
          {images.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {currentImageIndex + 1} / {images.length}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.contentContainer}>
          {/* Category & Type */}
          <View style={styles.metaRow}>
            <View style={styles.categoryChip}>
              <Text style={styles.categoryText}>{listing.category?.name || "General"}</Text>
            </View>
            <View style={styles.typeChip}>
              <Text style={styles.typeText}>
                {listing.listing_type === "PRODUCT" ? "Product" : "Service"}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>{listing.title}</Text>

          {/* Price Section */}
          <View style={styles.priceSection}>
            <Text style={[styles.price, listing.price_type !== "FIXED" && styles.priceRange]}>
              {getDisplayPrice()}
            </Text>
            {listing.is_price_negotiable && (
              <View style={styles.negotiableBadge}>
                <Text style={styles.negotiableText}>Negotiable</Text>
              </View>
            )}
            {listing.price_type === "RANGE" && (
              <View style={styles.rangeBadge}>
                <Text style={styles.rangeText}>Price Range</Text>
              </View>
            )}
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={16} color={colors.gray600} />
              <Text style={styles.statText}>{listing.views_count} views</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="chatbubble-outline" size={16} color={colors.gray600} />
              <Text style={styles.statText}>{listing.contact_count} inquiries</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Seller Card */}
          <TouchableOpacity
            style={styles.sellerCard}
            onPress={handleMerchantPress}
            activeOpacity={0.7}
          >
            <View style={styles.sellerAvatar}>
              {listing.merchant.logo ? (
                <Image
                  source={{ uri: listing.merchant.logo }}
                  style={styles.sellerAvatarImage}
                />
              ) : (
                <View style={styles.sellerAvatarPlaceholder}>
                  <Ionicons name="storefront" size={24} color={colors.gray500} />
                </View>
              )}
            </View>

            <View style={styles.sellerInfo}>
              <View style={styles.sellerNameRow}>
                <Text style={styles.sellerName}>{listing.merchant.display_name}</Text>
                {listing.merchant.verified && (
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={colors.verified}
                    style={{ marginLeft: 4 }}
                  />
                )}
              </View>

              <View style={styles.sellerStats}>
                <Ionicons name="star" size={14} color={colors.star} />
                <Text style={styles.sellerRating}>
                  {listing.merchant.rating.toFixed(1)} ({listing.merchant.total_reviews}{" "}
                  reviews)
                </Text>
              </View>
            </View>

            <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Description */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>

          {/* Tags */}
          {listing.tags && listing.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {listing.tags.map((tag) => (
                  <View key={tag.id} style={styles.tag}>
                    <Text style={styles.tagText}>{tag.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Similar from Merchant */}
          {similarMerchant && similarMerchant.results.length > 0 && (
            <View style={styles.similarSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  More from {listing.merchant.display_name}
                </Text>
                <TouchableOpacity onPress={handleMerchantPress}>
                  <Text style={styles.seeAllText}>View Store</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.similarScrollContent}
              >
                {similarMerchant.results.map((item) => (
                  <SimilarListingCard
                    key={item.id}
                    item={item}
                    onPress={() => handleSimilarListingPress(item.id)}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Similar from Marketplace */}
          {similarMarketplace && similarMarketplace.results.length > 0 && (
            <View style={styles.similarSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>You May Also Like</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.similarScrollContent}
              >
                {similarMarketplace.results.map((item) => (
                  <SimilarListingCard
                    key={item.id}
                    item={item}
                    onPress={() => handleSimilarListingPress(item.id)}
                    showMerchant
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Bottom spacing for sticky bar */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <SafeAreaView edges={["bottom"]} style={styles.bottomBarSafeArea}>
  <View style={styles.bottomBar}>
    {/* Price Section - Now takes more space */}
    <View style={styles.priceSection}>
      <Text style={styles.priceLabel}>
        {listing.price_type === "RANGE" ? "Price Range" : 
         listing.price_type === "ON_REQUEST" ? "Pricing" : "Price"}
      </Text>
      <Text style={styles.priceValue} numberOfLines={1}>
        {getDisplayPrice()}
      </Text>
      {listing.is_price_negotiable && listing.price_type === "FIXED" && (
        <Text style={styles.negotiableTag}>Negotiable</Text>
      )}
    </View>

    {/* Action Section */}
    <View style={styles.actionSection}>
      {isCartAllowed ? (
        <>
          {/* If item is already in cart */}
          {cartStatus?.in_cart ? (
            <View style={styles.cartActionsRow}>
              <TouchableOpacity
                style={styles.viewCartButton}
                onPress={() => router.push("/(tabs)/(cart)/cart")}
                activeOpacity={0.8}
              >
                <Ionicons name="cart" size={20} color={colors.white} />
                <Text style={styles.viewCartText}>View Cart</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.contactIconButton}
                onPress={handleContactMerchant}
                activeOpacity={0.7}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            /* Item not in cart - show quantity selector and add to cart */
            <View style={styles.cartActionsRow}>
              <View style={styles.quantitySelector}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="remove"
                    size={18}
                    color={quantity <= 1 ? colors.neutral400 : colors.black}
                  />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(quantity + 1)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={18} color={colors.black} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.addToCartButton}
                onPress={handleAddToCart}
                disabled={addingToCart}
                activeOpacity={0.8}
              >
                {addingToCart ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Ionicons name="cart-outline" size={20} color={colors.white} />
                    <Text style={styles.addToCartText}>Add to Cart</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.contactIconButton}
                onPress={handleContactMerchant}
                activeOpacity={0.7}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </>
      ) : (
        /* For RANGE or ON_REQUEST - show only contact button */
        <TouchableOpacity
          style={styles.contactMerchantButtonFull}
          onPress={handleContactMerchant}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble-ellipses" size={20} color={colors.white} />
          <Text style={styles.contactMerchantText}>Contact Merchant</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
</SafeAreaView>

      {/* Contact Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={contactModalVisible}
        onRequestClose={() => setContactModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setContactModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>Contact Merchant</Text>
            <Text style={styles.modalSubtitle}>
              Choose how you'd like to reach {listing.merchant.display_name}
            </Text>

            {/* Call Option */}
            <TouchableOpacity
              style={styles.contactOption}
              onPress={handleCallMerchant}
              activeOpacity={0.7}
            >
              <View style={[styles.contactOptionIcon, { backgroundColor: colors.successLight }]}>
                <Ionicons name="call" size={24} color={colors.success} />
              </View>
              <View style={styles.contactOptionInfo}>
                <Text style={styles.contactOptionTitle}>Call</Text>
                <Text style={styles.contactOptionDescription}>
                  Speak directly with the merchant
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
            </TouchableOpacity>

            {/* Message Option */}
            <TouchableOpacity
              style={styles.contactOption}
              onPress={handleMessageMerchant}
              activeOpacity={0.7}
            >
              <View style={[styles.contactOptionIcon, { backgroundColor: colors.infoLight }]}>
                <Ionicons name="chatbubbles" size={24} color={colors.info} />
              </View>
              <View style={styles.contactOptionInfo}>
                <Text style={styles.contactOptionTitle}>Send Message</Text>
                <Text style={styles.contactOptionDescription}>
                  Send an inquiry about this listing
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
            </TouchableOpacity>

            {/* WhatsApp Option */}
            <TouchableOpacity
              style={styles.contactOption}
              onPress={() => {
                setContactModalVisible(false);
                const message = encodeURIComponent(
                  `Hi, I'm interested in your listing: ${listing.title}`
                );
                Alert.alert("Info", "WhatsApp contact will be available soon.");
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.contactOptionIcon, { backgroundColor: "#E7F5E9" }]}>
                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              </View>
              <View style={styles.contactOptionInfo}>
                <Text style={styles.contactOptionTitle}>WhatsApp</Text>
                <Text style={styles.contactOptionDescription}>
                  Chat on WhatsApp
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setContactModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  safeArea: {
    backgroundColor: colors.white,
    zIndex: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    ...shadow.sm,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  imageContainer: {
    position: "relative",
    backgroundColor: colors.gray100,
  },
  mainImage: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
  },
  thumbnailContainer: {
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  thumbnailScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  thumbnailWrapper: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  thumbnailWrapperActive: {
    borderColor: colors.primary,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  imageCounter: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  badgesContainer: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  featuredBadge: {
    backgroundColor: colors.star,
  },
  verifiedBadge: {
    backgroundColor: colors.verified,
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  contentContainer: {
    padding: 16,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  typeChip: {
    backgroundColor: colors.gray100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeText: {
    color: colors.gray700,
    fontSize: 12,
    fontWeight: "500",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  priceSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  price: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.primary,
  },
  priceRange: {
    fontSize: 22,
  },
  rangeBadge: {
    backgroundColor: colors.infoLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  rangeText: {
    color: colors.info,
    fontSize: 12,
    fontWeight: "600",
  },
  negotiableBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  negotiableText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: colors.gray600,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: 16,
  },
  sellerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray50,
    padding: 12,
    borderRadius: 12,
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
  },
  sellerAvatarImage: {
    width: "100%",
    height: "100%",
  },
  sellerAvatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.gray200,
    justifyContent: "center",
    alignItems: "center",
  },
  sellerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sellerNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sellerName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  sellerStats: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  sellerRating: {
    fontSize: 14,
    color: colors.gray600,
  },
  descriptionSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  tagsSection: {
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: colors.gray100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 13,
    color: colors.gray700,
  },
  similarSection: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  similarScrollContent: {
    paddingRight: 16,
  },
  similarCard: {
    width: 140,
    marginRight: 12,
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray200,
    overflow: "hidden",
  },
  similarCardImage: {
    width: "100%",
    height: 140,
  },
  similarCardContent: {
    padding: 8,
  },
  similarCardTitle: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  similarCardMerchant: {
    fontSize: 11,
    color: colors.gray500,
    marginBottom: 4,
  },
  similarCardPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  
  bottomBarSafeArea: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.neutral100,
  },
  bottomBar: {
    flexDirection: "column",
    backgroundColor: colors.white,
    paddingHorizontal: spacingX._16,
    paddingTop: spacingY._12,
    paddingBottom: spacingY._8,
    gap: 12,
  },

  // Price Section - Now more spacious
  priceSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  priceLabel: {
    fontSize: 13,
    color: colors.neutral600,
    fontWeight: "500",
  },
  priceValue: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: colors.black,
  },
  negotiableTag: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "600",
    backgroundColor: colors.primary + "15",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },

  // Action Section
  actionSection: {
    width: "100%",
  },
  cartActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // Quantity Selector - Compact design
  quantitySelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.neutral100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral200,
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderRadius: 6,
  },
  quantityText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.black,
    minWidth: 24,
    textAlign: "center",
  },

  // Add to Cart Button - Takes remaining space
  addToCartButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  addToCartText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.white,
  },

  // View Cart Button (when item already in cart)
  viewCartButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  viewCartText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.white,
  },

  // Contact Icon Button
  contactIconButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.neutral50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral200,
  },

  // Contact Merchant Button (full width for non-cart items)
  contactMerchantButtonFull: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  contactMerchantText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.white,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray300,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.gray600,
    marginBottom: 20,
  },
  contactOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  contactOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  contactOptionInfo: {
    flex: 1,
    marginLeft: 14,
  },
  contactOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  contactOptionDescription: {
    fontSize: 13,
    color: colors.gray500,
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.gray600,
  },
});
