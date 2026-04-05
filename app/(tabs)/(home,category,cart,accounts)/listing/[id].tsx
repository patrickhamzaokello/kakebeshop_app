import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  Modal,
  Pressable,
  StatusBar,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  radius,
  shadow,
  spacingX,
  spacingY,
  fontSize,
  fontWeight,
  typography,
  components,
  scale,
  verticalScale,
  ThemeColors,
} from "@/constants/theme";
import { listingDetailsService } from "@/utils/services/listingDetailsService";
import { useCartStore } from "@/utils/stores/useCartStore";
import { useListingDetailStore } from "@/utils/stores/useListingDetailStore";
import { useAuthStore } from "@/utils/authStore";
import {
  CartCheckResponse,
  WishlistCheckResponse,
  SimilarListingItem,
} from "@/utils/types/models";
import { useTheme } from "@/contexts/ThemeContext";
import { ListingImage } from "@/components/test/common/ListingImage";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const IMAGE_HEIGHT = SCREEN_WIDTH * 0.95;
const CONTENT_OVERLAP = 24;
const HEADER_TRIGGER = IMAGE_HEIGHT - 80;

// ─── Image Lightbox ───────────────────────────────────────────────────────────

interface ImageLightboxProps {
  visible: boolean;
  images: { large?: { image: string }; thumb?: { image: string } }[];
  initialIndex: number;
  onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ visible, images, initialIndex, onClose }) => {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setCurrentIndex(initialIndex);
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      // Scroll to initial index after mount
      setTimeout(() => {
        scrollRef.current?.scrollTo({ x: initialIndex * SCREEN_WIDTH, animated: false });
      }, 50);
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, initialIndex]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[lightboxStyles.root, { opacity: fadeAnim }]}>
        {/* Close button */}
        <TouchableOpacity
          style={[lightboxStyles.closeBtn, { top: insets.top + 10 }]}
          onPress={onClose}
          activeOpacity={0.82}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Counter */}
        {images.length > 1 && (
          <View style={[lightboxStyles.counter, { top: insets.top + 14 }]}>
            <Text style={lightboxStyles.counterText}>
              {currentIndex + 1} / {images.length}
            </Text>
          </View>
        )}

        {/* Image pager */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setCurrentIndex(idx);
          }}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
        >
          {images.map((img, i) => (
            <View key={i} style={lightboxStyles.imageWrap}>
              <Image
                source={{ uri: img.large?.image || img.thumb?.image }}
                style={lightboxStyles.image}
                resizeMode="contain"
              />
            </View>
          ))}
        </ScrollView>

        {/* Dot indicators */}
        {images.length > 1 && (
          <View style={[lightboxStyles.dotsRow, { bottom: insets.bottom + 24 }]}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[
                  lightboxStyles.dot,
                  {
                    backgroundColor: i === currentIndex ? "#fff" : "rgba(255,255,255,0.35)",
                    width: i === currentIndex ? 20 : 7,
                  },
                ]}
              />
            ))}
          </View>
        )}
      </Animated.View>
    </Modal>
  );
};

const lightboxStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
  },
  closeBtn: {
    position: "absolute",
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  counter: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: "center",
  },
  counterText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "600",
  },
  imageWrap: {
    width: SCREEN_WIDTH,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  dotsRow: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  dot: {
    height: 7,
    borderRadius: 3.5,
  },
});

// ─── Shimmer ─────────────────────────────────────────────────────────────────

