import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function CartLayout() {
  const pathname = usePathname();
  return (
      <Stack
        screenOptions={{
          headerShown: false,
          animation: pathname.startsWith("/cart") ? "default" : "none",
        }}
      >

      </Stack>
      
  );
}
