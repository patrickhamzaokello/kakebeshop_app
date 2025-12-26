import { StyleSheet, View } from "react-native";
import { DetailHeaderSection } from "@/components/test/DetailHeader";
import AddressSelectionScreen from "@/Screens/AddressSelectionScreen";
import EditAddressScreen from "@/Screens/EditAddressScreen";

export default function SelectDeliveryAddressMain() {

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <DetailHeaderSection
        title="Edit Address"
        subheading="Delete or modify your address details"
      />

      <EditAddressScreen />

    </View>
  );
}
