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
        return merchant.logo || merchant.cover_image || 'https://via.placeholder.com/100';
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
                        <Image
                            source={{ uri: getMerchantImage(merchant) }}
                            style={styles.merchantImage}
                        />

                        <View style={styles.merchantInfo}>
                            <View style={styles.nameRow}>
                                <Text style={styles.merchantName} numberOfLines={1}>
                                    {merchant.business_name || merchant.display_name}
                                </Text>
                                {merchant.verified && (
                                    <Text style={styles.verifiedBadge}>✓</Text>
                                )}
                            </View>

                            <View style={styles.ratingRow}>
                                <Text style={styles.ratingText}>⭐ {merchant.rating.toFixed(1)}</Text>
                            </View>
                        </View>
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
        height: 140,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 16,
    },
    merchantCard: {
        width: 140,
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
    merchantImage: {
        width: '100%',
        height: 80,
        borderRadius: 8,
        marginBottom: 8,
        backgroundColor: '#F2F2F7',
    },
    merchantInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    merchantName: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    verifiedBadge: {
        fontSize: 14,
        color: '#34C759',
        marginLeft: 4,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 12,
        color: '#666',
    },
});