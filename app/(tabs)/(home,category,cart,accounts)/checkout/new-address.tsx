import { View } from "react-native";
import NewAddressScreen from "@/Screens/NewAddressScreen";
import { useTheme } from "@/contexts/ThemeContext";

export default function AddNewAddressMain() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <NewAddressScreen />
    </View>
  );
}
