import {
  borderRadius,
  colors,
  fontSize,
  fontWeight,
  shadow,
  spacingX,
  spacingY,
} from "@/constants/theme";
import apiService from "@/utils/apiBase";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface FormData {
  display_name: string;
  business_name: string;
  description: string;
  business_phone: string;
  business_email: string;
  location: string;
  logo: string | null;
  cover_image: string | null;
}

interface FormErrors {
  display_name?: string;
  business_name?: string;
  description?: string;
  business_phone?: string;
  business_email?: string;
  location?: string;
}

export default function BecomeMerchantScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    display_name: "",
    business_name: "",
    description: "",
    business_phone: "",
    business_email: "",
    location: "",
    logo: null,
    cover_image: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const totalSteps = 3;

  // Form validation
  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    switch (step) {
      case 1: // Business Info
        if (!formData.display_name.trim()) {
          newErrors.display_name = "Display name is required";
        } else if (formData.display_name.trim().length < 3) {
          newErrors.display_name = "Display name must be at least 3 characters";
        }

        if (!formData.business_name.trim()) {
          newErrors.business_name = "Business name is required";
        }

        if (!formData.description.trim()) {
          newErrors.description = "Business description is required";
        } else if (formData.description.trim().length < 20) {
          newErrors.description = "Description must be at least 20 characters";
        }
        break;

      case 2: // Contact Info
        if (!formData.business_phone.trim()) {
          newErrors.business_phone = "Phone number is required";
        } else if (!/^[0-9+\-\s()]{10,}$/.test(formData.business_phone)) {
          newErrors.business_phone = "Enter a valid phone number";
        }

        if (formData.business_email.trim()) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(formData.business_email)) {
            newErrors.business_email = "Enter a valid email address";
          }
        }

        if (!formData.location.trim()) {
          newErrors.location = "Location is required";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        business_name: formData.business_name,
        display_name: formData.display_name,
        description: formData.description,
        business_phone: formData.business_phone,
        business_email: formData.business_email,
      };

      // Replace with actual API call
      const response = await apiService.post("/api/v1/merchants/create_profile/", submitData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.success) {
        Alert.alert(
          "Success!",
          "Your merchant profile has been created. It will be reviewed by our team within 24-48 hours.",
          [
            {
              text: "OK",
              onPress: () => router.replace("/"),
            },
          ]
        );
      } else {
        Alert.alert(
          "Failure!",
          "Your merchant profile has failed to be saved. Try again",
          [
            {
              text: "OK",
              onPress: () => router.replace("/"),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const pickImage = async (type: "logo" | "cover_image") => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library to upload images."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === "logo" ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // In production, upload to your server/cloud storage
      // For now, we'll use the local URI
      setFormData((prev) => ({
        ...prev,
        [type]: result.assets[0].uri,
      }));
    }
  };

  const removeImage = (type: "logo" | "cover_image") => {
    setFormData((prev) => ({
      ...prev,
      [type]: null,
    }));
  };

  // Step 1: Business Information
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <View style={styles.stepIconContainer}>
          <MaterialCommunityIcons
            name="store"
            size={32}
            color={colors.primary}
          />
        </View>
        <Text style={styles.stepTitle}>Business Information</Text>
        <Text style={styles.stepDescription}>
          Tell us about your business
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          Display Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.display_name && styles.inputError]}
          placeholder="How you want to be shown (e.g., Sarah's Boutique)"
          placeholderTextColor={colors.textMuted}
          value={formData.display_name}
          onChangeText={(text) => {
            setFormData((prev) => ({ ...prev, display_name: text }));
            if (errors.display_name) {
              setErrors((prev) => ({ ...prev, display_name: undefined }));
            }
          }}
        />
        {errors.display_name && (
          <Text style={styles.errorText}>{errors.display_name}</Text>
        )}
        <Text style={styles.helperText}>
          This is what customers will see
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          Business Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.business_name && styles.inputError]}
          placeholder="Official registered business name"
          placeholderTextColor={colors.textMuted}
          value={formData.business_name}
          onChangeText={(text) => {
            setFormData((prev) => ({ ...prev, business_name: text }));
            if (errors.business_name) {
              setErrors((prev) => ({ ...prev, business_name: undefined }));
            }
          }}
        />
        {errors.business_name && (
          <Text style={styles.errorText}>{errors.business_name}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          Business Description <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            errors.description && styles.inputError,
          ]}
          placeholder="Describe what you sell and what makes your business unique..."
          placeholderTextColor={colors.textMuted}
          value={formData.description}
          onChangeText={(text) => {
            setFormData((prev) => ({ ...prev, description: text }));
            if (errors.description) {
              setErrors((prev) => ({ ...prev, description: undefined }));
            }
          }}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          maxLength={500}
        />
        {errors.description && (
          <Text style={styles.errorText}>{errors.description}</Text>
        )}
        <Text style={styles.characterCount}>
          {formData.description.length}/500
        </Text>
      </View>
    </View>
  );

  // Step 2: Contact Information
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <View style={styles.stepIconContainer}>
          <Ionicons name="call" size={32} color={colors.primary} />
        </View>
        <Text style={styles.stepTitle}>Contact Information</Text>
        <Text style={styles.stepDescription}>
          How can customers reach you?
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          Business Phone <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.business_phone && styles.inputError]}
          placeholder="+256770650636"
          placeholderTextColor={colors.textMuted}
          value={formData.business_phone}
          onChangeText={(text) => {
            setFormData((prev) => ({ ...prev, business_phone: text }));
            if (errors.business_phone) {
              setErrors((prev) => ({ ...prev, business_phone: undefined }));
            }
          }}
          keyboardType="phone-pad"
        />
        {errors.business_phone && (
          <Text style={styles.errorText}>{errors.business_phone}</Text>
        )}
        <Text style={styles.helperText}>
          This will be visible to customers
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          Business Email <Text style={styles.optional}>(Optional)</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.business_email && styles.inputError]}
          placeholder="business@example.com"
          placeholderTextColor={colors.textMuted}
          value={formData.business_email}
          onChangeText={(text) => {
            setFormData((prev) => ({ ...prev, business_email: text }));
            if (errors.business_email) {
              setErrors((prev) => ({ ...prev, business_email: undefined }));
            }
          }}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.business_email && (
          <Text style={styles.errorText}>{errors.business_email}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          Location <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.location && styles.inputError]}
          placeholder="e.g., Kampala, Uganda"
          placeholderTextColor={colors.textMuted}
          value={formData.location}
          onChangeText={(text) => {
            setFormData((prev) => ({ ...prev, location: text }));
            if (errors.business_email) {
              setErrors((prev) => ({ ...prev, location: undefined }));
            }
          }}
          keyboardType="default"
          autoCapitalize="none"
        />
        
        {errors.location && (
          <Text style={styles.errorText}>{errors.location}</Text>
        )}
        <Text style={styles.helperText}>
          Where are you primarily based?
        </Text>
      </View>
    </View>
  );

  

  // Step 3: Review & Submit
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <View style={styles.stepIconContainer}>
          <Ionicons name="checkmark-circle" size={32} color={colors.success} />
        </View>
        <Text style={styles.stepTitle}>Review Your Information</Text>
        <Text style={styles.stepDescription}>
          Please confirm everything is correct
        </Text>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Business Details</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Display Name:</Text>
          <Text style={styles.reviewValue}>{formData.display_name}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Business Name:</Text>
          <Text style={styles.reviewValue}>{formData.business_name}</Text>
        </View>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Description:</Text>
          <Text style={styles.reviewValue}>{formData.description}</Text>
        </View>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.reviewSectionTitle}>Contact Information</Text>
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Phone:</Text>
          <Text style={styles.reviewValue}>{formData.business_phone}</Text>
        </View>
        {formData.business_email && (
          <View style={styles.reviewItem}>
            <Text style={styles.reviewLabel}>Email:</Text>
            <Text style={styles.reviewValue}>{formData.business_email}</Text>
          </View>
        )}
        <View style={styles.reviewItem}>
          <Text style={styles.reviewLabel}>Location:</Text>
          <Text style={styles.reviewValue}>{formData.location}</Text>
        </View>
      </View>      

      <View style={styles.verificationNotice}>
        <Ionicons name="time-outline" size={24} color={colors.warning} />
        <View style={styles.verificationNoticeContent}>
          <Text style={styles.verificationNoticeTitle}>
            Verification Required
          </Text>
          <Text style={styles.verificationNoticeText}>
            Your profile will be reviewed by our team within 24-48 hours. You'll
            receive a notification once approved.
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="light" />

      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.header}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Become a Seller</Text>
              <Text style={styles.headerSubtitle}>
                Step {currentStep} of {totalSteps}
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${(currentStep / totalSteps) * 100}%` },
              ]}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <SafeAreaView edges={["bottom"]}>
          <View style={styles.footerButtons}>
            {currentStep > 1 && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleBack}
              >
                <Ionicons name="arrow-back" size={20} color={colors.primary} />
                <Text style={styles.secondaryButtonText}>Back</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                currentStep === 1 && styles.primaryButtonFull,
                isSubmitting && styles.primaryButtonDisabled,
              ]}
              onPress={currentStep === totalSteps ? handleSubmit : handleNext}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Text style={styles.primaryButtonText}>Submitting...</Text>
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>
                    {currentStep === totalSteps ? "Submit" : "Continue"}
                  </Text>
                  <Ionicons
                    name={
                      currentStep === totalSteps ? "checkmark" : "arrow-forward"
                    }
                    size={20}
                    color={colors.white}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  // Header
  header: {
    paddingBottom: spacingY._16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: spacingY._2,
  },

  // Progress Bar
  progressBarContainer: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginTop: spacingY._16,
    marginHorizontal: spacingX._20,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: colors.white,
    borderRadius: 2,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacingX._20,
    paddingBottom: 100,
  },

  // Step Container
  stepContainer: {
    flex: 1,
  },
  stepHeader: {
    alignItems: "center",
    marginBottom: spacingY._30,
  },
  stepIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacingY._16,
  },
  stepTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacingY._8,
  },
  stepDescription: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: "center",
  },

  // Input Group
  inputGroup: {
    marginBottom: spacingY._24,
  },
  inputLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacingY._8,
  },
  required: {
    color: colors.error,
  },
  optional: {
    color: colors.textMuted,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacingX._16,
    fontSize: fontSize.md,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: {
    borderColor: colors.error,
    borderWidth: 1.5,
  },
  textArea: {
    height: 120,
    paddingTop: spacingY._16,
  },
  helperText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacingY._6,
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    marginTop: spacingY._6,
  },
  characterCount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: "right",
    marginTop: spacingY._4,
  },

  // Select Input
  selectInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectInputText: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    flex: 1,
  },
  selectInputPlaceholder: {
    color: colors.textMuted,
  },

  // Image Upload
  uploadButton: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacingX._30,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  uploadButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginTop: spacingY._12,
  },
  uploadButtonSubtext: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacingY._4,
  },
  imagePreviewContainer: {
    position: "relative",
    alignItems: "center",
  },
  logoPreview: {
    width: 150,
    height: 150,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
  },
  coverPreview: {
    width: "100%",
    height: 200,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: colors.white,
    borderRadius: 14,
  },

  // Info Card
  infoCard: {
    flexDirection: "row",
    backgroundColor: colors.primarySoft,
    borderRadius: borderRadius.md,
    padding: spacingX._16,
    gap: 12,
  },
  infoCardText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Review Section
  reviewSection: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacingX._16,
    marginBottom: spacingY._16,
  },
  reviewSectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacingY._12,
  },
  reviewItem: {
    marginBottom: spacingY._12,
  },
  reviewLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacingY._4,
  },
  reviewValue: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  reviewImages: {
    gap: 12,
  },
  reviewImageContainer: {
    alignItems: "center",
  },
  reviewImageLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacingY._8,
  },
  reviewImage: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.md,
  },
  reviewImageWide: {
    width: "100%",
    height: 150,
    borderRadius: borderRadius.md,
  },

  // Verification Notice
  verificationNotice: {
    flexDirection: "row",
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.lg,
    padding: spacingX._16,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    gap: 12,
  },
  verificationNoticeContent: {
    flex: 1,
  },
  verificationNoticeTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacingY._4,
  },
  verificationNoticeText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow.lg,
  },
  footerButtons: {
    flexDirection: "row",
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._16,
    paddingBottom: spacingY._8,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacingY._16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...shadow.primary,
  },
  primaryButtonFull: {
    flex: 1,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacingY._16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
});