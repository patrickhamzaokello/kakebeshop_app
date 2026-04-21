import { ThemeColors } from "@/constants/theme";
import { useThemeColors } from "@/contexts/ThemeContext";
import apiService from "@/utils/apiBase";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Text } from "@/components/Text";
import { TextInput } from "@/components/TextInput";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.88;

// ─── Style factories ──────────────────────────────────────────────────────────

const makeSheetStyles = (c: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.backdrop,
    },
    // Outer: only position + size. Animated with native driver (transform only).
    slideWrap: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: SHEET_HEIGHT,
    },
    // Inner: visual styling. Not animated — avoids native/JS driver conflict.
    container: {
      flex: 1,
      backgroundColor: c.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: "hidden",
    },
    handle: { alignItems: "center", paddingVertical: 12 },
    handleBar: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.gray300,
    },
  });

const makeSuccessStyles = (c: ThemeColors) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: c.backdrop,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 24,
      padding: 28,
      alignItems: "center",
      width: "100%",
    },
    iconBg: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    title: {
      fontSize: 22,
      fontWeight: "700",
      color: c.textPrimary,
      marginBottom: 12,
      textAlign: "center",
    },
    body: {
      fontSize: 15,
      color: c.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: 24,
    },
    bold: { fontWeight: "600", color: c.textPrimary },
    btn: {
      backgroundColor: c.primary,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 40,
    },
    btnText: { fontSize: 16, fontWeight: "700", color: c.white },
  });

const makeStepStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    circle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.gray200,
      borderWidth: 2,
      borderColor: c.gray300,
    },
    circleActive: { backgroundColor: c.primary, borderColor: c.primary },
    circleDone: { backgroundColor: c.success, borderColor: c.success },
    circleText: { fontSize: 11, fontWeight: "700", color: c.textMuted },
    circleTextActive: { color: c.white },
    line: { flex: 1, height: 2, backgroundColor: c.gray300, marginHorizontal: 4 },
    lineDone: { backgroundColor: c.success },
  });

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.backgroundSecondary },

    // Hero
    heroGradient: { flex: 1, minHeight: 260, maxHeight: 320 },
    backBtn: {
      margin: 16,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
    },
    heroContent: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      paddingBottom: 24,
    },
    heroBadge: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    heroTitle: {
      fontSize: 28,
      fontWeight: "700",
      color: c.white,
      textAlign: "center",
      marginBottom: 8,
    },
    heroSub: {
      fontSize: 15,
      color: "rgba(255,255,255,0.85)",
      textAlign: "center",
      lineHeight: 22,
    },

    // Perks
    perksCard: {
      margin: 16,
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 20,
      gap: 14,
    },
    perkRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    perkIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    perkText: { fontSize: 15, color: c.textPrimary, fontWeight: "500", flex: 1 },

    // Hero footer
    heroFooter: {
      padding: 20,
      paddingBottom: 24,
      alignItems: "center",
      gap: 10,
    },
    startBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.primary,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 32,
      gap: 8,
      width: "100%",
    },
    startBtnText: { fontSize: 17, fontWeight: "700", color: c.white },
    footerNote: { fontSize: 13, color: c.textMuted },

    // Sheet header
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    sheetTitle: { fontSize: 18, fontWeight: "700", color: c.textPrimary },
    sheetSub: { fontSize: 13, color: c.textMuted, marginTop: 2 },
    sheetClose: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.gray100,
      alignItems: "center",
      justifyContent: "center",
    },
    progressTrack: {
      height: 3,
      backgroundColor: c.gray200,
      marginHorizontal: 20,
      marginBottom: 20,
      borderRadius: 2,
      overflow: "hidden",
    },
    progressFill: { height: "100%", backgroundColor: c.primary, borderRadius: 2 },
    sheetBody: { paddingHorizontal: 20, paddingBottom: 12 },

    // Sheet footer
    sheetFooter: {
      borderTopWidth: 1,
      borderTopColor: c.border,
      backgroundColor: c.surface,
    },
    footerRow: {
      flexDirection: "row",
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 14,
      gap: 12,
    },
    backSheetBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: c.border,
      gap: 6,
      minWidth: 100,
    },
    backSheetBtnText: { fontSize: 15, fontWeight: "600", color: c.textSecondary },
    nextBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.primary,
      borderRadius: 12,
      paddingVertical: 16,
      gap: 8,
    },
    nextBtnDisabled: { opacity: 0.65 },
    nextBtnText: { fontSize: 17, fontWeight: "700", color: c.white },

    // Step header row
    stepHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 24,
      backgroundColor: c.backgroundSecondary,
      borderRadius: 12,
      padding: 14,
    },
    stepIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    stepIconSuccess: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.successLight,
      alignItems: "center",
      justifyContent: "center",
    },
    stepTitle: { fontSize: 16, fontWeight: "700", color: c.textPrimary },
    stepSub: { fontSize: 13, color: c.textMuted, marginTop: 2 },

    // Field
    fieldGroup: { marginBottom: 20 },
    labelRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 3 },
    label: { fontSize: 15, fontWeight: "600", color: c.textPrimary },
    required: { fontSize: 15, color: c.error, fontWeight: "700" },
    optional: { fontSize: 13, color: c.textMuted },
    input: {
      backgroundColor: c.surface,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 15,
      color: c.textPrimary,
      borderWidth: 1.5,
      borderColor: c.border,
    },
    inputError: { borderColor: c.error },
    textArea: { height: 110, paddingTop: 12, textAlignVertical: "top" as const },
    errorRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
    errorText: { fontSize: 13, color: c.error },
    helperText: { fontSize: 13, color: c.textMuted, marginTop: 6 },
    charCount: {
      fontSize: 11,
      color: c.textMuted,
      textAlign: "right" as const,
      marginTop: 4,
    },

    // Review
    reviewCard: { backgroundColor: c.backgroundSecondary, borderRadius: 14, padding: 16 },
    reviewCardTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: c.textPrimary,
      marginBottom: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    reviewRow: { marginBottom: 10 },
    reviewLabel: {
      fontSize: 11,
      color: c.textMuted,
      marginBottom: 2,
      textTransform: "uppercase" as const,
      letterSpacing: 0.5,
    },
    reviewValue: { fontSize: 15, color: c.textPrimary, lineHeight: 22 },

    // Notice
    noticeCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: c.warningLight,
      borderRadius: 12,
      padding: 14,
      marginTop: 16,
      gap: 10,
      borderLeftWidth: 3,
      borderLeftColor: c.warning,
    },
    noticeTitle: { fontSize: 13, fontWeight: "600", color: c.textPrimary, marginBottom: 3 },
    noticeText: { fontSize: 13, color: c.textSecondary, lineHeight: 20 },
  });

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  display_name: string;
  business_name: string;
  description: string;
  business_phone: string;
  business_email: string;
  location: string;
}

interface FormErrors {
  display_name?: string;
  business_name?: string;
  description?: string;
  business_phone?: string;
  business_email?: string;
  location?: string;
}

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────

function BottomSheet({
  visible,
  onClose,
  children,
  footer,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const colors = useThemeColors();
  const sheetStyles = useMemo(() => makeSheetStyles(colors), [colors]);

  // Native driver: transform only (slide in/out)
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  // JS driver: height only (keyboard spacer) — must be on a SEPARATE Animated.View
  const keyboardPad = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 180,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 260,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      Animated.timing(keyboardPad, {
        toValue: e.endCoordinates.height,
        duration: e.duration ?? 250,
        useNativeDriver: false,
      }).start();
    });
    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      Animated.timing(keyboardPad, {
        toValue: 0,
        duration: e.duration ?? 250,
        useNativeDriver: false,
      }).start();
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 8,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 120 || gs.vy > 0.5) {
          Keyboard.dismiss();
          onClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); onClose(); }}>
        <View style={sheetStyles.backdrop} />
      </TouchableWithoutFeedback>

      {/* Outer: transform animation only (native driver — no layout props here) */}
      <Animated.View style={[sheetStyles.slideWrap, { transform: [{ translateY }] }]}>
        {/* Inner: visual sheet styling (plain View — not animated) */}
        <View style={sheetStyles.container}>
          <View {...panResponder.panHandlers} style={sheetStyles.handle}>
            <View style={sheetStyles.handleBar} />
          </View>

          {/* Scroll content (flex: 1 — shrinks when spacer grows) */}
          {children}

          {/* Footer — always visible above keyboard */}
          {footer}

          {/* Keyboard spacer (JS driver, separate Animated.View from translateY) */}
          <Animated.View style={{ height: keyboardPad }} />
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── Success Modal ────────────────────────────────────────────────────────────

