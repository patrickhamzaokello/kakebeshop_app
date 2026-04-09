import React, { useState, useEffect, useRef } from "react";
import { Text } from "@/components/Text";
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
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

const useUserStatus = () => {
  const [loading, setLoading] = useState(true);
  const [isMerchant, setIsMerchant] = useState(false);
  const [hasListings, setHasListings] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const   {colors} = useTheme();

  const fetchUserProfile = async () => {
    try {
      const response = await apiService.get("/auth/profile/");
      
      if (response.success && response.data.user) {
        const userProfile: UserProfile = response.data.user;
        setProfile(userProfile);

        // Update merchant and listings status based on the profile
        setIsMerchant(userProfile.is_merchant);
        setHasListings(userProfile.merchant?.is_active || false);
      }
    } catch (error) {
      if (__DEV__) console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  return { loading, isMerchant, hasListings, profile };
};

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
  const {colors} = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.quickAction,
        { backgroundColor: colors.surface, borderColor: colors.border },
        variant === "primary" && [styles.quickActionPrimary, { backgroundColor: colors.primary, borderColor: colors.primary }],
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
            variant === "primary" && styles.quickActionSubtitlePrimary,
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
}

interface BenefitCardProps {
  icon: string;
  title: string;
  description: string;
}

const BenefitCard: React.FC<BenefitCardProps> = ({
  icon,
  title,
  description,
}) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.benefitCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={styles.benefitIcon}>{icon}</Text>
      <Text style={[styles.benefitTitle, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.benefitDescription, { color: colors.textMuted }]}>{description}</Text>
    </View>
  );
};

// Merchant Dashboard View
const MerchantView: React.FC<{ hasListings: boolean; scrollRef: React.RefObject<ScrollView> }> = ({ hasListings, scrollRef }) => {
  const { colors } = useTheme();
  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <SafeAreaView edges={["top"]}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textPrimary }]}>Ready to sell?</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Manage your listings and orders
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: colors.backgroundSecondary }]}
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

      {/* Quick Actions */}
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

      {/* Tips Section */}
      <View style={styles.section}>
        <View style={[styles.tipsCard, { backgroundColor: colors.warningLight }]}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={20} color={colors.warning} />
            <Text style={[styles.tipsTitle, { color: colors.textPrimary }]}>Seller Tips</Text>
          </View>
          <Text style={[styles.tipsText, { color: colors.textSecondary }]}>
            • Use clear, well-lit photos from multiple angles{"\n"}• Write
            detailed, honest descriptions{"\n"}• Price competitively by checking
            similar items{"\n"}• Respond to buyer questions quickly
          </Text>
        </View>
      </View>

    </ScrollView>
  );
};

// Non-Merchant Onboarding View
const OnboardingView: React.FC<{ scrollRef: React.RefObject<ScrollView> }> = ({ scrollRef }) => {
  const handleGetStarted = () => {
    router.push("/merchant/apply/signup");
  };

  const handleLearnMore = () => {
    router.push("/merchant/apply/benefits");
  };

  const { colors } = useTheme();

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.scrollView, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Hero Section */}
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
          <Text style={[styles.onboardingTitle, { color: colors.textPrimary }]}>Start Selling Today</Text>
          <Text style={[styles.onboardingSubtitle, { color: colors.textMuted }]}>
            Join thousands of sellers and turn your products into profit
          </Text>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={[styles.statBadge, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>10K+</Text>
              <Text style={[styles.statText, { color: colors.textMuted }]}>Buyers</Text>
            </View>
            <View style={[styles.statBadge, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>Free</Text>
              <Text style={[styles.statText, { color: colors.textMuted }]}>Listing</Text>
            </View>
            <View style={[styles.statBadge, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>24/7</Text>
              <Text style={[styles.statText, { color: colors.textMuted }]}>Support</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Benefits Grid */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Why Sell on Kakebe?</Text>
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

      {/* How It Works */}
      <View style={[styles.section, styles.howItWorksSection]}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>How It Works</Text>
        <View style={styles.stepsList}>
          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <Text style={[styles.stepNumberText, { color: "#FFFFFF" }]}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Sign Up as Seller</Text>
              <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                Quick registration with basic info
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <Text style={[styles.stepNumberText, { color: "#FFFFFF" }]}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Add Your Products</Text>
              <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                Photos, description, and price
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <Text style={[styles.stepNumberText, { color: "#FFFFFF" }]}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Start Earning</Text>
              <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                Receive orders and get paid
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* CTA Buttons */}
      <View style={styles.ctaSection}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <Text style={[styles.primaryButtonText, { color: "#FFFFFF" }]}>Become a Seller</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.primary }]}
          onPress={handleLearnMore}
          activeOpacity={0.8}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Learn More</Text>
        </TouchableOpacity>

        <Text style={[styles.ctaFootnote, { color: colors.textMuted }]}>
          Free to join • No monthly fees • Secure payments
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

// Main Component
export default function SellScreen() {
  const { loading, isMerchant, hasListings } = useUserStatus();
  const scrollRef = useRef<ScrollView>(null);
  const { colors, isDark } = useTheme();

  // Scroll to top when sell tab is pressed
  useScrollToTop(scrollRef);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {isMerchant ? (
        <MerchantView hasListings={hasListings} scrollRef={scrollRef} />
      ) : (
        <OnboardingView scrollRef={scrollRef} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacingY._20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Merchant View Styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._20,
    paddingBottom: spacingY._16,
  },
  greeting: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  headerSubtitle: {
    fontSize: fontSize.md,
    marginTop: spacingY._2,
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.md,
  },

  section: {
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._12,
  },

  // Quick Actions
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.lg,
    padding: spacingX._16,
    marginBottom: spacingY._12,
    borderWidth: 1,
  },
  quickActionPrimary: {
    ...shadow.md,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacingX._12,
  },
  quickActionIconPrimary: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacingY._2,
  },
  quickActionTitlePrimary: {
  },
  quickActionSubtitle: {
    fontSize: fontSize.sm,
  },
  quickActionSubtitlePrimary: {
    color: "rgba(255, 255, 255, 0.8)",
  },

  // Tips Card
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
  tipsText: {
    fontSize: fontSize.md,
    lineHeight: 22,
  },

  // Onboarding View Styles
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

  // Stats Container
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
  statNumber: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  statText: {
    fontSize: fontSize.xs,
    marginTop: spacingY._2,
  },

  // Section Title
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacingY._16,
  },

  // Benefits Grid
  benefitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  benefitCard: {
    flex: 1,
    minWidth: "47%",
    borderRadius: borderRadius.lg,
    padding: spacingX._16,
    alignItems: "center",
    borderWidth: 1,
  },
  benefitIcon: {
    fontSize: 36,
    marginBottom: spacingY._8,
  },
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

  // How It Works
  howItWorksSection: {
    marginTop: spacingY._20,
    paddingVertical: spacingY._24,
  },
  stepsList: {
    gap: 16,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacingX._12,
  },
  stepNumberText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  stepContent: {
    flex: 1,
    paddingTop: spacingY._4,
  },
  stepTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: spacingY._4,
  },
  stepDescription: {
    fontSize: fontSize.md,
    lineHeight: 20,
  },

  // CTA Section
  ctaSection: {
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._24,
  },
  primaryButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacingY._16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...shadow.primary,
  },
  primaryButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  secondaryButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacingY._16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacingY._12,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  ctaFootnote: {
    fontSize: fontSize.sm,
    textAlign: "center",
    marginTop: spacingY._16,
  },
});
