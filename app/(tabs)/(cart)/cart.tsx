import ScreenWrapper from "@/components/ScreenWrapper";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import Typo from "@/components/Typo";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { useCartStore } from "@/utils/stores/useCartStore";
import { CartScreen } from "@/Screens/CartScreen";
import { DetailHeaderSection } from "@/components/test/DetailHeader";

export default function CartMain() {
  const { fetchCartCount } = useCartStore();

  useFocusEffect(
    useCallback(() => {
      fetchCartCount(); // Always fresh when opening cart
    }, [])
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <DetailHeaderSection
        title="Your Cart"
        subheading="Review items and proceed to checkout"
      />

      <CartScreen />
    </View>
  );
}
