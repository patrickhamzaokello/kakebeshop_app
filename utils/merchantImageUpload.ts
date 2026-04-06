/**
 * Merchant image upload utility
 *
 * Shared flow for logo (profile) and cover image (store_banner):
 *   1. Pick image from gallery (with crop hint)
 *   2. Resize + compress to WebP
 *   3. POST /api/v1/image/presign/  → get S3 presigned URL
 *   4. PUT image blob to S3
 *   5. POST /api/v1/image/confirm/  → register the upload
 *   6. Return image_group_id for the caller to pass to update-logo / update-cover-image
 */

import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import apiService from "@/utils/apiBase";

export type MerchantImageType = "profile" | "store_banner";
type Variant = "thumb" | "medium" | "large";

export type UploadStep =
  | "idle"
  | "picking"
  | "processing"
  | "uploading"
  | "confirming"
  | "done"
  | "error";

// Logo → resize to medium (500 px wide), Cover → large (1024 px wide)
const VARIANT_FOR_TYPE: Record<MerchantImageType, Variant> = {
  profile: "medium",
  store_banner: "large",
};

const TARGET_WIDTH: Record<Variant, number> = {
  thumb: 240,
  medium: 500,
  large: 1024,
};

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function presign(
  imageType: MerchantImageType,
  imageGroupId: string,
  variant: Variant
): Promise<{ upload_url: string; s3_key: string }> {
  const response = await apiService.post("/api/v1/image/presign/", {
    image_type: imageType,
    image_group_id: imageGroupId,
    variant,
  });
  if (!response.success || !response.data?.upload_url) {
    throw new Error("Presign failed");
  }
  return response.data;
}

async function confirm(params: {
  s3Key: string;
  imageType: MerchantImageType;
  imageGroupId: string;
  variant: Variant;
  width: number;
  height: number;
  sizeBytes: number;
}): Promise<void> {
  const response = await apiService.post("/api/v1/image/confirm/", {
    s3_key: params.s3Key,
    image_type: params.imageType,
    image_group_id: params.imageGroupId,
    variant: params.variant,
    width: params.width,
    height: params.height,
    size_bytes: params.sizeBytes,
  });
  if (!response.success) {
    throw new Error("Image confirm failed");
  }
}

/**
 * Full pick → upload flow.
 *
 * @param imageType  "profile" for logo, "store_banner" for cover image
 * @param onStep     Optional progress callback — called at each step
 * @returns          image_group_id on success, null if user cancelled
 * @throws           Error if any upload step fails
 */
export async function pickAndUploadMerchantImage(
  imageType: MerchantImageType,
  onStep?: (step: UploadStep) => void
): Promise<string | null> {
  // ── 1. Pick ───────────────────────────────────────────────────────────────
  onStep?.("picking");

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Media library permission not granted");
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: "images",
    allowsEditing: true,
    aspect: imageType === "profile" ? [1, 1] : [16, 9],
    quality: 0.9,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const variant = VARIANT_FOR_TYPE[imageType];
  const targetWidth = TARGET_WIDTH[variant];

  // ── 2. Process ────────────────────────────────────────────────────────────
  onStep?.("processing");

  const manipulated = await manipulateAsync(
    asset.uri,
    [{ resize: { width: targetWidth } }],
    { compress: 0.85, format: SaveFormat.WEBP }
  );

  // ── 3 + 4. Presign → upload to S3 ────────────────────────────────────────
  onStep?.("uploading");

  const imageGroupId = generateUUID();
  const { upload_url, s3_key } = await presign(imageType, imageGroupId, variant);

  const blob = await fetch(manipulated.uri).then((r) => r.blob());

  const s3Response = await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": "image/webp" },
    body: blob,
  });
  if (!s3Response.ok) {
    throw new Error(`S3 upload failed: ${s3Response.status}`);
  }

  // ── 5. Confirm ────────────────────────────────────────────────────────────
  onStep?.("confirming");

  await confirm({
    s3Key: s3_key,
    imageType,
    imageGroupId,
    variant,
    width: manipulated.width,
    height: manipulated.height,
    sizeBytes: blob.size,
  });

  onStep?.("done");
  return imageGroupId;
}
