import React from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ListRenderItem,
} from 'react-native';
import { Listing } from '@/utils/types/models';
import { ListingImage } from '@/components/test/common/ListingImage';


interface AllListingsProps {
    data: Listing[];
    loading: boolean;
    hasMore: boolean;
    onLoadMore: () => Promise<void>;
    onListingPress: (listing: Listing) => void;
}

export const AllListings: React.FC<AllListingsProps> = ({
                                                            data,
                                                            loading,
                                                            hasMore,
                                                            onLoadMore,
                                                            onListingPress,
                                                        }) => {
    const renderItem: ListRenderItem<Listing> = ({ item }) => (
        <TouchableOpacity
            style={styles.listingCard}
            onPress={() => onListingPress(item)}
            activeOpacity={0.7}
        >
            <ListingImage
                primaryImage={item.primary_image}
                style={styles.listingImage}
                fallbackSource={require('@/assets/images/placeholder.png')}
            />
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
        if (!loading) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#007AFF" />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>For you</Text>
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#ffffff'
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    row: {
        justifyContent: 'space-between',
    },
    listingCard: {
        width: '49%',
        backgroundColor: '#fff',
        borderRadius: 4,
        marginBottom: 8,
    },
    listingImage: {
        width: '100%',
        height: 245,
        borderRadius: 8,
    },
    listingDescription:{
        padding: 8
    },
    listingTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
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