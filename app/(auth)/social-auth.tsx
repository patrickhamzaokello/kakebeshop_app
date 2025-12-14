import Button from "@/components/CustomButton";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { LinearGradient } from "expo-linear-gradient";

import { useAuthStore } from "@/utils/authStore";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, StyleSheet, Text, View } from "react-native";
import { Background } from "@react-navigation/elements";

const SocialAuthScreen = () => {


  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const router = useRouter();
  const { loginWithSocial } = useAuthStore();

  const handleTermsPress = () => {
    // Navigate to terms
  };

  const handleUsagePolicyPress = () => {
    // Navigate to usage policy
  };

  const handlePrivacyPolicyPress = () => {
    // Navigate to privacy policy
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

      const { identityToken, user } = credential;

      if (identityToken) {
        const res = await loginWithSocial(identityToken, "apple");
        if (res.success) {
          Alert.alert("Login Failed", res.msg);
        } else {
          Alert.alert("Login Failed", res.msg);
        }
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

  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const { idToken, user } = response.data;
        if (idToken) {
          const res = await loginWithSocial(idToken, "google");
          if (res.success) {
            Alert.alert("Login Failed", res.msg);
          } else {
            Alert.alert("Login Failed", res.msg);
          }
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
            // Don't show alert for user cancellation
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
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenWrapper  statusBarStyle = "dark-content" style={{ backgroundColor: "#C8FF42"}}>
      <View style={styles.container}>
        
        <View style={styles.contentView}>
          <View style={{ gap: 5, marginTop: spacingY._20 }}>
            <Image
              source={require("@/assets/icons/ios-dark.png")}
              style={{ alignSelf: "center", width: 100, height: 100, marginVertical: spacingY._10 }}
            />
        
          </View>

          {/* form */}

          <View style={styles.form}>
            <Typo
              size={35}
              fontWeight={"800"}
              color={colors.black}
              style={{ textAlign: "center", marginBottom: spacingY._40 }}
            >
              Your World. Your News. TND NEWS.
            </Typo>

            <Button
              loading={isLoading}
              onPress={() => router.push("/(auth)/register")}
              style={styles.social_email_button}
            >
              <Image
                source={require("@/assets/images/email_icon.png")}
                style={{ width: 25, height: 25 }}
              />
              <Typo fontWeight={"400"} color={colors.white} size={21}>
                Continue with Email
              </Typo>
            </Button>

            {/* Google Sign In Button */}
            <Button
              loading={isSubmitting}
              onPress={handleGoogleSignIn}
              style={styles.social_button}
              disabled={isSubmitting || isAppleLoading}
            >
              <Image
                source={require("@/assets/images/google_icon_image.png")}
                style={{ width: 25, height: 25 }}
              />

              <Typo fontWeight={"500"} color={colors.black} size={21}>
                {isSubmitting ? "Signing in..." : "Continue with Google"}
              </Typo>
            </Button>

            {/* apple sign in  */}
            <View style={styles.appleButtonContainer}>
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={
                  AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
                }
                buttonStyle={
                  AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                }
                cornerRadius={17}
                style={[
                  styles.apple_special_button,
                  (isAppleLoading || isSubmitting) && styles.disabledButton,
                ]}
                onPress={handleAppleSignIn}
              />
              {isAppleLoading && (
                <View style={styles.appleLoadingOverlay}>
                  <Text style={styles.appleLoadingText}>Signing in...</Text>
                </View>
              )}
            </View>
            {/* apple sign in */}
          </View>
          {/* footer */}
          {/* Terms and Privacy */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By continuing, you agree to TND News'{" "}
              <Text style={styles.linkText} onPress={handleTermsPress}>
                Consumer Terms
              </Text>{" "}
              and{" "}
              <Text style={styles.linkText} onPress={handleUsagePolicyPress}>
                Usage Policy
              </Text>
              , and{"\n"}acknowledge their{" "}
              <Text style={styles.linkText} onPress={handlePrivacyPolicyPress}>
                Privacy Policy
              </Text>
            </Text>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default SocialAuthScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacingY._30,
  },

  radialContainer: {
    position: "absolute",
    top: "20%",
    left: "20%",
    width: "60%",
    height: "60%",
    justifyContent: "center",
    alignItems: "center",
  },
  radialGradient: {
    width: 300,
    height: 300,
    borderRadius: 150, // Makes it circular
    position: "absolute",
  },

  contentView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 1, // Ensures content is above gradient
  },

  social_email_button: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacingX._10,
  },
  social_button: {
    backgroundColor: colors.white,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacingX._10,
  },
  apple_special_button: {
    height: verticalScale(52),
    justifyContent: "center",
    alignItems: "center",
    fontSize: 21,
  },
  appleButtonContainer: {
    position: "relative",
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
    borderRadius: 17,
  },
  appleLoadingText: {
    fontSize: 21,
    fontWeight: "500",
    color: colors.black,
  },
  disabledButton: {
    opacity: 0.6,
  },
  welcomeText: {
    fontSize: verticalScale(20),
    fontWeight: "bold",
    color: colors.text,
  },
  form: {
    gap: spacingY._10,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },

  termsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  termsText: {
    fontSize: 14,
    color: "rgba(101, 101, 101, 0.8)",
    textAlign: "center",
    lineHeight: 20,
  },
  linkText: {
    color: "black",
    textDecorationLine: "underline",
  },
});