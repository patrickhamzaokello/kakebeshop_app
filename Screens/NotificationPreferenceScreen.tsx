import React, { useEffect, useState } from "react";
import { Text } from "@/components/Text";
import { View, StyleSheet, ScrollView, Switch, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import apiService from "@/utils/apiBase";
import { useTheme } from "@/contexts/ThemeContext";

interface NotificationPreferences {
  id: string;
  email_enabled: boolean;
  email_order_updates: boolean;
  email_merchant_updates: boolean;
  email_marketing: boolean;
  push_enabled: boolean;
  push_order_updates: boolean;
  push_merchant_updates: boolean;
  device_tokens: string[];
}

export default function NotificationPreferencesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await apiService.get("/api/v1/preferences/");
      if (response.success && response.data.data) {
        const data = Array.isArray(response.data.data) ? response.data.data[0] : response.data.data;
        setPreferences(data);
      }
    } catch (error) {
      if (__DEV__) console.error("Error fetching preferences:", error);
      Alert.alert("Error", "Failed to load notification preferences");
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!preferences) return;
    setSaving(true);
    try {
      const response = await apiService.patch("/api/v1/preferences/", updates);
      if (response.success) {
        setPreferences({ ...preferences, ...updates });
      } else {
        Alert.alert("Error", "Failed to update preferences");
      }
    } catch (error) {
      if (__DEV__) console.error("Error updating preferences:", error);
      Alert.alert("Error", "Failed to update preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    updatePreferences({ [key]: value });
  };

  const styles = getStyles(colors);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E60549" />
      </View>
    );
  }

  if (!preferences) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load preferences</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Email Notifications */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="mail-outline" size={20} color="#E60549" />
          <Text style={styles.sectionTitle}>Email Notifications</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Enable Email</Text>
              <Text style={styles.settingDescription}>Receive notifications via email</Text>
            </View>
            <Switch
              value={preferences.email_enabled}
              onValueChange={(value) => handleToggle("email_enabled", value)}
              trackColor={{ false: colors.border, true: "#FFE5ED" }}
              thumbColor={preferences.email_enabled ? "#E60549" : colors.textMuted}
              ios_backgroundColor={colors.border}
            />
          </View>

          {preferences.email_enabled && (
            <>
              <View style={styles.divider} />
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Order Updates</Text>
                  <Text style={styles.settingDescription}>Order status changes and delivery updates</Text>
                </View>
                <Switch
                  value={preferences.email_order_updates}
                  onValueChange={(value) => handleToggle("email_order_updates", value)}
                  trackColor={{ false: colors.border, true: "#FFE5ED" }}
                  thumbColor={preferences.email_order_updates ? "#E60549" : colors.textMuted}
                  ios_backgroundColor={colors.border}
                />
              </View>

              <View style={styles.divider} />
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Merchant Updates</Text>
                  <Text style={styles.settingDescription}>New orders and merchant account updates</Text>
                </View>
                <Switch
                  value={preferences.email_merchant_updates}
                  onValueChange={(value) => handleToggle("email_merchant_updates", value)}
                  trackColor={{ false: colors.border, true: "#FFE5ED" }}
                  thumbColor={preferences.email_merchant_updates ? "#E60549" : colors.textMuted}
                  ios_backgroundColor={colors.border}
                />
              </View>

              <View style={styles.divider} />
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Marketing</Text>
                  <Text style={styles.settingDescription}>Promotions, offers, and news</Text>
                </View>
                <Switch
                  value={preferences.email_marketing}
                  onValueChange={(value) => handleToggle("email_marketing", value)}
                  trackColor={{ false: colors.border, true: "#FFE5ED" }}
                  thumbColor={preferences.email_marketing ? "#E60549" : colors.textMuted}
                  ios_backgroundColor={colors.border}
                />
              </View>
            </>
          )}
        </View>
      </View>

      {/* Push Notifications */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="notifications-outline" size={20} color="#E60549" />
          <Text style={styles.sectionTitle}>Push Notifications</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Enable Push</Text>
              <Text style={styles.settingDescription}>Receive notifications on your device</Text>
            </View>
            <Switch
              value={preferences.push_enabled}
              onValueChange={(value) => handleToggle("push_enabled", value)}
              trackColor={{ false: colors.border, true: "#FFE5ED" }}
              thumbColor={preferences.push_enabled ? "#E60549" : colors.textMuted}
              ios_backgroundColor={colors.border}
            />
          </View>

          {preferences.push_enabled && (
            <>
              <View style={styles.divider} />
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Order Updates</Text>
                  <Text style={styles.settingDescription}>Real-time order status updates</Text>
                </View>
                <Switch
                  value={preferences.push_order_updates}
                  onValueChange={(value) => handleToggle("push_order_updates", value)}
                  trackColor={{ false: colors.border, true: "#FFE5ED" }}
                  thumbColor={preferences.push_order_updates ? "#E60549" : colors.textMuted}
                  ios_backgroundColor={colors.border}
                />
              </View>

              <View style={styles.divider} />
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Merchant Updates</Text>
                  <Text style={styles.settingDescription}>New orders and important alerts</Text>
                </View>
                <Switch
                  value={preferences.push_merchant_updates}
                  onValueChange={(value) => handleToggle("push_merchant_updates", value)}
                  trackColor={{ false: colors.border, true: "#FFE5ED" }}
                  thumbColor={preferences.push_merchant_updates ? "#E60549" : colors.textMuted}
                  ios_backgroundColor={colors.border}
                />
              </View>
            </>
          )}
        </View>
      </View>

      {preferences.device_tokens.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="phone-portrait-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.sectionTitle}>Registered Devices</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.deviceInfo}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.deviceText}>
                {preferences.device_tokens.length}{" "}
                {preferences.device_tokens.length !== 1 ? "devices" : "device"} registered
              </Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.infoNote}>
          <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.infoNoteText}>
            You can change these settings at any time. Critical account notifications will always be sent.
          </Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 15,
    color: colors.textSecondary,
  },

  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },

  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },

  deviceInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  deviceText: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  infoNote: {
    flexDirection: "row",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    padding: 14,
    gap: 10,
    alignItems: "flex-start",
  },
  infoNoteText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
