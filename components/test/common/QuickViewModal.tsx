import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Modal,
    ScrollView,
    Pressable,
    ActivityIndicator,
    FlatList,
    Dimensions,
} from 'react-native';
import { Listing, ListingDetail } from '@/utils/types/models';
import { listingDetailsService } from '@/utils/services/listingDetailsService';

interface QuickViewModalProps {
    visible: boolean;
    listing: Listing | null;
    onClose: () => void;
    onAddToCart?: (listingId: string) => void;
    onAddToWishlist?: (listingId: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
    visible,
    listing,
    onClose,
    onAddToCart,
    onAddToWishlist,
}) => {
    const [listingDetails, setListingDetails] = useState<ListingDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        if (visible && listing) {
            fetchListingDetails();
        }
        return () => {
            setListingDetails(null);
            setCurrentImageIndex(0);
        };
    }, [visible, listing]);

    const fetchListingDetails = async () => {
        if (!listing) return;
        
        setLoading(true);
        try {
            const details = await listingDetailsService.getListingDetails(listing.id);
            setListingDetails(details);
        } catch (error) {
            console.error('Error fetching listing details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = () => {
        if (listing && onAddToCart) {
            onAddToCart(listing.id);
            onClose();
        }
    };

    const handleAddToWishlist = () => {
        if (listing && onAddToWishlist) {
            onAddToWishlist(listing.id);
        }
    };

    const renderImageItem = ({ item }: { item: any }) => (
        <Image
            source={{ uri: item.image }}
            style={styles.slideImage}
            resizeMode="cover"
        />
    );

    const onViewableItemsChanged = React.useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentImageIndex(viewableItems[0].index || 0);
        }
    }).current;

    const viewabilityConfig = React.useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

    return (
        <Modal
            animationType="none"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <Pressable
                style={styles.modalOverlay}
                onPress={onClose}
            >
                <Pressable
                    style={styles.modalContent}
                    onPress={(e) => e.stopPropagation()}
                >
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Quick View</Text>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeButton}
                        >
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#007AFF" />
                        </View>
                    ) : (
                        <ScrollView style={styles.modalBody}>
                            {listingDetails && (
                                <>
                                    {/* Image Slider */}
                                   

                                     <ScrollView
                                                    horizontal
                                                    showsHorizontalScrollIndicator={false}
                                                    contentContainerStyle={styles.imageSliderContainer}
                                                >
                                                    {listingDetails.images?.map((image) => {
                                    
                                                        return (
                                                          
                                                                <Image
                                                                    source={{ uri: image.image }}
                                                                    style={styles.slideImage}
                                                                    resizeMode="cover"
                                                                    key={image.id}
                                                                />
                                                        );
                                                    })}
                                                </ScrollView>

                                    <View style={styles.modalDetails}>
                                        <Text style={styles.modalProductTitle}>
                                            {listingDetails.title}
                                        </Text>

                                        <View style={styles.merchantContainer}>
                                            {listingDetails.merchant.logo && (
                                                <Image
                                                    source={{ uri: listingDetails.merchant.logo }}
                                                    style={styles.merchantLogo}
                                                />
                                            )}
                                            <View style={styles.merchantInfo}>
                                                <Text style={styles.modalMerchant}>
                                                    by {listingDetails.merchant.business_name}
                                                </Text>
                                                {listingDetails.merchant.verified && (
                                                    <Text style={styles.verifiedBadge}>✓ Verified</Text>
                                                )}
                                            </View>
                                        </View>

                                        <Text style={styles.modalPrice}>
                                            {listingDetails.currency} {listingDetails.price}
                                        </Text>

                                        {listingDetails.category && (
                                            <View style={styles.categoryTag}>
                                                <Text style={styles.categoryText}>
                                                    {listingDetails.category.name}
                                                </Text>
                                            </View>
                                        )}

                                        {listingDetails.description && (
                                            <View style={styles.descriptionSection}>
                                                <Text style={styles.descriptionLabel}>
                                                    Description
                                                </Text>
                                                <Text style={styles.descriptionText}>
                                                    {listingDetails.description}
                                                </Text>
                                            </View>
                                        )}

                                        {/* Additional Info */}
                                        <View style={styles.additionalInfo}>
                                            <View style={styles.infoRow}>
                                                <Text style={styles.infoLabel}>Type:</Text>
                                                <Text style={styles.infoValue}>
                                                    {listingDetails.listing_type}
                                                </Text>
                                            </View>
                                            <View style={styles.infoRow}>
                                                <Text style={styles.infoLabel}>Status:</Text>
                                                <Text style={[
                                                    styles.infoValue,
                                                    styles.statusActive
                                                ]}>
                                                    {listingDetails.status}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </>
                            )}
                        </ScrollView>
                    )}

                    {!loading && listingDetails && (
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
                    )}
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
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
    loadingContainer: {
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBody: {
        maxHeight: 500,
    },
    imageSliderContainer: {
        position: 'relative',
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    slideImage: {
        width: 150,
        height: 200,
        marginRight: 10,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
   
    modalDetails: {
        padding: 16,
    },
    modalProductTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
        marginBottom: 12,
    },
    merchantContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    merchantLogo: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    merchantInfo: {
        flex: 1,
    },
    modalMerchant: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    verifiedBadge: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '600',
    },
    modalPrice: {
        fontSize: 24,
        fontWeight: '700',
        color: '#007AFF',
        marginBottom: 12,
    },
    categoryTag: {
        alignSelf: 'flex-start',
        backgroundColor: '#F2F2F7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 16,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
    descriptionSection: {
        marginTop: 8,
        marginBottom: 16,
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
    additionalInfo: {
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
        paddingTop: 16,
        gap: 8,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },
    statusActive: {
        color: '#34C759',
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