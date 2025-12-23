import ScreenWrapper from "@/components/ScreenWrapper";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  View,
} from "react-native";
import Typo from "@/components/Typo";
import { DetailHeaderSection } from "@/components/test/DetailHeader";

export default function MerchantSellMain() {


  return (
         <View style={styles.container}>
            <DetailHeaderSection
              title="Sell on Kakebe"
              subheading="Sell on Kakabe, get orders and manage your products"
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
