import { DetailHeaderSection } from "@/components/test/DetailHeader";
import OrderConfirmationScreen from "@/Screens/OrderConfirmationScreen";
import { View } from "react-native";

export default function OrderConfirmationMain() {

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <DetailHeaderSection
        title="Review Your Order"
        subheading="Check details before placing order"
      />

      <OrderConfirmationScreen />

    </View>
  );
}
