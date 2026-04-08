import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { cartService } from "@/utils/services/cartService";
import { useTheme } from "@/contexts/ThemeContext";

interface Order {
  id: string;
  order_number: string;
  merchant_name: string;
  total_amount: string;
  status: string;
  created_at: string;
  items: Array<any>;
  order_group_number?: string;
}

export default function OrdersListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const fetchOrders = async () => {
    try {
      const data = await cartService.getOrders();
      setOrders(data);
    } catch (error) {
      if (__DEV__) console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status: string) => {
    const map: { [key: string]: string } = {
      NEW: "#2196F3",
      CONTACTED: "#FF9800",
      CONFIRMED: "#4CAF50",
      COMPLETED: "#8BC34A",
      CANCELLED: "#F44336",
    };
    return map[status] || "#666";
  };

  const getStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
      NEW: "New",
      CONTACTED: "Contacted",
      CONFIRMED: "Confirmed",
      COMPLETED: "Delivered",
      CANCELLED: "Cancelled",
    };
    return texts[status] || status;
  };

  const filterOrders = (orders: Order[]) => {
    if (activeTab === "all") return orders;
    return orders.filter((order) => {
      if (activeTab === "active") return ["NEW", "CONTACTED", "CONFIRMED"].includes(order.status);
      if (activeTab === "completed") return order.status === "COMPLETED";
      if (activeTab === "cancelled") return order.status === "CANCELLED";
      return true;
    });
  };

  const styles = getStyles(colors);

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => router.push(`/orderDetails/${item.id}` as any)}
      activeOpacity={0.7}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderNumberRow}>
          <Text style={styles.orderNumber}>{item.order_number}</Text>
          {item.order_group_number && (
            <View style={styles.groupBadge}>
              <Ionicons name="layers-outline" size={12} color={colors.textMuted} />
            </View>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}20` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.orderBody}>
        <View style={styles.merchantRow}>
          <Ionicons name="storefront-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.merchantName}>{item.merchant_name}</Text>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
            <Text style={styles.detailText}>
              {new Date(item.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="cube-outline" size={14} color={colors.textMuted} />
            <Text style={styles.detailText}>
              {item.items?.length ?? 0} {(item.items?.length ?? 0) === 1 ? "item" : "items"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.totalAmount}>
          UGX {parseFloat(item.total_amount).toLocaleString()}
        </Text>
        <View style={styles.viewButton}>
          <Text style={styles.viewButtonText}>View</Text>
          <Ionicons name="chevron-forward" size={16} color="#E60549" />
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={64} color={colors.border} />
      <Text style={styles.emptyTitle}>No Orders Yet</Text>
      <Text style={styles.emptyText}>
        Your orders will appear here once you make a purchase
      </Text>
      <TouchableOpacity
        style={styles.shopButton}
        onPress={() => router.replace("/(tabs)/(home)")}
        activeOpacity={0.7}
      >
        <Text style={styles.shopButtonText}>Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  const filteredOrders = filterOrders(orders);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E60549" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        {["all", "active", "completed", "cancelled"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E60549" />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  tabsContainer: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#E60549",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textMuted,
  },
  activeTabText: {
    color: "#E60549",
  },

  listContent: {
    padding: 20,
    paddingBottom: 40,
  },

  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  orderNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  groupBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },

  orderBody: {
    marginBottom: 12,
    gap: 10,
  },
  merchantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  merchantName: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  orderDetails: {
    flexDirection: "row",
    gap: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: colors.textMuted,
  },

  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#E60549",
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E60549",
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  shopButton: {
    backgroundColor: "#E60549",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  shopButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
  },
});
