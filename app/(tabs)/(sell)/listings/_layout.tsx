import { Stack } from "expo-router";

export default function ListingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="capture_listing_images" options={{ title: "Add Photos" }} />
      <Stack.Screen name="capture_listing_details" options={{ title: "Listing Details" }} />
      <Stack.Screen name="[id]" options={{ title: "Listing" }} />
      <Stack.Screen name="edit-listing" options={{ title: "Edit Listing" }} />
    </Stack>
  );
}
