import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import apiService from "@/utils/apiBase";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ImageVariant {
  id: string;
  image: string;
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
  parent_name?: string;
}

interface Tag {
  id: number;
  name: string;
}

interface Listing {
  id: string;
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
  is_featured: boolean;
  images: ListingImageGroup[];
  tags: Tag[];
  views_count: number;
  contact_count: number;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Draft", color: "#6B7280" },
  PENDING: { label: "Pending", color: "#F59E0B" },
  ACTIVE: { label: "Active", color: "#10B981" },
  REJECTED: { label: "Rejected", color: "#EF4444" },
  EXPIRED: { label: "Expired", color: "#6B7280" },
};

export default function ListingDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const res = await apiService.get<Listing>(`/api/v1/listings/${id}/`);
      if (res.success && res.data) {
        setListing(res.data);
      }
    } catch (e) {
      Alert.alert("Error", "Could not load listing", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (group: ListingImageGroup): string => {
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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
  const status = STATUS_MAP[listing.status] || STATUS_MAP.DRAFT;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Listing</Text>
          <View style={styles.headerBtn} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Image */}
        {images.length > 0 ? (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(
                  e.nativeEvent.contentOffset.x / SCREEN_WIDTH
                );
                setImageIndex(index);
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

        {/* Content */}
        <View style={styles.content}>
          {/* Status */}
          <View style={styles.statusRow}>
            <View style={[styles.statusPill, { backgroundColor: status.color }]}>
              <Text style={styles.statusText}>{status.label}</Text>
            </View>
            {listing.is_featured && (
              <View style={styles.featuredPill}>
                <Text style={styles.featuredText}>Featured</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={styles.title}>{listing.title}</Text>

          {/* Price */}
          <Text style={styles.price}>{formatPrice()}</Text>
          {listing.is_price_negotiable && listing.price_type !== "ON_REQUEST" && (
            <Text style={styles.negotiable}>Negotiable</Text>
          )}

          {/* Rejection reason */}
          {listing.status === "REJECTED" && listing.rejection_reason && (
            <View style={styles.rejectionBox}>
              <Text style={styles.rejectionTitle}>Rejection reason</Text>
              <Text style={styles.rejectionText}>{listing.rejection_reason}</Text>
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{listing.views_count}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{listing.contact_count}</Text>
              <Text style={styles.statLabel}>Inquiries</Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{listing.category.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>
                {listing.listing_type === "PRODUCT" ? "Product" : "Service"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Created</Text>
              <Text style={styles.detailValue}>{formatDate(listing.created_at)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Updated</Text>
              <Text style={styles.detailValue}>{formatDate(listing.updated_at)}</Text>
            </View>
            {listing.is_verified && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Verified</Text>
                <Text style={styles.detailValue}>Yes</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>

          {/* Tags */}
          {listing.tags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tags}>
                {listing.tags.map((tag) => (
                  <View key={tag.id} style={styles.tag}>
                    <Text style={styles.tagText}>{tag.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 52,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
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
    height: SCREEN_WIDTH * 0.6,
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

  // Status
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fff",
  },
  featuredPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "#FEF3C7",
  },
  featuredText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#D97706",
  },

  // Title & Price
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    lineHeight: 28,
  },
  price: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginTop: 8,
  },
  negotiable: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },

  // Rejection
  rejectionBox: {
    marginTop: 16,
    padding: 14,
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
  },
  rejectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DC2626",
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 14,
    color: "#7F1D1D",
    lineHeight: 20,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    marginTop: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },
  statLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
  },

  // Section
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },

  // Details
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailLabel: {
    fontSize: 15,
    color: "#6B7280",
  },
  detailValue: {
    fontSize: 15,
    color: "#000",
    fontWeight: "500",
  },

  // Description
  description: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
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
    fontSize: 14,
    color: "#374151",
  },
});
