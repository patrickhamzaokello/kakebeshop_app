import React, { useCallback, useEffect, useRef, useState } from "react";
import { TextInput } from "@/components/TextInput";
import {
  ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal,
  Platform, Pressable, ScrollView, StyleSheet, TouchableOpacity, View, Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import apiService from "@/utils/apiBase";
import { merchantBase } from "@/utils/services/merchantService";
import Typo from "@/components/Typo";
import { categoryService } from "@/utils/services/categoryService";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Category { id: number; name: string; slug: string; }
type PriceType = "FIXED" | "RANGE" | "ON_REQUEST";
type ListingType = "PRODUCT" | "SERVICE";
type ListingStatus = "DRAFT" | "PENDING" | "ACTIVE" | "REJECTED" | "EXPIRED";

interface ImageGroup {
  // Flat response shape from /api/v1/listings/{id}/
  id?: string;              // image record ID
  image_group_id?: string;  // group UUID — what remove_image_group_ids expects
  image?: string;           // full-size URL
  thumbnail?: string;       // thumbnail URL
  // Grouped variant shape (used in some endpoints)
  thumb?: { id: string; image: string };
  medium?: { id: string; image: string };
  large?: { id: string; image: string };
}

/** Returns the group UUID used in remove_image_group_ids for the PATCH body. */
function getGroupId(group: ImageGroup): string | null {
  return group.image_group_id ?? null;
}

interface ListingDetail {
  id: string;
  title: string;
  description: string;
  listing_type: ListingType;
  category: { id: number; name: string };
  price_type: PriceType;
  price?: string;
  price_min?: string;
  price_max?: string;
  currency: string;
  is_price_negotiable: boolean;
  status: ListingStatus;
  rejection_reason?: string;
  images: ImageGroup[];
  tags: { id: number; name: string }[];
}

type NewImgStatus = "empty" | "selected" | "processing" | "uploaded" | "error";
interface NewImg {
  id: string;
  groupId: string;
  uri: string | null;
  status: NewImgStatus;
  error?: string;
  progress?: string; // e.g., "Scale 2 / 3"
}

const VARIANT_CONFIGS = [
  { name: "thumb",  label: "1", size: 1000 },
  { name: "medium", label: "2", size: 1500 },
  { name: "large",  label: "3", size: 2000 },
] as const;

const MAX_TOTAL_IMAGES = 6;

function makeUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ListingStatus, {
  label: string; color: string; bg: string; icon: string; message: string;
}> = {
  ACTIVE:   { label: "Active",        color: "#10B981", bg: "#ECFDF5", icon: "checkmark-circle",  message: "This listing is live. Editing resets its review status." },
  PENDING:  { label: "Under Review",  color: "#F59E0B", bg: "#FFFBEB", icon: "time-outline",       message: "Currently under review. You can still edit and resubmit." },
  REJECTED: { label: "Rejected",      color: "#EF4444", bg: "#FEF2F2", icon: "close-circle",       message: "Fix the issues below and resubmit for review." },
  DRAFT:    { label: "Draft",         color: "#6B7280", bg: "#F9FAFB", icon: "document-outline",   message: "This is a draft. Submit for review when ready." },
  EXPIRED:  { label: "Expired",       color: "#6B7280", bg: "#F9FAFB", icon: "hourglass-outline",  message: "This listing expired. Edit and resubmit to relist." },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBestImageUri(group: ImageGroup): string | null {
  if (group.large?.image)  return group.large.image;
  if (group.medium?.image) return group.medium.image;
  if (group.thumb?.image)  return group.thumb.image;
  if (group.image)         return group.image;
  if (group.thumbnail)     return group.thumbnail;
  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Card({ children, colors, style }: { children: React.ReactNode; colors: any; style?: any }) {
  return (
    <View style={[
      {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 18,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
      },
      style,
    ]}>
      {children}
    </View>
  );
}

function CardLabel({ title, colors }: { title: string; colors: any }) {
  return (
    <Typo
      size={11}
      fontWeight="700"
      color={colors.textMuted}
      style={{ letterSpacing: 0.9, marginBottom: 14, textTransform: "uppercase" }}
    >
      {title}
    </Typo>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 5 }}>
      <Ionicons name="alert-circle-outline" size={13} color="#EF4444" />
      <Typo size={12} color="#EF4444">{msg}</Typo>
    </View>
  );
}

function FieldHint({ msg, colors }: { msg?: string; colors: any }) {
  if (!msg) return null;
  return <Typo size={12} color={colors.textMuted} style={{ marginTop: 5 }}>{msg}</Typo>;
}

function FieldLabel({ label, required, colors }: { label: string; required?: boolean; colors: any }) {
  return (
    <View style={{ flexDirection: "row", marginBottom: 8 }}>
      <Typo size={13} fontWeight="600" color={colors.textSecondary}>{label}</Typo>
      {required && <Typo size={13} color="#EF4444"> *</Typo>}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function EditListingScreen() {
  const { colors, isDark } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [originalStatus, setOriginalStatus] = useState<ListingStatus>("DRAFT");
  const [rejectionReason, setRejectionReason] = useState("");
  const [existingImages, setExistingImages]   = useState<ImageGroup[]>([]);
  const [removedGroupIds, setRemovedGroupIds] = useState<string[]>([]);

  // New images to add
  const [newImages, setNewImages] = useState<NewImg[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Form
  const [title, setTitle]                     = useState("");
  const [description, setDescription]         = useState("");
  const [listingType, setListingType]         = useState<ListingType>("PRODUCT");
  const [priceType, setPriceType]             = useState<PriceType>("FIXED");
  const [price, setPrice]                     = useState("");
  const [priceMin, setPriceMin]               = useState("");
  const [priceMax, setPriceMax]               = useState("");
  const [isPriceNegotiable, setIsPriceNegotiable] = useState(false);
  const [categoryId, setCategoryId]           = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [tagChips, setTagChips]               = useState<string[]>([]);
  const [tagInput, setTagInput]               = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Category modal
  const [categories, setCategories]         = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [catPage, setCatPage]               = useState(1);
  const [catHasMore, setCatHasMore]         = useState(false);
  const [catLoadingMore, setCatLoadingMore] = useState(false);
  const catFetchingRef                      = useRef(false);
  const [categoryQuery, setCategoryQuery]   = useState("");
  const [searchResults, setSearchResults]   = useState<Category[]>([]);
  const [searching, setSearching]           = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showPriceTypeModal, setShowPriceTypeModal] = useState(false);

  const tagInputRef = useRef<TextInput>(null);
  const scrollRef   = useRef<ScrollView>(null);

  // ─── Load data ────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      try {
        const [listingRes, catResult] = await Promise.all([
          apiService.get<ListingDetail>(`/api/v1/listings/${id}/`),
          categoryService.getParentCategories(1),
        ]);
        setCategories(catResult.results as unknown as Category[]);
        setCatHasMore(catResult.hasMore);

        if (listingRes.success && listingRes.data) {
          const l = listingRes.data;
          setTitle(l.title);
          setDescription(l.description);
          setListingType(l.listing_type);
          setPriceType(l.price_type);
          setPrice(l.price ?? "");
          setPriceMin(l.price_min ?? "");
          setPriceMax(l.price_max ?? "");
          setIsPriceNegotiable(l.is_price_negotiable);
          setCategoryId(l.category.id);
          setSelectedCategory({ id: l.category.id, name: l.category.name, slug: "" });
          setTagChips(l.tags.map((t) => t.name));
          setOriginalStatus(l.status);
          setRejectionReason(l.rejection_reason ?? "");
          setExistingImages(l.images ?? []);
        } else {
          throw new Error("Could not load listing.");
        }
      } catch (e: any) {
        Alert.alert("Error", e.message ?? "Failed to load listing.", [
          { text: "Go Back", onPress: () => router.back() },
        ]);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ─── Category ─────────────────────────────────────────────────────────────

  const loadMoreCategories = async () => {
    if (catFetchingRef.current || !catHasMore || categoryQuery.trim()) return;
    catFetchingRef.current = true;
    setCatLoadingMore(true);
    try {
      const nextPage = catPage + 1;
      const result = await categoryService.getParentCategories(nextPage);
      setCategories((prev) => [...prev, ...(result.results as unknown as Category[])]);
      setCatHasMore(result.hasMore);
      setCatPage(nextPage);
    } finally {
      catFetchingRef.current = false;
      setCatLoadingMore(false);
    }
  };

  const handleCategorySearch = (q: string) => {
    setCategoryQuery(q);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!q.trim()) { setSearchResults([]); setSearching(false); return; }
    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      const results = await categoryService.searchCategories(q.trim());
      setSearchResults(results as unknown as Category[]);
      setSearching(false);
    }, 300);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setCategoryQuery("");
    setSearchResults([]);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
  };

  // ─── Tags ──────────────────────────────────────────────────────────────────

  const commitTag = useCallback((raw: string) => {
    const value = raw.trim().replace(/^[,\s]+|[,\s]+$/g, "").toLowerCase();
    if (!value) return;
    setTagChips((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setTagInput("");
  }, []);

  const handleTagInputChange = useCallback((text: string) => {
    if (text.endsWith(" ") || text.endsWith(",")) commitTag(text);
    else setTagInput(text);
  }, [commitTag]);

  const removeTag = useCallback((tag: string) => {
    setTagChips((prev) => prev.filter((t) => t !== tag));
  }, []);

  // ─── Images ────────────────────────────────────────────────────────────────

  const markImageForRemoval = (group: ImageGroup) => {
    const gid = getGroupId(group);
    if (!gid) return;
    setRemovedGroupIds((prev) =>
      prev.includes(gid) ? prev.filter((id) => id !== gid) : [...prev, gid]
    );
  };

  // ─── New image upload helpers ─────────────────────────────────────────────

  const pickAndUploadImage = async () => {
    const activeExisting = existingImages.length - removedGroupIds.length;
    const activeNew      = newImages.filter((n) => n.status !== "error").length;
    if (activeExisting + activeNew >= MAX_TOTAL_IMAGES) {
      Alert.alert("Limit reached", `Listings can have at most ${MAX_TOTAL_IMAGES} photos.`);
      return;
    }

    Alert.alert("Add Photo", "Choose a source", [
      { text: "Camera",  onPress: () => openImageSource("camera") },
      { text: "Gallery", onPress: () => openImageSource("gallery") },
      { text: "Cancel",  style: "cancel" },
    ]);
  };

  const openImageSource = async (source: "camera" | "gallery") => {
    if (source === "camera") {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) { Alert.alert("Permission required", "Camera permission is needed."); return; }
    } else {
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) { Alert.alert("Permission required", "Gallery permission is needed."); return; }
    }

    const result = source === "camera"
      ? await ImagePicker.launchCameraAsync({ mediaTypes: "images", allowsEditing: true, aspect: [4, 3], quality: 1 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: "images", allowsEditing: true, aspect: [4, 3], quality: 1 });

    if (result.canceled || !result.assets[0]) return;

    const newSlot: NewImg = {
      id: makeUUID(),
      groupId: makeUUID(),
      uri: result.assets[0].uri,
      status: "selected",
    };
    setNewImages((prev) => [...prev, newSlot]);
    uploadNewImage(newSlot);
  };

  const uploadNewImage = async (slot: NewImg) => {
    setUploadingImages(true);
    try {
      setNewImages((prev) =>
        prev.map((n) => n.id === slot.id ? { ...n, status: "processing", progress: "Scale 1 / 3" } : n)
      );

      for (let vi = 0; vi < VARIANT_CONFIGS.length; vi++) {
        const config = VARIANT_CONFIGS[vi];
        setNewImages((prev) =>
          prev.map((n) => n.id === slot.id ? { ...n, progress: `Scale ${vi + 1} / 3` } : n)
        );

        const manipResult = await manipulateAsync(
          slot.uri!,
          [{ resize: { width: config.size, height: config.size } }],
          { compress: 0.8, format: SaveFormat.WEBP }
        );

        const { width, height } = manipResult;
        const fetchRes = await fetch(manipResult.uri);
        const blob = await fetchRes.blob();

        const presignRes = await apiService.post<{ upload_url: string; s3_key: string }>(
          "/api/v1/image/presign/",
          { image_type: "listing", image_group_id: slot.groupId, variant: config.name }
        );
        if (!presignRes.success || !presignRes.data) throw new Error(`Presign failed for ${config.name}`);

        const uploadRes = await fetch(presignRes.data.upload_url, {
          method: "PUT",
          headers: { "Content-Type": "image/webp" },
          body: blob,
        });
        if (!uploadRes.ok) throw new Error(`Upload failed (HTTP ${uploadRes.status})`);

        const confirmRes = await apiService.post("/api/v1/image/confirm/", {
          s3_key: presignRes.data.s3_key,
          image_type: "listing",
          image_group_id: slot.groupId,
          variant: config.name,
          width,
          height,
          size_bytes: blob.size,
        });
        if (!confirmRes.success) throw new Error(`Confirm failed for ${config.name}`);
      }

      setNewImages((prev) =>
        prev.map((n) => n.id === slot.id ? { ...n, status: "uploaded", progress: undefined } : n)
      );
    } catch (err: any) {
      setNewImages((prev) =>
        prev.map((n) => n.id === slot.id ? { ...n, status: "error", progress: undefined, error: err?.message ?? "Upload failed" } : n)
      );
    } finally {
      setUploadingImages(false);
    }
  };

  const retryNewImage = (img: NewImg) => {
    setNewImages((prev) =>
      prev.map((n) => n.id === img.id ? { ...n, status: "selected", error: undefined } : n)
    );
    uploadNewImage({ ...img, status: "selected" });
  };

  const removeNewImage = (imgId: string) => {
    setNewImages((prev) => prev.filter((n) => n.id !== imgId));
  };

  // ─── Validation ────────────────────────────────────────────────────────────

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Title is required.";
    else if (title.trim().length < 5) e.title = "Title must be at least 5 characters.";
    if (!description.trim()) e.description = "Description is required.";
    else if (description.trim().length < 20) e.description = "Description must be at least 20 characters.";
    if (!categoryId) e.category = "Please select a category.";
    if (priceType === "FIXED") {
      if (!price || parseFloat(price) <= 0) e.price = "Enter a valid price.";
    } else if (priceType === "RANGE") {
      if (!priceMin || parseFloat(priceMin) <= 0) e.priceMin = "Enter a valid minimum price.";
      else if (!priceMax || parseFloat(priceMax) <= 0) e.priceMax = "Enter a valid maximum price.";
      else if (parseFloat(priceMin) >= parseFloat(priceMax)) e.priceMin = "Minimum must be less than maximum.";
    }
    setErrors(e);
    if (Object.keys(e).length > 0) scrollRef.current?.scrollTo({ y: 0, animated: true });
    return Object.keys(e).length === 0;
  };

  // ─── Submit ────────────────────────────────────────────────────────────────

  const handleSave = async (resubmit = false) => {
    if (!validate()) return;

    // Block save if any new image is still uploading
    const hasUploading = newImages.some((n) => n.status === "processing" || n.status === "selected");
    if (hasUploading) {
      Alert.alert("Uploading…", "Please wait for all images to finish uploading before saving.");
      return;
    }

    setSubmitting(true);
    try {
      const pendingTag = tagInput.trim().toLowerCase();
      const allTags = pendingTag && !tagChips.includes(pendingTag)
        ? [...tagChips, pendingTag] : tagChips;

      const body: Record<string, any> = {
        title: title.trim(),
        description: description.trim(),
        listing_type: listingType,
        category: categoryId,
        price_type: priceType,
        currency: "UGX",
        is_price_negotiable: isPriceNegotiable,
        tags: allTags,
      };

      if (priceType === "FIXED") body.price = String(parseFloat(price).toFixed(2));
      else if (priceType === "RANGE") {
        body.price_min = String(parseFloat(priceMin).toFixed(2));
        body.price_max = String(parseFloat(priceMax).toFixed(2));
      }
      if (resubmit) body.status = "PENDING";
      if (removedGroupIds.length > 0) body.remove_image_group_ids = removedGroupIds;

      const res = await apiService.patch<ListingDetail>(`/api/v1/listings/${id}/`, body);

      if (!res.success) {
        const errData = res.data as any;
        if (errData && typeof errData === "object") {
          const fieldErrors: Record<string, string> = {};
          for (const [k, v] of Object.entries(errData)) {
            fieldErrors[k] = Array.isArray(v) ? (v as string[]).join(" ") : String(v);
          }
          if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            scrollRef.current?.scrollTo({ y: 0, animated: true });
            return;
          }
        }
        throw new Error(res.message || "Failed to update listing.");
      }

      // Attach any newly uploaded images to this listing
      const uploadedGroupIds = newImages
        .filter((n) => n.status === "uploaded")
        .map((n) => n.groupId);

      if (uploadedGroupIds.length > 0) {
        await apiService.post("/api/v1/image/attach/", {
          image_group_ids: uploadedGroupIds,
          object_id: id,
          image_type: "listing",
        });
      }

      Alert.alert(
        resubmit ? "Submitted for Review" : "Changes Saved",
        resubmit
          ? "Your listing has been resubmitted. It will go live once approved."
          : "Your listing has been updated.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to save changes. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    Alert.alert("Discard Changes?", "Any unsaved edits will be lost.", [
      { text: "Keep Editing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => router.back() },
    ]);
  };

  // ─── Derived ──────────────────────────────────────────────────────────────

  const statusConf  = STATUS_CONFIG[originalStatus] ?? STATUS_CONFIG.DRAFT;
  const displayImages   = existingImages.filter((g) => getBestImageUri(g));
  const activeExisting  = displayImages.length - removedGroupIds.length;
  const canAddMore      = activeExisting + newImages.filter((n) => n.status !== "error").length < MAX_TOTAL_IMAGES;
  const canResubmit     = ["DRAFT", "REJECTED", "EXPIRED", "ACTIVE", "PENDING"].includes(originalStatus);

  const PRICE_TYPE_OPTIONS: { value: PriceType; label: string; desc: string; icon: string }[] = [
    { value: "FIXED",      label: "Fixed",    desc: "Single set price",       icon: "pricetag" },
    { value: "RANGE",      label: "Range",    desc: "Min – max price band",   icon: "swap-horizontal" },
    { value: "ON_REQUEST", label: "On Request", desc: "Buyer contacts for price", icon: "chatbubble-ellipses" },
  ];

  // ─── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Typo size={14} color={colors.textMuted} style={{ marginTop: 12 }}>Loading listing…</Typo>
      </View>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* ── Header ── */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.surface }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={handleBack}
            disabled={submitting}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Typo size={16} fontWeight="700" color={colors.textPrimary}>Edit Listing</Typo>
            <View style={[styles.statusBadge, { backgroundColor: statusConf.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusConf.color }]} />
              <Typo size={11} fontWeight="700" color={statusConf.color}>{statusConf.label}</Typo>
            </View>
          </View>

          <View style={styles.headerIconBtn} />
        </View>
      </SafeAreaView>

      {/* ── Scroll body ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Status card ── */}
          <View style={[styles.statusCard, {
            backgroundColor: statusConf.bg,
            borderLeftColor: statusConf.color,
          }]}>
            <View style={[styles.statusIconWrap, { backgroundColor: statusConf.color + "22" }]}>
              <Ionicons name={statusConf.icon as any} size={22} color={statusConf.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Typo size={14} fontWeight="700" color={statusConf.color}>{statusConf.label}</Typo>
              <Typo size={13} color={statusConf.color} style={{ marginTop: 2, opacity: 0.8, lineHeight: 18 }}>
                {statusConf.message}
              </Typo>
              {originalStatus === "REJECTED" && rejectionReason ? (
                <View style={[styles.rejectionBox, { backgroundColor: "#FEF2F2", borderColor: "#EF4444" }]}>
                  <Typo size={12} fontWeight="600" color="#EF4444">Reason:</Typo>
                  <Typo size={12} color="#EF4444" style={{ marginTop: 2, lineHeight: 17 }}>{rejectionReason}</Typo>
                </View>
              ) : null}
            </View>
          </View>

          {/* ── Basic Information ── */}
          <Card colors={colors}>
            <CardLabel title="Basic Information" colors={colors} />

            <FieldLabel label="Title" required colors={colors} />
            <TextInput
              style={[styles.input, {
                borderColor: errors.title ? "#EF4444" : colors.inputBorder,
                backgroundColor: colors.background,
                color: colors.textPrimary,
              }]}
              placeholder="e.g., iPhone 15 Pro Max 256GB"
              placeholderTextColor={colors.textPlaceholder}
              value={title}
              onChangeText={(t) => { setTitle(t); clearError("title"); }}
              maxLength={255}
              editable={!submitting}
              returnKeyType="next"
            />
            <View style={styles.fieldFooter}>
              <FieldError msg={errors.title} />
              <Typo size={11} color={colors.textMuted} style={{ marginLeft: "auto" }}>{title.length}/255</Typo>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <FieldLabel label="Description" required colors={colors} />
            <TextInput
              style={[styles.input, styles.textArea, {
                borderColor: errors.description ? "#EF4444" : colors.inputBorder,
                backgroundColor: colors.background,
                color: colors.textPrimary,
              }]}
              placeholder="Describe your listing in detail…"
              placeholderTextColor={colors.textPlaceholder}
              value={description}
              onChangeText={(t) => { setDescription(t); clearError("description"); }}
              multiline
              textAlignVertical="top"
              editable={!submitting}
            />
            <View style={styles.fieldFooter}>
              <FieldError msg={errors.description} />
              <Typo size={11} color={description.length < 20 ? "#F59E0B" : colors.textMuted} style={{ marginLeft: "auto" }}>
                {description.length} / 20 min
              </Typo>
            </View>
          </Card>

          {/* ── Type & Category ── */}
          <Card colors={colors}>
            <CardLabel title="Type & Category" colors={colors} />

            <FieldLabel label="Listing Type" required colors={colors} />
            <View style={styles.segmentRow}>
              {(["PRODUCT", "SERVICE"] as ListingType[]).map((t) => {
                const active = listingType === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.segmentBtn, {
                      backgroundColor: active ? colors.primary : colors.background,
                      borderColor: active ? colors.primary : colors.border,
                    }]}
                    onPress={() => setListingType(t)}
                    disabled={submitting}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={t === "PRODUCT" ? "cube-outline" : "briefcase-outline"}
                      size={16}
                      color={active ? "#fff" : colors.textMuted}
                    />
                    <Typo size={14} fontWeight="600" color={active ? "#fff" : colors.textSecondary} style={{ marginLeft: 6 }}>
                      {t === "PRODUCT" ? "Product" : "Service"}
                    </Typo>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <FieldLabel label="Category" required colors={colors} />
            <TouchableOpacity
              style={[styles.selectRow, {
                borderColor: errors.category ? "#EF4444" : colors.inputBorder,
                backgroundColor: colors.background,
              }]}
              onPress={() => setShowCategoryModal(true)}
              disabled={submitting}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                {selectedCategory ? (
                  <Typo size={15} color={colors.textPrimary}>{selectedCategory.name}</Typo>
                ) : (
                  <Typo size={15} color={colors.textPlaceholder}>Select a category…</Typo>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
            <FieldError msg={errors.category} />
          </Card>

          {/* ── Pricing ── */}
          <Card colors={colors}>
            <CardLabel title="Pricing" colors={colors} />

            <FieldLabel label="Price Type" required colors={colors} />
            <View style={styles.priceTypeRow}>
              {PRICE_TYPE_OPTIONS.map((opt) => {
                const active = priceType === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.priceTypeChip, {
                      borderColor: active ? colors.primary : colors.border,
                      backgroundColor: active ? colors.primary + "12" : colors.background,
                    }]}
                    onPress={() => setPriceType(opt.value)}
                    disabled={submitting}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={opt.icon as any} size={15} color={active ? colors.primary : colors.textMuted} />
                    <Typo size={13} fontWeight={active ? "700" : "500"} color={active ? colors.primary : colors.textSecondary} style={{ marginLeft: 5 }}>
                      {opt.label}
                    </Typo>
                  </TouchableOpacity>
                );
              })}
            </View>

            {priceType !== "ON_REQUEST" && (
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            )}

            {priceType === "FIXED" && (
              <>
                <FieldLabel label="Price (UGX)" required colors={colors} />
                <View style={[styles.currencyRow, {
                  borderColor: errors.price ? "#EF4444" : colors.inputBorder,
                  backgroundColor: colors.background,
                }]}>
                  <View style={[styles.currencyBadge, { backgroundColor: colors.border }]}>
                    <Typo size={13} fontWeight="600" color={colors.textMuted}>UGX</Typo>
                  </View>
                  <TextInput
                    style={[styles.currencyInput, { color: colors.textPrimary }]}
                    placeholder="0"
                    placeholderTextColor={colors.textPlaceholder}
                    value={price}
                    onChangeText={(t) => { setPrice(t.replace(/[^0-9.]/g, "")); clearError("price"); }}
                    keyboardType="decimal-pad"
                    editable={!submitting}
                  />
                </View>
                <FieldError msg={errors.price} />
              </>
            )}

            {priceType === "RANGE" && (
              <>
                <View style={styles.rangeRow}>
                  <View style={{ flex: 1 }}>
                    <FieldLabel label="Min (UGX)" required colors={colors} />
                    <View style={[styles.currencyRow, {
                      borderColor: errors.priceMin ? "#EF4444" : colors.inputBorder,
                      backgroundColor: colors.background,
                    }]}>
                      <View style={[styles.currencyBadge, { backgroundColor: colors.border }]}>
                        <Typo size={12} fontWeight="600" color={colors.textMuted}>UGX</Typo>
                      </View>
                      <TextInput
                        style={[styles.currencyInput, { color: colors.textPrimary }]}
                        placeholder="0"
                        placeholderTextColor={colors.textPlaceholder}
                        value={priceMin}
                        onChangeText={(t) => { setPriceMin(t.replace(/[^0-9.]/g, "")); clearError("priceMin"); }}
                        keyboardType="decimal-pad"
                        editable={!submitting}
                      />
                    </View>
                    <FieldError msg={errors.priceMin} />
                  </View>
                  <View style={styles.rangeSep}>
                    <Typo size={16} color={colors.textMuted}>–</Typo>
                  </View>
                  <View style={{ flex: 1 }}>
                    <FieldLabel label="Max (UGX)" required colors={colors} />
                    <View style={[styles.currencyRow, {
                      borderColor: errors.priceMax ? "#EF4444" : colors.inputBorder,
                      backgroundColor: colors.background,
                    }]}>
                      <View style={[styles.currencyBadge, { backgroundColor: colors.border }]}>
                        <Typo size={12} fontWeight="600" color={colors.textMuted}>UGX</Typo>
                      </View>
                      <TextInput
                        style={[styles.currencyInput, { color: colors.textPrimary }]}
                        placeholder="0"
                        placeholderTextColor={colors.textPlaceholder}
                        value={priceMax}
                        onChangeText={(t) => { setPriceMax(t.replace(/[^0-9.]/g, "")); clearError("priceMax"); }}
                        keyboardType="decimal-pad"
                        editable={!submitting}
                      />
                    </View>
                    <FieldError msg={errors.priceMax} />
                  </View>
                </View>
              </>
            )}

            {priceType !== "ON_REQUEST" && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <TouchableOpacity
                  style={styles.negotiableRow}
                  onPress={() => setIsPriceNegotiable((p) => !p)}
                  disabled={submitting}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Typo size={14} fontWeight="600" color={colors.textPrimary}>Negotiable</Typo>
                    <Typo size={12} color={colors.textMuted} style={{ marginTop: 2 }}>Allow buyers to negotiate the price</Typo>
                  </View>
                  <View style={[styles.toggle, { backgroundColor: isPriceNegotiable ? colors.primary : colors.border }]}>
                    <View style={[styles.toggleThumb, isPriceNegotiable && styles.toggleThumbOn]} />
                  </View>
                </TouchableOpacity>
              </>
            )}
          </Card>

          {/* ── Tags ── */}
          <Card colors={colors}>
            <CardLabel title="Tags" colors={colors} />
            <Typo size={12} color={colors.textMuted} style={{ marginTop: -8, marginBottom: 12, lineHeight: 17 }}>
              Press Space or comma to add a tag. Tags help buyers find your listing.
            </Typo>
            <View style={[styles.tagWrap, {
              borderColor: colors.inputBorder,
              backgroundColor: colors.background,
            }]}>
              {tagChips.map((tag) => (
                <View key={tag} style={[styles.tagChip, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
                  <Typo size={13} color={colors.primary}>{tag}</Typo>
                  <TouchableOpacity onPress={() => removeTag(tag)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                    <Ionicons name="close" size={13} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ))}
              <TextInput
                ref={tagInputRef}
                style={[styles.tagInput, { color: colors.textPrimary }]}
                placeholder={tagChips.length === 0 ? "e.g., leather, wallet…" : "Add tag…"}
                placeholderTextColor={colors.textPlaceholder}
                value={tagInput}
                onChangeText={handleTagInputChange}
                onSubmitEditing={() => commitTag(tagInput)}
                returnKeyType="done"
                blurOnSubmit={false}
                editable={!submitting}
              />
            </View>
            {tagChips.length > 0 && (
              <Typo size={11} color={colors.textMuted} style={{ marginTop: 6 }}>
                {tagChips.length} tag{tagChips.length !== 1 ? "s" : ""} added
              </Typo>
            )}
          </Card>

          {/* ── Images ── */}
          <Card colors={colors}>
            <View style={styles.imagesHeader}>
              <CardLabel title="Photos" colors={colors} />
              <Typo size={12} color={colors.textMuted} style={{ marginTop: -14 }}>
                {activeExisting + newImages.filter((n) => n.status === "uploaded").length} / {MAX_TOTAL_IMAGES}
              </Typo>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
            >
              {/* Existing images */}
              {displayImages.map((group, i) => {
                const uri     = getBestImageUri(group);
                const gid     = getGroupId(group);
                const marked  = gid ? removedGroupIds.includes(gid) : false;
                const canMark = !!gid && !submitting;
                return (
                  <TouchableOpacity
                    key={gid ?? group.id ?? i}
                    style={[styles.imageTile, {
                      borderColor: marked ? "#EF4444" : colors.border,
                      opacity: marked ? 0.5 : 1,
                    }]}
                    onPress={() => markImageForRemoval(group)}
                    activeOpacity={0.8}
                    disabled={!canMark}
                  >
                    {uri ? (
                      <Image source={{ uri }} style={styles.imageThumb} resizeMode="cover" />
                    ) : (
                      <View style={[styles.imageThumb, { backgroundColor: colors.backgroundSecondary, justifyContent: "center", alignItems: "center" }]}>
                        <Ionicons name="image-outline" size={28} color={colors.textMuted} />
                      </View>
                    )}
                    {marked ? (
                      <View style={styles.imageDeleteOverlay}>
                        <View style={styles.imageDeleteBadge}>
                          <Ionicons name="trash" size={16} color="#fff" />
                        </View>
                      </View>
                    ) : (
                      canMark && (
                        <View style={styles.imageRemoveHint}>
                          <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.9)" />
                        </View>
                      )
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* New images being uploaded */}
              {newImages.map((img) => (
                <View
                  key={img.id}
                  style={[styles.imageTile, {
                    borderColor: img.status === "error" ? "#EF4444"
                               : img.status === "uploaded" ? "#10B981"
                               : colors.border,
                  }]}
                >
                  {img.uri && (
                    <Image source={{ uri: img.uri }} style={styles.imageThumb} resizeMode="cover" />
                  )}

                  {/* Processing overlay */}
                  {(img.status === "processing" || img.status === "selected") && (
                    <View style={[styles.imageDeleteOverlay, { backgroundColor: "rgba(0,0,0,0.55)" }]}>
                      <ActivityIndicator size="small" color="#fff" />
                      {img.progress && (
                        <Typo size={10} color="#fff" style={{ marginTop: 4, textAlign: "center" }}>
                          {img.progress}
                        </Typo>
                      )}
                    </View>
                  )}

                  {/* Uploaded checkmark */}
                  {img.status === "uploaded" && (
                    <View style={[styles.imageStatusBadge, { backgroundColor: "#10B981" }]}>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  )}

                  {/* Error state */}
                  {img.status === "error" && (
                    <View style={[styles.imageDeleteOverlay, { backgroundColor: "rgba(239,68,68,0.75)" }]}>
                      <TouchableOpacity onPress={() => retryNewImage(img)} style={{ alignItems: "center" }}>
                        <Ionicons name="refresh" size={20} color="#fff" />
                        <Typo size={10} color="#fff" style={{ marginTop: 2 }}>Retry</Typo>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Remove button (uploaded only) */}
                  {img.status === "uploaded" && (
                    <TouchableOpacity
                      style={styles.imageRemoveHint}
                      onPress={() => removeNewImage(img.id)}
                    >
                      <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.9)" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {/* Add photo button */}
              {canAddMore && !submitting && (
                <TouchableOpacity
                  style={[styles.imageTile, styles.addPhotoSlot, {
                    borderColor: colors.inputBorder,
                    backgroundColor: colors.background,
                  }]}
                  onPress={pickAndUploadImage}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={28} color={colors.primary} />
                  <Typo size={11} color={colors.primary} style={{ marginTop: 4, textAlign: "center" }}>
                    Add Photo
                  </Typo>
                </TouchableOpacity>
              )}
            </ScrollView>

            <Typo size={11} color={colors.textMuted} style={{ marginTop: 10, lineHeight: 16 }}>
              Tap an existing photo to mark it for removal.{" "}
              {canAddMore ? `You can add up to ${MAX_TOTAL_IMAGES - activeExisting - newImages.filter((n) => n.status === "uploaded").length} more.` : "Maximum photos reached."}
            </Typo>

            {removedGroupIds.length > 0 && (
              <View style={[styles.removalNote, { backgroundColor: "#FEF2F2", borderColor: "#EF4444" }]}>
                <Ionicons name="alert-circle-outline" size={15} color="#EF4444" />
                <Typo size={12} color="#EF4444" style={{ flex: 1 }}>
                  {removedGroupIds.length} photo{removedGroupIds.length !== 1 ? "s" : ""} will be removed on save.
                </Typo>
                <TouchableOpacity onPress={() => setRemovedGroupIds([])}>
                  <Typo size={12} fontWeight="700" color="#EF4444">Undo</Typo>
                </TouchableOpacity>
              </View>
            )}
          </Card>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* ── Sticky footer ── */}
        <SafeAreaView edges={["bottom"]} style={{ backgroundColor: colors.surface }}>
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            {canResubmit && (
              <TouchableOpacity
                style={[styles.footerBtn, styles.footerBtnOutline, { borderColor: colors.primary }]}
                onPress={() => {
                  Alert.alert(
                    "Resubmit for Review?",
                    "Your listing will be sent for review. You cannot self-promote to Active.",
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Resubmit", onPress: () => handleSave(true) },
                    ]
                  );
                }}
                activeOpacity={0.85}
                disabled={submitting}
              >
                <Ionicons name="send-outline" size={17} color={colors.primary} />
                <Typo size={14} fontWeight="700" color={colors.primary}>Submit for Review</Typo>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.footerBtn, styles.footerBtnPrimary, { backgroundColor: colors.primary, flex: canResubmit ? 0.9 : 1 }]}
              onPress={() => handleSave(false)}
              activeOpacity={0.85}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Typo size={14} fontWeight="700" color="#fff">Save Changes</Typo>
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* ── Category modal ── */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeCategoryModal}
      >
        <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.surface }}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Typo size={17} fontWeight="700" color={colors.textPrimary}>Select Category</Typo>
              <TouchableOpacity onPress={closeCategoryModal} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={[styles.modalSearchBar, { backgroundColor: colors.background, borderColor: colors.inputBorder }]}>
              <Ionicons name="search" size={16} color={colors.textMuted} />
              <TextInput
                style={[styles.modalSearchInput, { color: colors.textPrimary }]}
                placeholder="Search categories…"
                placeholderTextColor={colors.textPlaceholder}
                value={categoryQuery}
                onChangeText={handleCategorySearch}
              />
              {categoryQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleCategorySearch("")}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>

          {searching ? (
            <ActivityIndicator style={{ marginTop: 32 }} color={colors.primary} />
          ) : (
            <FlatList
              data={categoryQuery.trim() ? searchResults : categories}
              keyExtractor={(c) => String(c.id)}
              renderItem={({ item }) => {
                const active = categoryId === item.id;
                return (
                  <Pressable
                    style={[styles.catItem, {
                      borderBottomColor: colors.border,
                      backgroundColor: active ? colors.primary + "08" : "transparent",
                    }]}
                    onPress={() => {
                      setCategoryId(item.id);
                      setSelectedCategory(item);
                      clearError("category");
                      closeCategoryModal();
                    }}
                  >
                    <Typo size={15} fontWeight={active ? "700" : "400"} color={active ? colors.primary : colors.textPrimary}>
                      {item.name}
                    </Typo>
                    {active && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                  </Pressable>
                );
              }}
              onEndReached={!categoryQuery.trim() ? loadMoreCategories : undefined}
              onEndReachedThreshold={0.4}
              ListFooterComponent={catLoadingMore
                ? <ActivityIndicator color={colors.primary} style={{ padding: 16 }} />
                : null}
              ListEmptyComponent={
                <View style={{ padding: 32, alignItems: "center" }}>
                  <Typo size={14} color={colors.textMuted}>
                    {categoryQuery.trim() ? "No categories found" : "No categories available"}
                  </Typo>
                </View>
              }
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  headerCenter: { flex: 1, alignItems: "center", gap: 5 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },

  // Scroll
  scrollContent: { padding: 16, paddingBottom: 8 },

  // Status card
  statusCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  statusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectionBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },

  // Fields
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 16 },
  fieldFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    minHeight: 18,
  },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 15,
  },
  textArea: { minHeight: 110, paddingTop: 12 },

  // Segment control (listing type)
  segmentRow: { flexDirection: "row", gap: 10 },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
  },

  // Category select row
  selectRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 13,
  },

  // Price type chips
  priceTypeRow: { flexDirection: "row", gap: 8 },
  priceTypeChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },

  // Currency input
  currencyRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  currencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 13 : 11,
    alignItems: "center",
    justifyContent: "center",
  },
  currencyInput: { flex: 1, fontSize: 15, paddingHorizontal: 12 },

  // Range row
  rangeRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  rangeSep: { paddingTop: 36, alignItems: "center" },

  // Negotiable toggle
  negotiableRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toggle: {
    width: 46,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbOn: { alignSelf: "flex-end" },

  // Tags
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    minHeight: 50,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagInput: { fontSize: 14, paddingVertical: 4, flex: 1 },

  // Images
  imagesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  imageTile: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1.5,
    position: "relative",
  },
  imageThumb: { width: "100%", height: "100%" },
  imageDeleteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(239,68,68,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageDeleteBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  imageRemoveHint: {
    position: "absolute",
    top: 6,
    right: 6,
  },
  imageStatusBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoSlot: {
    alignItems: "center",
    justifyContent: "center",
    borderStyle: "dashed",
    borderWidth: 1.5,
  },
  removalNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },

  // Footer
  footer: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 4 : 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  footerBtnPrimary: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  footerBtnOutline: { borderWidth: 1.5, backgroundColor: "transparent" },

  // Category modal
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalSearchInput: { flex: 1, fontSize: 15 },
  catItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
