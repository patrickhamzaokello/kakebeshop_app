import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
  Dimensions,
  Animated,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import {
  spacingX,
  spacingY,
  borderRadius,
  fontSize,
  fontWeight,
  shadow,
  ThemeColors,
} from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { merchantBase } from "@/utils/services/merchantService";
import { MerchantDetails as MerchantDetailsType } from "@/types/merchant";
import { ListingImage } from "@/components/test/common/ListingImage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLUMN_GAP = 12;
const HORIZONTAL_PADDING = 16;
const PRODUCT_CARD_WIDTH =
  (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - COLUMN_GAP) / 2;

const STORE_BANNER_HEIGHT = 220;
const STORE_HEADER_COLLAPSED_HEIGHT = 56;

interface Product {
  id: string;
  title: string;
  price: string;
  images: string[];
  condition?: string;
  location?: { name: string };
}

/* ─────────────────────────────────────────────────────────── ProductCard ── */
const ProductCard: React.FC<{ product: Product; onPress: () => void }> = ({
  product,
  onPress,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity
      style={styles.productCard}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.productImageWrap}>
        {product.images?.length > 0 ? (
          <ListingImage
          primaryImage={product.images[0]}
          style={styles.productImage}
                                          />
        ) : (
          <View style={[styles.productImage, styles.productImageEmpty]}>
            <Ionicons name="image-outline" size={28} color={colors.neutral400} />
          </View>
        )}
        {product.condition && (
          <View style={styles.conditionBadge}>
            <Text style={styles.conditionText}>{product.condition}</Text>
          </View>
        )}
      </View>
      <View style={styles.productMeta}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={styles.productPrice}>UGX {product.price}</Text>
        {product.location && (
          <View style={styles.productLocationRow}>
            <Ionicons name="location-outline" size={11} color={colors.textMuted} />
            <Text style={styles.productLocation} numberOfLines={1}>
              {product.location.name}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

/* ──────────────────────────────────────────────────────── StatBubble ── */
const StatBubble: React.FC<{ value: string | number; label: string }> = ({
  value,
  label,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.statBubble}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

/* ════════════════════════════════════════════════════ Main Screen ════════ */
export default function MerchantDetailsScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [merchant, setMerchant] = useState<MerchantDetailsType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  /* ── header fade / shrink ────────────────────────── */
  const headerOpacity = scrollY.interpolate({
    inputRange: [STORE_BANNER_HEIGHT - 80, STORE_BANNER_HEIGHT],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const bannerScale = scrollY.interpolate({
    inputRange: [-60, 0],
    outputRange: [1.08, 1],
    extrapolate: "clamp",
  });

  useEffect(() => {
    fetchMerchantProfile();
    fetchMerchantProducts();
  }, [id]);

  const fetchMerchantProfile = async () => {
    try {
      const data = await merchantBase.merchantProfile(id as string);
      setMerchant(data);
    } catch {
      Alert.alert("Error", "Failed to load merchant profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchMerchantProducts = async () => {
    try {
      const data = await merchantBase.merchantProducts(id as string, 1, 40);
      setProducts(data ?? []);
    } catch {
      /* silent */
    } finally {
      setLoadingProducts(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([fetchMerchantProfile(), fetchMerchantProducts()]).finally(
      () => setRefreshing(false)
    );
  };

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i < Math.floor(rating) ? "star" : "star-outline"}
        size={13}
        color={colors.star}
      />
    ));

  const formatJoined = (dateString: string) => {
    const months = Math.floor(
      (Date.now() - new Date(dateString).getTime()) /
        (1000 * 60 * 60 * 24 * 30)
    );
    if (months < 1) return "New seller";
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(months / 12);
    return `${years}yr${years > 1 ? "s" : ""} ago`;
  };

  /* ── Loading ─────────────────────────────────────── */
  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!merchant) {
    return (
      <View style={styles.loadingScreen}>
        <Ionicons name="alert-circle-outline" size={56} color={colors.neutral400} />
        <Text style={styles.notFoundText}>Merchant not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn2}>
          <Text style={styles.backBtn2Text}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ── render two-column item ──────────────────────── */
  const renderProduct = ({
    item,
    index,
  }: {
    item: Product;
    index: number;
  }) => (
    <View
      style={[
        styles.productColumn,
        index % 2 === 0 ? { marginRight: COLUMN_GAP / 2 } : { marginLeft: COLUMN_GAP / 2 },
      ]}
    >
      <ProductCard
        product={item}
        onPress={() => router.push({ pathname: `/listing/${item.id}` })}
      />
    </View>
  );

  /* ── Store Header content (inside scroll) ────────── */
  const StoreHeaderContent = () => (
    <View>
      {/* ── Banner + Avatar ─────────────────────────── */}
      <View style={{ height: STORE_BANNER_HEIGHT }}>
        {/* Banner background */}
        <Animated.View
          style={[styles.banner, { transform: [{ scale: bannerScale }] }]}
        >
          {merchant.banner_image ? (
            <ListingImage
                                                primaryImage={merchant.banner_image}
                                                style={StyleSheet.absoluteFillObject}
                                                                                />
          ) : (
            <LinearGradient
              colors={isDark ? [colors.primaryDark, colors.primary] : ["#1A6EFF", "#0047CC"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          {/* Subtle pattern overlay */}
          <View style={styles.bannerPattern} />
          {/* Dark scrim at bottom for avatar contrast */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.35)"]}
            style={styles.bannerScrim}
          />
        </Animated.View>

        {/* Avatar floating on the banner bottom edge */}
        <View style={styles.avatarWrapper}>
          {merchant.logo ? (
            <Image source={{ uri: merchant.logo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Ionicons name="storefront" size={36} color={colors.primary} />
            </View>
          )}
          {merchant.verified && (
            <View style={styles.verifiedDot}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            </View>
          )}
        </View>
      </View>

      {/* ── Name / Meta ───────────────────────────────── */}
      <View style={styles.storeInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.storeName}>{merchant.display_name}</Text>
          {merchant.verified && (
            <View style={styles.verifiedChip}>
              <Ionicons name="shield-checkmark" size={11} color={colors.success} />
              <Text style={styles.verifiedChipText}>Verified</Text>
            </View>
          )}
        </View>

        {/* Stars */}
        <View style={styles.ratingRow}>
          <View style={styles.starsRow}>{renderStars(merchant.rating)}</View>
          <Text style={styles.ratingNum}>
            {merchant.rating > 0
              ? merchant.rating.toFixed(1)
              : "\u2014"}
          </Text>
          {merchant.total_reviews > 0 && (
            <Text style={styles.reviewCount}>
              ({merchant.total_reviews} reviews)
            </Text>
          )}
        </View>

        {/* Description */}
        {merchant.description && (
          <Text style={styles.storeDesc} numberOfLines={3}>
            {merchant.description}
          </Text>
        )}

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatBubble value={products.length} label="Listings" />
          <View style={styles.statDivider} />
          <StatBubble value={merchant.total_reviews ?? 0} label="Reviews" />
          <View style={styles.statDivider} />
          <StatBubble
            value={formatJoined(merchant.created_at)}
            label="Member"
          />
        </View>

        {/* Contact pills */}
        <View style={styles.contactPills}>
          {merchant.business_phone && (
            <TouchableOpacity
              style={styles.pill}
              onPress={() =>
                Linking.openURL(
                  `tel:${merchant.business_phone!.replace(/\s/g, "")}`
                )
              }
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={15} color={colors.primary} />
              <Text style={styles.pillText}>{merchant.business_phone}</Text>
            </TouchableOpacity>
          )}
          {merchant.location && (
            <View style={[styles.pill, styles.pillMuted]}>
              <Ionicons name="location-outline" size={15} color={colors.textMuted} />
              <Text style={[styles.pillText, { color: colors.textSecondary }]}>
                {merchant.location.name}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ── Products section header ──────────────────── */}
      <View style={styles.productsSectionHeader}>
        <Text style={styles.productsSectionTitle}>
          Listings
          {products.length > 0 && (
            <Text style={styles.productCount}> {products.length}</Text>
          )}
        </Text>
        
      </View>
    </View>
  );

  /* ── Product grid data ───────────────────────────── */
  const pairedProducts: Array<[Product, Product | null]> = [];
  for (let i = 0; i < products.length; i += 2) {
    pairedProducts.push([products[i], products[i + 1] ?? null]);
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* ── Sticky collapsed header (appears on scroll) ── */}
      <Animated.View
        style={[
          styles.stickyHeader,
          { paddingTop: insets.top, opacity: headerOpacity },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.stickyHeaderTitle} numberOfLines={1}>
          {merchant.display_name}
        </Text>
      </Animated.View>

      {/* ── Floating back button ─────────────────────── */}
      <SafeAreaView
        edges={["top"]}
        style={styles.floatingNavBar}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={styles.floatingBackBtn}
          onPress={() => router.back()}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* ── Main scroll ──────────────────────────────── */}
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            progressViewOffset={STORE_BANNER_HEIGHT}
          />
        }
      >
        <StoreHeaderContent />

        {/* ── 2-col product grid ─────────────────────── */}
        <View style={styles.grid}>
          {loadingProducts ? (
            <View style={styles.gridLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.gridLoadingText}>Loading products…</Text>
            </View>
          ) : products.length === 0 ? (
            <View style={styles.emptyGrid}>
              <Ionicons name="cube-outline" size={52} color={colors.neutral300} />
              <Text style={styles.emptyGridTitle}>No listings yet</Text>
              <Text style={styles.emptyGridSub}>
                This seller hasn't posted any products
              </Text>
            </View>
          ) : (
            <FlatList
              data={products}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.gridRow}
              ItemSeparatorComponent={() => (
                <View style={{ height: COLUMN_GAP }} />
              )}
              contentContainerStyle={{ paddingBottom: 24 }}
            />
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════ Styles ════════ */
const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.backgroundTertiary,
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  notFoundText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textMuted,
  },
  backBtn2: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 24,
  },
  backBtn2Text: {
    color: colors.textInverse,
    fontWeight: "600",
    fontSize: 14,
  },

  /* ── Sticky header ─────────────────────────────── */
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: colors.primary,
    height: STORE_HEADER_COLLAPSED_HEIGHT + 44,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 12,
  },
  stickyHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.2,
  },

  /* ── Floating back button ────────────────────────── */
  floatingNavBar: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 30,
    padding: 12,
  },
  floatingBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.38)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* ── Scroll ──────────────────────────────────────── */
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },

  /* ── Banner ─────────────────────────────────────── */
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: STORE_BANNER_HEIGHT,
    overflow: "hidden",
    backgroundColor: colors.primary,
  },
  bannerPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.07,
    backgroundColor: "transparent",
  },
  bannerScrim: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },

  /* ── Avatar ─────────────────────────────────────── */
  avatarWrapper: {
    position: "absolute",
    bottom: -44,
    left: HORIZONTAL_PADDING,
    zIndex: 10,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 4,
    borderColor: colors.surface,
    backgroundColor: colors.backgroundSecondary,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: colors.surface,
    borderRadius: 11,
    padding: 1,
  },

  /* ── Store info card ─────────────────────────────── */
  storeInfo: {
    backgroundColor: colors.surface,
    paddingTop: 56,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 6,
  },
  storeName: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  verifiedChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.successLight,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 3,
  },
  verifiedChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.success,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 4,
  },
  starsRow: { flexDirection: "row", gap: 2 },
  ratingNum: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: colors.textMuted,
  },
  storeDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  statBubble: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  contactPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 24,
    backgroundColor: colors.backgroundTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillMuted: {
    backgroundColor: colors.backgroundSecondary,
    borderColor: colors.border,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },

  /* ── Products section header ─────────────────────── */
  productsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 20,
    paddingBottom: 12,
  },
  productsSectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.3,
  },
  productCount: {
    color: colors.primary,
    fontWeight: "700",
  },
  viewAllLink: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },

  /* ── Grid ────────────────────────────────────────── */
  grid: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  gridRow: {
    justifyContent: "space-between",
  },
  productColumn: {
    flex: 1,
  },
  gridLoading: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  gridLoadingText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  emptyGrid: {
    alignItems: "center",
    paddingVertical: 64,
    gap: 8,
  },
  emptyGridTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textSecondary,
    marginTop: 8,
  },
  emptyGridSub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
  },

  /* ── Product Card ────────────────────────────────── */
  productCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  productImageWrap: {
    width: "100%",
    aspectRatio: 1,
    position: "relative",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  productImageEmpty: {
    alignItems: "center",
    justifyContent: "center",
  },
  conditionBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  conditionText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  productMeta: {
    padding: 10,
  },
  productTitle: {
    fontSize: 12.5,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 18,
    marginBottom: 4,
    height: 36,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  productLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  productLocation: {
    fontSize: 11,
    color: colors.textMuted,
    flex: 1,
  },
});
