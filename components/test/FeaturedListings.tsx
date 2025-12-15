import React from 'react';
import {
    View,
    Text,
    ScrollView,
    Image,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { Listing } from '@/utils/types/models';
import { SectionHeader } from '@/components/test/common/SectionHeader';

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

    const getPrimaryImage = (listing: Listing): string => {
        const primaryImage = listing.images.find(img => img.is_primary);
        return primaryImage?.thumbnail || listing.images[0]?.thumbnail || 'https://via.placeholder.com/150';
    };

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
                {data?.map((listing) => (
                    <TouchableOpacity
                        key={listing.id}
                        style={styles.listingCard}
                        onPress={() => onListingPress(listing)}
                        activeOpacity={0.7}
                    >
                        <Image
                            source={{ uri: getPrimaryImage(listing) }}
                            style={styles.listingImage}
                        />

                        <View style={styles.featuredBadge}>
                            <Text style={styles.featuredText}>⭐ Featured</Text>
                        </View>

                        <Text style={styles.listingTitle} numberOfLines={2}>
                            {listing.title}
                        </Text>

                        <Text style={styles.merchantName} numberOfLines={1}>
                            {listing.merchant.business_name || listing.merchant.display_name}
                        </Text>

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
    },
    loadingContainer: {
        height: 180,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 16,
    },
    listingCard: {
        width: 150,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    listingImage: {
        width: '100%',
        height: 130,
        borderRadius: 8,
        marginBottom: 8,
    },
    featuredBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: '#FFD700',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4,
    },
    featuredText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000',
    },
    listingTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
        minHeight: 36,
    },
    merchantName: {
        fontSize: 11,
        color: '#666',
        marginBottom: 6,
    },
    listingPrice: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#007AFF',
    },
});