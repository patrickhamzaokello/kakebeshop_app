import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Text } from "@/components/Text";
import { TextInput } from "@/components/TextInput";
import {
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  PanResponder,
  Platform,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useScrollToTop } from "@react-navigation/native";
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
import apiService from "@/utils/apiBase";
import { UserProfile } from "@/utils/types/models";
import { useTheme, useThemeColors } from "@/contexts/ThemeContext";
import { merchantBase } from "@/utils/services/merchantService";

// ─── Types ────────────────────────────────────────────────────────────────────

type AppState =
  | "no_application"
  | "pending"
  | "rejected"
  | "suspended"
  | "banned"
  | "unverified"
  | "active";

type MerchantSnapshot = NonNullable<UserProfile["merchant"]>;

// ─── Status config ────────────────────────────────────────────────────────────

type StatusConfig = {
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  bgColor: string;
  title: string;
  message: string;
  canCancel: boolean;
  canReapply: boolean;
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: {
    iconName: "time-outline",
    color: "#F59E0B",
    bgColor: "#FEF3C7",
    title: "Application Under Review",
    message:
      "Your seller application is being reviewed by our team. This typically takes 24–48 hours.",
    canCancel: true,
    canReapply: false,
  },
  rejected: {
    iconName: "close-circle-outline",
    color: "#EF4444",
    bgColor: "#FEE2E2",
    title: "Application Not Approved",
    message:
      "Your application wasn't approved this time. Review your details and try applying again.",
    canCancel: false,
    canReapply: true,
  },
  suspended: {
    iconName: "warning-outline",
    color: "#F97316",
    bgColor: "#FFEDD5",
    title: "Account Suspended",
    message:
      "Your seller account has been temporarily suspended. Contact support for more information.",
    canCancel: false,
    canReapply: false,
  },
  banned: {
    iconName: "remove-circle-outline",
    color: "#DC2626",
    bgColor: "#FEE2E2",
    title: "Account Banned",
    message:
      "Your seller account has been permanently banned. Contact support if you believe this is an error.",
    canCancel: false,
    canReapply: false,
  },
  unverified: {
    iconName: "shield-outline",
    color: "#6366F1",
    bgColor: "#EEF2FF",
    title: "Verification Pending",
    message:
      "Your account is active but has not been verified yet. Our team will complete verification shortly before you can start selling.",
    canCancel: false,
    canReapply: false,
  },
};

// ─── Merchant application form ────────────────────────────────────────────────

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.88;

interface MerchantFormData {
  display_name: string;
  business_name: string;
  description: string;
  business_phone: string;
  business_email: string;
  location: string;
}

interface MerchantFormErrors {
  display_name?: string;
  business_name?: string;
  description?: string;
  business_phone?: string;
  business_email?: string;
  location?: string;
}

const makeSheetStyles = (c: ThemeColors) =>
  StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: c.backdrop },
    slideWrap: { position: "absolute", bottom: 0, left: 0, right: 0, height: SHEET_HEIGHT },
    container: {
      flex: 1,
      backgroundColor: c.surface,
      borderTopLeftRadius: borderRadius.xxl,
      borderTopRightRadius: borderRadius.xxl,
      overflow: "hidden",
    },
    handle: { alignItems: "center", paddingVertical: spacingY._12 },
    handleBar: { width: spacingX._40, height: spacingY._4, borderRadius: radius._3, backgroundColor: c.gray300 },
  });

const makeSuccessStyles = (c: ThemeColors) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: c.backdrop, alignItems: "center", justifyContent: "center", padding: spacingX._24 },
    card: { backgroundColor: c.surface, borderRadius: borderRadius.xxl, padding: spacingX._24, alignItems: "center", width: "100%", ...shadow.lg },
    iconBg: { width: layout.iconSize.xl * 2, height: layout.iconSize.xl * 2, borderRadius: layout.iconSize.xl, alignItems: "center", justifyContent: "center", marginBottom: spacingY._20 },
    title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: c.textPrimary, marginBottom: spacingY._12, textAlign: "center" },
    body: { fontSize: fontSize.md, color: c.textSecondary, textAlign: "center", lineHeight: fontSize.md * 1.6, marginBottom: spacingY._24 },
    bold: { fontWeight: fontWeight.semibold, color: c.textPrimary },
    btn: { backgroundColor: c.primary, borderRadius: borderRadius.sm, paddingVertical: spacingY._14, paddingHorizontal: spacingX._40, ...shadow.primary },
    btnText: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: c.textInverse },
  });

const makeStepStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: spacingX._20, paddingBottom: spacingY._20 },
    circle: { width: spacingX._25, height: spacingX._25, borderRadius: radius._14, alignItems: "center", justifyContent: "center", backgroundColor: c.backgroundTertiary, borderWidth: 2, borderColor: c.border },
    circleActive: { backgroundColor: c.primary, borderColor: c.primary },
    circleDone: { backgroundColor: c.success, borderColor: c.success },
    circleText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: c.textMuted },
    circleTextActive: { color: c.textInverse },
    line: { flex: 1, height: 2, backgroundColor: c.border, marginHorizontal: spacingX._4 },
    lineDone: { backgroundColor: c.success },
  });

const makeFormStyles = (c: ThemeColors) =>
  StyleSheet.create({
    sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacingX._20, paddingBottom: spacingY._12 },
    sheetTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: c.textPrimary },
    sheetSub: { fontSize: fontSize.sm, color: c.textMuted, marginTop: spacingY._2 },
    sheetClose: { width: spacingX._32, height: spacingX._32, borderRadius: radius._16, backgroundColor: c.backgroundSecondary, alignItems: "center", justifyContent: "center" },
    progressTrack: { height: spacingY._4, backgroundColor: c.backgroundTertiary, marginHorizontal: spacingX._20, marginBottom: spacingY._20, borderRadius: radius._3, overflow: "hidden" },
    progressFill: { height: "100%", backgroundColor: c.primary, borderRadius: radius._3 },
    sheetBody: { paddingHorizontal: spacingX._20, paddingBottom: spacingY._12 },
    sheetFooter: { borderTopWidth: 1, borderTopColor: c.separator, backgroundColor: c.surface },
    footerRow: { flexDirection: "row", paddingHorizontal: spacingX._16, paddingTop: spacingY._12, paddingBottom: spacingY._12, gap: spacingX._10 },
    backSheetBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: borderRadius.sm, height: layout.buttonHeight, paddingHorizontal: spacingX._16, borderWidth: 1.5, borderColor: c.border, gap: spacingX._6, minWidth: 100 },
    backSheetBtnText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: c.textSecondary },
    nextBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: c.primary, borderRadius: borderRadius.sm, height: layout.buttonHeight, gap: spacingX._8, ...shadow.primary },
    nextBtnDisabled: { opacity: 0.6 },
    nextBtnText: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: c.textInverse },
    stepHeaderRow: { flexDirection: "row", alignItems: "center", gap: spacingX._12, marginBottom: spacingY._24, backgroundColor: c.backgroundSecondary, borderRadius: borderRadius.md, padding: spacingX._12 },
    stepIcon: { width: layout.iconSize.xl + spacingX._12, height: layout.iconSize.xl + spacingX._12, borderRadius: radius._20, backgroundColor: c.textPrimary, alignItems: "center", justifyContent: "center" },
    stepIconSuccess: { width: layout.iconSize.xl + spacingX._12, height: layout.iconSize.xl + spacingX._12, borderRadius: radius._20, backgroundColor: c.successLight, alignItems: "center", justifyContent: "center" },
    stepTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: c.textPrimary },
    stepSub: { fontSize: fontSize.sm, color: c.textMuted, marginTop: spacingY._2 },
    fieldGroup: { marginBottom: spacingY._20 },
    labelRow: { flexDirection: "row", alignItems: "center", marginBottom: spacingY._8, gap: spacingX._3 },
    label: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: c.textPrimary },
    required: { fontSize: fontSize.md, color: c.error, fontWeight: fontWeight.bold },
    optional: { fontSize: fontSize.sm, color: c.textMuted },
    input: { backgroundColor: c.inputBackground, borderRadius: borderRadius.sm, paddingHorizontal: spacingX._16, paddingVertical: spacingY._14, fontSize: fontSize.md, color: c.textPrimary, borderWidth: 1.5, borderColor: c.inputBorder, height: layout.inputHeight },
    inputError: { borderColor: c.error, borderWidth: 1.5 },
    textArea: { height: spacingY._80 + spacingY._30, paddingTop: spacingY._12, textAlignVertical: "top" as const },
    errorRow: { flexDirection: "row", alignItems: "center", gap: spacingX._4, marginTop: spacingY._6 },
    errorText: { fontSize: fontSize.sm, color: c.error },
    helperText: { fontSize: fontSize.sm, color: c.textMuted, marginTop: spacingY._6 },
    charCount: { fontSize: fontSize.xs, color: c.textMuted, textAlign: "right" as const, marginTop: spacingY._4 },
    reviewCard: { backgroundColor: c.backgroundSecondary, borderRadius: borderRadius.md, padding: spacingX._16, borderWidth: 1, borderColor: c.border },
    reviewCardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: c.textPrimary, marginBottom: spacingY._12, paddingBottom: spacingY._8, borderBottomWidth: 1, borderBottomColor: c.divider },
    reviewRow: { marginBottom: spacingY._10 },
    reviewLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: c.textMuted, marginBottom: spacingY._2, textTransform: "uppercase" as const, letterSpacing: 0.6 },
    reviewValue: { fontSize: fontSize.md, color: c.textPrimary, lineHeight: fontSize.md * 1.5 },
    noticeCard: { flexDirection: "row", alignItems: "flex-start", backgroundColor: c.warningLight, borderRadius: borderRadius.md, padding: spacingX._12, marginTop: spacingY._16, gap: spacingX._10, borderLeftWidth: 3, borderLeftColor: c.warning },
    noticeTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: c.textPrimary, marginBottom: spacingY._3 },
    noticeText: { fontSize: fontSize.sm, color: c.textSecondary, lineHeight: fontSize.sm * 1.6 },
  });

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────

