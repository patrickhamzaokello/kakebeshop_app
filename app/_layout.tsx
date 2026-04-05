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
import { postUserIntent } from "@/utils/apiEndpoints";

// Inner layout component that uses theme
const RootLayoutContent = () => {
  const {
    isLoggedIn,
    hasCompletedOnboarding,
    isLoading: authLoading,
    checkAuthState,
    completeOnboarding,
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
      fetchCartCount();

      // Onboarding removed — default all users to "both" (buy & sell).
      // This silently completes onboarding for any user who hasn't done it yet
      // (new sign-ups or users who had the old onboarding flow).
      if (!hasCompletedOnboarding) {
        postUserIntent("both").catch(() => {});
        completeOnboarding();
      }
    }
  }, [authLoading, isLoggedIn, hasCompletedOnboarding]);

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
          <Stack.Protected guard={isLoggedIn}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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