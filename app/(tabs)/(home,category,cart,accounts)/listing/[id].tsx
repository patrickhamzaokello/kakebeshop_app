import { ListingImage } from "@/components/test/common/ListingImage";
import { Text } from "@/components/Text";
import {
  colors,
  scale,
  verticalScale
} from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import apiService from "@/utils/apiBase";
import { incrementListingViews } from "@/utils/apiEndpoints";
import { useAuthStore } from "@/utils/authStore";
import { ListingComment, listingDetailsService } from "@/utils/services/listingDetailsService";
import { useCartStore } from "@/utils/stores/useCartStore";
import { useListingDetailStore } from "@/utils/stores/useListingDetailStore";
import {
  CartCheckResponse,
  SimilarListingItem,
  WishlistCheckResponse,
} from "@/utils/types/models";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Animated, Dimensions, FlatList, Image, KeyboardAvoidingView, Linking, Modal, NativeScrollEvent, NativeSyntheticEvent, PanResponder, Platform, Pressable, RefreshControl, ScrollView, Share, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const IMAGE_HEIGHT = SCREEN_WIDTH * 0.95;
const CONTENT_OVERLAP = 24;
const HEADER_TRIGGER = IMAGE_HEIGHT - 80;
const COMMENTS_SHEET_HEIGHT = SCREEN_HEIGHT * 0.78;
const COMMENT_EMOJIS = ["👍", "❤️", "😂", "😞", "🔥"];

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
        primaryImage={item.primary_image ?? null}
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
  const { isLoggedIn, user } = useAuthStore();
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
  const [merchantPhone, setMerchantPhone] = useState<string | null>(null);
  const [fetchingPhone, setFetchingPhone] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [headerShown, setHeaderShown] = useState(false);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Comments
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [comments, setComments] = useState<ListingComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentInputVisible, setCommentInputVisible] = useState(false);
  const commentInputRef = useRef<TextInput>(null);
  const [commentCount, setCommentCount] = useState<number | null>(null);
  const [commentPage, setCommentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; user_name: string } | null>(null);
  const [editingComment, setEditingComment] = useState<{ id: string; body: string } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [repliesMap, setRepliesMap] = useState<Record<string, ListingComment[]>>({});
  const [loadingRepliesFor, setLoadingRepliesFor] = useState<string | null>(null);
  const commentsAnim = useRef(new Animated.Value(COMMENTS_SHEET_HEIGHT)).current;
  const commentsBackdropOpacity = useMemo(
    () => commentsAnim.interpolate({
      inputRange: [0, COMMENTS_SHEET_HEIGHT],
      outputRange: [0.5, 0],
      extrapolate: "clamp",
    }),
    []
  );
  const commentsPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, { dy, dx }) =>
        dy > 8 && Math.abs(dy) > Math.abs(dx) * 1.5,
      onPanResponderMove: (_, { dy }) => {
        if (dy > 0) commentsAnim.setValue(dy);
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (dy > COMMENTS_SHEET_HEIGHT * 0.3 || vy > 0.8) {
          setCommentInputVisible(false);
          setReplyingTo(null);
          setEditingComment(null);
          setCommentText("");
          Animated.timing(commentsAnim, {
            toValue: COMMENTS_SHEET_HEIGHT,
            duration: 260,
            useNativeDriver: true,
          }).start(() => setCommentsVisible(false));
        } else {
          Animated.spring(commentsAnim, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

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
        const [cartResult, wishlistResult, countResult] = await Promise.all([
          isLoggedIn ? listingDetailsService.checkCartStatus(id) : Promise.resolve(null),
          isLoggedIn ? listingDetailsService.checkWishlistStatus(id) : Promise.resolve(null),
          listingDetailsService.getCommentCount(id),
        ]);
        if (isLoggedIn) {
          setCartStatus(cartResult);
          setWishlistStatus(wishlistResult);
          if (cartResult?.in_cart && cartResult?.quantity) {
            setQuantity(cartResult.quantity);
          }
        }
        if (countResult != null) setCommentCount(countResult);
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
    if (id) incrementListingViews(id);
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
    const shareUrl = listing.share_url ?? `https://kakebeshop.com/listing/${id}`;
    const priceText =
      listing.price_type === "FIXED"
        ? `${listing.currency} ${parseFloat(listing.price).toLocaleString()}`
        : listing.price_type === "RANGE"
        ? `${listing.currency} ${parseFloat(listing.price_min).toLocaleString()} – ${parseFloat(listing.price_max).toLocaleString()}`
        : "Price negotiable";
    try {
      // Always embed the URL in `message`. The separate `url` field causes most
      // iOS share targets (WhatsApp, iMessage, etc.) to drop the message text
      // and only send the URL. Putting everything in `message` is the only way
      // to guarantee both the description and link arrive together regardless of
      // the target app or whether the user taps "Copy".
      await Share.share({
        title: listing.title,
        message: `Check out "${listing.title}" on Kakebe Shop!\n\n${priceText}\n\n${shareUrl}`,
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

  const handleContactMerchant = async () => {
    setContactModalVisible(true);
    if (!merchantPhone && listing?.merchant?.id && !fetchingPhone) {
      setFetchingPhone(true);
      try {
        const response = await apiService.get<{ business_phone?: string }>(
          `/api/v1/merchants/${listing.merchant.id}/`
        );
        if (response.success && response.data?.business_phone) {
          setMerchantPhone(response.data.business_phone);
        }
      } catch {
        // phone will stay null — handled gracefully in handlers
      } finally {
        setFetchingPhone(false);
      }
    }
  };

  const handleCallMerchant = async () => {
    setContactModalVisible(false);
    const phone = merchantPhone;
    if (!phone) {
      Alert.alert("Unavailable", "Merchant phone number is not available.");
      return;
    }
    const url = `tel:${phone}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    } else {
      Alert.alert("Unavailable", "Phone calls are not supported on this device.");
    }
  };

  const handleMessageMerchant = () => {
    setContactModalVisible(false);
    Alert.alert("Coming Soon", "In-app messaging will be available soon.");
  };

  const handleWhatsAppMerchant = async () => {
    setContactModalVisible(false);
    const phone = merchantPhone;
    if (!phone) {
      Alert.alert("Unavailable", "Merchant WhatsApp number is not available.");
      return;
    }
    // Strip non-digit characters, ensure international format
    const cleaned = phone.replace(/\D/g, "");
    const url = `whatsapp://send?phone=${cleaned}&text=${encodeURIComponent("Hi, I'm interested in your listing on Kakebe Shop.")}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      Linking.openURL(url);
    } else {
      // Fallback to wa.me link (opens in browser/app)
      Linking.openURL(`https://wa.me/${cleaned}?text=${encodeURIComponent("Hi, I'm interested in your listing on Kakebe Shop.")}`);
    }
  };

  // ── Comments ──

  const loadComments = async (page = 1, append = false) => {
    if (!id) return;
    if (page === 1) setCommentsLoading(true);
    else setLoadingMoreComments(true);
    const result = await listingDetailsService.getComments(id, page);
    if (result) {
      setComments((prev) => append ? [...prev, ...result.results] : result.results);
      setHasMoreComments(!!result.next);
      setCommentPage(page);
      if (page === 1) setCommentCount(result.count);
    }
    setCommentsLoading(false);
    setLoadingMoreComments(false);
  };

  const loadMoreComments = () => {
    if (hasMoreComments && !loadingMoreComments && !commentsLoading) {
      loadComments(commentPage + 1, true);
    }
  };

  const handleLoadReplies = async (commentId: string) => {
    if (expandedReplies[commentId]) {
      setExpandedReplies((prev) => ({ ...prev, [commentId]: false }));
      return;
    }
    if (repliesMap[commentId]) {
      setExpandedReplies((prev) => ({ ...prev, [commentId]: true }));
      return;
    }
    setLoadingRepliesFor(commentId);
    const result = await listingDetailsService.getCommentReplies(commentId);
    if (result) {
      setRepliesMap((prev) => ({ ...prev, [commentId]: result.results }));
      setExpandedReplies((prev) => ({ ...prev, [commentId]: true }));
    }
    setLoadingRepliesFor(null);
  };

  const handleDeleteComment = (commentId: string, isReply: boolean, parentId?: string) => {
    Alert.alert("Delete Comment", "Delete this comment?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const ok = await listingDetailsService.deleteComment(commentId);
          if (ok) {
            if (isReply && parentId) {
              setRepliesMap((prev) => ({
                ...prev,
                [parentId]: (prev[parentId] ?? []).filter((r) => r.id !== commentId),
              }));
              setComments((prev) =>
                prev.map((c) =>
                  c.id === parentId
                    ? { ...c, reply_count: Math.max(0, (c.reply_count ?? 0) - 1) }
                    : c
                )
              );
            } else {
              setComments((prev) => prev.filter((c) => c.id !== commentId));
              setCommentCount((prev) => Math.max(0, (prev ?? 0) - 1));
            }
          } else {
            Alert.alert("Error", "Failed to delete comment.");
          }
        },
      },
    ]);
  };

  const handleCommentActions = (
    comment: ListingComment,
    isReply: boolean,
    parentId?: string
  ) => {
    Alert.alert("Comment", undefined, [
      {
        text: "Edit",
        onPress: () =>
          openCommentInput(undefined, { id: comment.id, body: comment.body }),
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => handleDeleteComment(comment.id, isReply, parentId),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const closeCommentInput = () => {
    commentInputRef.current?.blur();
    setCommentInputVisible(false);
    setReplyingTo(null);
    setEditingComment(null);
    setCommentText("");
  };

  const openCommentInput = (
    replyTo?: { id: string; user_name: string },
    editComment?: { id: string; body: string }
  ) => {
    if (replyTo) setReplyingTo(replyTo);
    if (editComment) {
      setEditingComment(editComment);
      setCommentText(editComment.body);
    }
    setCommentInputVisible(true);
  };

  const closeCommentsSheet = () => {
    closeCommentInput();
    Animated.timing(commentsAnim, {
      toValue: COMMENTS_SHEET_HEIGHT,
      duration: 260,
      useNativeDriver: true,
    }).start(() => setCommentsVisible(false));
  };

  const handleOpenComments = (focusInput = false) => {
    setReplyingTo(null);
    setEditingComment(null);
    setCommentText("");
    setCommentInputVisible(false);
    if (!commentsVisible) loadComments(1);
    setCommentsVisible(true);
    commentsAnim.setValue(COMMENTS_SHEET_HEIGHT);
    Animated.spring(commentsAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 250,
      mass: 0.8,
    }).start(() => {
      if (focusInput) openCommentInput();
    });
  };

  const handleSubmitComment = async () => {
    if (!isLoggedIn) {
      Alert.alert("Login Required", "Please login to comment", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Login",
          onPress: () => {
            closeCommentsSheet();
            router.push("/(auth)/login");
          },
        },
      ]);
      return;
    }
    const text = commentText.trim();
    if (!text || !id) return;
    setSubmittingComment(true);

    if (editingComment) {
      const updated = await listingDetailsService.editComment(editingComment.id, text);
      if (updated) {
        setComments((prev) =>
          prev.map((c) => (c.id === editingComment.id ? { ...c, body: updated.body } : c))
        );
        setRepliesMap((prev) => {
          const next = { ...prev };
          for (const key in next) {
            next[key] = next[key].map((r) =>
              r.id === editingComment.id ? { ...r, body: updated.body } : r
            );
          }
          return next;
        });
        closeCommentInput();
      } else {
        Alert.alert("Error", "Failed to update comment.");
      }
    } else {
      const newComment = await listingDetailsService.postComment(id, text, replyingTo?.id);
      if (newComment) {
        if (replyingTo) {
          setRepliesMap((prev) => ({
            ...prev,
            [replyingTo.id]: [...(prev[replyingTo.id] ?? []), newComment],
          }));
          setExpandedReplies((prev) => ({ ...prev, [replyingTo.id]: true }));
          setComments((prev) =>
            prev.map((c) =>
              c.id === replyingTo.id
                ? { ...c, reply_count: (c.reply_count ?? 0) + 1 }
                : c
            )
          );
        } else {
          setComments((prev) => [newComment, ...prev]);
          setCommentCount((prev) => (prev ?? 0) + 1);
        }
        closeCommentInput();
      } else {
        Alert.alert("Error", "Failed to post comment. Please try again.");
      }
    }
    setSubmittingComment(false);
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

          {/* ── Comments entry point ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.commentCountRow}>
                <Ionicons name="chatbubble-outline" size={15} color={colors.textPrimary} />
                <Text style={[styles.sectionLabel, { color: colors.textPrimary, marginBottom: 0 }]}>
                  {commentCount != null ? `${commentCount} ${commentCount === 1 ? "Comment" : "Comments"}` : "Comments"}
                </Text>
              </View>
              {(commentCount ?? 0) > 0 && (
                <TouchableOpacity onPress={() => handleOpenComments(false)} activeOpacity={0.7}>
                  <Text style={[styles.seeAll, { color: colors.primary }]}>View all</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[styles.commentTrigger, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
              onPress={() => handleOpenComments(true)}
              activeOpacity={0.75}
            >
                <View style={[styles.commentTriggerAvatar, styles.commentAvatarFallback, { backgroundColor: colors.border }]}>
                  <Ionicons name="person-outline" size={15} color={colors.textMuted} />
                </View>
              <Text style={[styles.commentTriggerText, { color: colors.textMuted }]}>
                {(commentCount ?? 0) > 0 ? "Add a comment…" : "Be the first to comment…"}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

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

      {/* ── Comments bottom sheet (Modal so it covers the tab bar) ── */}
      <Modal
        visible={commentsVisible}
        transparent
        animationType="none"
        onRequestClose={closeCommentsSheet}
        statusBarTranslucent
      >
        {/* Backdrop */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: "#000", opacity: commentsBackdropOpacity }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeCommentsSheet} />
        </Animated.View>

        {/* Sheet */}
        <Animated.View
          style={[styles.commentsSheet, { backgroundColor: colors.surface, transform: [{ translateY: commentsAnim }] }]}
        >
          {/* Drag handle */}
          <View {...commentsPanResponder.panHandlers} style={styles.commentsHandleArea}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header */}
          <View style={[styles.commentsHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {commentCount != null ? `Comments (${commentCount})` : "Comments"}
            </Text>
            <TouchableOpacity
              onPress={closeCommentsSheet}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Comment list */}
          {commentsLoading ? (
            <View style={styles.commentsCenter}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[
                styles.commentsList,
                comments.length === 0 && styles.commentsListEmpty,
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onEndReached={loadMoreComments}
              onEndReachedThreshold={0.3}
              ListEmptyComponent={
                <View style={styles.commentsCenter}>
                  <Ionicons name="chatbubble-outline" size={44} color={colors.border} />
                  <Text style={[styles.commentsEmptyText, { color: colors.textMuted }]}>
                    No comments yet.{"\n"}Be the first to comment!
                  </Text>
                </View>
              }
              ListFooterComponent={
                loadingMoreComments ? (
                  <View style={{ paddingVertical: 12, alignItems: "center" }}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : null
              }
              renderItem={({ item }) => (
                <View>
                  {/* Comment row */}
                  <View style={styles.commentItem}>
                    <View style={[styles.commentAvatar, styles.commentAvatarFallback, { backgroundColor: colors.backgroundSecondary }]}>
                      <Text style={[styles.commentAvatarInitial, { color: colors.textMuted }]}>
                        {(item.user_name || "?")[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.commentBubble}>
                      <Text style={[styles.commentUsername, { color: colors.textSecondary }]} numberOfLines={1}>
                        {item.user_name}
                      </Text>
                      <Text style={[styles.commentContent, { color: colors.textPrimary }]}>
                        {item.body}
                      </Text>
                      <View style={styles.commentActionsRow}>
                        <View style={styles.commentActionsLeft}>
                          <Text style={[styles.commentDate, { color: colors.textMuted }]}>
                            {new Date(item.created_at).toLocaleDateString("en-GB", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </Text>
                          <TouchableOpacity
                            onPress={() => openCommentInput({ id: item.id, user_name: item.user_name })}
                            activeOpacity={0.65}
                            style={styles.commentReplyBtn}
                          >
                            <Text style={[styles.commentReplyText, { color: colors.textMuted }]}>Reply</Text>
                          </TouchableOpacity>
                          {(item.reply_count ?? 0) > 0 && (
                            <TouchableOpacity
                              onPress={() => handleLoadReplies(item.id)}
                              activeOpacity={0.65}
                              style={styles.commentReplyBtn}
                              disabled={loadingRepliesFor === item.id}
                            >
                              {loadingRepliesFor === item.id ? (
                                <ActivityIndicator size="small" color={colors.textMuted} />
                              ) : (
                                <Text style={[styles.commentReplyText, { color: colors.primary }]}>
                                  {expandedReplies[item.id]
                                    ? "Hide replies"
                                    : `${item.reply_count} ${item.reply_count === 1 ? "reply" : "replies"}`}
                                </Text>
                              )}
                            </TouchableOpacity>
                          )}
                        </View>
                        {item.is_owner && (
                          <TouchableOpacity
                            onPress={() => handleCommentActions(item, false)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            activeOpacity={0.6}
                          >
                            <Ionicons name="ellipsis-horizontal" size={16} color={colors.textMuted} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Inline replies (indented) */}
                  {expandedReplies[item.id] &&
                    (repliesMap[item.id] ?? []).map((reply) => (
                      <View key={reply.id} style={styles.replyItem}>
                        <View style={[styles.replyAvatar, styles.commentAvatarFallback, { backgroundColor: colors.backgroundSecondary }]}>
                          <Text style={[styles.commentAvatarInitial, { color: colors.textMuted, fontSize: 11 }]}>
                            {(reply.user_name || "?")[0].toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.commentBubble}>
                          <Text style={[styles.commentUsername, { color: colors.textSecondary }]} numberOfLines={1}>
                            {reply.user_name}
                          </Text>
                          <Text style={[styles.commentContent, { color: colors.textPrimary }]}>
                            {reply.body}
                          </Text>
                          <View style={styles.commentActionsRow}>
                            <View style={styles.commentActionsLeft}>
                              <Text style={[styles.commentDate, { color: colors.textMuted }]}>
                                {new Date(reply.created_at).toLocaleDateString("en-GB", {
                                  day: "numeric", month: "short", year: "numeric",
                                })}
                              </Text>
                            </View>
                            {reply.is_owner && (
                              <TouchableOpacity
                                onPress={() => handleCommentActions(reply, true, item.id)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                activeOpacity={0.6}
                              >
                                <Ionicons name="ellipsis-horizontal" size={14} color={colors.textMuted} />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </View>
                    ))}
                </View>
              )}
            />
          )}

          {/* "Add a comment" tappable row — opens the keyboard input overlay */}
          <TouchableOpacity
            style={[styles.commentAddTrigger, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
            onPress={openCommentInput}
            activeOpacity={0.75}
          >
            {user?.profile_image ? (
              <Image source={{ uri: user.profile_image }} style={styles.commentInputAvatar} />
            ) : (
              <View style={[styles.commentInputAvatar, styles.commentAvatarFallback, { backgroundColor: colors.border }]}>
                <Ionicons name="person-outline" size={14} color={colors.textMuted} />
              </View>
            )}
            <Text style={[styles.commentAddTriggerText, { color: colors.textMuted }]}>
              Add a comment…
            </Text>
          </TouchableOpacity>

          <View style={{ height: insets.bottom > 0 ? insets.bottom : 8 }} />
        </Animated.View>

        {/* ── Comment input overlay — floats above keyboard ── */}
        {commentInputVisible && (
          <>
            <Pressable
              style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.25)" }]}
              onPress={closeCommentInput}
            />
            <KeyboardAvoidingView
              style={styles.commentInputKAV}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              pointerEvents="box-none"
            >
              <View
                style={[styles.commentInputSheet, { backgroundColor: colors.surface, borderTopColor: colors.border }]}
                pointerEvents="auto"
              >
                {/* Replying / editing context banner */}
                {(replyingTo || editingComment) && (
                  <View style={[styles.commentContextBanner, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                    <Ionicons
                      name={replyingTo ? "return-down-forward-outline" : "create-outline"}
                      size={14}
                      color={colors.primary}
                    />
                    <Text style={[styles.commentContextText, { color: colors.textSecondary }]} numberOfLines={1}>
                      {replyingTo ? `Replying to ${replyingTo.user_name}` : "Editing comment"}
                    </Text>
                    <TouchableOpacity
                      onPress={closeCommentInput}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close" size={14} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                )}
                {/* Quick emoji reactions */}
                <View style={styles.commentEmojiRow}>
                  {COMMENT_EMOJIS.map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={[styles.commentEmojiBtn, { backgroundColor: colors.backgroundSecondary }]}
                      onPress={() => setCommentText((prev) => prev + emoji)}
                      activeOpacity={0.65}
                    >
                      <Text style={styles.commentEmojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Input row */}
                <View style={styles.commentInputRow}>
                  {user?.profile_image ? (
                    <Image source={{ uri: user.profile_image }} style={styles.commentInputAvatar} />
                  ) : (
                    <View style={[styles.commentInputAvatar, styles.commentAvatarFallback, { backgroundColor: colors.backgroundSecondary }]}>
                      <Ionicons name="person-outline" size={16} color={colors.textMuted} />
                    </View>
                  )}
                  <TextInput
                    ref={commentInputRef}
                    autoFocus
                    style={[styles.commentInput, { backgroundColor: colors.backgroundSecondary, color: colors.textPrimary, borderColor: commentText ? colors.primary : colors.border }]}
                    placeholder="Write a comment…"
                    placeholderTextColor={colors.textMuted}
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                    maxLength={2000}
                    returnKeyType="send"
                    onSubmitEditing={handleSubmitComment}
                    blurOnSubmit={false}
                  />
                  <TouchableOpacity
                    style={[styles.commentSendBtn, { backgroundColor: commentText.trim() ? colors.primary : colors.backgroundSecondary }]}
                    onPress={handleSubmitComment}
                    disabled={submittingComment || !commentText.trim()}
                    activeOpacity={0.75}
                  >
                    {submittingComment ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="send" size={16} color={commentText.trim() ? "#fff" : colors.textMuted} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ height: insets.bottom > 0 ? insets.bottom : 8, backgroundColor: colors.surface }} pointerEvents="none" />
            </KeyboardAvoidingView>
          </>
        )}
      </Modal>

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
                desc: fetchingPhone ? "Loading contact…" : merchantPhone ? merchantPhone : "Speak directly with the merchant",
                onPress: handleCallMerchant,
              },
              {
                icon: "chatbubbles" as const,
                iconColor: colors.primary,
                bgColor: colors.backgroundSecondary,
                title: "Send Message",
                desc: "In-app messaging coming soon",
                onPress: handleMessageMerchant,
              },
              {
                icon: "logo-whatsapp" as const,
                iconColor: "#25D366",
                bgColor: "rgba(37,211,102,0.12)",
                title: "WhatsApp",
                desc: fetchingPhone ? "Loading contact…" : merchantPhone ? `Chat with ${listing.merchant.display_name}` : "Chat on WhatsApp",
                onPress: handleWhatsAppMerchant,
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
                {fetchingPhone && (opt.title === "Call" || opt.title === "WhatsApp") ? (
                  <ActivityIndicator size="small" color={colors.textMuted} />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                )}
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

  // ── Comments entry point ─────────────────────────────────────────────────
  commentCountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  commentTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  commentTriggerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentTriggerText: {
    flex: 1,
    fontSize: 13,
  },

  // ── Comments bottom sheet ─────────────────────────────────────────────────
  commentsHandleArea: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  commentsSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: COMMENTS_SHEET_HEIGHT,
  },
  // "Add a comment" pill at the bottom of the sheet
  commentAddTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
  },
  commentAddTriggerText: {
    flex: 1,
    fontSize: 13,
  },
  // Input overlay (above keyboard)
  commentInputKAV: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  commentInputSheet: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  commentEmojiRow: {
    flexDirection: "row",
    gap: 6,
  },
  commentEmojiBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    borderRadius: 10,
  },
  commentEmojiText: {
    fontSize: 22,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  commentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  commentsCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  commentsList: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 20
  },
  commentsListEmpty: {
    flexGrow: 1,
  },
  commentsEmptyText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  commentItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderColor: colors.border,
    borderWidth: 1
  },
  commentAvatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  commentAvatarInitial: {
    fontSize: 14,
    fontWeight: "700",
  },
  commentBubble: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    gap: 3,
  },
  commentUsername: {
    fontSize: 13,
    marginBottom: 5
  },
  commentContent: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "700",
  },
  commentDate: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: "light"
  },
  commentInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 100,
  },
  commentSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  // Comment actions bar
  commentActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  commentActionsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  commentReplyBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentReplyText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Reply items (indented)
  replyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 6,
    marginLeft: 46,
  },
  replyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderColor: colors.border,
    borderWidth: 1,
  },

  // Comment input context banner
  commentContextBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  commentContextText: {
    flex: 1,
    fontSize: 12,
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
