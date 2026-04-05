import { Stack } from "expo-router";

export default function CategoryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "default" }}>
      <Stack.Screen name="search" options={{ animation: "fade" }} />
    </Stack>
  );
}
