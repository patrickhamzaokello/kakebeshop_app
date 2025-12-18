import ScreenWrapper from "@/components/ScreenWrapper";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
} from "react-native";
import Typo from "@/components/Typo";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { useCartStore } from "@/utils/stores/useCartStore";

export default function CartMain() {
  const { fetchCartCount } = useCartStore();

  useFocusEffect(
    useCallback(() => {
      fetchCartCount(); // Always fresh when opening cart
    }, [])
  );

  return (
      <ScreenWrapper style={styles.container}>
        <StatusBar style="dark" />

        <Typo>Cart List</Typo>
      </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

});
