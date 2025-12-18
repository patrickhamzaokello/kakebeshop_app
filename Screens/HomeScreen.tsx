import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useSectionData } from '@/hooks/useSectionData';
import { homeService } from '@/utils/services/homeService';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from "expo-router";

import { AllListings } from "@/components/test/AllListings";
import { CarouselSection } from "@/components/test/CarouselSection";
import { CategoriesSection } from "@/components/test/CategoriesSection";
import { FeaturedListings } from "@/components/test/FeaturedListings";
import { FeaturedMerchants } from "@/components/test/FeaturedMerchants";
import { HeaderSection } from "@/components/test/HeaderSection";

export const HomeScreen: React.FC = () => {
    const router = useRouter();

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
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <HeaderSection
                data={headerData.data}
                loading={headerData.loading}
                onSearch={() => router.push('/search')}
                onWishlistPress={() => router.push('/wishlist')}
                onNotificationPress={() => router.push('/notifications')}
            />

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
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
});