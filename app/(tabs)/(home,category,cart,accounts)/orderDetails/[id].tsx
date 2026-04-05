import { StatusBar, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { DetailHeaderSection } from "@/components/test/DetailHeader";
import OrderDetailScreen from "@/Screens/OrderDetailsScreen";

export default function OrderDetailsMain() {
  const { isDark, colors } = useTheme();

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(isDark ? "light-content" : "dark-content");
    }, [isDark])
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailHeaderSection title="Order Details" subheading="Manage your order details" />
      <OrderDetailScreen />
    </View>
  );
}
