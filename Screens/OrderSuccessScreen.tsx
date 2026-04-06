import { useTheme } from "@/contexts/ThemeContext";
import { cartService } from "@/utils/services/cartService";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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

export default function OrderSuccessScreen({ orderIds, orderGroupId }: OrderSuccessScreenProps) {
  const router = useRouter();
  const { colors } = useTheme();

  const [orders, setOrders] = useState<Order[]>([]);
  const [orderGroup, setOrderGroup] = useState<OrderGroup | null>(null);
  const [loading, setLoading] = useState(true);

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
        const groupIdStr = Array.isArray(orderGroupId) ? orderGroupId[0] : orderGroupId;
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

        const orderPromises = ids.map((id) => cartService.getOrderbyID(id));
        const results = await Promise.all(orderPromises);
        const fetchedOrders = results.filter((o): o is Order => o !== null);
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
      if (__DEV__) console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (orderId: string) => {
    router.push(`/(tabs)/(accounts)/orderDetails/${orderId}` as any);
  };

  const handleContinueShopping = () => {
    router.replace("/(tabs)/(home)");
  };

  const handleViewAllOrders = () => {
    router.replace("/(tabs)/(accounts)/orders/orders");
  };

  const styles = getStyles(colors);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E60549" />
        <Text style={styles.loadingText}>Processing your order...</Text>
      </View>
    );
  }

  const totalAmount = orders.reduce((sum, order) => sum + (order ? parseFloat(order.total_amount) : 0), 0);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Header */}
        <View style={styles.successContainer}>
          <Animated.View style={[styles.successIconContainer, { transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim, alignItems: "center" }}>
            <Text style={styles.successTitle}>Order Placed Successfully!</Text>
            <Text style={styles.successSubtitle}>
              {orders.length <= 1
                ? "Your order has been confirmed"
                : `${orders.length} orders have been confirmed`}
            </Text>

            {orderGroup && orderGroup.group_number && (
              <View style={styles.groupBadge}>
                <Ionicons name="layers-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.groupBadgeText}>Group: {orderGroup.group_number}</Text>
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
                <Text style={styles.totalAmount}>UGX {totalAmount.toLocaleString()}</Text>
              </View>
            </View>

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
                    <Ionicons name="storefront-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.merchantName}>{order.merchant_name}</Text>
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
              {[
                { icon: "checkmark-circle", color: "#4CAF50", title: "Order Confirmed", desc: "Confirmation sent to your email", active: true },
                { icon: "cube-outline", color: colors.textSecondary, title: "Processing", desc: orders.length > 1 ? "Merchants are preparing your items" : "Preparing your items", active: false },
                { icon: "bicycle-outline", color: colors.textSecondary, title: "Out for Delivery", desc: "You'll receive tracking updates", active: false },
                { icon: "home-outline", color: colors.textSecondary, title: "Delivered", desc: "Enjoy your purchase!", active: false },
              ].map((step, i, arr) => (
                <View key={i} style={[styles.timelineItem, i === arr.length - 1 && styles.timelineItemLast]}>
                  <View style={[styles.timelineDot, step.active && styles.timelineDotActive]} />
                  <View style={styles.timelineContent}>
                    <View style={styles.timelineHeader}>
                      <Ionicons name={step.icon as any} size={20} color={step.color} />
                      <Text style={styles.timelineTitle}>{step.title}</Text>
                    </View>
                    <Text style={styles.timelineDescription}>{step.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionButton} onPress={handleViewAllOrders} activeOpacity={0.7}>
                <View style={styles.actionIcon}>
                  <Ionicons name="list-outline" size={24} color="#E60549" />
                </View>
                <Text style={styles.actionText}>My Orders</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push("/help/help" as any)}
                activeOpacity={0.7}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name="help-circle-outline" size={24} color="#E60549" />
                </View>
                <Text style={styles.actionText}>Help & Support</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Info Note */}
          <View style={styles.section}>
            <View style={styles.infoNote}>
              <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
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
        <TouchableOpacity style={styles.secondaryButton} onPress={handleViewAllOrders} activeOpacity={0.7}>
          <Ionicons name="receipt-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.secondaryButtonText}>Track Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton} onPress={handleContinueShopping} activeOpacity={0.7}>
          <Ionicons name="storefront-outline" size={18} color="white" />
          <Text style={styles.primaryButtonText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
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
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  successContainer: {
    alignItems: "center",
    paddingVertical: 48,
    paddingTop: 80,
    paddingHorizontal: 24,
    backgroundColor: colors.surface,
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
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  groupBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginTop: 12,
    gap: 6,
  },
  groupBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },

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
    color: colors.textPrimary,
  },

  summaryCard: {
    backgroundColor: colors.surface,
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
    color: colors.textSecondary,
    fontWeight: "500",
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: "700",
    color: "#E60549",
  },

  orderCard: {
    backgroundColor: colors.surface,
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
    borderBottomColor: colors.border,
  },
  orderBadge: {
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  orderBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
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
    color: colors.textSecondary,
    fontWeight: "500",
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    gap: 6,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E60549",
  },

  timelineCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
  },
  timelineItem: {
    flexDirection: "row",
    position: "relative",
  },
  timelineItemLast: {},
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
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
    borderLeftColor: colors.border,
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
    color: colors.textPrimary,
  },
  timelineDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  infoNote: {
    flexDirection: "row",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    alignItems: "flex-start",
  },
  infoNoteText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  footer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
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
