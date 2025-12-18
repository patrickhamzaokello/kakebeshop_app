import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    Image,
    Dimensions,
    StyleSheet,
    NativeScrollEvent,
    NativeSyntheticEvent,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { CarouselImage } from '@/utils/types/models';

const { width } = Dimensions.get('window');
const CAROUSEL_WIDTH = width - 32;
const AUTO_SLIDE_INTERVAL = 3500; // 3.5 seconds

interface CarouselSectionProps {
    data: CarouselImage[] | null;
    loading: boolean;
}

const ShimmerPlaceholder: React.FC<{ style?: any }> = ({ style }) => {
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
                    backgroundColor: '#E0E0E0',
                    opacity,
                },
                style,
            ]}
        />
    );
};

export const CarouselSection: React.FC<CarouselSectionProps> = ({ data, loading }) => {
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const scrollRef = useRef<ScrollView>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Auto-slide functionality
    useEffect(() => {
        if (!data || data.length <= 1) return;

        const startAutoSlide = () => {
            intervalRef.current = setInterval(() => {
                setActiveIndex((prevIndex) => {
                    const nextIndex = (prevIndex + 1) % data.length;
                    scrollRef.current?.scrollTo({
                        x: nextIndex * (CAROUSEL_WIDTH + 16),
                        animated: true,
                    });
                    return nextIndex;
                });
            }, AUTO_SLIDE_INTERVAL);
        };

        startAutoSlide();

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [data]);

    // Reset auto-slide timer on manual scroll
    const resetAutoSlide = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        if (data && data.length > 1) {
            intervalRef.current = setInterval(() => {
                setActiveIndex((prevIndex) => {
                    const nextIndex = (prevIndex + 1) % data.length;
                    scrollRef.current?.scrollTo({
                        x: nextIndex * (CAROUSEL_WIDTH + 16),
                        animated: true,
                    });
                    return nextIndex;
                });
            }, AUTO_SLIDE_INTERVAL);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.carouselWrapper}>
                    <View style={styles.loadingContainer}>
                        {/* Carousel image shimmer */}
                        <ShimmerPlaceholder
                            style={{
                                width: CAROUSEL_WIDTH,
                                height: 180,
                                borderRadius: 8,
                            }}
                        />
                        
                        {/* Pagination dots shimmer */}
                        <View style={styles.pagination}>
                            {[1, 2, 3].map((_, index) => (
                                <ShimmerPlaceholder
                                    key={index}
                                    style={{
                                        width: index === 0 ? 20 : 6,
                                        height: 6,
                                        borderRadius: 3,
                                    }}
                                />
                            ))}
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / (CAROUSEL_WIDTH + 16));
        setActiveIndex(index);
    };

    const goToSlide = (index: number) => {
        scrollRef.current?.scrollTo({
            x: index * (CAROUSEL_WIDTH + 16),
            animated: true,
        });
        setActiveIndex(index);
        resetAutoSlide();
    };

    return (
        <View style={styles.container}>
            <View style={styles.carouselWrapper}>
                <ScrollView
                    ref={scrollRef}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    onScrollBeginDrag={resetAutoSlide}
                    scrollEventThrottle={16}
                    snapToInterval={CAROUSEL_WIDTH + 16}
                    decelerationRate="fast"
                    contentContainerStyle={styles.scrollContent}
                >
                    {data?.map((item) => (
                        <View key={item.id} style={styles.imageWrapper}>
                            <Image 
                                source={{ uri: item.image }} 
                                style={styles.carouselImage}
                                resizeMode="cover"
                            />
                            <View style={styles.imageOverlay} />
                        </View>
                    ))}
                </ScrollView>

                {data && data.length > 1 && (
                    <View style={styles.pagination}>
                        {data.map((_, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => goToSlide(index)}
                                activeOpacity={0.7}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <View
                                    style={[
                                        styles.dot,
                                        index === activeIndex && styles.activeDot,
                                    ]}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 8
    },
    carouselWrapper: {
        position: 'relative',
    },
    loadingContainer: {
        height: 180,
        marginHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    scrollContent: {
        paddingHorizontal: 16,
    },
    imageWrapper: {
        position: 'relative',
        marginRight: 16,
        borderRadius: 8,
        overflow: 'hidden',
    },
    carouselImage: {
        width: CAROUSEL_WIDTH,
        height: 180,
        borderRadius: 8,
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
    },
    pagination: {
        position: 'absolute',
        bottom: 12,
        right: 28,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 12,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    activeDot: {
        backgroundColor: '#fff',
        width: 20,
        height: 6,
        borderRadius: 3,
    },
});