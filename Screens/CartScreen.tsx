import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useSectionData } from "@/hooks/useSectionData";
import { cartService } from "@/utils/services/cartService";
import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { CartItems } from "@/components/test/CartItemListing";
import { CartSummary } from "@/components/test/CartSummary";
import { DetailHeaderSection } from "@/components/test/DetailHeader";

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

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
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
      />

      <CartSummary
        totalItems={userCartData.data?.total_items || 0}
        totalPrice={userCartData.data?.total_price || "0"}
        onCheckout={() =>
          router.push({
            pathname: "/orders/[id]",
            params: { cartid: userCartData.data?.id },
          })
        }
        loading={false}
        disabled={(userCartData.data?.total_items || 0) === 0}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
  },
});
