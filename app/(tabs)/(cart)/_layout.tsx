import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function CartLayout() {
  const pathname = usePathname();
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: pathname.startsWith("/cart") ? "default" : "none",
        }}
      />
      
    </>
  );
}
