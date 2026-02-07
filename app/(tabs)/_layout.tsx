// TabsLayout.tsx
import { useCartStore } from "@/utils/stores/useCartStore";
import { useTheme } from "@/contexts/ThemeContext";
import {
  AntDesign,
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  Octicons,
} from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { View, Text } from "react-native";

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

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: colors.tabBarBorder,
          paddingTop: 8,
        },
      }}
      initialRouteName="(home)"
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="product" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(category)"
        options={{
          title: "Category",
          tabBarIcon: ({ color, size }) => (
            <Feather name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(sell)"
        options={{
          title: "Sell",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="tag-plus-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(cart)"
        options={{
          title: "Cart",
          tabBarIcon: CartTabIcon, 
        }}
      />
      <Tabs.Screen
        name="(accounts)"
        options={{
          title: "accounts",
          tabBarIcon: ({ color, size }) => (
            <Octicons name="person" size={size} color={color} />
          ),
        }}
      />
       
    </Tabs>
  );
}