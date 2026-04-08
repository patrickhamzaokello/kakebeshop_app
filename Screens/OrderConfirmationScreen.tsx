import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCartStore } from "@/utils/stores/useCartStore";
import { cartService } from "@/utils/services/cartService";
import { useTheme } from "@/contexts/ThemeContext";

interface Address {
  id: string;
  label: string;
  region: string;
  district: string;
  area: string;
  landmark: string;
}

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { addressId } = useLocalSearchParams();
  const { cart, fetchCart } = useCartStore();

  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([fetchCart(), fetchAddress()]);
    } catch (error) {
      if (__DEV__) console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const fetchAddress = async () => {
    try {
      const data = await cartService.getAddressById(addressId as string);
      setAddress(data);
    } catch (error) {
      if (__DEV__) console.error("Error fetching address:", error);
      throw error;
    }
  };

  const handlePlaceOrder = async () => {
    if (!cart?.items || cart.items.length === 0) {
      Alert.alert("Error", "Your cart is empty");
      return;
    }

    setPlacing(true);

    try {
      const response = await cartService.checkout({
        address_id: addressId as string,
        notes: "",
        delivery_fee: 0,
      });

      if (response && response.orders) {
        await fetchCart();
        router.replace({
          pathname: "/checkout/order-success",
          params: {
            orderIds: response.orders.map((o: any) => o.id).join(","),
            orderGroupId: response.order_group?.id || "",
            orderCount: response.orders.length.toString(),
            groupNumber: response.order_group?.group_number || "",
          },
        });
      } else {
        Alert.alert("Error", "Failed to place order");
      }
    } catch (error: any) {
      if (__DEV__) console.error("Error placing order:", error);
      Alert.alert("Order Failed", error.message || "Something went wrong. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  const styles = getStyles(colors);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E60549" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!cart || !address) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.border} />
        <Text style={styles.errorText}>Unable to load order details</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Delivery Address */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color="#E60549" />
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.addressLabelRow}>
              <Text style={styles.addressLabel}>{address.label}</Text>
              <TouchableOpacity onPress={() => router.back()} style={styles.changeButton}>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.addressText}>{address.landmark}</Text>
            <Text style={styles.addressText}>{address.area}, {address.district}</Text>
            <Text style={styles.addressRegion}>{address.region}</Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cart" size={20} color="#E60549" />
            <Text style={styles.sectionTitle}>Order Items ({cart.total_items})</Text>
          </View>
          {cart.items?.map((item: any) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemContent}>
                {item.listing.primary_image && (
                  <Image
                    source={{ uri: item.listing.primary_image.image }}
                    style={styles.itemImage}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.listing.title}
                  </Text>
                  <View style={styles.itemMeta}>
                    <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                    <Text style={styles.itemUnitPrice}>
                      @ UGX {parseFloat(item.listing.price).toLocaleString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.itemPriceContainer}>
                  <Text style={styles.itemPrice}>
                    UGX {(parseFloat(item.listing.price) * item.quantity).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calculator" size={20} color="#E60549" />
            <Text style={styles.sectionTitle}>Order Summary</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Subtotal ({cart.total_items} {cart.total_items === 1 ? "item" : "items"})
              </Text>
              <Text style={styles.summaryValue}>
                UGX {parseFloat(cart.total_price).toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee</Text>
              <Text style={styles.summaryValueFree}>FREE</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>
                UGX {parseFloat(cart.total_price).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.noteSection}>
          <View style={styles.noteCard}>
            <Ionicons name="information-circle" size={20} color={colors.textSecondary} />
            <Text style={styles.noteText}>
              By placing this order, you agree to our terms and conditions
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerTop}>
          <Text style={styles.footerLabel}>Total Amount</Text>
          <Text style={styles.footerAmount}>
            UGX {parseFloat(cart.total_price).toLocaleString()}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderButton, placing && styles.disabledButton]}
          onPress={handlePlaceOrder}
          disabled={placing}
          activeOpacity={0.7}
        >
          {placing ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <Text style={styles.placeOrderText}>Place Order</Text>
            </>
          )}
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
    padding: 32,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#E60549",
    borderRadius: 8,
  },
  retryText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },

  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    marginLeft: 8,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  changeButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E60549",
  },
  changeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E60549",
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

  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemContent: {
    flexDirection: "row",
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
    justifyContent: "center",
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.textPrimary,
    marginBottom: 6,
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemQuantity: {
    fontSize: 13,
    color: colors.textSecondary,
    marginRight: 12,
  },
  itemUnitPrice: {
    fontSize: 13,
    color: colors.textMuted,
  },
  itemPriceContainer: {
    justifyContent: "center",
    marginLeft: 8,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
  summaryValueFree: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CAF50",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#E60549",
  },

  noteSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  noteCard: {
    flexDirection: "row",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 12,
    lineHeight: 18,
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  footerLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footerAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#E60549",
  },
  placeOrderButton: {
    flexDirection: "row",
    backgroundColor: "#E60549",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  placeOrderText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: colors.textMuted,
  },
});
