import { Text } from "@/components/Text";
import { TextInput } from "@/components/TextInput";
import {
  ThemeColors,
  borderRadius,
  fontSize,
  fontWeight,
  layout,
  radius,
  shadow,
  spacingX,
  spacingY,
} from "@/constants/theme";
import { useThemeColors } from "@/contexts/ThemeContext";
import apiService from "@/utils/apiBase";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
    slideWrap: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: SHEET_HEIGHT,
    },
    container: {
      flex: 1,
      backgroundColor: c.surface,
      borderTopLeftRadius: borderRadius.xxl,
      borderTopRightRadius: borderRadius.xxl,
      overflow: "hidden",
    },
    handle: { alignItems: "center", paddingVertical: spacingY._12 },
    handleBar: {
      width: spacingX._40,
      height: spacingY._4,
      borderRadius: radius._3,
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
      padding: spacingX._24,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.xxl,
      padding: spacingX._24,
      alignItems: "center",
      width: "100%",
      ...shadow.lg,
    },
    iconBg: {
      width: layout.iconSize.xl * 2,
      height: layout.iconSize.xl * 2,
      borderRadius: layout.iconSize.xl,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacingY._20,
    },
    title: {
      fontSize: fontSize.xxl,
      fontWeight: fontWeight.bold,
      color: c.textPrimary,
      marginBottom: spacingY._12,
      textAlign: "center",
    },
    body: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.regular,
      color: c.textSecondary,
      textAlign: "center",
      lineHeight: fontSize.md * 1.6,
      marginBottom: spacingY._24,
    },
    bold: { fontWeight: fontWeight.semibold, color: c.textPrimary },
    btn: {
      backgroundColor: c.primary,
      borderRadius: borderRadius.sm,
      paddingVertical: spacingY._14,
      paddingHorizontal: spacingX._40,
      ...shadow.primary,
    },
    btnText: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: c.textInverse },
  });

const makeStepStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacingX._20,
      paddingBottom: spacingY._20,
    },
    circle: {
      width: spacingX._25,
      height: spacingX._25,
      borderRadius: radius._14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.backgroundTertiary,
      borderWidth: 2,
      borderColor: c.border,
    },
    circleActive: { backgroundColor: c.primary, borderColor: c.primary },
    circleDone: { backgroundColor: c.success, borderColor: c.success },
    circleText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: c.textMuted },
    circleTextActive: { color: c.textInverse },
    line: { flex: 1, height: 2, backgroundColor: c.border, marginHorizontal: spacingX._4 },
    lineDone: { backgroundColor: c.success },
  });

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },

    // Hero
    heroGradient: { flex: 1, minHeight: 260, maxHeight: 320 },
    backBtn: {
      margin: spacingX._16,
      width: layout.iconSize.xl + spacingX._8,
      height: layout.iconSize.xl + spacingX._8,
      borderRadius: radius._20,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
    },
    heroContent: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacingX._24,
      paddingBottom: spacingY._24,
    },
    heroBadge: {
      width: spacingX._40 + spacingX._32,
      height: spacingX._40 + spacingX._32,
      borderRadius: radius._30,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacingY._16,
    },
    heroTitle: {
      fontSize: fontSize.xxxl,
      fontWeight: fontWeight.bold,
      color: c.textInverse,
      textAlign: "center",
      marginBottom: spacingY._8,
    },
    heroSub: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.regular,
      color: "rgba(255,255,255,0.85)",
      textAlign: "center",
      lineHeight: fontSize.md * 1.6,
    },

    // Perks card
    perksCard: {
      marginHorizontal: spacingX._16,
      marginTop: spacingY._16,
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: spacingX._20,
      gap: spacingY._16,
      borderWidth: 1,
      borderColor: c.border,
      ...shadow.card,
    },
    perkRow: { flexDirection: "row", alignItems: "center", gap: spacingX._12 },
    perkIcon: {
      width: spacingX._35,
      height: spacingX._35,
      borderRadius: radius._17,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    perkText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.medium,
      color: c.textPrimary,
      flex: 1,
    },

    // Hero footer
    heroFooter: {
      paddingHorizontal: spacingX._16,
      paddingTop: spacingY._16,
      paddingBottom: spacingY._24,
      alignItems: "center",
      gap: spacingY._10,
    },
    startBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.primary,
      borderRadius: borderRadius.sm,
      height: layout.buttonHeight,
      paddingHorizontal: spacingX._32,
      gap: spacingX._8,
      width: "100%",
      ...shadow.primary,
    },
    startBtnText: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: c.textInverse },
    footerNote: { fontSize: fontSize.sm, fontWeight: fontWeight.regular, color: c.textMuted },

    // Sheet header
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacingX._20,
      paddingBottom: spacingY._12,
    },
    sheetTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: c.textPrimary },
    sheetSub: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.regular,
      color: c.textMuted,
      marginTop: spacingY._2,
    },
    sheetClose: {
      width: spacingX._32,
      height: spacingX._32,
      borderRadius: radius._16,
      backgroundColor: c.backgroundSecondary,
      alignItems: "center",
      justifyContent: "center",
    },
    progressTrack: {
      height: spacingY._4,
      backgroundColor: c.backgroundTertiary,
      marginHorizontal: spacingX._20,
      marginBottom: spacingY._20,
      borderRadius: radius._3,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: c.primary,
      borderRadius: radius._3,
    },
    sheetBody: {
      paddingHorizontal: spacingX._20,
      paddingBottom: spacingY._12,
    },

    // Sheet footer
    sheetFooter: {
      borderTopWidth: 1,
      borderTopColor: c.separator,
      backgroundColor: c.surface,
    },
    footerRow: {
      flexDirection: "row",
      paddingHorizontal: spacingX._16,
      paddingTop: spacingY._12,
      paddingBottom: spacingY._12,
      gap: spacingX._10,
    },
    backSheetBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: borderRadius.sm,
      height: layout.buttonHeight,
      paddingHorizontal: spacingX._16,
      borderWidth: 1.5,
      borderColor: c.primary,
      gap: spacingX._6,
      minWidth: 100,
    },
    backSheetBtnText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: c.primary,
    },
    nextBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.primary,
      borderRadius: borderRadius.sm,
      height: layout.buttonHeight,
      gap: spacingX._8,
      ...shadow.primary,
    },
    nextBtnDisabled: { opacity: 0.6 },
    nextBtnText: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: c.textInverse },

    // Step header row
    stepHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacingX._12,
      marginBottom: spacingY._24,
      backgroundColor: c.backgroundSecondary,
      borderRadius: borderRadius.md,
      padding: spacingX._12,
    },
    stepIcon: {
      width: layout.iconSize.xl + spacingX._12,
      height: layout.iconSize.xl + spacingX._12,
      borderRadius: radius._20,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    stepIconSuccess: {
      width: layout.iconSize.xl + spacingX._12,
      height: layout.iconSize.xl + spacingX._12,
      borderRadius: radius._20,
      backgroundColor: c.successLight,
      alignItems: "center",
      justifyContent: "center",
    },
    stepTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: c.textPrimary },
    stepSub: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.regular,
      color: c.textMuted,
      marginTop: spacingY._2,
    },

    // Field
    fieldGroup: { marginBottom: spacingY._20 },
    labelRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacingY._8,
      gap: spacingX._3,
    },
    label: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: c.textPrimary },
    required: { fontSize: fontSize.md, color: c.error, fontWeight: fontWeight.bold },
    optional: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.regular,
      color: c.textMuted,
    },
    input: {
      backgroundColor: c.inputBackground,
      borderRadius: borderRadius.sm,
      paddingHorizontal: spacingX._16,
      paddingVertical: spacingY._14,
      fontSize: fontSize.md,
      fontWeight: fontWeight.regular,
      color: c.textPrimary,
      borderWidth: 1.5,
      borderColor: c.inputBorder,
      height: layout.inputHeight,
    },
    inputError: { borderColor: c.error, borderWidth: 1.5 },
    textArea: {
      height: spacingY._80 + spacingY._30,
      paddingTop: spacingY._12,
      textAlignVertical: "top" as const,
    },
    errorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacingX._4,
      marginTop: spacingY._6,
    },
    errorText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.regular,
      color: c.error,
    },
    helperText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.regular,
      color: c.textMuted,
      marginTop: spacingY._6,
    },
    charCount: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.regular,
      color: c.textMuted,
      textAlign: "right" as const,
      marginTop: spacingY._4,
    },

    // Review
    reviewCard: {
      backgroundColor: c.backgroundSecondary,
      borderRadius: borderRadius.md,
      padding: spacingX._16,
      borderWidth: 1,
      borderColor: c.border,
    },
    reviewCardTitle: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold,
      color: c.textPrimary,
      marginBottom: spacingY._12,
      paddingBottom: spacingY._8,
      borderBottomWidth: 1,
      borderBottomColor: c.divider,
    },
    reviewRow: { marginBottom: spacingY._10 },
    reviewLabel: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.medium,
      color: c.textMuted,
      marginBottom: spacingY._2,
      textTransform: "uppercase" as const,
      letterSpacing: 0.6,
    },
    reviewValue: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.regular,
      color: c.textPrimary,
      lineHeight: fontSize.md * 1.5,
    },

    // Notice
    noticeCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: c.warningLight,
      borderRadius: borderRadius.md,
      padding: spacingX._12,
      marginTop: spacingY._16,
      gap: spacingX._10,
      borderLeftWidth: 3,
      borderLeftColor: c.warning,
    },
    noticeTitle: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: c.textPrimary,
      marginBottom: spacingY._3,
    },
    noticeText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.regular,
      color: c.textSecondary,
      lineHeight: fontSize.sm * 1.6,
    },
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
          <Ionicons name="call" size={22} color={colors.textInverse} />
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
                <Ionicons name={icon as any} size={18} color={colors.textInverse} />
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
                <Ionicons name="arrow-back" size={18} color={colors.primary} />
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
            <Ionicons name="close" size={20} color={colors.primary} />
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
