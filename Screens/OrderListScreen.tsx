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

interface Order {
  id: string;
  order_number: string;
  merchant_name: string;
  total_amount: string;
  status: string;
  created_at: string;
  items_count: number;
  order_group_number?: string;
}

export default function OrdersListScreen() {
  const router = useRouter();
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
      console.error("Error fetching orders:", error);
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
    const colors: { [key: string]: string } = {
      NEW: "#2196F3",
      CONTACTED: "#FF9800",
      CONFIRMED: "#4CAF50",
      COMPLETED: "#8BC34A",
      CANCELLED: "#F44336",
    };
    return colors[status] || "#666";
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
      if (activeTab === "active") {
        return ["NEW", "CONTACTED", "CONFIRMED"].includes(order.status);
      }
      if (activeTab === "completed") {
        return order.status === "COMPLETED";
      }
      if (activeTab === "cancelled") {
        return order.status === "CANCELLED";
      }
      return true;
    });
  };

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
              <Ionicons name="layers-outline" size={12} color="#666" />
            </View>
          )}
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${getStatusColor(item.status)}20` },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(item.status) },
            ]}
          >
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.orderBody}>
        <View style={styles.merchantRow}>
          <Ionicons name="storefront-outline" size={16} color="#666" />
          <Text style={styles.merchantName}>{item.merchant_name}</Text>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={14} color="#999" />
            <Text style={styles.detailText}>
              {new Date(item.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="cube-outline" size={14} color="#999" />
            <Text style={styles.detailText}>
              {item.items_count} {item.items_count === 1 ? "item" : "items"}
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
      <Ionicons name="receipt-outline" size={64} color="#CCC" />
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
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "all" && styles.activeTab]}
          onPress={() => setActiveTab("all")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "all" && styles.activeTabText,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "active" && styles.activeTab]}
          onPress={() => setActiveTab("active")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "active" && styles.activeTabText,
            ]}
          >
            Active
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "completed" && styles.activeTab]}
          onPress={() => setActiveTab("completed")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "completed" && styles.activeTabText,
            ]}
          >
            Completed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "cancelled" && styles.activeTab]}
          onPress={() => setActiveTab("cancelled")}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "cancelled" && styles.activeTabText,
            ]}
          >
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#E60549"
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Tabs
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
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
    color: "#999",
  },
  activeTabText: {
    color: "#E60549",
  },

  // List
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Order Card
  orderCard: {
    backgroundColor: "white",
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
    borderBottomColor: "#F5F5F5",
  },
  orderNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  groupBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F5F5F5",
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

  // Order Body
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
    color: "#666",
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
    color: "#999",
  },

  // Order Footer
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

  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
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