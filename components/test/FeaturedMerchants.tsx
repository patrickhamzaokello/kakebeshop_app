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
import { Merchant } from '@/utils/types/models';
import { SectionHeader } from '@/components/test/common/SectionHeader';

interface FeaturedMerchantsProps {
    data: Merchant[] | null;
    loading: boolean;
    onMerchantPress: (merchant: Merchant) => void;
    onSeeAll?: () => void;
}

export const FeaturedMerchants: React.FC<FeaturedMerchantsProps> = ({
    data,
    loading,
    onMerchantPress,
    onSeeAll,
}) => {

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
            </View>
        );
    }

    const getMerchantImage = (merchant: Merchant): string => {
        return merchant.logo || 'https://via.placeholder.com/100';
    };

    return (
        <View style={styles.container}>
            <SectionHeader
                title="Featured Merchants"
                onSeeAll={onSeeAll}
                showSeeAll={!!onSeeAll}
            />

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {data?.map((merchant) => (
                    <TouchableOpacity
                        key={merchant.id}
                        style={styles.merchantCard}
                        onPress={() => onMerchantPress(merchant)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.imageContainer}>
                            <Image
                                source={{ uri: getMerchantImage(merchant) }}
                                style={styles.merchantImage}
                            />
                            {merchant.verified && (
                                <View style={styles.verifiedBadge}>
                                    <Text style={styles.verifiedIcon}>✓</Text>
                                </View>
                            )}
                        </View>

                        <Text style={styles.merchantName} numberOfLines={1}>
                            {merchant.business_name || merchant.display_name}
                        </Text>

                        <View style={styles.ratingContainer}>
                            <Text style={styles.ratingStar}>★</Text>
                            <Text style={styles.ratingText}>{merchant.rating.toFixed(1)}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 12,
        backgroundColor: '#ffffff'
    },
    loadingContainer: {
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 16,
        gap: 12,
    },
    merchantCard: {
        width: 100,
        marginRight: 0,
    },
    imageContainer: {
        position: 'relative',
        marginBottom: 8,
    },
    merchantImage: {
        width: 100,
        height: 100,
        borderRadius: 12,
        backgroundColor: '#F5F5F5',
    },
    verifiedBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: '#34C759',
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    verifiedIcon: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '700',
    },
    merchantName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    ratingStar: {
        fontSize: 12,
        color: '#FFB800',
    },
    ratingText: {
        fontSize: 12,
        color: '#8E8E93',
        fontWeight: '500',
    },
});