import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { Category } from '@/utils/types/models';
import { SectionHeader } from '@/components/test/common/SectionHeader';

interface CategoriesSectionProps {
    data: Category[] | null;
    loading: boolean;
    onCategoryPress: (category: Category) => void;
    onSeeAll?: () => void;
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
                                                                        data,
                                                                        loading,
                                                                        onCategoryPress,
                                                                        onSeeAll,
                                                                    }) => {
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
            </View>
        );
    }

    // Get emoji for category or use default
    const getCategoryEmoji = (category: Category): string => {
        const emojiMap: Record<string, string> = {
            'FOOD': '🍕',
            'ELECTRONICS': '📱',
            'FASHION': '👕',
            'HOME': '🏠',
            'SPORTS': '⚽',
            'BOOKS': '📚',
            'BEAUTY': '💄',
            'AUTOMOTIVE': '🚗',
        };
        return category.icon || emojiMap[category.name.toUpperCase()] || '📦';
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
                {data?.map((category) => (
                    <TouchableOpacity
                        key={category.id}
                        style={styles.categoryItem}
                        onPress={() => onCategoryPress(category)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.iconContainer}>
                            <Text style={styles.emoji}>{getCategoryEmoji(category)}</Text>
                        </View>
                        <Text style={styles.categoryName} numberOfLines={1}>
                            {category.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 16,
    },
    loadingContainer: {
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        paddingHorizontal: 16,
    },
    categoryItem: {
        alignItems: 'center',
        marginRight: 20,
        width: 70,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F2F2F7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    emoji: {
        fontSize: 32,
    },
    categoryName: {
        fontSize: 12,
        textAlign: 'center',
        color: '#000',
    },
});