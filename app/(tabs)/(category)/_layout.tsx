import { Stack,usePathname } from "expo-router";

export default function CategoryLayout() {
  const pathname = usePathname();
  return (
      <Stack screenOptions={{ headerShown: false, animation: pathname.startsWith("/category") ? "default" : "none" }}>
        <Stack.Screen name="category" /> {/* Changed from index */}
      </Stack>
  );
}
