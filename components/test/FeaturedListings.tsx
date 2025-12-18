import React, { useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Animated,
} from 'react-native';
import { Listing } from '@/utils/types/models';
import { SectionHeader } from '@/components/test/common/SectionHeader';
import { ListingImage } from '@/components/test/common/ListingImage';

interface FeaturedListingsProps {
    data: Listing[] | null;
    loading: boolean;
    onListingPress: (listing: Listing) => void;
    onSeeAll?: () => void;
}

const ShimmerPlaceholder: React.FC<{ style?: any }> = ({ style }) => {
    const animatedValue = new Animated.Value(0);

    useEffect(() => {
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
    }, []);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                {
                    backgroundColor: '#E0E0E0',
                    opacity,
                },
                style,
            ]}
        />
    );
};

export const FeaturedListings: React.FC<FeaturedListingsProps> = ({
    data,
    loading,
    onListingPress,
    onSeeAll,
}) => {
    if (loading) {
        return (
            <View style={styles.container}>
                <SectionHeader
                    title="Trending Listings"
                    onSeeAll={onSeeAll}
                    showSeeAll={!!onSeeAll}
                />

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    scrollEnabled={false}
                >
                    {[1, 2, 3, 4, 5].map((item) => (
                        <View key={item} style={styles.listingCard}>
                            {/* Image shimmer */}
                            <ShimmerPlaceholder
                                style={{
                                    width: '100%',
                                    height: 180,
                                    borderRadius: 4,
                                    marginBottom: 8,
                                }}
                            />
                            {/* Price shimmer */}
                            <ShimmerPlaceholder
                                style={{
                                    width: '70%',
                                    height: 10,
                                    borderRadius: 4,
                                }}
                            />
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    }

    // Early return if no data
    if (!data || data.length === 0) {
        return (
            <View style={styles.container}>
                <SectionHeader
                    title="Trending Listings"
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
                title="Trending Listings"
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
        overflow: 'hidden',
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