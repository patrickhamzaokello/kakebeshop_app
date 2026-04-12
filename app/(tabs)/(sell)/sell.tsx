import React, { useState, useEffect, useRef, useCallback } from "react";
import { Text } from "@/components/Text";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useScrollToTop } from "@react-navigation/native";
import {
  spacingX,
  spacingY,
  borderRadius,
  fontSize,
  fontWeight,
  shadow,
} from "@/constants/theme";
import apiService from "@/utils/apiBase";
import { UserProfile } from "@/utils/types/models";
import { useTheme } from "@/contexts/ThemeContext";
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

// ─── Benefit card ─────────────────────────────────────────────────────────────

interface BenefitCardProps {
  icon: string;
  title: string;
  description: string;
}

const BenefitCard: React.FC<BenefitCardProps> = ({ icon, title, description }) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.benefitCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Text style={styles.benefitIcon}>{icon}</Text>
      <Text style={[styles.benefitTitle, { color: colors.textPrimary }]}>
        {title}
      </Text>
      <Text style={[styles.benefitDescription, { color: colors.textMuted }]}>
        {description}
      </Text>
    </View>
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

const OnboardingView: React.FC<{ scrollRef: React.RefObject<ScrollView | null> }> = ({
  scrollRef,
}) => {
  const { colors } = useTheme();
  useScrollToTop(scrollRef);

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <LinearGradient
        colors={[colors.primarySoft, colors.background]}
        style={styles.onboardingHero}
      >
        <SafeAreaView edges={["top"]} style={{ alignItems: "center" }}>
          <View style={[styles.heroIcon, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons
              name="storefront"
              size={64}
              color={colors.primary}
            />
          </View>
          <Text
            style={[styles.onboardingTitle, { color: colors.textPrimary }]}
          >
            Start Selling Today
          </Text>
          <Text
            style={[styles.onboardingSubtitle, { color: colors.textMuted }]}
          >
            Join thousands of sellers and turn your products into profit
          </Text>
          <View style={styles.statsContainer}>
            {[
              { number: "10K+", label: "Buyers" },
              { number: "Free", label: "Listing" },
              { number: "24/7", label: "Support" },
            ].map((s) => (
              <View
                key={s.label}
                style={[
                  styles.statBadge,
                  { backgroundColor: colors.surfaceElevated },
                ]}
              >
                <Text style={[styles.statNumber, { color: colors.primary }]}>
                  {s.number}
                </Text>
                <Text style={[styles.statText, { color: colors.textMuted }]}>
                  {s.label}
                </Text>
              </View>
            ))}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Why Sell on Kakebe?
        </Text>
        <View style={styles.benefitsGrid}>
          <BenefitCard
            icon="💰"
            title="Zero Fees"
            description="List for free, pay only when you sell"
          />
          <BenefitCard
            icon="🚀"
            title="Quick Setup"
            description="Start selling in under 5 minutes"
          />
          <BenefitCard
            icon="🔒"
            title="Secure"
            description="Safe payments to your account"
          />
          <BenefitCard
            icon="📈"
            title="Grow"
            description="Reach thousands of buyers"
          />
        </View>
      </View>

      <View style={[styles.section, styles.howItWorksSection]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          How It Works
        </Text>
        <View style={styles.stepsList}>
          {[
            {
              n: "1",
              title: "Sign Up as Seller",
              desc: "Quick registration with basic info",
            },
            {
              n: "2",
              title: "Add Your Products",
              desc: "Photos, description, and price",
            },
            {
              n: "3",
              title: "Start Earning",
              desc: "Receive orders and get paid",
            },
          ].map((step) => (
            <View key={step.n} style={styles.step}>
              <View
                style={[styles.stepNumber, { backgroundColor: colors.primary }]}
              >
                <Text
                  style={[styles.stepNumberText, { color: "#FFFFFF" }]}
                >
                  {step.n}
                </Text>
              </View>
              <View style={styles.stepContent}>
                <Text
                  style={[styles.stepTitle, { color: colors.textPrimary }]}
                >
                  {step.title}
                </Text>
                <Text
                  style={[
                    styles.stepDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {step.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.ctaSection}>
        <TouchableOpacity
          style={[styles.ctaPrimaryButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/merchant/apply/signup")}
          activeOpacity={0.8}
        >
          <Text style={[styles.ctaPrimaryButtonText, { color: "#FFFFFF" }]}>
            Become a Seller
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.ctaSecondaryButton, { borderColor: colors.primary }]}
          onPress={() => router.push("/merchant/apply/benefits")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.ctaSecondaryButtonText,
              { color: colors.primary },
            ]}
          >
            Learn More
          </Text>
        </TouchableOpacity>

        <Text style={[styles.ctaFootnote, { color: colors.textMuted }]}>
          Free to join • No monthly fees • Secure payments
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SellScreen() {
  const { loading, appState, hasListings, profile, refetch } = useUserStatus();
  const scrollRef = useRef<ScrollView | null>(null);
  const { colors, isDark } = useTheme();

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
        <OnboardingView scrollRef={scrollRef} />
      ) : (
        <ApplicationStatusView
          appState={appState as Exclude<AppState, "active" | "no_application">}
          merchant={profile?.merchant}
          onRefetch={refetch}
          scrollRef={scrollRef as React.RefObject<ScrollView>}
        />
      )}
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

  // ── Onboarding hero ──
  onboardingHero: {
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._30,
    paddingBottom: spacingY._30,
    alignItems: "center",
  },
  heroIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacingY._20,
    ...shadow.lg,
  },
  onboardingTitle: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    textAlign: "center",
    marginBottom: spacingY._12,
  },
  onboardingSubtitle: {
    fontSize: fontSize.lg,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: spacingX._10,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: spacingY._24,
  },
  statBadge: {
    borderRadius: borderRadius.md,
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._20,
    alignItems: "center",
    minWidth: 90,
    ...shadow.sm,
  },
  statNumber: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  statText: { fontSize: fontSize.xs, marginTop: spacingY._2 },

  // ── Section title ──
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacingY._16,
  },

  // ── Benefits grid ──
  benefitsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  benefitCard: {
    flex: 1,
    minWidth: "47%",
    borderRadius: borderRadius.lg,
    padding: spacingX._16,
    alignItems: "center",
    borderWidth: 1,
  },
  benefitIcon: { fontSize: 36, marginBottom: spacingY._8 },
  benefitTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacingY._4,
    textAlign: "center",
  },
  benefitDescription: {
    fontSize: fontSize.sm,
    textAlign: "center",
    lineHeight: 18,
  },

  // ── How it works ──
  howItWorksSection: { marginTop: spacingY._20, paddingVertical: spacingY._24 },
  stepsList: { gap: 16 },
  step: { flexDirection: "row", alignItems: "flex-start" },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacingX._12,
  },
  stepNumberText: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  stepContent: { flex: 1, paddingTop: spacingY._4 },
  stepTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacingY._4,
  },
  stepDescription: { fontSize: fontSize.md, lineHeight: 20 },

  // ── CTA ──
  ctaSection: { paddingHorizontal: spacingX._20, paddingTop: spacingY._24 },
  ctaPrimaryButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacingY._16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...shadow.primary,
  },
  ctaPrimaryButtonText: { fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  ctaSecondaryButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacingY._16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacingY._12,
    borderWidth: 1,
  },
  ctaSecondaryButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  ctaFootnote: {
    fontSize: fontSize.sm,
    textAlign: "center",
    marginTop: spacingY._16,
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
