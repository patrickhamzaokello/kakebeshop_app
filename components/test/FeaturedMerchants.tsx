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
                title="Top Brands"
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
                        <Image
                            source={{ uri: getMerchantImage(merchant) }}
                            style={styles.merchantImage}
                        />

                        <Text style={styles.merchantName} numberOfLines={1}>
                            {merchant.business_name || merchant.display_name}
                        </Text>

                        <View style={styles.ratingContainer}>
                            <Text style={styles.ratingStar}>★</Text>
                            <Text style={styles.ratingText}>{merchant.rating.toFixed(1)}</Text>
                            {merchant.verified && (
                                <View style={styles.verifiedBadge}>
                                    <Text style={styles.verifiedIcon}>✓</Text>
                                </View>
                            )}
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
    },
    loadingContainer: {
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    merchantCard: {
        width: 120,
        padding: 4,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E5EA',
    },
    merchantImage: {
        width: '100%',
        height: 100,
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
        marginBottom: 8,
    },
    verifiedBadge: {
        backgroundColor: '#34C759',
        width: 16,
        height: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 4,
    },
    verifiedIcon: {
        fontSize: 10,
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