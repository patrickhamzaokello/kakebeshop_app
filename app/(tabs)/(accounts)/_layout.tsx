import { Stack, usePathname } from "expo-router";


export default function SettingsLayout() {
  const pathname = usePathname();
  return (
      <Stack screenOptions={{ headerShown: false, animation: pathname.startsWith("/accounts") ? "default" : "none" }} >
      </Stack>
  );
}
