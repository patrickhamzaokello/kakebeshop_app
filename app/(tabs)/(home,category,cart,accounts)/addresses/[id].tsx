import { View } from "react-native";
import { DetailHeaderSection } from "@/components/test/DetailHeader";
import EditAddressScreen from "@/Screens/EditAddressScreen";
import { useTheme } from "@/contexts/ThemeContext";

export default function EditAddressMain() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailHeaderSection
        title="Edit Address"
        subheading="Delete or modify your address details"
      />
      <EditAddressScreen />
    </View>
  );
}
