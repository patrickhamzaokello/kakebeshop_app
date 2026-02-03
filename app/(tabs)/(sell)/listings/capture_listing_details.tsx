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
import { colors, spacingY, spacingX, borderRadius } from "@/constants/theme";
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
        <StatusBar style="dark" />
        <View style={[styles.container, styles.centerContent]}>
          <Typo size={16} color={colors.neutral500}>
            Loading...
          </Typo>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            disabled={isSubmitting}
          >
            <Ionicons name="arrow-back" size={24} color={colors.black} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Typo size={24} fontWeight="700" color={colors.black}>
              Listing Details
            </Typo>
            <Typo size={14} color={colors.neutral500} style={{ marginTop: 4 }}>
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
            <Typo size={14} fontWeight="600" color={colors.black}>
              Title <Typo color={colors.error}>*</Typo>
            </Typo>
            <TextInput
              style={styles.input}
              placeholder="e.g., iPhone 15 Pro Max 256GB"
              value={title}
              onChangeText={setTitle}
              maxLength={255}
              editable={!isSubmitting}
            />
            <Typo size={12} color={colors.neutral400}>
              {title.length}/255 characters
            </Typo>
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Typo size={14} fontWeight="600" color={colors.black}>
              Description <Typo color={colors.error}>*</Typo>
            </Typo>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe your product or service in detail..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              editable={!isSubmitting}
            />
            <Typo size={12} color={colors.neutral400}>
              Minimum 20 characters ({description.length})
            </Typo>
          </View>

          {/* Listing Type */}
          <View style={styles.formGroup}>
            <Typo size={14} fontWeight="600" color={colors.black}>
              Type <Typo color={colors.error}>*</Typo>
            </Typo>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                style={[
                  styles.radioOption,
                  listingType === "PRODUCT" && styles.radioOptionSelected,
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
                    listingType === "PRODUCT" ? colors.primary : colors.black
                  }
                  style={{ marginLeft: 8 }}
                >
                  Product
                </Typo>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.radioOption,
                  listingType === "SERVICE" && styles.radioOptionSelected,
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
                    listingType === "SERVICE" ? colors.primary : colors.black
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
            <Typo size={14} fontWeight="600" color={colors.black}>
              Category <Typo color={colors.error}>*</Typo>
            </Typo>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setShowCategoryModal(true)}
              disabled={isSubmitting}
            >
              <Typo
                size={15}
                color={categoryId ? colors.black : colors.neutral400}
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
            <Typo size={14} fontWeight="600" color={colors.black}>
              Price Type <Typo color={colors.error}>*</Typo>
            </Typo>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setShowPriceTypeModal(true)}
              disabled={isSubmitting}
            >
              <Typo size={15} color={colors.black}>
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
              <Typo size={14} fontWeight="600" color={colors.black}>
                Price (UGX) <Typo color={colors.error}>*</Typo>
              </Typo>
              <TextInput
                style={styles.input}
                placeholder="0"
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
                <Typo size={14} fontWeight="600" color={colors.black}>
                  Min Price (UGX) <Typo color={colors.error}>*</Typo>
                </Typo>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  value={priceMin}
                  onChangeText={setPriceMin}
                  keyboardType="numeric"
                  editable={!isSubmitting}
                />
              </View>

              <View style={styles.priceRangeInput}>
                <Typo size={14} fontWeight="600" color={colors.black}>
                  Max Price (UGX) <Typo color={colors.error}>*</Typo>
                </Typo>
                <TextInput
                  style={styles.input}
                  placeholder="0"
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
              <Typo size={14} color={colors.black} style={{ marginLeft: 8 }}>
                Price is negotiable
              </Typo>
            </TouchableOpacity>
          )}

        

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Typo
              size={13}
              color={colors.neutral700}
              style={{ marginLeft: 8, flex: 1 }}
            >
              Your listing will be reviewed by our team before it goes live. This
              usually takes 24-48 hours.
            </Typo>
          </View>

          {/* Submit Button */}
          <Button
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            <Typo size={16} fontWeight="600" color={colors.white}>
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
          <Pressable style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Typo size={18} fontWeight="600" color={colors.black}>
                Select Category
              </Typo>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={colors.black} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={categories}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    categoryId === item.id && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setCategoryId(item.id);
                    setShowCategoryModal(false);
                  }}
                >
                  <Typo
                    size={15}
                    color={
                      categoryId === item.id ? colors.primary : colors.black
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
              ItemSeparatorComponent={() => <View style={styles.separator} />}
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
          <Pressable style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Typo size={18} fontWeight="600" color={colors.black}>
                Select Price Type
              </Typo>
              <TouchableOpacity onPress={() => setShowPriceTypeModal(false)}>
                <Ionicons name="close" size={24} color={colors.black} />
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
                      priceType === option.value && styles.modalItemSelected,
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
                          : colors.black
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
                  {index < 2 && <View style={styles.separator} />}
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
    backgroundColor: colors.white,
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
    borderBottomColor: colors.neutral100,
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
    borderColor: colors.neutral200,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacingX._16,
    paddingVertical: spacingY._12,
    fontSize: 15,
    color: colors.black,
    marginTop: spacingY._8,
    backgroundColor: colors.white,
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
    borderColor: colors.neutral200,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
  },
  radioOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + "10",
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
    borderColor: colors.neutral200,
    backgroundColor: colors.neutral50,
  },
  tagSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacingX._16,
    backgroundColor: colors.primary + "10",
    borderRadius: borderRadius.md,
    marginBottom: spacingY._20,
  },
  submitButton: {
    backgroundColor: colors.primary,
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
    borderColor: colors.neutral200,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacingX._16,
    paddingVertical: spacingY._12,
    marginTop: spacingY._8,
    backgroundColor: colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: colors.white,
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
    borderBottomColor: colors.neutral100,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacingX._16,
    paddingVertical: spacingY._16,
    backgroundColor: colors.white,
  },
  modalItemSelected: {
    backgroundColor: colors.primary + "10",
  },
  separator: {
    height: 1,
    backgroundColor: colors.neutral100,
  },
});