import React, { useCallback, useState, useRef, useEffect } from "react";
import { Text } from "@/components/Text";
import {
  View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Dimensions, Image, TextInput, Modal, Animated,
  Alert, TouchableWithoutFeedback, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import apiService from "@/utils/apiBase";
import { merchantBase } from "@/utils/services/merchantService";
import { useTheme } from "@/contexts/ThemeContext";
import { Listing as BaseListing } from "@/utils/types/models";

interface Listing extends BaseListing {
  status?: string;
}

const { width: W, height: SCREEN_H } = Dimensions.get("window");
const PAD = 16;
const GAP = 10;
const CARD_W = (W - PAD * 2 - GAP) / 2;
const SHEET_HEIGHT = 300;

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE:   { label: "Active",   color: "#4CAF50", bg: "#4CAF5015" },
  INACTIVE: { label: "Inactive", color: "#FF9800", bg: "#FF980015" },
  PENDING:  { label: "Pending",  color: "#2196F3", bg: "#2196F315" },
  REJECTED: { label: "Rejected", color: "#F44336", bg: "#F4433615" },
  DRAFT:    { label: "Draft",    color: "#9E9E9E", bg: "#9E9E9E15" },
  EXPIRED:  { label: "Expired",  color: "#9E9E9E", bg: "#9E9E9E15" },
};

