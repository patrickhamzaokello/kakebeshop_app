import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { HeaderData } from "@/utils/types/models";
import { SafeAreaView } from "react-native-safe-area-context";

interface HeaderSectionProps {
  title: string;
  subheading: string;
}

export const DetailHeaderSection: React.FC<HeaderSectionProps> = ({
  title,
  subheading,
}) => {
  return (
    <LinearGradient colors={["#DCF3FF", "#FFFFFF"]} style={styles.container}>
      <View>
        <SafeAreaView />

        <View style={styles.topRow}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subheading}>{subheading}</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  topRow: {
    justifyContent: "space-between",
    marginBottom: 16,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#000",
  },
  subheading: {
    fontSize: 16,
    color: "#000",
  },
});
