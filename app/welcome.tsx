import CustomButton from "@/components/CustomButton";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { ImageBackground } from "expo-image";
import { router } from "expo-router";
import { StyleSheet, View, Dimensions, ScrollView } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { useEffect, useState } from "react";
import SocialAuthButtons from "@/components/SocialAuthButtons";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

const carouselDataRow1 = [
  {
    id: 1,
    image: require("@/assets/images/grocery_collection.jpg"),
  },
  {
    id: 2,
    image: require("@/assets/images/shoes_collection.jpg"),
  },
  {
    id: 3,
    image: require("@/assets/images/shopping_collection.jpg"),
  },
  {
    id: 4,
    image: require("@/assets/images/fashion_collection.jpg"),
  },
  {
    id: 5,
    image: require("@/assets/images/grocery_collection.jpg"),
  },
  {
    id: 6,
    image: require("@/assets/images/shoes_collection.jpg"),
  },
];

// Shuffled version for second row
const carouselDataRow2 = [
  {
    id: 3,
    image: require("@/assets/images/shopping_collection.jpg"),
  },
  {
    id: 1,
    image: require("@/assets/images/grocery_collection.jpg"),
  },
  {
    id: 4,
    image: require("@/assets/images/fashion_collection.jpg"),
  },
  {
    id: 6,
    image: require("@/assets/images/shoes_collection.jpg"),
  },
  {
    id: 2,
    image: require("@/assets/images/shoes_collection.jpg"),
  },
  {
    id: 5,
    image: require("@/assets/images/grocery_collection.jpg"),
  },
];

export default function WelcomeScreen() {
  const translateX = useSharedValue(0);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  useEffect(() => {
    // Continuous horizontal scroll animation
    translateX.value = withRepeat(
      withTiming(-width * 0.5, {
        duration: 15000,
        easing: Easing.linear,
      }),
      -1, // infinite repeat
      false
    );
  }, []);

  const animatedCarouselStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Grid-based Carousel Section */}
      <View style={styles.carouselContainer}>
        <Animated.View style={styles.carouselWrapper}>
          {/* First Row */}
          <Animated.View 
            style={[styles.carouselRow, animatedCarouselStyle]}
          >
            {[...carouselDataRow1, ...carouselDataRow1].map((item, index) => (
              <View key={`row1-${index}`} style={styles.imageCard}>
                <ImageBackground
                  source={item.image}
                  style={styles.cardImage}
                  contentFit="cover"
                >
                  <View style={styles.imageOverlay} />
                </ImageBackground>
              </View>
            ))}
          </Animated.View>

          {/* Second Row - Reversed direction */}
          <Animated.View 
            style={[
              styles.carouselRow, 
              useAnimatedStyle(() => ({
                transform: [{ translateX: -translateX.value }],
              }))
            ]}
          >
            {[...carouselDataRow2, ...carouselDataRow2].map((item, index) => (
              <View key={`row2-${index}`} style={styles.imageCard}>
                <ImageBackground
                  source={item.image}
                  style={styles.cardImage}
                  contentFit="cover"
                >
                  <View style={styles.imageOverlay} />
                </ImageBackground>
              </View>
            ))}
          </Animated.View>
        </Animated.View>

        {/* Gradient Overlay at Bottom */}
        <View style={styles.gradientOverlay} />
      </View>

      {/* Content Section */}
      <View style={styles.contentSection}>
        {/* Welcome Text */}
        <View style={styles.welcomeContainer}>
          <Typo size={32} fontWeight="700" style={styles.welcomeTitle}>
            Welcome to Cookly 👋
          </Typo>
          <Typo size={15} color={colors.neutral600} style={styles.welcomeSubtitle}>
            The best cooking and food recipes app of the century.
          </Typo>
        </View>

        {/* Social Auth Buttons */}
        <View style={styles.authContainer}>
          <SocialAuthButtons 
            isGoogleLoading={isGoogleLoading}
            isAppleLoading={isAppleLoading}
            setIsGoogleLoading={setIsGoogleLoading}
            setIsAppleLoading={setIsAppleLoading}
            showSocialAuth={true}
          />

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Typo size={14} color={colors.neutral500} style={styles.dividerText}>
              Or sign up with
            </Typo>
            <View style={styles.dividerLine} />
          </View>

          {/* Email Signup Button */}
          <CustomButton
            onPress={() => router.push("/(auth)/login")}
            style={styles.emailButton}
          >
          <MaterialCommunityIcons name="email" color={"#FFF"} size={20} />
            <Typo size={16} color={colors.white} fontWeight="600">
              Sign Up with email
            </Typo>
          </CustomButton>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Typo size={14} color={colors.neutral600}>
              Already have an account?{" "}
            </Typo>
            <CustomButton
              onPress={() => router.push("/(auth)/login")}
              style={styles.loginButton}
            >
              <Typo size={14} color={colors.primary} fontWeight="600">
                Log In
              </Typo>
            </CustomButton>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
  },
  carouselContainer: {
    height: height * 0.45,
    position: "relative",
    overflow: "hidden",
  },
  carouselWrapper: {
    flex: 1,
    gap: 12,
    paddingTop: spacingY._20,
  },
  carouselRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: spacingX._16,
  },
  imageCard: {
    width: width * 0.42,
    height: (height * 0.45 - 40) / 2,
    borderRadius: 16,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "transparent",
    borderTopWidth: 0,
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 1,
    shadowRadius: 30,
  },
  contentSection: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._30,
    paddingBottom: spacingY._40,
    justifyContent: "space-between",
  },
  welcomeContainer: {
    alignItems: "center",
    marginBottom: spacingY._30,
  },
  welcomeTitle: {
    textAlign: "center",
    color: colors.black,
    marginBottom: spacingY._10,
    lineHeight: 38,
  },
  welcomeSubtitle: {
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: spacingX._16,
  },
  authContainer: {
    width: "100%",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacingY._25,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral300,
  },
  dividerText: {
    paddingHorizontal: spacingX._12,
  },
  emailButton: {
    backgroundColor: colors.black,
    paddingVertical: spacingY._16,
    borderRadius: 12,
    marginBottom: spacingY._16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacingY._8,
  },
  loginButton: {
    backgroundColor: "transparent",
    padding: 0,
  },
});