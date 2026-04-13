import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { postUserIntent } from "@/utils/apiEndpoints";
import { useAuthStore } from "@/utils/authStore";
import PushNotificationManager from "@/utils/PushNotificationManager";
import { useCartStore } from "@/utils/stores/useCartStore";
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts,
} from "@expo-google-fonts/space-grotesk";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// ─── Keep splash visible until font + auth are both ready ────────────────────
SplashScreen.preventAutoHideAsync();

// ─── Inner layout (uses theme + auth) ────────────────────────────────────────
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
      webClientId:
        "587787462511-bqs4eiss15no6u37u6u6b4oqihrlcm7k.apps.googleusercontent.com",
      iosClientId:
        "587787462511-lqie16rbc77p418sfpodcdffse0o8o3b.apps.googleusercontent.com",
      profileImageSize: 120,
    });
  }, [checkAuthState]);

  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      fetchCartCount();

      if (!hasCompletedOnboarding) {
        postUserIntent("both").catch(() => {});
        completeOnboarding();
      }
    }
  }, [authLoading, isLoggedIn, hasCompletedOnboarding]);

  // Single Stack for all states — avoids the full unmount/remount (and the
  // resulting "(tabs)" header flash) that occurred when two separate <Stack>
  // trees swapped in/out as authLoading changed.
  return (
    <GestureHandlerRootView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <PushNotificationManager>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="loading" />

          <Stack.Protected guard={isLoggedIn}>
            <Stack.Screen name="(tabs)" />
          </Stack.Protected>

          <Stack.Protected guard={!isLoggedIn}>
            <Stack.Screen name="welcome" />
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
        </Stack>
      </PushNotificationManager>
    </GestureHandlerRootView>
  );
};

// ─── Root layout — loads font before rendering anything ──────────────────────
const RootLayout = () => {
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  // Read auth loading state so we can keep the splash up until both are ready
  const isAuthLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    // Hide splash only when fonts AND auth check are both done.
    // This prevents the "(tabs)" header flash that occurs when the
    // loading Stack unmounts and the main Stack mounts mid-transition.
    if ((fontsLoaded || fontError) && !isAuthLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isAuthLoading]);

  // Render nothing until font is ready — splash screen stays visible
  if (!fontsLoaded && !fontError) return null;

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
