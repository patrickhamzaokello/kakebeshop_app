import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ListRenderItem,
    Animated,
} from 'react-native';
import { Listing } from '@/utils/types/models';
import { ListingImage } from '@/components/test/common/ListingImage';
import { MaterialIcons } from '@expo/vector-icons';
import { QuickViewModal } from '@/components/test/common/QuickViewModal';

interface AllListingsProps {
    data: Listing[];
    loading: boolean;
    hasMore: boolean;
    onLoadMore: () => Promise<void>;
    onListingPress: (listing: Listing) => void;
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

const ListingShimmerCard = () => (
    <View style={styles.listingCard}>
        <View style={styles.imageContainer}>
            {/* Image shimmer */}
            <ShimmerPlaceholder
                style={{
                    width: '100%',
                    height: 245,
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                }}
            />
            {/* Quick view button shimmer */}
            <View
                style={[
                    styles.quickViewButton,
                    { backgroundColor: 'rgba(224, 224, 224, 0.8)' },
                ]}
            />
        </View>
        <View style={styles.listingDescription}>
            {/* Title shimmer - 2 lines */}
            <ShimmerPlaceholder
                style={{
                    width: '90%',
                    height: 14,
                    borderRadius: 4,
                    marginBottom: 4,
                }}
            />
            <ShimmerPlaceholder
                style={{
                    width: '70%',
                    height: 14,
                    borderRadius: 4,
                    marginBottom: 8,
                }}
            />
            {/* Merchant name shimmer */}
            <ShimmerPlaceholder
                style={{
                    width: '60%',
                    height: 12,
                    borderRadius: 4,
                    marginBottom: 8,
                }}
            />
            {/* Price shimmer */}
            <ShimmerPlaceholder
                style={{
                    width: '50%',
                    height: 16,
                    borderRadius: 4,
                }}
            />
        </View>
    </View>
);

export const AllListings: React.FC<AllListingsProps> = ({
    data,
    loading,
    hasMore,
    onLoadMore,
    onListingPress,
}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

    const handleQuickView = (listing: Listing, event: any) => {
        event.stopPropagation();
        setSelectedListing(listing);
        setModalVisible(true);
    };

    const renderItem: ListRenderItem<Listing> = ({ item }) => (
        <TouchableOpacity
            style={styles.listingCard}
            onPress={() => onListingPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.imageContainer}>
                <ListingImage
                    primaryImage={item.primary_image}
                    style={styles.listingImage}
                    fallbackSource={require('@/assets/images/placeholder.png')}
                />
                <TouchableOpacity
                    style={styles.quickViewButton}
                    onPress={(e) => handleQuickView(item, e)}
                    activeOpacity={0.8}
                >
                    <MaterialIcons 
                        style={styles.quickViewIcon}
                        name="add"
                        size={18}
                        color="#fff" 
                    />
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
                    {item.currency}
                    {item.price}
                </Text>
            </View>
        </TouchableOpacity>
    );

    const renderFooter = () => {
        if (!loading || data.length === 0) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#007AFF" />
            </View>
        );
    };

    // Show shimmer when initially loading with no data
    if (loading && data.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.sectionTitle}>All Listings</Text>
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
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>All Listings</Text>
            <FlatList
                data={data}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.row}
                scrollEnabled={false}
                ListFooterComponent={renderFooter}
                onEndReached={() => {
                    if (hasMore && !loading) {
                        onLoadMore();
                    }
                }}
                onEndReachedThreshold={0.5}
            />

            <QuickViewModal
             visible={modalVisible}
             listing={selectedListing}
             onClose={() => setModalVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    shimmerContainer: {
        gap: 6,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    listingCard: {
        width: '49%',
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#f2f2f2',
    },
    imageContainer: {
        position: 'relative',
    },
    listingImage: {
        width: '100%',
        height: 245,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
    },
    quickViewButton: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickViewIcon: {
        fontSize: 18,
    },
    listingDescription: {
        padding: 8,
    },
    listingTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
        color: '#000',
    },
    merchantName: {
        fontSize: 12,
        color: '#666',
        marginBottom: 4,
    },
    listingPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
    },
    footerLoader: {
        paddingVertical: 20,
    },
});