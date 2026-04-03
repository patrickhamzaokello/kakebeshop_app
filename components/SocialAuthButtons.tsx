import React from "react";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  View,
  Text,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { useAuthStore } from "@/utils/authStore";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";

interface SocialAuthButtonsProps {
  isGoogleLoading: boolean;
  isAppleLoading: boolean;
  setIsGoogleLoading: (loading: boolean) => void;
  setIsAppleLoading: (loading: boolean) => void;
  showSocialAuth?: boolean;
}

const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
  isGoogleLoading,
  isAppleLoading,
  setIsGoogleLoading,
  setIsAppleLoading,
  showSocialAuth = true,
}) => {
  const router = useRouter();
  const { loginWithSocial } = useAuthStore();

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const { idToken } = response.data;
        if (idToken) {
          const res = await loginWithSocial(idToken, "google");
          if (!res.success) {
            Alert.alert("Login Failed", res.msg);
          }
          // If success, auth store will handle navigation
        } else {
          Alert.alert("Google Sign-In Failed", "ID Token is missing.");
        }
      } else {
        Alert.alert("Google Sign-In Failed", "Please try again.");
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            // User cancelled - don't show alert
            break;
          case statusCodes.IN_PROGRESS:
            Alert.alert(
              "Google Sign-In In Progress",
              "Sign-in is already in progress."
            );
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert(
              "Google Sign-In Error",
              "Google Play Services are not available on this device."
            );
            break;
          default:
            Alert.alert(
              "Google Sign-In Error",
              "An unexpected error occurred. Please try again."
            );
            break;
        }
      } else {
        Alert.alert(
          "Sign-In Error",
          "An unexpected error occurred. Please try again."
        );
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setIsAppleLoading(true);

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { identityToken } = credential;

      if (identityToken) {
        const res = await loginWithSocial(identityToken, "apple");
        if (!res.success) {
          Alert.alert("Login Failed", res.msg);
        }
        // If success, auth store will handle navigation
      } else {
        Alert.alert("Apple Sign-In Failed", "ID Token is missing.");
      }
    } catch (e: any) {
      // Handle Apple Sign-In cancellation gracefully
      if (e.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert(
          "Apple Sign-In Error",
          "An unexpected error occurred. Please try again."
        );
      }
    } finally {
      setIsAppleLoading(false);
    }
  };

  if (!showSocialAuth) {
    return null;
  }

  return (
    <View style={styles.socialContainer}>
      {/* Apple Button - Native */}
      <View style={styles.appleButtonContainer}>
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={
            AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
          }
          buttonStyle={
            AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={12}
          style={[
            styles.appleNativeButton,
            (isAppleLoading || isGoogleLoading) && styles.disabledButton,
          ]}
          onPress={handleAppleSignIn}
        />
        {isAppleLoading && (
          <View style={styles.appleLoadingOverlay}>
            <Text style={styles.appleLoadingText}>Signing in...</Text>
          </View>
        )}
      </View>

      {/* Google Button */}
      <Pressable
        style={[
          styles.socialButton,
          styles.googleButton,
          (isGoogleLoading || isAppleLoading) && styles.socialButtonDisabled,
        ]}
        onPress={handleGoogleSignIn}
        disabled={isGoogleLoading || isAppleLoading}
      >
        {isGoogleLoading ? (
          <Typo style={styles.socialButtonText}>Signing in...</Typo>
        ) : (
          <>
            <View style={styles.iconContainer}>
              <Image
                source={require("@/assets/images/google_icon_image.png")}
                style={styles.googleIcon}
              />
            </View>
            <Typo style={styles.socialButtonText} color="#000" fontWeight="500">
              Continue with Google
            </Typo>
          </>
        )}
      </Pressable>
    </View>
  );
};

export default SocialAuthButtons;

const styles = StyleSheet.create({
  socialContainer: {
    gap: spacingY._12,
  },
  appleButtonContainer: {
    position: "relative",
    height: verticalScale(52),
  },
  appleNativeButton: {
    width: "100%",
    height: verticalScale(52),
  },
  appleLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  appleLoadingText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.black,
  },
  disabledButton: {
    opacity: 0.6,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: spacingY._15,
    paddingHorizontal: spacingX._16,
    backgroundColor: "#ffffff",
  },
  googleButton: {
    borderColor: "#E5E7EB",
    backgroundColor: "#ffffff",
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  googleIcon: {
    width: 22,
    height: 22,
  },
  socialButtonText: {
    fontSize: 16,
  },
});