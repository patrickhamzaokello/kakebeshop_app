import React, { useState } from "react";
import { Text } from "@/components/Text";
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuthStore } from "@/utils/authStore";
import apiService from "@/utils/apiBase";
import {
  pickAndUploadMerchantImage,
  UploadStep,
} from "@/utils/merchantImageUpload";

// ─── Upload state pill ────────────────────────────────────────────────────────

const STEP_LABELS: Partial<Record<UploadStep, string>> = {
  picking: "Opening gallery…",
  processing: "Processing image…",
  uploading: "Uploading…",
  confirming: "Saving…",
  done: "Done!",
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

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function UserEditProfileImageScreen() {
  const { colors, isDark } = useTheme();
  const user = useAuthStore((s) => s.user);
  const updateUserData = useAuthStore((s) => s.updateUserData);

  const [uploadStep, setUploadStep] = useState<UploadStep>("idle");
  // Optimistic local URI — shown immediately after a successful upload
  const [localUri, setLocalUri] = useState<string | null>(null);

  const isUploading = uploadStep !== "idle" && uploadStep !== "done" && uploadStep !== "error";
  const displayUri = localUri ?? (user?.image ? String(user.image) : null);

  const handleChangePhoto = async () => {
    try {
      const imageGroupId = await pickAndUploadMerchantImage("profile", setUploadStep);
      if (!imageGroupId) {
        setUploadStep("idle");
        return;
      }

      // POST /auth/profile/image/ with the image_group_id
      const response = await apiService.post("/auth/profile/image/", {
        image_group_id: imageGroupId,
      });

      if (!response.success) {
        throw new Error(response.data?.message || "Profile image update failed");
      }

      // Optimistic update — show the new image immediately
      const newImageUrl = response.data?.profile_image ?? response.data?.image ?? null;
      if (newImageUrl) setLocalUri(newImageUrl);

      // Refresh the auth store so the rest of the app sees the new image
      await updateUserData();

      setUploadStep("done");
    } catch (err: any) {
      setUploadStep("error");
      Alert.alert("Upload Failed", err.message || "Could not update your profile photo. Please try again.");
      if (__DEV__) console.error("Profile image upload error:", err);
    } finally {
      setTimeout(() => setUploadStep("idle"), 2000);
    }
  };

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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Profile Photo</Text>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarRing, { borderColor: colors.border }]}>
            <View style={[styles.avatarWrap, { backgroundColor: colors.backgroundSecondary }]}>
              {displayUri ? (
                <Image source={{ uri: displayUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <Ionicons name="person" size={52} color={colors.textMuted} />
              )}

              {/* Overlay while uploading */}
              {isUploading && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                </View>
              )}
            </View>
          </View>

          {/* Upload status */}
          <UploadIndicator step={uploadStep} />

          {/* Name + email */}
          {user && (
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.textPrimary }]}>
                {user.full_name ?? user.username ?? ""}
              </Text>
              {user.email ? (
                <Text style={[styles.userEmail, { color: colors.textMuted }]}>{user.email}</Text>
              ) : null}
            </View>
          )}
        </View>

        {/* Change photo button */}
        <TouchableOpacity
          style={[styles.changeBtn, { backgroundColor: colors.primary }, isUploading && styles.changeBtnDisabled]}
          onPress={handleChangePhoto}
          disabled={isUploading}
          activeOpacity={0.85}
        >
          {isUploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.changeBtnText}>
                {displayUri ? "Change Photo" : "Add Photo"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Tips */}
        <View style={[styles.tipCard, { backgroundColor: colors.surface }]}>
          <View style={styles.tipHeader}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.tipTitle, { color: colors.textSecondary }]}>Tips for a great photo</Text>
          </View>
          <Text style={[styles.tipText, { color: colors.textMuted }]}>
            • Use a clear, well-lit photo of your face
          </Text>
          <Text style={[styles.tipText, { color: colors.textMuted }]}>
            • Square images work best (1:1 ratio)
          </Text>
          <Text style={[styles.tipText, { color: colors.textMuted }]}>
            • Avoid blurry or dark photos
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" },

  scroll: {
    padding: 24,
    alignItems: "center",
    gap: 24,
  },

  avatarSection: {
    alignItems: "center",
    gap: 12,
    paddingTop: 16,
  },
  avatarRing: {
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 3,
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrap: {
    width: "100%",
    height: "100%",
    borderRadius: 70,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 70,
  },

  uploadPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    alignSelf: "center",
  },
  uploadPillText: { fontSize: 13 },

  userInfo: { alignItems: "center", gap: 3 },
  userName: { fontSize: 18, fontWeight: "700" },
  userEmail: { fontSize: 13 },

  changeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    width: "100%",
    justifyContent: "center",
  },
  changeBtnDisabled: { opacity: 0.6 },
  changeBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },

  tipCard: {
    width: "100%",
    borderRadius: 14,
    padding: 16,
    gap: 8,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  tipTitle: { fontSize: 13, fontWeight: "700" },
  tipText: { fontSize: 13, lineHeight: 20 },
});
