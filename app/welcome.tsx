import CustomButton from "@/components/CustomButton";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { ImageBackground } from "expo-image";
import { router } from "expo-router";
import { StyleSheet, View, Dimensions } from "react-native";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useEffect, useRef } from "react";

const { width, height } = Dimensions.get("window");

const carouselData = [
  {
    id: 1,
    image: require("@/assets/images/welcomefour.png"),
    heading: "Everything in One Place",
    description: "Discover products, services, and offers from trusted sellers — all in one convenient marketplace."
  },
  {
    id: 2,
    image: require("@/assets/images/welcomefour.png"),
    heading: "Connect with Local Sellers",
    description: "Find and interact with merchants near you, from shops and restaurants to service providers."
  },
  {
    id: 3,
    image: require("@/assets/images/welcomefour.png"),
    heading: "Order with Ease",
    description: "Browse, add to cart, and place orders seamlessly for food, products, or services anytime."
  },
  {
    id: 4,
    image: require("@/assets/images/welcomefour.png"),
    heading: "Deals You’ll Love",
    description: "Stay updated with new listings, promotions, and featured offers as soon as they go live."
  },
  
];

export default function WelcomeScreen() {
  const translateX = useSharedValue(0);
  const currentIndex = useSharedValue(0);
  const contextX = useSharedValue(0); // Store context for gesture
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoSlide = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      currentIndex.value = (currentIndex.value + 1) % carouselData.length;
      translateX.value = withTiming(-currentIndex.value * width, { 
        duration: 500 
      });
    }, 4000);
  };

  const stopAutoSlide = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    startAutoSlide();
    return () => stopAutoSlide();
  }, []);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextX.value = translateX.value;
      runOnJS(stopAutoSlide)();
    })
    .onUpdate((event) => {
      // Allow free dragging with boundaries
      const newTranslateX = contextX.value + event.translationX;
      const maxTranslate = 0;
      const minTranslate = -(carouselData.length - 1) * width;
      
      // Add resistance at boundaries
      if (newTranslateX > maxTranslate) {
        translateX.value = maxTranslate + event.translationX * 0.3;
      } else if (newTranslateX < minTranslate) {
        translateX.value = minTranslate + (newTranslateX - minTranslate) * 0.3;
      } else {
        translateX.value = newTranslateX;
      }
    })
    .onEnd((event) => {
      const SWIPE_VELOCITY = 500;
      const SWIPE_DISTANCE = width * 0.2;

      let targetIndex = currentIndex.value;

      // Determine swipe direction
      if (
        event.translationX < -SWIPE_DISTANCE || 
        event.velocityX < -SWIPE_VELOCITY
      ) {
        // Swipe left - go to next
        targetIndex = Math.min(currentIndex.value + 1, carouselData.length - 1);
      } else if (
        event.translationX > SWIPE_DISTANCE || 
        event.velocityX > SWIPE_VELOCITY
      ) {
        // Swipe right - go to previous
        targetIndex = Math.max(currentIndex.value - 1, 0);
      }

      // Update index and animate to target position
      currentIndex.value = targetIndex;
      translateX.value = withSpring(-targetIndex * width, {
        damping: 20,
        stiffness: 90,
        velocity: event.velocityX,
      });

      // Restart auto-slide after gesture ends
      runOnJS(startAutoSlide)();
    });

  const animatedCarouselStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const CarouselIndicators = () => {
    return (
      <View style={styles.indicatorContainer}>
        {carouselData.map((_, index) => {
          const animatedDotStyle = useAnimatedStyle(() => {
            const activeIndex = Math.round(-translateX.value / width);
            const isActive = activeIndex === index;
            
            // Smooth scale animation for dots
            const scale = interpolate(
              -translateX.value,
              [(index - 1) * width, index * width, (index + 1) * width],
              [0.8, 1, 0.8],
              Extrapolation.CLAMP
            );

            return {
              width: withSpring(isActive ? 24 : 8, { damping: 15 }),
              opacity: withSpring(isActive ? 1 : 0.5, { damping: 15 }),
              transform: [{ scale }],
              backgroundColor: isActive ? colors.white : colors.neutral400,
            };
          });

          return (
            <Animated.View
              key={index}
              style={[styles.indicator, animatedDotStyle]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <View style={{ flex: 1 }}>
          {/* Image Section */}
          <View style={styles.imageContainer}>
            <Animated.View style={[styles.imageCarousel, animatedCarouselStyle]}>
              {carouselData.map((item, index) => (
                <View key={item.id} style={styles.imageSlide}>
                  <ImageBackground
                    source={item.image}
                    style={styles.backgroundImage}
                    contentFit="cover"
                  />
                </View>
              ))}
            </Animated.View>
          </View>

          {/* Content Section */}
          <View style={styles.contentSection}>
            <View style={styles.contentContainer}>
              <Animated.View style={[styles.textCarousel, animatedCarouselStyle]}>
                {carouselData.map((item, index) => (
                  <View key={item.id} style={styles.textSlide}>
                    <View style={styles.textContent}>
                      <Animated.View
                        entering={FadeInDown.duration(800).springify().damping(12)}
                      >
                        <Typo size={28} fontWeight="800" style={styles.heading}>
                          {item.heading}
                        </Typo>
                      </Animated.View>

                      <Animated.View
                        entering={FadeInDown.duration(800).delay(100).springify().damping(12)}
                      >
                        <Typo size={16} color={colors.white} style={styles.description}>
                          {item.description}
                        </Typo>
                      </Animated.View>
                    </View>
                  </View>
                ))}
              </Animated.View>

              <Animated.View
                entering={FadeInDown.duration(800).delay(200).springify().damping(12)}
              >
                <CarouselIndicators />
              </Animated.View>
            </View>

            <Animated.View
              entering={FadeInDown.duration(800).delay(300).springify().damping(12)}
              style={styles.buttonContainer}
            >
              <CustomButton
                onPress={() => router.push("/(auth)/login")}
                style={styles.button}
              >
                <Typo size={18} color={colors.black} fontWeight="600">
                  Get Started
                </Typo>
              </CustomButton>
            </Animated.View>
          </View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  imageContainer: {
    height: height * 0.6,
    overflow: "hidden",
  },
  imageCarousel: {
    flexDirection: "row",
    width: width * carouselData.length,
    height: "100%",
  },
  imageSlide: {
    width: width,
    height: "100%",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  contentSection: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: "space-between",
    paddingVertical: spacingY._20,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
  },
  textCarousel: {
    flexDirection: "row",
    width: width * carouselData.length,
  },
  textSlide: {
    width: width,
    justifyContent: "center",
  },
  textContent: {
    alignItems: "center",
    paddingHorizontal: spacingX._25,
  },
  heading: {
    textAlign: "center",
    marginBottom: spacingY._15,
    color: colors.white,
    lineHeight: 34,
  },
  description: {
    textAlign: "center",
    lineHeight: 24,
    opacity: 0.8,
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacingY._30,
    gap: 8,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    paddingHorizontal: spacingX._25,
    paddingBottom: spacingY._20,
  },
  button: {
    backgroundColor: "#fff",
    paddingVertical: spacingY._15,
  },
});