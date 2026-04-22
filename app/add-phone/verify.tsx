import BackButton from "@/components/CustomBackButton";
import Button from "@/components/CustomButton";
import ScreenWrapper from "@/components/ScreenWrapper";
import { TextInput } from "@/components/TextInput";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuthStore } from "@/utils/authStore";
import { phoneService } from "@/utils/services/phoneService";
import { verticalScale } from "@/utils/styling";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
import { Text } from "@/components/Text";

const VerifyPhone = () => {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(React.ElementRef<typeof TextInput> | null)[]>([]);
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { updateUserData } = useAuthStore();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleCodeChange = (value: string, index: number) => {
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join("");

    if (verificationCode.length !== 6) {
      Alert.alert("Invalid Code", "Please enter the complete 6-digit verification code.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await phoneService.verifyPhone(verificationCode);
      if (response.success) {
        await updateUserData();
        router.replace("/(tabs)" as any);
      } else {
        const errorData = response.data;
        const errors = errorData?.errors;
        let msg = "Invalid verification code. Please try again.";
        if (errors && typeof errors === "object") {
          const messages = (Object.values(errors) as string[][]).flat();
          if (messages.length > 0) msg = messages.join("\n");
        } else if (errorData?.message) {
          msg = errorData.message;
        }
        Alert.alert("Verification Failed", msg);
      }
    } catch (error: any) {
      const errorData = error?.data;
      const errors = errorData?.errors;
      let msg = "An error occurred. Please try again.";
      if (errors && typeof errors === "object") {
        const messages = (Object.values(errors) as string[][]).flat();
        if (messages.length > 0) msg = messages.join("\n");
      } else if (errorData?.message) {
        msg = errorData.message;
      }
      Alert.alert("Verification Failed", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      const response = await phoneService.resendVerification(phone as string);
      if (response.success) {
        Alert.alert("Code Sent", "A new verification code has been sent to your phone.");
        setCountdown(60);
        setCanResend(false);
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        const errorData = response.data;
        let msg = "Could not resend verification code.";
        if (errorData?.message) msg = errorData.message;
        Alert.alert("Failed to Resend", msg);
      }
    } catch (error: any) {
      Alert.alert("Failed to Resend", "An error occurred. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const maskPhone = (phone: string) => {
    if (!phone) return "";
    if (phone.length <= 6) return phone;
    return phone.slice(0, 4) + "*".repeat(phone.length - 7) + phone.slice(-3);
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <BackButton iconSize={28} />

            {/* Header */}
            <View style={styles.headerContainer}>
              <Image
                source={require("@/assets/icons/ios-dark.png")}
                style={styles.appIcon}
              />
              <View style={styles.textContainer}>
                <Typo size={30} fontWeight={"800"} style={styles.title}>
                  Verify Phone Number
                </Typo>
                <Typo size={16} style={styles.subtitle}>
                  We've sent a 6-digit verification code to
                </Typo>
                <Typo size={16} fontWeight={"600"} style={styles.phoneText}>
                  {maskPhone(phone as string)}
                </Typo>
              </View>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.codeContainer}>
                <Typo
                  size={16}
                  color={colors.black}
                  fontWeight={"400"}
                  style={styles.codeLabel}
                >
                  Enter verification code
                </Typo>

                <View style={styles.codeInputContainer}>
                  {code.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      style={[
                        styles.codeInput,
                        digit ? styles.codeInputFilled : {},
                      ]}
                      value={digit}
                      onChangeText={(value) => handleCodeChange(value, index)}
                      onKeyPress={({ nativeEvent }) =>
                        handleKeyPress(nativeEvent.key, index)
                      }
                      keyboardType="numeric"
                      maxLength={1}
                      textAlign="center"
                      selectTextOnFocus
                      placeholderTextColor="#999"
                    />
                  ))}
                </View>
              </View>

              <Button
                loading={isLoading}
                onPress={handleVerify}
                style={styles.verifyButton}
              >
                <Typo fontWeight={"700"} color="#ffffff" size={16}>
                  {isLoading ? "Verifying..." : "Verify Code"}
                </Typo>
              </Button>

              <View style={styles.resendContainer}>
                <Typo size={15} style={styles.resendText}>
                  Didn't receive the code?
                </Typo>
                {canResend ? (
                  <Pressable onPress={handleResendCode} disabled={isResending}>
                    <Text
                      style={[
                        styles.resendLink,
                        { color: isResending ? "#999" : colors.primary },
                      ]}
                    >
                      {isResending ? "Sending..." : "Resend Code"}
                    </Text>
                  </Pressable>
                ) : (
                  <Typo size={15} style={styles.countdownText}>
                    Resend in {countdown}s
                  </Typo>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default VerifyPhone;

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    gap: spacingY._30,
    paddingHorizontal: spacingX._20,
  },
  headerContainer: {
    gap: 5,
    marginTop: spacingY._20,
    justifyContent: "center",
    alignContent: "center",
  },
  appIcon: {
    width: 100,
    height: 100,
    marginBottom: spacingY._20,
    borderRadius: 10,
    alignSelf: "center",
  },
  textContainer: {
    alignItems: "center",
    gap: 5,
  },
  title: {
    textAlign: "center",
    color: colors.black,
  },
  subtitle: {
    textAlign: "center",
    paddingVertical: spacingY._8,
    color: "#666",
    lineHeight: verticalScale(22),
  },
  phoneText: {
    color: colors.primary,
    textAlign: "center",
  },
  form: {
    gap: spacingY._16,
  },
  codeContainer: {
    marginBottom: spacingY._4,
  },
  codeLabel: {
    marginBottom: spacingY._16,
    alignSelf: "center",
  },
  codeInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacingX._8,
    maxWidth: 320,
    alignSelf: "center",
    width: "100%",
  },
  codeInput: {
    flex: 1,
    maxWidth: 45,
    height: verticalScale(52),
    marginHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#D9D9D9",
    borderRadius: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    backgroundColor: "#FFFFFF",
  },
  codeInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "10",
  },
  verifyButton: {
    backgroundColor: colors.black,
    borderRadius: 12,
    paddingVertical: spacingY._16,
    marginTop: spacingY._8,
  },
  resendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    marginTop: spacingY._16,
  },
  resendText: {
    color: colors.black,
    fontSize: verticalScale(15),
  },
  resendLink: {
    textDecorationLine: "underline",
    fontWeight: "600",
    fontSize: verticalScale(15),
  },
  countdownText: {
    color: "#999",
    fontSize: verticalScale(15),
  },
});
