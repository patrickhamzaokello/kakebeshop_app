import ScreenWrapper from "@/components/ScreenWrapper";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  View,
} from "react-native";
import Typo from "@/components/Typo";
import { DetailHeaderSection } from "@/components/test/DetailHeader";
import { CategoriesScreen } from "@/Screens/CategoriesScreen";
import { SubcategoriesScreen } from "@/Screens/SubcategoriesScreen";

export default function Category() {


  return (
         <View style={styles.container}>
            <DetailHeaderSection
              title="Categories"
              subheading="Browse from list of categories range"
            />


      

      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

});
