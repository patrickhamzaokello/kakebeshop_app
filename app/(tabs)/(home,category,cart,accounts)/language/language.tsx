import ScreenWrapper from "@/components/ScreenWrapper";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
} from "react-native";
import Typo from "@/components/Typo";

export default function LanguageMain() {


    return (
      <ScreenWrapper style={styles.container}>
        <StatusBar style="dark" />

        <Typo>Language page</Typo>
      </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

});
