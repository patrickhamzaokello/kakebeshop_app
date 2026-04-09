import React, { useState, useEffect, useRef } from "react";
import { Text } from "@/components/Text";
import { View, Image, TouchableOpacity, StyleSheet, Modal, ScrollView, Pressable, ActivityIndicator, Dimensions, Animated, Alert, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Listing, ListingDetail } from "@/utils/types/models";
import { listingDetailsService } from "@/utils/services/listingDetailsService";
import { useCartStore } from "@/utils/stores/useCartStore";
import { useTheme } from "@/contexts/ThemeContext";

interface QuickViewModalProps {
  visible: boolean;
  listing: Listing | null;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const IMAGE_HEIGHT = 260;

// ─── Price formatter ──────────────────────────────────────────────────────────

const formatPrice = (detail: ListingDetail): string => {
  if (detail.price_type === "ON_REQUEST") return "Price on request";
  const currency = detail.currency || "UGX";
  if (detail.price_type === "RANGE") {
    const min = parseInt(detail.price_min || "0").toLocaleString();
    const max = parseInt(detail.price_max || "0").toLocaleString();
    return `${currency} ${min} – ${max}`;
  }
  return `${currency} ${parseInt(detail.price || "0").toLocaleString()}`;
};

// ─── Info chip ────────────────────────────────────────────────────────────────

const InfoChip: React.FC<{ label: string; color: string; bg: string }> = ({ label, color, bg }) => (
  <View style={[chipStyles.chip, { backgroundColor: bg }]}>
    <Text style={[chipStyles.chipText, { color }]}>{label}</Text>
  </View>
);

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
});

// ─── Skeleton ────────────────────────────────────────────────────────────────

const SkeletonLine: React.FC<{ width: string | number; height?: number; colors: any }> = ({
  width,
  height = 13,
  colors,
}) => (
  <View
    style={{
      width,
      height,
      borderRadius: 6,
      backgroundColor: colors.border,
      marginBottom: 10,
    }}
  />
);

const LoadingSkeleton: React.FC<{ colors: any }> = ({ colors }) => (
  <View style={{ padding: 16 }}>
    <View style={{ height: IMAGE_HEIGHT, backgroundColor: colors.border, borderRadius: 0, marginBottom: 16 }} />
    <SkeletonLine width="40%" height={10} colors={colors} />
    <SkeletonLine width="85%" height={18} colors={colors} />
    <SkeletonLine width="70%" height={18} colors={colors} />
    <SkeletonLine width="45%" height={22} colors={colors} />
    <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />
    <SkeletonLine width="30%" height={10} colors={colors} />
    <SkeletonLine width="100%" height={13} colors={colors} />
    <SkeletonLine width="90%" height={13} colors={colors} />
    <SkeletonLine width="60%" height={13} colors={colors} />
  </View>
);

