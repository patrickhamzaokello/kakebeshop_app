import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  colors,
  spacingX,
  spacingY,
  borderRadius,
  fontSize,
  fontWeight,
  shadow,
} from "@/constants/theme";
import { merchantBase } from "@/utils/services/merchantService";
import { MerchantDetails as MerchantDetailsType } from "@/types/merchant";

const { width } = Dimensions.get("window");
const PRODUCT_CARD_WIDTH = width * 0.42;

// Product interface - adjust based on your actual product type
interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  condition?: string;
  location?: {
    name: string;
  };
}

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => (
  <TouchableOpacity
    style={styles.productCard}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.productImageContainer}>
      {product.images && product.images.length > 0 ? (
        <Image
          source={{ uri: product.images[0] }}
          style={styles.productImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.productImage, styles.productImagePlaceholder]}>
          <Ionicons name="image-outline" size={32} color={colors.textMuted} />
        </View>
      )}
    </View>
    <View style={styles.productInfo}>
      <Text style={styles.productTitle} numberOfLines={2}>
        {product.title}
      </Text>
      <Text style={styles.productPrice}>
        UGX {product.price.toLocaleString()}
      </Text>
      {product.location && (
        <Text style={styles.productLocation} numberOfLines={1}>
          <Ionicons
            name="location-outline"
            size={12}
            color={colors.textMuted}
          />{" "}
          {product.location.name}
        </Text>
      )}
    </View>
  </TouchableOpacity>
);

