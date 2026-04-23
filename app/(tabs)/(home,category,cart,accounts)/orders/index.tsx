import { Dimensions, Platform, StyleSheet, View } from "react-native";
import { DetailHeaderSection } from "@/components/test/DetailHeader";
import NewAddressScreen from "@/Screens/NewAddressScreen";
import OrderSuccessScreen from "@/Screens/OrderSuccessScreen";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import ScreenWrapper from "@/components/ScreenWrapper";
import { useCallback } from "react";
import { StatusBar } from "react-native";
import OrdersListScreen from "@/Screens/OrderListScreen";
import { useTheme } from "@/contexts/ThemeContext";


export default function OrderSuccessMain() {
  const { isDark } = useTheme();

   useFocusEffect(
      useCallback(() => {
        StatusBar.setBarStyle(isDark ? "light-content" : "dark-content");
      }, [isDark])
    );

  return (
    <View style={{ flex: 1 }}>
         <DetailHeaderSection title="My Orders" subheading="Track and manage all orders you placed" showBackButton />
      <OrdersListScreen />
    </View>
  );
}
