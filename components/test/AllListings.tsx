import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Animated,
    Dimensions,
} from 'react-native';
import { Listing } from '@/utils/types/models';
import { ListingImage } from '@/components/test/common/ListingImage';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { QuickViewModal } from '@/components/test/common/QuickViewModal';
import { useTheme } from '@/contexts/ThemeContext';
import { JSX } from 'react/jsx-runtime';
import { colors } from '@/constants/theme';

interface AllListingsProps {
    data: Listing[];
    loading: boolean;
    hasMore: boolean;
    onLoadMore: () => Promise<void>;
    onListingPress: (listing: Listing) => void;
}

const { width } = Dimensions.get('window');
const CARD_PADDING = 16;
const CARD_GAP = 12;
const COLUMN_WIDTH = (width - (CARD_PADDING * 2) - CARD_GAP) / 2;



// Step 2: Call useTheme() hook to get the colors object
const ShimmerPlaceholder: React.FC<{ style?: any }> = ({ style }) => {
    const animatedValue = new Animated.Value(0);
    const { colors } = useTheme(); // Get colors from theme

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

    // Step 3: Replace hardcoded '#E0E0E0' with colors.gray300
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

const BentoShimmerCard: React.FC<{ isLarge?: boolean }> = ({ isLarge = false }) => {
    const { colors } = useTheme(); // Each component that needs colors calls the hook

    return (
        <View style={[ isLarge && styles.bentoCardLarge, { backgroundColor: colors.card }]}>
            <ShimmerPlaceholder
                style={{
                    width: '100%',
                    height: isLarge ? 320 : 240,
                    borderRadius: 16,
                }}
            />
            <View >
                <ShimmerPlaceholder
                    style={{
                        width: '80%',
                        height: 16,
                        borderRadius: 4,
                        marginBottom: 6,
                    }}
                />
                <ShimmerPlaceholder
                    style={{
                        width: '60%',
                        height: 14,
                        borderRadius: 4,
                        marginBottom: 8,
                    }}
                />
                <ShimmerPlaceholder
                    style={{
                        width: '50%',
                        height: 18,
                        borderRadius: 4,
                    }}
                />
            </View>
        </View>
    );
};

export const AllListings: React.FC<AllListingsProps> = ({
    data,
    loading,
    hasMore,
    onLoadMore,
    onListingPress,
}) => {
    // Step 2: Call the hook at the TOP of your component
    const { colors } = useTheme();

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

    const handleQuickView = (listing: Listing, event: any) => {
        event.stopPropagation();
        setSelectedListing(listing);
        setModalVisible(true);
    };

    const formatPrice = (listing: Listing): string => {
        if (listing.price_type === "ON_REQUEST") {
            return "Price on request";
        }
    
        if (listing.price_type === "RANGE") {
            if (listing.price_min && listing.price_max) {
                return `${listing.currency} ${parseInt(listing.price_min).toLocaleString()} - ${parseInt(listing.price_max).toLocaleString()}`;
            }
            return "Price on request";
        }
    
        if (listing.price_type === "FIXED" && listing.price) {
            return `${listing.currency} ${parseInt(listing.price).toLocaleString()}`;
        }
    
        return "Price not available";
    };

    // Bento grid pattern: alternating sizes for visual interest
    const getBentoPattern = (index: number): 'large' | 'small' => {
        // Pattern: L S S L L S S L...
        const position = index % 7;
        if (position === 0 || position === 3 || position === 4) return 'large';
        return 'small';
    };

    // Step 4: Use colors inside render functions - colors is available from the hook above
    const renderBentoGrid = () => {
        const rows: JSX.Element[] = [];
        let i = 0;

        while (i < data.length) {
            const pattern = getBentoPattern(i);

            if (pattern === 'large') {
                // Large card spans full width
                const item = data[i];
                rows.push(
                    <TouchableOpacity
                        key={`large-${item.id}`}
                        style={[styles.bentoCardLarge, { backgroundColor: colors.card }]}
                        onPress={() => onListingPress(item)}
                        activeOpacity={0.95}
                    >
                        <View style={styles.bentoImageContainerLarge}>
                            <ListingImage
                                primaryImage={item.primary_image}
                                style={styles.bentoImageLarge}
                                                            />
                            {item.is_featured && (
                                <View style={[styles.featuredBadgeLarge, { backgroundColor: colors.info }]}>
                                    <Ionicons name="star" size={14} color={colors.textInverse} />
                                    <Text style={styles.featuredTextLarge}>Featured</Text>
                                </View>
                            )}
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.88)']}
                                locations={[0, 0.45, 1]}
                                style={styles.gradientOverlay}
                            />
                            <View style={styles.bentoContentOverlay}>
                                <View style={styles.merchantBadge}>
                                    <Ionicons name="storefront" size={12} color="#fff" />
                                    <Text style={styles.merchantNameOverlay} numberOfLines={1}>
                                        {item.merchant.business_name}
                                    </Text>
                                </View>
                                <Text style={styles.bentoTitleLarge} numberOfLines={2}>
                                    {item.title}
                                </Text>
                                <View style={styles.priceRow}>
                                    <Text style={styles.bentoPriceLarge} numberOfLines={1}>
                                        {formatPrice(item)}
                                    </Text>
                                    {item.price_type === "RANGE" && (
                                        <View style={styles.negotiableBadge}>
                                            <Text style={styles.negotiableTextBadge}>Negotiable</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            <TouchableOpacity
                                style={[styles.quickViewButtonLarge, { backgroundColor: colors.primary }]}
                                onPress={(e) => handleQuickView(item, e)}
                                activeOpacity={0.8}
                            >
                                <MaterialIcons name="add" size={20} color={colors.textInverse} />
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                );
                i++;
            } else {
                // Small cards - two in a row
                const leftItem = data[i];
                const rightItem = data[i + 1];

                rows.push(
                    <View key={`row-${i}`} style={styles.bentoRow}>
                        {/* Left small card */}
                        <TouchableOpacity
                            style={[styles.bentoCardSmall, { backgroundColor: colors.card }]}
                            onPress={() => onListingPress(leftItem)}
                            activeOpacity={0.95}
                        >
                            <View style={styles.bentoImageContainerSmall}>
                                <ListingImage
                                    primaryImage={leftItem.primary_image}
                                    style={styles.bentoImageSmall}
                                                                    />
                                {leftItem.is_featured && (
                                    <View style={[styles.featuredBadgeSmall, { backgroundColor: colors.info }]}>
                                        <Ionicons name="star" size={10} color={colors.textInverse} />
                                    </View>
                                )}
                                <TouchableOpacity
                                    style={[styles.quickViewButtonSmall, { backgroundColor: colors.primary }]}
                                    onPress={(e) => handleQuickView(leftItem, e)}
                                    activeOpacity={0.8}
                                >
                                    <MaterialIcons name="add" size={16} color={colors.textInverse} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.bentoContentSmall}>
                                <Text style={[styles.bentoTitleSmall, { color: colors.textPrimary }]} numberOfLines={2}>
                                    {leftItem.title}
                                </Text>
                                <Text style={[styles.merchantNameSmall, { color: colors.textMuted }]} numberOfLines={1}>
                                    {leftItem.merchant.business_name}
                                </Text>
                                <Text style={[styles.bentoPriceSmall, { color: colors.textPrimary }]} numberOfLines={1}>
                                    {formatPrice(leftItem)}
                                </Text>
                                {leftItem.price_type === "RANGE" && (
                                    <Text style={[styles.negotiableTextSmall, { color: colors.info }]}>Negotiable</Text>
                                )}
                            </View>
                        </TouchableOpacity>

                        {/* Right small card (if exists) */}
                        {rightItem && (
                            <TouchableOpacity
                                style={[styles.bentoCardSmall, { backgroundColor: colors.card }]}
                                onPress={() => onListingPress(rightItem)}
                                activeOpacity={0.95}
                            >
                                <View style={styles.bentoImageContainerSmall}>
                                    <ListingImage
                                        primaryImage={rightItem.primary_image}
                                        style={styles.bentoImageSmall}
                                                                            />
                                    {rightItem.is_featured && (
                                        <View style={[styles.featuredBadgeSmall, { backgroundColor: colors.info }]}>
                                            <Ionicons name="star" size={10} color={colors.textInverse} />
                                        </View>
                                    )}
                                    <TouchableOpacity
                                        style={[styles.quickViewButtonSmall, { backgroundColor: colors.primary }]}
                                        onPress={(e) => handleQuickView(rightItem, e)}
                                        activeOpacity={0.8}
                                    >
                                        <MaterialIcons name="add" size={16} color={colors.textInverse} />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.bentoContentSmall}>
                                    <Text style={[styles.bentoTitleSmall, { color: colors.textPrimary }]} numberOfLines={2}>
                                        {rightItem.title}
                                    </Text>
                                    <Text style={[styles.merchantNameSmall, { color: colors.textMuted }]} numberOfLines={1}>
                                        {rightItem.merchant.business_name}
                                    </Text>
                                    <Text style={[styles.bentoPriceSmall, { color: colors.textPrimary }]} numberOfLines={1}>
                                        {formatPrice(rightItem)}
                                    </Text>
                                    {rightItem.price_type === "RANGE" && (
                                        <Text style={[styles.negotiableTextSmall, { color: colors.info }]}>Negotiable</Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                );
                i += 2;
            }
        }

        return rows;
    };

    // Show shimmer when initially loading with no data
    if (loading && data.length === 0) {
        return (
            <View style={styles.container}>
                {/* Step 3: Use style array to merge static styles with dynamic theme colors */}
                <View style={styles.bentoContainer}>
                    <BentoShimmerCard isLarge />
                    <View style={styles.bentoRow}>
                        <BentoShimmerCard />
                        <BentoShimmerCard />
                    </View>
                    <BentoShimmerCard isLarge />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Step 3: Apply theme color to text */}
            <View style={styles.bentoContainer}>
                {renderBentoGrid()}

                {/* Loading Indicator - use theme primary color */}
                {loading && data.length > 0 && (
                    <View style={styles.footerLoader}>
                        <ActivityIndicator size="small" color={colors.primary} />
                    </View>
                )}

                {/* End of Results - use theme colors */}
                {!hasMore && data.length > 0 && (
                    <View style={styles.endOfResults}>
                        <View style={[styles.endLine, { backgroundColor: colors.border }]} />
                        <Text style={[styles.endText, { color: colors.textMuted }]}>You've seen it all</Text>
                        <View style={[styles.endLine, { backgroundColor: colors.border }]} />
                    </View>
                )}
            </View>

            <QuickViewModal
                visible={modalVisible}
                listing={selectedListing}
                onClose={() => setModalVisible(false)}
            />
        </View>
    );
};

// Step 5: Remove hardcoded colors from styles - they're now applied inline
const styles = StyleSheet.create({
    container: {
        padding: CARD_PADDING,
    },
    bentoContainer: {
        width: '100%',
    },
    bentoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: CARD_GAP,
    },

    // Large cards (full width)
    bentoCardLarge: {
        width: '100%',
        marginBottom: CARD_GAP,
        borderRadius: 20,
        // backgroundColor removed - applied inline with colors.card
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    bentoImageContainerLarge: {
        position: 'relative',
        width: '100%',
        height: 320,
    },
    bentoImageLarge: {
        width: '100%',
        height: '100%',
    },
    gradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 220,
    },
    bentoContentOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        gap: 6,
    },
    merchantBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(0,0,0,0.45)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    merchantNameOverlay: {
        fontSize: 11,
        color: '#fff',
        fontWeight: '600',
    },
    bentoTitleLarge: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        lineHeight: 24,
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    bentoPriceLarge: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    featuredBadgeLarge: {
        position: 'absolute',
        top: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        // backgroundColor removed - applied inline
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    featuredTextLarge: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    quickViewButtonLarge: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(10px)',
    },

    // Small cards (half width)
    bentoCardSmall: {
        width: COLUMN_WIDTH,
        borderRadius: 16,
        // backgroundColor removed - applied inline
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    bentoImageContainerSmall: {
        position: 'relative',
        width: '100%',
        height: 180,
    },
    bentoImageSmall: {
        width: '100%',
        height: '100%',
    },
    bentoContentSmall: {
        padding: 10,
    },
    bentoTitleSmall: {
        fontSize: 13,
        fontWeight: '600',
        // color removed - applied inline
        marginBottom: 4,
        lineHeight: 18,
    },
    merchantNameSmall: {
        fontSize: 11,
        // color removed - applied inline
        marginBottom: 6,
    },
    bentoPriceSmall: {
        fontSize: 14,
        fontWeight: 'bold',
        // color removed - applied inline
    },
    featuredBadgeSmall: {
        position: 'absolute',
        top: 8,
        left: 8,
        // backgroundColor removed - applied inline
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickViewButtonSmall: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Badges and tags
    negotiableBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backdropFilter: 'blur(10px)',
    },
    negotiableTextBadge: {
        fontSize: 10,
        color: '#fff',
        fontWeight: '700',
    },
    negotiableTextSmall: {
        fontSize: 10,
        // color removed - applied inline
        fontWeight: '600',
        marginTop: 3,
    },

    footerLoader: {
        paddingVertical: 32,
        alignItems: 'center',
        gap: 8,
    },
    endOfResults: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    endLine: {
        height: 1,
        flex: 1,
        // backgroundColor removed - applied inline
    },
    endText: {
        fontSize: 13,
        // color removed - applied inline
        fontWeight: '500',
    },
});