const ShimmerPlaceholder: React.FC<{ style?: any }> = ({ style }) => {
  const anim = useRef(new Animated.Value(0)).current;
  const { colors } = useTheme();

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  return <Animated.View style={[{ backgroundColor: colors.border, opacity }, style]} />;
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const ListingDetailsSkeleton = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <ShimmerPlaceholder style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }} />
      <View style={{ padding: 16, marginTop: -CONTENT_OVERLAP }}>
        <ShimmerPlaceholder style={{ height: 10, width: "40%", borderRadius: 6, marginBottom: 12 }} />
        <ShimmerPlaceholder style={{ height: 22, width: "85%", borderRadius: 6, marginBottom: 8 }} />
        <ShimmerPlaceholder style={{ height: 22, width: "65%", borderRadius: 6, marginBottom: 14 }} />
        <ShimmerPlaceholder style={{ height: 28, width: "50%", borderRadius: 6, marginBottom: 20 }} />
        <ShimmerPlaceholder style={{ height: 72, width: "100%", borderRadius: 12, marginBottom: 16 }} />
        <ShimmerPlaceholder style={{ height: 13, width: "100%", borderRadius: 6, marginBottom: 8 }} />
        <ShimmerPlaceholder style={{ height: 13, width: "90%", borderRadius: 6, marginBottom: 8 }} />
        <ShimmerPlaceholder style={{ height: 13, width: "75%", borderRadius: 6 }} />
      </View>
    </View>
  );
};

// ─── Similar listing card ──────────────────────────────────────────────────────

