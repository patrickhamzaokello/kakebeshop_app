import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Keyboard,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { colors, spacingX, spacingY, radius } from "@/constants/theme";
import { Listing } from "@/utils/types/models";
import { ListingImage } from "@/components/test/common/ListingImage";
import { MaterialIcons } from "@expo/vector-icons";
import { QuickViewModal } from "@/components/test/common/QuickViewModal";
import apiService from "@/utils/apiBase";

const ShimmerPlaceholder: React.FC<{ style?: any }> = ({ style }) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          backgroundColor: "#E0E0E0",
          opacity,
        },
        style,
      ]}
    />
  );
};

const ListingShimmerCard = () => (
  <View style={styles.listingCard}>
    <View style={styles.imageContainer}>
      <ShimmerPlaceholder
        style={{
          width: "100%",
          height: 180,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        }}
      />
    </View>
    <View style={styles.listingDescription}>
      <ShimmerPlaceholder
        style={{
          width: "90%",
          height: 14,
          borderRadius: 4,
          marginBottom: 4,
        }}
      />
      <ShimmerPlaceholder
        style={{
          width: "60%",
          height: 12,
          borderRadius: 4,
          marginBottom: 8,
        }}
      />
      <ShimmerPlaceholder
        style={{
          width: "50%",
          height: 16,
          borderRadius: 4,
        }}
      />
    </View>
  </View>
);

export default function SearchPage() {
  const router = useRouter();
  const searchInputRef = useRef<TextInput>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  // Auto-focus the search input when the page mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    Keyboard.dismiss();
    setLoading(true);
    setHasSearched(true);

    try {
      const response = await apiService.get<{ results: Listing[] }>(
        "/api/v1/listings/",
        {
          params: { search: searchQuery.trim() },
        }
      );
      setResults(response.data.results || []);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  const handleBack = () => {
    router.back();
  };

  const handleClear = () => {
    setSearchQuery("");
    setResults([]);
    setHasSearched(false);
    searchInputRef.current?.focus();
  };

  const handleListingPress = (listing: Listing) => {
    router.push({
      pathname: "/listing/[id]",
      params: { id: listing.id },
    });
  };

  const handleQuickView = (listing: Listing) => {
    setSelectedListing(listing);
    setModalVisible(true);
  };

  const renderListingItem = ({ item }: { item: Listing }) => (
    <TouchableOpacity
      style={styles.listingCard}
      onPress={() => handleListingPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <ListingImage
          primaryImage={item.primary_image}
          style={styles.listingImage}
          fallbackSource={require("@/assets/images/placeholder.png")}
        />
        <TouchableOpacity
          style={styles.quickViewButton}
          onPress={() => handleQuickView(item)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.listingDescription}>
        <Text style={styles.listingTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.merchantName} numberOfLines={1}>
          {item.merchant.business_name}
        </Text>
        <Text style={styles.listingPrice}>
          {item.currency} {parseFloat(item.price).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderShimmerGrid = () => (
    <View style={styles.shimmerContainer}>
      <View style={styles.row}>
        <ListingShimmerCard />
        <ListingShimmerCard />
      </View>
      <View style={styles.row}>
        <ListingShimmerCard />
        <ListingShimmerCard />
      </View>
      <View style={styles.row}>
        <ListingShimmerCard />
        <ListingShimmerCard />
      </View>
    </View>
  );

  const renderEmptyState = () => {
    if (!hasSearched) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={64} color={colors.neutral200} />
          <Text style={styles.emptyTitle}>Search for products</Text>
          <Text style={styles.emptySubtitle}>
            Find products, brands, and more
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.neutral300} />
        <Text style={styles.emptyTitle}>No results found</Text>
        <Text style={styles.emptySubtitle}>
          Try a different search term
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {/* Search Header */}
        <View style={styles.searchHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.black} />
          </TouchableOpacity>

          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={colors.neutral400} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search products, brands..."
              placeholderTextColor={colors.neutral400}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="never"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={handleClear} activeOpacity={0.7}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.neutral400}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* Results */}
      <View style={styles.resultsContainer}>
        {loading ? (
          renderShimmerGrid()
        ) : results.length > 0 ? (
          <FlatList
            data={results}
            renderItem={renderListingItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        ) : (
          renderEmptyState()
        )}
      </View>

      <QuickViewModal
        visible={modalVisible}
        listing={selectedListing}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral50,
  },
  safeArea: {
    backgroundColor: colors.white,
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacingX._12,
    paddingVertical: spacingY._10,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.neutral100,
    paddingHorizontal: spacingX._12,
    paddingVertical: spacingY._10,
    borderRadius: radius._8,
    borderWidth: 1,
    borderColor: colors.neutral200,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacingX._10,
    fontSize: 15,
    color: colors.black,
    fontWeight: "500",
    padding: 0,
  },
  resultsContainer: {
    flex: 1,
    padding: spacingX._16,
  },
  listContent: {
    paddingBottom: spacingY._20,
  },
  shimmerContainer: {
    gap: 8,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 8,
  },
  listingCard: {
    width: "48.5%",
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.neutral100,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
  },
  listingImage: {
    width: "100%",
    height: 180,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  quickViewButton: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  listingDescription: {
    padding: 10,
  },
  listingTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    color: colors.black,
  },
  merchantName: {
    fontSize: 12,
    color: colors.neutral500,
    marginBottom: 6,
  },
  listingPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.black,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacingY._60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.neutral600,
    marginTop: spacingY._16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.neutral400,
    marginTop: spacingY._8,
  },
});
