// TabsLayout.tsx
import { useCartStore } from "@/utils/stores/useCartStore";
import { useTheme } from "@/contexts/ThemeContext";
import {
  AntDesign,
  Feather,
  MaterialCommunityIcons,
  Octicons,
} from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import React from "react";
import { Text } from "@/components/Text";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CartTabIcon = ({ color, size }: { color: string; size: number }) => {
  const cartCount = useCartStore((state) => state.cartCount);
  const { colors } = useTheme();

  return (
    <View>
      <Feather name="shopping-cart" size={size} color={color} />
      {cartCount > 0 && (
        <View
          style={{
            position: "absolute",
            right: -12,
            top: -6,
            backgroundColor: colors.error,
            borderRadius: 12,
            minWidth: 20,
            height: 20,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 4,
          }}
        >
          <Text style={{ color: colors.textInverse, fontSize: 12, fontWeight: "bold" }}>
            {cartCount > 99 ? "99+" : cartCount}
          </Text>
        </View>
      )}
    </View>
  );
};

// Navigate to a tab's root screen, popping any stacked sub-screens.
// Called from every tabPress listener so switching tabs always lands
// on the tab's default screen, never a stale sub-screen.
const makeTabResetListener = (tabName: string, rootScreen: string) =>
  ({ navigation }: { navigation: any }) => ({
    tabPress: (e: any) => {
      e.preventDefault();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.navigate(tabName, { screen: rootScreen });
    },
  });

export default function TabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
          paddingBottom: 10 + insets.bottom,
          paddingTop: 10,
          ...(Platform.OS === "android" && { height: 70 + insets.bottom }),
        },
      }}
      initialRouteName="(home)"
    >
      <Tabs.Screen
        name="(home)"
        listeners={makeTabResetListener("(home)", "index")}
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="product" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(category)"
        listeners={makeTabResetListener("(category)", "category")}
        options={{
          title: "Category",
          tabBarIcon: ({ color, size }) => (
            <Feather name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(sell)"
        listeners={makeTabResetListener("(sell)", "sell")}
        options={{
          title: "Sell",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="tag-plus-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(cart)"
        listeners={makeTabResetListener("(cart)", "cart")}
        options={{
          title: "Cart",
          tabBarIcon: CartTabIcon,
        }}
      />
      <Tabs.Screen
        name="(accounts)"
        listeners={makeTabResetListener("(accounts)", "settings")}
        options={{
          title: "Accounts",
          tabBarIcon: ({ color, size }) => (
            <Octicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}