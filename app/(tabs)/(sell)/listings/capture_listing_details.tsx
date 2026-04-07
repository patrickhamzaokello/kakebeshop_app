import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Modal,
  FlatList,
  Pressable,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import apiService from "@/utils/apiBase";
import { Tag } from "@/utils/types/models";
import Typo from "@/components/Typo";

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
      <Typo size={13} fontWeight="700" color={colors.textMuted} style={sectionStyles.text}>
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
  const image_group_ids: string[] = params.image_group_ids
    ? JSON.parse(params.image_group_ids as string)
    : [];

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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // ── Data state ──
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ── Inline errors ──
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Modals ──
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPriceTypeModal, setShowPriceTypeModal] = useState(false);

  // ── Load data ──
  useEffect(() => {
    (async () => {
      try {
        const [catRes, tagRes] = await Promise.all([
          apiService.get<{ results: Category[] }>("/api/v1/categories/"),
          apiService.get<{ results: Tag[] }>("/api/v1/tags/"),
        ]);
        if (catRes.success && catRes.data) setCategories(catRes.data.results ?? []);
        if (tagRes.success && tagRes.data) setTags(tagRes.data.results ?? []);
      } catch {
        Alert.alert("Error", "Failed to load categories. Please go back and try again.");
      } finally {
        setLoadingData(false);
      }
    })();
  }, []);

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

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
      if (selectedTags.length > 0) body.tags = selectedTags;

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
              router.replace({ pathname: "/(tabs)/(sell)/listings/[id]", params: { id: listingId } }),
          },
          {
            text: "Create Another",
            onPress: () => router.replace("/listings/capture_listing_images"),
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

  const selectedCategory = categories.find((c) => c.id === categoryId);
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
    <View style={[styles.root, { backgroundColor: colors.background }]}>
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
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
                      backgroundColor: listingType === t ? colors.primary + "12" : colors.inputBackground,
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
              onPress={() => setShowCategoryModal(true)}
              disabled={submitting}
            >
              <Typo size={15} color={selectedCategory ? colors.textPrimary : colors.textPlaceholder}>
                {selectedCategory ? selectedCategory.name : "Select a category…"}
              </Typo>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </Field>

          {/* ── Pricing ── */}
          <SectionHeader title="Pricing" colors={colors} />

          <Field label="Price Type" required colors={colors}>
            <TouchableOpacity
              style={[styles.selectBtn, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground }]}
              onPress={() => setShowPriceTypeModal(true)}
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

          {/* ── Tags (optional) ── */}
          {tags.length > 0 && (
            <>
              <SectionHeader title="Tags (Optional)" colors={colors} />
              <View style={styles.tagsWrap}>
                {tags.map((tag) => {
                  const active = selectedTags.includes(tag.id);
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      style={[
                        styles.tagChip,
                        {
                          borderColor: active ? colors.primary : colors.border,
                          backgroundColor: active ? colors.primary + "15" : colors.inputBackground,
                        },
                      ]}
                      onPress={() => toggleTag(tag.id)}
                      disabled={submitting}
                    >
                      {active && <Ionicons name="checkmark" size={12} color={colors.primary} style={{ marginRight: 4 }} />}
                      <Typo size={13} fontWeight={active ? "700" : "500"} color={active ? colors.primary : colors.textSecondary}>
                        {tag.name}
                      </Typo>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

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
      </KeyboardAvoidingView>

      {/* ── Category modal ── */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowCategoryModal(false)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Typo size={17} fontWeight="700" color={colors.textPrimary}>Select Category</Typo>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalRow,
                    { borderBottomColor: colors.border },
                    categoryId === item.id && { backgroundColor: colors.primary + "10" },
                  ]}
                  onPress={() => { setCategoryId(item.id); clearError("category"); setShowCategoryModal(false); }}
                >
                  <Typo size={15} color={categoryId === item.id ? colors.primary : colors.textPrimary}>
                    {item.name}
                  </Typo>
                  {categoryId === item.id && (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
            <View style={{ height: 16 }} />
          </Pressable>
        </Pressable>
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
                <View style={[styles.modalOptIcon, { backgroundColor: priceType === opt.value ? colors.primary + "20" : colors.backgroundSecondary }]}>
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
    </View>
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

  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
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
});
