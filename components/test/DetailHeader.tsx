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
import { useTheme } from "@/contexts/ThemeContext";

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
  const { colors } = useTheme();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <LinearGradient colors={[colors.primarySoft, colors.background]} style={styles.container}>
      <SafeAreaView edges={["top"]} />

      <View style={styles.content}>
        {showBackButton && (
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.surface }]}
            onPress={handleBackPress}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={colors.iconColor} />
          </TouchableOpacity>
        )}

        <View style={[styles.topRow, showBackButton && styles.topRowWithBack]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.subheading, { color: colors.textSecondary }]}>{subheading}</Text>
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
    paddingTop: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  topRow: {
    justifyContent: "space-between",
    marginTop: 4,
  },
  topRowWithBack: {
    marginTop: 0,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subheading: {
    fontSize: 16,
    opacity: 0.8,
  },
});