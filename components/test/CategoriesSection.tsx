import { SectionHeader } from '@/components/test/common/SectionHeader';
import { borderRadius } from '@/constants/theme';
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
import { useTheme } from '@/contexts/ThemeContext';

interface CategoriesSectionProps {
    data: Category[] | null;
    loading: boolean;
    onCategoryPress: (category: Category) => void;
    onSeeAll?: () => void;
}

const ShimmerPlaceholder: React.FC<{ style?: any }> = ({ style }) => {
    const { colors } = useTheme();
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
                    backgroundColor: colors.gray300,
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
    const { colors, isDark } = useTheme();
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
                    style={[styles.chip, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                >
                    <Text style={[styles.chipText, { color: colors.textPrimary }]}>
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
    const { colors } = useTheme();

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
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>No categories available</Text>
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
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    chip: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 5,
        marginRight: 10,
        borderWidth: 1,
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
        fontWeight: '500',
    },
});