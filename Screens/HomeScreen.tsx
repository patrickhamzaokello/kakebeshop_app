import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useSectionData } from '@/hooks/useSectionData';
import { homeService } from '@/utils/services/homeService';
import React, { useCallback, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from "expo-router";
import { useScrollToTop } from '@react-navigation/native';
import { colors } from '@/constants/theme';

import { AllListings } from "@/components/test/AllListings";
import { CarouselSection } from "@/components/test/CarouselSection";
import { CategoriesSection } from "@/components/test/CategoriesSection";
import { FeaturedListings } from "@/components/test/FeaturedListings";
import { FeaturedMerchants } from "@/components/test/FeaturedMerchants";
import { HeaderSection } from "@/components/test/HeaderSection";

export const HomeScreen: React.FC = () => {
    const router = useRouter();
    const scrollRef = useRef<ScrollView>(null);

    // Scroll to top when home tab is pressed
    useScrollToTop(scrollRef);

    // Section data hooks - inline functions are now safe
    const headerData = useSectionData(() => homeService.getHeaderData());
    const carouselData = useSectionData(() => homeService.getCarouselImages());
    const categoriesData = useSectionData(() => homeService.getCategories());
    const merchantsData = useSectionData(() => homeService.getFeaturedMerchants(10));
    const featuredData = useSectionData(() => homeService.getFeaturedListings(10));

    // Infinite scroll for all listings
    const {
        data: listings,
        loading: listingsLoading,
        hasMore,
        loadMore,
        refresh: refreshListings,
    } = useInfiniteScroll((page, limit) => homeService.getAllListings(page, limit), 10);

    const [refreshing, setRefreshing] = useState<boolean>(false);

    // Pull to refresh all sections
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([
            headerData.refetch(),
            carouselData.refetch(),
            categoriesData.refetch(),
            merchantsData.refetch(),
            featuredData.refetch(),
            refreshListings(),
        ]);
        setRefreshing(false);
    }, [
        headerData.refetch,
        carouselData.refetch,
        categoriesData.refetch,
        merchantsData.refetch,
        featuredData.refetch,
        refreshListings,
    ]);

    return (
        <View style={styles.outerContainer}>
            <ScrollView
                ref={scrollRef}
                style={styles.scrollView}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <HeaderSection
                    data={headerData.data}
                    loading={headerData.loading}
                    onSearch={() => router.push('/category')}
                    onWishlistPress={() => router.push('/wishlist/wishlist')}
                    onNotificationPress={() => router.push('/notification/notifications')}
                />

                <View style={styles.contentContainer}>
                    <CarouselSection data={carouselData.data} loading={carouselData.loading} />

                    <CategoriesSection
                        data={categoriesData.data}
                        loading={categoriesData.loading}
                        onCategoryPress={(category) =>
                            router.push({
                                pathname: '/category/[id]',
                                params: { id: category.id }
                            })
                        }
                    />

                    <FeaturedMerchants
                        data={merchantsData.data}
                        loading={merchantsData.loading}
                        onMerchantPress={(merchant) =>
                            router.push({
                                pathname: '/merchant/[id]',
                                params: { id: merchant.id }
                            })
                        }
                    />

                    <FeaturedListings
                        data={featuredData.data}
                        loading={featuredData.loading}
                        onListingPress={(listing) =>
                            router.push({
                                pathname: '/listing/[id]',
                                params: { id: listing.id }
                            })
                        }
                    />

                    <AllListings
                        data={listings}
                        loading={listingsLoading}
                        hasMore={hasMore}
                        onLoadMore={loadMore}
                        onListingPress={(listing) =>
                            router.push({
                                pathname: '/listing/[id]',
                                params: { id: listing.id }
                            })
                        }
                    />
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        backgroundColor: colors.primarySoft,
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        backgroundColor: '#FFF',
    },
});