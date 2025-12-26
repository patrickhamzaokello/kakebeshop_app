import { StyleSheet, View } from "react-native";
import { DetailHeaderSection } from "@/components/test/DetailHeader";
import AddressSelectionScreen from "@/Screens/AddressSelectionScreen";

export default function SelectDeliveryAddressMain() {

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <DetailHeaderSection
        title="Select Delivery Location"
        subheading="Pick a delivery address for your order"
      />

      <AddressSelectionScreen />

    </View>
  );
}
