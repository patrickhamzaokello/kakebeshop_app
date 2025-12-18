import React, { useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Animated,
} from 'react-native';
import {
    MaterialIcons,
    FontAwesome5,
    Ionicons,
    Feather,
    MaterialCommunityIcons,
    AntDesign,
    Entypo
} from '@expo/vector-icons';
import { Category } from '@/utils/types/models';
import { SectionHeader } from '@/components/test/common/SectionHeader';

interface CategoriesSectionProps {
    data: Category[] | null;
    loading: boolean;
    onCategoryPress: (category: Category) => void;
    onSeeAll?: () => void;
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
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                        <View key={item} style={styles.categoryItem}>
                            {/* Icon container shimmer */}
                            <ShimmerPlaceholder
                                style={[styles.iconContainer, { borderRadius: 32 }]}
                            />
                            {/* Category name shimmer */}
                            <ShimmerPlaceholder
                                style={{
                                    width: 60,
                                    height: 10,
                                    borderRadius: 4,
                                    marginTop: 8,
                                }}
                            />
                            {/* Second line of text (optional) */}
                            <ShimmerPlaceholder
                                style={{
                                    width: 45,
                                    height: 10,
                                    borderRadius: 4,
                                    marginTop: 4,
                                }}
                            />
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    }

    // Get icon component for each category
    const getCategoryIcon = (category: Category) => {
        const iconMap: Record<string, { Component: React.ComponentType<any>, name: string, library?: string }> = {
            'AGRO': { Component: Entypo , name: 'leaf' },
            'BEAUTY': { Component: MaterialIcons, name: 'spa' },
            'CRAFTS': { Component: AntDesign , name: 'build' },
            'ELECTRONICS': { Component: MaterialIcons, name: 'devices' },
            'FASHION': { Component: MaterialCommunityIcons, name: 'hanger' },
            'FOOD': { Component: MaterialCommunityIcons, name: 'food-apple' },
            'HEALTH': { Component: FontAwesome5, name: 'heartbeat' },
            'HOME': { Component: MaterialIcons, name: 'home-max' },
            'KIDS': { Component: FontAwesome5, name: 'baby' },
            'MARKET': { Component: MaterialCommunityIcons, name: 'shopping' },
            'TVS': { Component: MaterialIcons, name: 'tv' },
        };

        // Try exact match first
        let iconConfig = iconMap[category.name.toUpperCase()];

        // If no exact match, check if it's a subcategory of ELECTRONICS
        if (!iconConfig && category.parent) {
            // Check parent category (ELECTRONICS has children)
            if (category.parent === 'efd0b514-7dc9-4f18-abad-c3d1603a4f84') {
                iconConfig = iconMap[category.name.toUpperCase()] || { Component: MaterialIcons, name: 'devices' };
            }
        }

        // Default fallback icon
        if (!iconConfig) {
            iconConfig = { Component: MaterialIcons, name: 'category' };
        }

        return iconConfig;
    };

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
            >
                {data?.map((category) => {
                    const iconConfig = getCategoryIcon(category);
                    const IconComponent = iconConfig.Component;

                    return (
                        <TouchableOpacity
                            key={category.id}
                            style={styles.categoryItem}
                            onPress={() => onCategoryPress(category)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.iconContainer}>
                                <IconComponent
                                    name={iconConfig.name}
                                    size={32}
                                    color="#000"
                                />
                            </View>
                            <Text style={styles.categoryName} numberOfLines={3}>
                                {category.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 16,
    },
    scrollContent: {
        paddingHorizontal: 16,
    },
    categoryItem: {
        alignItems: 'center',
        marginRight: 10,
        width: 70,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#E0E8ED',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    categoryName: {
        fontSize: 10,
        textAlign: 'center',
        color: '#000',
        fontWeight: '500',
    },
});