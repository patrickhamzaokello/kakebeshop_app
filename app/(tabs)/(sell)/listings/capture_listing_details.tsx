import ScreenWrapper from "@/components/ScreenWrapper";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Platform,
  Modal,
  FlatList,
  Pressable,
} from "react-native";
import Typo from "@/components/Typo";
import { spacingY, spacingX, borderRadius } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { router, useLocalSearchParams } from "expo-router";
import Button from "@/components/CustomButton";
import { useState, useEffect } from "react";
import apiService from "@/utils/apiBase";
import { Ionicons } from "@expo/vector-icons";

interface Category {
  id: number;
  name: string;
  slug: string;
}


export default function CaptureListingDetails() {
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams();
  const image_group_ids = params.image_group_ids
    ? JSON.parse(params.image_group_ids as string)
    : [];

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [listingType, setListingType] = useState<"PRODUCT" | "SERVICE">("PRODUCT");
  const [priceType, setPriceType] = useState<"FIXED" | "RANGE" | "ON_REQUEST">("FIXED");
  const [price, setPrice] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [isPriceNegotiable, setIsPriceNegotiable] = useState(false);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPriceTypeModal, setShowPriceTypeModal] = useState(false);

  // Load categories and tags
  useEffect(() => {
    loadCategoriesAndTags();
  }, []);

  const loadCategoriesAndTags = async () => {
    try {
      setIsLoadingData(true);

      // Load categories
      const categoriesResponse = await apiService.get<{ results: Category[] }>(
        "/api/v1/categories/"
      );
      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data.results || []);
      }

      // Load tags
      const tagsResponse = await apiService.get<{ results: Tag[] }>(
        "/api/v1/tags/"
      );
      if (tagsResponse.success && tagsResponse.data) {
        setTags(tagsResponse.data.results || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load categories and tags");
    } finally {
      setIsLoadingData(false);
    }
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert("Validation Error", "Please enter a title");
      return false;
    }

    if (title.length < 5) {
      Alert.alert("Validation Error", "Title must be at least 5 characters");
      return false;
    }

    if (!description.trim()) {
      Alert.alert("Validation Error", "Please enter a description");
      return false;
    }

    if (description.length < 20) {
      Alert.alert("Validation Error", "Description must be at least 20 characters");
      return false;
    }

    if (!categoryId) {
      Alert.alert("Validation Error", "Please select a category");
      return false;
    }

    // Price validation
    if (priceType === "FIXED") {
      if (!price || parseFloat(price) <= 0) {
        Alert.alert("Validation Error", "Please enter a valid price");
        return false;
      }
    } else if (priceType === "RANGE") {
      if (!priceMin || !priceMax) {
        Alert.alert("Validation Error", "Please enter minimum and maximum prices");
        return false;
      }
      if (parseFloat(priceMin) >= parseFloat(priceMax)) {
        Alert.alert(
          "Validation Error",
          "Minimum price must be less than maximum price"
        );
        return false;
      }
    }

    // Images validation
    if (image_group_ids.length < 3) {
      Alert.alert("Validation Error", "At least 3 images are required");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Create the listing
      const listingData: any = {
        title: title.trim(),
        description: description.trim(),
        listing_type: listingType,
        category: categoryId,
        price_type: priceType,
        currency: "UGX",
        is_price_negotiable: isPriceNegotiable,
      };

      // Add price fields based on price type
      if (priceType === "FIXED") {
        listingData.price = parseFloat(price);
      } else if (priceType === "RANGE") {
        listingData.price_min = parseFloat(priceMin);
        listingData.price_max = parseFloat(priceMax);
      }

      const listingResponse = await apiService.post<{ id: string }>(
        "/api/v1/listings/",
        listingData
      );

      if (!listingResponse.success || !listingResponse.data) {
        throw new Error(
          listingResponse.message || "Failed to create listing"
        );
      }

      const listingId = listingResponse.data.id;

      // Step 2: Attach images to the listing
      const attachResponse = await apiService.post(
        "/api/v1/image/attach/",
        {
          image_group_ids: image_group_ids,
          object_id: listingId,
          image_type: "listing",
        }
      );

      if (!attachResponse.success) {
        // Listing created but images failed to attach
        Alert.alert(
          "Warning",
          "Listing created but some images failed to attach. You can add them later.",
          [
            {
              text: "OK",
              onPress: () => router.replace(`/listings/${listingId}`),
            },
          ]
        );
        return;
      }

      // Success!
      Alert.alert(
        "Success",
        "Your listing has been created and is pending review.",
        [
          {
            text: "View Listing",
            onPress: () => router.replace({ pathname: "/(tabs)/(sell)/listings/[id]", params: { id: listingId } }),
          },
          {
            text: "Create Another",
            onPress: () => router.replace("/listings/capture_listing_images"),
          },
        ]
      );
    } catch (error: any) {
      console.error("Listing creation error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to create listing. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    Alert.alert(
      "Discard Changes?",
      "Are you sure you want to go back? Your listing details will be lost.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => router.back(),
        },
      ]
    );
  };

  if (isLoadingData) {
    return (
      <ScreenWrapper>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View style={[styles.container, styles.centerContent, { backgroundColor: colors.background }]}>
          <Typo size={16} color={colors.textMuted}>
            Loading...
          </Typo>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            disabled={isSubmitting}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Typo size={24} fontWeight="700" color={colors.textPrimary}>
              Listing Details
            </Typo>
            <Typo size={14} color={colors.textMuted} style={{ marginTop: 4 }}>
              {image_group_ids.length} images uploaded
            </Typo>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Title */}
          <View style={styles.formGroup}>
            <Typo size={14} fontWeight="600" color={colors.textPrimary}>
              Title <Typo color={colors.error}>*</Typo>
            </Typo>
            <TextInput
              style={[styles.input, { borderColor: colors.inputBorder, color: colors.textPrimary, backgroundColor: colors.inputBackground }]}
              placeholder="e.g., iPhone 15 Pro Max 256GB"
              placeholderTextColor={colors.textPlaceholder}
              value={title}
              onChangeText={setTitle}
              maxLength={255}
              editable={!isSubmitting}
            />
            <Typo size={12} color={colors.textMuted}>
              {title.length}/255 characters
            </Typo>
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Typo size={14} fontWeight="600" color={colors.textPrimary}>
              Description <Typo color={colors.error}>*</Typo>
            </Typo>
            <TextInput
              style={[styles.input, styles.textArea, { borderColor: colors.inputBorder, color: colors.textPrimary, backgroundColor: colors.inputBackground }]}
              placeholder="Describe your product or service in detail..."
              placeholderTextColor={colors.textPlaceholder}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              editable={!isSubmitting}
            />
            <Typo size={12} color={colors.textMuted}>
              Minimum 20 characters ({description.length})
            </Typo>
          </View>

          {/* Listing Type */}
          <View style={styles.formGroup}>
            <Typo size={14} fontWeight="600" color={colors.textPrimary}>
              Type <Typo color={colors.error}>*</Typo>
            </Typo>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[
                  styles.radioOption,
                  { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground },
                  listingType === "PRODUCT" && { borderColor: colors.primary, backgroundColor: colors.primary + "10" },
                ]}
                onPress={() => setListingType("PRODUCT")}
                disabled={isSubmitting}
              >
                <Ionicons
                  name={
                    listingType === "PRODUCT"
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={20}
                  color={
                    listingType === "PRODUCT" ? colors.primary : colors.neutral400
                  }
                />
                <Typo
                  size={14}
                  color={
                    listingType === "PRODUCT" ? colors.primary : colors.textPrimary
                  }
                  style={{ marginLeft: 8 }}
                >
                  Product
                </Typo>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.radioOption,
                  { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground },
                  listingType === "SERVICE" && { borderColor: colors.primary, backgroundColor: colors.primary + "10" },
                ]}
                onPress={() => setListingType("SERVICE")}
                disabled={isSubmitting}
              >
                <Ionicons
                  name={
                    listingType === "SERVICE"
                      ? "radio-button-on"
                      : "radio-button-off"
                  }
                  size={20}
                  color={
                    listingType === "SERVICE" ? colors.primary : colors.neutral400
                  }
                />
                <Typo
                  size={14}
                  color={
                    listingType === "SERVICE" ? colors.primary : colors.textPrimary
                  }
                  style={{ marginLeft: 8 }}
                >
                  Service
                </Typo>
              </TouchableOpacity>
            </View>
          </View>

          {/* Category */}
          <View style={styles.formGroup}>
            <Typo size={14} fontWeight="600" color={colors.textPrimary}>
              Category <Typo color={colors.error}>*</Typo>
            </Typo>
            <TouchableOpacity
              style={[styles.selectInput, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground }]}
              onPress={() => setShowCategoryModal(true)}
              disabled={isSubmitting}
            >
              <Typo
                size={15}
                color={categoryId ? colors.textPrimary : colors.textPlaceholder}
              >
                {categoryId
                  ? categories.find((c) => c.id === categoryId)?.name
                  : "Select a category..."}
              </Typo>
              <Ionicons
                name="chevron-down"
                size={20}
                color={colors.neutral400}
              />
            </TouchableOpacity>
          </View>

          {/* Price Type */}
          <View style={styles.formGroup}>
            <Typo size={14} fontWeight="600" color={colors.textPrimary}>
              Price Type <Typo color={colors.error}>*</Typo>
            </Typo>
            <TouchableOpacity
              style={[styles.selectInput, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground }]}
              onPress={() => setShowPriceTypeModal(true)}
              disabled={isSubmitting}
            >
              <Typo size={15} color={colors.textPrimary}>
                {priceType === "FIXED"
                  ? "Fixed Price"
                  : priceType === "RANGE"
                  ? "Price Range"
                  : "On Request"}
              </Typo>
              <Ionicons
                name="chevron-down"
                size={20}
                color={colors.neutral400}
              />
            </TouchableOpacity>
          </View>

          {/* Price Fields */}
          {priceType === "FIXED" && (
            <View style={styles.formGroup}>
              <Typo size={14} fontWeight="600" color={colors.textPrimary}>
                Price (UGX) <Typo color={colors.error}>*</Typo>
              </Typo>
              <TextInput
                style={[styles.input, { borderColor: colors.inputBorder, color: colors.textPrimary, backgroundColor: colors.inputBackground }]}
                placeholder="0"
                placeholderTextColor={colors.textPlaceholder}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                editable={!isSubmitting}
              />
            </View>
          )}

          {priceType === "RANGE" && (
            <View style={styles.priceRangeContainer}>
              <View style={styles.priceRangeInput}>
                <Typo size={14} fontWeight="600" color={colors.textPrimary}>
                  Min Price (UGX) <Typo color={colors.error}>*</Typo>
                </Typo>
                <TextInput
                  style={[styles.input, { borderColor: colors.inputBorder, color: colors.textPrimary, backgroundColor: colors.inputBackground }]}
                  placeholder="0"
                  placeholderTextColor={colors.textPlaceholder}
                  value={priceMin}
                  onChangeText={setPriceMin}
                  keyboardType="numeric"
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.priceRangeInput}>
                <Typo size={14} fontWeight="600" color={colors.textPrimary}>
                  Max Price (UGX) <Typo color={colors.error}>*</Typo>
                </Typo>
                <TextInput
                  style={[styles.input, { borderColor: colors.inputBorder, color: colors.textPrimary, backgroundColor: colors.inputBackground }]}
                  placeholder="0"
                  placeholderTextColor={colors.textPlaceholder}
                  value={priceMax}
                  onChangeText={setPriceMax}
                  keyboardType="numeric"
                  editable={!isSubmitting}
                />
              </View>
            </View>
          )}

          {priceType !== "ON_REQUEST" && (
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setIsPriceNegotiable(!isPriceNegotiable)}
              disabled={isSubmitting}
            >
              <Ionicons
                name={
                  isPriceNegotiable ? "checkbox" : "square-outline"
                }
                size={24}
                color={isPriceNegotiable ? colors.primary : colors.neutral400}
              />
              <Typo size={14} color={colors.textPrimary} style={{ marginLeft: 8 }}>
                Price is negotiable
              </Typo>
            </TouchableOpacity>
          )}

        

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: colors.primary + "10" }]}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Typo
              size={13}
              color={colors.textSecondary}
              style={{ marginLeft: 8, flex: 1 }}
            >
              Your listing will be reviewed by our team before it goes live. This
              usually takes 24-48 hours.
            </Typo>
          </View>

          {/* Submit Button */}
          <Button
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            <Typo size={16} fontWeight="600" color="#FFFFFF">
              {isSubmitting ? "Creating Listing..." : "Create Listing"}
            </Typo>
          </Button>
        </ScrollView>
      </View>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCategoryModal(false)}
        >
          <Pressable style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Typo size={18} fontWeight="600" color={colors.textPrimary}>
                Select Category
              </Typo>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={categories}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    { backgroundColor: colors.surface },
                    categoryId === item.id && { backgroundColor: colors.primary + "10" },
                  ]}
                  onPress={() => {
                    setCategoryId(item.id);
                    setShowCategoryModal(false);
                  }}
                >
                  <Typo
                    size={15}
                    color={
                      categoryId === item.id ? colors.primary : colors.textPrimary
                    }
                  >
                    {item.name}
                  </Typo>
                  {categoryId === item.id && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
              showsVerticalScrollIndicator={true}
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Price Type Modal */}
      <Modal
        visible={showPriceTypeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPriceTypeModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowPriceTypeModal(false)}
        >
          <Pressable style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Typo size={18} fontWeight="600" color={colors.textPrimary}>
                Select Price Type
              </Typo>
              <TouchableOpacity onPress={() => setShowPriceTypeModal(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View>
              {[
                { label: "Fixed Price", value: "FIXED" as const },
                { label: "Price Range", value: "RANGE" as const },
                { label: "On Request", value: "ON_REQUEST" as const },
              ].map((option, index) => (
                <View key={option.value}>
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      { backgroundColor: colors.surface },
                      priceType === option.value && { backgroundColor: colors.primary + "10" },
                    ]}
                    onPress={() => {
                      setPriceType(option.value);
                      setShowPriceTypeModal(false);
                    }}
                  >
                    <Typo
                      size={15}
                      color={
                        priceType === option.value
                          ? colors.primary
                          : colors.textPrimary
                      }
                    >
                      {option.label}
                    </Typo>
                    {priceType === option.value && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                  {index < 2 && <View style={[styles.separator, { backgroundColor: colors.border }]} />}
                </View>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacingX._16,
    paddingTop: spacingY._20,
    paddingBottom: spacingY._16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: spacingX._12,
  },
  headerTextContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacingX._16,
    paddingVertical: spacingY._20,
    paddingBottom: spacingY._40,
  },
  formGroup: {
    marginBottom: spacingY._20,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacingX._16,
    paddingVertical: spacingY._12,
    fontSize: 15,
    marginTop: spacingY._8,
  },
  textArea: {
    height: 120,
    paddingTop: spacingY._12,
  },
  radioGroup: {
    flexDirection: "row",
    gap: spacingX._12,
    marginTop: spacingY._8,
  },
  radioOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacingY._12,
    paddingHorizontal: spacingX._16,
    borderWidth: 1,
    borderRadius: borderRadius.md,
  },
  priceRangeContainer: {
    flexDirection: "row",
    gap: spacingX._12,
    marginBottom: spacingY._20,
  },
  priceRangeInput: {
    flex: 1,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacingY._8,
    marginBottom: spacingY._20,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacingX._8,
    marginTop: spacingY._12,
  },
  tag: {
    paddingHorizontal: spacingX._16,
    paddingVertical: spacingY._8,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacingX._16,
    borderRadius: borderRadius.md,
    marginBottom: spacingY._20,
  },
  submitButton: {
    paddingVertical: spacingY._16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.md,
  },
  selectInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacingX._16,
    paddingVertical: spacingY._12,
    marginTop: spacingY._8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: "50%",
    paddingBottom: spacingY._20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacingX._16,
    paddingVertical: spacingY._16,
    borderBottomWidth: 1,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacingX._16,
    paddingVertical: spacingY._16,
  },
  separator: {
    height: 1,
  },
});