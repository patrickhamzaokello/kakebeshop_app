import CustomButton from "@/components/CustomButton";
import SocialAuthButtons from "@/components/SocialAuthButtons";
import { Text } from "@/components/Text";
import { MaterialCommunityIcons } from "@expo/vector-icons"; import { ImageBackground } from "expo-image"; import { router } from "expo-router"; import { useEffect, useState } from "react"; import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Dimensions ───────────────────────────────────────────────────────────────
const { width, height } = Dimensions.get("window");

// ─── Design Tokens ───────────────────────────────────────────────────────────
const theme = {
  bg:          "#0D0D0D",
  surface:     "#1E1E1E",
  border:      "#2A2A2A",
  accent:      "#C9A84C",
  accentLight: "#E8C97A",
  accentMuted: "rgba(201,168,76,0.12)",
  accentGlow:  "rgba(201,168,76,0.28)",
  text:        "#F5F0E8",
  textMuted:   "#8A8478",
  textSubtle:  "#5A5650",
};

// ─── Carousel Data ────────────────────────────────────────────────────────────
const ROW_1 = [
  { id: 1, image: require("@/assets/images/grocery_collection.jpg") },
  { id: 2, image: require("@/assets/images/shoes_collection.jpg") },
  { id: 3, image: require("@/assets/images/shopping_collection.jpg") },
  { id: 4, image: require("@/assets/images/fashion_collection.jpg") },
  { id: 5, image: require("@/assets/images/grocery_collection.jpg") },
  { id: 6, image: require("@/assets/images/shoes_collection.jpg") },
];

const ROW_2 = [
  { id: 3, image: require("@/assets/images/shopping_collection.jpg") },
  { id: 1, image: require("@/assets/images/grocery_collection.jpg") },
  { id: 4, image: require("@/assets/images/fashion_collection.jpg") },
  { id: 6, image: require("@/assets/images/shoes_collection.jpg") },
  { id: 2, image: require("@/assets/images/shoes_collection.jpg") },
  { id: 5, image: require("@/assets/images/grocery_collection.jpg") },
];

// ─── Card dimensions ──────────────────────────────────────────────────────────
const CAROUSEL_H = height * 0.42;
const CARD_W     = width * 0.42;
const CARD_H     = (CAROUSEL_H - 56) / 2;

// ─── Sub-components ───────────────────────────────────────────────────────────
function PillBadge() {
  return (
    <View style={styles.pill}>
      <View style={styles.pillDot} />
      <Text style={styles.pillText}>Uganda's #1 Marketplace</Text>
    </View>
  );
}

