import ScreenWrapper from "@/components/ScreenWrapper";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import Typo from "@/components/Typo";
import { colors, spacingY, spacingX, borderRadius } from "@/constants/theme";
import { router, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import apiService from "@/utils/apiBase";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Updated interfaces to match API response
interface ImageVariant {
  id: string;
  image: string;
  width: number;
  height: number;
  size_bytes: number;
  order: number;
}

interface ListingImageGroup {
  thumb?: ImageVariant;
  medium?: ImageVariant;
  large?: ImageVariant;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description: string;
  parent?: string;
  parent_name?: string;
  children_count: number;
  allows_order_intent: boolean;
  allows_cart: boolean;
  is_contact_only: boolean;
  is_featured: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface Merchant {
  id: string;
  display_name: string;
  business_name?: string;
  logo?: string;
  rating: number;
  total_reviews: number;
  verified: boolean;
  featured: boolean;
}

interface Listing {
  id: string;
  merchant: Merchant;
  title: string;
  description: string;
  listing_type: "PRODUCT" | "SERVICE";
  category: Category;
  price_type: "FIXED" | "RANGE" | "ON_REQUEST";
  price?: string;
  price_min?: string;
  price_max?: string;
  currency: string;
  is_price_negotiable: boolean;
  status: "DRAFT" | "PENDING" | "ACTIVE" | "REJECTED" | "EXPIRED";
  rejection_reason?: string;
  is_verified: boolean;
  verified_at?: string;
  is_featured: boolean;
  featured_until?: string;
  images: ListingImageGroup[];
  tags: Tag[];
  views_count: number;
  contact_count: number;
  metadata?: any;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  business_hours: any[];
  is_active: boolean;
}

export default function ListingDetail() {
  const params = useLocalSearchParams();
  const listingId = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadListing();
  }, [listingId]);

  const loadListing = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.get<Listing>(
        `/api/v1/listings/${listingId}/`
      );

      if (response.success && response.data) {
        setListing(response.data);
      } else {
        throw new Error("Failed to load listing");
      }
    } catch (error) {
      console.error("Error loading listing:", error);
      Alert.alert(
        "Error",
        "Failed to load listing details. Please try again.",
        [
          {
            text: "Go Back",
            onPress: () => router.back(),
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    // Navigate to edit screen
    router.push(`/listings/edit/${listingId}`);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Listing",
      "Are you sure you want to delete this listing? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await apiService.delete(
                `/api/v1/listings/${listingId}/`
              );

              if (response.success) {
                Alert.alert("Success", "Listing deleted successfully", [
                  {
                    text: "OK",
                    onPress: () => router.replace("/(tabs)/(sell)/sell"),
                  },
                ]);
              } else {
                throw new Error("Failed to delete listing");
              }
            } catch (error) {
              Alert.alert("Error", "Failed to delete listing. Please try again.");
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { label: "Draft", color: colors.neutral500, bg: colors.neutral100 },
      PENDING: { label: "Pending Review", color: colors.warning, bg: colors.warning + "20" },
      ACTIVE: { label: "Active", color: colors.success, bg: colors.success + "20" },
      REJECTED: { label: "Rejected", color: colors.error, bg: colors.error + "20" },
      EXPIRED: { label: "Expired", color: colors.neutral500, bg: colors.neutral100 },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;

    return (
      <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
        <Typo size={12} fontWeight="600" color={config.color}>
          {config.label}
        </Typo>
      </View>
    );
  };

  const formatPrice = () => {
    if (!listing) return "";

    if (listing.price_type === "ON_REQUEST") {
      return "Price on Request";
    }

    if (listing.price_type === "FIXED") {
      return `${listing.currency} ${parseFloat(listing.price || "0").toLocaleString()}${
        listing.is_price_negotiable ? " (Negotiable)" : ""
      }`;
    }

    if (listing.price_type === "RANGE") {
      return `${listing.currency} ${parseFloat(
        listing.price_min || "0"
      ).toLocaleString()} - ${parseFloat(listing.price_max || "0").toLocaleString()}${
        listing.is_price_negotiable ? " (Negotiable)" : ""
      }`;
    }

    return "";
  };

  // Helper function to get the best available image URL from an image group
  const getImageUrl = (imageGroup: ListingImageGroup, preferredVariant: 'large' | 'medium' | 'thumb' = 'large'): string => {
    // Try to get the preferred variant first
    if (preferredVariant === 'large' && imageGroup.large) {
      return imageGroup.large.image;
    }
    if (preferredVariant === 'medium' && imageGroup.medium) {
      return imageGroup.medium.image;
    }
    if (preferredVariant === 'thumb' && imageGroup.thumb) {
      return imageGroup.thumb.image;
    }
    
    // Fallback: try to get any available variant
    if (imageGroup.large) return imageGroup.large.image;
    if (imageGroup.medium) return imageGroup.medium.image;
    if (imageGroup.thumb) return imageGroup.thumb.image;
    
    // Return empty string if no images available
    return '';
  };

  // Get unique images (remove duplicates based on image URL)
  const getUniqueImages = (images: ListingImageGroup[]): ListingImageGroup[] => {
    const seen = new Set<string>();
    return images.filter(imageGroup => {
      const url = getImageUrl(imageGroup, 'thumb');
      if (!url || seen.has(url)) {
        return false;
      }
      seen.add(url);
      return true;
    });
  };

  if (isLoading) {
    return (
      <ScreenWrapper>
        <StatusBar style="dark" />
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Typo size={16} color={colors.neutral500} style={{ marginTop: 16 }}>
            Loading listing...
          </Typo>
        </View>
      </ScreenWrapper>
    );
  }

  if (!listing) {
    return (
      <ScreenWrapper>
        <StatusBar style="dark" />
        <View style={[styles.container, styles.centerContent]}>
          <Ionicons name="alert-circle" size={48} color={colors.neutral400} />
          <Typo size={16} color={colors.neutral500} style={{ marginTop: 16 }}>
            Listing not found
          </Typo>
          <TouchableOpacity
            style={styles.backButtonCentered}
            onPress={() => router.back()}
          >
            <Typo size={14} fontWeight="600" color={colors.primary}>
              Go Back
            </Typo>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  // Get unique images to display
  const uniqueImages = getUniqueImages(listing.images);

  return (
    <ScreenWrapper>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.black} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Typo size={18} fontWeight="700" color={colors.black}>
              Listing Details
            </Typo>
          </View>
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => {
              Alert.alert("Actions", "Choose an action", [
                {
                  text: "Edit",
                  onPress: handleEdit,
                },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: handleDelete,
                },
                {
                  text: "Cancel",
                  style: "cancel",
                },
              ]);
            }}
          >
            <Ionicons name="ellipsis-vertical" size={24} color={colors.black} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Image Gallery */}
          {uniqueImages.length > 0 && (
            <View style={styles.imageGalleryContainer}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  const newIndex = Math.round(
                    event.nativeEvent.contentOffset.x / SCREEN_WIDTH
                  );
                  setCurrentImageIndex(newIndex);
                }}
              >
                {uniqueImages.map((imageGroup, index) => {
                  const imageUrl = getImageUrl(imageGroup, 'large');
                  if (!imageUrl) return null;
                  
                  return (
                    <View key={`image-${index}-${imageUrl}`} style={styles.imageSlide}>
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.listingImage}
                        contentFit="cover"
                        placeholder={getImageUrl(imageGroup, 'thumb')}
                        transition={200}
                      />
                    </View>
                  );
                })}
              </ScrollView>

              {/* Image Pagination Dots */}
              {uniqueImages.length > 1 && (
                <View style={styles.paginationDots}>
                  {uniqueImages.map((_, index) => (
                    <View
                      key={`dot-${index}`}
                      style={[
                        styles.dot,
                        currentImageIndex === index && styles.dotActive,
                      ]}
                    />
                  ))}
                </View>
              )}

              {/* Image Counter */}
              <View style={styles.imageCounter}>
                <Typo size={12} fontWeight="600" color={colors.white}>
                  {currentImageIndex + 1} / {uniqueImages.length}
                </Typo>
              </View>
            </View>
          )}

          {/* No Images Placeholder */}
          {uniqueImages.length === 0 && (
            <View style={styles.noImageContainer}>
              <Ionicons name="image-outline" size={64} color={colors.neutral300} />
              <Typo size={14} color={colors.neutral500} style={{ marginTop: 12 }}>
                No images available
              </Typo>
            </View>
          )}

          {/* Status and Stats */}
          <View style={styles.statusContainer}>
            {getStatusBadge(listing.status)}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="eye-outline" size={16} color={colors.neutral500} />
                <Typo size={13} color={colors.neutral600} style={{ marginLeft: 4 }}>
                  {listing.views_count} views
                </Typo>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="call-outline" size={16} color={colors.neutral500} />
                <Typo size={13} color={colors.neutral600} style={{ marginLeft: 4 }}>
                  {listing.contact_count} contacts
                </Typo>
              </View>
            </View>
          </View>

          {/* Merchant Info */}
          <View style={styles.section}>
            <View style={styles.merchantRow}>
              <View style={styles.merchantAvatar}>
                {listing.merchant.logo ? (
                  <Image
                    source={{ uri: listing.merchant.logo }}
                    style={styles.merchantLogo}
                    contentFit="cover"
                  />
                ) : (
                  <Ionicons name="star-outline" size={24} color={colors.primary} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.merchantNameRow}>
                  <Typo size={15} fontWeight="600" color={colors.black}>
                    {listing.merchant.display_name}
                  </Typo>
                  {listing.merchant.verified && (
                    <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginLeft: 4 }} />
                  )}
                </View>
                {listing.merchant.business_name && (
                  <Typo size={12} color={colors.neutral500}>
                    {listing.merchant.business_name}
                  </Typo>
                )}
                {listing.merchant.rating > 0 && (
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color={colors.warning} />
                    <Typo size={12} color={colors.neutral600} style={{ marginLeft: 4 }}>
                      {listing.merchant.rating.toFixed(1)} ({listing.merchant.total_reviews} reviews)
                    </Typo>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Typo size={22} fontWeight="700" color={colors.black}>
              {listing.title}
            </Typo>
          </View>

          {/* Price */}
          <View style={styles.section}>
            <Typo size={24} fontWeight="700" color={colors.primary}>
              {formatPrice()}
            </Typo>
          </View>

          {/* Category and Type */}
          <View style={styles.section}>
            <View style={styles.infoRow}>
              <Ionicons name="grid-outline" size={20} color={colors.neutral600} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Typo size={12} color={colors.neutral500}>
                  Category
                </Typo>
                <Typo size={15} fontWeight="600" color={colors.black}>
                  {listing.category.name}
                </Typo>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="pricetag-outline" size={20} color={colors.neutral600} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Typo size={12} color={colors.neutral500}>
                  Type
                </Typo>
                <Typo size={15} fontWeight="600" color={colors.black}>
                  {listing.listing_type === "PRODUCT" ? "Product" : "Service"}
                </Typo>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Typo size={16} fontWeight="600" color={colors.black}>
              Description
            </Typo>
            <Typo
              size={14}
              color={colors.neutral700}
              style={{ marginTop: 8, lineHeight: 22 }}
            >
              {listing.description}
            </Typo>
          </View>

          {/* Tags */}
          {listing.tags.length > 0 && (
            <View style={styles.section}>
              <Typo size={16} fontWeight="600" color={colors.black}>
                Tags
              </Typo>
              <View style={styles.tagsContainer}>
                {listing.tags.map((tag) => (
                  <View key={tag.id} style={styles.tag}>
                    <Typo size={13} color={colors.neutral700}>
                      {tag.name}
                    </Typo>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Rejection Reason (if rejected) */}
          {listing.status === "REJECTED" && listing.rejection_reason && (
            <View style={styles.rejectionBox}>
              <View style={styles.rejectionHeader}>
                <Ionicons name="close-circle" size={20} color={colors.error} />
                <Typo
                  size={14}
                  fontWeight="600"
                  color={colors.error}
                  style={{ marginLeft: 8 }}
                >
                  Rejection Reason
                </Typo>
              </View>
              <Typo size={14} color={colors.neutral700} style={{ marginTop: 8 }}>
                {listing.rejection_reason}
              </Typo>
            </View>
          )}

          {/* Pending Review Info */}
          {listing.status === "PENDING" && (
            <View style={styles.infoBox}>
              <Ionicons name="time-outline" size={20} color={colors.warning} />
              <Typo
                size={13}
                color={colors.neutral700}
                style={{ marginLeft: 8, flex: 1 }}
              >
                Your listing is currently under review. This usually takes 24-48
                hours. You'll be notified once it's approved.
              </Typo>
            </View>
          )}

          {/* Timestamps */}
          <View style={styles.timestampContainer}>
            <Typo size={12} color={colors.neutral500}>
              Created: {new Date(listing.created_at).toLocaleDateString()} at{" "}
              {new Date(listing.created_at).toLocaleTimeString()}
            </Typo>
            <Typo size={12} color={colors.neutral500} style={{ marginTop: 4 }}>
              Updated: {new Date(listing.updated_at).toLocaleDateString()} at{" "}
              {new Date(listing.updated_at).toLocaleTimeString()}
            </Typo>
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacingX._16,
    paddingTop: spacingY._20,
    paddingBottom: spacingY._16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
  },
  backButton: {
    marginRight: spacingX._12,
  },
  headerTextContainer: {
    flex: 1,
  },
  moreButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: spacingY._40,
  },
  imageGalleryContainer: {
    position: "relative",
  },
  imageSlide: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: colors.neutral50,
  },
  listingImage: {
    width: "100%",
    height: "100%",
  },
  noImageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.6,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.neutral50,
  },
  paginationDots: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white + "60",
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.white,
  },
  imageCounter: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacingX._16,
    paddingVertical: spacingY._16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  section: {
    paddingHorizontal: spacingX._16,
    paddingVertical: spacingY._16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral100,
  },
  merchantRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  merchantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  merchantLogo: {
    width: "100%",
    height: "100%",
  },
  merchantNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacingY._16,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacingX._8,
    marginTop: spacingY._12,
  },
  tag: {
    paddingHorizontal: spacingX._12,
    paddingVertical: spacingY._6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.neutral100,
    borderWidth: 1,
    borderColor: colors.neutral200,
  },
  rejectionBox: {
    marginHorizontal: spacingX._16,
    marginVertical: spacingY._16,
    padding: spacingX._16,
    backgroundColor: colors.error + "10",
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error + "40",
  },
  rejectionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: spacingX._16,
    marginVertical: spacingY._16,
    padding: spacingX._16,
    backgroundColor: colors.warning + "10",
    borderRadius: borderRadius.md,
  },
  timestampContainer: {
    paddingHorizontal: spacingX._16,
    paddingVertical: spacingY._16,
  },
  backButtonCentered: {
    marginTop: spacingY._20,
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._20,
  },
});