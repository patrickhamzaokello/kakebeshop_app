import ScreenWrapper from "@/components/ScreenWrapper";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
} from "react-native";
import Typo from "@/components/Typo";

export default function Category() {


  return (
      <ScreenWrapper style={styles.container}>
        <StatusBar style="dark" />

        <Typo>Category List</Typo>
      </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

});
