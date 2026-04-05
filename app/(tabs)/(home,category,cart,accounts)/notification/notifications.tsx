import ScreenWrapper from "@/components/ScreenWrapper";
import {
    StatusBar,
  StyleSheet,
  View,
} from "react-native";
import Typo from "@/components/Typo";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { DetailHeaderSection } from "@/components/test/DetailHeader";
import NotificationsScreen from "@/Screens/NotificationScreen";

export default function NotificationMain() {
  const { isDark } = useTheme();


    useFocusEffect(
         useCallback(() => {
           StatusBar.setBarStyle(isDark ? "light-content" : "dark-content");
         }, [isDark])
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
