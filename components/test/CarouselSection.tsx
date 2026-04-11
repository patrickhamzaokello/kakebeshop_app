import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Image,
    ScrollView,
    Dimensions,
    StyleSheet,
    NativeScrollEvent,
    NativeSyntheticEvent,
    TouchableOpacity,
    Animated,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/Text';
import { CarouselImage } from '@/utils/types/models';
import { useTheme } from '@/contexts/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.88;
const CARD_SPACING = 12;
const LEFT_PADDING = 16;
const CARD_HEIGHT = 200;
const SNAP_INTERVAL = CARD_WIDTH + CARD_SPACING;
const AUTO_SLIDE_INTERVAL = 4000;

interface CarouselSectionProps {
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

export const CarouselSection: React.FC<CarouselSectionProps> = ({ data, loading }) => {
    const { colors } = useTheme();
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef<ScrollView>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const scrollToIndex = (index: number) => {
        scrollRef.current?.scrollTo({ x: index * SNAP_INTERVAL, animated: true });
    };

    const startAutoSlide = (items: CarouselImage[]) => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (items.length <= 1) return;
        intervalRef.current = setInterval(() => {
            setActiveIndex((prev) => {
                const next = (prev + 1) % items.length;
                scrollRef.current?.scrollTo({ x: next * SNAP_INTERVAL, animated: true });
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
        const index = Math.round(event.nativeEvent.contentOffset.x / SNAP_INTERVAL);
        setActiveIndex(index);
    };

    const handleScrollBeginDrag = () => {
        if (data) startAutoSlide(data);
    };

    const goToSlide = (index: number) => {
        scrollToIndex(index);
        setActiveIndex(index);
        if (data) startAutoSlide(data);
    };

    if (loading) {
        const peekWidth = SCREEN_WIDTH - LEFT_PADDING - CARD_WIDTH - CARD_SPACING;
        return (
            <View style={styles.container}>
                <View style={styles.shimmerRow}>
                    <ShimmerPlaceholder style={[styles.shimmerCard, { width: CARD_WIDTH, height: CARD_HEIGHT }]} />
                    <ShimmerPlaceholder style={{ width: peekWidth, height: CARD_HEIGHT, borderRadius: 12 }} />
                </View>
                <View style={styles.paginationContainer}>
                    {[0, 1, 2].map((i) => (
                        <ShimmerPlaceholder
                            key={i}
                            style={[styles.dot, i === 0 ? { width: 20, borderRadius: 3 } : null]}
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
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                onScrollBeginDrag={handleScrollBeginDrag}
                scrollEventThrottle={16}
                snapToInterval={SNAP_INTERVAL}
                decelerationRate="fast"
                contentContainerStyle={{ paddingLeft: LEFT_PADDING }}
            >
                {data.map((item) => (
                    <View key={item.id} style={[styles.cardShadow, { marginRight: CARD_SPACING }]}>
                        <View style={styles.card}>
                            <Image
                                source={{ uri: item.image }}
                                style={styles.cardImage}
                                resizeMode="cover"
                            />
                            <LinearGradient
                                colors={['transparent', 'rgba(0,0,0,0.55)']}
                                style={styles.gradient}
                            />
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

            {data.length > 1 && (
                <View style={styles.paginationContainer}>
                    {data.map((_, index) => (
                        <TouchableOpacity
                            key={index}
                            onPress={() => goToSlide(index)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <View
                                style={[
                                    styles.dot,
                                    index === activeIndex
                                        ? { width: 20, backgroundColor: colors.primary }
                                        : { backgroundColor: colors.gray300 ?? '#D0D0D0' },
                                ]}
                            />
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 16,
        paddingBottom: 4,
    },
    shimmerRow: {
        flexDirection: 'row',
        paddingLeft: LEFT_PADDING,
        overflow: 'hidden',
    },
    shimmerCard: {
        borderRadius: 12,
        marginRight: CARD_SPACING,
    },
    // Outer wrapper carries the shadow; inner card clips the image with borderRadius
    cardShadow: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.14,
                shadowRadius: 8,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    card: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
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
        height: 80,
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
        fontWeight: '600',
        lineHeight: 20,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
});
