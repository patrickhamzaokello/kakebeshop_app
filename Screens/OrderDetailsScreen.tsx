import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { cartService } from "@/utils/services/cartService";
import { merchantBase } from "@/utils/services/merchantService";
import { useTheme } from "@/contexts/ThemeContext";

interface OrderItem {
  id: string;
  listing: {
    id: string;
    title: string;
    price: string;
    images: Array<{ image: string }>;
  };
  quantity: number;
  unit_price: string;
  total_price: string;
}

interface OrderDetail {
  id: string;
  order_number: string;
  merchant_name: string;
  total_amount: string;
  delivery_fee: string;
  status: string;
  created_at: string;
  notes?: string;
  items: OrderItem[];
  address: {
    label: string;
    landmark: string;
    area: string;
    district: string;
    region: string;
  };
  order_group_number?: string;
}

export default function OrderDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id, isMerchant: isMerchantParam } = useLocalSearchParams();
  const isMerchant = isMerchantParam === "true";
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      const data = await cartService.getOrderbyID(id as string);
      setOrder(data);
    } catch (error) {
      if (__DEV__) console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
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
      NEW: "New Order",
      CONTACTED: "Merchant Contacted",
      CONFIRMED: "Order Confirmed",
      COMPLETED: "Delivered",
      CANCELLED: "Cancelled",
    };
    return texts[status] || status;
  };

  const handleCancelOrder = () => {
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            await cartService.cancelOrder(id as string);
            Alert.alert("Success", "Order cancelled successfully");
            fetchOrderDetail();
          } catch (error) {
            Alert.alert("Error", "Failed to cancel order");
          }
        },
      },
    ]);
  };

  const handleConfirmOrder = () => {
    Alert.alert("Confirm Order", "Confirm that you have received this order and will fulfil it?", [
      { text: "Not yet", style: "cancel" },
      {
        text: "Confirm",
        onPress: async () => {
          setActionLoading(true);
          const ok = await merchantBase.confirmOrder(id as string);
          setActionLoading(false);
          if (ok) {
            Alert.alert("Done", "Order confirmed successfully");
            fetchOrderDetail();
          } else {
            Alert.alert("Error", "Failed to confirm order. Please try again.");
          }
        },
      },
    ]);
  };

  const handleCompleteOrder = () => {
    Alert.alert("Mark as Completed", "Mark this order as delivered and completed?", [
      { text: "Not yet", style: "cancel" },
      {
        text: "Mark Complete",
        onPress: async () => {
          setActionLoading(true);
          const ok = await merchantBase.completeOrder(id as string);
          setActionLoading(false);
          if (ok) {
            Alert.alert("Done", "Order marked as completed");
            fetchOrderDetail();
          } else {
            Alert.alert("Error", "Failed to update order. Please try again.");
          }
        },
      },
    ]);
  };

  const canCancelOrder = () => {
    return !isMerchant && order && ["NEW", "CONTACTED"].includes(order.status);
  };

  const styles = getStyles(colors);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E60549" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Order not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status Header */}
        <View style={styles.statusHeader}>
          <View style={[styles.statusIcon, { backgroundColor: `${getStatusColor(order.status)}20` }]}>
            <Ionicons
              name={
                order.status === "COMPLETED"
                  ? "checkmark-circle"
                  : order.status === "CANCELLED"
                  ? "close-circle"
                  : "time"
              }
              size={32}
              color={getStatusColor(order.status)}
            />
          </View>
          <Text style={styles.statusTitle}>{getStatusText(order.status)}</Text>
          <Text style={styles.orderNumber}>{order.order_number}</Text>
          {order.order_group_number && (
            <View style={styles.groupBadge}>
              <Ionicons name="layers-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.groupText}>{order.order_group_number}</Text>
            </View>
          )}
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          <View style={styles.card}>
            {order.items.map((item, index) => (
              <View
                key={item.id}
                style={[styles.itemRow, index < order.items.length - 1 && styles.itemBorder]}
              >
                {item.listing.images && item.listing.images.length > 0 && (
                  <Image source={{ uri: item.listing.images[0].image }} style={styles.itemImage} />
                )}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.listing.title}
                  </Text>
                  <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                  <Text style={styles.itemPrice}>
                    UGX {parseFloat(item.unit_price).toLocaleString()}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  UGX {parseFloat(item.total_price).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Merchant Info — only shown to buyers */}
        {!isMerchant && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Merchant</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Ionicons name="storefront-outline" size={20} color={colors.textSecondary} />
                <Text style={styles.infoText}>{order.merchant_name}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.card}>
            <View style={styles.addressHeader}>
              <Ionicons name="location" size={20} color="#E60549" />
              <Text style={styles.addressLabel}>{order.address.label}</Text>
            </View>
            <Text style={styles.addressText}>{order.address.landmark}</Text>
            <Text style={styles.addressText}>
              {order.address.area}, {order.address.district}
            </Text>
            <Text style={styles.addressRegion}>{order.address.region}</Text>
          </View>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.card}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                UGX{" "}
                {(
                  parseFloat(order.total_amount) - parseFloat(order.delivery_fee || "0")
                ).toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>
                {order.delivery_fee === "0.00" || !order.delivery_fee
                  ? "FREE"
                  : `UGX ${parseFloat(order.delivery_fee).toLocaleString()}`}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                UGX {parseFloat(order.total_amount).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Information</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Order Date</Text>
                <Text style={styles.infoValue}>
                  {new Date(order.created_at).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </View>
            </View>
            {order.notes && (
              <View style={[styles.infoRow, { marginTop: 12 }]}>
                <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Notes</Text>
                  <Text style={styles.infoValue}>{order.notes}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer Actions */}
      {isMerchant && order.status === "NEW" && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.confirmButton]}
            onPress={handleConfirmOrder}
            disabled={actionLoading}
            activeOpacity={0.7}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.confirmButtonText}>Confirm Order</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {isMerchant && order.status === "CONFIRMED" && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={handleCompleteOrder}
            disabled={actionLoading}
            activeOpacity={0.7}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="bag-check-outline" size={20} color="#fff" />
                <Text style={styles.confirmButtonText}>Mark as Completed</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {canCancelOrder() && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelOrder}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle-outline" size={20} color="#F44336" />
            <Text style={styles.cancelButtonText}>Cancel Order</Text>
          </TouchableOpacity>
        </View>
      )}
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
  errorText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },

  statusHeader: {
    backgroundColor: colors.surface,
    paddingVertical: 32,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  groupBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
    gap: 6,
  },
  groupText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  section: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },

  itemRow: {
    flexDirection: "row",
    paddingVertical: 12,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 13,
    color: colors.textMuted,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    marginLeft: 8,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoText: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: colors.textPrimary,
  },

  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  addressText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  addressRegion: {
    fontSize: 13,
    color: colors.textMuted,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E60549",
  },

  footer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
  },
  completeButton: {
    backgroundColor: "#E60549",
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    backgroundColor: "#FFF5F5",
    borderRadius: 10,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F44336",
  },
});
