import Button from "@/components/CustomButton";
import ScreenWrapper from "@/components/ScreenWrapper";
import { TextInput } from "@/components/TextInput";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuthStore } from "@/utils/authStore";
import { phoneService } from "@/utils/services/phoneService";
import { verticalScale } from "@/utils/styling";
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
  View,
} from "react-native";

const AddPhone = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const router = useRouter();
  const { logout, completePhoneSubmission } = useAuthStore();

  const handleContinue = async () => {
    const trimmed = phoneNumber.trim();
    if (!trimmed) {
      Alert.alert("Phone Required", "Please enter your phone number.");
      return;
    }

    const fullNumber = `+256${trimmed}`;
    setIsLoading(true);
    try {
      const response = await phoneService.addPhone(fullNumber);
      const errorData = response.data;

      // Validation errors (bad format, already in use, etc.) — show and stay
      if (!response.success && errorData?.details) {
        const details = errorData.details;
        const messages = (Object.values(details) as string[][]).flat();
        Alert.alert("Invalid Phone Number", messages.join("\n"));
        return;
      }

      // Success or OTP-delivery failure — number was received; proceed to app
      // and let the user verify later from their profile settings
      await completePhoneSubmission();
      router.replace("/(tabs)" as any);
    } catch {
      Alert.alert("Error", "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to use a different account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/welcome");
          },
        },
      ]
    );
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
            {/* Header */}
            <View style={styles.headerContainer}>
              <Image
                source={require("@/assets/icons/ios-dark.png")}
                style={styles.appIcon}
              />
              <View style={styles.textContainer}>
                <Typo size={30} fontWeight={"800"} style={styles.title}>
                  Add Phone Number
                </Typo>
                <Typo size={16} style={styles.subtitle}>
                  Merchants need your phone number to contact you about orders
                  and deliveries.
                </Typo>
              </View>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Typo style={styles.inputLabel}>Phone Number</Typo>
                <View
                  style={[
                    styles.inputWrapper,
                    (isFocused || phoneNumber) && styles.inputFocused,
                  ]}
                >
                  <View style={styles.prefixContainer}>
                    <Typo style={styles.prefixText}>+256</Typo>
                    <View style={styles.prefixDivider} />
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="700 000 000"
                    placeholderTextColor={colors.neutral400}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    autoCorrect={false}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    maxLength={12}
                  />
                </View>
              </View>

              <Button
                loading={isLoading}
                onPress={handleContinue}
                style={styles.continueButton}
              >
                <Typo fontWeight={"600"} color={colors.white} size={16}>
                  Continue
                </Typo>
              </Button>
            </View>

            {/* Escape hatch */}
            <View style={styles.footer}>
              <Pressable onPress={handleLogout}>
                <Typo size={14} color={colors.neutral500} style={styles.logoutText}>
                  Use a different account
                </Typo>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default AddPhone;

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
  headerContainer: {
    marginTop: spacingY._30,
    marginBottom: spacingY._30,
    gap: spacingY._16,
  },
  appIcon: {
    width: 100,
    height: 100,
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: spacingY._8,
  },
  textContainer: {
    alignItems: "center",
    gap: spacingY._8,
  },
  title: {
    textAlign: "center",
    color: colors.black,
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
    lineHeight: verticalScale(22),
    paddingHorizontal: spacingX._8,
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
  inputFocused: {
    borderColor: colors.black,
    backgroundColor: colors.primary + "10",
  },
  prefixContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacingX._8,
  },
  prefixText: {
    fontSize: 16,
    color: colors.black,
    fontWeight: "600",
    marginRight: spacingX._8,
  },
  prefixDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#D9D9D9",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    paddingVertical: spacingY._4,
    paddingLeft: spacingX._8,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacingY._16,
    marginTop: spacingY._8,
  },
  footer: {
    alignItems: "center",
    marginTop: spacingY._30,
    paddingBottom: spacingY._16,
  },
  logoutText: {
    textDecorationLine: "underline",
  },
});
