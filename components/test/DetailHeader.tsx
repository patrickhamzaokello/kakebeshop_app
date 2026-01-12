import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

interface HeaderSectionProps {
  title: string;
  subheading: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export const DetailHeaderSection: React.FC<HeaderSectionProps> = ({
  title,
  subheading,
  showBackButton = false,
  onBackPress,
}) => {
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <LinearGradient colors={["#DCF3FF", "#FFFFFF"]} style={styles.container}>
      <SafeAreaView edges={["top"]} />
      
      <View style={styles.content}>
        {showBackButton && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        )}

        <View style={[styles.topRow, showBackButton && styles.topRowWithBack]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subheading}>{subheading}</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  content: {
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 20
  },
  topRow: {
    justifyContent: "space-between",
  },
  topRowWithBack: {
    marginTop: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  subheading: {
    fontSize: 16,
    color: "#000",
    opacity: 0.8,
  },
});