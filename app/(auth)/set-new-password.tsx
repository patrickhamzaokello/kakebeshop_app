import BackButton from "@/components/CustomBackButton";
import Button from "@/components/CustomButton";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { AntDesign, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/utils/authStore";

const SetNewPassword = () => {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();
  const { uidb64, reset_token} = useLocalSearchParams();
  const { resetPasswordComplete } = useAuthStore();

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    const { password, confirmPassword } = formData;

    if (!password || !confirmPassword) {
      Alert.alert("Incomplete Form", "Fill all required inputs");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match");
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert(
        "Password Error",
        "Password must be at least 8 characters long"
      );
      return;
    }

    if (!reset_token || !uidb64) {
      Alert.alert(
        "Error",
        "Missing reset token. Please try the reset process again."
      );
      return;
    }

    setIsLoading(true);
    try {
      const res = await resetPasswordComplete(
        reset_token as string,
        uidb64 as string,
        password
      );

      if (res.success) {
        Alert.alert(
          "Password Reset Successful",
          "Your password has been reset successfully. Please login with your new password.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/(auth)/login"),
            },
          ]
        );
      } else {
        Alert.alert("Password Reset Failed", res.msg);
      }
    } catch (error) {
      Alert.alert(
        "Password Reset Failed",
        "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <BackButton iconSize={26} />

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
                Set New password
              </Typo>
              <Typo
                size={18}
                style={{
                  textAlign: "center",
                  color: "#666",
                  paddingBottom: 30
                }}
              >
                Please set a new password that you will use to login.
              </Typo>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Typo style={styles.inputLabel}>New Password</Typo>
                <View style={styles.inputWrapper}>
                  <Feather
                    name="lock"
                    size={20}
                    color="#9ca3af"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="New password"
                    placeholderTextColor="#9ca3af"
                    value={formData.password}
                    onChangeText={(value) =>
                      handleInputChange("password", value)
                    }
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Feather
                      name={showPassword ? "eye" : "eye-off"}
                      size={20}
                      color="#9ca3af"
                    />
                  </Pressable>
                </View>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Typo style={styles.inputLabel}>Confirm New Password</Typo>
                <View style={styles.inputWrapper}>
                  <Feather
                    name="lock"
                    size={20}
                    color="#9ca3af"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Confirm password"
                    placeholderTextColor="#9ca3af"
                    value={formData.confirmPassword}
                    onChangeText={(value) =>
                      handleInputChange("confirmPassword", value)
                    }
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Feather
                      name={showConfirmPassword ? "eye" : "eye-off"}
                      size={20}
                      color="#9ca3af"
                    />
                  </Pressable>
                </View>
              </View>

              {/* Submit Button */}
              <Button
                loading={isLoading}
                onPress={handleSubmit}
                style={styles.submitButton}
              >
                <Typo fontWeight={"600"} color={colors.white} size={16}>
                  Save new password
                </Typo>
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default SetNewPassword;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: spacingY._20,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._10,
  },
  appIcon: {
    width: 100,
    height: 100,
    marginBottom: spacingY._20,
    borderRadius: 10,
    justifyContent: "center",
    alignSelf: "center",
  },
  header: {
    marginTop: spacingY._20,
    marginBottom: spacingY._30,
    justifyContent: "center",
    alignItems: "center",
  },
  subtitle: {
    marginTop: spacingY._5,
  },
  socialContainer: {
    flexDirection: "row",
    gap: spacingX._12,
    marginBottom: spacingY._25,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.matteBlack,
    borderRadius: 10,
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._16,
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacingY._25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral300,
  },
  dividerText: {
    fontSize: 14,
    color: colors.neutral400,
    paddingHorizontal: spacingX._16,
  },
  form: {
    gap: spacingY._16,
  },
  inputContainer: {
    marginBottom: spacingY._4,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: "500",
    marginLeft: spacingX._4,
    paddingVertical: spacingY._10,
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
    color: colors.black,
    paddingVertical: spacingY._12,
  },
  eyeIcon: {
    padding: 4,
  },
  submitButton: {
    marginTop: spacingY._8,
    borderRadius: 10,
    minHeight: verticalScale(48),
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacingY._30,
  },
  footerText: {
    fontSize: 15,
    color: colors.text,
  },
  footerLink: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
    textDecorationLine: "underline",
  },
});
