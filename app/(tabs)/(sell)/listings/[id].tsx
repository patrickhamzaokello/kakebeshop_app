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
import { merchantBase } from "@/utils/services/merchantService";
import { useTheme } from "@/contexts/ThemeContext";

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
  const [deleting, setDeleting] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const { colors, isDark } = useTheme();

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

  const handleDelete = () => {
    Alert.alert(
      "Delete Listing",
      "Are you sure you want to delete this listing? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            const ok = await merchantBase.deleteListing(id as string);
            setDeleting(false);
            if (ok) {
              router.replace("/merchant/mylistings");
            } else {
              Alert.alert("Error", "Failed to delete listing. Please try again.");
            }
          },
        },
      ]
    );
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
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ActivityIndicator size="small" color={colors.textPrimary} />
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Text style={[styles.errorText, { color: colors.textMuted }]}>Listing not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.linkText, { color: colors.textPrimary }]}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = listing.images.filter((img) => getImageUrl(img));
  const status = STATUS_MAP[listing.status] || STATUS_MAP.DRAFT;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <SafeAreaView edges={["top"]} style={[styles.headerSafe, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Listing</Text>
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.headerBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            )}
          </TouchableOpacity>
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
                  style={[styles.image, { backgroundColor: colors.backgroundSecondary }]}
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
          <View style={[styles.noImage, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="image-outline" size={40} color={colors.neutral300} />
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
              <View style={[styles.featuredPill, { backgroundColor: colors.warningLight }]}>
                <Text style={[styles.featuredText, { color: colors.warningDark }]}>Featured</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>{listing.title}</Text>

          {/* Price */}
          <Text style={[styles.price, { color: colors.textPrimary }]}>{formatPrice()}</Text>
          {listing.is_price_negotiable && listing.price_type !== "ON_REQUEST" && (
            <Text style={[styles.negotiable, { color: colors.textMuted }]}>Negotiable</Text>
          )}

          {/* Rejection reason */}
          {listing.status === "REJECTED" && listing.rejection_reason && (
            <View style={[styles.rejectionBox, { backgroundColor: colors.errorLight }]}>
              <Text style={[styles.rejectionTitle, { color: colors.errorDark }]}>Rejection reason</Text>
              <Text style={[styles.rejectionText, { color: colors.error }]}>{listing.rejection_reason}</Text>
            </View>
          )}

          {/* Stats */}
          <View style={[styles.statsRow, { borderColor: colors.border }]}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{listing.views_count}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Views</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{listing.contact_count}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Inquiries</Text>
            </View>
          </View>

          {/* Details */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Details</Text>
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Category</Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{listing.category.name}</Text>
            </View>
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Type</Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                {listing.listing_type === "PRODUCT" ? "Product" : "Service"}
              </Text>
            </View>
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Created</Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{formatDate(listing.created_at)}</Text>
            </View>
            <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Updated</Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{formatDate(listing.updated_at)}</Text>
            </View>
            {listing.is_verified && (
              <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Verified</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>Yes</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Description</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>{listing.description}</Text>
          </View>

          {/* Tags */}
          {listing.tags.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Tags</Text>
              <View style={styles.tags}>
                {listing.tags.map((tag) => (
                  <View key={tag.id} style={[styles.tag, { backgroundColor: colors.backgroundSecondary }]}>
                    <Text style={[styles.tagText, { color: colors.textSecondary }]}>{tag.name}</Text>
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
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
  },
  linkText: {
    fontSize: 16,
    marginTop: 12,
  },

  // Header
  headerSafe: {},
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 52,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
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
  },

  // Scroll
  scroll: {
    flex: 1,
  },

  // Image
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },
  noImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.6,
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
  },
  featuredText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Title & Price
  title: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
  },
  price: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 8,
  },
  negotiable: {
    fontSize: 14,
    marginTop: 4,
  },

  // Rejection
  rejectionBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 8,
  },
  rejectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 14,
    lineHeight: 20,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    marginTop: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
  },

  // Section
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },

  // Details
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 15,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "500",
  },

  // Description
  description: {
    fontSize: 15,
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
    borderRadius: 4,
  },
  tagText: {
    fontSize: 14,
  },
});
