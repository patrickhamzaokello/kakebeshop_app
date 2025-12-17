import React, { useState } from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ListRenderItem,
    Modal,
    ScrollView,
    Pressable,
} from 'react-native';
import { Listing } from '@/utils/types/models';
import { ListingImage } from '@/components/test/common/ListingImage';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

interface AllListingsProps {
    data: Listing[];
    loading: boolean;
    hasMore: boolean;
    onLoadMore: () => Promise<void>;
    onListingPress: (listing: Listing) => void;
    onAddToCart?: (listingId: string) => void;
    onAddToWishlist?: (listingId: string) => void;
}

export const AllListings: React.FC<AllListingsProps> = ({
    data,
    loading,
    hasMore,
    onLoadMore,
    onListingPress,
    onAddToCart,
    onAddToWishlist,
}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

    const handleQuickView = (listing: Listing, event: any) => {
        event.stopPropagation();
        setSelectedListing(listing);
        setModalVisible(true);
    };

    const handleAddToCart = () => {
        if (selectedListing && onAddToCart) {
            onAddToCart(selectedListing.id);
            setModalVisible(false);
        }
    };

    const handleAddToWishlist = () => {
        if (selectedListing && onAddToWishlist) {
            onAddToWishlist(selectedListing.id);
        }
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
                        color="#fff" />
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
        if (!loading) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#007AFF" />
            </View>
        );
    };

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

            {/* Quick View Modal */}
            <Modal
                animationType="none"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setModalVisible(false)}
                >
                    <Pressable
                        style={styles.modalContent}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Quick View</Text>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            {selectedListing && (
                                <>
                                    <Image
                                        source={{ uri: selectedListing.primary_image }}
                                        style={styles.modalImage}
                                        resizeMode="cover"
                                    />

                                    <View style={styles.modalDetails}>
                                        <Text style={styles.modalProductTitle}>
                                            {selectedListing.title}
                                        </Text>

                                        <Text style={styles.modalMerchant}>
                                            by {selectedListing.merchant.business_name}
                                        </Text>

                                        <Text style={styles.modalPrice}>
                                            {selectedListing.currency}
                                            {selectedListing.price}
                                        </Text>

                                        {selectedListing.description && (
                                            <View style={styles.descriptionSection}>
                                                <Text style={styles.descriptionLabel}>
                                                    Description
                                                </Text>
                                                <Text style={styles.descriptionText}>
                                                    {selectedListing.description}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                </>
                            )}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.wishlistButton}
                                onPress={handleAddToWishlist}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.wishlistIcon}>♡</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.addToCartButton}
                                onPress={handleAddToCart}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.addToCartText}>Add to Cart</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
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
        width: '49%',
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 6,
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

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonText: {
        fontSize: 20,
        color: '#666',
        fontWeight: '300',
    },
    modalBody: {
        maxHeight: 500,
    },
    modalImage: {
        width: '100%',
        height: 300,
        backgroundColor: '#F5F5F5',
    },
    modalDetails: {
        padding: 16,
    },
    modalProductTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
        marginBottom: 8,
    },
    modalMerchant: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    modalPrice: {
        fontSize: 24,
        fontWeight: '700',
        color: '#007AFF',
        marginBottom: 16,
    },
    descriptionSection: {
        marginTop: 8,
    },
    descriptionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
    },
    descriptionText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
        gap: 12,
    },
    wishlistButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    wishlistIcon: {
        fontSize: 24,
        color: '#007AFF',
    },
    addToCartButton: {
        flex: 1,
        height: 50,
        backgroundColor: '#007AFF',
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addToCartText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});