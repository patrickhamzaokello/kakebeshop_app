import { useSectionData } from "@/hooks/useSectionData";
import { cartService } from "@/utils/services/cartService";
import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { CartItems } from "@/components/test/CartItemListing";
import { CartSummary } from "@/components/test/CartSummary";

export const CartScreen: React.FC = () => {
  const router = useRouter();

  const userCartData = useSectionData(() => cartService.getUserCart());

  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Pull to refresh all sections
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([userCartData.refetch()]);
    setRefreshing(false);
  }, [userCartData.refetch]);

  // Handle quantity change
  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    try {
      await cartService.updateCartItemQuantity(itemId, newQuantity);
      // Refetch cart data to get updated totals
      await userCartData.refetch();
    } catch (error) {
      throw error; // Let the component handle the error
    }
  };

  // Handle item removal
  const handleRemoveItem = async (itemId: string) => {
    try {
      await cartService.removeCartItem(itemId);
      // Refetch cart data to update the list
      await userCartData.refetch();
    } catch (error) {
      throw error; // Let the component handle the error
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <CartItems
          items={userCartData.data?.items || null}
          loading={false}
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
        totalItems={userCartData.data?.total_items || 0}
        totalPrice={userCartData.data?.total_price || "0"}
        onCheckout={() =>
          router.push({
            pathname: "/orders/[id]",
            params: { id: userCartData.data?.id ?? "" },
          })
        }
        loading={false}
        disabled={(userCartData.data?.total_items || 0) === 0}
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