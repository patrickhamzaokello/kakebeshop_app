import { useAuthStore } from "@/utils/authStore";
import PushNotificationManager from "@/utils/PushNotificationManager";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { useCartStore } from "@/utils/stores/useCartStore";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";

// Inner layout component that uses theme
const RootLayoutContent = () => {
  const {
    isLoggedIn,
    hasCompletedOnboarding,
    isLoading: authLoading,
    checkAuthState,
  } = useAuthStore();

  const { fetchCartCount } = useCartStore();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    checkAuthState();
    GoogleSignin.configure({
      iosClientId:
        "587787462511-lqie16rbc77p418sfpodcdffse0o8o3b.apps.googleusercontent.com",
      profileImageSize: 120,
    });
  }, [checkAuthState]);

  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      fetchCartCount(); // Only fetch if user is logged in
    }
  }, [authLoading, isLoggedIn]);

  if (authLoading) {
    return (
      <GestureHandlerRootView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack>
          <Stack.Screen name="loading" options={{ headerShown: false }} />
        </Stack>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: colors.background }]}>
      <PushNotificationManager>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Protected
            guard={isLoggedIn && hasCompletedOnboarding}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack.Protected>

          <Stack.Protected guard={isLoggedIn && !hasCompletedOnboarding}>
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          </Stack.Protected>

          <Stack.Protected guard={!isLoggedIn}>
            <Stack.Screen name="welcome" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack.Protected>
        </Stack>
      </PushNotificationManager>
    </GestureHandlerRootView>
  );
};

// Root layout with ThemeProvider wrapper
const RootLayout = () => {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default RootLayout;