import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { Listing } from '@/utils/types/models';
import { SectionHeader } from '@/components/test/common/SectionHeader';
import { ListingImage } from '@/components/test/common/ListingImage'; // Import the new component

interface FeaturedListingsProps {
    data: Listing[] | null;
    loading: boolean;
    onListingPress: (listing: Listing) => void;
    onSeeAll?: () => void;
}

export const FeaturedListings: React.FC<FeaturedListingsProps> = ({
                                                                      data,
                                                                      loading,
                                                                      onListingPress,
                                                                      onSeeAll,
                                                                  }) => {
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
            </View>
        );
    }

    // Early return if no data
    if (!data || data.length === 0) {
        return (
            <View style={styles.container}>
                <SectionHeader
                    title="Featured Products"
                    onSeeAll={onSeeAll}
                    showSeeAll={!!onSeeAll}
                />
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No featured listings available</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SectionHeader
                title="Featured Products"
                onSeeAll={onSeeAll}
                showSeeAll={!!onSeeAll}
            />

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {data.map((listing) => (
                    <TouchableOpacity
                        key={listing.id}
                        style={styles.listingCard}
                        onPress={() => onListingPress(listing)}
                        activeOpacity={0.7}
                    >
                        {/* Use ListingImage component */}
                        <ListingImage
                            primaryImage={listing.primary_image}
                            style={styles.listingImage}
                            fallbackSource={require('@/assets/images/placeholder.png')}
                        />

                        <Text style={styles.listingPrice}>
                            {listing.currency} {parseFloat(listing.price).toLocaleString()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 16,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        height: 180,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        height: 150,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    emptyText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    scrollContent: {
        paddingHorizontal: 16,
    },
    listingCard: {
        width: 100,
        backgroundColor: '#fff',
        borderRadius: 4,
        marginRight: 8,
        position: 'relative',
        overflow: 'hidden', // Important for image border radius
    },
    listingImage: {
        width: '100%',
        height: 180,
        borderRadius: 4,
        marginBottom: 8,
    },


    listingPrice: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000',
    },
});