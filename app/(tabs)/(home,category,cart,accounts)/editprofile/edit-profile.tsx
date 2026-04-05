import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import apiService from "@/utils/apiBase";
import { useTheme } from "@/contexts/ThemeContext";
import { DetailHeaderSection } from "@/components/test/DetailHeader";

interface UserProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  profile_image: string | null;
  phone: string | null;
  bio: string | null;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [profile, setProfile] = useState<UserProfile>({
    id: "",
    username: "",
    name: "",
    email: "",
    phone: "",
    bio: "",
    profile_image: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(isDark ? "light-content" : "dark-content");
    }, [isDark])
  );

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await apiService.get("/auth/profile/");
      if (response.success && response.data.user) {
        const userData = response.data.user;
        setProfile({
          id: userData.id,
          username: userData.username,
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          bio: userData.bio || "",
          profile_image: userData.profile_image,
        });
        if (userData.profile_image) setImageUri(userData.profile_image);
      }
    } catch (error) {
      if (__DEV__) console.error("Error fetching profile:", error);
      Alert.alert("Error", "Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please grant camera roll permissions to change your profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const validateForm = (): boolean => {
    if (!profile.name.trim()) {
      Alert.alert("Validation Error", "Please enter your name");
      return false;
    }
    if (!profile.email.trim()) {
      Alert.alert("Validation Error", "Please enter your email");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profile.email)) {
      Alert.alert("Validation Error", "Please enter a valid email address");
      return false;
    }
    if (profile.bio && profile.bio.length > 200) {
      Alert.alert("Validation Error", "Bio must be 200 characters or less");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);

    try {
      const formData = new FormData();
      formData.append("name", profile.name);
      formData.append("email", profile.email);
      if (profile.phone) formData.append("phone", profile.phone);
      if (profile.bio) formData.append("bio", profile.bio);

      if (imageUri && !imageUri.startsWith("http")) {
        const filename = imageUri.split("/").pop() || "profile.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";
        formData.append("profile_image", { uri: imageUri, name: filename, type } as any);
      }

      const response = await apiService.patch("/auth/profile/", formData);

      if (response.success) {
        Alert.alert("Success", "Profile updated successfully", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Error", response.data?.message || "Failed to update profile");
      }
    } catch (error: any) {
      if (__DEV__) console.error("Error updating profile:", error);
      Alert.alert("Error", error.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const styles = getStyles(colors);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E60549" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DetailHeaderSection title="Edit Profile" subheading="Update your name, email, and photo" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Image */}
        <View style={styles.imageSection}>
          <View style={styles.imageContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.profileImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="person" size={50} color={colors.textMuted} />
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.changeImageButton} onPress={pickImage} activeOpacity={0.7}>
            <Ionicons name="camera-outline" size={18} color="#E60549" />
            <Text style={styles.changeImageText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.readOnlyInput}>
              <Text style={styles.readOnlyText}>{profile.username}</Text>
              <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
            </View>
            <Text style={styles.helpText}>Username cannot be changed</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={profile.name}
              onChangeText={(text) => setProfile({ ...profile, name: text })}
              placeholder="Enter your full name"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Email <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={profile.email}
              onChangeText={(text) => setProfile({ ...profile, email: text })}
              placeholder="Enter your email"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={profile.phone || ""}
              onChangeText={(text) => setProfile({ ...profile, phone: text })}
              placeholder="Enter your phone number"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />
            <Text style={styles.helpText}>Add your phone number for verification</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={profile.bio || ""}
              onChangeText={(text) => {
                if (text.length <= 200) setProfile({ ...profile, bio: text });
              }}
              placeholder="Tell us about yourself"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={200}
            />
            <Text style={styles.helpText}>{(profile.bio || "").length}/200 characters</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.7}
        >
          {saving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="white" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
  scrollView: {
    flex: 1,
  },

  imageSection: {
    backgroundColor: colors.surface,
    paddingVertical: 32,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  imageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  changeImageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
  },
  changeImageText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E60549",
  },

  formSection: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  required: {
    color: "#E60549",
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textPrimary,
  },
  readOnlyInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  readOnlyText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  helpText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
  },

  footer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 2,
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#E60549",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
  },
  disabledButton: {
    backgroundColor: colors.textMuted,
  },
});
