import React, { useCallback, useEffect, useState } from "react";
import { Text } from "@/components/Text";
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@/contexts/ThemeContext";
import { merchantBase } from "@/utils/services/merchantService";
import {
  pickAndUploadMerchantImage,
  UploadStep,
} from "@/utils/merchantImageUpload";
import { MerchantDetails } from "@/utils/types/models";

// ─── Upload state pill ────────────────────────────────────────────────────────

const STEP_LABELS: Partial<Record<UploadStep, string>> = {
  picking: "Opening gallery…",
  processing: "Processing image…",
  uploading: "Uploading…",
  confirming: "Saving…",
  done: "Done",
  error: "Upload failed",
};

const UploadIndicator: React.FC<{ step: UploadStep }> = ({ step }) => {
  const { colors } = useTheme();
  if (step === "idle" || step === "done") return null;
  const isError = step === "error";

  return (
    <View style={[styles.uploadPill, { backgroundColor: isError ? "#FF3B30" : colors.surface }]}>
      {!isError && <ActivityIndicator size="small" color={colors.primary} />}
      <Text style={[styles.uploadPillText, { color: isError ? "#fff" : colors.textSecondary }]}>
        {STEP_LABELS[step] ?? "Working…"}
      </Text>
    </View>
  );
};

// ─── Image tile ───────────────────────────────────────────────────────────────

