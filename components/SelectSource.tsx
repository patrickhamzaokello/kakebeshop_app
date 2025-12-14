import { colors } from "@/constants/theme";
import { getAllSources, followNewsSource, unfollowNewsSource } from "@/utils/apiEndpoints";
import React, { useEffect, useState, useCallback } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from "react-native";
import Typo from "./Typo";
import { Category } from "@/utils/types"; // Assuming this will be updated to Source type
import { useAuthStore } from "@/utils/authStore";

// Update this interface to match your Source type
interface Source {
  id: number;
  name: string;
  link: string;
  isFollowing?: boolean; // Add this field to track follow status
}

const SourceCard = React.memo(
  ({
    source,
    onFollowToggle,
    isLoading,
  }: {
    source: Source;
    onFollowToggle: (sourceId: string, isCurrentlyFollowing: boolean) => void;
    isLoading: boolean;
  }) => {
    const handleLinkPress = async () => {
      try {
        await Linking.openURL(source.link);
      } catch (error) {
        console.error("Error opening link:", error);
      }
    };

    const handleFollowPress = () => {
      onFollowToggle(source.id.toString(), source.isFollowing || false);
    };

    return (
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Typo size={18} fontWeight="700" color={colors.matteBlack}>
              {source.name}
            </Typo>
            <Pressable
              style={[
                styles.followButton,
                source.isFollowing && styles.followingButton,
                isLoading && styles.followButtonDisabled,
              ]}
              onPress={handleFollowPress}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Typo
                  size={14}
                  fontWeight="600"
                  color={source.isFollowing ? colors.matteBlack : colors.white}
                >
                  {source.isFollowing ? "Following" : "Follow"}
                </Typo>
              )}
            </Pressable>
          </View>
          
         
          
          <Pressable style={styles.linkButton} onPress={handleLinkPress}>
            <Typo size={14} fontWeight="500" color="#0066CC">
              Visit Source →
            </Typo>
          </Pressable>
        </View>
      </View>
    );
  }
);

interface SourceData {
  count: number;
  next: string | null;
  previous: string | null;
  results: Source[];
}

