import {
    StatusBar,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { DetailHeaderSection } from "@/components/test/DetailHeader";
import NotificationPreferencesScreen from "@/Screens/NotificationPreferenceScreen";

export default function WishlistMain() {
  const { isDark, colors } = useTheme();


    useFocusEffect(
         useCallback(() => {
           StatusBar.setBarStyle(isDark ? "light-content" : "dark-content");
         }, [isDark])
       );
   
     return (
       <View style={{ flex: 1, backgroundColor: colors.background }}>
            <DetailHeaderSection title="Preferences" subheading="Choose the notifications you would like to receive" />
            <NotificationPreferencesScreen />
       </View>
     );
}

