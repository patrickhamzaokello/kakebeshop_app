import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import apiService from "@/utils/apiBase";

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  order_id: string | null;
  merchant_id: string | null;
  listing_id: string | null;
  metadata: Record<string, any>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [filter])
  );

  const fetchNotifications = async () => {
    try {
      const endpoint = filter === 'unread' 
        ? '/api/v1/notifications/unread/'
        : '/api/v1/notifications/';
      
      const response = await apiService.get(endpoint);
      
      if (response.success) {
        const data = response.data.results || response.data;
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      try {
        await apiService.post(
          `/api/v1/notifications/${notification.id}/mark_as_read/`
        );
        
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    }

    // Navigate based on notification type
    if (notification.order_id) {
      router.push(`/orders/${notification.order_id}` as any);
    } else if (notification.merchant_id) {
      router.push(`/merchant/dashboard` as any);
    } else if (notification.listing_id) {
      router.push(`/listing/${notification.listing_id}` as any);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiService.post('/api/v1/notifications/mark_all_as_read/');
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      ORDER_CREATED: 'receipt-outline',
      ORDER_CONTACTED: 'call-outline',
      ORDER_CONFIRMED: 'checkmark-circle-outline',
      ORDER_COMPLETED: 'checkmark-done-circle-outline',
      ORDER_CANCELLED: 'close-circle-outline',
      MERCHANT_NEW_ORDER: 'cart-outline',
      MERCHANT_APPROVED: 'checkmark-circle-outline',
      MERCHANT_DEACTIVATED: 'alert-circle-outline',
      MERCHANT_SUSPENDED: 'warning-outline',
      LISTING_APPROVED: 'checkmark-outline',
      LISTING_REJECTED: 'close-outline',
    };
    
    return iconMap[type] || 'notifications-outline';
  };

  const getNotificationColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      ORDER_CREATED: '#4CAF50',
      ORDER_CONTACTED: '#2196F3',
      ORDER_CONFIRMED: '#4CAF50',
      ORDER_COMPLETED: '#8BC34A',
      ORDER_CANCELLED: '#F44336',
      MERCHANT_NEW_ORDER: '#E60549',
      MERCHANT_APPROVED: '#4CAF50',
      MERCHANT_DEACTIVATED: '#F44336',
      MERCHANT_SUSPENDED: '#FF9800',
      LISTING_APPROVED: '#4CAF50',
      LISTING_REJECTED: '#F44336',
    };
    
    return colorMap[type] || '#666';
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        return `${interval}${unit[0]} ago`;
      }
    }

    return 'Just now';
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const iconName = getNotificationIcon(item.notification_type);
    const iconColor = getNotificationColor(item.notification_type);

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !item.is_read && styles.unreadCard,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationContent}>
          <View style={[styles.iconContainer, { backgroundColor: `${iconColor}15` }]}>
            <Ionicons name={iconName} size={24} color={iconColor} />
          </View>

          <View style={styles.textContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.notificationTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {!item.is_read && <View style={styles.unreadDot} />}
            </View>

            <Text style={styles.notificationMessage} numberOfLines={2}>
              {item.message}
            </Text>

            <View style={styles.metaRow}>
              <Text style={styles.timeAgo}>
                {formatTimeAgo(item.created_at)}
              </Text>
              
              {item.metadata?.order_number && (
                <View style={styles.metaBadge}>
                  <Ionicons name="receipt-outline" size={12} color="#666" />
                  <Text style={styles.metaText}>
                    {item.metadata.order_number}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#CCC" />
      </TouchableOpacity>
    );
  };

  const renderHeader = () => {
    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
      <View style={styles.header}>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filter === 'unread' && styles.filterButtonActive]}
            onPress={() => setFilter('unread')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
              Unread
              {unreadCount > 0 && ` (${unreadCount})`}
            </Text>
          </TouchableOpacity>
        </View>

        {unreadCount > 0 && filter === 'all' && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-done-outline" size={16} color="#E60549" />
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#E60549" />
        </View>
      );
    }

    return (
      <View style={styles.centerContainer}>
        <Ionicons
          name={filter === 'unread' ? 'checkmark-circle-outline' : 'notifications-outline'}
          size={64}
          color="#CCC"
        />
        <Text style={styles.emptyTitle}>
          {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
        </Text>
        <Text style={styles.emptyText}>
          {filter === 'unread'
            ? 'You have no unread notifications'
            : 'Notifications will appear here when you receive them'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E60549"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  listContent: {
    paddingBottom: 20,
  },

  // Header
  header: {
    backgroundColor: "white",
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 12,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
  },
  filterButtonActive: {
    backgroundColor: "#E60549",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  filterTextActive: {
    color: "white",
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    paddingHorizontal: 20,
    gap: 6,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E60549",
  },

  // Notification Card
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  unreadCard: {
    backgroundColor: "#FFF5F8",
  },
  notificationContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E60549",
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timeAgo: {
    fontSize: 12,
    color: "#999",
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
  },

  // Empty State
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
});