import { colors } from "@/constants/theme";
import { postUserIntent } from "@/utils/apiEndpoints";
import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import Typo from "./Typo";
import { useAuthStore } from "@/utils/authStore";

type UserIntent = "buy" | "sell" | "both" | null;

interface IntentOption {
  id: UserIntent;
  title: string;
  description: string;
  icon: string;
}

const intentOptions: IntentOption[] = [
  {
    id: "buy",
    title: "I want to Buy",
    description: "Browse and purchase items from sellers",
    icon: "🛍️",
  },
  {
    id: "sell",
    title: "I want to Sell",
    description: "List your items and reach buyers",
    icon: "💰",
  },
  {
    id: "both",
    title: "Both Buy & Sell",
    description: "Get the full marketplace experience",
    icon: "🔄",
  },
];

const IntentCard = React.memo(
  ({
    option,
    isSelected,
    onSelect,
  }: {
    option: IntentOption;
    isSelected: boolean;
    onSelect: (id: UserIntent) => void;
  }) => {
    return (
      <Pressable
        style={[styles.card, isSelected && styles.selectedCard]}
        onPress={() => onSelect(option.id)}
      >
        <View style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <Typo size={40}>{option.icon}</Typo>
          </View>

          <View style={styles.textContainer}>
            <Typo
              size={20}
              fontWeight="700"
              color={isSelected ? colors.black : colors.matteBlack}
            >
              {option.title}
            </Typo>
            <Typo
              size={14}
              fontWeight="400"
              color={isSelected ? colors.black : colors.matteBlack}
              style={styles.description}
            >
              {option.description}
            </Typo>
          </View>

          <View style={styles.radioContainer}>
            {isSelected ? (
              <View style={styles.radioSelected}>
                <View style={styles.radioInner} />
              </View>
            ) : (
              <View style={styles.radioUnselected} />
            )}
          </View>
        </View>
      </Pressable>
    );
  }
);

const SelectIntent = () => {
  const [selectedIntent, setSelectedIntent] = useState<UserIntent>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { completeOnboarding } = useAuthStore();

  const handleSelectIntent = (intent: UserIntent) => {
    setSelectedIntent(intent);
  };

  const handleContinue = async () => {
    if (!selectedIntent) return;

    try {
      setIsLoading(true);
      // Post user intent to backend
      const response = await postUserIntent(selectedIntent);
      
      if (response.success) {
        // Complete onboarding step
        completeOnboarding();
        console.log("User intent saved successfully!");
      } else {
        console.error(
          "Failed to save user intent:",
          response?.message || "Unknown error"
        );
      }
    } catch (error) {
      console.error("Error saving user intent:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isContinueDisabled = !selectedIntent || isLoading;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Typo size={32} fontWeight="800" color={colors.matteBlack}>
            Welcome! 👋
          </Typo>
          <Typo
            size={16}
            fontWeight="400"
            color={colors.matteBlack}
            style={styles.subtitle}
          >
            Let's personalize your experience. What brings you to our
            marketplace?
          </Typo>
        </View>

        <View style={styles.cardsContainer}>
          {intentOptions.map((option) => (
            <IntentCard
              key={option.id}
              option={option}
              isSelected={selectedIntent === option.id}
              onSelect={handleSelectIntent}
            />
          ))}
        </View>

        <View style={styles.infoBox}>
          <Typo size={14} fontWeight="500" color={colors.matteBlack}>
            Don't worry, you can always change this later in your settings.
          </Typo>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[
            styles.continueButton,
            isContinueDisabled && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={isContinueDisabled}
        >
          {isLoading ? (
            <>
              <ActivityIndicator size="small" color={colors.white} />
              <Typo size={18} fontWeight="600" color={colors.white}>
                Saving...
              </Typo>
            </>
          ) : (
            <>
              <Typo size={18} fontWeight="600" color={colors.white}>
                Continue
              </Typo>
              <Typo size={18} fontWeight="600" color={colors.white}>
                →
              </Typo>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 32,
  },
  subtitle: {
    marginTop: 12,
    lineHeight: 24,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedCard: {
    backgroundColor: "#C8FF42",
    borderColor: "#C8FF42",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  description: {
    marginTop: 4,
    lineHeight: 20,
    opacity: 0.8,
  },
  radioContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  radioUnselected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    backgroundColor: colors.white,
  },
  radioSelected: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.black,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.white,
  },
  infoBox: {
    marginTop: 24,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  continueButton: {
    backgroundColor: colors.black,
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  continueButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
});

export default SelectIntent;