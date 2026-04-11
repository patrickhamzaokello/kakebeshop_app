// Example with Expo Router
import { Stack } from "expo-router";

export default function ListingsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="capture_listing_images"
        options={{
          title: "Add Photos",
          headerShown: false
        }}
      />
      <Stack.Screen
        name="capture_listing_details"
        options={{
          title: "Listing Details",
          headerShown: false, // We have custom header
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Listing",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="edit-listing"
        options={{
          title: "Edit Listing",
          headerShown: false,
        }}
      />
    </Stack>
  );
}