import ScreenWrapper from "@/components/ScreenWrapper";
import {
    StatusBar,
  StyleSheet,
  View,
} from "react-native";
import Typo from "@/components/Typo";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { DetailHeaderSection } from "@/components/test/DetailHeader";
import OrderDetailScreen from "@/Screens/OrderDetailsScreen";

export default function WishlistMain() {


    useFocusEffect(
         useCallback(() => {
           StatusBar.setBarStyle("dark-content");
         }, [])
       );
   
     return (
       <View style={{ flex: 1 }}>
            <DetailHeaderSection title="Order Details" subheading="Manage your order details" />
            <OrderDetailScreen />
       </View>
     );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

});