function MerchantBottomSheet({
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

  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const keyboardPad = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      keyboardPad.setValue(0);
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 180 }).start();
    } else {
      Animated.timing(translateY, { toValue: SHEET_HEIGHT, duration: 260, useNativeDriver: true }).start();
    }
  }, [visible]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (e) => {
      Animated.timing(keyboardPad, { toValue: e.endCoordinates.height, duration: e.duration ?? 250, useNativeDriver: false }).start();
    });
    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      Animated.timing(keyboardPad, { toValue: 0, duration: e.duration ?? 250, useNativeDriver: false }).start();
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 8,
      onPanResponderMove: (_, gs) => { if (gs.dy > 0) translateY.setValue(gs.dy); },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 120 || gs.vy > 0.5) { Keyboard.dismiss(); onClose(); }
        else { Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 20 }).start(); }
      },
    })
  ).current;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); onClose(); }}>
        <View style={sheetStyles.backdrop} />
      </TouchableWithoutFeedback>
      <Animated.View style={[sheetStyles.slideWrap, { transform: [{ translateY }] }]}>
        <View style={sheetStyles.container}>
          <View {...panResponder.panHandlers} style={sheetStyles.handle}>
            <View style={sheetStyles.handleBar} />
          </View>
          {children}
          {footer}
          <Animated.View style={{ height: keyboardPad }} />
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── Success Modal ────────────────────────────────────────────────────────────

