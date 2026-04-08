import ScreenWrapper from "@/components/ScreenWrapper";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import Typo from "@/components/Typo";
import { spacingY, spacingX, borderRadius } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { router } from "expo-router";
import Button from "@/components/CustomButton";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import apiService from "@/utils/apiBase";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";


type ImageStatus =
  | "empty"
  | "selected"
  | "processing"
  | "uploaded"
  | "pending"
  | "error";

interface ImageVariant {
  s3_key: string;
  width: number;
  height: number;
  size_bytes: number;
}

interface ImageSlot {
  id: string;
  image_group_id: string; // NEW: UUID for grouping variants
  uri: string | null;
  status: ImageStatus;
  variants: {
    thumb?: ImageVariant;
    medium?: ImageVariant;
    large?: ImageVariant;
  };
  error?: string;
  currentVariant?: string;
}

export default function CaptureListingImages() {
  const { colors, isDark } = useTheme();
  const [images, setImages] = useState<ImageSlot[]>(
    Array.from({ length: 6 }, (_, i) => ({
      id: `slot-${i}`,
      image_group_id: generateUUID(), // Generate UUID for each slot
      uri: null,
      status: "empty" as ImageStatus,
      variants: {},
    }))
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [allImagesUploaded, setAllImagesUploaded] = useState(false);

  // Generate UUID (simple version)
  function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Check if all required images are uploaded
  const checkAllImagesUploaded = (updatedImages: ImageSlot[]) => {
    const requiredUploaded = updatedImages
      .slice(0, 3)
      .every((img) => img.status === "uploaded");
    const optionalValid = updatedImages
      .slice(3)
      .every((img) => img.status === "empty" || img.status === "uploaded");
    setAllImagesUploaded(requiredUploaded && optionalValid);
  };

  // Image picker options handler
  const handleImageSelection = async (index: number) => {
    Alert.alert(
      "Select Image",
      "Choose an option",
      [
        {
          text: "Take Photo",
          onPress: () => openCamera(index),
        },
        {
          text: "Choose from Gallery",
          onPress: () => openGallery(index),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  // Open camera
  const openCamera = async (index: number) => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission required", "Camera permission is required");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      updateImageSlot(index, result.assets[0].uri);
    }
  };

  // Open gallery
  const openGallery = async (index: number) => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission required", "Gallery permission is required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      updateImageSlot(index, result.assets[0].uri);
    }
  };

  // Update image slot
  const updateImageSlot = (index: number, uri: string) => {
    setImages((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        uri,
        status: "selected",
        variants: {},
        error: undefined,
        currentVariant: undefined,
      };
      checkAllImagesUploaded(updated);
      return updated;
    });
  };

  // Clear all images
  const handleClear = () => {
    Alert.alert(
      "Clear All Images",
      "Are you sure you want to remove all images?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            setImages(
              Array.from({ length: 6 }, (_, i) => ({
                id: `slot-${i}`,
                image_group_id: generateUUID(),
                uri: null,
                status: "empty" as ImageStatus,
                variants: {},
              }))
            );
            setAllImagesUploaded(false);
          },
        },
      ]
    );
  };

  const VARIANT_CONFIGS = [
    { name: "thumb",  label: "Scale 1", size: 1000 },
    { name: "medium", label: "Scale 2", size: 1500 },
    { name: "large",  label: "Scale 3", size: 2000 },
  ] as const;

  // Process all newly selected images — never re-processes already-uploaded ones
  const handleProcessImages = async () => {
    // Collect ONLY selected indices before any state mutation
    const indicesToProcess = images.reduce<number[]>((acc, img, i) => {
      if (img.status === "selected") acc.push(i);
      return acc;
    }, []);

    if (indicesToProcess.length === 0) {
      Alert.alert("Nothing to Process", "No new images to process.");
      return;
    }

    const alreadyUploaded = images.filter((img) => img.status === "uploaded").length;
    const totalAfter = alreadyUploaded + indicesToProcess.length;
    if (totalAfter < 3) {
      const needed = 3 - alreadyUploaded - indicesToProcess.length;
      Alert.alert(
        "Insufficient Images",
        `Please add ${needed} more image${needed === 1 ? "" : "s"} to meet the 3-photo minimum.`
      );
      return;
    }

    setIsProcessing(true);

    // Mark only the selected ones as pending — uploaded images are untouched
    setImages((prev) =>
      prev.map((img) =>
        img.status === "selected" ? { ...img, status: "pending" } : img
      )
    );

    for (const i of indicesToProcess) {
      // Read slot data at process time (URI and group ID are stable by this point)
      const slot = images[i];
      if (slot.uri) {
        await processImage(i, slot.uri, slot.image_group_id);
      }
    }

    setIsProcessing(false);
  };

  // Process a single image — accepts uri/group_id explicitly to avoid stale-closure bugs
  const processImage = async (index: number, uri: string, image_group_id: string) => {
    try {
      setImages((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], status: "processing", error: undefined, currentVariant: undefined };
        return updated;
      });

      const variants: any = {};

      for (const config of VARIANT_CONFIGS) {
        setImages((prev) => {
          const updated = [...prev];
          updated[index] = { ...updated[index], currentVariant: config.label };
          return updated;
        });

        // Step 1: Resize and convert to WebP
        let manipResult;
        try {
          manipResult = await manipulateAsync(
            uri,
            [{ resize: { width: config.size, height: config.size } }],
            { compress: 0.8, format: SaveFormat.WEBP }
          );
        } catch (e: any) {
          throw new Error(`Image resize failed for ${config.label}: ${e.message}`);
        }

        const { width, height } = manipResult;
        const fetchRes = await fetch(manipResult.uri);
        const blob = await fetchRes.blob();
        const size_bytes = blob.size;

        // Step 2: Get presigned upload URL
        const presignResponse = await apiService.post<{
          upload_url: string;
          s3_key: string;
          expires_in: number;
        }>("/api/v1/image/presign/", {
          image_type: "listing",
          image_group_id,
          variant: config.name,
        });

        if (!presignResponse.success || !presignResponse.data) {
          throw new Error(`Could not get upload URL for ${config.label}. Check your connection and try again.`);
        }

        const { upload_url, s3_key } = presignResponse.data;

        // Step 3: Upload to S3
        const uploadResponse = await fetch(upload_url, {
          method: "PUT",
          headers: { "Content-Type": "image/webp" },
          body: blob,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed for ${config.label} (HTTP ${uploadResponse.status}). Please try again.`);
        }

        // Step 4: Confirm upload
        const confirmResponse = await apiService.post("/api/v1/image/confirm/", {
          s3_key,
          image_type: "listing",
          image_group_id,
          variant: config.name,
          width,
          height,
          size_bytes,
        });

        if (!confirmResponse.success) {
          throw new Error(`Upload confirmation failed for ${config.label}. Please retry.`);
        }

        variants[config.name] = { s3_key, width, height, size_bytes };
      }

      setImages((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], status: "uploaded", variants, currentVariant: undefined, error: undefined };
        checkAllImagesUploaded(updated);
        return updated;
      });
    } catch (error: any) {
      if (__DEV__) console.error(`Image [${index + 1}] error:`, error);
      const errorMsg: string = error?.message || "Upload failed. Please try again.";
      setImages((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], status: "error", error: errorMsg, currentVariant: undefined };
        return updated;
      });
    }
  };

  // Retry a single failed image
  const retryImage = async (index: number) => {
    const slot = images[index];
    if (!slot.uri) return;
    setIsProcessing(true);
    await processImage(index, slot.uri, slot.image_group_id);
    setIsProcessing(false);
  };

  // Remove single image
  const removeImage = (index: number) => {
    setImages((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        uri: null,
        status: "empty",
        variants: {},
        error: undefined,
        currentVariant: undefined,
        image_group_id: generateUUID(), // Generate new UUID when removing
      };
      checkAllImagesUploaded(updated);
      return updated;
    });
  };

  // Navigate to next screen - pass image_group_ids instead of full image data
  const handleNext = () => {
    // Get image_group_ids of uploaded images in order
    const uploadedImageGroupIds = images
      .filter((img) => img.status === "uploaded")
      .map((img) => img.image_group_id);

    router.push({
      pathname: "/listings/capture_listing_details",
      params: {
        image_group_ids: JSON.stringify(uploadedImageGroupIds),
      },
    });
  };

  // Render image box
  const renderImageBox = (imageSlot: ImageSlot, index: number) => {
    const isRequired = index < 3;

    return (
      <TouchableOpacity
        key={imageSlot.id}
        style={[
          styles.imageBox,
          { backgroundColor: colors.neutral100, borderColor: colors.neutral200 },
          imageSlot.status === "uploaded" && { borderColor: colors.success, borderStyle: "solid" },
          imageSlot.status === "error" && { borderColor: colors.error, borderStyle: "solid" },
        ]}
        onPress={() => {
          if (imageSlot.status === "empty" || imageSlot.status === "selected") {
            handleImageSelection(index);
          }
        }}
        disabled={isProcessing}
      >
        {/* Required badge */}
        {isRequired && (
          <View style={[styles.requiredBadge, { backgroundColor: colors.primary }]}>
            <Typo size={10} color="#FFFFFF" fontWeight="600">
              Required
            </Typo>
          </View>
        )}

        {/* Empty state */}
        {imageSlot.status === "empty" && (
          <View style={styles.emptyState}>
            <Ionicons name="camera-outline" size={32} color={colors.neutral400} />
            <Typo size={12} color={colors.neutral400} style={{ marginTop: 8 }}>
              {isRequired ? "Required" : "Optional"}
            </Typo>
          </View>
        )}

        {/* Selected state */}
        {imageSlot.status === "selected" && imageSlot.uri && (
          <>
            <Image source={{ uri: imageSlot.uri }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeImage(index)}
            >
              <Ionicons name="close-circle" size={24} color={colors.error} />
            </TouchableOpacity>
          </>
        )}

        {/* Pending state */}
        {imageSlot.status === "pending" && imageSlot.uri && (
          <>
            <Image
              source={{ uri: imageSlot.uri }}
              style={[styles.imagePreview, styles.imageProcessing]}
            />
            <View style={[styles.statusOverlay, { backgroundColor: colors.overlay }]}>
              <Typo size={12} color={colors.textMuted}>
                Pending
              </Typo>
            </View>
          </>
        )}

        {/* Processing state */}
        {imageSlot.status === "processing" && imageSlot.uri && (
          <>
            <Image
              source={{ uri: imageSlot.uri }}
              style={[styles.imagePreview, styles.imageProcessing]}
            />
            <View style={[styles.statusOverlay, { backgroundColor: colors.overlay }]}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Typo size={11} color={colors.primary} style={{ marginTop: 4 }}>
                {imageSlot.currentVariant ? `${imageSlot.currentVariant}...` : "Processing..."}
              </Typo>
            </View>
          </>
        )}

        {/* Uploaded state */}
        {imageSlot.status === "uploaded" && imageSlot.uri && (
          <>
            <Image source={{ uri: imageSlot.uri }} style={styles.imagePreview} />
            <View style={[styles.uploadedBadge, { backgroundColor: colors.surface }]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            </View>
          </>
        )}

        {/* Error state */}
        {imageSlot.status === "error" && imageSlot.uri && (
          <>
            <Image
              source={{ uri: imageSlot.uri }}
              style={[styles.imagePreview, styles.imageProcessing]}
            />
            <View style={[styles.statusOverlay, { backgroundColor: colors.overlay }]}>
              <MaterialIcons name="error-outline" size={22} color={colors.error} />
              <Typo
                size={10}
                color={colors.error}
                style={{ marginTop: 2, textAlign: "center", paddingHorizontal: 6 }}
                numberOfLines={3}
              >
                {imageSlot.error || "Upload failed"}
              </Typo>
              <TouchableOpacity
                style={[styles.retryButton, { marginTop: 6 }]}
                onPress={() => retryImage(index)}
                disabled={isProcessing}
              >
                <MaterialIcons name="refresh" size={18} color="#fff" />
                <Typo size={11} color="#fff" style={{ marginTop: 2 }}>
                  Retry
                </Typo>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeImage(index)}
              disabled={isProcessing}
            >
              <Ionicons name="close-circle" size={24} color={colors.error} />
            </TouchableOpacity>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
         <SafeAreaView edges={["top"]} />
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Typo size={24} fontWeight="700" color={colors.textPrimary}>
            Add Listing Photos
          </Typo>
          <Typo size={14} color={colors.textMuted} style={{ marginTop: 4 }}>
            Add at least 3 photos to continue
          </Typo>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Image Grid */}
          <View style={styles.gridContainer}>
            {images.map((imageSlot, index) => renderImageBox(imageSlot, index))}
          </View>

          {/* Instructions */}
          <View style={[styles.instructionsContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <Typo size={14} fontWeight="600" color={colors.textPrimary}>
              Photo Tips:
            </Typo>
            <Typo size={13} color={colors.textSecondary} style={{ marginTop: 8 }}>
              • Use good lighting and clear images
            </Typo>
            <Typo size={13} color={colors.textSecondary} style={{ marginTop: 4 }}>
              • Show the product from different angles
            </Typo>
            <Typo size={13} color={colors.textSecondary} style={{ marginTop: 4 }}>
              • Avoid blurry or low-quality photos
            </Typo>
            <Typo size={13} color={colors.textSecondary} style={{ marginTop: 4 }}>
              • Images will be cropped to square (1:1) and resized
            </Typo>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {/* Clear Button */}
            <TouchableOpacity
              style={[styles.clearButton, { borderColor: colors.error }]}
              onPress={handleClear}
              disabled={
                isProcessing ||
                images.every((img) => img.status === "empty")
              }
            >
              <Typo size={14} fontWeight="600" color={colors.error}>
                Clear All
              </Typo>
            </TouchableOpacity>

            {/* Process Button */}
            {!allImagesUploaded && (
              <Button
                style={[styles.processButton, { backgroundColor: colors.primary }]}
                onPress={handleProcessImages}
                disabled={
                  isProcessing ||
                  images.filter((img) => img.status === "selected").length === 0
                }
                loading={isProcessing}
              >
                <Typo size={16} fontWeight="600" color="#FFFFFF">
                  {isProcessing ? "Processing..." : "Process Images"}
                </Typo>
              </Button>
            )}

            {/* Next Button */}
            {allImagesUploaded && (
              <Button style={[styles.nextButton, { backgroundColor: colors.success }]} onPress={handleNext}>
                <Typo size={16} fontWeight="600" color="#FFFFFF">
                  Next
                </Typo>
              </Button>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacingX._16,
    paddingTop: spacingY._20,
    paddingBottom: spacingY._16,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: spacingX._16,
    paddingBottom: spacingY._30,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: spacingY._20,
  },
  imageBox: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: borderRadius.md,
    marginBottom: spacingY._12,
    overflow: "hidden",
    borderWidth: 2,
    borderStyle: "dashed",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  requiredBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  imageProcessing: {
    opacity: 0.5,
  },
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 2,
  },
  statusOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadedBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    borderRadius: 20,
  },
  retryButton: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  instructionsContainer: {
    padding: spacingX._16,
    borderRadius: borderRadius.md,
    marginBottom: spacingY._20,
  },
  actionButtons: {
    gap: spacingY._12,
  },
  clearButton: {
    paddingVertical: spacingY._15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: borderRadius.md,
  },
  processButton: {
    paddingVertical: spacingY._15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.md,
  },
  nextButton: {
    paddingVertical: spacingY._15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.md,
  },
});