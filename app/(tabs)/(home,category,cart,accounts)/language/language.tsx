import { View, StatusBar } from "react-native";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { DetailHeaderSection } from "@/components/test/DetailHeader";
import Typo from "@/components/Typo";

export default function LanguageMain() {
  const { isDark, colors } = useTheme();

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(isDark ? "light-content" : "dark-content");
    }, [isDark])
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailHeaderSection title="Language" subheading="Choose your preferred language" />
      <Typo>Language page</Typo>
    </View>
  );
}