function MerchantSuccessModal({ visible, onDone }: { visible: boolean; onDone: () => void }) {
  const colors = useThemeColors();
  const s = useMemo(() => makeSuccessStyles(colors), [colors]);

  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 16, stiffness: 200 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={s.backdrop}>
        <Animated.View style={[s.card, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={s.iconBg}>
            <Ionicons name="checkmark" size={40} color={colors.white} />
          </LinearGradient>
          <Text style={s.title}>Application Submitted!</Text>
          <Text style={s.body}>
            Our team will review your merchant profile within{" "}
            <Text style={s.bold}>24–48 hours</Text>. You'll receive a notification once approved.
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

function MerchantStepIndicator({ current, total }: { current: number; total: number }) {
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
                <Text style={[s.circleText, (active || done) && s.circleTextActive]}>{i + 1}</Text>
              )}
            </View>
            {i < total - 1 && <View style={[s.line, done && s.lineDone]} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ─── Form Field ───────────────────────────────────────────────────────────────

function FormField({
  label, required, optional, error, helper, children, s, colors,
}: {
  label: string; required?: boolean; optional?: boolean;
  error?: string; helper?: string; children: React.ReactNode;
  s: ReturnType<typeof makeFormStyles>; colors: ThemeColors;
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

// ─── Merchant Application Sheet ───────────────────────────────────────────────

function MerchantApplicationSheet({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const colors = useThemeColors();
  const s = useMemo(() => makeFormStyles(colors), [colors]);

  const [successVisible, setSuccessVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<MerchantFormData>({
    display_name: "", business_name: "", description: "",
    business_phone: "", business_email: "", location: "",
  });
  const [errors, setErrors] = useState<MerchantFormErrors>({});
  const totalSteps = 3;

  useEffect(() => {
    if (visible) {
      setCurrentStep(1);
      setErrors({});
    }
  }, [visible]);

  const updateField = <K extends keyof MerchantFormData>(key: K, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof MerchantFormErrors]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validateStep = (step: number): boolean => {
    const e: MerchantFormErrors = {};
    if (step === 1) {
      if (!formData.display_name.trim()) e.display_name = "Display name is required";
      else if (formData.display_name.trim().length < 3) e.display_name = "Minimum 3 characters";
      if (!formData.business_name.trim()) e.business_name = "Business name is required";
      if (!formData.description.trim()) e.description = "Description is required";
      else if (formData.description.trim().length < 20) e.description = "Minimum 20 characters";
    }
    if (step === 2) {
      if (!formData.business_phone.trim()) e.business_phone = "Phone number is required";
      else if (!/^[0-9+\-\s()]{10,}$/.test(formData.business_phone)) e.business_phone = "Enter a valid phone number";
      if (formData.business_email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.business_email)) e.business_email = "Enter a valid email address";
      if (!formData.location.trim()) e.location = "Location is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) { Keyboard.dismiss(); setCurrentStep((n) => n + 1); }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((n) => n - 1);
    else { Keyboard.dismiss(); onClose(); }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    setIsSubmitting(true);
    try {
      const response = await apiService.post("/api/v1/merchants/create_profile/", {
        business_name: formData.business_name,
        display_name: formData.display_name,
        description: formData.description,
        business_phone: formData.business_phone,
        business_email: formData.business_email,
      }, { headers: { "Content-Type": "application/json" } });
      if (response.success) { onClose(); setSuccessVisible(true); }
    } catch (error) {
      setErrors({ display_name: error instanceof Error ? error.message : "Something went wrong." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const ReviewRow = ({ label, value }: { label: string; value: string }) =>
    value ? (
      <View style={s.reviewRow}>
        <Text style={s.reviewLabel}>{label}</Text>
        <Text style={s.reviewValue}>{value}</Text>
      </View>
    ) : null;

  const renderStep1 = () => (
    <View>
      <FormField s={s} colors={colors} label="Display Name" required error={errors.display_name} helper="Visible to customers on your store page">
        <TextInput style={[s.input, errors.display_name && s.inputError]} placeholder="e.g. Sarah's Boutique" placeholderTextColor={colors.textMuted} value={formData.display_name} onChangeText={(t) => updateField("display_name", t)} />
      </FormField>
      <FormField s={s} colors={colors} label="Business Name" required error={errors.business_name}>
        <TextInput style={[s.input, errors.business_name && s.inputError]} placeholder="Official registered name" placeholderTextColor={colors.textMuted} value={formData.business_name} onChangeText={(t) => updateField("business_name", t)} />
      </FormField>
      <FormField s={s} colors={colors} label="Business Description" required error={errors.description}>
        <TextInput style={[s.input, s.textArea, errors.description && s.inputError]} placeholder="Describe what you sell and what makes you unique…" placeholderTextColor={colors.textMuted} value={formData.description} onChangeText={(t) => updateField("description", t)} multiline numberOfLines={4} textAlignVertical="top" maxLength={500} />
        <Text style={s.charCount}>{formData.description.length}/500</Text>
      </FormField>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <View style={s.stepHeaderRow}>
        <View style={s.stepIcon}><Ionicons name="call" size={22} color={colors.textInverse} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.stepTitle}>Contact Information</Text>
          <Text style={s.stepSub}>How can customers reach you?</Text>
        </View>
      </View>
      <FormField s={s} colors={colors} label="Business Phone" required error={errors.business_phone} helper="Will be visible to customers">
        <TextInput style={[s.input, errors.business_phone && s.inputError]} placeholder="+256 770 650 636" placeholderTextColor={colors.textMuted} value={formData.business_phone} onChangeText={(t) => updateField("business_phone", t)} keyboardType="phone-pad" />
      </FormField>
      <FormField s={s} colors={colors} label="Business Email" optional error={errors.business_email}>
        <TextInput style={[s.input, errors.business_email && s.inputError]} placeholder="business@example.com" placeholderTextColor={colors.textMuted} value={formData.business_email} onChangeText={(t) => updateField("business_email", t)} keyboardType="email-address" autoCapitalize="none" />
      </FormField>
      <FormField s={s} colors={colors} label="Location" required error={errors.location} helper="Where are you primarily based?">
        <TextInput style={[s.input, errors.location && s.inputError]} placeholder="e.g. Kampala, Uganda" placeholderTextColor={colors.textMuted} value={formData.location} onChangeText={(t) => updateField("location", t)} />
      </FormField>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <View style={s.stepHeaderRow}>
        <View style={s.stepIconSuccess}><Ionicons name="checkmark-circle" size={22} color={colors.success} /></View>
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
          <Text style={s.noticeText}>Your profile will be reviewed within 24–48 hours. You'll receive a notification once approved.</Text>
        </View>
      </View>
    </View>
  );

  return (
    <>
      <MerchantBottomSheet
        visible={visible}
        onClose={onClose}
        footer={
          <View style={s.sheetFooter}>
            <SafeAreaView edges={["bottom"]}>
              <View style={s.footerRow}>
                <TouchableOpacity style={s.backSheetBtn} onPress={handleBack}>
                  <Ionicons name="arrow-back" size={18} color={colors.textSecondary} />
                  <Text style={s.backSheetBtnText}>{currentStep === 1 ? "Cancel" : "Back"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.nextBtn, isSubmitting && s.nextBtnDisabled]} onPress={currentStep === totalSteps ? handleSubmit : handleNext} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <>
                      <Text style={s.nextBtnText}>{currentStep === totalSteps ? "Submit" : "Continue"}</Text>
                      <Ionicons name={currentStep === totalSteps ? "checkmark" : "arrow-forward"} size={18} color={colors.white} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        }
      >
        <View style={s.sheetHeader}>
          <View>
            <Text style={s.sheetTitle}>Merchant Application</Text>
            <Text style={s.sheetSub}>Step {currentStep} of {totalSteps}</Text>
          </View>
          <TouchableOpacity onPress={() => { Keyboard.dismiss(); onClose(); }} style={s.sheetClose}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${(currentStep / totalSteps) * 100}%` }]} />
        </View>
        <MerchantStepIndicator current={currentStep} total={totalSteps} />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.sheetBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </ScrollView>
      </MerchantBottomSheet>

      <MerchantSuccessModal
        visible={successVisible}
        onDone={() => { setSuccessVisible(false); onSuccess(); }}
      />
    </>
  );
}

// ─── Derive app state from profile ───────────────────────────────────────────

const getAppState = (profile: UserProfile | null): AppState => {
  if (!profile?.merchant) return "no_application";
  const { status: rawStatus, verified } = profile.merchant;
  const status = rawStatus?.toUpperCase();
  if (status === "SUSPENDED") return "suspended";
  if (status === "BANNED") return "banned";
  if (status === "REJECTED") return "rejected";
  if (status === "PENDING" || status === "UNDER_REVIEW") return "pending";
  if (status === "ACTIVE" || profile.is_merchant) {
    return verified ? "active" : "unverified";
  }
  return "pending";
};

// ─── Data hook ───────────────────────────────────────────────────────────────

const useUserStatus = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.get("/auth/profile/");
      if (response.success && response.data.user) {
        setProfile(response.data.user as UserProfile);
      }
    } catch (error) {
      if (__DEV__) console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  return {
    loading,
    profile,
    appState: getAppState(profile),
    hasListings: profile?.merchant?.is_active ?? false,
    refetch: fetchUserProfile,
  };
};

// ─── Timeline step ───────────────────────────────────────────────────────────

const TimelineStep: React.FC<{
  label: string;
  description: string;
  state: "completed" | "current" | "upcoming";
  isLast?: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
}> = ({ label, description, state, isLast, colors }) => {
  const dotColor =
    state === "completed"
      ? colors.success
      : state === "current"
      ? "#F59E0B"
      : colors.border;

  return (
    <View style={styles.timelineStep}>
      <View style={styles.timelineIndicator}>
        <View style={[styles.timelineDot, { backgroundColor: dotColor }]}>
          {state === "completed" && (
            <Ionicons name="checkmark" size={11} color="#fff" />
          )}
          {state === "current" && (
            <View style={styles.timelineDotInner} />
          )}
        </View>
        {!isLast && (
          <View
            style={[
              styles.timelineLine,
              {
                backgroundColor:
                  state === "completed" ? colors.success : colors.border,
              },
            ]}
          />
        )}
      </View>
      <View style={[styles.timelineContent, !isLast && { paddingBottom: spacingY._16 }]}>
        <Text
          style={[
            styles.timelineLabel,
            {
              color:
                state === "upcoming" ? colors.textMuted : colors.textPrimary,
            },
          ]}
        >
          {label}
        </Text>
        <Text style={[styles.timelineDesc, { color: colors.textMuted }]}>
          {description}
        </Text>
      </View>
    </View>
  );
};

// ─── Application status view ─────────────────────────────────────────────────

const ApplicationStatusView: React.FC<{
  appState: Exclude<AppState, "active" | "no_application">;
  merchant: MerchantSnapshot | undefined;
  onRefetch: () => void;
  scrollRef: React.RefObject<ScrollView>;
}> = ({ appState, merchant, onRefetch, scrollRef }) => {
  const { colors } = useTheme();
  const [cancelling, setCancelling] = useState(false);
  const config = STATUS_CONFIG[appState];

  const handleCancel = () => {
    Alert.alert(
      "Cancel Application",
      "Are you sure you want to withdraw your seller application? You can reapply at any time.",
      [
        { text: "Keep Application", style: "cancel" },
        {
          text: "Withdraw",
          style: "destructive",
          onPress: async () => {
            setCancelling(true);
            const ok = await merchantBase.cancelApplication();
            setCancelling(false);
            if (ok) {
              onRefetch();
            } else {
              Alert.alert(
                "Error",
                "Could not withdraw your application. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.statusScrollContent}
      showsVerticalScrollIndicator={false}
    >
      <SafeAreaView edges={["top"]}>
        {/* Hero */}
        <View style={styles.statusHero}>
          <View
            style={[styles.statusIconWrapper, { backgroundColor: config.bgColor }]}
          >
            <Ionicons name={config.iconName} size={52} color={config.color} />
          </View>
          <Text style={[styles.statusTitle, { color: colors.textPrimary }]}>
            {config.title}
          </Text>
          <Text style={[styles.statusMessage, { color: colors.textSecondary }]}>
            {config.message}
          </Text>
        </View>

        {/* Progress timeline — pending only */}
        {appState === "pending" && (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Application Progress
            </Text>
            <TimelineStep
              label="Application Submitted"
              description="We received your business details"
              state="completed"
              colors={colors}
            />
            <TimelineStep
              label="Under Review"
              description="Our team is reviewing your application"
              state="current"
              colors={colors}
            />
            <TimelineStep
              label="Decision"
              description="You'll be notified once a decision is made"
              state="upcoming"
              isLast
              colors={colors}
            />
          </View>
        )}

        {/* Submitted details */}
        {merchant && (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              Your Application
            </Text>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>
                Business Name
              </Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                {merchant.business_name}
              </Text>
            </View>
            <View style={[styles.detailRow, styles.detailRowLast]}>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>
                Display Name
              </Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                {merchant.display_name}
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.statusActions}>
          {config.canReapply && (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/merchant/apply/signup")}
              activeOpacity={0.8}
            >
              <Text style={[styles.primaryBtnText, { color: colors.white }]}>
                Apply Again
              </Text>
              <Ionicons name="arrow-forward" size={20} color={colors.white} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.outlineBtn,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
            onPress={() => router.push("/merchant/merchant-support")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="help-circle-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.outlineBtnText, { color: colors.primary }]}>
              Contact Support
            </Text>
          </TouchableOpacity>

          {config.canCancel && (
            <TouchableOpacity
              style={[styles.dangerBtn, { borderColor: colors.error }]}
              onPress={handleCancel}
              disabled={cancelling}
              activeOpacity={0.7}
            >
              {cancelling ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <>
                  <Ionicons
                    name="close-circle-outline"
                    size={20}
                    color={colors.error}
                  />
                  <Text style={[styles.dangerBtnText, { color: colors.error }]}>
                    Withdraw Application
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

// ─── Quick action card ────────────────────────────────────────────────────────

interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
}

const QuickAction: React.FC<QuickActionProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  variant = "secondary",
}) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.quickAction,
        { backgroundColor: colors.surface, borderColor: colors.border },
        variant === "primary" && [
          styles.quickActionPrimary,
          { backgroundColor: colors.primary, borderColor: colors.primary },
        ],
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.quickActionIcon,
          { backgroundColor: colors.backgroundSecondary },
          variant === "primary" && styles.quickActionIconPrimary,
        ]}
      >
        {icon}
      </View>
      <View style={styles.quickActionContent}>
        <Text
          style={[
            styles.quickActionTitle,
            { color: colors.textPrimary },
            variant === "primary" && { color: "#FFFFFF" },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.quickActionSubtitle,
            { color: colors.textMuted },
            variant === "primary" && { color: "rgba(255,255,255,0.8)" },
          ]}
        >
          {subtitle}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={variant === "primary" ? "#FFFFFF" : colors.textMuted}
      />
    </TouchableOpacity>
  );
};


// ─── Merchant dashboard view ──────────────────────────────────────────────────

const MerchantView: React.FC<{
  hasListings: boolean;
  scrollRef: React.RefObject<ScrollView>;
}> = ({ hasListings, scrollRef }) => {
  const { colors } = useTheme();
  useScrollToTop(scrollRef);

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <SafeAreaView edges={["top"]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textPrimary }]}>
              Ready to sell?
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              Manage your listings and orders
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.settingsButton,
              { backgroundColor: colors.backgroundSecondary },
            ]}
            onPress={() => router.push("/merchant/mylistings")}
          >
            <Ionicons
              name="settings-outline"
              size={24}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={styles.section}>
        <QuickAction
          icon={<Ionicons name="add-circle" size={28} color={colors.white} />}
          title="Create New Listing"
          subtitle="Add a product to sell"
          onPress={() => router.push("/listings/capture_listing_images")}
          variant="primary"
        />
        <QuickAction
          icon={
            <MaterialCommunityIcons
              name="package-variant"
              size={24}
              color={colors.primary}
            />
          }
          title="My Listings"
          subtitle={hasListings ? "View & manage products" : "No listings yet"}
          onPress={() => router.push("/merchant/mylistings")}
        />
        <QuickAction
          icon={
            <Ionicons name="receipt-outline" size={24} color={colors.primary} />
          }
          title="Orders"
          subtitle="Track sales & deliveries"
          onPress={() => router.push("/merchant/orders")}
        />
        <QuickAction
          icon={
            <Ionicons
              name="help-circle-outline"
              size={24}
              color={colors.primary}
            />
          }
          title="Help & Support"
          subtitle="Get help with your store"
          onPress={() => router.push("/merchant/merchant-support")}
        />
      </View>

      <View style={styles.section}>
        <View style={[styles.tipsCard, { backgroundColor: colors.warningLight }]}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={20} color={colors.warning} />
            <Text style={[styles.tipsTitle, { color: colors.textPrimary }]}>
              Seller Tips
            </Text>
          </View>
          <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
            {"• Use clear, well-lit photos from multiple angles\n• Write detailed, honest descriptions\n• Price competitively by checking similar items\n• Respond to buyer questions quickly"}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

// ─── Non-merchant onboarding view ────────────────────────────────────────────

const PERKS = [
  { icon: "pricetag-outline" as const, text: "Free to list — 5% only on sales" },
  { icon: "flash-outline" as const, text: "Live in minutes, no approval wait" },
  { icon: "cash-outline" as const, text: "Paid to mobile money within 48 h" },
] as const;

const OnboardingView: React.FC<{ scrollRef: React.RefObject<ScrollView | null>; onStartSelling: () => void }> = ({
  scrollRef,
  onStartSelling,
}) => {
  const { colors } = useTheme();
  useScrollToTop(scrollRef);

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.onboardingRoot, { backgroundColor: colors.background }]}
    >
      {/* Hero */}
      <View style={styles.onboardingHero}>
        <View style={[styles.heroIcon, { backgroundColor: colors.backgroundSecondary }]}>
          <MaterialCommunityIcons name="storefront" size={56} color={colors.primary} />
        </View>
        <Text style={[styles.onboardingTitle, { color: colors.textPrimary }]}>
          Open Your Shop
        </Text>
        <Text style={[styles.onboardingSubtitle, { color: colors.textSecondary }]}>
          Sell to thousands of buyers on Kakebe
        </Text>
      </View>

      {/* Perks */}
      <View style={[styles.perksList, { borderColor: colors.border }]}>
        {PERKS.map((p, i) => (
          <View
            key={p.icon}
            style={[
              styles.perkRow,
              i < PERKS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
            ]}
          >
            <View style={[styles.perkIconWrap, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name={p.icon} size={20} color={colors.primary} />
            </View>
            <Text style={[styles.perkText, { color: colors.textPrimary }]}>{p.text}</Text>
          </View>
        ))}
      </View>

      {/* CTAs */}
      <View style={styles.ctaSection}>
        <TouchableOpacity
          style={[styles.ctaPrimaryButton, { backgroundColor: colors.primary }]}
          onPress={onStartSelling}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaPrimaryButtonText}>Start Selling</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ctaTextButton}
          onPress={() => router.push("/merchant/apply/benefits")}
          activeOpacity={0.7}
        >
          <Text style={[styles.ctaTextButtonText, { color: colors.primary }]}>
            How it works
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SellScreen() {
  const { loading, appState, hasListings, profile, refetch } = useUserStatus();
  const scrollRef = useRef<ScrollView | null>(null);
  const { colors, isDark } = useTheme();
  const [sheetVisible, setSheetVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  if (loading) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: colors.background }]}
      >
        <StatusBar style={isDark ? "light" : "dark"} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      {appState === "active" ? (
        <MerchantView hasListings={hasListings} scrollRef={scrollRef as React.RefObject<ScrollView>} />
      ) : appState === "no_application" ? (
        <OnboardingView scrollRef={scrollRef} onStartSelling={() => setSheetVisible(true)} />
      ) : (
        <ApplicationStatusView
          appState={appState as Exclude<AppState, "active" | "no_application">}
          merchant={profile?.merchant}
          onRefetch={refetch}
          scrollRef={scrollRef as React.RefObject<ScrollView>}
        />
      )}
      <MerchantApplicationSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSuccess={() => { setSheetVisible(false); refetch(); }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: spacingY._20 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },

  // ── Merchant header ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._20,
    paddingBottom: spacingY._16,
  },
  greeting: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold },
  headerSubtitle: { fontSize: fontSize.md, marginTop: spacingY._2 },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.md,
  },

  // ── Section ──
  section: { paddingHorizontal: spacingX._20, paddingTop: spacingY._12 },

  // ── Quick actions ──
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.lg,
    padding: spacingX._16,
    marginBottom: spacingY._12,
    borderWidth: 1,
  },
  quickActionPrimary: { ...shadow.md },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacingX._12,
  },
  quickActionIconPrimary: { backgroundColor: "rgba(255,255,255,0.2)" },
  quickActionContent: { flex: 1 },
  quickActionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacingY._2,
  },
  quickActionSubtitle: { fontSize: fontSize.sm },

  // ── Tips card ──
  tipsCard: {
    borderRadius: borderRadius.lg,
    padding: spacingX._16,
    marginTop: spacingY._12,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacingY._12,
  },
  tipsTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginLeft: spacingX._8,
  },
  tipsText: { fontSize: fontSize.md, lineHeight: 22 },

  // ── Onboarding ──
  onboardingRoot: {
    flex: 1,
    paddingHorizontal: spacingX._24,
    justifyContent: "center",
  },
  onboardingHero: {
    alignItems: "center",
    marginBottom: spacingY._32,
  },
  heroIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacingY._20,
  },
  onboardingTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    textAlign: "center",
    marginBottom: spacingY._8,
  },
  onboardingSubtitle: {
    fontSize: fontSize.lg,
    textAlign: "center",
    lineHeight: 24,
  },

  // ── Perks list ──
  perksList: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    marginBottom: spacingY._32,
  },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacingY._14,
    paddingHorizontal: spacingX._16,
    gap: 12,
  },
  perkIconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  perkText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    flex: 1,
  },

  // ── CTAs ──
  ctaSection: { gap: 12 },
  ctaPrimaryButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacingY._16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...shadow.primary,
  },
  ctaPrimaryButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: "#FFFFFF",
  },
  ctaTextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacingY._8,
    gap: 2,
  },
  ctaTextButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },

  // ── Application status view ──
  statusScrollContent: {
    paddingBottom: spacingY._30,
  },
  statusHero: {
    alignItems: "center",
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._30,
    paddingBottom: spacingY._24,
  },
  statusIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacingY._20,
  },
  statusTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    textAlign: "center",
    marginBottom: spacingY._12,
  },
  statusMessage: {
    fontSize: fontSize.md,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: spacingX._10,
  },

  // ── Card ──
  card: {
    marginHorizontal: spacingX._20,
    marginTop: spacingY._12,
    borderRadius: borderRadius.lg,
    padding: spacingX._16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacingY._16,
  },

  // ── Timeline ──
  timelineStep: { flexDirection: "row" },
  timelineIndicator: { alignItems: "center", marginRight: spacingX._12, width: 20 },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  timelineLine: { width: 2, flex: 1, marginTop: 2 },
  timelineContent: { flex: 1, paddingBottom: 0 },
  timelineLabel: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  timelineDesc: { fontSize: fontSize.sm, marginTop: spacingY._2, lineHeight: 18 },

  // ── Detail rows ──
  detailRow: {
    paddingVertical: spacingY._12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  detailRowLast: { borderBottomWidth: 0 },
  detailLabel: { fontSize: fontSize.sm, marginBottom: spacingY._4 },
  detailValue: { fontSize: fontSize.md, fontWeight: fontWeight.medium },

  // ── Status action buttons ──
  statusActions: {
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._24,
    gap: 12,
  },
  primaryBtn: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacingY._16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...shadow.primary,
  },
  primaryBtnText: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  outlineBtn: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacingY._14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
  },
  outlineBtnText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  dangerBtn: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacingY._14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    marginTop: spacingY._8,
  },
  dangerBtnText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
});
