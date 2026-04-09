import React, { useState, useEffect } from "react";
import { Text } from "@/components/Text";
import { TextInput } from "@/components/TextInput";
import { View, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Switch } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { cartService } from "@/utils/services/cartService";
import { useTheme } from "@/contexts/ThemeContext";

interface Address {
  id: string;
  label: string;
  region: string;
  district: string;
  area: string;
  landmark: string;
  is_default: boolean;
}

export default function EditAddressScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();

  const [label, setLabel] = useState<"HOME" | "WORK" | "OTHER">("HOME");
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [area, setArea] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [landmark, setLandmark] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAddress();
  }, [id]);

  const fetchAddress = async () => {
    try {
      const data = await cartService.getAddressById(id as string);
      if (data) {
        setLabel(data.label);
        setRegion(data.region);
        setDistrict(data.district);
        setArea(data.area);
        setLatitude(data.latitude ?? "");
        setLongitude(data.longitude ?? "");
        setLandmark(data.landmark);
        setIsDefault(data.is_default);
      } else {
        Alert.alert("Error", "Failed to load address");
        router.back();
      }
    } catch (error) {
      if (__DEV__) console.error("Error fetching address:", error);
      Alert.alert("Error", "Something went wrong");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!landmark.trim()) {
      Alert.alert("Validation Error", "Please enter a landmark");
      return;
    }
    setSaving(true);
    try {
      const data = await cartService.updateAddressDetails(id as string, {
        label,
        region,
        district,
        area,
        landmark: landmark.trim(),
        latitude,
        longitude,
        is_default: isDefault,
      });
      if (data) {
        Alert.alert("Success", "Address updated successfully", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Error", "Failed to update address");
      }
    } catch (error) {
      if (__DEV__) console.error("Error updating address:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Address", "Are you sure you want to delete this address?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            const data = await cartService.deleteAddressbyId(id as string);
            if (data) {
              Alert.alert("Success", "Address deleted successfully", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } else {
              Alert.alert("Error", "Failed to delete address");
            }
          } catch (error) {
            if (__DEV__) console.error("Error deleting address:", error);
            Alert.alert("Error", "Something went wrong");
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color="#E60549" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={{ flex: 1 }}>
        {/* Address Label */}
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8, color: colors.textPrimary }}>
            Address Label *
          </Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            {(["HOME", "WORK", "OTHER"] as const).map((labelType) => (
              <TouchableOpacity
                key={labelType}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: label === labelType ? "#E60549" : colors.border,
                  backgroundColor: label === labelType ? colors.backgroundSecondary : colors.surface,
                  alignItems: "center",
                }}
                onPress={() => setLabel(labelType)}
              >
                <Text style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: label === labelType ? "#E60549" : colors.textSecondary,
                }}>
                  {labelType}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location (Read-only) */}
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8, color: colors.textPrimary }}>
            Location
          </Text>
          <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 16, color: colors.textPrimary, marginBottom: 4 }}>
              {area}, {district}, {region}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
              Location cannot be changed. Create a new address if needed.
            </Text>
          </View>
        </View>

        {/* Landmark */}
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 8, color: colors.textPrimary }}>
            Landmark / Building Name *
          </Text>
          <TextInput
            style={{
              backgroundColor: colors.surface,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 12,
              fontSize: 16,
              color: colors.textPrimary,
              minHeight: 80,
            }}
            value={landmark}
            onChangeText={setLandmark}
            placeholder="e.g., Near City Mall, Building 5"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Set as Default */}
        <View style={{ padding: 16 }}>
          <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: colors.surface,
            borderRadius: 8,
            padding: 16,
          }}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.textPrimary }}>
                Set as Default Address
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                Use this address for future orders
              </Text>
            </View>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: colors.border, true: "#FFE5ED" }}
              thumbColor={isDefault ? "#E60549" : colors.textMuted}
            />
          </View>
        </View>

        {/* Delete */}
        <View style={{ padding: 16 }}>
          <TouchableOpacity
            style={{
              backgroundColor: colors.surface,
              borderRadius: 8,
              padding: 16,
              alignItems: "center",
              borderWidth: 2,
              borderColor: "#F44336",
            }}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color="#F44336" />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#F44336" }}>Delete Address</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={{
        flexDirection: "row",
        padding: 16,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: 12,
      }}>
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 14,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.backgroundSecondary,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          onPress={() => router.back()}
        >
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.textSecondary }}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 14,
            borderRadius: 8,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: saving ? colors.textMuted : "#E60549",
          }}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: "600", color: "white" }}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
