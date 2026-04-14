import SocialAuthButtons from "@/components/SocialAuthButtons";
import { Text } from "@/components/Text";
import { MaterialCommunityIcons } from "@expo/vector-icons"; import { router } from "expo-router"; import { useEffect, useState } from "react"; import { Dimensions, Image, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  FadeInUp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { darkColors, borderRadius as themeRadius, fontSize as themeFontSize, spacingX, spacingY } from "@/constants/theme";

// ─── Dimensions ───────────────────────────────────────────────────────────────
const { width } = Dimensions.get("window");

// ─── Theme Aliases ────────────────────────────────────────────────────────────
const C            = darkColors;
const primaryMuted = "rgba(255, 84, 0, 0.12)";
const primaryGlow  = "rgba(255, 84, 0, 0.28)";

// ─── Carousel Data ────────────────────────────────────────────────────────────
const ROW_1 = [
  { id: 1, image: require("@/assets/images/grocery_collection.jpg") },
  { id: 2, image: require("@/assets/images/shoes_collection.jpg") },
  { id: 3, image: require("@/assets/images/shopping_collection.jpg") },
  { id: 4, image: require("@/assets/images/fashion_collection.jpg") },
  { id: 5, image: require("@/assets/images/grocery_collection.jpg") },
  { id: 6, image: require("@/assets/images/shoes_collection.jpg") },
];


// ─── Card dimensions ──────────────────────────────────────────────────────────
const CARD_W   = width * 0.62;
const CARD_GAP = 12;
const CARD_H   = Math.round(CARD_W * 0.68); // ~3:2 aspect ratio, height follows width

// ─── Cycling headline data ────────────────────────────────────────────────────
const CYCLE_ITEMS = [
  { text: "KakebeShop",                          accent: true  },
  { text: "Fresh groceries, delivered.",         accent: false },
  { text: "KakebeShop",                          accent: true  },
  { text: "Shop fashion & electronics.",         accent: false },
  { text: "KakebeShop",                          accent: true  },
  { text: "Trusted sellers. Best prices.",       accent: false },
  { text: "KakebeShop",                          accent: true  },
  { text: "Delivered fast across Uganda.",       accent: false },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function PillBadge() {
  return (
    <View style={styles.pill}>
      <View style={styles.pillDot} />
      <Text style={styles.pillText}>Uganda's #1 Marketplace</Text>
    </View>
  );
}

function CyclingHeadline() {
  const [idx, setIdx] = useState(0);
  const opacity = useSharedValue(1);
  const idxSV = useSharedValue(0); // track current index on UI thread
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useEffect(() => {
    const id = setInterval(() => {
      opacity.value = withTiming(0, { duration: 380 }, (done) => {
        'worklet';
        if (done) {
          const next = (idxSV.value + 1) % CYCLE_ITEMS.length;
          idxSV.value = next;
          runOnJS(setIdx)(next); // pass a plain number, not a function
          opacity.value = withTiming(1, { duration: 380 });
        }
      });
    }, 2600);
    return () => clearInterval(id);
  }, []);

  const { text, accent } = CYCLE_ITEMS[idx];
  return (
    <Animated.View style={[styles.cycleContainer, animStyle]}>
      <Text style={[styles.cycleText, accent ? styles.cycleAccent : null]}>
        {text}
      </Text>
    </Animated.View>
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
  const tx1 = useSharedValue(0);

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading]   = useState(false);

  useEffect(() => {
    // Animate exactly one set-width so the duplicate seamlessly loops
    const loopDist = -(CARD_W + CARD_GAP) * ROW_1.length;
    tx1.value = withRepeat(withTiming(loopDist, { duration: 24000, easing: Easing.linear }), -1, false);
  }, []);

  const row1Style = useAnimatedStyle(() => ({ transform: [{ translateX: tx1.value }] }));

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Carousel ─────────────────────────────────────────────────────── */}
        <View style={styles.carouselSection}>
          <Animated.View style={[styles.row, row1Style]}>
            {[...ROW_1, ...ROW_1].map((item, i) => (
              <View key={`r1-${i}`} style={styles.card}>
                <Image source={item.image} style={StyleSheet.absoluteFill} resizeMode="cover" />
                <View style={styles.cardOverlay} />
              </View>
            ))}
          </Animated.View>
        </View>

        {/* ── Content ──────────────────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInUp.duration(400)}
          style={styles.content}
        >
          {/* Badge */}
          <PillBadge />

          {/* Headline */}
          <View style={styles.headlineBlock}>
            <CyclingHeadline />
            <Text style={styles.subtitle}>
            Buy, Sell & Discover Anything in Uganda.{"\n"}
            From Products to Services — Fast, Easy, Trusted.
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
              color={C.background}
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

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.background,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // ── Carousel ──────────────────────────────────────────────────────────────
  carouselSection: {
    height: CARD_H + spacingY._20 * 2,
    overflow: "hidden",
    paddingVertical: spacingY._20,
  },
  row: {
    flexDirection: "row",
    gap: CARD_GAP,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    overflow: "hidden",
    backgroundColor: C.surface,
    borderRadius: 8
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  fadeLeft: {
    position: "absolute",
    top: 0, bottom: 0, left: 0,
    width: spacingX._32,
    backgroundColor: C.background,
    opacity: 0.85,
  },
  fadeRight: {
    position: "absolute",
    top: 0, bottom: 0, right: 0,
    width: spacingX._32,
    backgroundColor: C.background,
    opacity: 0.85,
  },

  // ── Content ───────────────────────────────────────────────────────────────
  content: {
    flex: 1,
    paddingHorizontal: spacingX._24,
    paddingTop: spacingY._4,
    paddingBottom: spacingX._32,
    gap: spacingY._17,
  },

  // Badge
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._7,
    alignSelf: "center",
    backgroundColor: primaryMuted,
    borderColor: primaryGlow,
    borderWidth: 1,
    borderRadius: themeRadius.full,
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._6,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.primary,
  },
  pillText: {
    fontSize: themeFontSize.xs,
    fontWeight: "600",
    color: C.primaryLight,
    letterSpacing: 0.3,
  },

  // Headline
  headlineBlock: {
    gap: spacingY._8,
    alignItems: "center",
  },
  cycleContainer: {
    minHeight: 76, // reserves space for 2 lines (lineHeight 38 × 2) — prevents layout shift
    justifyContent: "center",
    alignItems: "center",
  },
  cycleText: {
    fontSize: 32,
    fontWeight: "800",
    color: C.text,
    lineHeight: 38,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  cycleAccent: {
    color: C.primary,
  },
  subtitle: {
    fontSize: themeFontSize.md,
    color: C.textMuted,
    lineHeight: 21,
    fontWeight: "400",
    textAlign: "center",
  },

  // Divider
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._10,
    marginVertical: -spacingY._4,
  },
  divLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  divText: {
    fontSize: themeFontSize.sm,
    color: C.textPlaceholder,
    fontWeight: "500",
    letterSpacing: 0.2,
  },

  // Email CTA
  emailBtn: {
    height: spacingY._50,
    borderRadius:10,
    backgroundColor: C.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacingX._8,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },
  emailBtnText: {
    fontSize: themeFontSize.lg,
    fontWeight: "700",
    color: C.background,
    letterSpacing: 0.1,
  },

  // Login
  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -spacingY._4,
  },
  loginHint: {
    fontSize: themeFontSize.sm,
    color: C.textMuted,
  },
  loginLink: {
    fontSize: themeFontSize.sm,
    fontWeight: "700",
    color: C.primary,
  },

  // Terms
  terms: {
    fontSize: themeFontSize.xs,
    color: C.textPlaceholder,
    textAlign: "center",
    lineHeight: 17,
    marginTop: "auto",
  },
  termsLink: {
    color: C.textMuted,
    textDecorationLine: "underline",
  },
});