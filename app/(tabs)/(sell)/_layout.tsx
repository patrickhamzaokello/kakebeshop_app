import { Stack } from "expo-router";

export default function SellLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="sell" options={{ animation: "none" }} />
    </Stack>
  );
}
