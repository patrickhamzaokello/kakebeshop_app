import { useCallback } from "react";
import { StatusBar } from "react-native";
import { useFocusEffect } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import UserEditProfileImageScreen from "@/Screens/UserEditProfileImageScreen";

export default function EditMerchantProfile() {
  const { isDark } = useTheme();

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(isDark ? "light-content" : "dark-content");
    }, [isDark])
  );

  return <UserEditProfileImageScreen />;
}
