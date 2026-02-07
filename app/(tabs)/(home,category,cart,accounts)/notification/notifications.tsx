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
import NotificationsScreen from "@/Screens/NotificationScreen";

export default function NotificationMain() {


    useFocusEffect(
         useCallback(() => {
           StatusBar.setBarStyle("dark-content");
         }, [])
       );
   
     return (
       <View style={{ flex: 1 }}>
            <DetailHeaderSection title="Notification" subheading="Catch up on the latest updates" />

            <NotificationsScreen />
       </View>
     );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

});
