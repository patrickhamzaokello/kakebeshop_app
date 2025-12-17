import React, { useCallback, useState } from 'react';
import { ScrollView, RefreshControl, StyleSheet, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSectionData } from '@/hooks/useSectionData';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { homeService } from '@/utils/services/homeService';

import { RootStackParamList } from '@/utils/types/navigation';
import {HeaderSection} from "@/components/test/HeaderSection";
import {CarouselSection} from "@/components/test/CarouselSection";
import {AllListings} from "@/components/test/AllListings";
import {ApiResponse} from "@/utils/types";
import {Category, Listing, Merchant} from "@/utils/types/models";
import {useNavigation} from "expo-router";
import {CategoriesSection} from "@/components/test/CategoriesSection";
import {FeaturedMerchants} from "@/components/test/FeaturedMerchants";
import {FeaturedListings} from "@/components/test/FeaturedListings";



type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export const HomeScreen: React.FC = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();

    // Section data hooks
    const headerData = useSectionData(() => homeService.getHeaderData());
    const carouselData = useSectionData(() => homeService.getCarouselImages());
    const categoriesData = useSectionData(() => homeService.getCategories());
    const merchantsData = useSectionData(() => homeService.getFeaturedMerchants(10));
    const featuredData = useSectionData(() => homeService.getFeaturedListings(10));

    // Infinite scroll for all listings
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
        headerData,
        carouselData,
        categoriesData,
        merchantsData,
        featuredData,
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
                onSearch={() => navigation.navigate('Search')}
                onNotificationPress={() => navigation.navigate('Notifications')}
            />

            <CarouselSection data={carouselData.data} loading={carouselData.loading} />

            <CategoriesSection
                data={categoriesData.data}
                loading={categoriesData.loading}
                onCategoryPress={(category) => navigation.navigate('Category', { categoryId: category.id })}
            />

            <FeaturedMerchants
                data={merchantsData.data}
                loading={merchantsData.loading}
                onMerchantPress={(merchant) => navigation.navigate('Merchant', { merchantId: merchant.id })}
            />

            <FeaturedListings
                data={featuredData.data}
                loading={featuredData.loading}
                onListingPress={(listing) =>
                    navigation.navigate('ProductDetail', { listingId: listing.id })
                }
            />

            <AllListings
                data={listings}
                loading={listingsLoading}
                hasMore={hasMore}
                onLoadMore={loadMore}
                onListingPress={(listing) =>
                    navigation.navigate('ProductDetail', { listingId: listing.id })
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


