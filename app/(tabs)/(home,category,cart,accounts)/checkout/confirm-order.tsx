import { DetailHeaderSection } from "@/components/test/DetailHeader";
import OrderConfirmationScreen from "@/Screens/OrderConfirmationScreen";
import { View } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

export default function OrderConfirmationMain() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailHeaderSection
        title="Review Your Order"
        subheading="Check details before placing order"
      />
      <OrderConfirmationScreen />
    </View>
  );
}
