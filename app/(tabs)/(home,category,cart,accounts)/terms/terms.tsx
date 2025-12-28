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

export default function TermsPage() {


    useFocusEffect(
         useCallback(() => {
           StatusBar.setBarStyle("dark-content");
         }, [])
       );
   
     return (
       <View style={{ flex: 1 }}>
            <DetailHeaderSection title="Terms & Conditions" subheading="Please read through and accept" />
       </View>
     );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

});
