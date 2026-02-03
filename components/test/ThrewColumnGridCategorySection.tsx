import React, { useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
} from 'react-native';
import { Category } from '@/utils/types/models';
import { SectionHeader } from '@/components/test/common/SectionHeader';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.42; // Responsive width (42% of screen)
const CARD_HEIGHT = 50; // Fixed height - more compact
const CARD_SPACING = 10;

interface ThrewColumnGridCategorySectionProps {
    data: Category[] | null;
    titleText: string;
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

export const ThrewColumnGridCategorySection: React.FC<ThrewColumnGridCategorySectionProps> = ({
    titleText,
    data,
    loading,
    onCategoryPress,
    onSeeAll,
}) => {
    if (loading) {
        return (
            <View style={styles.container}>
                <SectionHeader
                    title={titleText}
                    onSeeAll={onSeeAll}
                    showSeeAll={!!onSeeAll}
                />

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    scrollEnabled={false}
                >
                    {/* Create 2 columns of 3 rows each for shimmer */}
                    {[0, 1].map((col) => (
                        <View key={col} style={styles.column}>
                            {[1, 2, 3].map((row) => (
                                <View key={row} style={styles.shimmerCard}>
                                    <ShimmerPlaceholder
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: 8,
                                        }}
                                    />
                                </View>
                            ))}
                        </View>
                    ))}
                </ScrollView>
            </View>
        );
    }

    // Organize data into columns (each column has 3 rows)
    const organizeIntoColumns = () => {
        if (!data) return [];
        
        const columns: Category[][] = [];
        let currentColumn: Category[] = [];
        
        data.forEach((category, index) => {
            currentColumn.push(category);
            
            // Every 3 items, start a new column
            if ((index + 1) % 3 === 0) {
                columns.push([...currentColumn]);
                currentColumn = [];
            }
        });
        
        // Add remaining items as last column
        if (currentColumn.length > 0) {
            columns.push(currentColumn);
        }
        
        return columns;
    };

    const columns = organizeIntoColumns();

    return (
        <View style={styles.container}>
            <SectionHeader
                title={titleText}
                onSeeAll={onSeeAll}
                showSeeAll={!!onSeeAll}
            />

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {columns.map((column, colIndex) => (
                    <View key={colIndex} style={styles.column}>
                        {column.map((category) => (
                            <TouchableOpacity
                                key={category.id}
                                style={styles.card}
                                onPress={() => onCategoryPress(category)}
                                activeOpacity={0.7}
                            >
                                <Text 
                                    style={styles.categoryTitle} 
                                    numberOfLines={2}
                                    ellipsizeMode="tail"
                                >
                                    {category.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
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
        gap: CARD_SPACING  + 5,
    },
    column: {
        gap: CARD_SPACING,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    shimmerCard: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 8,
        overflow: 'hidden',
    },
    categoryTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        textAlign: 'center',
        lineHeight: 18,
    },
});