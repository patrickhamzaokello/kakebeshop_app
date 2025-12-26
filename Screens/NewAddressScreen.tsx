import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import MapView, { Marker } from "react-native-maps"; // Remove PROVIDER_GOOGLE
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { cartService } from "@/utils/services/cartService";

interface LocationData {
  latitude: number;
  longitude: number;
  region: string;
  district: string;
  area: string;
  displayName?: string;
}

export default function NewAddressScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  // Form state
  const [label, setLabel] = useState<"HOME" | "WORK" | "OTHER">("HOME");
  const [landmark, setLandmark] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  // Location state
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to select your delivery address.",
          [
            { text: "Cancel", onPress: () => router.back() },
            { text: "Try Again", onPress: requestLocationPermission },
          ]
        );
        return;
      }

      await getCurrentLocation();
    } catch (error) {
      console.error("Error requesting location permission:", error);
      setLoadingLocation(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setCurrentLocation(coords);

      // Automatically select current location
      await handleLocationSelect(coords.latitude, coords.longitude);

      // Animate map to current location
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            ...coords,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          1000
        );
      }
    } catch (error) {
      console.error("Error getting current location:", error);
      Alert.alert("Error", "Failed to get your current location");
      // Set default location (Kampala, Uganda)
      const defaultCoords = {
        latitude: 0.3476,
        longitude: 32.5825,
      };
      setCurrentLocation(defaultCoords);
      
      // Animate to default location
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            ...defaultCoords,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          },
          1000
        );
      }
    } finally {
      setLoadingLocation(false);
    }
  };

  const reverseGeocode = async (
    latitude: number,
    longitude: number
  ): Promise<LocationData | null> => {
    try {
      // Use Expo's built-in reverse geocoding
      const result = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (result && result.length > 0) {
        const address = result[0];
        
        // Extract location details with fallbacks
        const region = address.region || address.city || "Central Region";
        const district = address.district || address.subregion || address.city || "Kampala";
        const area = address.city || address.subregion || address.street || address.name || "Selected Area";
        
        return {
          latitude,
          longitude,
          region,
          district,
          area,
          displayName: [address.street, address.city, address.region]
            .filter(Boolean)
            .join(", ") || `${area}, ${district}`,
        };
      }

      // If reverse geocoding fails, return default values
      return {
        latitude,
        longitude,
        region: "Central Region",
        district: "Kampala",
        area: "Selected Location",
        displayName: "Selected Location",
      };
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      
      // Return default values on error
      return {
        latitude,
        longitude,
        region: "Central Region",
        district: "Kampala",
        area: "Selected Location",
        displayName: "Selected Location",
      };
    }
  };

  const handleLocationSelect = async (latitude: number, longitude: number) => {
    setGeocoding(true);

    const locationData = await reverseGeocode(latitude, longitude);

    if (locationData) {
      setSelectedLocation(locationData);
    }

    setGeocoding(false);
  };

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    handleLocationSelect(latitude, longitude);
  };

  const handleRecenterMap = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...currentLocation,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
      
      // Re-select current location
      handleLocationSelect(currentLocation.latitude, currentLocation.longitude);
    }
  };

  const validateForm = (): boolean => {
    if (!selectedLocation) {
      Alert.alert("Validation Error", "Please select a location on the map");
      return false;
    }
    if (!landmark.trim()) {
      Alert.alert(
        "Validation Error",
        "Please enter a landmark or building name"
      );
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
                                                                                        
      const response = await cartService.createAddress({ 
        label, 
        region: selectedLocation!.region, 
        district: selectedLocation!.district, 
        area: selectedLocation!.area + selectedLocation!.displayName ? ` (${selectedLocation!.displayName})` : "", 
        landmark: landmark.trim(), 
        latitude: parseFloat(selectedLocation!.latitude.toFixed(8)).toString(),
        longitude: parseFloat(selectedLocation!.longitude.toFixed(8)).toString(),
        is_default: isDefault 
    });

      if (response) {
        Alert.alert("Success", "Address saved successfully", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert("Error", "Failed to save address");
      }
    } catch (error) {
      console.error("Error saving address:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingLocation) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E60549" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Map Section */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          // REMOVED: provider={PROVIDER_GOOGLE} - Not needed for Expo
          initialRegion={{
            latitude: currentLocation?.latitude || 0.3476,
            longitude: currentLocation?.longitude || 32.5825,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onPress={handleMapPress}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass
          showsScale
        >
          {selectedLocation && (
            <Marker
              coordinate={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              }}
              title="Delivery Location"
              description={selectedLocation.displayName}
              pinColor="#E60549"
            />
          )}
        </MapView>

        {/* Map Instruction Overlay */}
        <View style={styles.mapInstruction}>
          <Ionicons name="information-circle" size={20} color="#E60549" />
          <Text style={styles.instructionText}>
            Tap on the map to select your delivery location
          </Text>
        </View>

        {/* Recenter Button */}
        <TouchableOpacity
          style={styles.recenterButton}
          onPress={handleRecenterMap}
        >
          <Ionicons name="locate" size={24} color="#E60549" />
        </TouchableOpacity>

        {/* Geocoding Indicator */}
        {geocoding && (
          <View style={styles.geocodingIndicator}>
            <ActivityIndicator color="#E60549" />
            <Text style={styles.geocodingText}>Getting location details...</Text>
          </View>
        )}
      </View>

      {/* Form Section */}
      <ScrollView 
        style={styles.formContainer} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Selected Location Display */}
        {selectedLocation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Selected Location</Text>
            <View style={styles.locationCard}>
              <Ionicons
                name="location-sharp"
                size={20}
                color="#E60549"
                style={styles.locationIcon}
              />
              <View style={styles.locationDetails}>
                <Text style={styles.locationText}>
                  {selectedLocation.area}
                </Text>
              
                {selectedLocation.displayName && (
                  <Text style={styles.locationSubtext}>
                    {selectedLocation.displayName}
                  </Text>
                )}
                  <Text style={styles.locationCoords}>
                  {selectedLocation.district}, {selectedLocation.region}
                </Text>
              </View>
            </View>
          </View>
        )}

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

        {/* Landmark */}
        <View style={styles.section}>
          <Text style={styles.label}>Landmark / Building Name *</Text>
          <TextInput
            style={styles.input}
            value={landmark}
            onChangeText={setLandmark}
            placeholder="e.g., Near City Mall, Building 5, Apartment 3B"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <Text style={styles.helpText}>
            Add details to help delivery persons find you easily
          </Text>
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
              trackColor={{ false: "#E0E0E0", true: "#E60549" }}
              thumbColor="white"
            />
          </View>
        </View>

        {/* Spacer for button */}
        <View style={{ height: 100 }} />
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
          style={[
            styles.button,
            styles.saveButton,
            (loading || !selectedLocation) && styles.disabledButton,
          ]}
          onPress={handleSave}
          disabled={loading || !selectedLocation}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Save Address</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  mapContainer: {
    height: "40%",
    position: "relative",
  },
  map: {
    flex: 1,
  },
  mapInstruction: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  recenterButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "white",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  geocodingIndicator: {
    position: "absolute",
    bottom: 16,
    left: 16,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  geocodingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  formContainer: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  locationCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E60549",
  },
  locationIcon: {
    marginRight: 12,
  },
  locationDetails: {
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  locationSubtext: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  locationCoords: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
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
    marginTop: 4,
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
    borderColor: "#E60549",
    backgroundColor: "#E3F2FF",
  },
  labelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  labelButtonTextActive: {
    color: "#E60549",
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
    backgroundColor: "#E60549",
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

