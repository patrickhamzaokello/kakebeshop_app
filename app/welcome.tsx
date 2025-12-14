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
  runOnJS,
  withTiming
} from "react-native-reanimated";
import { useEffect, useRef } from "react";

const { width, height } = Dimensions.get('window');

const carouselData = [


  {
    id: 1,
    image: require("@/assets/images/welcomefour.png"), // Replace with your third image
    heading: "All in One Place",
    description: "Your complete news hub with articles, videos, and live broadcasts in your pocket."
  },
  {
    id: 2,
    image: require("@/assets/images/welcomefour.png"), // Replace with your third image
    heading: "All in One Place",
    description: "Your complete news hub with articles, videos, and live broadcasts in your pocket."
  },
  {
    id: 3,
    image: require("@/assets/images/welcomefour.png"), // Replace with your second image
    heading: "Live Shows & Updates",
    description: "Watch live news shows and get on-time updates from trusted sources around the world."
  },
  {
    id: 4,
    image: require("@/assets/images/welcomefour.png"),
    heading: "Breaking News First",
    description: "Get the latest breaking news delivered instantly to your device. Stay ahead with real-time updates."
  },
];

export default function WelcomeScreen() {
  const scrollX = useSharedValue(0);
  const currentIndex = useSharedValue(0);
  const intervalRef = useRef<number | null>(null);

  const startAutoSlide = () => {
    intervalRef.current = setInterval(() => {
      const nextIndex = (currentIndex.value + 1) % carouselData.length;
      currentIndex.value = nextIndex;
      scrollX.value = withTiming(nextIndex * width, { duration: 500 });
    }, 3000); // Change slide every 3 seconds
  };

  useEffect(() => {
    startAutoSlide();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: -scrollX.value }],
    };
  });

  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: -scrollX.value }],
    };
  });

  const CarouselIndicators = () => {
    return (
      <View style={styles.indicatorContainer}>
        {carouselData.map((_, index) => {
          const animatedDotStyle = useAnimatedStyle(() => {
            const isActive = currentIndex.value === index;
            return {
              width: withSpring(isActive ? 24 : 8),
              backgroundColor: isActive ? colors.white : colors.neutral400 ,
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
      {/* Image Section - Top Half */}
      <View style={styles.imageContainer}>
        <View style={styles.imageCarousel}>
          {carouselData.map((item, index) => (
            <Animated.View
              key={item.id}
              style={[styles.imageSlide, animatedImageStyle]}
            >
              <ImageBackground
                source={item.image}
                style={styles.backgroundImage}
              />
            </Animated.View>
          ))}
        </View>
      </View>

      {/* Content Section - Bottom Half */}
      <View style={styles.contentSection}>
        <View style={styles.contentContainer}>
          {/* Text Content Carousel */}
          <View style={styles.textCarousel}>
            {carouselData.map((item, index) => (
              <Animated.View
                key={item.id}
                style={[styles.textSlide, animatedContentStyle]}
              >
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
                    <Typo 
                      size={16} 
                      color={colors.matteBlack} 
                      style={styles.description}
                    >
                      {item.description}
                    </Typo>
                  </Animated.View>
                </View>
              </Animated.View>
            ))}
          </View>

          {/* Carousel Indicators */}
          <Animated.View
            entering={FadeInDown.duration(800).delay(200).springify().damping(12)}
          >
            <CarouselIndicators />
          </Animated.View>
        </View>

        {/* Get Started Button */}
        <Animated.View
          entering={FadeInDown.duration(800).delay(300).springify().damping(12)}
          style={styles.buttonContainer}
        >
          <CustomButton 
            onPress={() => router.push('/(auth)/login')} 
            style={styles.button}
          >
            <Typo size={18} color={colors.black} fontWeight="600">
              Get Started
            </Typo>
          </CustomButton>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  imageContainer: {
    height: height * 0.6,
    overflow: 'hidden',
  },
  imageCarousel: {
    flexDirection: 'row',
    width: width * carouselData.length,
    height: '100%',
  },
  imageSlide: {
    width: width,
    height: '100%',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  contentSection: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'space-between',
    paddingVertical: spacingY._20,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  textCarousel: {
    flexDirection: 'row',
    width: width * carouselData.length,
    overflow: 'hidden',
  },
  textSlide: {
    width: width,
    justifyContent: 'center',
  },
  textContent: {
    alignItems: 'center',
    paddingHorizontal: spacingX._25,
  },
  heading: {
    textAlign: 'center',
    marginBottom: spacingY._15,
    color: colors.white,
    lineHeight: 34,
  },
  description: {
    textAlign: 'center',
    lineHeight: 24,
    color: colors.white,
    opacity: 0.8,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: "#4ECA00",
    paddingVertical: spacingY._15,
  },
});