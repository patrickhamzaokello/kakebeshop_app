import React, { useRef, useState } from 'react';
import {
    View,
    ScrollView,
    Image,
    Dimensions,
    StyleSheet,
    ActivityIndicator,
    NativeScrollEvent,
    NativeSyntheticEvent,
} from 'react-native';
import { CarouselImage } from '@/utils/types/models';

const { width } = Dimensions.get('window');
const CAROUSEL_WIDTH = width - 32;

interface CarouselSectionProps {
    data: CarouselImage[] | null;
    loading: boolean;
}

export const CarouselSection: React.FC<CarouselSectionProps> = ({ data, loading }) => {
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const scrollRef = useRef<ScrollView>(null);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / CAROUSEL_WIDTH);
        setActiveIndex(index);
    };

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                snapToInterval={CAROUSEL_WIDTH + 16}
                decelerationRate="fast"
                contentContainerStyle={styles.scrollContent}
            >
                {data?.map((item) => (
                    <Image key={item.id} source={{ uri: item.image }} style={styles.carouselImage} />
                ))}
            </ScrollView>

            <View style={styles.pagination}>
                {data?.map((_, index) => (
                    <View key={index} style={[styles.dot, index === activeIndex && styles.activeDot]} />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 12,
    },
    loadingContainer: {
        height: 160,
        backgroundColor: '#E5E5EA',
        marginHorizontal: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 16,
    },
    carouselImage: {
        width: CAROUSEL_WIDTH,
        height: 160,
        borderRadius: 12,
        marginRight: 16,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 12,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#C7C7CC',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: '#007AFF',
        width: 24,
    },
});