import { View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { useCartStore } from "@/utils/stores/useCartStore";
import { CartScreen } from "@/Screens/CartScreen";
import { DetailHeaderSection } from "@/components/test/DetailHeader";
import { useTheme } from "@/contexts/ThemeContext";

export default function CartMain() {
  const { fetchCartCount } = useCartStore();
  const {colors} = useTheme();

  useFocusEffect(
    useCallback(() => {
      fetchCartCount(); // Always fresh when opening cart
    }, [])
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailHeaderSection
        title="Your Cart"
        subheading="Review items and proceed to checkout"
      />

      <CartScreen />
    </View>
  );
}
