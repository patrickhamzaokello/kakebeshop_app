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
const CARD_WIDTH = width * 0.85; // 85% of screen width
const CARD_SPACING = 16; // Space between cards
const LEFT_PADDING = 20; // Left padding as requested
const PEEK_WIDTH = 10; // How much of the next card shows

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
                        <ShimmerPlaceholder
                            style={{
                                width: CARD_WIDTH,
                                height: 150,
                                borderRadius: 16,
                                marginLeft: LEFT_PADDING,
                            }}
                        />
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
                    contentContainerStyle={{
                        paddingLeft: LEFT_PADDING,
                        paddingRight: PEEK_WIDTH,
                    }}
                >
                    {data?.map((item, index) => (
                        <TouchableOpacity
                            key={item.id}
                            activeOpacity={0.9}
                            onPress={() => goToSlide(index)}
                            style={[
                                styles.cardWrapper,
                                { marginRight: index === data.length - 1 ? 0 : CARD_SPACING }
                            ]}
                        >
                            <View style={styles.card}>
                                <Image 
                                    source={{ uri: item.image }} 
                                    style={styles.carouselImage}
                                    resizeMode="cover"
                                />
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 20,
        paddingBottom: 16,
    },
    carouselWrapper: {
        position: 'relative',
    },
    loadingContainer: {
        height: 150,
        justifyContent: 'center',
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
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#f5f5f5',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    carouselImage: {
        width: '100%',
        height: '100%',
    },
});