// app/index.tsx or app/(tabs)/index.tsx
import { colors } from "@/constants/theme";
import { View } from "react-native";
import {HomeScreen} from "@/Screens/HomeScreen";

export default function HomeScreenMain() {
    return (
        <View style={{ flex: 1, backgroundColor: colors.white }}>
            <HomeScreen />
        </View>
    );
}