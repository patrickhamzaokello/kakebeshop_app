import SocialAuthButtons from "@/components/SocialAuthButtons";
import { Text } from "@/components/Text";
import { Feather, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  darkColors,
  fontSize as themeFontSize,
  spacingX,
  spacingY,
} from "@/constants/theme";

const { width } = Dimensions.get("window");
const C = darkColors;

// ─── Data ─────────────────────────────────────────────────────────────────────
const TRUST = [
  { icon: "lock"       as const, label: "Secure Pay"    },
  { icon: "zap"        as const, label: "Fast Delivery" },
  { icon: "refresh-cw" as const, label: "Easy Returns"  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function TrustItem({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
}) {
  return (
    <View style={styles.trustItem}>
      <Feather name={icon} size={13} color={C.primary} />
      <Text style={styles.trustLabel}>{label}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function WelcomeScreen() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading]   = useState(false);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Background — light */}
      <LinearGradient
        colors={["#ffffff", "#f5f5f5", "#f0f0f0"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea}>

        {/* ── Top content ───────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(600)}
          style={styles.topSection}
        >
          {/* Logo — centered */}
          <View style={styles.logoSection}>
            <Image
              source={require("@/assets/icons/ios-dark.png")}
              style={styles.appIcon}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>KakebeShop</Text>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>Uganda</Text>
            </View>
          </View>

          {/* Hero headline */}
          <View style={styles.heroBlock}>
            <Text style={styles.headline}>Buy. Sell.{"\n"}Discover.</Text>
            <Text style={styles.subheadline}>
              Thousands of products from trusted sellers across Uganda — fashion,
              electronics, groceries &amp; more.
            </Text>
          </View>

          {/* Star rating — 4 full + 1 half for 4.8 */}
          <View style={styles.ratingRow}>
            {[1,2,3,4].map(i => (
              <MaterialIcons key={i} name="star" size={14} color="#FFC107" />
            ))}
            <MaterialIcons name="star-half" size={14} color="#FFC107" />
            <Text style={styles.ratingText}>4.8 · 50,000+ shoppers</Text>
          </View>
        </Animated.View>

        {/* ── Auth section ──────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(600)}
          style={styles.authSection}
        >
          {/* Trust bar */}
          <View style={styles.trustBar}>
            {TRUST.map((t, i) => (
              <View key={t.label} style={styles.trustRow}>
                <TrustItem icon={t.icon} label={t.label} />
                {i < TRUST.length - 1 && <View style={styles.trustSep} />}
              </View>
            ))}
          </View>

          {/* Sign In — primary CTA */}
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => router.push("/(auth)/login")}
            activeOpacity={0.85}
          >
            <Text style={styles.signInText}>Sign In</Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </TouchableOpacity>

          {/* Social sign-up */}
          <View style={styles.divider}>
            <View style={styles.divLine} />
            <Text style={styles.divText}>New customer? Create account</Text>
            <View style={styles.divLine} />
          </View>

          <SocialAuthButtons
            isGoogleLoading={isGoogleLoading}
            isAppleLoading={isAppleLoading}
            setIsGoogleLoading={setIsGoogleLoading}
            setIsAppleLoading={setIsAppleLoading}
            showSocialAuth={true}
          />

          <TouchableOpacity
            style={styles.emailBtn}
            onPress={() => router.push("/(auth)/register")}
            activeOpacity={0.84}
          >
            <MaterialCommunityIcons name="email-outline" size={17} color={C.primary} />
            <Text style={styles.emailBtnText}>Sign up with Email</Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.terms}>
            By continuing you agree to our{" "}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {" & "}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </Animated.View>

      </SafeAreaView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  safeArea: {
    flex: 1,
    justifyContent: "space-between",
  },

  // ── Top section ─────────────────────────────────────────────────────────────
  topSection: {
    paddingHorizontal: spacingX._24,
    paddingTop: spacingY._20,
    gap: spacingY._17,
    alignItems: "center",
  },

  // Logo — centered
  logoSection: {
    alignItems: "center",
    gap: spacingY._8,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 18,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111111",
    letterSpacing: -0.3,
  },
  badgePill: {
    backgroundColor: "#efefef",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(0,0,0,0.45)",
    letterSpacing: 0.3,
  },

  // Hero
  heroBlock: {
    gap: spacingY._8,
    alignItems: "center",
  },
  headline: {
    fontSize: 46,
    fontWeight: "900",
    color: "#111111",
    lineHeight: 50,
    letterSpacing: -1.5,
    textAlign: "center",
  },
  subheadline: {
    fontSize: themeFontSize.sm,
    color: "rgba(0,0,0,0.46)",
    lineHeight: 20,
    fontWeight: "400",
    textAlign: "center",
  },

  // Rating
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: "rgba(0,0,0,0.45)",
    fontWeight: "500",
    marginLeft: 4,
  },

  // ── Auth section ────────────────────────────────────────────────────────────
  authSection: {
    paddingHorizontal: spacingX._24,
    paddingBottom: spacingY._20,
    gap: spacingY._12,
  },

  // Trust bar
  trustBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e4e4e4",
    paddingVertical: spacingY._10,
    paddingHorizontal: spacingX._12,
    gap: 0,
  },
  trustRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  trustItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  trustLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(0,0,0,0.50)",
  },
  trustSep: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(0,0,0,0.12)",
    marginHorizontal: 4,
  },

  // Sign In
  signInBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: C.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacingX._8,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  signInText: {
    fontSize: themeFontSize.lg,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },

  // Divider
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._8,
  },
  divLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(0,0,0,0.10)",
  },
  divText: {
    fontSize: 11,
    color: "rgba(0,0,0,0.35)",
    fontWeight: "500",
  },

  // Email
  emailBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacingX._8,
  },
  emailBtnText: {
    fontSize: themeFontSize.md,
    fontWeight: "600",
    color: C.primary,
  },

  // Terms
  terms: {
    fontSize: 10,
    color: "rgba(0,0,0,0.30)",
    textAlign: "center",
    lineHeight: 15,
  },
  termsLink: {
    color: "rgba(0,0,0,0.50)",
    textDecorationLine: "underline",
  },
});
