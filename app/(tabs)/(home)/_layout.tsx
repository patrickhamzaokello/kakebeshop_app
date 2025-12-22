import { Background } from "@react-navigation/elements";
import { Stack,usePathname } from "expo-router";
import { StatusBar } from 'expo-status-bar';

export default function HomeLayout() {
    const pathname = usePathname();
    return (
            <Stack screenOptions={{  headerShown: false, animation: pathname.startsWith("/") ? "default" : "none" }}>
                <Stack.Screen name="index" /> {/* Changed from index */}
                <StatusBar style="dark" />

        </Stack>
    );
}
