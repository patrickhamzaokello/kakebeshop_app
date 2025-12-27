import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
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
  orderGroupId 
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
    // Animate checkmark
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Fade in content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      delay: 300,
      useNativeDriver: true,
    }).start();
  };

  const fetchOrders = async () => {
    try {
      // If we have orderGroupId, fetch the entire group
      if (orderGroupId) {
        const groupIdStr = Array.isArray(orderGroupId) ? orderGroupId[0] : orderGroupId;
        
        const data =  await cartService.getOrdersByGroupID(groupIdStr);
        if (data) {
          setOrderGroup(data);
          setOrders(data.orders || []);
        }
      } else {
        // Fetch individual orders
        const idsArray = Array.isArray(orderIds) ? orderIds : [orderIds];
        const ids = typeof idsArray[0] === 'string' && idsArray[0].includes(',') 
          ? idsArray[0].split(',') 
          : idsArray;
        
        const orderPromises = ids.map(async (id) => {
          const data = await cartService.getOrderbyID(id);
          return data;
        });

        const fetchedOrders = await Promise.all(orderPromises);
        setOrders(fetchedOrders);
        
        // Check if orders are part of a group
        if (fetchedOrders.length > 0 && fetchedOrders[0].order_group_number) {
          setOrderGroup({
            id: '',
            group_number: fetchedOrders[0].order_group_number,
            total_orders: fetchedOrders.length,
            total_amount: fetchedOrders.reduce(
              (sum, order) => sum + parseFloat(order.total_amount), 
              0
            ).toString(),
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
              { transform: [{ scale: scaleAnim }] }
            ]}
          >
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={60} color="white" />
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.successTitle}>Order Placed!</Text>
            <Text style={styles.successSubtitle}>
              {orders.length === 1 
                ? "Your order has been confirmed"
                : `${orders.length} orders have been confirmed`}
            </Text>
            
            {/* Order Group Badge */}
            {orderGroup && orderGroup.group_number && (
              <View style={styles.groupBadgeContainer}>
                <Ionicons name="layers" size={16} color="#E60549" />
                <Text style={styles.groupBadgeText}>
                  Group: {orderGroup.group_number}
                </Text>
              </View>
            )}
          </Animated.View>
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Order Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons name="receipt" size={22} color="#E60549" />
              <Text style={styles.summaryTitle}>
                {orderGroup && orders.length > 1 
                  ? `${orders.length} Orders from Checkout`
                  : 'Order Summary'}
              </Text>
            </View>
            
            <View style={styles.totalAmountRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>
                UGX {totalAmount.toLocaleString()}
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Individual Orders */}
            {orders.map((order, index) => (
              <View key={order.id} style={styles.orderItem}>
                <View style={styles.orderHeader}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderLabel}>
                      {orders.length > 1 ? `Order #${index + 1}` : 'Order Details'}
                    </Text>
                    <Text style={styles.orderNumber}>{order.order_number}</Text>
                    <Text style={styles.merchantName}>{order.merchant_name}</Text>
                  </View>
                  <View style={styles.orderAmountContainer}>
                    <Text style={styles.orderAmount}>
                      UGX {parseFloat(order.total_amount).toLocaleString()}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={styles.viewDetailsButton}
                  onPress={() => handleViewOrder(order.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <Ionicons name="chevron-forward" size={18} color="#E60549" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* What's Next */}
          <View style={styles.nextStepsCard}>
            <Text style={styles.nextStepsTitle}>What Happens Next?</Text>
            
            <View style={styles.timelineContainer}>
              <View style={styles.stepItem}>
                <View style={[styles.stepIcon, styles.stepIconActive]}>
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                </View>
                <View style={styles.stepLine} />
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Order Confirmed</Text>
                  <Text style={styles.stepDescription}>
                    Confirmation sent to your email
                  </Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepIcon}>
                  <Ionicons name="cube" size={24} color="#FF9800" />
                </View>
                <View style={styles.stepLine} />
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Merchant Processing</Text>
                  <Text style={styles.stepDescription}>
                    {orders.length > 1 
                      ? 'Merchants are preparing your items'
                      : 'Preparing your items'}
                  </Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepIcon}>
                  <Ionicons name="car" size={24} color="#2196F3" />
                </View>
                <View style={styles.stepLine} />
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Out for Delivery</Text>
                  <Text style={styles.stepDescription}>
                    You'll receive tracking updates
                  </Text>
                </View>
              </View>

              <View style={styles.stepItem}>
                <View style={styles.stepIcon}>
                  <Ionicons name="home" size={24} color="#E60549" />
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Delivered</Text>
                  <Text style={styles.stepDescription}>
                    Enjoy your purchase!
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleViewAllOrders}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconCircle}>
                <Ionicons name="list" size={24} color="#E60549" />
              </View>
              <Text style={styles.actionTitle}>My Orders</Text>
              <Text style={styles.actionSubtitle}>Track all orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push("/(tabs)/accounts/support" as any)}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconCircle}>
                <Ionicons name="help-circle" size={24} color="#E60549" />
              </View>
              <Text style={styles.actionTitle}>Help & Support</Text>
              <Text style={styles.actionSubtitle}>Get assistance</Text>
            </TouchableOpacity>
          </View>

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={20} color="#2196F3" />
            <Text style={styles.infoBannerText}>
              You will receive order updates via email and notifications
            </Text>
          </View>
        </Animated.View>

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleViewAllOrders}
          activeOpacity={0.7}
        >
          <Ionicons name="receipt-outline" size={20} color="#E60549" />
          <Text style={styles.secondaryButtonText}>My Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleContinueShopping}
          activeOpacity={0.7}
        >
          <Ionicons name="storefront" size={20} color="white" />
          <Text style={styles.primaryButtonText}>Keep Shopping</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
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
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: "#FFF5F8",
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 12,
  },
  groupBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE5ED",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  groupBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E60549",
    marginLeft: 4,
  },

  // Summary Card
  summaryCard: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
    flex: 1,
  },
  totalAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#E60549",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginBottom: 16,
  },

  // Order Items
  orderItem: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  merchantName: {
    fontSize: 13,
    color: "#666",
  },
  orderAmountContainer: {
    justifyContent: "center",
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#E60549",
  },
  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#E60549",
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E60549",
    marginRight: 4,
  },

  // Timeline
  nextStepsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  nextStepsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
  },
  timelineContainer: {
    paddingLeft: 8,
  },
  stepItem: {
    flexDirection: "row",
    position: "relative",
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8F8F8",
    justifyContent: "center",
    alignItems: "center",
  },
  stepIconActive: {
    backgroundColor: "#E8F5E9",
  },
  stepLine: {
    position: "absolute",
    left: 20,
    top: 40,
    width: 2,
    height: 40,
    backgroundColor: "#E5E5E5",
  },
  stepContent: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 24,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },

  // Actions
  actionsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  actionCard: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF5F8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
  },
  actionSubtitle: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },

  // Info Banner
  infoBanner: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 16,
    alignItems: "flex-start",
  },
  infoBannerText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: "#1976D2",
    lineHeight: 18,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E60549",
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E60549",
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#E60549",
    borderRadius: 12,
    gap: 6,
    shadowColor: "#E60549",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
});