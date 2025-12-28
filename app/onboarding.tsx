import { colors } from "@/constants/theme";
import { postUserIntent } from "@/utils/apiEndpoints";
import React, { useState } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  View,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useAuthStore } from "@/utils/authStore";
import Typo from "@/components/Typo";
import { Ionicons } from "@expo/vector-icons";

type UserIntent = "buy" | "sell" | "both" | null;

interface IntentOption {
  id: UserIntent;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const intentOptions: IntentOption[] = [
  {
    id: "buy",
    title: "I want to Buy",
    description: "Browse and purchase items",
    icon: "cart-outline",
    color: "#E60549",
  },
  {
    id: "sell",
    title: "I want to Sell",
    description: "List and sell your items",
    icon: "pricetag-outline",
    color: "#4CAF50",
  },
  {
    id: "both",
    title: "Buy & Sell",
    description: "Full marketplace access",
    icon: "swap-horizontal-outline",
    color: "#2196F3",
  },
];

const IntentCard = ({
  option,
  isSelected,
  onSelect,
}: {
  option: IntentOption;
  isSelected: boolean;
  onSelect: (id: UserIntent) => void;
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        isSelected && { ...styles.selectedCard, borderColor: option.color },
      ]}
      onPress={() => onSelect(option.id)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconContainer,
          isSelected && { backgroundColor: option.color },
        ]}
      >
        <Ionicons
          name={option.icon}
          size={28}
          color={isSelected ? "white" : option.color}
        />
      </View>

      <View style={styles.textContainer}>
        <Typo size={17} fontWeight="600" color="#1A1A1A">
          {option.title}
        </Typo>
        <Typo size={14} fontWeight="400" color="#666" style={styles.description}>
          {option.description}
        </Typo>
      </View>

      <View style={styles.checkContainer}>
        {isSelected && (
          <View style={[styles.checkmark, { backgroundColor: option.color }]}>
            <Ionicons name="checkmark" size={18} color="white" />
          </View>
        )}
        {!isSelected && <View style={styles.emptyCircle} />}
      </View>
    </TouchableOpacity>
  );
};

const SelectIntent = () => {
  const [selectedIntent, setSelectedIntent] = useState<UserIntent>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { completeOnboarding } = useAuthStore();

  const handleSelectIntent = (intent: UserIntent) => {
    setSelectedIntent(intent);
  };

  const handleContinue = async () => {
    console.log("Selected Intent:", selectedIntent);
    if (!selectedIntent || isLoading) return;

    try {
      setIsLoading(true);
      const response = await postUserIntent(selectedIntent);

      if (response.success) {
        completeOnboarding();
        console.log("User intent saved successfully!");
      } else {
        console.error("Failed to save user intent:", response?.message || "Unknown error");
      }
    } catch (error) {
      console.error("Error saving user intent:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedOption = intentOptions.find((opt) => opt.id === selectedIntent);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Ionicons name="storefront" size={36} color="#E60549" />
          </View>

          <Typo size={28} fontWeight="700" color="#1A1A1A" style={styles.title}>
            Welcome to Kakebe!
          </Typo>

          <Typo size={15} fontWeight="400" color="#666" style={styles.subtitle}>
            How would you like to use our marketplace?
          </Typo>
        </View>

        {/* Intent Cards */}
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

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Ionicons name="information-circle" size={20} color="#666" />
          <Typo size={13} fontWeight="400" color="#666">
            You can change this anytime in settings
          </Typo>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
          ]}
          onPress={handleContinue}
          // disabled={!selectedIntent || isLoading}
          // activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Typo size={17} fontWeight="600" color="white">
              Continue
            </Typo>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },

  // Header
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    alignItems: "center",
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },

  // Cards
  cardsContainer: {
    gap: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 18,
    gap: 14,
    borderWidth: 2,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedCard: {
    backgroundColor: "#FAFAFA",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  description: {
    lineHeight: 20,
  },
  checkContainer: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#D0D0D0",
  },

  // Info Note
  infoNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    gap: 8,
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  continueButton: {
    backgroundColor: "#E60549",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: "#CCC",
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default SelectIntent;