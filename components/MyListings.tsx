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
} from "react-native";
import Typo from "@/components/Typo";
import { Listing } from "@/utils/types/models";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 48) / 2; // 2 columns with padding

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
  const renderListingItem = ({ item }: { item: Listing }) => {
    const firstImage = item.images?.[0];
    const imageUrl = firstImage?.medium?.image || firstImage?.thumb?.image;

    return (
      <TouchableOpacity
        style={styles.listingCard}
        onPress={() => onListingPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.listingImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.listingImage, styles.placeholderImage]}>
              <Typo style={styles.placeholderText}>No Image</Typo>
            </View>
          )}
          
          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              item.status === "ACTIVE"
                ? styles.activeBadge
                : styles.inactiveBadge,
            ]}
          >
            <Typo style={styles.statusText}>
              {item.status === "ACTIVE" ? "Active" : "Inactive"}
            </Typo>
          </View>

          {/* Featured Badge */}
          {item.is_featured && (
            <View style={styles.featuredBadge}>
              <Typo style={styles.featuredText}>★ Featured</Typo>
            </View>
          )}
        </View>

        <View style={styles.listingDetails}>
     
          <Typo style={styles.categoryText}>{item.category.name}</Typo>

          <Typo style={styles.listingTitle} numberOfLines={2}>
            {item.title}
          </Typo>
          <Typo style={styles.listingPrice}>
            {item.currency} {parseFloat(item.price).toLocaleString()}
            {item.is_price_negotiable && (
              <Typo style={styles.negotiableText}> (Negotiable)</Typo>
            )}
          </Typo>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Typo style={styles.statLabel}>Views</Typo>
              <Typo style={styles.statValue}>{item.views_count}</Typo>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Typo style={styles.statLabel}>Contacts</Typo>
              <Typo style={styles.statValue}>{item.contact_count}</Typo>
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
        <ActivityIndicator size="small" color="#007AFF" />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Typo style={styles.emptyTitle}>No Listings Yet</Typo>
        <Typo style={styles.emptyText}>
          You haven't created any listings yet. Start by creating your first
          listing to showcase your products or services.
        </Typo>
      </View>
    );
  };

  const handleEndReached = () => {
    if (!loading && hasMore) {
      onLoadMore();
    }
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
          tintColor="#007AFF"
          colors={["#007AFF"]}
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
    marginBottom: 16,
  },
  listingCard: {
    width: ITEM_WIDTH,
    borderRadius: 8,
    overflow: "hidden",
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
  placeholderImage: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 12,
    color: "#999",
  },
  statusBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeBadge: {
    backgroundColor: "#34C759",
  },
  inactiveBadge: {
    backgroundColor: "#FF3B30",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#fff",
  },
  featuredBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#FFD700",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featuredText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#000",
  },
  listingDetails: {
    padding: 12,
    backgroundColor:"#FFF"
  },
  listingTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#007AFF",
    marginBottom: 8,
  },
  negotiableText: {
    fontSize: 11,
    fontWeight: "400",
    color: "#666",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#f8f8f8",
    borderRadius: 6,
    padding: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#ddd",
  },
  statLabel: {
    fontSize: 10,
    color: "#666",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  categoryText: {
    fontSize: 11,
    color: "#666",
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default MyListings;