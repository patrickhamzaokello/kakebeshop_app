import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  colors,
  spacingX,
  spacingY,
  borderRadius,
  fontSize,
  fontWeight,
  shadow,
} from "@/constants/theme";
import apiService from "@/utils/apiBase";
import { UserProfile } from "@/utils/types/models";

const useUserStatus = () => {
  const [loading, setLoading] = useState(true);
  const [isMerchant, setIsMerchant] = useState(false);
  const [hasListings, setHasListings] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

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
      console.error("Error fetching user profile:", error);
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
}) => (
  <TouchableOpacity
    style={[
      styles.quickAction,
      variant === "primary" && styles.quickActionPrimary,
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View
      style={[
        styles.quickActionIcon,
        variant === "primary" && styles.quickActionIconPrimary,
      ]}
    >
      {icon}
    </View>
    <View style={styles.quickActionContent}>
      <Text
        style={[
          styles.quickActionTitle,
          variant === "primary" && styles.quickActionTitlePrimary,
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.quickActionSubtitle,
          variant === "primary" && styles.quickActionSubtitlePrimary,
        ]}
      >
        {subtitle}
      </Text>
    </View>
    <Ionicons
      name="chevron-forward"
      size={20}
      color={variant === "primary" ? colors.white : colors.textMuted}
    />
  </TouchableOpacity>
);

interface BenefitCardProps {
  icon: string;
  title: string;
  description: string;
}

const BenefitCard: React.FC<BenefitCardProps> = ({
  icon,
  title,
  description,
}) => (
  <View style={styles.benefitCard}>
    <Text style={styles.benefitIcon}>{icon}</Text>
    <Text style={styles.benefitTitle}>{title}</Text>
    <Text style={styles.benefitDescription}>{description}</Text>
  </View>
);

// Merchant Dashboard View
const MerchantView: React.FC<{ hasListings: boolean }> = ({ hasListings }) => {
  return (
    <ScrollView
      style={styles.scrollView}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <SafeAreaView edges={["top"]}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Ready to sell?</Text>
          <Text style={styles.headerSubtitle}>
            Manage your listings and orders
          </Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
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
              name="bar-chart-outline"
              size={24}
              color={colors.primary}
            />
          }
          title="Sales Analytics"
          subtitle="View your performance"
          onPress={() => router.push("/merchant/dashboard")}
        />
      </View>

      {/* Tips Section */}
      <View style={styles.section}>
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={20} color={colors.warning} />
            <Text style={styles.tipsTitle}>Seller Tips</Text>
          </View>
          <Text style={styles.tipsText}>
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
const OnboardingView: React.FC = () => {
  const handleGetStarted = () => {
    router.push("/merchant/apply/signup");
  };

  const handleLearnMore = () => {
    router.push("/merchant/apply/benefits");
  };

  return (
    <ScrollView
      style={styles.scrollView}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Hero Section */}
      <LinearGradient
        colors={[colors.primarySoft, colors.white]}
        style={styles.onboardingHero}
      >
        <SafeAreaView edges={["top"]} style={{ alignItems: "center" }}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons
              name="storefront"
              size={64}
              color={colors.primary}
            />
          </View>
          <Text style={styles.onboardingTitle}>Start Selling Today</Text>
          <Text style={styles.onboardingSubtitle}>
            Join thousands of sellers and turn your products into profit
          </Text>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statBadge}>
              <Text style={styles.statNumber}>10K+</Text>
              <Text style={styles.statText}>Buyers</Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={styles.statNumber}>Free</Text>
              <Text style={styles.statText}>Listing</Text>
            </View>
            <View style={styles.statBadge}>
              <Text style={styles.statNumber}>24/7</Text>
              <Text style={styles.statText}>Support</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Benefits Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Sell on Kakebe?</Text>
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
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.stepsList}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Sign Up as Seller</Text>
              <Text style={styles.stepDescription}>
                Quick registration with basic info
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Add Your Products</Text>
              <Text style={styles.stepDescription}>
                Photos, description, and price
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Start Earning</Text>
              <Text style={styles.stepDescription}>
                Receive orders and get paid
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* CTA Buttons */}
      <View style={styles.ctaSection}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Become a Seller</Text>
          <Ionicons name="arrow-forward" size={20} color={colors.white} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleLearnMore}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>Learn More</Text>
        </TouchableOpacity>

        <Text style={styles.ctaFootnote}>
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {isMerchant ? (
        <MerchantView hasListings={hasListings} />
      ) : (
        <OnboardingView />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
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
    backgroundColor: colors.white,
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
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacingY._2,
  },
  settingsButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
  },

  section: {
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._12,
  },

  // Quick Actions
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacingX._16,
    marginBottom: spacingY._12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadow.md,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primarySoft,
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
    color: colors.textPrimary,
    marginBottom: spacingY._2,
  },
  quickActionTitlePrimary: {
    color: colors.white,
  },
  quickActionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  quickActionSubtitlePrimary: {
    color: "rgba(255, 255, 255, 0.8)",
  },

  // Tips Card
  tipsCard: {
    backgroundColor: colors.backgroundSecondary,
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
    color: colors.textPrimary,
    marginLeft: spacingX._8,
  },
  tipsText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
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
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacingY._20,
    ...shadow.lg,
  },
  onboardingTitle: {
    fontSize: 32,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacingY._12,
  },
  onboardingSubtitle: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
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
    backgroundColor: colors.white,
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
    color: colors.primary,
  },
  statText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacingY._2,
  },

  // Section Title
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
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
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacingX._16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  benefitIcon: {
    fontSize: 36,
    marginBottom: spacingY._8,
  },
  benefitTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacingY._4,
    textAlign: "center",
  },
  benefitDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },

  // How It Works
  howItWorksSection: {
    backgroundColor: colors.backgroundSecondary,
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
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacingX._12,
  },
  stepNumberText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  stepContent: {
    flex: 1,
    paddingTop: spacingY._4,
  },
  stepTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacingY._4,
  },
  stepDescription: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // CTA Section
  ctaSection: {
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._24,
  },
  primaryButton: {
    backgroundColor: colors.primary,
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
    color: colors.white,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacingY._16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacingY._12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  ctaFootnote: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacingY._16,
  },
});
