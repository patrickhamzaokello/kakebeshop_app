import { Platform, StatusBar, StyleSheet } from "react-native";
import React from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScreenWrapperProps {
  style?: any;
  children: React.ReactNode;
  statusBarStyle?: "light-content" | "dark-content";
}

const ScreenWrapper = ({
  style,
  children,
  statusBarStyle,
}: ScreenWrapperProps) => {
  const { isDark } = useTheme();
  const resolvedStyle = statusBarStyle ?? (isDark ? "light-content" : "dark-content");

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(resolvedStyle);
      if (Platform.OS === "android") {
        StatusBar.setTranslucent(false);
        StatusBar.setBackgroundColor("transparent");
      }
    }, [resolvedStyle])
  );

  return (
    <SafeAreaView style={[styles.container, style]}>
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ScreenWrapper;