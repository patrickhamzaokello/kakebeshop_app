import React, { useMemo, useState } from "react";
import { Text } from "@/components/Text";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  spacingX,
  spacingY,
  borderRadius,
  fontSize,
  fontWeight,
  shadow,
  ThemeColors,
} from "@/constants/theme";
import { useThemeColors } from "@/contexts/ThemeContext";

const { width } = Dimensions.get("window");

// ---------------------------------------------------------------------------
// Style factory
// ---------------------------------------------------------------------------

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      paddingBottom: spacingY._20,
    },
    headerContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacingX._20,
      paddingTop: spacingY._12,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: c.white,
    },
    heroStats: {
      flexDirection: "row",
      backgroundColor: c.surface,
      marginHorizontal: spacingX._20,
      marginTop: -30,
      borderRadius: borderRadius.lg,
      padding: spacingX._20,
      ...shadow.lg,
    },
    heroStatItem: {
      flex: 1,
      alignItems: "center",
    },
    heroStatNumber: {
      fontSize: fontSize.xxl,
      fontWeight: fontWeight.bold,
      color: c.primary,
    },
    heroStatLabel: {
      fontSize: fontSize.xs,
      color: c.textMuted,
      marginTop: spacingY._4,
      textAlign: "center",
    },
    heroStatDivider: {
      width: 1,
      backgroundColor: c.border,
      marginHorizontal: spacingX._8,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: spacingY._50,
    },
    section: {
      paddingHorizontal: spacingX._20,
      paddingVertical: spacingY._24,
    },
    sectionTitle: {
      fontSize: fontSize.xxl,
      fontWeight: fontWeight.bold,
      color: c.textPrimary,
      marginBottom: spacingY._8,
    },
    sectionSubtitle: {
      fontSize: fontSize.md,
      color: c.textSecondary,
      marginBottom: spacingY._20,
    },
    featuresGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    featureCard: {
      width: (width - spacingX._20 * 2 - 12) / 2,
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: spacingX._16,
      borderWidth: 1,
      borderColor: c.border,
      position: "relative",
    },
    featureBadge: {
      position: "absolute",
      top: 8,
      right: 8,
      backgroundColor: c.warning,
      paddingHorizontal: spacingX._8,
      paddingVertical: spacingY._2,
      borderRadius: borderRadius.sm,
    },
    featureBadgeText: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: c.white,
    },
    featureIconContainer: {
      width: 56,
      height: 56,
      borderRadius: borderRadius.md,
      backgroundColor: c.backgroundTertiary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacingY._12,
    },
    featureTitle: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: c.textPrimary,
      marginBottom: spacingY._6,
    },
    featureDescription: {
      fontSize: fontSize.sm,
      color: c.textSecondary,
      lineHeight: 18,
    },
    comparisonSection: {
      backgroundColor: c.backgroundSecondary,
    },
    comparisonTable: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: c.border,
    },
    comparisonHeader: {
      flexDirection: "row",
      backgroundColor: c.backgroundTertiary,
      padding: spacingX._16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    comparisonHeaderText: {
      flex: 1,
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: c.textPrimary,
    },
    comparisonHeaderValues: {
      flexDirection: "row",
      width: 200,
    },
    comparisonHeaderCell: {
      flex: 1,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 4,
    },
    comparisonHeaderLabel: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.bold,
      color: c.primary,
    },
    comparisonHeaderLabelMuted: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: c.textMuted,
    },
    comparisonRow: {
      flexDirection: "row",
      padding: spacingX._16,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    comparisonFeature: {
      flex: 1,
      fontSize: fontSize.md,
      color: c.textPrimary,
    },
    comparisonValues: {
      flexDirection: "row",
      width: 200,
    },
    comparisonCell: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    comparisonText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: c.primary,
    },
    comparisonTextMuted: {
      color: c.textMuted,
      fontWeight: fontWeight.medium,
    },
    testimonialsContainer: {
      paddingRight: spacingX._20,
      gap: 12,
    },
    testimonialCard: {
      width: width * 0.8,
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: spacingX._20,
      borderWidth: 1,
      borderColor: c.border,
      position: "relative",
    },
    quoteIconContainer: {
      position: "absolute",
      top: -10,
      left: 20,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.backgroundTertiary,
      alignItems: "center",
      justifyContent: "center",
    },
    testimonialQuote: {
      fontSize: fontSize.md,
      color: c.textSecondary,
      lineHeight: 22,
      fontStyle: "italic",
      marginTop: spacingY._16,
      marginBottom: spacingY._16,
    },
    testimonialFooter: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacingY._12,
    },
    testimonialAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacingX._12,
    },
    testimonialAvatarText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold,
      color: c.textInverse,
    },
    testimonialInfo: {
      flex: 1,
    },
    testimonialName: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: c.textPrimary,
    },
    testimonialRole: {
      fontSize: fontSize.sm,
      color: c.textMuted,
    },
    testimonialStats: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.backgroundSecondary,
      paddingHorizontal: spacingX._12,
      paddingVertical: spacingY._6,
      borderRadius: borderRadius.md,
      alignSelf: "flex-start",
    },
    testimonialStatsText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: c.success,
      marginLeft: spacingX._4,
    },
    stepsSection: {
      backgroundColor: c.backgroundSecondary,
    },
    stepsList: {
      paddingHorizontal: spacingX._10,
    },
    stepItem: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    stepCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacingX._16,
      ...shadow.md,
    },
    stepNumber: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: c.textInverse,
    },
    stepContent: {
      flex: 1,
      paddingTop: spacingY._4,
    },
    stepTitle: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semibold,
      color: c.textPrimary,
      marginBottom: spacingY._6,
    },
    stepDescription: {
      fontSize: fontSize.md,
      color: c.textSecondary,
      lineHeight: 20,
    },
    stepConnector: {
      width: 2,
      height: 40,
      backgroundColor: c.primary,
      opacity: 0.3,
      marginLeft: 23,
      marginVertical: spacingY._8,
    },
    faqList: {
      gap: 12,
    },
    faqItem: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      padding: spacingX._16,
      borderWidth: 1,
      borderColor: c.border,
    },
    faqHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    faqQuestion: {
      flex: 1,
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: c.textPrimary,
      marginRight: spacingX._12,
    },
    faqAnswer: {
      fontSize: fontSize.md,
      color: c.textSecondary,
      lineHeight: 22,
      marginTop: spacingY._12,
      paddingTop: spacingY._12,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    supportLink: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: spacingY._20,
      padding: spacingX._16,
    },
    supportLinkText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: c.primary,
      marginLeft: spacingX._8,
    },
    trustSection: {
      paddingHorizontal: spacingX._20,
      paddingVertical: spacingY._24,
      backgroundColor: c.backgroundSecondary,
    },
    trustBadges: {
      flexDirection: "row",
      justifyContent: "space-around",
      gap: 12,
    },
    trustBadge: {
      flex: 1,
      alignItems: "center",
      backgroundColor: c.surface,
      paddingVertical: spacingY._16,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: c.border,
    },
    trustBadgeText: {
      fontSize: fontSize.xs,
      color: c.textSecondary,
      marginTop: spacingY._6,
      textAlign: "center",
    },
    ctaContainer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: c.surface,
      paddingHorizontal: spacingX._20,
      paddingTop: spacingY._16,
      borderTopWidth: 1,
      borderTopColor: c.border,
      ...shadow.lg,
    },
    ctaButton: {
      borderRadius: borderRadius.lg,
      overflow: "hidden",
      ...shadow.primary,
    },
    ctaGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacingY._16,
      gap: 8,
    },
    ctaButtonText: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: "#FFFFFF",
    },
    ctaFootnote: {
      fontSize: fontSize.sm,
      color: c.textMuted,
      textAlign: "center",
      marginTop: spacingY._12,
      marginBottom: spacingY._4,
    },
  });

