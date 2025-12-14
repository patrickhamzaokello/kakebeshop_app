import { useAuthStore } from "@/utils/authStore";
import PushNotificationManager from "@/utils/PushNotificationManager";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";

const RootLayout = () => {
  const {
    isLoggedIn,
    hasCompletedOnboarding,
    isNewUser,
    isLoading,
    checkAuthState,
  } = useAuthStore();

  // Initialize auth state on app start
  useEffect(() => {
    checkAuthState();
    GoogleSignin.configure({
      iosClientId:
        "1031020224121-trmppfnusv7kp4690idkku75jbh0os1h.apps.googleusercontent.com",
      profileImageSize: 120,
    });
  }, [checkAuthState]);

  // Show loading screen while checking auth state
  if (isLoading) {
    return (
      <React.Fragment>
        <StatusBar style="light" />
        <Stack>
          <Stack.Screen name="loading" options={{ headerShown: false }} />
        </Stack>
      </React.Fragment>
    );
  }

  return (
    <PushNotificationManager>
      <React.Fragment>
        <StatusBar style="auto" />
        <Stack>
          {/* Protected routes - user is fully authenticated and onboarded */}
          <Stack.Protected
            guard={
              isLoggedIn &&
              hasCompletedOnboarding 
            }
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack.Protected>
         

          {/* Onboarding - user is logged in but hasn't completed onboarding */}
          <Stack.Protected guard={isLoggedIn && !hasCompletedOnboarding}>
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          </Stack.Protected>

          {/* Auth routes - user is not logged in */}
          <Stack.Protected guard={!isLoggedIn}>
            <Stack.Screen name="welcome" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          </Stack.Protected>
        </Stack>
      </React.Fragment>
    </PushNotificationManager>
  );
};

export default RootLayout;
