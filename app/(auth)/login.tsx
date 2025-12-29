import Button from "@/components/CustomButton";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import SocialAuthButtons from "@/components/SocialAuthButtons";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { Feather } from "@expo/vector-icons";

import { useAuthStore } from "@/utils/authStore";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const router = useRouter();

  const { login: loginUser } = useAuthStore();

  // Reset loading states when screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      setIsGoogleLoading(false);
      setIsAppleLoading(false);
      setIsLoading(false);
    }, [])
  );

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const handleSubmit = async () => {
    const { email, password } = formData;

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert("Login Failed", "Email and Password is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert("Registration Failed", "Please enter a valid email address");
      return;
    }

    if (!validatePassword(trimmedPassword)) {
      Alert.alert(
        "Registration Failed",
        "Password must be at least 8 characters long"
      );
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginUser(trimmedEmail, trimmedPassword);
      if (!res.success) {
        if (res.msg?.includes("Email is not verified")) {
          router.replace({
            pathname: "/(auth)/start_email_verification",
            params: { email },
          });
        } else {
          Alert.alert("Login Failed", res.msg);
        }
      }
    } catch (error) {
      Alert.alert("Login Failed", "An error occurred. Please try again.");
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
    <ScreenWrapper style={styles.screenWrapper}>
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
            <View style={styles.welcomeSection}>
              <Image
                source={require("@/assets/icons/ios-dark.png")}
                style={{
                  width: 100,
                  height: 100,
                  marginBottom: spacingY._20,
                  borderRadius: 10,
                }}
              />
              <View style={styles.welcomeTextContainer}>
                <Typo size={32} fontWeight={"900"} color="#1a1a1a">
                  Login
                </Typo>
                <Typo size={16} color="#000" style={styles.subtitle}>
                  Please login to your account
                </Typo>
              </View>
            </View>

            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Typo style={styles.inputLabel}>Email Address</Typo>
                <View
                  style={[
                    styles.inputWrapper,
                    (focusedField === "email" || formData.email) &&
                      styles.inputFocused,
                  ]}
                >
                  <Feather
                    name="mail"
                    size={20}
                    color="#9ca3af"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your email"
                    placeholderTextColor="#9ca3af"
                    value={formData.email}
                    onChangeText={(value) => handleInputChange("email", value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Typo style={styles.inputLabel}>Password</Typo>
                <View
                  style={[
                    styles.inputWrapper,
                    (focusedField === "password" || formData.password) &&
                      styles.inputFocused,
                  ]}
                >
                  <Feather
                    name="lock"
                    size={20}
                    color="#9ca3af"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#9ca3af"
                    value={formData.password}
                    onChangeText={(value) =>
                      handleInputChange("password", value)
                    }
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
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

              <Pressable
                onPress={() => router.push("/(auth)/reset-password")}
                style={styles.forgotPasswordContainer}
              >
                <Typo style={styles.forgotPasswordText}>
                  Forgot your password?
                </Typo>
              </Pressable>

              <Button
                loading={isLoading}
                onPress={handleSubmit}
                style={styles.loginButton}
              >
                <Typo fontWeight={"700"} color="#ffffff" size={16}>
                  {isLoading ? "Signing in..." : "Login"}
                </Typo>
              </Button>
            </View>

            {/* Social Auth Buttons Component */}
            <SocialAuthButtons
              isGoogleLoading={isGoogleLoading}
              isAppleLoading={isAppleLoading}
              setIsGoogleLoading={setIsGoogleLoading}
              setIsAppleLoading={setIsAppleLoading}
              showSocialAuth={true}
            />

            {/* Footer */}
            <View style={styles.footer}>
              <Typo style={styles.footerText}>Don't have an account? </Typo>
              <Pressable onPress={() => router.push("/(auth)/register")}>
                <Typo style={styles.signUpText}>Sign up here</Typo>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default Login;

const styles = StyleSheet.create({
  screenWrapper: {
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: spacingY._20,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
  },
  inputFocused: {
    borderColor: colors.black,
    backgroundColor: colors.primary + "10",
  },
  header: {
    paddingTop: spacingY._16,
    paddingBottom: spacingY._8,
  },
  welcomeSection: {
    paddingVertical: spacingY._30,
    alignItems: "center",
  },
  welcomeTextContainer: {
    alignItems: "center",
    gap: spacingY._8,
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 22,
    fontWeight: 600,
    marginBottom: spacingY._20,
  },
  form: {
    gap: spacingY._20,
    paddingBottom: spacingY._16,
  },
  inputContainer: {
    gap: spacingY._8,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "500",
    marginLeft: spacingX._4,
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
    padding: spacingY._8,
  },
  forgotPasswordContainer: {
    alignSelf: "flex-end",
    paddingVertical: spacingY._4,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.black,
    textDecorationLine: "underline",
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
    paddingTop: spacingY._30,
    paddingBottom: spacingY._16,
  },
  footerText: {
    fontSize: 15,
    color: "#6b7280",
  },
  signUpText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.black,
    textDecorationLine: "underline",
  },
});