function SuccessModal({ visible, onDone }: { visible: boolean; onDone: () => void }) {
  const colors = useThemeColors();
  const s = useMemo(() => makeSuccessStyles(colors), [colors]);

  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 16,
          stiffness: 200,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={s.backdrop}>
        <Animated.View
          style={[s.card, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={s.iconBg}
          >
            <Ionicons name="checkmark" size={40} color={colors.white} />
          </LinearGradient>
          <Text style={s.title}>Application Submitted!</Text>
          <Text style={s.body}>
            Our team will review your merchant profile within{" "}
            <Text style={s.bold}>24–48 hours</Text>. You'll receive a
            notification once approved.
          </Text>
          <TouchableOpacity style={s.btn} onPress={onDone}>
            <Text style={s.btnText}>Got it</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  const colors = useThemeColors();
  const s = useMemo(() => makeStepStyles(colors), [colors]);

  return (
    <View style={s.row}>
      {Array.from({ length: total }).map((_, i) => {
        const done = i + 1 < current;
        const active = i + 1 === current;
        return (
          <React.Fragment key={i}>
            <View style={[s.circle, active && s.circleActive, done && s.circleDone]}>
              {done ? (
                <Ionicons name="checkmark" size={12} color={colors.white} />
              ) : (
                <Text style={[s.circleText, (active || done) && s.circleTextActive]}>
                  {i + 1}
                </Text>
              )}
            </View>
            {i < total - 1 && (
              <View style={[s.line, done && s.lineDone]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ─── Field (top-level — must NOT be defined inside a render function) ─────────

function Field({
  label,
  required,
  optional,
  error,
  helper,
  children,
  s,
  colors,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  helper?: string;
  children: React.ReactNode;
  s: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
}) {
  return (
    <View style={s.fieldGroup}>
      <View style={s.labelRow}>
        <Text style={s.label}>{label}</Text>
        {required && <Text style={s.required}>*</Text>}
        {optional && <Text style={s.optional}> (optional)</Text>}
      </View>
      {children}
      {error ? (
        <View style={s.errorRow}>
          <Ionicons name="alert-circle" size={13} color={colors.error} />
          <Text style={s.errorText}>{error}</Text>
        </View>
      ) : helper ? (
        <Text style={s.helperText}>{helper}</Text>
      ) : null}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BecomeMerchantScreen() {
  const colors = useThemeColors();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    display_name: "",
    business_name: "",
    description: "",
    business_phone: "",
    business_email: "",
    location: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const totalSteps = 3;

  const updateField = <K extends keyof FormData>(key: K, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validateStep = (step: number): boolean => {
    const e: FormErrors = {};
    if (step === 1) {
      if (!formData.display_name.trim()) e.display_name = "Display name is required";
      else if (formData.display_name.trim().length < 3) e.display_name = "Minimum 3 characters";
      if (!formData.business_name.trim()) e.business_name = "Business name is required";
      if (!formData.description.trim()) e.description = "Description is required";
      else if (formData.description.trim().length < 20) e.description = "Minimum 20 characters";
    }
    if (step === 2) {
      if (!formData.business_phone.trim()) e.business_phone = "Phone number is required";
      else if (!/^[0-9+\-\s()]{10,}$/.test(formData.business_phone))
        e.business_phone = "Enter a valid phone number";
      if (formData.business_email.trim()) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.business_email))
          e.business_email = "Enter a valid email address";
      }
      if (!formData.location.trim()) e.location = "Location is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      Keyboard.dismiss();
      setCurrentStep((n) => n + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((n) => n - 1);
    else setSheetVisible(false);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    setIsSubmitting(true);
    try {
      const response = await apiService.post(
        "/api/v1/merchants/create_profile/",
        {
          business_name: formData.business_name,
          display_name: formData.display_name,
          description: formData.description,
          business_phone: formData.business_phone,
          business_email: formData.business_email,
        },
        { headers: { "Content-Type": "application/json" } }
      );
      if (response.success) {
        setSheetVisible(false);
        setSuccessVisible(true);
      }
    } catch (error) {
      setErrors({
        display_name:
          error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openSheet = () => {
    setCurrentStep(1);
    setErrors({});
    setSheetVisible(true);
  };

  // ── Step 1 ──
  const renderStep1 = () => (
    <View>
      <View style={s.stepHeaderRow}>
        <View style={s.stepIcon}>
          <MaterialCommunityIcons name="store" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.stepTitle}>Business Information</Text>
          <Text style={s.stepSub}>Tell us about your business</Text>
        </View>
      </View>

      <Field s={s} colors={colors} label="Display Name" required error={errors.display_name} helper="Visible to customers on your store page">
        <TextInput
          style={[s.input, errors.display_name && s.inputError]}
          placeholder="e.g. Sarah's Boutique"
          placeholderTextColor={colors.textMuted}
          value={formData.display_name}
          onChangeText={(t) => updateField("display_name", t)}
        />
      </Field>

      <Field s={s} colors={colors} label="Business Name" required error={errors.business_name}>
        <TextInput
          style={[s.input, errors.business_name && s.inputError]}
          placeholder="Official registered name"
          placeholderTextColor={colors.textMuted}
          value={formData.business_name}
          onChangeText={(t) => updateField("business_name", t)}
        />
      </Field>

      <Field s={s} colors={colors} label="Business Description" required error={errors.description}>
        <TextInput
          style={[s.input, s.textArea, errors.description && s.inputError]}
          placeholder="Describe what you sell and what makes you unique…"
          placeholderTextColor={colors.textMuted}
          value={formData.description}
          onChangeText={(t) => updateField("description", t)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
        />
        <Text style={s.charCount}>{formData.description.length}/500</Text>
      </Field>
    </View>
  );

  // ── Step 2 ──
  const renderStep2 = () => (
    <View>
      <View style={s.stepHeaderRow}>
        <View style={s.stepIcon}>
          <Ionicons name="call" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.stepTitle}>Contact Information</Text>
          <Text style={s.stepSub}>How can customers reach you?</Text>
        </View>
      </View>

      <Field s={s} colors={colors} label="Business Phone" required error={errors.business_phone} helper="Will be visible to customers">
        <TextInput
          style={[s.input, errors.business_phone && s.inputError]}
          placeholder="+256 770 650 636"
          placeholderTextColor={colors.textMuted}
          value={formData.business_phone}
          onChangeText={(t) => updateField("business_phone", t)}
          keyboardType="phone-pad"
        />
      </Field>

      <Field s={s} colors={colors} label="Business Email" optional error={errors.business_email}>
        <TextInput
          style={[s.input, errors.business_email && s.inputError]}
          placeholder="business@example.com"
          placeholderTextColor={colors.textMuted}
          value={formData.business_email}
          onChangeText={(t) => updateField("business_email", t)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </Field>

      <Field s={s} colors={colors} label="Location" required error={errors.location} helper="Where are you primarily based?">
        <TextInput
          style={[s.input, errors.location && s.inputError]}
          placeholder="e.g. Kampala, Uganda"
          placeholderTextColor={colors.textMuted}
          value={formData.location}
          onChangeText={(t) => updateField("location", t)}
        />
      </Field>
    </View>
  );

  // ── Step 3 ──
  const ReviewRow = ({ label, value }: { label: string; value: string }) =>
    value ? (
      <View style={s.reviewRow}>
        <Text style={s.reviewLabel}>{label}</Text>
        <Text style={s.reviewValue}>{value}</Text>
      </View>
    ) : null;

  const renderStep3 = () => (
    <View>
      <View style={s.stepHeaderRow}>
        <View style={s.stepIconSuccess}>
          <Ionicons name="checkmark-circle" size={22} color={colors.success} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.stepTitle}>Review & Submit</Text>
          <Text style={s.stepSub}>Confirm your details before sending</Text>
        </View>
      </View>

      <View style={s.reviewCard}>
        <Text style={s.reviewCardTitle}>Business Details</Text>
        <ReviewRow label="Display Name" value={formData.display_name} />
        <ReviewRow label="Business Name" value={formData.business_name} />
        <ReviewRow label="Description" value={formData.description} />
      </View>

      <View style={[s.reviewCard, { marginTop: 12 }]}>
        <Text style={s.reviewCardTitle}>Contact Information</Text>
        <ReviewRow label="Phone" value={formData.business_phone} />
        <ReviewRow label="Email" value={formData.business_email} />
        <ReviewRow label="Location" value={formData.location} />
      </View>

      <View style={s.noticeCard}>
        <Ionicons name="time-outline" size={20} color={colors.warning} />
        <View style={{ flex: 1 }}>
          <Text style={s.noticeTitle}>Verification Required</Text>
          <Text style={s.noticeText}>
            Your profile will be reviewed within 24–48 hours. You'll receive a
            notification once approved.
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <>
      <StatusBar style="auto" />

      {/* ── Hero Landing Screen ── */}
      <View style={s.screen}>
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={s.heroGradient}
        >
          <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={colors.white} />
            </TouchableOpacity>
            <View style={s.heroContent}>
              <View style={s.heroBadge}>
                <MaterialCommunityIcons name="store-check" size={36} color={colors.white} />
              </View>
              <Text style={s.heroTitle}>Become a Seller</Text>
              <Text style={s.heroSub}>
                Join thousands of merchants already growing their business on KakebeShop
              </Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <View style={s.perksCard}>
          {[
            { icon: "people-outline", text: "Reach thousands of buyers" },
            { icon: "trending-up-outline", text: "Grow your sales effortlessly" },
            { icon: "shield-checkmark-outline", text: "Secure & trusted platform" },
          ].map(({ icon, text }) => (
            <View key={icon} style={s.perkRow}>
              <View style={s.perkIcon}>
                <Ionicons name={icon as any} size={18} color={colors.primary} />
              </View>
              <Text style={s.perkText}>{text}</Text>
            </View>
          ))}
        </View>

        <View style={s.heroFooter}>
          <TouchableOpacity style={s.startBtn} onPress={openSheet}>
            <Text style={s.startBtnText}>Start Application</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </TouchableOpacity>
          <Text style={s.footerNote}>Takes less than 3 minutes · Free to join</Text>
        </View>
      </View>

      {/* ── Form Bottom Sheet ── */}
      <BottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        footer={
          <View style={s.sheetFooter}>
            <SafeAreaView edges={["bottom"]}>
              <View style={s.footerRow}>
              <TouchableOpacity style={s.backSheetBtn} onPress={handleBack}>
                <Ionicons name="arrow-back" size={18} color={colors.textSecondary} />
                <Text style={s.backSheetBtnText}>
                  {currentStep === 1 ? "Cancel" : "Back"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.nextBtn, isSubmitting && s.nextBtnDisabled]}
                onPress={currentStep === totalSteps ? handleSubmit : handleNext}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <>
                    <Text style={s.nextBtnText}>
                      {currentStep === totalSteps ? "Submit" : "Continue"}
                    </Text>
                    <Ionicons
                      name={currentStep === totalSteps ? "checkmark" : "arrow-forward"}
                      size={18}
                      color={colors.white}
                    />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
        }
      >
        {/* Sheet header */}
        <View style={s.sheetHeader}>
          <View>
            <Text style={s.sheetTitle}>Merchant Application</Text>
            <Text style={s.sheetSub}>Step {currentStep} of {totalSteps}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setSheetVisible(false)}
            style={s.sheetClose}
          >
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={s.progressTrack}>
          <View
            style={[s.progressFill, { width: `${(currentStep / totalSteps) * 100}%` }]}
          />
        </View>

        <StepIndicator current={currentStep} total={totalSteps} />

        {/* Step content — flex:1 shrinks when keyboard spacer grows */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.sheetBody}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </ScrollView>
      </BottomSheet>

      {/* ── Success Modal ── */}
      <SuccessModal
        visible={successVisible}
        onDone={() => {
          setSuccessVisible(false);
          router.back();
        }}
      />
    </>
  );
}
