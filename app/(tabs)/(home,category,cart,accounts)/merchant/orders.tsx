import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { merchantBase } from "@/utils/services/merchantService";
import { useTheme } from "@/contexts/ThemeContext";

interface MerchantOrder {
  id: string;
  order_number: string;
  buyer_name?: string;
  total_amount: string;
  delivery_fee?: string;
  status: "NEW" | "CONTACTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  created_at: string;
  items_count: number;
  order_group_number?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: "New", color: "#2196F3", bg: "#E3F2FD" },
  CONTACTED: { label: "Contacted", color: "#FF9800", bg: "#FFF3E0" },
  CONFIRMED: { label: "Confirmed", color: "#4CAF50", bg: "#E8F5E9" },
  COMPLETED: { label: "Completed", color: "#8BC34A", bg: "#F1F8E9" },
  CANCELLED: { label: "Cancelled", color: "#F44336", bg: "#FFEBEE" },
};

const TABS = [
  { key: "ALL", label: "All" },
  { key: "NEW", label: "New" },
  { key: "ACTIVE", label: "Active" },
  { key: "COMPLETED", label: "Done" },
];

function filterOrders(orders: MerchantOrder[], tab: string): MerchantOrder[] {
  if (tab === "ALL") return orders;
  if (tab === "ACTIVE") return orders.filter((o) => ["NEW", "CONTACTED", "CONFIRMED"].includes(o.status));
  if (tab === "COMPLETED") return orders.filter((o) => o.status === "COMPLETED");
  if (tab === "NEW") return orders.filter((o) => o.status === "NEW");
  return orders;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function OrderCard({ order, colors }: { order: MerchantOrder; colors: any }) {
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.NEW;
  const isActionable = order.status === "NEW" || order.status === "CONFIRMED";

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() =>
        router.push({
          pathname: "/orderDetails/[id]",
          params: { id: order.id, isMerchant: "true" },
        })
      }
      activeOpacity={0.7}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <Text style={[styles.orderNumber, { color: colors.textPrimary }]}>
            {order.order_number}
          </Text>
          <Text style={[styles.orderMeta, { color: colors.textMuted }]}>
            {order.items_count} {order.items_count === 1 ? "item" : "items"} · {formatDate(order.created_at)}
          </Text>
          {order.buyer_name ? (
            <Text style={[styles.buyerName, { color: colors.textSecondary }]}>
              {order.buyer_name}
            </Text>
          ) : null}
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.amount, { color: colors.textPrimary }]}>
            UGX {parseFloat(order.total_amount).toLocaleString()}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        {isActionable ? (
          <Text style={[styles.actionHint, { color: colors.primary }]}>
            {order.status === "NEW" ? "Tap to confirm this order" : "Tap to mark as complete"}
          </Text>
        ) : (
          <Text style={[styles.actionHint, { color: colors.textMuted }]}>
            Tap to view details
          </Text>
        )}
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

export default function MerchantOrdersScreen() {
  const { colors, isDark } = useTheme();
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadOrders = useCallback(async (pageNum = 1, append = false) => {
    try {
      const data = await merchantBase.getMerchantOrders(pageNum);
      if (data) {
        const results: MerchantOrder[] = data.results || data;
        if (append) {
          setOrders((prev) => [...prev, ...results]);
        } else {
          setOrders(results);
        }
        setHasMore(!!data.next);
      }
    } catch (error) {
      if (__DEV__) console.error("Failed to load merchant orders:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setPage(1);
      loadOrders(1, false).finally(() => setLoading(false));
    }, [loadOrders])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadOrders(1, false);
    setRefreshing(false);
  };

  const onLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    await loadOrders(nextPage, true);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const filtered = filterOrders(orders, activeTab);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Orders</Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]}>
              {orders.length > 0 ? `${orders.length} orders received` : "Manage your orders"}
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Filter Tabs */}
        <View style={[styles.tabBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          {TABS.map((tab) => {
            const count =
              tab.key === "ALL"
                ? orders.length
                : filterOrders(orders, tab.key).length;
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  isActive && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isActive ? colors.primary : colors.textMuted },
                    isActive && { fontWeight: "700" },
                  ]}
                >
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.tabCount,
                      { backgroundColor: isActive ? colors.primary : colors.backgroundSecondary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabCountText,
                        { color: isActive ? "#fff" : colors.textMuted },
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <OrderCard order={item} colors={colors} />}
          contentContainerStyle={[
            styles.list,
            filtered.length === 0 && styles.listEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
                style={{ paddingVertical: 16 }}
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={56} color={colors.neutral300} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {activeTab === "ALL" ? "No orders yet" : `No ${TABS.find(t => t.key === activeTab)?.label.toLowerCase()} orders`}
              </Text>
              <Text style={[styles.emptyMessage, { color: colors.textMuted }]}>
                {activeTab === "ALL"
                  ? "When customers order from your store, they'll appear here"
                  : "Try switching to a different tab"}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSub: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 2,
  },

  // Tabs
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  tabLabel: {
    fontSize: 14,
  },
  tabCount: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  tabCountText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // List
  list: {
    padding: 16,
    gap: 12,
  },
  listEmpty: {
    flex: 1,
  },

  // Card
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardTop: {
    flexDirection: "row",
    padding: 14,
    gap: 12,
  },
  cardLeft: {
    flex: 1,
    gap: 4,
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: "700",
  },
  orderMeta: {
    fontSize: 13,
  },
  buyerName: {
    fontSize: 13,
    fontWeight: "500",
  },
  amount: {
    fontSize: 15,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  actionHint: {
    fontSize: 13,
  },

  // Empty
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});