type Styles = ReturnType<typeof makeStyles>;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  s: Styles;
}

function FeatureCard({ icon, title, description, badge, s }: FeatureCardProps) {
  return (
    <View style={s.featureCard}>
      {badge && (
        <View style={s.featureBadge}>
          <Text style={s.featureBadgeText}>{badge}</Text>
        </View>
      )}
      <View style={s.featureIconContainer}>{icon}</View>
      <Text style={s.featureTitle}>{title}</Text>
      <Text style={s.featureDescription}>{description}</Text>
    </View>
  );
}

interface ComparisonRowProps {
  feature: string;
  kakebe: boolean | string;
  others: boolean | string;
  s: Styles;
  colors: ThemeColors;
}

function ComparisonRow({ feature, kakebe, others, s, colors }: ComparisonRowProps) {
  return (
    <View style={s.comparisonRow}>
      <Text style={s.comparisonFeature}>{feature}</Text>
      <View style={s.comparisonValues}>
        <View style={s.comparisonCell}>
          {typeof kakebe === "boolean" ? (
            <Ionicons
              name={kakebe ? "checkmark-circle" : "close-circle"}
              size={24}
              color={kakebe ? colors.success : colors.error}
            />
          ) : (
            <Text style={s.comparisonText}>{kakebe}</Text>
          )}
        </View>
        <View style={s.comparisonCell}>
          {typeof others === "boolean" ? (
            <Ionicons
              name={others ? "checkmark-circle" : "close-circle"}
              size={24}
              color={others ? colors.success : colors.error}
            />
          ) : (
            <Text style={[s.comparisonText, s.comparisonTextMuted]}>
              {others}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

interface TestimonialProps {
  name: string;
  role: string;
  avatar: string;
  quote: string;
  stats: string;
  s: Styles;
  colors: ThemeColors;
}

function TestimonialCard({ name, role, avatar, quote, stats, s, colors }: TestimonialProps) {
  return (
    <View style={s.testimonialCard}>
      <View style={s.quoteIconContainer}>
        <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />
      </View>
      <Text style={s.testimonialQuote}>"{quote}"</Text>
      <View style={s.testimonialFooter}>
        <View style={s.testimonialAvatar}>
          <Text style={s.testimonialAvatarText}>{avatar}</Text>
        </View>
        <View style={s.testimonialInfo}>
          <Text style={s.testimonialName}>{name}</Text>
          <Text style={s.testimonialRole}>{role}</Text>
        </View>
      </View>
      <View style={s.testimonialStats}>
        <Ionicons name="trending-up" size={16} color={colors.success} />
        <Text style={s.testimonialStatsText}>{stats}</Text>
      </View>
    </View>
  );
}

interface FAQItemProps {
  question: string;
  answer: string;
  isExpanded: boolean;
  onToggle: () => void;
  s: Styles;
  colors: ThemeColors;
}

function FAQItem({ question, answer, isExpanded, onToggle, s, colors }: FAQItemProps) {
  return (
    <TouchableOpacity style={s.faqItem} onPress={onToggle} activeOpacity={0.7}>
      <View style={s.faqHeader}>
        <Text style={s.faqQuestion}>{question}</Text>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.textSecondary}
        />
      </View>
      {isExpanded && <Text style={s.faqAnswer}>{answer}</Text>}
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function SellerBenefitsScreen() {
  const colors = useThemeColors();
  const s = useMemo(() => makeStyles(colors), [colors]);

  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const handleGetStarted = () => router.push("/merchant/apply/signup");
  const handleContactSupport = () => router.push("/merchant/merchant-support");
  const toggleFAQ = (index: number) =>
    setExpandedFAQ(expandedFAQ === index ? null : index);

  const faqs = [
    {
      question: "How much does it cost to sell on Kakebe?",
      answer:
        "It's completely free to list your products! We only charge a small 5% commission when you make a sale. There are no monthly fees, subscription costs, or hidden charges.",
    },
    {
      question: "How do I get paid?",
      answer:
        "Once your order is confirmed and delivered, funds are transferred directly to your linked mobile money account or bank account within 24-48 hours. You can track all your earnings in the seller dashboard.",
    },
    {
      question: "What can I sell on Kakebe?",
      answer:
        "You can sell almost anything! From fashion and electronics to handmade crafts and home goods. We only restrict illegal items, counterfeit products, and items that violate our community guidelines.",
    },
    {
      question: "How do I handle shipping?",
      answer:
        "You can either arrange your own shipping or use our integrated delivery partners at discounted rates. We provide shipping labels and tracking for all orders.",
    },
    {
      question: "What support do I get as a seller?",
      answer:
        "You get 24/7 customer support via chat, email, or phone. Plus access to our seller academy with tutorials, best practices, and tips to grow your business.",
    },
  ];

  return (
    <View style={s.container}>
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={s.header}
      >
        <SafeAreaView edges={["top"]}>
          <View style={s.headerContent}>
            <TouchableOpacity
              style={s.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Why Sell on Kakebe?</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={s.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* Hero Stats */}
        <View style={s.heroStats}>
          <View style={s.heroStatItem}>
            <Text style={s.heroStatNumber}>10,000+</Text>
            <Text style={s.heroStatLabel}>Active Buyers</Text>
          </View>
          <View style={s.heroStatDivider} />
          <View style={s.heroStatItem}>
            <Text style={s.heroStatNumber}>500+</Text>
            <Text style={s.heroStatLabel}>Sellers Earning</Text>
          </View>
          <View style={s.heroStatDivider} />
          <View style={s.heroStatItem}>
            <Text style={s.heroStatNumber}>95%</Text>
            <Text style={s.heroStatLabel}>Satisfaction</Text>
          </View>
        </View>

        {/* Main Benefits */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Everything You Need to Succeed</Text>

          <View style={s.featuresGrid}>
            <FeatureCard
              s={s}
              icon={<Ionicons name="pricetag-outline" size={32} color={colors.primary} />}
              title="Zero Listing Fees"
              description="List unlimited products for free. Only pay 5% commission on sales."
              badge="Popular"
            />
            <FeatureCard
              s={s}
              icon={<Ionicons name="people-outline" size={32} color={colors.primary} />}
              title="Huge Audience"
              description="Get instant access to 10,000+ active buyers searching daily."
            />
            <FeatureCard
              s={s}
              icon={<Ionicons name="shield-checkmark-outline" size={32} color={colors.primary} />}
              title="Secure Payments"
              description="Get paid safely via mobile money or bank transfer within 48 hours."
            />
            <FeatureCard
              s={s}
              icon={<Ionicons name="trending-up-outline" size={32} color={colors.primary} />}
              title="Sales Analytics"
              description="Track performance with detailed insights and reports."
            />
            <FeatureCard
              s={s}
              icon={<MaterialCommunityIcons name="truck-fast-outline" size={32} color={colors.primary} />}
              title="Easy Shipping"
              description="Integrated delivery partners with discounted rates."
              badge="New"
            />
            <FeatureCard
              s={s}
              icon={<Ionicons name="chatbubbles-outline" size={32} color={colors.primary} />}
              title="24/7 Support"
              description="Get help anytime via chat, email, or phone support."
            />
          </View>
        </View>

        {/* Comparison Section */}
        <View style={[s.section, s.comparisonSection]}>
          <Text style={s.sectionTitle}>How We Compare</Text>
          <Text style={s.sectionSubtitle}>
            See why sellers choose Kakebe over other platforms
          </Text>

          <View style={s.comparisonTable}>
            <View style={s.comparisonHeader}>
              <Text style={s.comparisonHeaderText}>Feature</Text>
              <View style={s.comparisonHeaderValues}>
                <View style={s.comparisonHeaderCell}>
                  <MaterialCommunityIcons name="store-check" size={20} color={colors.primary} />
                  <Text style={s.comparisonHeaderLabel}>Kakebe</Text>
                </View>
                <View style={s.comparisonHeaderCell}>
                  <Text style={s.comparisonHeaderLabelMuted}>Others</Text>
                </View>
              </View>
            </View>

            <ComparisonRow s={s} colors={colors} feature="Listing Fee" kakebe="Free" others="$0.20+" />
            <ComparisonRow s={s} colors={colors} feature="Commission" kakebe="5%" others="10-15%" />
            <ComparisonRow s={s} colors={colors} feature="Payment Time" kakebe="24-48h" others="7-14 days" />
            <ComparisonRow s={s} colors={colors} feature="Local Support" kakebe={true} others={false} />
            <ComparisonRow s={s} colors={colors} feature="Seller Academy" kakebe={true} others={false} />
            <ComparisonRow s={s} colors={colors} feature="Marketing Tools" kakebe={true} others="Paid" />
          </View>
        </View>

        {/* Success Stories */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Success Stories</Text>
          <Text style={s.sectionSubtitle}>Real sellers sharing their experience</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.testimonialsContainer}
          >
            <TestimonialCard
              s={s}
              colors={colors}
              name="Sarah Nalubega"
              role="Fashion Boutique"
              avatar="SN"
              quote="I've tripled my sales in just 3 months. The platform is so easy to use and customer support is amazing!"
              stats="200% sales increase"
            />
            <TestimonialCard
              s={s}
              colors={colors}
              name="James Okello"
              role="Electronics Seller"
              avatar="JO"
              quote="Best decision for my business. I reach more customers than my physical store ever did."
              stats="500+ orders completed"
            />
            <TestimonialCard
              s={s}
              colors={colors}
              name="Grace Namukasa"
              role="Home Decor"
              avatar="GN"
              quote="The analytics help me understand what sells best. I've optimized my inventory and profits are up!"
              stats="₦2M+ in sales"
            />
          </ScrollView>
        </View>

        {/* Getting Started Steps */}
        <View style={[s.section, s.stepsSection]}>
          <Text style={s.sectionTitle}>Get Started in 3 Easy Steps</Text>

          <View style={s.stepsList}>
            <View style={s.stepItem}>
              <View style={s.stepCircle}>
                <Text style={s.stepNumber}>1</Text>
              </View>
              <View style={s.stepContent}>
                <Text style={s.stepTitle}>Create Your Account</Text>
                <Text style={s.stepDescription}>
                  Sign up with basic information. Takes less than 2 minutes.
                </Text>
              </View>
            </View>

            <View style={s.stepConnector} />

            <View style={s.stepItem}>
              <View style={s.stepCircle}>
                <Text style={s.stepNumber}>2</Text>
              </View>
              <View style={s.stepContent}>
                <Text style={s.stepTitle}>List Your First Product</Text>
                <Text style={s.stepDescription}>
                  Add photos, description, and price. We'll guide you through it.
                </Text>
              </View>
            </View>

            <View style={s.stepConnector} />

            <View style={s.stepItem}>
              <View style={s.stepCircle}>
                <Text style={s.stepNumber}>3</Text>
              </View>
              <View style={s.stepContent}>
                <Text style={s.stepTitle}>Start Making Sales</Text>
                <Text style={s.stepDescription}>
                  Your products go live instantly. Watch the orders roll in!
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* FAQ Section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Frequently Asked Questions</Text>

          <View style={s.faqList}>
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                s={s}
                colors={colors}
                question={faq.question}
                answer={faq.answer}
                isExpanded={expandedFAQ === index}
                onToggle={() => toggleFAQ(index)}
              />
            ))}
          </View>

          <TouchableOpacity style={s.supportLink} onPress={handleContactSupport}>
            <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
            <Text style={s.supportLinkText}>Still have questions? Contact Support</Text>
          </TouchableOpacity>
        </View>

        {/* Trust Badges */}
        <View style={s.trustSection}>
          <View style={s.trustBadges}>
            <View style={s.trustBadge}>
              <Ionicons name="shield-checkmark" size={24} color={colors.success} />
              <Text style={s.trustBadgeText}>Secure Platform</Text>
            </View>
            <View style={s.trustBadge}>
              <Ionicons name="lock-closed" size={24} color={colors.success} />
              <Text style={s.trustBadgeText}>Data Protected</Text>
            </View>
            <View style={s.trustBadge}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              <Text style={s.trustBadgeText}>Verified Buyers</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed CTA */}
      <View style={s.ctaContainer}>
        <SafeAreaView edges={["bottom"]}>
          <TouchableOpacity
            style={s.ctaButton}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={s.ctaGradient}
            >
              <Text style={s.ctaButtonText}>Start Selling Now</Text>
              <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
          <Text style={s.ctaFootnote}>Free forever • No credit card required</Text>
        </SafeAreaView>
      </View>
    </View>
  );
}
