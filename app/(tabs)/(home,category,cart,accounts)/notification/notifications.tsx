import { StatusBar, View, TouchableOpacity, StyleSheet } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/Text";
import NotificationsScreen from "@/Screens/NotificationScreen";

export default function NotificationMain() {
  const { isDark, colors } = useTheme();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(isDark ? "light-content" : "dark-content");
    }, [isDark])
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.surface }}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.backBtn, { borderColor: colors.border }]}
            onPress={() => router.back()}
            activeOpacity={0.6}
          >
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Notifications</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Stay up to date</Text>
          </View>

          <View style={[styles.iconCircle, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="notifications-outline" size={18} color={colors.primary} />
          </View>
        </View>
      </SafeAreaView>

      <NotificationsScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  titleBlock: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  subtitle: {
    fontSize: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
});
