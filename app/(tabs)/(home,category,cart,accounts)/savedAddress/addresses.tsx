import { StatusBar, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { DetailHeaderSection } from "@/components/test/DetailHeader";
import AddressListScreen from "@/Screens/AddressListScreen";

export default function ListAddressMain() {
  const { isDark, colors } = useTheme();


    useFocusEffect(
         useCallback(() => {
           StatusBar.setBarStyle(isDark ? "light-content" : "dark-content");
         }, [isDark])
       );
   
     return (
       <View style={{ flex: 1, backgroundColor: colors.background }}>
            <DetailHeaderSection title="Addresses" subheading="All saved Addresses list" />

            <AddressListScreen />
       </View>
     );
}

