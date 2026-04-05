import { View } from "react-native";
import { DetailHeaderSection } from "@/components/test/DetailHeader";
import AddressSelectionScreen from "@/Screens/AddressSelectionScreen";
import { useTheme } from "@/contexts/ThemeContext";

export default function SelectDeliveryAddressMain() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailHeaderSection
        title="Select Delivery Location"
        subheading="Pick a delivery address for your order"
      />
      <AddressSelectionScreen />
    </View>
  );
}
