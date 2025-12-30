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
import AddressListScreen from "@/Screens/AddressListScreen";

export default function ListAddressMain() {


    useFocusEffect(
         useCallback(() => {
           StatusBar.setBarStyle("dark-content");
         }, [])
       );
   
     return (
       <View style={{ flex: 1 }}>
            <DetailHeaderSection title="Addresses" subheading="All saved Addresses list" />

            <AddressListScreen />
       </View>
     );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

});
