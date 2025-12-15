import { Stack,usePathname } from "expo-router";

export default function FavouritesLayout() {
  const pathname = usePathname();
  return <Stack screenOptions={{ headerShown: false, animation: pathname.startsWith("/sell") ? "default" : "none" }} />;
}
