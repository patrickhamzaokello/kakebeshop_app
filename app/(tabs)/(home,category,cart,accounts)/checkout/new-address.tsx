import { StyleSheet, View } from "react-native";
import { DetailHeaderSection } from "@/components/test/DetailHeader";
import NewAddressScreen from "@/Screens/NewAddressScreen";

export default function AddNewAddressMain() {

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <DetailHeaderSection
        title="New Address"
        subheading="Capture your new address details"
      />

      <NewAddressScreen />

    </View>
  );
}
