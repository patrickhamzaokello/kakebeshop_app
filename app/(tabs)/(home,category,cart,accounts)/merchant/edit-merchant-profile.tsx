import { useCallback } from "react";
import { StatusBar } from "react-native";
import { useFocusEffect } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import MerchantEditProfileScreen from "@/Screens/MerchantEditProfileScreen";

export default function EditMerchantProfile() {
  const { isDark } = useTheme();

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(isDark ? "light-content" : "dark-content");
    }, [isDark])
  );

  return <MerchantEditProfileScreen />;
}
