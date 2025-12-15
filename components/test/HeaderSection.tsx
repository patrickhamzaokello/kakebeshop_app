import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HeaderData } from '@/utils/models';

interface HeaderSectionProps {
    data: HeaderData | null;
    loading: boolean;
    onSearch: () => void;
    onNotificationPress: () => void;
}

export const HeaderSection: React.FC<HeaderSectionProps> = ({
                                                                data,
                                                                loading,
                                                                onSearch,
                                                                onNotificationPress,
                                                            }) => {
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.topRow}>
                <View style={styles.userInfo}>
                    <Image source={{ uri: data?.user.avatar }} style={styles.avatar} />
                    <View>
                        <Text style={styles.welcomeText}>Welcome back,</Text>
                        <Text style={styles.userName}>{data?.user.name}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.notificationButton} onPress={onNotificationPress}>
                    <Ionicons name="notifications-outline" size={24} color="#000" />
                    {(data?.notificationsCount ?? 0) > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{data?.notificationsCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.searchBar} onPress={onSearch}>
                <Ionicons name="search" size={20} color="#666" />
                <Text style={styles.searchPlaceholder}>Search products...</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        padding: 16,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        height: 120,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
    },
    welcomeText: {
        fontSize: 14,
        color: '#666',
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
    notificationButton: {
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
        borderRadius: 10,
        padding: 12,
    },
    searchPlaceholder: {
        marginLeft: 8,
        fontSize: 16,
        color: '#666',
    },
});