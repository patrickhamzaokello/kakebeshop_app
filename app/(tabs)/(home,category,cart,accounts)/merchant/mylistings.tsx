import { StyleSheet, TouchableOpacity, View,Text } from "react-native";
import { DetailHeaderSection } from "@/components/test/DetailHeader";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StatusBar } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { Listing } from "@/utils/types/models";
import apiService from "@/utils/apiBase";
import Typo from "@/components/Typo";
import MyListings from "@/components/MyListings";
import CustomButton from "@/components/CustomButton";
import { Ionicons } from "@expo/vector-icons";

interface PaginatedResponse {
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  page_size: number;
  results: Listing[];
}

export default function MerchantListings() {
  const router = useRouter();
  const { isDark, colors } = useTheme();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(isDark ? "light-content" : "dark-content");
    }, [isDark])
  );

  useEffect(() => {
    loadListings(1, true);
  }, []);

  const loadListings = async (page: number, isInitial: boolean = false, isRefresh: boolean = false) => {
    try {
      setError(false);
      if (isInitial) {
        setIsLoading(true);
      } else if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await apiService.get<PaginatedResponse>(
        `api/v1/listings/my_listings/?page=${page}`
      );

      if (response.success && response.data) {
        const { results, next, current_page } = response.data;
        
        if (isInitial || isRefresh) {
          setListings(results);
        } else {
          setListings(prev => [...prev, ...results]);
        }
        
        setCurrentPage(current_page);
        setHasMore(next !== null);
      } else {
        throw new Error("Failed to load listings");
      }
    } catch (error) {
      if (__DEV__) console.error("Error loading listings:", error);
      setError(true);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      loadListings(currentPage + 1, false);
    }
  };

  const handleListingPress = (listing: Listing) => {
    // Navigate to listing details screen
    router.push({
      pathname: "/listings/[id]",
      params: { id: listing.id }
    });
  };

  const handleRefresh = () => {
    loadListings(1, false, true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DetailHeaderSection
        title="My Listings"
        subheading="Track and manage all listings you placed"
        showBackButton={true}
      />

      {isError && !isLoading && (
        <View style={styles.errorContainer}>
          <Typo style={[styles.errorText, { color: colors.error }]}>
            Error loading listings. Please try again.
          </Typo>
          <TouchableOpacity
            style={[styles.retryRow, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
            onPress={handleRefresh}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textPrimary }}>Retry</Text>
            <Ionicons name="refresh-outline" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}
      
      {!isError && (
        <MyListings
          data={listings}
          loading={isLoading || isLoadingMore}
          hasMore={hasMore}
          refreshing={isRefreshing}
          onLoadMore={handleLoadMore}
          onListingPress={handleListingPress}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  retryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
});