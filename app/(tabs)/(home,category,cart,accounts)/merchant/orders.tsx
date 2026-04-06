import React, { useState, useCallback, useRef } from "react";
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
import { merchantBase, MerchantOrderStatus } from "@/utils/services/merchantService";
import { useTheme } from "@/contexts/ThemeContext";

// ─── Types ─────────────────���──────────────────────���───────────────────────────

interface MerchantOrder {
  id: string;
  order_number: string;
  buyer_name?: string;
  total_amount: string;
  delivery_fee?: string;
  status: MerchantOrderStatus;
  created_at: string;
  items_count: number;
  order_group_number?: string;
}

// ─── Config ──────────────────────────────────────────────��────────────────────

const STATUS_CONFIG: Record<MerchantOrderStatus, { label: string; color: string; bg: string }> = {
  NEW:       { label: "New",       color: "#2196F3", bg: "#2196F315" },
  CONTACTED: { label: "Contacted", color: "#FF9800", bg: "#FF980015" },
  CONFIRMED: { label: "Confirmed", color: "#4CAF50", bg: "#4CAF5015" },
  COMPLETED: { label: "Completed", color: "#8BC34A", bg: "#8BC34A15" },
  CANCELLED: { label: "Cancelled", color: "#F44336", bg: "#F4433615" },
};

// Each tab maps directly to an API ?status= value (ALL = no filter)
const TABS: { key: "ALL" | MerchantOrderStatus; label: string }[] = [
  { key: "ALL",       label: "All" },
  { key: "NEW",       label: "New" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "COMPLETED", label: "Done" },
  { key: "CANCELLED", label: "Cancelled" },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Order card ────────���────────────────────────��─────────────────────────────

function OrderCard({ order, colors }: { order: MerchantOrder; colors: any }) {
  const status = STATUS_CONFIG[order.status];
  const isActionable = order.status === "NEW" || order.status === "CONFIRMED";

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
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
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        <Text style={[styles.actionHint, { color: isActionable ? colors.primary : colors.textMuted }]}>
          {order.status === "NEW"
            ? "Tap to confirm this order"
            : order.status === "CONFIRMED"
            ? "Tap to mark as complete"
            : "Tap to view details"}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ─────────────────────���─────────────────��──────────────────────

export default function MerchantOrdersScreen() {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<"ALL" | MerchantOrderStatus>("ALL");

  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadOrders = useCallback(
    async (tab: "ALL" | MerchantOrderStatus, pageNum = 1, append = false) => {
      const status = tab === "ALL" ? undefined : tab;
      const data = await merchantBase.getMerchantOrders(pageNum, status);
      if (!data) return;
      const results: MerchantOrder[] = data.results ?? data;
      setOrders((prev) => (append ? [...prev, ...results] : results));
      setHasMore(!!data.next);
    },
    []
  );

  // Reload when the screen gains focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setPage(1);
      loadOrders(activeTab, 1, false).finally(() => setLoading(false));
    }, [activeTab, loadOrders])
  );

  const handleTabChange = (tab: "ALL" | MerchantOrderStatus) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setOrders([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    loadOrders(tab, 1, false).finally(() => setLoading(false));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await loadOrders(activeTab, 1, false);
    setRefreshing(false);
  };

  const onLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const next = page + 1;
    await loadOrders(activeTab, next, true);
    setPage(next);
    setLoadingMore(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
        {/* Header */}
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
              {loading ? "Loading…" : `${orders.length} order${orders.length !== 1 ? "s" : ""}`}
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Status filter tabs — server-side filtered */}
        <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, isActive && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                onPress={() => handleTabChange(tab.key)}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isActive ? colors.primary : colors.textMuted },
                    isActive && styles.tabLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <OrderCard order={item} colors={colors} />}
          contentContainerStyle={[styles.list, orders.length === 0 && styles.listEmpty]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.listFooter} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={52} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {activeTab === "ALL" ? "No orders yet" : `No ${STATUS_CONFIG[activeTab as MerchantOrderStatus]?.label.toLowerCase()} orders`}
              </Text>
              <Text style={[styles.emptyMessage, { color: colors.textMuted }]}>
                {activeTab === "ALL"
                  ? "When customers place orders, they'll appear here"
                  : "Try another tab to see other orders"}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// ─── Styles ─────────────────��──────────────────────────���──────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  headerSub: { fontSize: 12, textAlign: "center", marginTop: 1 },

  tabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  tabLabel: { fontSize: 13 },
  tabLabelActive: { fontWeight: "700" },

  list: { padding: 16, gap: 10 },
  listEmpty: { flex: 1 },
  listFooter: { paddingVertical: 16 },

  card: { borderRadius: 14, overflow: "hidden" },
  cardTop: { flexDirection: "row", padding: 14, gap: 12 },
  cardLeft: { flex: 1, gap: 4 },
  cardRight: { alignItems: "flex-end", gap: 6 },
  orderNumber: { fontSize: 15, fontWeight: "700" },
  orderMeta: { fontSize: 12 },
  buyerName: { fontSize: 13, fontWeight: "500" },
  amount: { fontSize: 15, fontWeight: "700" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: "600" },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionHint: { fontSize: 13 },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  emptyMessage: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
