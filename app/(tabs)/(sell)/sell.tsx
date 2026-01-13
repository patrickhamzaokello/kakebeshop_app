import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
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

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({
  icon,
  title,
  description,
}) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIconContainer}>{icon}</View>
    <View style={styles.featureContent}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

interface StepItemProps {
  number: number;
  title: string;
  description: string;
  isLast?: boolean;
}

const StepItem: React.FC<StepItemProps> = ({
  number,
  title,
  description,
  isLast,
}) => (
  <View style={styles.stepItem}>
    <View style={styles.stepIndicator}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      {!isLast && <View style={styles.stepLine} />}
    </View>
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDescription}>{description}</Text>
    </View>
  </View>
);

export default function SellLandingPage() {
  const handleGetStarted = () => {
    router.push("/listings/capture_listing_images");
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <LinearGradient
          colors={[colors.primarySoft, colors.white]}
          style={styles.heroSection}
        >
          <SafeAreaView edges={["top"]} />

          <View style={styles.heroContent}>
            <View style={styles.heroIconContainer}>
              <MaterialCommunityIcons
                name="store-plus"
                size={48}
                color={colors.primary}
              />
            </View>

            <Text style={styles.heroTitle}>Start Selling on Kakebe</Text>
            <Text style={styles.heroSubtitle}>
              Turn your products into profit. Reach thousands of buyers and grow
              your business with ease.
            </Text>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>10K+</Text>
                <Text style={styles.statLabel}>Active Buyers</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>500+</Text>
                <Text style={styles.statLabel}>Sellers</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>24/7</Text>
                <Text style={styles.statLabel}>Support</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Why Sell Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why Sell on Kakebe?</Text>

          <FeatureItem
            icon={
              <Ionicons name="cash-outline" size={24} color={colors.primary} />
            }
            title="Zero Listing Fees"
            description="List your products for free. Only pay a small commission when you make a sale."
          />

          <FeatureItem
            icon={
              <Ionicons name="people-outline" size={24} color={colors.primary} />
            }
            title="Reach More Customers"
            description="Get access to thousands of active buyers looking for products like yours."
          />

          <FeatureItem
            icon={
              <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} />
            }
            title="Secure Payments"
            description="Receive payments safely and directly to your mobile money or bank account."
          />

          <FeatureItem
            icon={
              <Ionicons name="trending-up-outline" size={24} color={colors.primary} />
            }
            title="Grow Your Business"
            description="Track your sales, manage orders, and watch your business grow."
          />
        </View>

        {/* How It Works Section */}
        <View style={[styles.section, styles.sectionAlt]}>
          <Text style={styles.sectionTitle}>How It Works</Text>

          <View style={styles.stepsContainer}>
            <StepItem
              number={1}
              title="Take Photos"
              description="Snap clear photos of your product from multiple angles"
            />
            <StepItem
              number={2}
              title="Add Details"
              description="Describe your product, set a price, and choose a category"
            />
            <StepItem
              number={3}
              title="Publish & Sell"
              description="Go live and start receiving orders from buyers"
              isLast
            />
          </View>
        </View>

        {/* Testimonial Section */}
        <View style={styles.section}>
          <View style={styles.testimonialCard}>
            <View style={styles.quoteIcon}>
              <Ionicons name="chatbubble-ellipses" size={24} color={colors.primary} />
            </View>
            <Text style={styles.testimonialText}>
              "I started selling on Kakebe 3 months ago and my sales have grown
              by 200%. The platform is easy to use and customers find me easily!"
            </Text>
            <View style={styles.testimonialAuthor}>
              <View style={styles.authorAvatar}>
                <Text style={styles.authorInitials}>SM</Text>
              </View>
              <View>
                <Text style={styles.authorName}>Sarah M.</Text>
                <Text style={styles.authorRole}>Fashion Seller</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Spacing for CTA */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed CTA Button */}
      <View style={styles.ctaContainer}>
        <SafeAreaView edges={["bottom"]}>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleGetStarted}
            activeOpacity={0.9}
          >
            <Text style={styles.ctaButtonText}>Post Your First Listing</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.white} />
          </TouchableOpacity>

          <Text style={styles.ctaSubtext}>
            It only takes 2 minutes to get started
          </Text>
        </SafeAreaView>
      </View>
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
    paddingBottom: 160,
  },

  // Hero Section
  heroSection: {
    paddingBottom: spacingY._30,
  },
  heroContent: {
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._20,
    alignItems: "center",
  },
  heroIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacingY._20,
    ...shadow.md,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacingY._12,
  },
  heroSubtitle: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: spacingX._10,
  },

  // Stats Row
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacingY._24,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacingY._16,
    paddingHorizontal: spacingX._20,
    ...shadow.sm,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacingY._2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },

  // Section
  section: {
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._24,
  },
  sectionAlt: {
    backgroundColor: colors.backgroundSecondary,
  },
  sectionTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacingY._20,
  },

  // Feature Item
  featureItem: {
    flexDirection: "row",
    marginBottom: spacingY._20,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacingX._16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacingY._4,
  },
  featureDescription: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Steps
  stepsContainer: {
    paddingLeft: spacingX._4,
  },
  stepItem: {
    flexDirection: "row",
  },
  stepIndicator: {
    alignItems: "center",
    marginRight: spacingX._16,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.primary,
    opacity: 0.3,
    marginVertical: spacingY._4,
  },
  stepContent: {
    flex: 1,
    paddingBottom: spacingY._24,
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

  // Testimonial
  testimonialCard: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacingX._20,
    position: "relative",
  },
  quoteIcon: {
    position: "absolute",
    top: -12,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.sm,
  },
  testimonialText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    lineHeight: 26,
    fontStyle: "italic",
    marginTop: spacingY._16,
    marginBottom: spacingY._16,
  },
  testimonialAuthor: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacingX._12,
  },
  authorInitials: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  authorName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
  },
  authorRole: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },

  // Bottom Spacer
  bottomSpacer: {
    height: 20,
  },

  // CTA Container
  ctaContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow.lg,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacingY._16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...shadow.primary,
  },
  ctaButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  ctaSubtext: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacingY._10,
    marginBottom: spacingY._4,
  },
});
