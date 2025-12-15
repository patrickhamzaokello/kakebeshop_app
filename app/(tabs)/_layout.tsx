import Header from "@/components/header/Header";
import {AntDesign, Feather, Ionicons, MaterialCommunityIcons, MaterialIcons, Octicons} from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: "#fff", tabBarStyle: { backgroundColor: "#000", borderTopWidth: 0 }, header: () => <Header />}} >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Home",
          popToTopOnBlur: true,
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="product" size={size} color={color} />
          ),
        }}
        
      />
      <Tabs.Screen
        name="(category)"
        options={{
          title: "Category",
          popToTopOnBlur: true,
          tabBarIcon: ({ color, size }) => (
            <Feather name="search" size={size} color={color} />
          ),
        }}
        
      />
        <Tabs.Screen
            name="(sell)"
            options={{
                title: "Sell",
                popToTopOnBlur: true,
                tabBarIcon: ({ color, size }) => (
                <MaterialCommunityIcons name="tag-plus-outline" size={size} color={color} />
                ),
            }}
        />
      <Tabs.Screen
        name="(cart)"
        options={{
          title: "Cart",
          popToTopOnBlur: true,
          tabBarIcon: ({ color, size }) => (
            <Feather name="shopping-cart" size={size} color={color} />
          ),
        }}
        
      />

      <Tabs.Screen
        name="(settings)"
        options={{
          title: "Account",
          popToTopOnBlur: true,
          tabBarIcon: ({ color, size }) => (
            <Octicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