const SimilarListingCard: React.FC<{
  item: SimilarListingItem;
  onPress: () => void;
  showMerchant?: boolean;
}> = ({ item, onPress, showMerchant = false }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.similarCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <ListingImage
        primaryImage={item.primary_image?.image}
        style={styles.similarCardImage}
      />
      <View style={styles.similarCardContent}>
        <Text style={[styles.similarCardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.title}
        </Text>
        {showMerchant && (
          <Text style={[styles.similarCardMerchant, { color: colors.textMuted }]} numberOfLines={1}>
            {item.merchant.display_name}
          </Text>
        )}
        <Text style={[styles.similarCardPrice, { color: colors.primary }]}>
          {item.currency} {parseFloat(item.price).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function ListingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isLoggedIn } = useAuthStore();
  const { addToCart, fetchCart } = useCartStore();
  const { colors, isDark } = useTheme();

  const {
    fetchAllCacheableData,
    getCachedListing,
    getCachedSimilarMerchant,
    getCachedSimilarMarketplace,
  } = useListingDetailStore();

  const listing = getCachedListing(id ?? "");
  const similarMerchant = getCachedSimilarMerchant(id ?? "");
  const similarMarketplace = getCachedSimilarMarketplace(id ?? "");

  const [cartStatus, setCartStatus] = useState<CartCheckResponse | null>(null);
  const [wishlistStatus, setWishlistStatus] = useState<WishlistCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [headerShown, setHeaderShown] = useState(false);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const isCartAllowed = listing?.price_type === "FIXED";

  // Scroll animation
  const scrollY = useRef(new Animated.Value(0)).current;

  const floatOpacity = scrollY.interpolate({
    inputRange: [HEADER_TRIGGER - 40, HEADER_TRIGGER],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [HEADER_TRIGGER, HEADER_TRIGGER + 40],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      const should = value > HEADER_TRIGGER;
      setHeaderShown((prev) => (prev !== should ? should : prev));
    });
    return () => scrollY.removeListener(listener);
  }, []);

  // ── Data fetching ──

  const fetchAllData = useCallback(
    async (forceRefresh = false) => {
      if (!id) return;
      try {
        const cacheResult = await fetchAllCacheableData(id, forceRefresh);
        if (!cacheResult) {
          Alert.alert("Error", "Listing not found");
          router.back();
          return;
        }
        if (isLoggedIn) {
          const [cartResult, wishlistResult] = await Promise.all([
            listingDetailsService.checkCartStatus(id),
            listingDetailsService.checkWishlistStatus(id),
          ]);
          setCartStatus(cartResult);
          setWishlistStatus(wishlistResult);
          if (cartResult?.in_cart && cartResult?.quantity) {
            setQuantity(cartResult.quantity);
          }
        }
      } catch (error) {
        if (__DEV__) console.error("Error fetching listing details:", error);
        Alert.alert("Error", "Failed to load listing details");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, isLoggedIn, router, fetchAllCacheableData]
  );

  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllData(true);
  }, [fetchAllData]);

  // ── Actions ──

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
        Alert.alert("Added to cart", "Item added to your cart");
        await fetchCart();
      } else {
        Alert.alert("Error", "Failed to add item to cart");
      }
    } catch {
      Alert.alert("Error", "Failed to add item to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!isLoggedIn) {
      Alert.alert("Login Required", "Please login to save to wishlist", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push("/(auth)/login") },
      ]);
      return;
    }
    if (!id) return;
    setTogglingWishlist(true);
    try {
      if (wishlistStatus?.in_wishlist) {
        const ok = await listingDetailsService.RemoveListingFromWishlist(id);
        if (ok) setWishlistStatus({ in_wishlist: false });
      } else {
        const ok = await listingDetailsService.AddListingtoWishlist(id);
        if (ok) setWishlistStatus({ in_wishlist: true });
      }
    } catch {
      Alert.alert("Error", "Failed to update wishlist");
    } finally {
      setTogglingWishlist(false);
    }
  };

  const handleShare = async () => {
    if (!listing) return;
    try {
      await Share.share({
        title: listing.title,
        message: `Check out ${listing.title} on Kakebe Shop!\n\n${listing.currency} ${parseFloat(listing.price).toLocaleString()}`,
        url: `https://kakebeshop.com/listing/${id}`,
      });
    } catch (error) {
      if (__DEV__) console.error("Error sharing:", error);
    }
  };

  const handleSimilarListingPress = (listingId: string) => {
    router.push({ pathname: "/listing/[id]", params: { id: listingId } });
  };

  const handleMerchantPress = () => {
    if (listing?.merchant?.id) {
      router.push({ pathname: "/merchant/[id]", params: { id: listing.merchant.id } });
    }
  };

  const handleContactMerchant = () => setContactModalVisible(true);

  const handleCallMerchant = async () => {
    setContactModalVisible(false);
    Alert.alert(
      "Contact Merchant",
      `Would you like to call ${listing?.merchant.display_name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Call", onPress: () => Alert.alert("Info", "Merchant contact will be available soon.") },
      ]
    );
  };

  const handleMessageMerchant = () => {
    setContactModalVisible(false);
    Alert.alert(
      "Message Merchant",
      `Send a message to ${listing?.merchant.display_name}`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "WhatsApp", onPress: () => Alert.alert("Info", "WhatsApp contact will be available soon.") },
        { text: "In-App Message", onPress: () => Alert.alert("Info", "In-app messaging coming soon.") },
      ]
    );
  };

  // ── Price formatting ──

  const getDisplayPrice = () => {
    if (!listing) return "";
    switch (listing.price_type) {
      case "FIXED":
        return `${listing.currency} ${parseFloat(listing.price).toLocaleString()}`;
      case "RANGE":
        return `${listing.currency} ${parseFloat(listing.price_min || "0").toLocaleString()} – ${parseFloat(listing.price_max || "0").toLocaleString()}`;
      case "ON_REQUEST":
        return "Price on request";
      default:
        return listing.price ? `${listing.currency} ${parseFloat(listing.price).toLocaleString()}` : "Contact for price";
    }
  };

  // ── Render ──

  if (loading) return <ListingDetailsSkeleton />;

  if (!listing) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>Listing not found</Text>
        <TouchableOpacity
          style={[styles.errorButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.errorButtonText, { color: "#fff" }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = listing.images ?? [];
  const description = listing.description ?? "";
  const shortDesc = description.length > 220 ? description.slice(0, 220).trimEnd() + "…" : description;
  const inWishlist = !!wishlistStatus?.in_wishlist;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* ── Floating nav (fades out as sticky header appears) ── */}
      <Animated.View
        style={[styles.floatingNav, { top: insets.top + 6, opacity: floatOpacity }]}
        pointerEvents={headerShown ? "none" : "box-none"}
      >
        <TouchableOpacity style={styles.floatBtn} onPress={() => router.back()} activeOpacity={0.82}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={styles.floatRight}>
          <TouchableOpacity style={styles.floatBtn} onPress={handleShare} activeOpacity={0.82}>
            <Ionicons name="share-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.floatBtn}
            onPress={handleWishlistToggle}
            activeOpacity={0.82}
            disabled={togglingWishlist}
          >
            {togglingWishlist ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons
                name={inWishlist ? "heart" : "heart-outline"}
                size={20}
                color={inWishlist ? "#ff6b6b" : "#fff"}
              />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Sticky compact header (fades in after scroll) ── */}
      <Animated.View
        style={[styles.stickyHeader, { opacity: headerOpacity, backgroundColor: colors.surface, borderBottomColor: colors.border }]}
        pointerEvents={headerShown ? "box-none" : "none"}
      >
        <View style={[styles.stickyHeaderInner, { paddingTop: insets.top + 6 }]}>
          <TouchableOpacity
            style={[styles.stickyHeaderBtn, { backgroundColor: colors.backgroundSecondary }]}
            onPress={() => router.back()}
            activeOpacity={0.75}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <Text style={[styles.stickyTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {listing.title}
          </Text>

          <View style={styles.stickyActions}>
            <TouchableOpacity
              style={[styles.stickyHeaderBtn, { backgroundColor: colors.backgroundSecondary }]}
              onPress={handleShare}
              activeOpacity={0.75}
            >
              <Ionicons name="share-outline" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.stickyHeaderBtn, { backgroundColor: colors.backgroundSecondary }]}
              onPress={handleWishlistToggle}
              activeOpacity={0.75}
              disabled={togglingWishlist}
            >
              <Ionicons
                name={inWishlist ? "heart" : "heart-outline"}
                size={18}
                color={inWishlist ? "#E60549" : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* ── Scrollable content ── */}
      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            progressViewOffset={insets.top}
          />
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ── Image section (edge to edge, from top of screen) ── */}
        <View style={[styles.imageSection, { height: IMAGE_HEIGHT }]}>
          {images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setCurrentImageIndex(idx);
              }}
              scrollEventThrottle={16}
              style={{ flex: 1 }}
            >
              {images.map((img, i) => (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.95}
                  onPress={() => { setLightboxIndex(i); setLightboxVisible(true); }}
                >
                  <Image
                    source={{ uri: img.large?.image || img.thumb?.image }}
                    style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <ListingImage primaryImage="" style={{ width: SCREEN_WIDTH, height: IMAGE_HEIGHT }} />
          )}

          {/* Bottom gradient for readability */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.55)"]}
            style={styles.imageGradient}
            pointerEvents="none"
          />

          {/* Badges — top left, below floating nav */}
          <View style={[styles.badgeRow, { top: insets.top + 52 }]}>
            {listing.is_featured && (
              <View style={styles.featuredBadge}>
                <Ionicons name="star" size={10} color="#fff" />
                <Text style={styles.badgeText}>Featured</Text>
              </View>
            )}
            {listing.is_verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={10} color="#fff" />
                <Text style={styles.badgeText}>Verified</Text>
              </View>
            )}
          </View>

          {/* Dot indicators — bottom of image */}
          {images.length > 1 && (
            <View style={styles.dotsRow} pointerEvents="none">
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: i === currentImageIndex ? "#fff" : "rgba(255,255,255,0.45)",
                      width: i === currentImageIndex ? 18 : 6,
                    },
                  ]}
                />
              ))}
            </View>
          )}

          {/* Image counter text */}
          {images.length > 1 && (
            <View style={styles.imageCounter} pointerEvents="none">
              <Text style={styles.imageCounterText}>
                {currentImageIndex + 1} / {images.length}
              </Text>
            </View>
          )}
        </View>

        {/* ── Content card (overlaps image bottom) ── */}
        <View style={[styles.contentCard, { backgroundColor: colors.background, marginTop: -CONTENT_OVERLAP }]}>

          {/* Pull handle */}
          <View style={styles.handleRow}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          {/* Category + type chips */}
          <View style={styles.chipsRow}>
            {listing.category?.name && (
              <View style={[styles.chip, { backgroundColor: colors.backgroundSecondary }]}>
                <Text style={[styles.chipText, { color: colors.primary }]}>
                  {listing.category.name}
                </Text>
              </View>
            )}
            <View style={[styles.chip, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.chipText, { color: colors.textSecondary }]}>
                {listing.listing_type === "PRODUCT" ? "Product" : "Service"}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>{listing.title}</Text>

          {/* Price row */}
          <View style={styles.priceRow}>
            <Text
              style={[
                styles.price,
                listing.price_type === "ON_REQUEST"
                  ? { color: colors.textMuted, fontSize: 16, fontWeight: "500" }
                  : { color: colors.primary },
              ]}
            >
              {getDisplayPrice()}
            </Text>
            {listing.is_price_negotiable && listing.price_type !== "ON_REQUEST" && (
              <View style={[styles.negotiableBadge, { backgroundColor: "rgba(76,175,80,0.12)" }]}>
                <Text style={[styles.negotiableText, { color: "#4CAF50" }]}>Negotiable</Text>
              </View>
            )}
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.statText, { color: colors.textMuted }]}>
                {listing.views_count ?? 0} views
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="chatbubble-outline" size={13} color={colors.textMuted} />
              <Text style={[styles.statText, { color: colors.textMuted }]}>
                {listing.contact_count ?? 0} inquiries
              </Text>
            </View>
          </View>

          {/* ── Divider ── */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* ── Merchant card ── */}
          <TouchableOpacity
            style={[styles.merchantCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleMerchantPress}
            activeOpacity={0.75}
          >
            <View style={[styles.merchantAvatarWrap, { borderColor: colors.border }]}>
              {listing.merchant.logo ? (
                <Image source={{ uri: listing.merchant.logo }} style={styles.merchantAvatar} />
              ) : (
                <View style={[styles.merchantAvatarFallback, { backgroundColor: colors.backgroundSecondary }]}>
                  <Ionicons name="storefront-outline" size={20} color={colors.textMuted} />
                </View>
              )}
            </View>
            <View style={styles.merchantMeta}>
              <View style={styles.merchantNameRow}>
                <Text style={[styles.merchantName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {listing.merchant.display_name}
                </Text>
                {listing.merchant.verified && (
                  <Ionicons name="checkmark-circle" size={14} color="#4CAF50" style={{ marginLeft: 4 }} />
                )}
              </View>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color="#FFC107" />
                <Text style={[styles.ratingText, { color: colors.textMuted }]}>
                  {listing.merchant.rating.toFixed(1)}
                  {listing.merchant.total_reviews > 0 ? `  (${listing.merchant.total_reviews})` : ""}
                </Text>
              </View>
            </View>
            <View style={[styles.viewStoreBtn, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.viewStoreText, { color: colors.textSecondary }]}>View Store</Text>
              <Ionicons name="chevron-forward" size={13} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          {/* ── Divider ── */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* ── Description ── */}
          {description.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Description</Text>
              <Text style={[styles.descText, { color: colors.textSecondary }]}>
                {descExpanded ? description : shortDesc}
              </Text>
              {description.length > 220 && (
                <TouchableOpacity onPress={() => setDescExpanded(!descExpanded)} activeOpacity={0.7}>
                  <Text style={[styles.readMore, { color: colors.primary }]}>
                    {descExpanded ? "Show less" : "Read more"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ── Location ── */}
          {listing.location && (
            <View style={[styles.locationRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="location-outline" size={15} color={colors.textMuted} />
              <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
                {[listing.location.area, listing.location.district, listing.location.region]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
            </View>
          )}

          {/* ── Tags ── */}
          {listing.tags && listing.tags.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Tags</Text>
              <View style={styles.tagsWrap}>
                {listing.tags.map((tag) => (
                  <View key={tag.id} style={[styles.tag, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                    <Text style={[styles.tagText, { color: colors.textMuted }]}>#{tag.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── More from merchant ── */}
          {similarMerchant && similarMerchant.results.length > 0 && (
            <View style={styles.similarSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>
                  More from {listing.merchant.display_name}
                </Text>
                <TouchableOpacity onPress={handleMerchantPress} activeOpacity={0.7}>
                  <Text style={[styles.seeAll, { color: colors.primary }]}>View Store</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16 }}
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

          {/* ── You may also like ── */}
          {similarMarketplace && similarMarketplace.results.length > 0 && (
            <View style={styles.similarSection}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>You May Also Like</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 16 }}
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
        </View>
      </Animated.ScrollView>

      {/* ── Sticky footer CTA ── */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
          },
        ]}
      >
        {isCartAllowed ? (
          cartStatus?.in_cart ? (
            <View style={styles.footerRow}>
              <TouchableOpacity
                style={[styles.footerPrimaryBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/(tabs)/(cart)/cart")}
                activeOpacity={0.82}
              >
                <Ionicons name="cart" size={18} color="#fff" />
                <Text style={styles.footerPrimaryText}>View Cart</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.footerSecondaryBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                onPress={handleContactMerchant}
                activeOpacity={0.75}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.footerRow}>
              {/* Quantity selector */}
              <View style={[styles.qtySelector, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={16} color={quantity <= 1 ? colors.textMuted : colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.qtyText, { color: colors.textPrimary }]}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQuantity(quantity + 1)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={16} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.footerPrimaryBtn, { flex: 1, backgroundColor: colors.primary }]}
                onPress={handleAddToCart}
                disabled={addingToCart}
                activeOpacity={0.82}
              >
                {addingToCart ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="cart-outline" size={18} color="#fff" />
                    <Text style={styles.footerPrimaryText}>Add to Cart</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.footerSecondaryBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                onPress={handleContactMerchant}
                activeOpacity={0.75}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )
        ) : (
          <TouchableOpacity
            style={[styles.footerPrimaryBtn, { backgroundColor: colors.primary }]}
            onPress={handleContactMerchant}
            activeOpacity={0.82}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
            <Text style={styles.footerPrimaryText}>Contact Merchant</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Image lightbox ── */}
      <ImageLightbox
        visible={lightboxVisible}
        images={images}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxVisible(false)}
      />

      {/* ── Contact modal ── */}
      <Modal
        animationType="slide"
        transparent
        visible={contactModalVisible}
        onRequestClose={() => setContactModalVisible(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
          onPress={() => setContactModalVisible(false)}
        >
          <Pressable
            style={[styles.modalSheet, { backgroundColor: colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />

            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Contact Merchant</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Choose how to reach {listing.merchant.display_name}
            </Text>

            {[
              {
                icon: "call" as const,
                iconColor: "#4CAF50",
                bgColor: "rgba(76,175,80,0.12)",
                title: "Call",
                desc: "Speak directly with the merchant",
                onPress: handleCallMerchant,
              },
              {
                icon: "chatbubbles" as const,
                iconColor: colors.primary,
                bgColor: colors.backgroundSecondary,
                title: "Send Message",
                desc: "Send an inquiry about this listing",
                onPress: handleMessageMerchant,
              },
              {
                icon: "logo-whatsapp" as const,
                iconColor: "#25D366",
                bgColor: "rgba(37,211,102,0.12)",
                title: "WhatsApp",
                desc: "Chat on WhatsApp",
                onPress: () => {
                  setContactModalVisible(false);
                  Alert.alert("Info", "WhatsApp contact will be available soon.");
                },
              },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.title}
                style={[styles.contactOption, { borderBottomColor: colors.border }]}
                onPress={opt.onPress}
                activeOpacity={0.75}
              >
                <View style={[styles.contactOptIcon, { backgroundColor: opt.bgColor }]}>
                  <Ionicons name={opt.icon} size={22} color={opt.iconColor} />
                </View>
                <View style={styles.contactOptMeta}>
                  <Text style={[styles.contactOptTitle, { color: colors.textPrimary }]}>{opt.title}</Text>
                  <Text style={[styles.contactOptDesc, { color: colors.textMuted }]}>{opt.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setContactModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>

            <View style={{ height: insets.bottom > 0 ? insets.bottom : 8 }} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // Floating nav
  floatingNav: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  floatRight: {
    flexDirection: "row",
    gap: 8,
  },
  floatBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.38)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Sticky header
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stickyHeaderInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 10,
  },
  stickyHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  stickyTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  stickyActions: {
    flexDirection: "row",
    gap: 6,
  },

  // Image section
  imageSection: {
    width: SCREEN_WIDTH,
    overflow: "hidden",
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  badgeRow: {
    position: "absolute",
    left: 14,
    flexDirection: "row",
    gap: 6,
  },
  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E60549",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.2,
  },
  dotsRow: {
    position: "absolute",
    bottom: CONTENT_OVERLAP + 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  imageCounter: {
    position: "absolute",
    bottom: CONTENT_OVERLAP + 14,
    right: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  imageCounterText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },

  // Content card
  contentCard: {
    borderTopLeftRadius: CONTENT_OVERLAP,
    borderTopRightRadius: CONTENT_OVERLAP,
    paddingHorizontal: 16,
    paddingBottom: 8,
    minHeight: SCREEN_HEIGHT,
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 14,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },

  // Chips
  chipsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  // Title & price
  title: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  price: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  negotiableBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },
  negotiableText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },

  // Divider
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },

  // Merchant card
  merchantCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  merchantAvatarWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    overflow: "hidden",
  },
  merchantAvatar: {
    width: "100%",
    height: "100%",
  },
  merchantAvatarFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  merchantMeta: {
    flex: 1,
    gap: 3,
  },
  merchantNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  merchantName: {
    fontSize: 14,
    fontWeight: "600",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
  },
  viewStoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  viewStoreText: {
    fontSize: 11,
    fontWeight: "600",
  },

  // Sections
  section: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.1,
    marginBottom: 8,
  },
  descText: {
    fontSize: 14,
    lineHeight: 22,
  },
  readMore: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
  },
  locationText: {
    fontSize: 13,
    flex: 1,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tagText: {
    fontSize: 12,
  },

  // Similar sections
  similarSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: "600",
  },
  similarCard: {
    width: scale(140),
    marginRight: 10,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  similarCardImage: {
    width: "100%",
    height: verticalScale(130),
  },
  similarCardContent: {
    padding: 8,
    gap: 3,
  },
  similarCardTitle: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  similarCardMerchant: {
    fontSize: 11,
  },
  similarCardPrice: {
    fontSize: 12,
    fontWeight: "700",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  footerPrimaryBtn: {
    height: 50,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  footerPrimaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.2,
  },
  footerSecondaryBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  qtySelector: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 4,
    gap: 4,
    height: 50,
  },
  qtyBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  qtyText: {
    fontSize: 15,
    fontWeight: "600",
    minWidth: 24,
    textAlign: "center",
  },

  // Contact modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  contactOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  contactOptIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  contactOptMeta: {
    flex: 1,
    gap: 2,
  },
  contactOptTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  contactOptDesc: {
    fontSize: 12,
  },
  cancelBtn: {
    marginTop: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 16,
    marginBottom: 20,
  },
  errorButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
