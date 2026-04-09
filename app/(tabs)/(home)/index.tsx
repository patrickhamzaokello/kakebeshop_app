// app/(tabs)/(home)/_layout.tsx
import { HomeScreen } from "@/Screens/HomeScreen";
import { colors } from "@/constants/theme";
import { Stack } from "expo-router";
import { View } from "react-native";

export default function HomeLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "default",
          headerTitleStyle: { fontFamily: "SpaceGrotesk_500Medium" },
          headerBackTitleStyle: { fontFamily: "SpaceGrotesk_400Regular" },
        }}
      />
      <View style={{ flex: 1, backgroundColor: colors.white }}>
        <HomeScreen />
      </View>
    </>
  );
}