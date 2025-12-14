import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  Image,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native";
import React, { useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import SocialAuthButtons from "@/components/SocialAuthButtons";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import BackButton from "@/components/CustomBackButton";
import Button from "@/components/CustomButton";
import { useRouter } from "expo-router";
import { AntDesign, Feather } from "@expo/vector-icons";
import { useAuthStore } from "@/utils/authStore";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const router = useRouter();
  const { register: registerUser } = useAuthStore();

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

  const validateFullName = (name: string): boolean => {
    // Trim leading/trailing spaces
    const trimmed = name.trim();
    
    // Allow letters, spaces, hyphens, and apostrophes only
    const validChars = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(trimmed);
  
    // Ensure reasonable length
    const validLength = trimmed.length >= 3 && trimmed.length <= 50;
  
    return validChars && validLength;
  };
  

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    const { name, email, password, confirmPassword } = formData;

    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Registration Failed", "Please fill all the fields");
      return;
    }

    if (!validateFullName(name)) {
      Alert.alert(
        "Registration Failed",
        "Invalid name. Please enter a valid full name."
      );
      return;
    }

    const trimedEmail = email.trim();
    const trimedName = name.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();
    
    if (trimmedPassword !== trimmedConfirmPassword) {
      Alert.alert("Registration Failed", "Passwords do not match");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimedEmail)) {
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
      const res = await registerUser(trimedEmail, trimmedPassword, trimedName);

      if (res.success) {
        router.push({
          pathname: "/(auth)/verify_new_account_email",
          params: { email: trimedEmail },
        });
      } else {
        Alert.alert("Registration Failed", res.msg);
      }
    } catch (error) {
      Alert.alert(
        "Registration Failed",
        "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
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
            <BackButton iconSize={26} />

            {/* Header */}
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
                  Create an account
                </Typo>
                <Typo size={16} color="#000" style={styles.subtitle}>
                  Use your email and password to create a new account
                </Typo>
              </View>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Username Input */}
              <View style={styles.inputContainer}>
                <Typo style={styles.inputLabel}>Name</Typo>
                <View
                  style={[
                    styles.inputWrapper,
                    (focusedField === "name" || formData.name) &&
                      styles.inputFocused,
                  ]}
                >
                  <AntDesign
                    name="user"
                    size={20}
                    color={colors.neutral400}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="First and Last name"
                    placeholderTextColor={colors.neutral400}
                    value={formData.name}
                    onChangeText={(value) =>
                      handleInputChange("name", value)
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

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

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
              <Typo style={styles.inputLabel}>Confirm Password</Typo>
                <View
                  style={[
                    styles.inputWrapper,
                    (focusedField === "confirmPassword" || formData.confirmPassword) &&
                      styles.inputFocused,
                  ]}
                >
                  <Feather
                    name="lock"
                    size={20}
                    color={colors.neutral400}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Confirm password"
                    placeholderTextColor={colors.neutral400}
                    value={formData.confirmPassword}
                    onChangeText={(value) =>
                      handleInputChange("confirmPassword", value)
                    }
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    onFocus={() => setFocusedField("confirmPassword")}
                    onBlur={() => setFocusedField(null)}
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Feather
                      name={showConfirmPassword ? "eye" : "eye-off"}
                      size={20}
                      color={colors.neutral400}
                    />
                  </Pressable>
                </View>
              </View>

              {/* Submit Button */}
              <Button
                loading={isLoading}
                onPress={handleSubmit}
                style={styles.loginButton}
              >
                <Typo fontWeight={"600"} color={colors.white} size={16}>
                  Create Account
                </Typo>
              </Button>
            </View>

            {/* Social Auth Buttons Component */}
            <SocialAuthButtons
              isGoogleLoading={isGoogleLoading}
              isAppleLoading={isAppleLoading}
              setIsGoogleLoading={setIsGoogleLoading}
              setIsAppleLoading={setIsAppleLoading}
              showSocialAuth={false}
            />

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Pressable onPress={() => router.replace("/(auth)/login")}>
                <Typo style={styles.signUpText}>login with password</Typo>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default Register;

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
  },
  welcomeTextContainer: {
    gap: spacingY._8,
  },
  subtitle: {
    lineHeight: 22,
    fontWeight: 600,
    marginBottom: spacingY._20,
  },
  form: {
    gap: spacingY._20,
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