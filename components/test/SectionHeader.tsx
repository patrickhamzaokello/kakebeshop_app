import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SectionHeaderProps {
    title: string;
    onSeeAll?: () => void;
    showSeeAll?: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
                                                                title,
                                                                onSeeAll,
                                                                showSeeAll = true,
                                                            }) => (
    <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        {showSeeAll && onSeeAll && (
            <TouchableOpacity onPress={onSeeAll} style={styles.seeAllButton}>
                <Text style={styles.seeAllText}>See All</Text>
                <Ionicons name="chevron-forward" size={16} color="#007AFF" />
            </TouchableOpacity>
        )}
    </View>
);

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    seeAllText: {
        fontSize: 14,
        color: '#007AFF',
        marginRight: 4,
    },
});