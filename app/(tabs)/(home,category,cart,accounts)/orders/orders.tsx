import { Dimensions, Platform, StyleSheet, View } from "react-native";
import { DetailHeaderSection } from "@/components/test/DetailHeader";
import NewAddressScreen from "@/Screens/NewAddressScreen";
import OrderSuccessScreen from "@/Screens/OrderSuccessScreen";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import ScreenWrapper from "@/components/ScreenWrapper";
import { useCallback } from "react";
import { StatusBar } from "react-native";
import OrdersListScreen from "@/Screens/OrderListScreen";


export default function OrderSuccessMain() {

   useFocusEffect(
      useCallback(() => {
        StatusBar.setBarStyle("dark-content");
      }, [])
    );

  return (
    <View style={{ flex: 1 }}>
         <DetailHeaderSection title="My Orders" subheading="Track and manage all orders you placed" />
      <OrdersListScreen />
    </View>
  );
}
