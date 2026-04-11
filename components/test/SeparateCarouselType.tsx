import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Image,
    ScrollView,
    Dimensions,
    StyleSheet,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/Text';
import { CarouselImage } from '@/utils/types/models';
import { useTheme } from '@/contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_HEIGHT = 165;
const H_MARGIN = 16;
const AUTO_SLIDE_INTERVAL = 4500;

interface SeparateCarouselTypeProps {
    data: CarouselImage[] | null;
    loading: boolean;
}

const ShimmerPlaceholder: React.FC<{ style?: any }> = ({ style }) => {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, { toValue: 1, duration: 1000, useNativeDriver: true }),
                Animated.timing(animatedValue, { toValue: 0, duration: 1000, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const opacity = animatedValue.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

    return <Animated.View style={[{ backgroundColor: '#E0E0E0', opacity }, style]} />;
};

export const SeparateCarouselType: React.FC<SeparateCarouselTypeProps> = ({ data, loading }) => {
    const { colors } = useTheme();
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef<ScrollView>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const scrollToIndex = (index: number) => {
        scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
    };

    const startAutoSlide = (items: CarouselImage[]) => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (items.length <= 1) return;
        intervalRef.current = setInterval(() => {
            setActiveIndex((prev) => {
                const next = (prev + 1) % items.length;
                scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
                return next;
            });
        }, AUTO_SLIDE_INTERVAL);
    };

    useEffect(() => {
        if (!data) return;
        startAutoSlide(data);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [data]);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
        setActiveIndex(index);
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ShimmerPlaceholder style={styles.shimmerCard} />
                <View style={styles.segmentContainer}>
                    {[0, 1, 2].map((i) => (
                        <ShimmerPlaceholder
                            key={i}
                            style={[styles.segment, { flex: 1 }]}
                        />
                    ))}
                </View>
            </View>
        );
    }

    if (!data || data.length === 0) return null;

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                onScrollBeginDrag={() => data && startAutoSlide(data)}
                scrollEventThrottle={16}
            >
                {data.map((item, index) => (
                    <View key={item.id} style={styles.page}>
                        <View style={styles.card}>
                            <Image
                                source={{ uri: item.image }}
                                style={styles.cardImage}
                                resizeMode="cover"
                            />
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.58)']}
                                style={styles.gradient}
                            />

                            {/* Slide counter pill — top right */}
                            <View style={styles.counter}>
                                <Text style={styles.counterText}>
                                    {index + 1} / {data.length}
                                </Text>
                            </View>

                            {item.title ? (
                                <View style={styles.titleContainer}>
                                    <Text style={styles.cardTitle} numberOfLines={2}>
                                        {item.title}
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Story-style segment bars */}
            {data.length > 1 && (
                <View style={styles.segmentContainer}>
                    {data.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.segment,
                                {
                                    flex: 1,
                                    backgroundColor:
                                        i === activeIndex
                                            ? colors.primary
                                            : (colors.gray300 ?? '#D0D0D0'),
                                },
                            ]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 12,
        paddingBottom: 4,
    },
    // Loading
    shimmerCard: {
        height: CARD_HEIGHT,
        marginHorizontal: H_MARGIN,
        borderRadius: 10,
    },
    // Each page is exactly SCREEN_WIDTH so pagingEnabled snaps cleanly
    page: {
        width: SCREEN_WIDTH,
        paddingHorizontal: H_MARGIN,
    },
    card: {
        height: CARD_HEIGHT,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 70,
    },
    // "2 / 4" pill in top-right
    counter: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.42)',
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: 20,
    },
    counterText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.4,
    },
    titleContainer: {
        position: 'absolute',
        bottom: 12,
        left: 12,
        right: 12,
    },
    cardTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        lineHeight: 20,
    },
    // Thin story-style bars
    segmentContainer: {
        flexDirection: 'row',
        marginHorizontal: H_MARGIN,
        marginTop: 8,
        gap: 4,
        height: 3,
    },
    segment: {
        height: 3,
        borderRadius: 2,
    },
});
