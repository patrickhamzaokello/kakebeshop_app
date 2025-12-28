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

export default function WishlistMain() {


    useFocusEffect(
         useCallback(() => {
           StatusBar.setBarStyle("dark-content");
         }, [])
       );
   
     return (
       <View style={{ flex: 1 }}>
            <DetailHeaderSection title="Favourites" subheading="Here are your saved listings" />
       </View>
     );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

});
