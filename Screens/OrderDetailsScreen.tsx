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
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      const data = await cartService.getOrderbyID(id as string);
      setOrder(data);
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
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
      NEW: "New Order",
      CONTACTED: "Merchant Contacted",
      CONFIRMED: "Order Confirmed",
      COMPLETED: "Delivered",
      CANCELLED: "Cancelled",
    };
    return texts[status] || status;
  };

  const handleCancelOrder = () => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this order?",
      [
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
      ]
    );
  };

  const canCancelOrder = () => {
    return order && ["NEW", "CONTACTED"].includes(order.status);
  };

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
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Header */}
        <View style={styles.statusHeader}>
          <View
            style={[
              styles.statusIcon,
              { backgroundColor: `${getStatusColor(order.status)}20` },
            ]}
          >
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
              <Ionicons name="layers-outline" size={14} color="#666" />
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
                style={[
                  styles.itemRow,
                  index < order.items.length - 1 && styles.itemBorder,
                ]}
              >
                {item.listing.images && item.listing.images.length > 0 && (
                  <Image
                    source={{ uri: item.listing.images[0].image }}
                    style={styles.itemImage}
                  />
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

        {/* Merchant Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Merchant</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Ionicons name="storefront-outline" size={20} color="#666" />
              <Text style={styles.infoText}>{order.merchant_name}</Text>
            </View>
          </View>
        </View>

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
                  parseFloat(order.total_amount) -
                  parseFloat(order.delivery_fee || "0")
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
              <Ionicons name="calendar-outline" size={18} color="#666" />
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
                <Ionicons name="document-text-outline" size={18} color="#666" />
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
  errorText: {
    fontSize: 15,
    color: "#666",
  },
  scrollView: {
    flex: 1,
  },

  // Status Header
  statusHeader: {
    backgroundColor: "white",
    paddingVertical: 32,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
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
    color: "#1A1A1A",
    marginBottom: 4,
  },
  orderNumber: {
    fontSize: 14,
    color: "#666",
  },
  groupBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
    gap: 6,
  },
  groupText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },

  // Section
  section: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  // Card
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
  },

  // Item Row
  itemRow: {
    flexDirection: "row",
    paddingVertical: 12,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 13,
    color: "#999",
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
    marginLeft: 8,
  },

  // Info Row
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
    color: "#1A1A1A",
    fontWeight: "500",
  },
  infoLabel: {
    fontSize: 13,
    color: "#999",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: "#1A1A1A",
  },

  // Address
  addressHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  addressText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  addressRegion: {
    fontSize: 13,
    color: "#999",
  },

  // Summary
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E60549",
  },

  // Footer
  footer: {
    padding: 20,
    paddingBottom: 32,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
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