import React from "react";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import Typo from "@/components/Typo";
import { spacingX, spacingY } from "@/constants/theme";

interface SocialAuthButtonsProps {
  isGoogleLoading: boolean;
  isAppleLoading: boolean;
  setIsGoogleLoading: (loading: boolean) => void;
  setIsAppleLoading: (loading: boolean) => void;
  showSocialAuth?: boolean; // Optional prop to control visibility
}

const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
  isGoogleLoading,
  isAppleLoading,
  setIsGoogleLoading,
  setIsAppleLoading,
  showSocialAuth = true, // Default to true
}) => {
  const router = useRouter();

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      router.replace("/(auth)/social-auth");
    } catch (error) {
      Alert.alert(
        "Google Sign Up Failed",
        "An error occurred. Please try again."
      );
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignUp = async () => {
    setIsAppleLoading(true);
    try {
      router.replace("/(auth)/social-auth");
    } catch (error) {
      Alert.alert(
        "Apple Sign Up Failed",
        "An error occurred. Please try again."
      );
      setIsAppleLoading(false);
    }
  };

  return (
    <>
      {showSocialAuth && (
        <>
          
          {/* Social Buttons */}
          <View style={styles.socialContainer}>
            <Pressable
              style={[
                styles.socialButton,
                styles.googleButton,
                isGoogleLoading && styles.socialButtonDisabled,
              ]}
              onPress={handleGoogleSignUp}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <Typo style={styles.socialButtonText}>Loading...</Typo>
              ) : (
                <>
                  <Image
                    source={require("@/assets/images/google_icon_image.png")}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 10,
                    }}
                  />
                  <Typo style={styles.socialButtonText} color={"#374151"}>
                    Continue with Google
                  </Typo>
                </>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.socialButton,
                styles.appleButton,
                isAppleLoading && styles.socialButtonDisabled,
              ]}
              onPress={handleAppleSignUp}
              disabled={isAppleLoading}
            >
              {isAppleLoading ? (
                <Typo style={styles.socialButtonText}>Loading...</Typo>
              ) : (
                <>
                  <AntDesign name="apple" size={26} color="#000" />
                  <Typo style={styles.socialButtonText} color={"#374151"}>
                    Continue with Apple
                  </Typo>
                </>
              )}
            </Pressable>
          </View>
        </>
      )}
    </>
  );
};

export default SocialAuthButtons;

const styles = StyleSheet.create({
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacingY._20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  dividerText: {
    fontSize: 14,
    color: "#6b7280",
    paddingHorizontal: spacingX._16,
    backgroundColor: "#ffffff",
  },
  socialContainer: {
    gap: spacingY._12,
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._16,
    backgroundColor: "#ffffff",
  },
  googleButton: {
    borderColor: "#e5e7eb",
  },
  appleButton: {
    borderColor: "#e5e7eb",
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },
});