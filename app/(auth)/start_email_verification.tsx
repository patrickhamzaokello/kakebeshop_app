import BackButton from "@/components/CustomBackButton";
import Button from "@/components/CustomButton";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuthStore } from "@/utils/authStore";
import { verticalScale } from "@/utils/styling";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  TextInput,
  View
} from "react-native";

const StartEmailVerification = () => {
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { email } = useLocalSearchParams();

  const { resendVerificationCode } = useAuthStore(); // Assuming this method exists

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert("Error", "No email address provided");
      return;
    }

    setIsLoading(true);
    try {
      const res = await resendVerificationCode(email as string);

      if (!res.success) {
        Alert.alert("Verification Failed", res.msg);
      } else {
        Alert.alert(
          "Verification Code Sent",
          "Please check your email for a verification code."
        );
        router.replace({
          pathname: "/(auth)/verify_new_account_email",
          params: { email },
        });
      }
    } catch (error) {
      Alert.alert(
        "Verification Failed",
        "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView>
        <ScrollView>
          <View style={styles.container}>
            <BackButton iconSize={28} />
            <View
              style={{
                gap: 5,
                marginTop: spacingY._20,
                justifyContent: "center",
                alignContent: "center",
              }}
            >
              <Image
                source={require("@/assets/icons/ios-dark.png")}
                style={{
                  width: 100,
                  height: 100,
                  marginBottom: spacingY._20,
                  borderRadius: 10,
                  justifyContent: "center",
                  alignSelf: "center"
                }}
              />

              <Typo
                size={30}
                fontWeight={"800"}
                style={{ textAlign: "center" }}
              >
                Verify Your Email
              </Typo>
              <Typo
                size={18}
                style={{
                  textAlign: "center",
                  paddingVertical: spacingY._20,
                  color: "#666",
                }}
              >
                We need to verify your email address to complete your account setup. We'll send a verification code to your email.
              </Typo>
            </View>

            {/* Email Display and Verification */}
            <View style={styles.form}>
              <Typo size={16} color={colors.black} fontWeight={"400"}>
                Email address to verify
              </Typo>

              {/* Email Display */}
              <View style={styles.inputContainer}>
                <View style={[styles.inputWrapper, styles.emailDisplay]}>
                  <Feather
                    name="mail"
                    size={20}
                    color={colors.primary}
                    style={styles.inputIcon}
                  />
                  <Typo size={16} color={colors.black} style={{ flex: 1 }}>
                    {email || "No email provided"}
                  </Typo>
                  <Feather
                    name="check-circle"
                    size={20}
                    color={colors.neutral400}
                  />
                </View>
              </View>

              <Button
                loading={isLoading}
                onPress={handleSubmit}
                style={styles.loginButton}
                disabled={!email}
              >
                <Typo fontWeight={"700"} color="#ffffff" size={16}>
                  {isLoading ? "Sending..." : "Send Verification Code"}
                </Typo>
              </Button>

              <Typo
                size={14}
                style={{
                  textAlign: "center",
                  marginTop: spacingY._12,
                  color: "#666",
                }}
              >
                Check your spam folder if you don't receive the email within a few minutes.
              </Typo>
            </View>            
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default StartEmailVerification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacingY._30,
    paddingHorizontal: spacingX._20,
  },
  welcomeText: {
    fontSize: verticalScale(20),
    fontWeight: "bold",
    color: colors.text,
  },
  form: {
    gap: spacingY._16,
  },
  inputContainer: {
    marginBottom: spacingY._4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#D9D9D9",
    borderRadius: 12,
    paddingHorizontal: spacingX._16,
    minHeight: verticalScale(52),
  },
  emailDisplay: {
    backgroundColor: "#F8F9FA",
    borderColor: colors.primary,
  },
  inputIcon: {
    marginRight: spacingX._12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    paddingVertical: spacingY._4,
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacingY._16,
    marginTop: spacingY._8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  footerText: {
    textAlign: "center",
    color: colors.text,
    fontSize: verticalScale(15),
  },
});