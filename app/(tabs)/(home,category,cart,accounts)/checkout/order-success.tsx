import { Dimensions, Platform, StyleSheet, View } from "react-native";
import { DetailHeaderSection } from "@/components/test/DetailHeader";
import NewAddressScreen from "@/Screens/NewAddressScreen";
import OrderSuccessScreen from "@/Screens/OrderSuccessScreen";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import ScreenWrapper from "@/components/ScreenWrapper";
import { useCallback } from "react";
import { StatusBar } from "react-native";

interface OrderGroup {
  id: string;
  group_number: string;
  total_orders: number;
  total_amount: string;
}

interface Order {
  id: string;
  order_number: string;
  merchant_name: string;
  total_amount: string;
  order_group_number?: string;
  is_grouped: boolean;
}


export default function OrderSuccessMain() {
  const { orderIds, orderGroupId } = useLocalSearchParams();

   useFocusEffect(
      useCallback(() => {
        StatusBar.setBarStyle("dark-content");
      }, [])
    );

  return (
    <View style={{ flex: 1 }}>
      <OrderSuccessScreen orderIds={orderIds} orderGroupId={orderGroupId}  />
    </View>
  );
}
