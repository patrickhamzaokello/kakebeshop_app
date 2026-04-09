import React, { useEffect } from 'react';
import { Text } from "@/components/Text";
import { View, ScrollView, Image, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Merchant } from '@/utils/types/models';
import { SectionHeader } from '@/components/test/common/SectionHeader';
import { useTheme } from '@/contexts/ThemeContext';

interface FeaturedMerchantsProps {
    data: Merchant[] | null;
    loading: boolean;
    onMerchantPress: (merchant: Merchant) => void;
    onSeeAll?: () => void;
}

const ShimmerPlaceholder: React.FC<{ style?: any }> = ({ style }) => {
    const { colors } = useTheme();
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
                    backgroundColor: colors.gray300,
                    opacity,
                },
                style,
            ]}
        />
    );
};

export const FeaturedMerchants: React.FC<FeaturedMerchantsProps> = ({
    data,
    loading,
    onMerchantPress,
    onSeeAll,
}) => {
    const { colors } = useTheme();

    if (loading) {
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
                    scrollEnabled={false}
                >
                    {[1, 2, 3, 4].map((item) => (
                        <View key={item} style={[styles.merchantCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                            {/* Merchant image shimmer */}
                            <ShimmerPlaceholder
                                style={[styles.merchantImage, { borderRadius: 8 }]}
                            />

                            {/* Merchant name shimmer */}
                            <ShimmerPlaceholder
                                style={{
                                    width: '80%',
                                    height: 13,
                                    borderRadius: 4,
                                    marginBottom: 4,
                                }}
                            />

                            {/* Rating container shimmer */}
                            <View style={styles.ratingContainer}>
                                <ShimmerPlaceholder
                                    style={{
                                        width: 60,
                                        height: 12,
                                        borderRadius: 4,
                                    }}
                                />
                            </View>
                        </View>
                    ))}
                </ScrollView>
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
                        style={[styles.merchantCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                        onPress={() => onMerchantPress(merchant)}
                        activeOpacity={0.7}
                    >
                        <Image
                            source={{ uri: getMerchantImage(merchant) }}
                            style={[styles.merchantImage, { backgroundColor: colors.backgroundTertiary }]}
                        />

                        <Text style={[styles.merchantName, { color: colors.textPrimary }]} numberOfLines={1}>
                            {merchant.business_name || merchant.display_name}
                        </Text>

                        <View style={styles.ratingContainer}>
                            <Text style={[styles.ratingStar, { color: colors.star }]}>★</Text>
                            <Text style={[styles.ratingText, { color: colors.textMuted }]}>{merchant.rating.toFixed(1)}</Text>
                            {merchant.verified && (
                                <View style={[styles.verifiedBadge, { backgroundColor: colors.success }]}>
                                    <Text style={[styles.verifiedIcon, { color: colors.textInverse }]}>✓</Text>
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
    scrollContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    merchantCard: {
        width: 120,
        padding: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    merchantImage: {
        width: '100%',
        height: 100,
        borderRadius: 8,
        marginBottom: 8,
    },
    verifiedBadge: {
        width: 16,
        height: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 4,
    },
    verifiedIcon: {
        fontSize: 10,
        fontWeight: '700',
    },
    merchantName: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    ratingStar: {
        fontSize: 12,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '500',
    },
});