import React, { useState, useEffect, useRef } from "react";
import { Text } from "@/components/Text";
import { TextInput } from "@/components/TextInput";
import { View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Switch, KeyboardAvoidingView, Platform, ScrollView, Keyboard } from "react-native";
import { useRouter } from "expo-router";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { cartService } from "@/utils/services/cartService";
import { useTheme } from "@/contexts/ThemeContext";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

interface LocationData {
  latitude: number;
  longitude: number;
  region: string;
  district: string;
  area: string;
  displayName?: string;
}

const LABEL_ICONS: Record<string, any> = {
  HOME: "home-outline",
  WORK: "briefcase-outline",
  OTHER: "location-outline",
};

// ─── Step 1: Map picker ───────────────────────────────────────────────────────

function LocationStep({
  colors,
  onNext,
}: {
  colors: any;
  onNext: (loc: LocationData) => void;
}) {
  const mapRef = useRef<MapView>(null);
  const [selected, setSelected] = useState<LocationData | null>(null);
  const [current, setCurrent] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    requestPermission();
  }, []);

  const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Location Permission",
        "Location access is needed to set your delivery address.",
        [{ text: "OK" }]
      );
      setLoadingLocation(false);
      return;
    }
    await moveToCurrentLocation();
  };

  const moveToCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setCurrent(coords);
      animateTo(coords.latitude, coords.longitude, 0.012);
      await pickLocation(coords.latitude, coords.longitude);
    } catch {
      const fallback = { latitude: 0.3476, longitude: 32.5825 };
      setCurrent(fallback);
      animateTo(fallback.latitude, fallback.longitude, 0.1);
    } finally {
      setLoadingLocation(false);
    }
  };

  const animateTo = (lat: number, lng: number, delta = 0.012) => {
    mapRef.current?.animateToRegion(
      { latitude: lat, longitude: lng, latitudeDelta: delta, longitudeDelta: delta },
      800
    );
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<LocationData> => {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const a = results?.[0];
      if (a) {
        return {
          latitude: lat,
          longitude: lng,
          region: a.region || a.city || "Central Region",
          district: a.district || a.subregion || a.city || "Kampala",
          area: a.city || a.subregion || a.street || a.name || "Selected Area",
          displayName: [a.street, a.city, a.region].filter(Boolean).join(", ") || undefined,
        };
      }
    } catch {}
    return {
      latitude: lat,
      longitude: lng,
      region: "Central Region",
      district: "Kampala",
      area: "Selected Location",
    };
  };

  const pickLocation = async (lat: number, lng: number) => {
    setGeocoding(true);
    const loc = await reverseGeocode(lat, lng);
    setSelected(loc);
    setGeocoding(false);
  };

  const onMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    pickLocation(latitude, longitude);
  };

  if (loadingLocation) {
    return (
      <View style={[stepStyles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#E60549" />
        <Text style={[stepStyles.loadingText, { color: colors.textMuted }]}>
          Getting your location…
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Map */}
      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: current?.latitude ?? 0.3476,
            longitude: current?.longitude ?? 32.5825,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onPress={onMapPress}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass
        >
          {selected && (
            <Marker
              coordinate={{ latitude: selected.latitude, longitude: selected.longitude }}
              pinColor="#E60549"
              title="Delivery here"
            />
          )}
        </MapView>

        {/* Instruction chip */}
        <View style={stepStyles.instructionChip}>
          <Ionicons name="finger-print-outline" size={16} color="#E60549" />
          <Text style={stepStyles.instructionText}>Tap the map to pin your location</Text>
        </View>

        {/* Recenter button */}
        <TouchableOpacity style={stepStyles.recenterBtn} onPress={moveToCurrentLocation}>
          <Ionicons name="locate" size={22} color="#E60549" />
        </TouchableOpacity>

        {/* Geocoding spinner */}
        {geocoding && (
          <View style={stepStyles.geocodingChip}>
            <ActivityIndicator size="small" color="#E60549" />
            <Text style={stepStyles.geocodingText}>Finding address…</Text>
          </View>
        )}
      </View>

      {/* Bottom panel */}
      <View style={[stepStyles.panel, { backgroundColor: colors.surface }]}>
        {selected ? (
          <View style={stepStyles.locationRow}>
            <View style={[stepStyles.pinDot, { backgroundColor: "#E6054915" }]}>
              <Ionicons name="location-sharp" size={20} color="#E60549" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[stepStyles.areaText, { color: colors.textPrimary }]} numberOfLines={1}>
                {selected.area}
              </Text>
              <Text style={[stepStyles.subText, { color: colors.textMuted }]} numberOfLines={1}>
                {selected.district}, {selected.region}
              </Text>
            </View>
          </View>
        ) : (
          <View style={stepStyles.locationRow}>
            <View style={[stepStyles.pinDot, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="location-outline" size={20} color={colors.textMuted} />
            </View>
            <Text style={[stepStyles.placeholderText, { color: colors.textMuted }]}>
              No location selected yet
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[stepStyles.continueBtn, !selected && stepStyles.continueBtnDisabled]}
          onPress={() => selected && onNext(selected)}
          disabled={!selected || geocoding}
          activeOpacity={0.85}
        >
          {geocoding ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={stepStyles.continueBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Step 2: Details form ─────────────────────────────────────────────────────

function DetailsStep({
  colors,
  location,
  onBack,
  onSave,
  saving,
}: {
  colors: any;
  location: LocationData;
  onBack: () => void;
  onSave: (label: string, landmark: string, isDefault: boolean) => void;
  saving: boolean;
}) {
  const [label, setLabel] = useState<"HOME" | "WORK" | "OTHER">("HOME");
  const [landmark, setLandmark] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleSave = () => {
    if (!landmark.trim()) {
      Alert.alert("Missing Info", "Please enter a landmark or building name.");
      inputRef.current?.focus();
      return;
    }
    Keyboard.dismiss();
    onSave(label, landmark.trim(), isDefault);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={detailStyles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Selected location card */}
        <View style={[detailStyles.locationCard, { backgroundColor: colors.surface }]}>
          <View style={[detailStyles.locationIcon, { backgroundColor: "#E6054912" }]}>
            <Ionicons name="location-sharp" size={22} color="#E60549" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[detailStyles.locationArea, { color: colors.textPrimary }]} numberOfLines={1}>
              {location.area}
              {location.displayName ? ` · ${location.displayName}` : ""}
            </Text>
            <Text style={[detailStyles.locationSub, { color: colors.textMuted }]}>
              {location.district}, {location.region}
            </Text>
          </View>
          <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={detailStyles.changeText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* Label */}
        <View style={detailStyles.section}>
          <Text style={[detailStyles.label, { color: colors.textPrimary }]}>Address Type</Text>
          <View style={detailStyles.labelRow}>
            {(["HOME", "WORK", "OTHER"] as const).map((t) => {
              const active = label === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[
                    detailStyles.labelBtn,
                    { borderColor: active ? "#E60549" : colors.border, backgroundColor: active ? "#E6054910" : colors.surface },
                  ]}
                  onPress={() => setLabel(t)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={LABEL_ICONS[t]}
                    size={16}
                    color={active ? "#E60549" : colors.textMuted}
                  />
                  <Text style={[detailStyles.labelBtnText, { color: active ? "#E60549" : colors.textSecondary }]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Landmark */}
        <View style={detailStyles.section}>
          <Text style={[detailStyles.label, { color: colors.textPrimary }]}>
            Landmark / Building <Text style={{ color: "#E60549" }}>*</Text>
          </Text>
          <TextInput
            ref={inputRef}
            style={[
              detailStyles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.textPrimary,
              },
            ]}
            value={landmark}
            onChangeText={setLandmark}
            placeholder="e.g. Near Shell station, Acacia Mall, Gate B"
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />
          <Text style={[detailStyles.hint, { color: colors.textMuted }]}>
            Helps delivery riders find you easily
          </Text>
        </View>

        {/* Set as default */}
        <View style={detailStyles.section}>
          <View style={[detailStyles.switchCard, { backgroundColor: colors.surface }]}>
            <View style={{ flex: 1 }}>
              <Text style={[detailStyles.label, { color: colors.textPrimary, marginBottom: 2 }]}>
                Set as default
              </Text>
              <Text style={[detailStyles.hint, { color: colors.textMuted }]}>
                Used automatically at checkout
              </Text>
            </View>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: colors.border, true: "#E60549" }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <View style={[detailStyles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[detailStyles.footerBtn, detailStyles.cancelBtn, { borderColor: colors.border, backgroundColor: colors.backgroundSecondary }]}
          onPress={onBack}
          disabled={saving}
        >
          <Ionicons name="arrow-back" size={18} color={colors.textSecondary} />
          <Text style={[detailStyles.cancelBtnText, { color: colors.textSecondary }]}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[detailStyles.footerBtn, detailStyles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={detailStyles.saveBtnText}>Save Address</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NewAddressScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [step, setStep] = useState<1 | 2>(1);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [saving, setSaving] = useState(false);

  const handleNext = (loc: LocationData) => {
    setLocation(loc);
    setStep(2);
  };

  const handleSave = async (label: string, landmark: string, isDefault: boolean) => {
    if (!location) return;
    setSaving(true);
    try {
      const ok = await cartService.createAddress({
        label,
        region: location.region,
        district: location.district,
        area: location.area + (location.displayName ? ` (${location.displayName})` : ""),
        landmark,
        latitude: location.latitude.toFixed(8),
        longitude: location.longitude.toFixed(8),
        is_default: isDefault,
      });
      if (ok) {
        router.back();
      } else {
        Alert.alert("Error", "Failed to save address. Please try again.");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <SafeAreaView />
      {/* Step indicator bar */}
      <View style={[indicator.bar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={indicator.backBtn}
          onPress={() => (step === 1 ? router.back() : setStep(1))}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        {([1, 2] as const).map((s) => (
          <View key={s} style={indicator.step}>
            <View
              style={[
                indicator.dot,
                step >= s ? indicator.dotActive : { backgroundColor: colors.border },
              ]}
            >
              {step > s ? (
                <Ionicons name="checkmark" size={12} color="#fff" />
              ) : (
                <Text style={indicator.dotText}>{s}</Text>
              )}
            </View>
            <Text
              style={[
                indicator.stepLabel,
                { color: step >= s ? "#E60549" : colors.textMuted },
                step >= s && indicator.stepLabelActive,
              ]}
            >
              {s === 1 ? "Pick Location" : "Add Details"}
            </Text>
          </View>
        ))}
        <View style={[indicator.line, { backgroundColor: step >= 2 ? "#E60549" : colors.border }]} />
      </View>

      {step === 1 ? (
        <LocationStep colors={colors} onNext={handleNext} />
      ) : (
        <DetailsStep
          colors={colors}
          location={location!}
          onBack={() => setStep(1)}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const stepStyles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14 },

  instructionChip: {
    position: "absolute",
    top: 16,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  instructionText: { fontSize: 13, color: "#333", fontWeight: "500" },

  recenterBtn: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },

  geocodingChip: {
    position: "absolute",
    bottom: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    elevation: 3,
  },
  geocodingText: { fontSize: 13, color: "#333" },

  panel: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pinDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  areaText: { fontSize: 15, fontWeight: "700" },
  subText: { fontSize: 13, marginTop: 2 },
  placeholderText: { fontSize: 14 },

  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#E60549",
    paddingVertical: 15,
    borderRadius: 14,
  },
  continueBtnDisabled: { backgroundColor: "#CCC" },
  continueBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});

const detailStyles = StyleSheet.create({
  scroll: {
    padding: 20,
    paddingBottom: 12,
    gap: 20,
  },

  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 14,
  },
  locationIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  locationArea: { fontSize: 14, fontWeight: "700" },
  locationSub: { fontSize: 12, marginTop: 2 },
  changeText: { fontSize: 13, color: "#E60549", fontWeight: "600" },

  section: { gap: 10 },
  label: { fontSize: 14, fontWeight: "600" },
  hint: { fontSize: 12, marginTop: -2 },

  labelRow: { flexDirection: "row", gap: 10 },
  labelBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  labelBtnText: { fontSize: 13, fontWeight: "600" },

  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
  },

  switchCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },

  footer: {
    flexDirection: "row",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  footerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
  },
  cancelBtn: { borderWidth: 1 },
  cancelBtnText: { fontSize: 15, fontWeight: "600" },
  saveBtn: { backgroundColor: "#E60549" },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});

const indicator = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: "relative",
    gap: 0,
  },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  line: {
    position: "absolute",
    top: "50%",
    left: "35%",
    right: "35%",
    height: 2,
    zIndex: 0,
  },
  step: {
    flex: 1,
    alignItems: "center",
    gap: 5,
    zIndex: 1,
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  dotActive: { backgroundColor: "#E60549" },
  dotText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  stepLabel: { fontSize: 12 },
  stepLabelActive: { fontWeight: "700" },
});
