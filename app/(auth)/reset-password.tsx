import BackButton from "@/components/CustomBackButton";
import Button from "@/components/CustomButton";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuthStore } from "@/utils/authStore";
import { verticalScale } from "@/utils/styling";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
const ResetPassword = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const { forgotPassword } = useAuthStore();

  const handleSubmit = async () => {
    const { email } = formData;

    if (!email) {
      Alert.alert("Email is Required", "Please provide an email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(
        "Invalid Email Address",
        "Please enter a valid email address"
      );
      return;
    }

    setIsLoading(true);
    try {
      const res = await forgotPassword(email);

      if (!res.success) {
        Alert.alert("Reset Password Failed", res.msg);
      } else {
        Alert.alert(
          "Code Sent to Email.",
          "Please check your email for a password reset code."
        );
        router.replace({
          pathname: "/(auth)/verify-password-reset-code",
          params: { email },
        });
      }
    } catch (error) {
      Alert.alert(
        "Reset Password Failed",
        "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
                Forgot Password?
              </Typo>
              <Typo
                size={18}
                style={{
                  textAlign: "center",
                  paddingVertical: spacingY._20,
                  color: "#666",
                }}
              >
                Don't worry! It happens. Please enter the email address
                associated with your account.
              </Typo>
            </View>

            {/* form */}

            <View style={styles.form}>
              <Typo size={16} color={colors.black} fontWeight={"400"}>
                Enter your email address
              </Typo>

              {/* input */}
              {/* input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Feather
                    name="mail"
                    size={20}
                    color={colors.neutral400}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Email address"
                    placeholderTextColor={colors.neutral400}
                    value={formData.email}
                    onChangeText={(value) => handleInputChange("email", value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <Button
                loading={isLoading}
                onPress={handleSubmit}
                style={styles.loginButton}
              >
                <Typo fontWeight={"700"} color="#ffffff" size={16}>
                  {isLoading ? "Sending..." : "Get OTP"}
                </Typo>
              </Button>
            </View>            
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default ResetPassword;

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