const ImageTile: React.FC<{
  label: string;
  uri: string | null;
  aspect: [number, number];
  step: UploadStep;
  onEdit: () => void;
  colors: any;
}> = ({ label, uri, aspect, step, onEdit, colors }) => {
  const isLoading = step !== "idle" && step !== "done" && step !== "error";
  const [w, h] = aspect;
  const height = w === h ? 140 : 180; // square logo vs wide cover

  return (
    <View style={styles.tile}>
      <Text style={[styles.tileLabel, { color: colors.textMuted }]}>{label}</Text>

      <View style={[styles.tileImageWrap, { height, backgroundColor: colors.backgroundSecondary }]}>
        {uri ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={styles.tilePlaceholder}>
            <Ionicons
              name={w === h ? "person-outline" : "image-outline"}
              size={32}
              color={colors.textMuted}
            />
            <Text style={[styles.tilePlaceholderText, { color: colors.textMuted }]}>
              No {label.toLowerCase()} set
            </Text>
          </View>
        )}

        {/* Dark overlay while uploading */}
        {isLoading && (
          <View style={styles.tileOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}

        {/* Edit button */}
        <TouchableOpacity
          style={[styles.editBadge, { backgroundColor: colors.surface }]}
          onPress={onEdit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Ionicons name="camera-outline" size={16} color={colors.textPrimary} />
          <Text style={[styles.editBadgeText, { color: colors.textPrimary }]}>Change</Text>
        </TouchableOpacity>
      </View>

      <UploadIndicator step={step} />
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MerchantEditProfileScreen() {
  const { colors, isDark } = useTheme();
  const [merchant, setMerchant] = useState<MerchantDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Separate upload state for logo and cover
  const [logoStep, setLogoStep] = useState<UploadStep>("idle");
  const [coverStep, setCoverStep] = useState<UploadStep>("idle");

  // Optimistic local URIs (shown immediately after upload)
  const [localLogoUri, setLocalLogoUri] = useState<string | null>(null);
  const [localCoverUri, setLocalCoverUri] = useState<string | null>(null);

  const fetchMerchant = useCallback(async () => {
    setLoading(true);
    const data = await merchantBase.getMyMerchantProfile();
    setMerchant(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMerchant();
  }, [fetchMerchant]);

  // ── Logo upload ─────────────────────────────────────────────────────────────
  const handleChangeLogo = async () => {
    try {
      const imageGroupId = await pickAndUploadMerchantImage("profile", setLogoStep);
      if (!imageGroupId) {
        setLogoStep("idle");
        return;
      }

      const updated = await merchantBase.updateMerchantLogo(imageGroupId);
      if (updated) {
        setMerchant(updated);
        setLocalLogoUri(updated.logo ?? null);
        setLogoStep("done");
      } else {
        throw new Error("Logo update returned null");
      }
    } catch (err) {
      setLogoStep("error");
      Alert.alert("Upload Failed", "Could not update your logo. Please try again.");
      if (__DEV__) console.error("Logo upload error:", err);
    } finally {
      setTimeout(() => setLogoStep("idle"), 2000);
    }
  };

  // ── Cover image upload ──────────────────────────────────────────────────────
  const handleChangeCover = async () => {
    try {
      const imageGroupId = await pickAndUploadMerchantImage("store_banner", setCoverStep);
      if (!imageGroupId) {
        setCoverStep("idle");
        return;
      }

      const updated = await merchantBase.updateMerchantCoverImage(imageGroupId);
      if (updated) {
        setMerchant(updated);
        setLocalCoverUri(updated.cover_image ?? null);
        setCoverStep("done");
      } else {
        throw new Error("Cover update returned null");
      }
    } catch (err) {
      setCoverStep("error");
      Alert.alert("Upload Failed", "Could not update your cover image. Please try again.");
      if (__DEV__) console.error("Cover upload error:", err);
    } finally {
      setTimeout(() => setCoverStep("idle"), 2000);
    }
  };

  const logoUri = localLogoUri ?? merchant?.logo ?? null;
  const coverUri = localCoverUri ?? merchant?.cover_image ?? null;

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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Business Images
          </Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Business identity summary */}
          {merchant && (
            <View style={[styles.identityRow, { backgroundColor: colors.surface }]}>
              <View style={[styles.identityAvatar, { backgroundColor: "#4CAF5018" }]}>
                {logoUri ? (
                  <Image source={{ uri: logoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : (
                  <Ionicons name="business" size={22} color="#4CAF50" />
                )}
              </View>
              <View style={styles.identityText}>
                <Text style={[styles.identityName, { color: colors.textPrimary }]}>
                  {merchant.display_name}
                </Text>
                <Text style={[styles.identityBusiness, { color: colors.textSecondary }]}>
                  {merchant.business_name}
                </Text>
              </View>
            </View>
          )}

          <Text style={[styles.sectionNote, { color: colors.textMuted }]}>
            Tap "Change" on any image to replace it. Images are updated instantly.
          </Text>

          {/* Cover image — wide 16:9 */}
          <ImageTile
            label="Cover Image"
            uri={coverUri}
            aspect={[16, 9]}
            step={coverStep}
            onEdit={handleChangeCover}
            colors={colors}
          />

          {/* Logo — square */}
          <ImageTile
            label="Business Logo"
            uri={logoUri}
            aspect={[1, 1]}
            step={logoStep}
            onEdit={handleChangeLogo}
            colors={colors}
          />

          {/* Tips */}
          <View style={[styles.tipCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.tipTitle, { color: colors.textSecondary }]}>Tips</Text>
            <Text style={[styles.tipText, { color: colors.textMuted }]}>
              • Logo: use a square image (1:1). PNG or JPG with a clear background works best.
            </Text>
            <Text style={[styles.tipText, { color: colors.textMuted }]}>
              • Cover: use a wide banner image (16:9), e.g. 1280×720 px.
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
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
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
  },

  scroll: {
    padding: 16,
    gap: 16,
  },

  // Identity summary
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
  },
  identityAvatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  identityText: { flex: 1 },
  identityName: { fontSize: 15, fontWeight: "700" },
  identityBusiness: { fontSize: 13, marginTop: 2 },

  sectionNote: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },

  // Image tile
  tile: { gap: 8 },
  tileLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tileImageWrap: {
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  tilePlaceholder: {
    alignItems: "center",
    gap: 8,
  },
  tilePlaceholderText: { fontSize: 13 },
  tileOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  editBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  editBadgeText: { fontSize: 13, fontWeight: "600" },

  // Upload progress pill
  uploadPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  uploadPillText: { fontSize: 13 },

  // Tips
  tipCard: {
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  tipTitle: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  tipText: { fontSize: 12, lineHeight: 18 },
});
