import ScreenWrapper from "@/components/ScreenWrapper";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
} from "react-native";
import Typo from "@/components/Typo";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { merchantBase } from "@/utils/services/merchantService";

export default function MerchantDetails() {
  const { id } = useLocalSearchParams();
   const [loading, setLoading] = useState(true);

     useEffect(() => {
      FetchMerchantProfile();
     }, [id]);

       const FetchMerchantProfile = async () => {
         try {
           const data = await merchantBase.merchantProfile(id as string);
         } catch (error) {
           console.error("Error fetching order:", error);
         } finally {
           setLoading(false);
         }
       };
  return (
      <ScreenWrapper style={styles.container}>
        <StatusBar style="dark" />

        <Typo>Merchant Details</Typo>
      </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

});
