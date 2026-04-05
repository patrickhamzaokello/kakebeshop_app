import {
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import React from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";

const { height } = Dimensions.get("window");

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
  let paddingTop = Platform.OS == "ios" ? height * 0.06 : StatusBar.currentHeight || 50;

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(resolvedStyle);
    }, [resolvedStyle])
  );

  return (
    <View
      style={[
        {
          paddingTop,
          flex: 1,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default ScreenWrapper;