export default function MerchantDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [merchant, setMerchant] = useState<MerchantDetailsType | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMerchantProfile();
    fetchMerchantProducts();
  }, [id]);

  const fetchMerchantProfile = async () => {
    try {
      const data = await merchantBase.merchantProfile(id as string);
      setMerchant(data);
    } catch (error) {
      console.error("Error fetching merchant:", error);
      Alert.alert("Error", "Failed to load merchant profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchMerchantProducts = async () => {
    try {
      const data = await merchantBase.merchantProducts(id as string, 1, 20);

      if (data) {
        setProducts(data);
      } else {
        setProducts([]);
      }

      setLoadingProducts(false);
    } catch (error) {
      console.error("Error fetching products:", error);
      setLoadingProducts(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([fetchMerchantProfile(), fetchMerchantProducts()]).finally(
      () => {
        setRefreshing(false);
      }
    );
  };

  const handleCall = () => {
    if (merchant?.business_phone) {
      Linking.openURL(`tel:${merchant.business_phone.replace(/\s/g, "")}`);
    }
  };

  const handleChat = () => {
    // Implement chat functionality
    Alert.alert("Chat", "Opening chat...");
  };

  const handleViewProducts = () => {
    router.push({
      pathname: "/products/merchant-products",
      params: { merchantId: id },
    });
  };

  const handleProductPress = (productId: string) => {
    router.push({
      pathname: `/products/${productId}`,
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i < Math.floor(rating) ? "star" : "star-outline"}
        size={16}
        color={colors.warning}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const months = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    if (months < 1) return "New seller";
    if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years > 1 ? "s" : ""} ago`;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!merchant) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={64}
          color={colors.textMuted}
        />
        <Text style={styles.emptyText}>Merchant not found</Text>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Simple Header */}
      <SafeAreaView edges={["top"]} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seller Profile</Text>
        <View style={styles.headerSpacer} />
      </SafeAreaView>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Merchant Info */}
        <View style={styles.merchantCard}>
          {/* Logo */}
          <View style={styles.logoWrapper}>
            {merchant.logo ? (
              <Image source={{ uri: merchant.logo }} style={styles.logo} />
            ) : (
              <View style={[styles.logo, styles.logoPlaceholder]}>
                <Ionicons name="storefront" size={40} color={colors.primary} />
              </View>
            )}
            {merchant.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.success}
                />
              </View>
            )}
          </View>

          {/* Name & Rating */}
          <Text style={styles.merchantName}>{merchant.display_name}</Text>

          <View style={styles.ratingRow}>
            <View style={styles.stars}>{renderStars(merchant.rating)}</View>
            <Text style={styles.ratingText}>
              {merchant.rating > 0
                ? `${merchant.rating.toFixed(1)} (${merchant.total_reviews})`
                : "No reviews yet"}
            </Text>
          </View>

          <Text style={styles.joinedText}>
            Joined {formatDate(merchant.created_at)}
          </Text>

          {/* Description */}
          {merchant.description && (
            <Text style={styles.description}>{merchant.description}</Text>
          )}
        </View>

        {/* Contact Section */}
        {(merchant.business_phone || merchant.location) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>

            {merchant.business_phone && (
              <TouchableOpacity style={styles.contactRow} onPress={handleCall}>
                <View style={styles.contactIcon}>
                  <Ionicons
                    name="call-outline"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.contactText}>
                  {merchant.business_phone}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            )}

            {merchant.location && (
              <View style={styles.contactRow}>
                <View style={styles.contactIcon}>
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.contactText}>{merchant.location.name}</Text>
              </View>
            )}
          </View>
        )}

        {/* Products Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Products</Text>
            {products.length > 0 && (
              <TouchableOpacity onPress={handleViewProducts}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            )}
          </View>

          {loadingProducts ? (
            <View style={styles.productsLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingProductsText}>
                Loading products...
              </Text>
            </View>
          ) : products.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsScroll}
            >
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPress={() => handleProductPress(product.id)}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyProducts}>
              <Ionicons
                name="cube-outline"
                size={48}
                color={colors.textMuted}
              />
              <Text style={styles.emptyProductsText}>No products yet</Text>
              <Text style={styles.emptyProductsSubtext}>
                This seller hasn't listed any products
              </Text>
            </View>
          )}
        </View>

        {/* Products Button */}
        {products.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.productsButton}
              onPress={handleViewProducts}
              activeOpacity={0.7}
            >
              <View style={styles.productsButtonContent}>
                <Ionicons
                  name="grid-outline"
                  size={24}
                  color={colors.textPrimary}
                />
                <View style={styles.productsButtonText}>
                  <Text style={styles.productsButtonTitle}>
                    View All Products
                  </Text>
                  <Text style={styles.productsButtonSubtitle}>
                    Browse all items from this seller
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.footer}>
        <SafeAreaView edges={["bottom"]}>
          <View style={styles.footerContent}>
            {merchant.business_phone && (
              <TouchableOpacity
                style={styles.callButton}
                onPress={handleCall}
                activeOpacity={0.7}
              >
                <Ionicons name="call" size={20} color={colors.primary} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.chatButton}
              onPress={handleChat}
              activeOpacity={0.8}
            >
              <Ionicons
                name="chatbubble-ellipses"
                size={20}
                color={colors.white}
              />
              <Text style={styles.chatButtonText}>Message Seller</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },

  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    paddingHorizontal: spacingX._30,
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    marginTop: spacingY._16,
    marginBottom: spacingY._24,
  },
  backLink: {
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._24,
  },
  backLinkText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacingX._16,
    paddingVertical: spacingY._12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },

  // Merchant Card
  merchantCard: {
    backgroundColor: colors.white,
    paddingVertical: spacingY._30,
    paddingHorizontal: spacingX._20,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoWrapper: {
    position: "relative",
    marginBottom: spacingY._16,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.backgroundSecondary,
  },
  logoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  merchantName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacingY._8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacingY._4,
  },
  stars: {
    flexDirection: "row",
    marginRight: spacingX._8,
  },
  ratingText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  joinedText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacingY._16,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginTop: spacingY._8,
  },

  // Section
  section: {
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacingY._12,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  viewAllText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },

  // Contact Row
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: spacingX._16,
    borderRadius: borderRadius.md,
    marginBottom: spacingY._8,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacingX._12,
  },
  contactText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.textPrimary,
  },

  // Products Section
  productsScroll: {
    paddingRight: spacingX._20,
    gap: 12,
  },
  productsLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacingY._30,
    gap: 12,
  },
  loadingProductsText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  emptyProducts: {
    alignItems: "center",
    paddingVertical: spacingY._40,
    paddingHorizontal: spacingX._20,
  },
  emptyProductsText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacingY._12,
  },
  emptyProductsSubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacingY._4,
  },

  // Product Card
  productCard: {
    width: PRODUCT_CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  productImageContainer: {
    width: "100%",
    height: PRODUCT_CARD_WIDTH,
    backgroundColor: colors.backgroundSecondary,
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  productImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: {
    padding: spacingX._12,
  },
  productTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacingY._4,
    height: 36,
  },
  productPrice: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacingY._4,
  },
  productLocation: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },

  // Products Button
  productsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    padding: spacingX._16,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productsButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  productsButtonText: {
    marginLeft: spacingX._12,
    flex: 1,
  },
  productsButtonTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacingY._2,
  },
  productsButtonSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },

  // Footer
  footer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow.lg,
  },
  footerContent: {
    flexDirection: "row",
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._12,
    paddingBottom: spacingY._8,
    gap: 12,
  },
  callButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  chatButton: {
    flex: 1,
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...shadow.primary,
  },
  chatButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
});
