import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { postUserIntent } from "@/utils/apiEndpoints";
import { useAuthStore } from "@/utils/authStore";
import PushNotificationManager from "@/utils/PushNotificationManager";
import { useCartStore } from "@/utils/stores/useCartStore";
import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  BeVietnamPro_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/be-vietnam-pro";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

// ─── Keep splash visible until font + auth are both ready ────────────────────
SplashScreen.preventAutoHideAsync();

// ─── Inner layout (uses theme + auth) ────────────────────────────────────────
const RootLayoutContent = () => {
  const {
    isLoggedIn,
    hasCompletedOnboarding,
    hasPhoneNumber,
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

  // Handles two cases:
  // 1. Initial routing — after auth first resolves, explicitly navigate to the
  //    correct screen. Stack.Protected guards block unauthorized access but do
  //    NOT push navigation by themselves, so without this the Stack has no
  //    active route and renders nothing (black screen).
  // 2. Logout transition — navigate to welcome when isLoggedIn drops to false.
  const prevIsLoggedIn = useRef<boolean | null>(null);
  useEffect(() => {
    if (authLoading) return;

    if (prevIsLoggedIn.current === null) {
      // First time auth state is known: navigate to the correct screen.
      prevIsLoggedIn.current = isLoggedIn;
      router.replace(
        isLoggedIn
          ? hasPhoneNumber
            ? ("/(tabs)" as any)
            : ("/add-phone" as any)
          : "/welcome"
      );
      return;
    }

    // Subsequent changes — only act on a logout transition.
    if (prevIsLoggedIn.current && !isLoggedIn) {
      router.replace("/welcome");
    }
    prevIsLoggedIn.current = isLoggedIn;
  }, [authLoading, isLoggedIn, hasPhoneNumber]);

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
          <Stack.Protected guard={isLoggedIn && hasPhoneNumber}>
            <Stack.Screen name="(tabs)" />
          </Stack.Protected>

          <Stack.Protected guard={isLoggedIn && !hasPhoneNumber}>
            <Stack.Screen name="add-phone" />
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
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    BeVietnamPro_800ExtraBold,
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
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <RootLayoutContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default RootLayout;
