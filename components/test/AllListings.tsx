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
import { Listing } from '@/utils/models';

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
            <Image source={{ uri: item.image }} style={styles.listingImage} />
            <Text style={styles.listingTitle} numberOfLines={2}>
                {item.title}
            </Text>
            <Text style={styles.merchantName} numberOfLines={1}>
                {item.merchantName}
            </Text>
            <Text style={styles.listingPrice}>
                {item.currency}
                {item.price.toFixed(2)}
            </Text>
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
            <Text style={styles.sectionTitle}>All Products</Text>
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
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    listingImage: {
        width: '100%',
        height: 120,
        borderRadius: 8,
        marginBottom: 8,
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
        color: '#007AFF',
    },
    footerLoader: {
        paddingVertical: 20,
    },
});