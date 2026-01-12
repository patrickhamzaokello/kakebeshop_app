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

// Interfaces
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
        [{ text: "Go Back", onPress: () => router.back() }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/listings/edit/${listingId}`);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Listing",
      "Are you sure you want to delete this listing? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
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
                  { text: "OK", onPress: () => router.replace("/(tabs)/(sell)/sell") },
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

  const getStatusInfo = (status: string) => {
    const statusMap = {
      DRAFT: { label: "Draft", color: "#64748B" },
      PENDING: { label: "Pending Review", color: "#F59E0B" },
      ACTIVE: { label: "Active", color: "#10B981" },
      REJECTED: { label: "Rejected", color: "#EF4444" },
      EXPIRED: { label: "Expired", color: "#94A3B8" },
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.DRAFT;
  };

  const formatPrice = () => {
    if (!listing) return "";
    if (listing.price_type === "ON_REQUEST") return "Price on Request";
    
    if (listing.price_type === "FIXED") {
      const price = `${listing.currency} ${parseFloat(listing.price || "0").toLocaleString()}`;
      return listing.is_price_negotiable ? `${price} (Negotiable)` : price;
    }
    
    if (listing.price_type === "RANGE") {
      const range = `${listing.currency} ${parseFloat(listing.price_min || "0").toLocaleString()} - ${parseFloat(listing.price_max || "0").toLocaleString()}`;
      return listing.is_price_negotiable ? `${range} (Negotiable)` : range;
    }
    return "";
  };

  const getImageUrl = (imageGroup: ListingImageGroup, variant: 'large' | 'medium' | 'thumb' = 'large'): string => {
    if (variant === 'large' && imageGroup.large) return imageGroup.large.image;
    if (variant === 'medium' && imageGroup.medium) return imageGroup.medium.image;
    if (variant === 'thumb' && imageGroup.thumb) return imageGroup.thumb.image;
    return imageGroup.large?.image || imageGroup.medium?.image || imageGroup.thumb?.image || '';
  };

  const getUniqueImages = (images: ListingImageGroup[]): ListingImageGroup[] => {
    const seen = new Set<string>();
    return images.filter(imageGroup => {
      const url = getImageUrl(imageGroup, 'thumb');
      if (!url || seen.has(url)) return false;
      seen.add(url);
      return true;
    });
  };

  if (isLoading) {
    return (
      <ScreenWrapper>
        <StatusBar style="dark" />
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </ScreenWrapper>
    );
  }

  if (!listing) {
    return (
      <ScreenWrapper>
        <StatusBar style="dark" />
        <View style={[styles.container, styles.centered]}>
          <Typo size={16} color="#64748B">Listing not found</Typo>
          <TouchableOpacity style={styles.textButton} onPress={() => router.back()}>
            <Typo size={15} color="#000">Go Back</Typo>
          </TouchableOpacity>
        </View>
      </ScreenWrapper>
    );
  }

  const uniqueImages = getUniqueImages(listing.images);
  const statusInfo = getStatusInfo(listing.status);

  return (
    <ScreenWrapper>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Typo size={17} fontWeight="600" color="#000">Listing Details</Typo>
        </View>
        <TouchableOpacity 
          onPress={() => {
            Alert.alert("Options", "", [
              { text: "Edit Listing", onPress: handleEdit },
              { text: "Delete Listing", onPress: handleDelete, style: "destructive" },
              { text: "Cancel", style: "cancel" },
            ]);
          }}
          style={styles.headerButton}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        {uniqueImages.length > 0 ? (
          <View style={styles.galleryContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                setCurrentImageIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
              }}
            >
              {uniqueImages.map((imageGroup, index) => {
                const imageUrl = getImageUrl(imageGroup, 'large');
                if (!imageUrl) return null;
                return (
                  <Image
                    key={`img-${index}`}
                    source={{ uri: imageUrl }}
                    style={styles.image}
                    contentFit="cover"
                    placeholder={getImageUrl(imageGroup, 'thumb')}
                  />
                );
              })}
            </ScrollView>
            
            {/* Image Counter */}
            {uniqueImages.length > 1 && (
              <View style={styles.imageCounter}>
                <Typo size={13} color="#000">
                  {currentImageIndex + 1} / {uniqueImages.length}
                </Typo>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.noImagePlaceholder}>
            <Ionicons name="image-outline" size={48} color="#CBD5E1" />
            <Typo size={14} color="#94A3B8" style={{ marginTop: 8 }}>No images</Typo>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Status & Featured */}
          <View style={styles.row}>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '15' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
              <Typo size={13} fontWeight="500" color={statusInfo.color}>
                {statusInfo.label}
              </Typo>
            </View>
            {listing.is_featured && (
              <View style={styles.featuredBadge}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Typo size={13} fontWeight="500" color="#F59E0B" style={{ marginLeft: 4 }}>
                  Featured
                </Typo>
              </View>
            )}
          </View>

          {/* Title & Price */}
          <View style={styles.section}>
            <Typo size={24} fontWeight="700" color="#000" style={{ lineHeight: 32 }}>
              {listing.title}
            </Typo>
            <Typo size={20} fontWeight="600" color="#000" style={{ marginTop: 8 }}>
              {formatPrice()}
            </Typo>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Typo size={24} fontWeight="700" color="#000">{listing.views_count}</Typo>
              <Typo size={13} color="#64748B" style={{ marginTop: 2 }}>Views</Typo>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Typo size={24} fontWeight="700" color="#000">{listing.contact_count}</Typo>
              <Typo size={13} color="#64748B" style={{ marginTop: 2 }}>Contacts</Typo>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Typo size={24} fontWeight="700" color="#000">
                {listing.is_verified ? 'Yes' : 'No'}
              </Typo>
              <Typo size={13} color="#64748B" style={{ marginTop: 2 }}>Verified</Typo>
            </View>
          </View>

          {/* Info Grid */}
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Typo size={13} color="#64748B">Category</Typo>
              <Typo size={15} fontWeight="600" color="#000" style={{ marginTop: 4 }}>
                {listing.category.name}
              </Typo>
            </View>
            <View style={styles.infoItem}>
              <Typo size={13} color="#64748B">Type</Typo>
              <Typo size={15} fontWeight="600" color="#000" style={{ marginTop: 4 }}>
                {listing.listing_type === "PRODUCT" ? "Product" : "Service"}
              </Typo>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Typo size={15} fontWeight="600" color="#000" style={{ marginBottom: 8 }}>
              Description
            </Typo>
            <Typo size={15} color="#475569" style={{ lineHeight: 24 }}>
              {listing.description}
            </Typo>
          </View>

          {/* Tags */}
          {listing.tags.length > 0 && (
            <View style={styles.section}>
              <Typo size={15} fontWeight="600" color="#000" style={{ marginBottom: 8 }}>
                Tags
              </Typo>
              <View style={styles.tagsRow}>
                {listing.tags.map((tag) => (
                  <View key={tag.id} style={styles.tag}>
                    <Typo size={14} color="#475569">{tag.name}</Typo>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Alert Messages */}
          {listing.status === "REJECTED" && listing.rejection_reason && (
            <View style={[styles.alertBox, styles.alertError]}>
              <View style={styles.alertHeader}>
                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                <Typo size={15} fontWeight="600" color="#DC2626" style={{ marginLeft: 8 }}>
                  Rejection Reason
                </Typo>
              </View>
              <Typo size={14} color="#475569" style={{ marginTop: 8, lineHeight: 22 }}>
                {listing.rejection_reason}
              </Typo>
            </View>
          )}

          {listing.status === "PENDING" && (
            <View style={[styles.alertBox, styles.alertWarning]}>
              <View style={styles.alertHeader}>
                <Ionicons name="time-outline" size={20} color="#D97706" />
                <Typo size={15} fontWeight="600" color="#D97706" style={{ marginLeft: 8 }}>
                  Under Review
                </Typo>
              </View>
              <Typo size={14} color="#475569" style={{ marginTop: 8, lineHeight: 22 }}>
                Your listing is being reviewed. This typically takes 24-48 hours.
              </Typo>
            </View>
          )}

          {/* Timestamps */}
          <View style={styles.timestampBox}>
            <View style={styles.timestampRow}>
              <Typo size={13} color="#64748B">Created</Typo>
              <Typo size={13} color="#1E293B">
                {new Date(listing.created_at).toLocaleDateString('en-US', { 
                  month: 'short', day: 'numeric', year: 'numeric' 
                })}
              </Typo>
            </View>
            <View style={[styles.timestampRow, { marginTop: 6 }]}>
              <Typo size={13} color="#64748B">Last Updated</Typo>
              <Typo size={13} color="#1E293B">
                {new Date(listing.updated_at).toLocaleDateString('en-US', { 
                  month: 'short', day: 'numeric', year: 'numeric' 
                })}
              </Typo>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={handleDelete}
              activeOpacity={0.7}
            >
              <Typo size={15} fontWeight="600" color="#DC2626">Delete Listing</Typo>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleEdit}
              activeOpacity={0.8}
            >
              <Typo size={15} fontWeight="600" color="#FFF">Edit Listing</Typo>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  
  // Scroll
  scrollView: {
    flex: 1,
  },
  
  // Gallery
  galleryContainer: {
    position: "relative",
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: "#F8FAFC",
  },
  imageCounter: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  noImagePlaceholder: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.6,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  
  // Content
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  
  // Status
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#FEF3C7",
    marginLeft: 8,
  },
  
  // Stats
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#E2E8F0",
  },
  
  // Info
  infoGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  infoItem: {
    flex: 1,
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
  },
  
  // Tags
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 6,
  },
  
  // Alerts
  alertBox: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  alertError: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  alertWarning: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  
  // Timestamp
  timestampBox: {
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    marginBottom: 24,
  },
  timestampRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  
  // Actions
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    alignItems: "center",
  },
  editButton: {
    flex: 2,
    paddingVertical: 14,
    backgroundColor: "#000",
    borderRadius: 8,
    alignItems: "center",
  },
  
  textButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
});