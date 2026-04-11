import React, { useState, useCallback } from "react";
import { Text } from "@/components/Text";
import {
  View,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import apiService from "@/utils/apiBase";
import { useTheme } from "@/contexts/ThemeContext";

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

interface Section {
  title: string;
  data: Notification[];
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const getIcon = (type: string): keyof typeof Ionicons.glyphMap => {
  const map: Record<string, keyof typeof Ionicons.glyphMap> = {
    ORDER_CREATED: "receipt-outline",
    ORDER_CONTACTED: "call-outline",
    ORDER_CONFIRMED: "checkmark-circle-outline",
    ORDER_COMPLETED: "checkmark-done-circle-outline",
    ORDER_CANCELLED: "close-circle-outline",
    MERCHANT_NEW_ORDER: "cart-outline",
    MERCHANT_APPROVED: "checkmark-circle-outline",
    MERCHANT_DEACTIVATED: "alert-circle-outline",
    MERCHANT_SUSPENDED: "warning-outline",
    LISTING_APPROVED: "checkmark-outline",
    LISTING_REJECTED: "close-outline",
  };
  return map[type] || "notifications-outline";
};

const getColor = (type: string): string => {
  const map: Record<string, string> = {
    ORDER_CREATED: "#4CAF50",
    ORDER_CONTACTED: "#2196F3",
    ORDER_CONFIRMED: "#4CAF50",
    ORDER_COMPLETED: "#8BC34A",
    ORDER_CANCELLED: "#F44336",
    MERCHANT_NEW_ORDER: "#E60549",
    MERCHANT_APPROVED: "#4CAF50",
    MERCHANT_DEACTIVATED: "#F44336",
    MERCHANT_SUSPENDED: "#FF9800",
    LISTING_APPROVED: "#4CAF50",
    LISTING_REJECTED: "#F44336",
  };
  return map[type] || "#888";
};

const formatTimeAgo = (dateString: string): string => {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const groupByDate = (items: Notification[]): Section[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const weekAgo = today - 6 * 86400000;

  const buckets: Record<string, Notification[]> = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    Earlier: [],
  };

  for (const n of items) {
    const t = new Date(n.created_at).getTime();
    if (t >= today) buckets["Today"].push(n);
    else if (t >= yesterday) buckets["Yesterday"].push(n);
    else if (t >= weekAgo) buckets["This Week"].push(n);
    else buckets["Earlier"].push(n);
  }

  return Object.entries(buckets)
    .filter(([, data]) => data.length > 0)
    .map(([title, data]) => ({ title, data }));
};

// ─── main component ───────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [filter])
  );

  const fetchNotifications = async () => {
    try {
      const endpoint = filter === "unread"
        ? "/api/v1/notifications/unread/"
        : "/api/v1/notifications/";
      const response = await apiService.get(endpoint);
      if (response.success) {
        const data = response.data.results || response.data;
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      if (__DEV__) console.error("Error fetching notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePress = async (item: Notification) => {
    if (!item.is_read) {
      try {
        await apiService.post(`/api/v1/notifications/${item.id}/mark_as_read/`);
        setNotifications(prev =>
          prev.map(n => (n.id === item.id ? { ...n, is_read: true } : n))
        );
      } catch (e) {
        if (__DEV__) console.error(e);
      }
    }
    if (item.order_id) {
      router.push(`/(tabs)/(accounts)/orderDetails/${item.order_id}` as any);
    } else if (item.merchant_id) {
      router.push(`/merchant/dashboard` as any);
    } else if (item.listing_id) {
      router.push(`/listing/${item.listing_id}` as any);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiService.post("/api/v1/notifications/mark_all_as_read/");
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      if (__DEV__) console.error(e);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const sections = groupByDate(
    filter === "unread" ? notifications.filter(n => !n.is_read) : notifications
  );

  // ─── sub-renders ────────────────────────────────────────────────────────────

  const renderFilterBar = () => (
    <View style={[styles.filterBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={styles.filterTabs}>
        {(["all", "unread"] as const).map(tab => {
          const active = filter === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.filterTab,
                active
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.backgroundSecondary },
              ]}
              onPress={() => setFilter(tab)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterTabText, { color: active ? "#fff" : colors.textSecondary }]}>
                {tab === "all" ? "All" : "Unread"}
              </Text>
              {tab === "unread" && unreadCount > 0 && (
                <View style={[styles.countBadge, { backgroundColor: active ? "rgba(255,255,255,0.3)" : colors.primary }]}>
                  <Text style={styles.countBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {unreadCount > 0 && filter === "all" && (
        <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAllRead} activeOpacity={0.7}>
          <Ionicons name="checkmark-done-outline" size={15} color={colors.primary} />
          <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all read</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionHeaderText, { color: colors.textMuted }]}>{section.title}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: Notification }) => {
    const iconName = getIcon(item.notification_type);
    const iconColor = getColor(item.notification_type);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
          !item.is_read && { borderLeftColor: iconColor, borderLeftWidth: 3 },
        ]}
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconWrap, { backgroundColor: `${iconColor}15` }]}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.cardTime, { color: colors.textMuted }]}>
              {formatTimeAgo(item.created_at)}
            </Text>
          </View>

          <Text style={[styles.cardMessage, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.message}
          </Text>

          {item.metadata?.order_number && (
            <View style={[styles.orderChip, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="receipt-outline" size={11} color={colors.textMuted} />
              <Text style={[styles.orderChipText, { color: colors.textSecondary }]}>
                {item.metadata.order_number}
              </Text>
            </View>
          )}
        </View>

        {!item.is_read && <View style={[styles.unreadDot, { backgroundColor: iconColor }]} />}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#E60549" />
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconWrap, { backgroundColor: colors.backgroundSecondary }]}>
          <Ionicons
            name={filter === "unread" ? "checkmark-done-circle-outline" : "notifications-off-outline"}
            size={36}
            color={colors.textMuted}
          />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
          {filter === "unread" ? "All caught up!" : "No notifications yet"}
        </Text>
        <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
          {filter === "unread"
            ? "You have no unread notifications"
            : "Notifications will appear here when you receive them"}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderFilterBar()}
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} tintColor="#E60549" />
        }
      />
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: 32, flexGrow: 1 },

  // Filter bar
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterTabs: { flexDirection: "row", gap: 8 },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filterTabText: { fontSize: 13, fontWeight: "600" },
  countBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  countBadgeText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  markAllBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  markAllText: { fontSize: 12, fontWeight: "600" },

  // Section header
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  // Card
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  cardBody: { flex: 1, gap: 4 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: "600" },
  cardTime: { fontSize: 11, flexShrink: 0 },
  cardMessage: { fontSize: 13, lineHeight: 18 },
  orderChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 2,
  },
  orderChipText: { fontSize: 11, fontWeight: "600" },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 6,
    flexShrink: 0,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", textAlign: "center" },
  emptyMessage: { fontSize: 13, textAlign: "center", lineHeight: 20 },
});