function OrDivider() {
  return (
    <View style={styles.divider}>
      <View style={styles.divLine} />
      <Text style={styles.divText}>or continue with</Text>
      <View style={styles.divLine} />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function WelcomeScreen() {
  const translateX = useSharedValue(0);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading]   = useState(false);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(-width * 0.5, {
        duration: 18000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const row1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const row2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: -translateX.value }],
  }));

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <SafeAreaView style={{ flex: 1 }}>

        {/* ── Carousel ─────────────────────────────────────────────────────── */}
        <View style={styles.carouselSection}>
          <View style={styles.carouselWrap}>

            {/* Row 1 — scrolls left */}
            <Animated.View style={[styles.row, row1Style]}>
              {[...ROW_1, ...ROW_1].map((item, i) => (
                <View key={`r1-${i}`} style={styles.card}>
                  <ImageBackground
                    source={item.image}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  >
                    <View style={styles.cardOverlay} />
                  </ImageBackground>
                </View>
              ))}
            </Animated.View>

            {/* Row 2 — scrolls right */}
            <Animated.View style={[styles.row, row2Style]}>
              {[...ROW_2, ...ROW_2].map((item, i) => (
                <View key={`r2-${i}`} style={styles.card}>
                  <ImageBackground
                    source={item.image}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  >
                    <View style={styles.cardOverlay} />
                  </ImageBackground>
                </View>
              ))}
            </Animated.View>
          </View>

          {/* Fade edges — dissolve carousel into bg on all sides */}
          <View style={styles.fadeTop} />
          <View style={styles.fadeBottom} />
          <View style={styles.fadeLeft} />
          <View style={styles.fadeRight} />
        </View>

        {/* ── Content ──────────────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInUp.delay(150).duration(600)}
          style={styles.content}
        >
          {/* Badge */}
          <PillBadge />

          {/* Headline */}
          <View style={styles.headlineBlock}>
            <Text style={styles.headline}>
              Shop Everything,{"\n"}
              <Text style={styles.headlineAccent}>Everywhere.</Text>
            </Text>
            <Text style={styles.subtitle}>
              Millions of products. Trusted sellers.{"\n"}
              Delivered fast across Uganda.
            </Text>
          </View>

          {/* Social auth (Google / Apple) */}
          <SocialAuthButtons
            isGoogleLoading={isGoogleLoading}
            isAppleLoading={isAppleLoading}
            setIsGoogleLoading={setIsGoogleLoading}
            setIsAppleLoading={setIsAppleLoading}
            showSocialAuth={true}
          />

          <OrDivider />

          {/* Primary CTA */}
          <TouchableOpacity
            style={styles.emailBtn}
            onPress={() => router.push("/(auth)/register")}
            activeOpacity={0.82}
          >
            <MaterialCommunityIcons
              name="email-outline"
              color={theme.bg}
              size={18}
            />
            <Text style={styles.emailBtnText}>Sign up with Email</Text>
          </TouchableOpacity>

          {/* Login row */}
          <View style={styles.loginRow}>
            <Text style={styles.loginHint}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/login")}
              activeOpacity={0.7}
            >
              <Text style={styles.loginLink}>Log In</Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text style={styles.terms}>
            By continuing you agree to our{" "}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {" "}&amp;{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </Animated.View>

      </SafeAreaView>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // ── Carousel ──────────────────────────────────────────────────────────────
  carouselSection: {
    height: CAROUSEL_H,
    overflow: "hidden",
    position: "relative",
  },
  carouselWrap: {
    flex: 1,
    gap: 10,
    paddingTop: 34,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: theme.surface,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
  },

  // Fade edges — all use solid bg color so they work on both platforms
  fadeTop: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: 60,
    backgroundColor: theme.bg,
    opacity: 0.95,
  },
  fadeBottom: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    height: 110,
    backgroundColor: theme.bg,
    opacity: 0.97,
  },
  fadeLeft: {
    position: "absolute",
    top: 0, bottom: 0, left: 0,
    width: 28,
    backgroundColor: theme.bg,
    opacity: 0.75,
  },
  fadeRight: {
    position: "absolute",
    top: 0, bottom: 0, right: 0,
    width: 28,
    backgroundColor: theme.bg,
    opacity: 0.75,
  },

  // ── Content ───────────────────────────────────────────────────────────────
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 32,
    gap: 18,
  },

  // Badge
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    alignSelf: "center",
    backgroundColor: theme.accentMuted,
    borderColor: theme.accentGlow,
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.accent,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.accentLight,
    letterSpacing: 0.3,
  },

  // Headline
  headlineBlock: {
    gap: 8,
  },
  headline: {
    fontSize: 32,
    fontWeight: "800",
    color: theme.text,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  headlineAccent: {
    color: theme.accent,
  },
  subtitle: {
    fontSize: 14,
    color: theme.textMuted,
    lineHeight: 21,
    fontWeight: "400",
  },

  // Divider
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: -4,
  },
  divLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.border,
  },
  divText: {
    fontSize: 12,
    color: theme.textSubtle,
    fontWeight: "500",
    letterSpacing: 0.2,
  },

  // Email CTA
  emailBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: theme.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    // iOS glow
    shadowColor: theme.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    // Android elevation
    elevation: 10,
  },
  emailBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.bg,
    letterSpacing: 0.1,
  },

  // Login
  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -4,
  },
  loginHint: {
    fontSize: 13,
    color: theme.textMuted,
  },
  loginLink: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.accent,
  },

  // Terms
  terms: {
    fontSize: 11,
    color: theme.textSubtle,
    textAlign: "center",
    lineHeight: 17,
    marginTop: "auto",
  },
  termsLink: {
    color: theme.textMuted,
    textDecorationLine: "underline",
  },
});