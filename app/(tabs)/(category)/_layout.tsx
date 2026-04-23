import { Stack } from "expo-router";

export default function CategoryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="category" options={{ animation: "none" }} />
      <Stack.Screen name="search" options={{ animation: "fade" }} />
    </Stack>
  );
}
