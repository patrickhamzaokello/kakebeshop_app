import React from "react";
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  Text,
} from "react-native";
import { Listing } from "@/utils/types/models";
import { useTheme } from "@/contexts/ThemeContext";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 48) / 2;

interface MyListingsProps {
  data: Listing[];
  loading: boolean;
  hasMore: boolean;
  refreshing?: boolean;
  onLoadMore: () => void;
  onListingPress: (listing: Listing) => void;
  onRefresh: () => void;
}

const MyListings: React.FC<MyListingsProps> = ({
  data,
  loading,
  hasMore,
  refreshing = false,
  onLoadMore,
  onListingPress,
  onRefresh,
}) => {
  const { colors } = useTheme();

  const renderListingItem = ({ item }: { item: Listing }) => {
    const firstImage = item.images?.[0];
    const imageUrl = firstImage?.medium?.image || firstImage?.thumb?.image;

    return (
      <TouchableOpacity
        style={[styles.listingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => onListingPress(item)}
        activeOpacity={0.75}
      >
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.listingImage} resizeMode="cover" />
          ) : (
            <View style={[styles.listingImage, { backgroundColor: colors.backgroundSecondary, justifyContent: "center", alignItems: "center" }]}>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>No Image</Text>
            </View>
          )}

          {/* Status badge */}
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.status === "ACTIVE" ? "#4CAF50" : "#FF3B30" },
          ]}>
            <Text style={styles.badgeText}>
              {item.status === "ACTIVE" ? "Active" : "Inactive"}
            </Text>
          </View>

          {/* Featured badge */}
          {item.is_featured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>★ Featured</Text>
            </View>
          )}
        </View>

        <View style={[styles.listingDetails, { backgroundColor: colors.surface }]}>
          {item.category?.name ? (
            <Text style={[styles.categoryText, { color: colors.textMuted }]}>
              {item.category.name}
            </Text>
          ) : null}

          <Text style={[styles.listingTitle, { color: colors.textPrimary }]} numberOfLines={2}>
            {item.title}
          </Text>

          <Text style={[styles.listingPrice, { color: colors.primary }]}>
            {item.currency} {parseFloat(item.price).toLocaleString()}
            {item.is_price_negotiable && (
              <Text style={[styles.negotiableText, { color: colors.textMuted }]}> · Negotiable</Text>
            )}
          </Text>

          <View style={[styles.statsContainer, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Views</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{item.views_count ?? 0}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Contacts</Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{item.contact_count ?? 0}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Listings Yet</Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          You haven't created any listings yet. Start by creating your first listing to showcase your products or services.
        </Text>
      </View>
    );
  };

  const handleEndReached = () => {
    if (!loading && hasMore) onLoadMore();
  };

  return (
    <FlatList
      data={data}
      renderItem={renderListingItem}
      keyExtractor={(item) => item.id}
      numColumns={2}
      contentContainerStyle={styles.listContainer}
      columnWrapperStyle={styles.columnWrapper}
      showsVerticalScrollIndicator={false}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 14,
  },
  listingCard: {
    width: ITEM_WIDTH,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: ITEM_WIDTH,
  },
  listingImage: {
    width: "100%",
    height: "100%",
  },
  statusBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.2,
  },
  featuredBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#FFD700",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#000",
  },
  listingDetails: {
    padding: 10,
    gap: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  listingTitle: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  listingPrice: {
    fontSize: 14,
    fontWeight: "700",
  },
  negotiableText: {
    fontSize: 11,
    fontWeight: "400",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 8,
    marginTop: 4,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 22,
  },
  statLabel: {
    fontSize: 10,
  },
  statValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 64,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },
});

export default MyListings;
