import SelectCategory from "@/components/SelectCategory";
import ScreenWrapper from "@/components/ScreenWrapper";

import Typo from "@/components/Typo";
import { colors } from "@/constants/theme";
import { ScrollView, StyleSheet, View } from "react-native";

export default function selectCategoryScreen() {
  return (
    <ScreenWrapper
      style={{ backgroundColor: colors.white }}
      statusBarStyle="dark-content"
    >    
      <SelectCategory />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({

});
