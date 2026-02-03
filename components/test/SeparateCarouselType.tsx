import React, { useRef, useState } from 'react';
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
const CARD_WIDTH = width * 0.89; // 85% of screen width
const CARD_SPACING = 12;
const SIDE_PEEK = (width - CARD_WIDTH) / 2; // Space to show on sides

interface SeparateCarouselTypeProps {
    data: CarouselImage[] | null;
    loading: boolean;
}

const ShimmerPlaceholder: React.FC<{ style?: any }> = ({ style }) => {
    const animatedValue = new Animated.Value(0);

    React.useEffect(() => {
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

export const SeparateCarouselType: React.FC<SeparateCarouselTypeProps> = ({ data, loading }) => {
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const scrollRef = useRef<ScrollView>(null);

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.carouselWrapper}>
                    <View style={styles.loadingContainer}>
                        {/* Center card */}
                        <ShimmerPlaceholder
                            style={{
                                width: CARD_WIDTH,
                                height: 200,
                                borderRadius: 12,
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
                                        marginHorizontal: 3,
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
        const index = Math.round(scrollPosition / (CARD_WIDTH + CARD_SPACING));
        setActiveIndex(index);
    };

    const goToSlide = (index: number) => {
        scrollRef.current?.scrollTo({
            x: index * (CARD_WIDTH + CARD_SPACING),
            animated: true,
        });
        setActiveIndex(index);
    };

    return (
        <View style={styles.container}>
            <View style={styles.carouselWrapper}>
                <ScrollView
                    ref={scrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    snapToInterval={CARD_WIDTH + CARD_SPACING}
                    decelerationRate="fast"
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingHorizontal: SIDE_PEEK - CARD_SPACING / 2 }
                    ]}
                >
                    {data?.map((item, index) => (
                        <TouchableOpacity
                            key={item.id}
                            activeOpacity={0.9}
                            onPress={() => goToSlide(index)}
                            style={[
                                styles.cardWrapper,
                                { marginRight: CARD_SPACING }
                            ]}
                        >
                            <View style={styles.card}>
                                <Image 
                                    source={{ uri: item.image }} 
                                    style={styles.carouselImage}
                                    resizeMode="cover"
                                />
                                <View style={styles.imageOverlay} />
                            </View>
                        </TouchableOpacity>
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
        paddingTop: 8,
    },
    carouselWrapper: {
        position: 'relative',
        
    },
    loadingContainer: {
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    scrollContent: {
        alignItems: 'center',
    },
    cardWrapper: {
        width: CARD_WIDTH,
    },
    card: {
        width: '100%',
        height: 150,
        borderRadius: 12,
        
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
        // Add shadow for depth
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    carouselImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 80,
    },
    pagination: {
        position: 'absolute',
        bottom: 16,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        marginHorizontal: 3,
    },
    activeDot: {
        backgroundColor: '#fff',
        width: 20,
        height: 6,
        borderRadius: 3,
    },
});