const FILTER_OPTIONS: { label: string; value: string | null }[] = [
  { label: "All",      value: null },
  { label: "Active",   value: "ACTIVE" },
  { label: "Pending",  value: "PENDING" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Inactive", value: "INACTIVE" },
];

function getStatus(s: string) {
  return STATUS[s] ?? { label: s, color: "#999", bg: "#99991510" };
}

function formatPrice(listing: Listing): string {
  if (listing.price_type === "ON_REQUEST") return "On request";
  if (listing.price_type === "RANGE" && listing.price_min && listing.price_max)
    return `${listing.currency} ${parseInt(listing.price_min).toLocaleString()} – ${parseInt(listing.price_max).toLocaleString()}`;
  if (listing.price_type === "FIXED" && listing.price)
    return `${listing.currency} ${parseInt(listing.price).toLocaleString()}`;
  return "—";
}

function getListingImageUri(item: any): string | null {
  if (item.primary_image?.image) return item.primary_image.image;
  if (item.primary_image?.thumbnail) return item.primary_image.thumbnail;
  const pi = item.primary_image;
  if (pi?.large?.image) return pi.large.image;
  if (pi?.medium?.image) return pi.medium.image;
  if (pi?.thumb?.image) return pi.thumb.image;
  const firstGroup = Array.isArray(item.images) ? item.images[0] : null;
  if (firstGroup?.large?.image) return firstGroup.large.image;
  if (firstGroup?.medium?.image) return firstGroup.medium.image;
  if (firstGroup?.thumb?.image) return firstGroup.thumb.image;
  if (firstGroup?.image) return firstGroup.image;
  if (firstGroup?.thumbnail) return firstGroup.thumbnail;
  return null;
}

// ─── Listing card ─────────────────────────────────────────────────────────────

function ListingCard({
  item,
  colors,
  onPress,
}: {
  item: Listing;
  colors: any;
  onPress: (item: Listing) => void;
}) {
  const status = getStatus(item.status ?? "ACTIVE");
  const imageUri = getListingImageUri(item);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() => onPress(item)}
      activeOpacity={0.82}
    >
      <View style={styles.imageWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="image-outline" size={24} color={colors.textMuted} />
          </View>
        )}
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: status.color }]} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
        {item.is_featured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={9} color="#fff" />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
        {/* Three-dot hint */}
        <View style={styles.moreHint}>
          <Ionicons name="ellipsis-vertical" size={13} color="#fff" />
        </View>
      </View>
      <View style={styles.cardBody}>
        {(item as any).category_name ? (
          <Text style={[styles.category, { color: colors.textMuted }]} numberOfLines={1}>
            {(item as any).category_name}
          </Text>
        ) : null}
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.price, { color: colors.primary }]} numberOfLines={1}>
          {formatPrice(item)}
        </Text>
        <View style={[styles.miniStats, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={styles.miniStat}>
            <Ionicons name="eye-outline" size={11} color={colors.textMuted} />
            <Text style={[styles.miniStatVal, { color: colors.textSecondary }]}>
              {item.views_count ?? 0}
            </Text>
          </View>
          <View style={[styles.miniStatDivider, { backgroundColor: colors.border }]} />
          <View style={styles.miniStat}>
            <Ionicons name="chatbubble-outline" size={11} color={colors.textMuted} />
            <Text style={[styles.miniStatVal, { color: colors.textSecondary }]}>
              {(item as any).contact_count ?? 0}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Shimmer skeleton ─────────────────────────────────────────────────────────

function SkeletonCard({ colors }: { colors: any }) {
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={[styles.imageWrap, { backgroundColor: colors.backgroundSecondary }]} />
      <View style={styles.cardBody}>
        <View style={[styles.skelLine, { width: "60%", backgroundColor: colors.backgroundSecondary }]} />
        <View style={[styles.skelLine, { width: "90%", backgroundColor: colors.backgroundSecondary }]} />
        <View style={[styles.skelLine, { width: "45%", backgroundColor: colors.backgroundSecondary }]} />
      </View>
    </View>
  );
}

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────

function ListingActionSheet({
  listing,
  visible,
  colors,
  onClose,
  onEdit,
  onDelete,
  deleting,
}: {
  listing: Listing | null;
  visible: boolean;
  colors: any;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(SHEET_HEIGHT);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 70,
        friction: 11,
      }).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: SHEET_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(onClose);
  };

  if (!listing) return null;

  const imageUri = getListingImageUri(listing);
  const status = getStatus(listing.status ?? "ACTIVE");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { backgroundColor: colors.surface, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Handle */}
        <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

        {/* Listing preview */}
        <View style={[styles.sheetPreview, { borderBottomColor: colors.border }]}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.sheetThumb} resizeMode="cover" />
          ) : (
            <View style={[styles.sheetThumb, styles.sheetThumbPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="image-outline" size={20} color={colors.textMuted} />
            </View>
          )}
          <View style={styles.sheetPreviewInfo}>
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]} numberOfLines={2}>
              {listing.title}
            </Text>
            <Text style={[styles.sheetPrice, { color: colors.primary }]}>
              {formatPrice(listing)}
            </Text>
            <View style={[styles.sheetStatusPill, { backgroundColor: status.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: status.color }]} />
              <Text style={[styles.sheetStatusText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.sheetActions}>
          <TouchableOpacity
            style={[styles.sheetBtn, styles.sheetBtnEdit, { borderColor: colors.primary }]}
            onPress={onEdit}
            activeOpacity={0.8}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <Text style={[styles.sheetBtnText, { color: colors.primary }]}>Edit Listing</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sheetBtn, styles.sheetBtnDelete]}
            onPress={onDelete}
            activeOpacity={0.8}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={20} color="#fff" />
                <Text style={[styles.sheetBtnText, { color: "#fff" }]}>Delete Listing</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Cancel */}
        <TouchableOpacity
          style={[styles.sheetCancel, { borderTopColor: colors.border }]}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <Text style={[styles.sheetCancelText, { color: colors.textMuted }]}>Cancel</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MerchantListings() {
  const { colors, isDark } = useTheme();

  // List state
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const searchRef = useRef(searchQuery);
  const statusRef = useRef(statusFilter);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bottom sheet state
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchListings = useCallback(
    async (pageNum = 1, append = false, search = "", status: string | null = null) => {
      try {
        setError(false);
        const params = new URLSearchParams({ page: String(pageNum) });
        if (search.trim()) params.append("search", search.trim());
        if (status) params.append("status", status);

        const response = await apiService.get<any>(
          `/api/v1/listings/my_listings/?${params.toString()}`
        );

        if (response.success && response.data) {
          const payload =
            response.data?.results !== undefined
              ? response.data
              : (response.data?.data ?? response.data);

          const results: Listing[] = payload?.results ?? [];
          const next: string | null = payload?.next ?? null;
          setListings((prev) => (append ? [...prev, ...results] : results));
          setHasMore(!!next);
          setPage(pageNum);
        } else {
          throw new Error("Failed");
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setPage(1);
      fetchListings(1, false, searchRef.current, statusRef.current);
    }, [fetchListings])
  );

  // Keep refs in sync for useFocusEffect
  useEffect(() => { searchRef.current = searchQuery; }, [searchQuery]);
  useEffect(() => { statusRef.current = statusFilter; }, [statusFilter]);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      setPage(1);
      fetchListings(1, false, text, statusFilter);
    }, 400);
  };

  const handleStatusFilter = (value: string | null) => {
    setStatusFilter(value);
    setLoading(true);
    setPage(1);
    fetchListings(1, false, searchQuery, value);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings(1, false, searchQuery, statusFilter);
  };

  const onLoadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchListings(page + 1, true, searchQuery, statusFilter);
  };

  // Sheet handlers
  const openSheet = (item: Listing) => {
    setSelectedListing(item);
    setSheetVisible(true);
  };

  const closeSheet = () => {
    setSheetVisible(false);
    setSelectedListing(null);
  };

  const handleEdit = () => {
    if (!selectedListing) return;
    closeSheet();
    router.push({
      pathname: "/merchant/edit-listing",
      params: { id: selectedListing.id },
    });
  };

  const handleDelete = () => {
    if (!selectedListing) return;
    Alert.alert(
      "Delete Listing",
      `Delete "${selectedListing.title}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            const ok = await merchantBase.deleteListing(selectedListing.id);
            setDeleting(false);
            if (ok) {
              closeSheet();
              setListings((prev) => prev.filter((l) => l.id !== selectedListing.id));
            } else {
              Alert.alert("Error", "Failed to delete listing. Please try again.");
            }
          },
        },
      ]
    );
  };

  const resultCount = listings.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.surface }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Listings</Text>
            {!loading && (
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                {resultCount} listing{resultCount !== 1 ? "s" : ""}
                {statusFilter ? ` · ${getStatus(statusFilter).label}` : ""}
              </Text>
            )}
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Search bar */}
        <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.inputBorder }]}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder="Search listings…"
              placeholderTextColor={colors.textPlaceholder}
              value={searchQuery}
              onChangeText={handleSearchChange}
              returnKeyType="search"
              clearButtonMode="while-editing"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && Platform.OS === "android" && (
              <TouchableOpacity onPress={() => handleSearchChange("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Status filter chips */}
        <View style={[styles.filterRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          {FILTER_OPTIONS.map((opt) => {
            const active = statusFilter === opt.value;
            return (
              <TouchableOpacity
                key={String(opt.value)}
                style={[
                  styles.filterChip,
                  { borderColor: active ? colors.primary : colors.border },
                  active && { backgroundColor: colors.primary },
                ]}
                onPress={() => handleStatusFilter(opt.value)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: active ? "#fff" : colors.textSecondary },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>

      {/* Error banner */}
      {error && !loading && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle-outline" size={16} color="#E60549" />
          <Text style={styles.errorText}>Failed to load listings</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Skeleton / list */}
      {loading ? (
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          keyExtractor={(i) => String(i)}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={() => <SkeletonCard colors={colors} />}
          scrollEnabled={false}
        />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={[styles.grid, listings.length === 0 && { flex: 1 }]}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => (
            <ListingCard item={item} colors={colors} onPress={openSheet} />
          )}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ paddingVertical: 16 }}
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.surface }]}>
                <Ionicons
                  name={searchQuery || statusFilter ? "search-outline" : "pricetags-outline"}
                  size={38}
                  color={colors.textMuted}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {searchQuery || statusFilter ? "No results found" : "No listings yet"}
              </Text>
              <Text style={[styles.emptyMsg, { color: colors.textMuted }]}>
                {searchQuery || statusFilter
                  ? "Try a different search or filter"
                  : "Your active listings will appear here"}
              </Text>
            </View>
          }
        />
      )}

      {/* Action bottom sheet */}
      <ListingActionSheet
        listing={selectedListing}
        visible={sheetVisible}
        colors={colors}
        onClose={closeSheet}
        onEdit={handleEdit}
        onDelete={handleDelete}
        deleting={deleting}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  headerSub: { fontSize: 12, textAlign: "center", marginTop: 1 },

  // Search
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 7,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },

  // Filter chips
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Error
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#FFF0F3",
  },
  errorText: { flex: 1, fontSize: 13, color: "#E60549" },
  retryBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: "#E60549" },
  retryText: { fontSize: 12, fontWeight: "700", color: "#fff" },

  // Grid
  grid: { padding: PAD, gap: GAP },
  row: { gap: GAP },

  // Card
  card: {
    width: CARD_W,
    borderRadius: 14,
    overflow: "hidden",
  },
  imageWrap: {
    width: "100%",
    height: CARD_W,
    position: "relative",
  },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },

  statusBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: "700" },

  featuredBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#E60549",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },
  featuredText: { fontSize: 10, fontWeight: "700", color: "#fff" },

  moreHint: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 12,
    padding: 4,
  },

  cardBody: { padding: 10, gap: 3 },
  category: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 },
  title: { fontSize: 12.5, fontWeight: "600", lineHeight: 18 },
  price: { fontSize: 13, fontWeight: "800" },

  miniStats: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    padding: 6,
    marginTop: 4,
  },
  miniStat: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3 },
  miniStatVal: { fontSize: 11, fontWeight: "600" },
  miniStatDivider: { width: 1, height: 16 },

  skelLine: { height: 10, borderRadius: 5, marginBottom: 6 },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  emptyMsg: { fontSize: 13, textAlign: "center", lineHeight: 20 },

  // Bottom sheet
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.48)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === "ios" ? 20 : 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 24,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 14,
  },
  sheetPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  sheetThumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  sheetPreviewInfo: { flex: 1, gap: 4 },
  sheetTitle: { fontSize: 14, fontWeight: "600", lineHeight: 19 },
  sheetPrice: { fontSize: 13, fontWeight: "800" },
  sheetStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  sheetStatusText: { fontSize: 11, fontWeight: "700" },

  sheetActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sheetBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
  },
  sheetBtnEdit: {
    borderWidth: 1.5,
  },
  sheetBtnDelete: {
    backgroundColor: "#E60549",
  },
  sheetBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },

  sheetCancel: {
    marginTop: 10,
    paddingVertical: 14,
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 20,
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
