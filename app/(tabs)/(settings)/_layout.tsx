import { Stack, usePathname } from "expo-router";


export default function SettingsLayout() {
  const pathname = usePathname();
  return (
      <Stack screenOptions={{ headerShown: false, animation: pathname.startsWith("/settings") ? "default" : "none" }} >
        <Stack.Screen name="settings" /> {/* Changed from index */}
      </Stack>
  );
}
