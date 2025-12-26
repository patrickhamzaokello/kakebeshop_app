import { StyleSheet, View } from "react-native";
import { DetailHeaderSection } from "@/components/test/DetailHeader";
import AddressSelectionScreen from "@/Screens/AddressSelectionScreen";
import OrderConfirmationScreen from "@/Screens/OrderConfirmationScreen";

export default function SelectDeliveryAddressMain() {

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <DetailHeaderSection
        title="Place Order"
        subheading="Review your order and confirm details"
      />

      <OrderConfirmationScreen />

    </View>
  );
}
