import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useCartStore } from "@/utils/stores/useCartStore";
import { cartService } from "@/utils/services/cartService";

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const { addressId } = useLocalSearchParams();
  const { cart, fetchCart } = useCartStore();
  
  const [address, setAddress] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    fetchCart();
    fetchAddress();
  }, []);

  const fetchAddress = async () => {
    try {     
      const data = await cartService.getAddressById(addressId  as string);
      setAddress(data);
    } catch (error) {
      console.error("Error fetching address:", error);
    }
  };

  const handlePlaceOrder = async () => {
    setPlacing(true);
    
    try {
      const response = await fetch("/api/v1/orders/checkout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${yourAuthToken}`,
        },
        body: JSON.stringify({
          address_id: addressId,
          notes: "",
          delivery_fee: 0,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Clear cart in store
        await fetchCart();
        
        // Navigate to success screen
        router.replace({
          pathname: "/checkout/success",
          params: { orderIds: data.orders.map((o: any) => o.id).join(",") },
        });
      } else {
        const error = await response.json();
        Alert.alert("Error", error.error || "Failed to place order");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (!cart || !address) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.card}>
            <Text style={styles.addressLabel}>{address.label}</Text>
            <Text style={styles.addressText}>
              {address.landmark}, {address.area}
            </Text>
            <Text style={styles.addressText}>
              {address.district}, {address.region}
            </Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {cart.items?.map((item: any) => (
            <View key={item.id} style={styles.itemCard}>
              <Text style={styles.itemTitle}>{item.listing.title}</Text>
              <View style={styles.itemDetails}>
                <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                <Text style={styles.itemPrice}>
                  UGX {(parseFloat(item.listing.price) * item.quantity).toLocaleString()}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.card}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                UGX {parseFloat(cart.total_price).toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValue}>UGX 0</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                UGX {parseFloat(cart.total_price).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.placeOrderButton}
          onPress={handlePlaceOrder}
          disabled={placing}
        >
          {placing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.placeOrderText}>Place Order</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  itemCard: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  itemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemQuantity: {
    fontSize: 14,
    color: "#666",
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "600",
  },
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
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 12,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#E60549",
  },
  footer: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  placeOrderButton: {
    backgroundColor: "#E60549",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  placeOrderText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});