import React, { useCallback, useEffect, useRef } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useScrollToTop } from "@react-navigation/native";
import { CartItems } from "@/components/test/CartItemListing";
import { CartSummary } from "@/components/test/CartSummary";
import { useCartStore } from "@/utils/stores/useCartStore";
import { useTheme } from "@/contexts/ThemeContext";

export const CartScreen: React.FC = () => {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const { colors } = useTheme();

  useScrollToTop(scrollRef);

  const {
    cart,
    isLoading,
    isUpdating,
    isSyncing,
    fetchCart,
    updateCartItemQuantity,
    removeCartItem,
  } = useCartStore();

  useEffect(() => {
    fetchCart();
  }, []);

  const onRefresh = useCallback(async () => {
    await fetchCart();
  }, [fetchCart]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <CartItems
          items={cart?.items ?? null}
          // Show skeleton only when there is no local data to display
          loading={isLoading && !cart}
          onItemPress={(item) =>
            router.push({ pathname: "/listing/[id]", params: { id: item.listing.id } })
          }
          onQuantityChange={(id, qty) => updateCartItemQuantity(id, qty)}
          onRemoveItem={(id) => removeCartItem(id)}
        />
      </ScrollView>

      <CartSummary
        totalItems={cart?.total_items ?? 0}
        totalPrice={cart?.total_price ?? "0"}
        onCheckout={() => router.push("/checkout/address")}
        loading={isUpdating}
        disabled={(cart?.total_items ?? 0) === 0}
        isSyncing={isSyncing}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
});
