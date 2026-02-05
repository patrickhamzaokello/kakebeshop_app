import { SectionHeader } from '@/components/test/common/SectionHeader';
import { Category } from '@/utils/types/models';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface CategoriesSectionProps {
    data: Category[] | null;
    loading: boolean;
    onCategoryPress: (category: Category) => void;
    onSeeAll?: () => void;
}

const ShimmerPlaceholder: React.FC<{ style?: any }> = ({ style }) => {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.6],
    });

    return (
        <Animated.View
            style={[
                {
                    backgroundColor: '#F5F5F7',
                    opacity,
                },
                style,
            ]}
        />
    );
};

const CategoryChip: React.FC<{
    category: Category;
    onPress: (category: Category) => void;
    index: number;
}> = ({ category, onPress, index }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(15)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                delay: index * 40,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                delay: index * 40,
                tension: 60,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    const getCategoryStyle = (category: Category) => {
        const styles: Record<string, {
            gradient: string[],
            textColor: string,
        }> = {
            'AGRO': {
                gradient: ['#FFFFFF', '#F0FDF4'],
                textColor: '#166534',
            },
            'BEAUTY': {
                gradient: ['#FFFFFF', '#FDF2F8'],
                textColor: '#9F1239',
            },
            'CRAFTS': {
                gradient: ['#FFFFFF', '#FFF7ED'],
                textColor: '#9A3412',
            },
            'ELECTRONICS': {
                gradient: ['#FFFFFF', '#EFF6FF'],
                textColor: '#1E40AF',
            },
            'FASHION': {
                gradient: ['#FFFFFF', '#F5F3FF'],
                textColor: '#6B21A8',
            },
            'FOOD': {
                gradient: ['#FFFFFF', '#FEF2F2'],
                textColor: '#991B1B',
            },
            'HEALTH': {
                gradient: ['#FFFFFF', '#FFF1F2'],
                textColor: '#BE123C',
            },
            'HOME': {
                gradient: ['#FFFFFF', '#EEF2FF'],
                textColor: '#3730A3',
            },
            'KIDS': {
                gradient: ['#FFFFFF', '#FDF2F8'],
                textColor: '#A21CAF',
            },
            'MARKET': {
                gradient: ['#FFFFFF', '#F0FDFA'],
                textColor: '#115E59',
            },
            'TVS': {
                gradient: ['#FFFFFF', '#EFF6FF'],
                textColor: '#1E3A8A',
            },
        };

        let style = styles[category.name.toUpperCase()];

        if (!style && category.parent === 'efd0b514-7dc9-4f18-abad-c3d1603a4f84') {
            style = styles[category.name.toUpperCase()] || styles['ELECTRONICS'];
        }

        return style || {
            gradient: ['#FFFFFF', '#F9FAFB'],
            textColor: '#374151',
        };
    };

    const style = getCategoryStyle(category);

    return (
        <Animated.View
            style={[
                {
                    opacity: fadeAnim,
                    transform: [
                        { scale: scaleAnim },
                        { translateY: slideAnim }
                    ]
                }
            ]}
        >
            <TouchableOpacity
                onPress={() => onPress(category)}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
            >
                <View
                    style={styles.chip}
                >
                    <Text style={[styles.chipText, { color: style.textColor }]}>
                        {category.name}
                    </Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
    data,
    loading,
    onCategoryPress,
    onSeeAll,
}) => {
    if (loading) {
        return (
            <View style={styles.container}>
                <SectionHeader
                    title="Categories"
                    onSeeAll={onSeeAll}
                    showSeeAll={!!onSeeAll}
                />

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    scrollEnabled={false}
                >
                    {[1, 2, 3, 4, 5].map((item) => (
                        <ShimmerPlaceholder
                            key={item}
                            style={styles.shimmerChip}
                        />
                    ))}
                </ScrollView>
            </View>
        );
    }

    if (!data || data.length === 0) {
        return (
            <View style={styles.container}>
                <SectionHeader
                    title="Categories"
                    onSeeAll={onSeeAll}
                    showSeeAll={false}
                />
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No categories available</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SectionHeader
                title="Categories"
                onSeeAll={onSeeAll}
                showSeeAll={!!onSeeAll}
            />

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                decelerationRate="fast"
            >
                {data.map((category, index) => (
                    <CategoryChip
                        key={category.id}
                        category={category}
                        onPress={onCategoryPress}
                        index={index}
                    />
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 20,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    chip: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.06)',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    chipText: {
        fontSize: 14,
        fontWeight: '600',
        letterSpacing: -0.2,
    },
    shimmerChip: {
        height: 40,
        width: 100,
        borderRadius: 24,
        marginRight: 10,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 24,
    },
    emptyText: {
        fontSize: 14,
        color: '#9CA3AF',
        fontWeight: '500',
    },
});