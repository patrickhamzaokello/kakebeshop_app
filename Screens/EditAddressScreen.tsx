import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { cartService } from "@/utils/services/cartService";

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
  const { id } = useLocalSearchParams();
  
  // Form state
  const [address, setAddress] = useState<Address | null>(null);
  const [label, setLabel] = useState<"HOME" | "WORK" | "OTHER">("HOME");
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [area, setArea] = useState("");
  const [landmark, setLandmark] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAddress();
  }, [id]);

  const fetchAddress = async () => {
    try {
     const data = await cartService.getAddressById(id as string)
      
      if (data) {
        setAddress(data);
        setLabel(data.label);
        setRegion(data.region);
        setDistrict(data.district);
        setArea(data.area);
        setLandmark(data.landmark);
        setIsDefault(data.is_default);
      } else {
        Alert.alert("Error", "Failed to load address");
        router.back();
      }
    } catch (error) {
      console.error("Error fetching address:", error);
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
      const response = await fetch(`/api/v1/addresses/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${yourAuthToken}`,
        },
        body: JSON.stringify({
          label,
          landmark,
          is_default: isDefault,
        }),
      });

      if (response.ok) {
        Alert.alert("Success", "Address updated successfully", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        const error = await response.json();
        Alert.alert("Error", error.detail || "Failed to update address");
      }
    } catch (error) {
      console.error("Error updating address:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Address",
      "Are you sure you want to delete this address?",
      [
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
                  {
                    text: "OK",
                    onPress: () => router.back(),
                  },
                ]);
              } else {
                Alert.alert("Error", "Failed to delete address");
              }
            } catch (error) {
              console.error("Error deleting address:", error);
              Alert.alert("Error", "Something went wrong");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async () => {
    try {
      const response = await fetch(`/api/v1/addresses/${id}/set-default/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${yourAuthToken}`,
        },
      });

      if (response.ok) {
        setIsDefault(true);
        Alert.alert("Success", "Default address updated");
      } else {
        Alert.alert("Error", "Failed to update default address");
      }
    } catch (error) {
      console.error("Error setting default:", error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Address Label */}
        <View style={styles.section}>
          <Text style={styles.label}>Address Label *</Text>
          <View style={styles.labelButtons}>
            {(["HOME", "WORK", "OTHER"] as const).map((labelType) => (
              <TouchableOpacity
                key={labelType}
                style={[
                  styles.labelButton,
                  label === labelType && styles.labelButtonActive,
                ]}
                onPress={() => setLabel(labelType)}
              >
                <Text
                  style={[
                    styles.labelButtonText,
                    label === labelType && styles.labelButtonTextActive,
                  ]}
                >
                  {labelType}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location (Read-only) */}
        <View style={styles.section}>
          <Text style={styles.label}>Location</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              {area}, {district}, {region}
            </Text>
            <Text style={styles.helpText}>
              Location cannot be changed. Create a new address if needed.
            </Text>
          </View>
        </View>

        {/* Landmark */}
        <View style={styles.section}>
          <Text style={styles.label}>Landmark / Building Name *</Text>
          <TextInput
            style={styles.input}
            value={landmark}
            onChangeText={setLandmark}
            placeholder="e.g., Near City Mall, Building 5"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Set as Default */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <View style={styles.switchLabel}>
              <Text style={styles.label}>Set as Default Address</Text>
              <Text style={styles.helpText}>
                Use this address for future orders
              </Text>
            </View>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: "#E0E0E0", true: "#007AFF" }}
              thumbColor="white"
            />
          </View>
        </View>

        {/* Delete Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color="#FF3B30" />
            ) : (
              <Text style={styles.deleteButtonText}>Delete Address</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  helpText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  labelButtons: {
    flexDirection: "row",
    gap: 12,
  },
  labelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    backgroundColor: "white",
    alignItems: "center",
  },
  labelButtonActive: {
    borderColor: "#007AFF",
    backgroundColor: "#E3F2FF",
  },
  labelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  labelButtonTextActive: {
    color: "#007AFF",
  },
  infoCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  infoText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    padding: 12,
    fontSize: 16,
    color: "#333",
    minHeight: 80,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
  },
  switchLabel: {
    flex: 1,
    marginRight: 16,
  },
  deleteButton: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FF3B30",
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF3B30",
  },
  footer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  saveButton: {
    backgroundColor: "#007AFF",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  disabledButton: {
    backgroundColor: "#CCC",
  },
});