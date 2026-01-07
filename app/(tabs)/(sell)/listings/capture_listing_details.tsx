import ScreenWrapper from "@/components/ScreenWrapper";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import Typo from "@/components/Typo";
import { DetailHeaderSection } from "@/components/test/DetailHeader";
import { colors, spacingY } from "@/constants/theme";
import { router } from "expo-router";
import Button from "@/components/CustomButton";

export default function SellLisitingDetails() {
  return (
    <View style={styles.container}>
      <Typo fontWeight={"700"} color="#000" size={16}>
          Get Started
        </Typo>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

 
});