// ─── Main export ──────────────────────────────────────────────────────────────

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  visible,
  listing,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const [listingDetails, setListingDetails] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [descExpanded, setDescExpanded] = useState(false);

  const { addToCart } = useCartStore();

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      if (listing) fetchListingDetails();
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 220, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        setListingDetails(null);
        setCurrentImageIndex(0);
        setDescExpanded(false);
        setLoading(false);
      });
    }
  }, [visible, listing]);

  const fetchListingDetails = async () => {
    if (!listing) return;
    setLoading(true);
    try {
      const details = await listingDetailsService.getListingDetails(listing.id);
      setListingDetails(details);
    } catch {}
    finally { setLoading(false); }
  };

  const handleImageScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentImageIndex(idx);
  };

  const handleAddToCart = async () => {
    if (!listing) return;
    const success = await addToCart(listing.id);
    if (success) {
      Alert.alert("Added to cart", `"${listing.title}" was added to your cart.`);
      onClose();
    }
  };

  const handleAddToWishlist = async () => {
    if (!listing) return;
    await listingDetailsService.AddListingtoWishlist(listing.id);
    onClose();
  };

  const isOnRequest = listingDetails?.price_type === "ON_REQUEST";
  const images = listingDetails?.images ?? [];
  const description = listingDetails?.description ?? "";
  const shortDesc = description.length > 160 ? description.slice(0, 160).trimEnd() + "…" : description;

  return (
    <Modal
      animationType="none"
      transparent
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: colors.surface, transform: [{ translateY: slideAnim }] },
        ]}
        pointerEvents="box-none"
      >
        {/* Drag handle */}
        <View style={styles.handleRow}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
        </View>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Quick View</Text>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.backgroundSecondary }]}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Body */}
        {loading ? (
          <ScrollView scrollEnabled={false}>
            <LoadingSkeleton colors={colors} />
          </ScrollView>
        ) : listingDetails ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {/* ── Image carousel ── */}
            {images.length > 0 ? (
              <View style={styles.imageSection}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onScroll={handleImageScroll}
                  scrollEventThrottle={16}
                  decelerationRate="fast"
                >
                  {images.map((img, i) => (
                    <Image
                      key={img.id ?? `img-${i}`}
                      source={{ uri: img.image }}
                      style={[styles.heroImage, { width: SCREEN_WIDTH }]}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>

                {/* Dots */}
                {images.length > 1 && (
                  <View style={styles.dotsRow}>
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

                {/* Type pill on image */}
                <View style={styles.typePill}>
                  <Text style={styles.typePillText}>
                    {listingDetails.listing_type === "SERVICE" ? "Service" : "Product"}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* ── Details ── */}
            <View style={styles.detailsBlock}>

              {/* Category + negotiable */}
              <View style={styles.chipsRow}>
                {listingDetails.category && (
                  <InfoChip
                    label={listingDetails.category.name}
                    color={colors.primary}
                    bg={colors.backgroundSecondary}
                  />
                )}
                {listingDetails.is_price_negotiable && (
                  <InfoChip label="Negotiable" color="#4CAF50" bg="rgba(76,175,80,0.12)" />
                )}
                {listingDetails.is_featured && (
                  <InfoChip label="Featured" color="#E60549" bg="rgba(230,5,73,0.1)" />
                )}
              </View>

              {/* Title */}
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                {listingDetails.title}
              </Text>

              {/* Price */}
              <Text
                style={[
                  styles.price,
                  isOnRequest
                    ? { color: colors.textMuted, fontSize: 14, fontWeight: "500" }
                    : { color: colors.primary },
                ]}
              >
                {formatPrice(listingDetails)}
              </Text>

              {/* Divider */}
              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Merchant row */}
              <View style={styles.merchantRow}>
                {listingDetails.merchant.logo ? (
                  <Image
                    source={{ uri: listingDetails.merchant.logo }}
                    style={[styles.merchantAvatar, { borderColor: colors.border }]}
                  />
                ) : (
                  <View style={[styles.merchantAvatarFallback, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                    <Ionicons name="storefront-outline" size={16} color={colors.textMuted} />
                  </View>
                )}
                <View style={styles.merchantMeta}>
                  <View style={styles.merchantNameRow}>
                    <Text style={[styles.merchantName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {listingDetails.merchant.business_name}
                    </Text>
                    {listingDetails.merchant.verified && (
                      <Ionicons name="checkmark-circle" size={14} color="#4CAF50" style={{ marginLeft: 4 }} />
                    )}
                  </View>
                  {(listingDetails.merchant.rating > 0) && (
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={11} color="#FFC107" />
                      <Text style={[styles.ratingText, { color: colors.textMuted }]}>
                        {listingDetails.merchant.rating.toFixed(1)}
                        {listingDetails.merchant.total_reviews > 0
                          ? `  (${listingDetails.merchant.total_reviews})`
                          : ""}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={[styles.merchantBadge, { backgroundColor: colors.backgroundSecondary }]}>
                  <Text style={[styles.merchantBadgeText, { color: colors.textMuted }]}>Seller</Text>
                </View>
              </View>

              {/* Divider */}
              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Description */}
              {description.length > 0 && (
                <View style={styles.descSection}>
                  <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Description</Text>
                  <Text style={[styles.descText, { color: colors.textSecondary }]}>
                    {descExpanded ? description : shortDesc}
                  </Text>
                  {description.length > 160 && (
                    <TouchableOpacity onPress={() => setDescExpanded(!descExpanded)} activeOpacity={0.7}>
                      <Text style={[styles.readMore, { color: colors.primary }]}>
                        {descExpanded ? "Show less" : "Read more"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Location */}
              {listingDetails.location && (
                <View style={[styles.locationRow, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                  <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                  <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {[listingDetails.location.area, listingDetails.location.district, listingDetails.location.region]
                      .filter(Boolean)
                      .join(", ")}
                  </Text>
                </View>
              )}

              {/* Tags */}
              {listingDetails.tags?.length > 0 && (
                <View style={styles.tagsRow}>
                  {listingDetails.tags.map((tag, i) => (
                    <View key={tag.id ?? `tag-${i}`} style={[styles.tag, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
                      <Text style={[styles.tagText, { color: colors.textMuted }]}>#{tag.name}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Meta row: views + status */}
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="eye-outline" size={13} color={colors.textMuted} />
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>
                    {listingDetails.views_count ?? 0} views
                  </Text>
                </View>
                <View style={[
                  styles.statusChip,
                  { backgroundColor: listingDetails.status === "ACTIVE" ? "rgba(76,175,80,0.12)" : colors.backgroundSecondary },
                ]}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: listingDetails.status === "ACTIVE" ? "#4CAF50" : colors.textMuted },
                  ]} />
                  <Text style={[
                    styles.statusText,
                    { color: listingDetails.status === "ACTIVE" ? "#4CAF50" : colors.textMuted },
                  ]}>
                    {listingDetails.status === "ACTIVE" ? "Available" : listingDetails.status}
                  </Text>
                </View>
              </View>

            </View>
          </ScrollView>
        ) : null}

        {/* ── Footer ── */}
        {!loading && listingDetails && (
          <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.wishlistBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
              onPress={handleAddToWishlist}
              activeOpacity={0.75}
            >
              <Ionicons name="heart-outline" size={22} color={colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cartBtn, { backgroundColor: colors.primary }]}
              onPress={handleAddToCart}
              activeOpacity={0.82}
            >
              <Ionicons name="cart-outline" size={18} color="#fff" />
              <Text style={styles.cartBtnText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: "92%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 20,
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  // Image
  imageSection: {
    position: "relative",
  },
  heroImage: {
    height: IMAGE_HEIGHT,
  },
  dotsRow: {
    position: "absolute",
    bottom: 12,
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
  typePill: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.52)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 0.2,
  },

  // Details block
  detailsBlock: {
    padding: 16,
    gap: 0,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 26,
    marginBottom: 8,
  },
  price: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },

  // Merchant
  merchantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  merchantAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
  },
  merchantAvatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  merchantMeta: {
    flex: 1,
    gap: 2,
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
  merchantBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  merchantBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },

  // Description
  descSection: {
    gap: 6,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  descText: {
    fontSize: 14,
    lineHeight: 21,
  },
  readMore: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },

  // Location
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 13,
    flex: 1,
  },

  // Tags
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
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

  // Meta row
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Footer
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  wishlistBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  cartBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.2,
  },
});
