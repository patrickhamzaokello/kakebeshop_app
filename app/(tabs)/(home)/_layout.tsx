import { Background } from "@react-navigation/elements";
import { Stack,usePathname } from "expo-router";

export default function HomeLayout() {
    const pathname = usePathname();
    return <Stack screenOptions={{  headerShown: false, animation: pathname.startsWith("/") ? "default" : "none" }}  />;
}
