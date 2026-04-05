import { Dimensions, Platform, StyleSheet, View } from "react-native";
import { DetailHeaderSection } from "@/components/test/DetailHeader";
import NewAddressScreen from "@/Screens/NewAddressScreen";
import OrderSuccessScreen from "@/Screens/OrderSuccessScreen";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import ScreenWrapper from "@/components/ScreenWrapper";
import { useCallback } from "react";
import { StatusBar } from "react-native";
import AccountScreen from "@/Screens/SettingsScreen";
import { useTheme } from "@/contexts/ThemeContext";

export default function SettingsMainScreen() {
  const { orderIds, orderGroupId } = useLocalSearchParams();
  const { isDark } = useTheme();

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(isDark ? "light-content" : "dark-content");
    }, [isDark])
  );

  return (
    <View style={{ flex: 1 }}>
      <DetailHeaderSection title="Settings" subheading="Manage your profile, and track orders" />
      <AccountScreen />
    </View>
  );
}
