import React, { useCallback, useEffect } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { CartItems } from "@/components/test/CartItemListing";
import { CartSummary } from "@/components/test/CartSummary";
import { useCartStore } from "@/utils/stores/useCartStore";

export const CartScreen: React.FC = () => {
  const router = useRouter();

  const {
    cart,
    isLoading,
    isUpdating,
    fetchCart,
    updateCartItemQuantity,
    removeCartItem,
  } = useCartStore();

  // Fetch cart on mount
  useEffect(() => {
    fetchCart();
  }, []);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    await fetchCart();
  }, [fetchCart]);

  // Handle quantity change
  const handleQuantityChange = async (
    itemId: string,
    newQuantity: number
  ): Promise<boolean> => {
    return await updateCartItemQuantity(itemId, newQuantity);
  };

  // Handle item removal
  const handleRemoveItem = async (itemId: string): Promise<boolean> => {
    return await removeCartItem(itemId);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <CartItems
          items={cart?.items || null}
          loading={isLoading && !cart}
          onItemPress={(item) =>
            router.push({
              pathname: "/listing/[id]",
              params: { id: item.listing.id },
            })
          }
          onQuantityChange={handleQuantityChange}
          onRemoveItem={handleRemoveItem}
        />
      </ScrollView>

      <CartSummary
        totalItems={cart?.total_items || 0}
        totalPrice={cart?.total_price || "0"}
        onCheckout={() =>
          router.push({
            pathname: "/orders/[id]",
            params: { id: cart?.id ?? "" },
          })
        }
        loading={isUpdating}
        disabled={(cart?.total_items || 0) === 0}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
});