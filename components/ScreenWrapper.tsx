import {
  Dimensions,
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import React from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, } from "react";

const { height } = Dimensions.get("window");

interface ScreenWrapperProps {
  style?: any;
  children: React.ReactNode;
  statusBarStyle?: "light-content" | "dark-content";
}

const ScreenWrapper = ({ 
  style, 
  children, 
  statusBarStyle = "dark-content" 
}: ScreenWrapperProps) => {
  let paddingTop = Platform.OS == "ios" ? height * 0.06 : StatusBar.currentHeight || 50;

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(statusBarStyle);
    }, [statusBarStyle])
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