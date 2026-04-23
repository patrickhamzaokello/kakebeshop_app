import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { TextInput } from "@/components/TextInput";
import { ActivityIndicator, Alert, FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput as RNTextInput, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import apiService from "@/utils/apiBase";
import Typo from "@/components/Typo";
import { categoryService } from "@/utils/services/categoryService";

// ─── Local types ──────────────────────────────────────────────────────────────

interface Category {
  id: number;
  name: string;
  slug: string;
}

type PriceType = "FIXED" | "RANGE" | "ON_REQUEST";
type ListingType = "PRODUCT" | "SERVICE";

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  hint,
  children,
  colors,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  colors: any;
}) {
  return (
    <View style={fieldStyles.group}>
      <View style={fieldStyles.labelRow}>
        <Typo size={14} fontWeight="600" color={colors.textPrimary}>
          {label}
        </Typo>
        {required && (
          <Typo size={14} color={colors.error}>
            {" *"}
          </Typo>
        )}
      </View>
      {children}
      {error ? (
        <Typo size={12} color={colors.error} style={fieldStyles.errorText}>
          {error}
        </Typo>
      ) : hint ? (
        <Typo size={12} color={colors.textMuted} style={fieldStyles.hint}>
          {hint}
        </Typo>
      ) : null}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  group: { marginBottom: 20 },
  labelRow: { flexDirection: "row", marginBottom: 8 },
  errorText: { marginTop: 4 },
  hint: { marginTop: 4 },
});

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, colors }: { title: string; colors: any }) {
  return (
    <View style={sectionStyles.row}>
      <View style={[sectionStyles.dot, { backgroundColor: colors.primary }]} />
      <Typo size={13} fontWeight="700" color={colors.textSecondary} style={sectionStyles.text}>
        {title.toUpperCase()}
      </Typo>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginBottom: 16, marginTop: 8 },
  dot: { width: 4, height: 4, borderRadius: 2, marginRight: 8 },
  text: { letterSpacing: 0.8 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function CaptureListingDetails() {
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams();
  const image_group_ids = useMemo<string[]>(() => {
    try {
      return params.image_group_ids ? JSON.parse(params.image_group_ids as string) : [];
    } catch {
      return [];
    }
  }, [params.image_group_ids]);

  // ── Form state ──
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [listingType, setListingType] = useState<ListingType>("PRODUCT");
  const [priceType, setPriceType] = useState<PriceType>("FIXED");
  const [price, setPrice] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [isPriceNegotiable, setIsPriceNegotiable] = useState(false);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [selectedCategoryObj, setSelectedCategoryObj] = useState<Category | null>(null);
  // free-text tags: committed chips + current input
  const [tagChips, setTagChips] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const tagInputRef = useRef<RNTextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  // ── Data state ──
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ── Inline errors ──
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Delivery modes ──
  const [deliveryModes, setDeliveryModes] = useState<Record<string, { notes: string; estimated_days: string }>>({});

  // ── Modals ──
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPriceTypeModal, setShowPriceTypeModal] = useState(false);

  // ── Category pagination ──
  const [catPage, setCatPage] = useState(1);
  const [catHasMore, setCatHasMore] = useState(false);
  const [catLoadingMore, setCatLoadingMore] = useState(false);
  const catFetchingRef = useRef(false);

  // ── Category search ──
  const [categoryQuery, setCategoryQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Category[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load data ──
  useEffect(() => {
    (async () => {
      try {
        const catResult = await categoryService.getParentCategories(1);
        setCategories(catResult.results as unknown as Category[]);
        setCatHasMore(catResult.hasMore);
        setCatPage(1);
      } catch {
        Alert.alert("Error", "Failed to load categories. Please go back and try again.");
      } finally {
        setLoadingData(false);
      }
    })();
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const loadMoreCategories = async () => {
    if (catFetchingRef.current || !catHasMore || categoryQuery.trim()) return;
    catFetchingRef.current = true;
    setCatLoadingMore(true);
    try {
      const nextPage = catPage + 1;
      const result = await categoryService.getParentCategories(nextPage);
      setCategories(prev => [...prev, ...result.results as unknown as Category[]]);
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

  const toggleDeliveryMode = (mode: string) => {
    setDeliveryModes((prev) => {
      if (mode in prev) {
        const next = { ...prev };
        delete next[mode];
        return next;
      }
      return { ...prev, [mode]: { notes: "", estimated_days: "" } };
    });
  };

  const updateDeliveryModeField = (mode: string, field: "notes" | "estimated_days", value: string) => {
    setDeliveryModes((prev) => ({
      ...prev,
      [mode]: { ...prev[mode], [field]: value },
    }));
  };

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  /** Commit the current tagInput text as a chip (on space / comma / return). */
  const commitTag = useCallback((raw: string) => {
    const value = raw.trim().replace(/^[,\s]+|[,\s]+$/g, "").toLowerCase();
    if (!value) return;
    setTagChips(prev => prev.includes(value) ? prev : [...prev, value]);
    setTagInput("");
  }, []);

  const handleTagInputChange = useCallback((text: string) => {
    // Commit on space or comma
    if (text.endsWith(" ") || text.endsWith(",")) {
      commitTag(text);
    } else {
      setTagInput(text);
    }
  }, [commitTag]);

  const removeTag = useCallback((tag: string) => {
    setTagChips(prev => prev.filter(t => t !== tag));
  }, []);

  // ── Validation ──
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
    return Object.keys(e).length === 0;
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const body: any = {
        title: title.trim(),
        description: description.trim(),
        listing_type: listingType,
        category: categoryId,
        price_type: priceType,
        currency: "UGX",
        is_price_negotiable: isPriceNegotiable,
      };
      if (priceType === "FIXED") body.price = parseFloat(price);
      else if (priceType === "RANGE") {
        body.price_min = parseFloat(priceMin);
        body.price_max = parseFloat(priceMax);
      }
      // Commit any text still in the input box before submitting
      const pendingTag = tagInput.trim().toLowerCase();
      const allTags = pendingTag && !tagChips.includes(pendingTag)
        ? [...tagChips, pendingTag]
        : tagChips;
      if (allTags.length > 0) body.tags = allTags;

      const selectedModes = Object.entries(deliveryModes).map(([mode, cfg]) => ({
        mode,
        ...(cfg.notes.trim() ? { notes: cfg.notes.trim() } : {}),
        ...(cfg.estimated_days.trim() ? { estimated_days: parseInt(cfg.estimated_days, 10) } : {}),
      }));
      if (selectedModes.length > 0) body.delivery_modes = selectedModes;

      const listingRes = await apiService.post<{ id: string }>("/api/v1/listings/", body);
      if (!listingRes.success || !listingRes.data?.id) {
        throw new Error(listingRes.message || "Failed to create listing.");
      }

      const listingId = listingRes.data.id;

      await apiService.post("/api/v1/image/attach/", {
        image_group_ids,
        object_id: listingId,
        image_type: "listing",
      });

      Alert.alert(
        "Listing Created!",
        "Your listing has been submitted for review. It will go live within 24–48 hours.",
        [
          {
            text: "View Listing",
            onPress: () =>
              router.replace({ pathname: "/(tabs)/(sell)/listings/[id]", params: { id: listingId, fromCreation: "1" } }),
          },
          {
            text: "Create Another",
            onPress: () => {
              // Replace to sell root first — this clears the entire listings stack
              // (both the stale capture_listing_images and this details screen).
              // Then push a completely fresh capture_listing_images on top.
              router.replace("/(tabs)/(sell)" as any);
              setTimeout(() => {
                router.push("/(tabs)/(sell)/listings/capture_listing_images");
              }, 0);
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create listing. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    Alert.alert(
      "Discard Changes?",
      "Going back will lose your listing details. The uploaded images will remain saved.",
      [
        { text: "Stay", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => router.back() },
      ]
    );
  };

  const priceTypeLabel = priceType === "FIXED" ? "Fixed Price" : priceType === "RANGE" ? "Price Range" : "On Request";

  // ── Loading state ──
  if (loadingData) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Typo size={14} color={colors.textMuted} style={{ marginTop: 12 }}>
          Loading categories…
        </Typo>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={submitting}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Typo size={17} fontWeight="700" color={colors.textPrimary}>
              Listing Details
            </Typo>
            <Typo size={12} color={colors.textMuted} style={{ marginTop: 1 }}>
              {image_group_ids.length} image{image_group_ids.length !== 1 ? "s" : ""} ready
            </Typo>
          </View>
          <View style={{ width: 36 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
          {/* ── Basic info ── */}
          <SectionHeader title="Basic Information" colors={colors} />

          <Field label="Title" required error={errors.title} hint={`${title.length}/255`} colors={colors}>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: errors.title ? colors.error : colors.inputBorder,
                  color: colors.textPrimary,
                  backgroundColor: colors.inputBackground,
                },
              ]}
              placeholder="e.g., iPhone 15 Pro Max 256GB"
              placeholderTextColor={colors.textPlaceholder}
              value={title}
              onChangeText={(t) => { setTitle(t); clearError("title"); }}
              maxLength={255}
              editable={!submitting}
              returnKeyType="next"
            />
          </Field>

          <Field
            label="Description"
            required
            error={errors.description}
            hint={`${description.length} characters (min 20)`}
            colors={colors}
          >
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  borderColor: errors.description ? colors.error : colors.inputBorder,
                  color: colors.textPrimary,
                  backgroundColor: colors.inputBackground,
                },
              ]}
              placeholder="Describe your listing in detail — condition, specs, what's included…"
              placeholderTextColor={colors.textPlaceholder}
              value={description}
              onChangeText={(t) => { setDescription(t); clearError("description"); }}
              multiline
              textAlignVertical="top"
              editable={!submitting}
            />
          </Field>

          {/* ── Type & category ── */}
          <SectionHeader title="Type & Category" colors={colors} />

          <Field label="Listing Type" required colors={colors}>
            <View style={styles.typeRow}>
              {(["PRODUCT", "SERVICE"] as ListingType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeBtn,
                    {
                      borderColor: listingType === t ? colors.primary : colors.inputBorder,
                      backgroundColor: listingType === t ? colors.primary + "22" : colors.inputBackground,
                    },
                  ]}
                  onPress={() => setListingType(t)}
                  disabled={submitting}
                >
                  <Ionicons
                    name={t === "PRODUCT" ? "cube-outline" : "briefcase-outline"}
                    size={18}
                    color={listingType === t ? colors.primary : colors.textMuted}
                  />
                  <Typo
                    size={14}
                    fontWeight={listingType === t ? "700" : "500"}
                    color={listingType === t ? colors.primary : colors.textSecondary}
                    style={{ marginLeft: 6 }}
                  >
                    {t === "PRODUCT" ? "Product" : "Service"}
                  </Typo>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <Field label="Category" required error={errors.category} colors={colors}>
            <TouchableOpacity
              style={[
                styles.selectBtn,
                {
                  borderColor: errors.category ? colors.error : colors.inputBorder,
                  backgroundColor: colors.inputBackground,
                },
              ]}
              onPress={() => { Keyboard.dismiss(); setShowCategoryModal(true); }}
              disabled={submitting}
            >
              <Typo size={15} color={selectedCategoryObj ? colors.textPrimary : colors.textPlaceholder}>
                {selectedCategoryObj ? selectedCategoryObj.name : "Select a category…"}
              </Typo>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </Field>

          {/* ── Pricing ── */}
          <SectionHeader title="Pricing" colors={colors} />

          <Field label="Price Type" required colors={colors}>
            <TouchableOpacity
              style={[styles.selectBtn, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground }]}
              onPress={() => { Keyboard.dismiss(); setShowPriceTypeModal(true); }}
              disabled={submitting}
            >
              <Typo size={15} color={colors.textPrimary}>{priceTypeLabel}</Typo>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </Field>

          {priceType === "FIXED" && (
            <Field label="Price (UGX)" required error={errors.price} colors={colors}>
              <View style={[styles.prefixInput, { borderColor: errors.price ? colors.error : colors.inputBorder, backgroundColor: colors.inputBackground }]}>
                <View style={[styles.prefix, { borderRightColor: colors.border }]}>
                  <Typo size={13} fontWeight="600" color={colors.textMuted}>UGX</Typo>
                </View>
                <TextInput
                  style={[styles.prefixTextInput, { color: colors.textPrimary }]}
                  placeholder="0"
                  placeholderTextColor={colors.textPlaceholder}
                  value={price}
                  onChangeText={(t) => { setPrice(t); clearError("price"); }}
                  keyboardType="numeric"
                  editable={!submitting}
                />
              </View>
            </Field>
          )}

          {priceType === "RANGE" && (
            <View style={styles.rangeRow}>
              <View style={{ flex: 1 }}>
                <Field label="Min Price (UGX)" required error={errors.priceMin} colors={colors}>
                  <View style={[styles.prefixInput, { borderColor: errors.priceMin ? colors.error : colors.inputBorder, backgroundColor: colors.inputBackground }]}>
                    <View style={[styles.prefix, { borderRightColor: colors.border }]}>
                      <Typo size={13} fontWeight="600" color={colors.textMuted}>UGX</Typo>
                    </View>
                    <TextInput
                      style={[styles.prefixTextInput, { color: colors.textPrimary }]}
                      placeholder="0"
                      placeholderTextColor={colors.textPlaceholder}
                      value={priceMin}
                      onChangeText={(t) => { setPriceMin(t); clearError("priceMin"); }}
                      keyboardType="numeric"
                      editable={!submitting}
                    />
                  </View>
                </Field>
              </View>
              <View style={styles.rangeSep}>
                <Typo size={16} color={colors.textMuted}>–</Typo>
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Max Price (UGX)" required error={errors.priceMax} colors={colors}>
                  <View style={[styles.prefixInput, { borderColor: errors.priceMax ? colors.error : colors.inputBorder, backgroundColor: colors.inputBackground }]}>
                    <View style={[styles.prefix, { borderRightColor: colors.border }]}>
                      <Typo size={13} fontWeight="600" color={colors.textMuted}>UGX</Typo>
                    </View>
                    <TextInput
                      style={[styles.prefixTextInput, { color: colors.textPrimary }]}
                      placeholder="0"
                      placeholderTextColor={colors.textPlaceholder}
                      value={priceMax}
                      onChangeText={(t) => { setPriceMax(t); clearError("priceMax"); }}
                      keyboardType="numeric"
                      editable={!submitting}
                    />
                  </View>
                </Field>
              </View>
            </View>
          )}

          {priceType !== "ON_REQUEST" && (
            <TouchableOpacity
              style={[styles.checkRow, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
              onPress={() => setIsPriceNegotiable(!isPriceNegotiable)}
              disabled={submitting}
              activeOpacity={0.7}
            >
              <View style={styles.checkInfo}>
                <Typo size={14} fontWeight="600" color={colors.textPrimary}>Negotiable</Typo>
                <Typo size={12} color={colors.textMuted}>Buyers can make offers on this price</Typo>
              </View>
              <View style={[
                styles.toggle,
                { backgroundColor: isPriceNegotiable ? colors.primary : colors.border },
              ]}>
                <View style={[
                  styles.toggleThumb,
                  { transform: [{ translateX: isPriceNegotiable ? 18 : 2 }] },
                ]} />
              </View>
            </TouchableOpacity>
          )}

          {/* ── Delivery & Fulfillment ── */}
          <SectionHeader title="Delivery & Fulfillment" colors={colors} />
          {([
            { mode: "PICKUP",    label: "Pickup",    desc: "Buyer collects from your location",   icon: "storefront-outline",      showDays: false },
            { mode: "DELIVERY",  label: "Delivery",  desc: "You deliver to buyer's address",      icon: "bicycle-outline",         showDays: true  },
            { mode: "DIGITAL",   label: "Digital",   desc: "Download or link (digital products)", icon: "cloud-download-outline",  showDays: false },
            { mode: "IN_PERSON", label: "In Person", desc: "Service at buyer's location",         icon: "person-outline",          showDays: true  },
            { mode: "REMOTE",    label: "Remote",    desc: "Service performed online/remotely",   icon: "laptop-outline",          showDays: false },
          ] as { mode: string; label: string; desc: string; icon: any; showDays: boolean }[]).map((opt) => {
            const isOn = opt.mode in deliveryModes;
            return (
              <View key={opt.mode} style={[dmStyles.card, { borderColor: isOn ? colors.primary : colors.inputBorder, backgroundColor: colors.inputBackground }]}>
                <TouchableOpacity
                  style={dmStyles.row}
                  onPress={() => toggleDeliveryMode(opt.mode)}
                  disabled={submitting}
                  activeOpacity={0.7}
                >
                  <View style={[dmStyles.iconWrap, { backgroundColor: isOn ? colors.primary + "28" : colors.backgroundSecondary }]}>
                    <Ionicons name={opt.icon} size={18} color={isOn ? colors.primary : colors.textMuted} />
                  </View>
                  <View style={dmStyles.labelWrap}>
                    <Typo size={14} fontWeight="600" color={isOn ? colors.primary : colors.textPrimary}>{opt.label}</Typo>
                    <Typo size={12} color={colors.textMuted}>{opt.desc}</Typo>
                  </View>
                  <View style={[dmStyles.toggle, { backgroundColor: isOn ? colors.primary : colors.border }]}>
                    <View style={[dmStyles.toggleThumb, { transform: [{ translateX: isOn ? 18 : 2 }] }]} />
                  </View>
                </TouchableOpacity>

                {isOn && (
                  <View style={[dmStyles.expandedFields, { borderTopColor: colors.border }]}>
                    <TextInput
                      style={[dmStyles.expandInput, { borderColor: colors.inputBorder, color: colors.textPrimary, backgroundColor: colors.background }]}
                      placeholder="Notes (optional) — e.g. Kampala only, Mon–Fri 9am–5pm"
                      placeholderTextColor={colors.textPlaceholder}
                      value={deliveryModes[opt.mode].notes}
                      onChangeText={(v) => updateDeliveryModeField(opt.mode, "notes", v)}
                      editable={!submitting}
                    />
                    {opt.showDays && (
                      <TextInput
                        style={[dmStyles.expandInput, { borderColor: colors.inputBorder, color: colors.textPrimary, backgroundColor: colors.background }]}
                        placeholder="Estimated delivery days (optional) — e.g. 2"
                        placeholderTextColor={colors.textPlaceholder}
                        value={deliveryModes[opt.mode].estimated_days}
                        onChangeText={(v) => updateDeliveryModeField(opt.mode, "estimated_days", v.replace(/[^0-9]/g, ""))}
                        keyboardType="numeric"
                        editable={!submitting}
                      />
                    )}
                  </View>
                )}
              </View>
            );
          })}
          <View style={{ height: 8 }} />

          {/* ── Tags (optional) ── */}
          <SectionHeader title="Tags (Optional)" colors={colors} />
          <View
            style={[
              styles.tagInputBox,
              { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground },
            ]}
          >
            {/* Committed chips */}
            {tagChips.length > 0 && (
              <View style={styles.tagChipsRow}>
                {tagChips.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tagChip, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "40" }]}
                    onPress={() => removeTag(tag)}
                    disabled={submitting}
                    activeOpacity={0.7}
                  >
                    <Typo size={12} fontWeight="600" color={colors.primary}>{tag}</Typo>
                    <Ionicons name="close" size={12} color={colors.primary} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Text input inline */}
            <TextInput
              ref={tagInputRef}
              style={[styles.tagTextInput, { color: colors.textPrimary }]}
              placeholder={tagChips.length === 0 ? "e.g. electronics phone apple  (space to add)" : "Add another tag…"}
              placeholderTextColor={colors.textPlaceholder}
              value={tagInput}
              onChangeText={handleTagInputChange}
              onSubmitEditing={() => commitTag(tagInput)}
              onBlur={() => commitTag(tagInput)}
              returnKeyType="done"
              autoCorrect={false}
              autoCapitalize="none"
              blurOnSubmit={false}
              editable={!submitting}
              onFocus={() => {
                // Scroll down so the tag field isn't behind the keyboard
                setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
              }}
            />
          </View>
          <Typo size={11} color={colors.textMuted} style={styles.tagHint}>
            Press space or comma after each tag · tap a chip to remove it
          </Typo>

          {/* ── Info notice ── */}
          <View style={[styles.notice, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Typo size={13} color={colors.textSecondary} style={{ flex: 1, marginLeft: 10, lineHeight: 18 }}>
              Your listing will be reviewed before going live. This usually takes 24–48 hours.
            </Typo>
          </View>
        </ScrollView>

      {/* ── Sticky footer ── */}
      <SafeAreaView edges={["bottom"]} style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary }, submitting && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Typo size={16} fontWeight="700" color="#fff" style={{ marginLeft: 8 }}>
                Create Listing
              </Typo>
            </>
          )}
        </TouchableOpacity>
      </SafeAreaView>

      {/* ── Category picker — full-screen modal ── */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        onRequestClose={closeCategoryModal}
        statusBarTranslucent={false}
      >
        <SafeAreaView style={[styles.catModal, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
          {/* Header */}
          <View style={[styles.catHeader, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
            <TouchableOpacity
              onPress={closeCategoryModal}
              style={styles.catHeaderBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <Typo size={17} fontWeight="700" color={colors.textPrimary}>Select Category</Typo>
            <View style={styles.catHeaderBtn} />
          </View>

          {/* Search bar — always visible, never pushed off screen */}
          <View style={[styles.catSearchWrap, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.catSearchInput, { color: colors.textPrimary }]}
              placeholder="Search categories…"
              placeholderTextColor={colors.textPlaceholder}
              value={categoryQuery}
              onChangeText={handleCategorySearch}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {categoryQuery.length > 0 && Platform.OS === "android" && (
              <TouchableOpacity onPress={() => handleCategorySearch("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Hint row */}
          {!categoryQuery && categories.length > 0 && (
            <View style={styles.catHint}>
              <Typo size={12} color={colors.textMuted}>
                {selectedCategoryObj
                  ? `Currently: ${selectedCategoryObj.name}`
                  : "Browse below or type to search all categories"}
              </Typo>
            </View>
          )}

          {/* Results */}
          {searching ? (
            <View style={styles.catLoader}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Typo size={13} color={colors.textMuted} style={{ marginTop: 10 }}>Searching…</Typo>
            </View>
          ) : (
            <FlatList
              data={categoryQuery.trim() ? searchResults : categories}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={styles.catList}
              onEndReached={loadMoreCategories}
              onEndReachedThreshold={0.4}
              ListFooterComponent={
                catLoadingMore && !categoryQuery.trim() ? (
                  <View style={styles.catFooterLoader}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.catEmpty}>
                  <Ionicons
                    name={categoryQuery.trim() ? "search-outline" : "grid-outline"}
                    size={40}
                    color={colors.neutral300}
                  />
                  <Typo size={15} fontWeight="600" color={colors.textPrimary} style={{ marginTop: 12 }}>
                    {categoryQuery.trim() ? "No results" : "No categories"}
                  </Typo>
                  <Typo size={13} color={colors.textMuted} style={{ marginTop: 4, textAlign: "center" }}>
                    {categoryQuery.trim()
                      ? `Nothing matched "${categoryQuery}". Try a different term.`
                      : "Categories could not be loaded. Pull to refresh."}
                  </Typo>
                </View>
              }
              renderItem={({ item }) => {
                const selected = categoryId === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.catRow,
                      { borderBottomColor: colors.border },
                      selected && { backgroundColor: colors.primary + "10" },
                    ]}
                    onPress={() => { setCategoryId(item.id); setSelectedCategoryObj(item); clearError("category"); closeCategoryModal(); }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.catRowIcon, { backgroundColor: selected ? colors.primary + "20" : colors.backgroundSecondary }]}>
                      <Ionicons
                        name="grid-outline"
                        size={16}
                        color={selected ? colors.primary : colors.textMuted}
                      />
                    </View>
                    <Typo size={15} color={selected ? colors.primary : colors.textPrimary} fontWeight={selected ? "700" : "500"} style={{ flex: 1, marginLeft: 12 }}>
                      {item.name}
                    </Typo>
                    {selected && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* ── Price type modal ── */}
      <Modal
        visible={showPriceTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPriceTypeModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowPriceTypeModal(false)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Typo size={17} fontWeight="700" color={colors.textPrimary}>Price Type</Typo>
              <TouchableOpacity onPress={() => setShowPriceTypeModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            {([
              { label: "Fixed Price", value: "FIXED" as PriceType, desc: "Set one price for your listing", icon: "pricetag-outline" },
              { label: "Price Range", value: "RANGE" as PriceType, desc: "Set a min and max price", icon: "git-compare-outline" },
              { label: "On Request", value: "ON_REQUEST" as PriceType, desc: "Buyers contact you for pricing", icon: "chatbubble-ellipses-outline" },
            ] as { label: string; value: PriceType; desc: string; icon: any }[]).map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.modalRow,
                  { borderBottomColor: colors.border },
                  priceType === opt.value && { backgroundColor: colors.primary + "10" },
                ]}
                onPress={() => { setPriceType(opt.value); setShowPriceTypeModal(false); }}
              >
                <View style={[styles.modalOptIcon, { backgroundColor: priceType === opt.value ? colors.primary + "30" : colors.backgroundSecondary }]}>
                  <Ionicons name={opt.icon} size={18} color={priceType === opt.value ? colors.primary : colors.textMuted} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Typo size={15} fontWeight="600" color={priceType === opt.value ? colors.primary : colors.textPrimary}>
                    {opt.label}
                  </Typo>
                  <Typo size={12} color={colors.textMuted}>{opt.desc}</Typo>
                </View>
                {priceType === opt.value && <Ionicons name="checkmark" size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
            <View style={{ height: 16 }} />
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerCenter: { alignItems: "center" },

  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 24 },

  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 13,
  },

  typeRow: { flexDirection: "row", gap: 12 },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderWidth: 1.5,
    borderRadius: 12,
  },

  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },

  prefixInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  prefix: {
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  prefixTextInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 13,
    fontSize: 15,
  },

  rangeRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  rangeSep: { paddingTop: 38, alignItems: "center" },

  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  checkInfo: { flex: 1, marginRight: 12, gap: 2 },
  toggle: {
    width: 40,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },

  tagInputBox: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    marginBottom: 6,
    minHeight: 52,
  },
  tagChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 6,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagTextInput: {
    fontSize: 14,
    paddingVertical: 4,
    minHeight: 28,
  },
  tagHint: {
    marginBottom: 20,
  },

  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },

  footer: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 14,
  },

  // ── Price-type modal (shared sheet styles) ──────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "65%",
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalOptIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Full-screen category picker ──────────────────────────────────────────────
  catModal: {
    flex: 1,
  },
  catHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  catHeaderBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  catSearchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 11 : 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  catSearchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  catHint: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 2,
  },
  catList: {
    paddingBottom: 24,
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  catRowIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  catLoader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  catFooterLoader: {
    paddingVertical: 16,
    alignItems: "center",
  },
  catEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingTop: 80,
  },
});

const dmStyles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderRadius: 12,
    marginBottom: 10,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  labelWrap: {
    flex: 1,
    marginLeft: 12,
    gap: 2,
  },
  toggle: {
    width: 40,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  expandedFields: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  expandInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
});
