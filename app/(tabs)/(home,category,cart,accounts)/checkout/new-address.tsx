import { View } from "react-native";
import { DetailHeaderSection } from "@/components/test/DetailHeader";
import NewAddressScreen from "@/Screens/NewAddressScreen";
import { useTheme } from "@/contexts/ThemeContext";

export default function AddNewAddressMain() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailHeaderSection
        title="New Address"
        subheading="Capture your new address details"
      />
      <NewAddressScreen />
    </View>
  );
}
