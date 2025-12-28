import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
  Dimensions,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { cartService } from "@/utils/services/cartService";

interface OrderGroup {
  id: string;
  group_number: string;
  total_orders: number;
  total_amount: string;
}

interface Order {
  id: string;
  order_number: string;
  merchant_name: string;
  total_amount: string;
  items_count?: number;
  status: string;
  order_group_number?: string;
  is_grouped: boolean;
}

interface OrderSuccessScreenProps {
  orderIds: string | string[];
  orderGroupId?: string | string[];
}

export default function OrderSuccessScreen({
  orderIds,
  orderGroupId,
}: OrderSuccessScreenProps) {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [orderGroup, setOrderGroup] = useState<OrderGroup | null>(null);
  const [loading, setLoading] = useState(true);

  // Animations
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));


  useEffect(() => {
    fetchOrders();
    animateSuccess();
  }, []);

  const animateSuccess = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      delay: 300,
      useNativeDriver: true,
    }).start();
  };

  const fetchOrders = async () => {
    try {
      if (orderGroupId) {
        const groupIdStr = Array.isArray(orderGroupId)
          ? orderGroupId[0]
          : orderGroupId;
        const data = await cartService.getOrdersByGroupID(groupIdStr);
        if (data) {
          setOrderGroup(data);
          setOrders(data.orders || []);
        }
      } else {
        const idsArray = Array.isArray(orderIds) ? orderIds : [orderIds];
        const ids =
          typeof idsArray[0] === "string" && idsArray[0].includes(",")
            ? idsArray[0].split(",")
            : idsArray;

        const orderPromises = ids.map(async (id) => {
          const data = await cartService.getOrderbyID(id);
          return data;
        });

        const fetchedOrders = await Promise.all(orderPromises);
        setOrders(fetchedOrders);

        if (fetchedOrders.length > 0 && fetchedOrders[0].order_group_number) {
          setOrderGroup({
            id: "",
            group_number: fetchedOrders[0].order_group_number,
            total_orders: fetchedOrders.length,
            total_amount: fetchedOrders
              .reduce((sum, order) => sum + parseFloat(order.total_amount), 0)
              .toString(),
          });
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (orderId: string) => {
    router.push(`/(tabs)/orders/${orderId}` as any);
  };

  const handleContinueShopping = () => {
    router.replace("/(tabs)/(home)");
  };

  const handleViewAllOrders = () => {
    router.replace("/orders/");
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E60549" />
        <Text style={styles.loadingText}>Processing your order...</Text>
      </View>
    );
  }

  const totalAmount = orders.reduce(
    (sum, order) => sum + parseFloat(order.total_amount),
    0
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Header */}
        <View style={styles.successContainer}>
          <Animated.View
            style={[
              styles.successIconContainer,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim, alignItems: "center" }}>
            <Text style={styles.successTitle}>Order Placed Successfully!</Text>
            <Text style={styles.successSubtitle}>
              {orders.length === 1
                ? "Your order has been confirmed"
                : `${orders.length} orders have been confirmed`}
            </Text>

            {orderGroup && orderGroup.group_number && (
              <View style={styles.groupBadge}>
                <Ionicons name="layers-outline" size={14} color="#666" />
                <Text style={styles.groupBadgeText}>
                  Group: {orderGroup.group_number}
                </Text>
              </View>
            )}
          </Animated.View>
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Order Summary */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="receipt-outline" size={20} color="#E60549" />
              <Text style={styles.sectionTitle}>
                {orderGroup && orders.length > 1
                  ? `${orders.length} Orders from Checkout`
                  : "Order Summary"}
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalAmount}>
                  UGX {totalAmount.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Individual Orders */}
            {orders.map((order, index) => (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderBadgeText}>
                      {orders.length > 1 ? `#${index + 1}` : "ORDER"}
                    </Text>
                  </View>
                  <Text style={styles.orderNumber}>{order.order_number}</Text>
                </View>

                <View style={styles.orderBody}>
                  <View style={styles.merchantRow}>
                    <Ionicons
                      name="storefront-outline"
                      size={16}
                      color="#666"
                    />
                    <Text style={styles.merchantName}>
                      {order.merchant_name}
                    </Text>
                  </View>

                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Amount</Text>
                    <Text style={styles.amountValue}>
                      UGX {parseFloat(order.total_amount).toLocaleString()}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => handleViewOrder(order.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewButtonText}>View Details</Text>
                  <Ionicons name="arrow-forward" size={16} color="#E60549" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* What's Next */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={20} color="#E60549" />
              <Text style={styles.sectionTitle}>What Happens Next?</Text>
            </View>

            <View style={styles.timelineCard}>
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.timelineDotActive]} />
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#4CAF50"
                    />
                    <Text style={styles.timelineTitle}>Order Confirmed</Text>
                  </View>
                  <Text style={styles.timelineDescription}>
                    Confirmation sent to your email
                  </Text>
                </View>
              </View>

              <View style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Ionicons name="cube-outline" size={20} color="#666" />
                    <Text style={styles.timelineTitle}>Processing</Text>
                  </View>
                  <Text style={styles.timelineDescription}>
                    {orders.length > 1
                      ? "Merchants are preparing your items"
                      : "Preparing your items"}
                  </Text>
                </View>
              </View>

              <View style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Ionicons name="bicycle-outline" size={20} color="#666" />
                    <Text style={styles.timelineTitle}>Out for Delivery</Text>
                  </View>
                  <Text style={styles.timelineDescription}>
                    You'll receive tracking updates
                  </Text>
                </View>
              </View>

              <View style={[styles.timelineItem, styles.timelineItemLast]}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Ionicons name="home-outline" size={20} color="#666" />
                    <Text style={styles.timelineTitle}>Delivered</Text>
                  </View>
                  <Text style={styles.timelineDescription}>
                    Enjoy your purchase!
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleViewAllOrders}
                activeOpacity={0.7}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name="list-outline" size={24} color="#E60549" />
                </View>
                <Text style={styles.actionText}>My Orders</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push("/(tabs)/accounts/support" as any)}
                activeOpacity={0.7}
              >
                <View style={styles.actionIcon}>
                  <Ionicons
                    name="help-circle-outline"
                    size={24}
                    color="#E60549"
                  />
                </View>
                <Text style={styles.actionText}>Help & Support</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Info Note */}
          <View style={styles.section}>
            <View style={styles.infoNote}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="#666"
              />
              <Text style={styles.infoNoteText}>
                You will receive order updates via email and notifications
              </Text>
            </View>
          </View>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleViewAllOrders}
          activeOpacity={0.7}
        >
          <Ionicons name="receipt-outline" size={18} color="#666" />
          <Text style={styles.secondaryButtonText}>Track Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleContinueShopping}
          activeOpacity={0.7}
        >
          <Ionicons name="storefront-outline" size={18} color="white" />
          <Text style={styles.primaryButtonText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: "#FAFAFA",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Success Header
  successContainer: {
    alignItems: "center",
    paddingVertical: 48,
    paddingTop: 80,
    paddingHorizontal: 24,
    backgroundColor: "white",
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successIconCircle: {
    width: 80,
    height: 80,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  groupBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginTop: 12,
    gap: 6,
  },
  groupBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },

  // Section
  section: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
  },

  // Summary Card
  summaryCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: "700",
    color: "#E60549",
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
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  orderBadge: {
    backgroundColor: "#F5F5F5",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  orderBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#666",
    letterSpacing: 0.5,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
    flex: 1,
  },
  orderBody: {
    gap: 10,
    marginBottom: 12,
  },
  merchantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  merchantName: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 13,
    color: "#999",
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#FFF5F8",
    borderRadius: 8,
    gap: 6,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E60549",
  },

  // Timeline
  timelineCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
  },
  timelineItem: {
    flexDirection: "row",
    position: "relative",
  },
  timelineItemLast: {
    // Remove connecting line for last item
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E0E0E0",
    marginTop: 4,
    marginRight: 12,
  },
  timelineDotActive: {
    backgroundColor: "#4CAF50",
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 20,
    borderLeftWidth: 2,
    borderLeftColor: "#F0F0F0",
    marginLeft: -6,
    paddingLeft: 18,
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  timelineDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
  },

  // Actions
  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF5F8",
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
  },

  // Info Note
  infoNote: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 14,
    gap: 10,
    alignItems: "flex-start",
  },
  infoNoteText: {
    flex: 1,
    fontSize: 13,
    color: "#666",
    lineHeight: 20,
  },

  // Footer
  footer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#E60549",
    borderRadius: 10,
    gap: 6,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
});
