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
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import apiService from "@/utils/apiBase";
import { useAuthStore } from "@/utils/authStore";
import { useTheme } from "@/contexts/ThemeContext";

// ─── Field-level error helper ─────────────────────────────────────────────────

/** Parse DRF-style error responses into a flat { fieldName: firstMessage } map */
function parseErrors(data: any): Record<string, string> {
  if (!data || typeof data !== "object") return {};
  const map: Record<string, string> = {};
  for (const [key, val] of Object.entries(data)) {
    if (key === "detail") continue; // handled separately
    if (Array.isArray(val) && val.length > 0) {
      map[key] = String(val[0]);
    } else if (typeof val === "string") {
      map[key] = val;
    }
  }
  return map;
}

// ─── Reusable field component ─────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  children,
  colors,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  colors: any;
}) {
  return (
    <View style={fieldStyles.group}>
      <Text style={[fieldStyles.label, { color: colors.textPrimary }]}>
        {label}
        {required && <Text style={{ color: "#E60549" }}> *</Text>}
      </Text>
      {children}
      {error ? (
        <Text style={fieldStyles.error}>{error}</Text>
      ) : null}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  group: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600" },
  error: { fontSize: 12, color: "#E60549", marginTop: 2 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const user = useAuthStore((s) => s.user);
  const updateUserData = useAuthStore((s) => s.updateUserData);

  const [name, setName] = useState(user?.full_name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone_number ?? "");
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState(user?.username ?? "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Fetch the latest profile on mount to ensure bio and other fields are current
  useEffect(() => {
    (async () => {
      try {
        const response = await apiService.get("/auth/profile/");
        if (response.success && response.data) {
          const d = response.data.user ?? response.data;
          setName(d.name ?? d.full_name ?? "");
          setEmail(d.email ?? "");
          setPhone(d.phone ?? d.phone_number ?? "");
          setBio(d.bio ?? "");
          setUsername(d.username ?? "");
        }
      } catch {
        // Non-fatal — fall back to store values already set in state
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const clearFieldError = (field: string) => {
    if (errors[field]) setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const handleSave = async () => {
    setErrors({});
    setGeneralError(null);

    // Client-side validation
    const clientErrors: Record<string, string> = {};
    if (!name.trim()) clientErrors.name = "Full name is required.";
    if (!email.trim()) clientErrors.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) clientErrors.email = "Enter a valid email address.";
    if (bio.length > 200) clientErrors.bio = "Bio must be 200 characters or less.";
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string> = { name: name.trim(), email: email.trim() };
      if (phone.trim()) body.phone = phone.trim();
      if (bio.trim()) body.bio = bio.trim();
      else body.bio = ""; // allow clearing bio

      const response = await apiService.patch("/auth/profile/", body);

      if (response.success) {
        await updateUserData();
        Alert.alert("Saved", "Your profile has been updated.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        // Parse DRF field errors
        const fieldErrors = parseErrors(response.data);
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
        } else {
          setGeneralError(response.data?.detail || response.data?.message || "Failed to update profile.");
        }
      }
    } catch (err: any) {
      // apiService throws on 4xx — error.data may contain DRF field errors
      const fieldErrors = parseErrors(err?.data ?? err?.response?.data);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      } else {
        setGeneralError(err?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#E60549" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Edit Profile</Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]}>Update your details</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* General error banner */}
          {generalError ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color="#fff" />
              <Text style={styles.errorBannerText}>{generalError}</Text>
            </View>
          ) : null}

          {/* Username — read-only */}
          <Field label="Username" colors={colors}>
            <View style={[styles.input, styles.readOnly, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
              <Text style={[styles.inputText, { color: colors.textSecondary }]}>{username}</Text>
              <Ionicons name="lock-closed-outline" size={15} color={colors.textMuted} />
            </View>
            <Text style={[styles.hint, { color: colors.textMuted }]}>Username cannot be changed</Text>
          </Field>

          {/* Full Name */}
          <Field label="Full Name" required error={errors.name} colors={colors}>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, borderColor: errors.name ? "#E60549" : colors.border, color: colors.textPrimary },
              ]}
              value={name}
              onChangeText={(t) => { setName(t); clearFieldError("name"); }}
              placeholder="Your full name"
              placeholderTextColor={colors.textMuted}
              autoCorrect={false}
              returnKeyType="next"
            />
          </Field>

          {/* Email */}
          <Field label="Email Address" required error={errors.email} colors={colors}>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, borderColor: errors.email ? "#E60549" : colors.border, color: colors.textPrimary },
              ]}
              value={email}
              onChangeText={(t) => { setEmail(t); clearFieldError("email"); }}
              placeholder="your@email.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </Field>

          {/* Phone */}
          <Field label="Phone Number" error={errors.phone} colors={colors}>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, borderColor: errors.phone ? "#E60549" : colors.border, color: colors.textPrimary },
              ]}
              value={phone}
              onChangeText={(t) => { setPhone(t); clearFieldError("phone"); }}
              placeholder="+256 770 650 636"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              returnKeyType="next"
            />
          </Field>

          {/* Bio */}
          <Field label="Bio" error={errors.bio} colors={colors}>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: colors.surface, borderColor: errors.bio ? "#E60549" : colors.border, color: colors.textPrimary },
              ]}
              value={bio}
              onChangeText={(t) => { if (t.length <= 200) { setBio(t); clearFieldError("bio"); } }}
              placeholder="Tell others a little about yourself…"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={200}
              returnKeyType="done"
            />
            <Text style={[styles.hint, { color: bio.length > 180 ? "#E60549" : colors.textMuted }]}>
              {bio.length}/200
            </Text>
          </Field>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.btn, styles.cancelBtn, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
            onPress={() => router.back()}
            disabled={saving}
          >
            <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  headerSub: { fontSize: 12, textAlign: "center", marginTop: 1 },

  scroll: {
    padding: 20,
    gap: 20,
    paddingBottom: 16,
  },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E60549",
    borderRadius: 10,
    padding: 12,
  },
  errorBannerText: { flex: 1, color: "#fff", fontSize: 13, lineHeight: 18 },

  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  inputText: { fontSize: 15, flex: 1 },
  readOnly: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textArea: {
    minHeight: 96,
    paddingTop: 13,
  },
  hint: { fontSize: 12 },

  footer: {
    flexDirection: "row",
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  btn: {
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
  saveBtn: { flex: 2, backgroundColor: "#E60549" },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