const SelectNewsSource = () => {
  const [allSources, setAllSources] = useState<Source[]>([]);
  const [followingSourceIds, setFollowingSourceIds] = useState<Set<string>>(new Set());
  const [loadingSourceIds, setLoadingSourceIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
   const [isContinueLoading, setIsContinueLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { resetOnboarding, completeOnboarding } = useAuthStore();

  const fetchSources = async (page: number, url?: string) => {
    try {
      const data: SourceData = await getAllSources(page);
      return data || null;
    } catch (error) {
      throw error;
    }
  };

  const loadInitialSources = useCallback(async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      const data = await fetchSources(1);
      if (data) {
        // Map the data to include follow status
        const sourcesWithFollowStatus = data.results.map(source => ({
          ...source,
          isFollowing: followingSourceIds.has(source.id.toString())
        }));
        setAllSources(sourcesWithFollowStatus);
        setNextUrl(data.next);
        setCurrentPage(1);
        setHasMore(!!data.next);
      }
    } catch (error) {
      console.error("Error loading sources:", error);
      setHasError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const loadMoreSources = useCallback(async () => {
    if (!nextUrl || isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      const data = await fetchSources(currentPage + 1, nextUrl);
      if (data) {
        const sourcesWithFollowStatus = data.results.map(source => ({
          ...source,
          isFollowing: followingSourceIds.has(source.id.toString())
        }));
        setAllSources((prev) => [...prev, ...sourcesWithFollowStatus]);
        setNextUrl(data.next);
        setCurrentPage((prev) => prev + 1);
        setHasMore(!!data.next);
      }
    } catch (error) {
      console.error("Error loading more sources:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextUrl, isLoadingMore, hasMore, currentPage]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadInitialSources();
  }, [loadInitialSources]);

  const handleFollowToggle = useCallback(async (sourceId: string, isCurrentlyFollowing: boolean) => {
    try {
      // Add to loading set
      setLoadingSourceIds(prev => new Set([...prev, sourceId]));
      
      // Optimistically update UI
      setAllSources(prev => 
        prev.map(source => 
          source.id.toString() === sourceId 
            ? { ...source, isFollowing: !isCurrentlyFollowing }
            : source
        )
      );
      
      setFollowingSourceIds(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyFollowing) {
          newSet.delete(sourceId);
        } else {
          newSet.add(sourceId);
        }
        return newSet;
      });

      // Make API call
      if (isCurrentlyFollowing) {
        await unfollowNewsSource(sourceId);
      } else {
        await followNewsSource(sourceId);
      }
    } catch (error) {
      console.error("Error toggling follow status:", error);
      
      // Revert optimistic update on error
      setAllSources(prev => 
        prev.map(source => 
          source.id.toString() === sourceId 
            ? { ...source, isFollowing: isCurrentlyFollowing }
            : source
        )
      );
      
      setFollowingSourceIds(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyFollowing) {
          newSet.add(sourceId);
        } else {
          newSet.delete(sourceId);
        }
        return newSet;
      });
    } finally {
      // Remove from loading set
      setLoadingSourceIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(sourceId);
        return newSet;
      });
    }
  }, []);

  useEffect(() => {
    loadInitialSources();
  }, [loadInitialSources]);

  const onEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore && !isRefreshing) {
      loadMoreSources();
    }
  }, [hasMore, isLoadingMore, isRefreshing, loadMoreSources]);

  const renderSource = useCallback(
    ({ item: source }: { item: Source }) => (
      <SourceCard
        source={source}
        onFollowToggle={handleFollowToggle}
        isLoading={loadingSourceIds.has(source.id.toString())}
      />
    ),
    [handleFollowToggle, loadingSourceIds]
  );

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="large" color={colors.matteBlack} />
        <Typo size={16} fontWeight="400" color={colors.matteBlack}>
          Loading more sources...
        </Typo>
      </View>
    );
  }, [isLoadingMore]);

  const renderHeader = useCallback(
    () => (
      <View style={styles.header}>
        <Typo size={30} fontWeight="800" color={colors.matteBlack}>
          Discover News Sources
        </Typo>
        <Typo
          size={16}
          fontWeight="400"
          color={colors.matteBlack}
          style={styles.subtitle}
        >
          Follow your favorite news sources to stay updated with the latest stories.
        </Typo>
      </View>
    ),
    []
  );

  const renderEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Typo>No sources available</Typo>
      </View>
    ),
    []
  );

  const handleContinue = async () => {
      try {
        setIsContinueLoading(true);
        // Handle continue action with selected categories
        completeOnboarding();
  
      } catch (error) {
        console.error("Error posting favourite categories:", error);
      } finally {
  
        setIsContinueLoading(false);
      }
    };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.matteBlack} />
        <Typo size={16} fontWeight="400" color={colors.matteBlack}>
          Loading sources...
        </Typo>
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Typo size={18} fontWeight="600" color={colors.matteBlack}>
          Failed to load sources
        </Typo>
        <Typo size={14} fontWeight="400" color={colors.matteBlack} style={styles.errorMessage}>
          Something went wrong while fetching sources. Please try again.
        </Typo>
        <Pressable style={styles.retryButton} onPress={loadInitialSources}>
          <Typo size={16} fontWeight="600" color={colors.white}>
            Retry
          </Typo>
        </Pressable>
      </View>
    );
  }

  const isContinueDisabled = isRefreshing || isContinueLoading;

  return (
    <View style={styles.container}>
      <FlatList
        data={allSources}
        renderItem={renderSource}
        keyExtractor={(item) => item.id.toString()}
        style={styles.flatList}
        contentContainerStyle={styles.contentContainer}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyComponent}
        showsVerticalScrollIndicator={false}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={100}
        initialNumToRender={10}
        windowSize={10}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.matteBlack]}
            tintColor={colors.matteBlack}
          />
        }
      />
      <View style={styles.footer}>
        <Pressable
          style={[
            styles.continueButton,
            isContinueDisabled && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={isContinueDisabled}
        >
          {isContinueLoading ? (
            <>
              <ActivityIndicator size="small" color={colors.white} />
              <Typo size={18} fontWeight="600" color={colors.white}>
                Loading...
              </Typo>
            </>
          ) : (
            <>
              <Typo size={18} fontWeight="600" color={colors.white}>
                Continue
              </Typo>
              <Typo size={18} fontWeight="600" color={colors.white}>
                →
              </Typo>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  flatList: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 30,
    paddingBottom: 40,
    alignItems: "flex-start",
    width: "100%",
  },
  subtitle: {
    marginTop: 12,
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: colors.white,
  },
  continueButton: {
    backgroundColor: colors.black,
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  continueButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,

  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  description: {
    marginBottom: 16,
    lineHeight: 20,
  },
  linkButton: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  followButton: {
    backgroundColor: colors.black,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  followingButton: {
    backgroundColor: "#C8FF42",
    borderWidth: 1,
    borderColor: "#C8FF42",
  },
  followButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
    gap: 10,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: "center",
    backgroundColor: colors.white,
    gap: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
    backgroundColor: colors.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    gap: 16,
  },
  errorMessage: {
    textAlign: "center",
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: colors.black,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
  },
});

export default SelectNewsSource;