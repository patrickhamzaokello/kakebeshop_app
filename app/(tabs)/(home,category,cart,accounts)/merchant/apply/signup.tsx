import React, { useState } from "react";
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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import apiService from "@/utils/apiBase";

export default function MerchantSignupScreen() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form data
  const [formData, setFormData] = useState({
    businessName: "",
    displayName: "",
    description: "",
    phoneNumber: "",
    email: "",
    address: "",
    businessCategory: "",
    logo: null as string | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant permission to access your photos"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({ ...prev, logo: result.assets[0].uri }));
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.businessName.trim()) {
        newErrors.businessName = "Business name is required";
      }
      if (!formData.displayName.trim()) {
        newErrors.displayName = "Display name is required";
      }
      if (!formData.businessCategory.trim()) {
        newErrors.businessCategory = "Business category is required";
      }
    }

    if (step === 2) {
      if (!formData.description.trim()) {
        newErrors.description = "Business description is required";
      } else if (formData.description.trim().length < 50) {
        newErrors.description = "Description must be at least 50 characters";
      }
    }

    if (step === 3) {
      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = "Phone number is required";
      }
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Please enter a valid email";
      }
      if (!formData.address.trim()) {
        newErrors.address = "Business address is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append("business_name", formData.businessName);
      submitData.append("display_name", formData.displayName);
      submitData.append("description", formData.description);
      submitData.append("phone", formData.phoneNumber);
      submitData.append("email", formData.email);
      submitData.append("address", formData.address);
      submitData.append("business_category", formData.businessCategory);

      if (formData.logo && !formData.logo.startsWith("http")) {
        const filename = formData.logo.split("/").pop() || "logo.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        submitData.append("logo", {
          uri: formData.logo,
          name: filename,
          type,
        } as any);
      }

      const response = await apiService.post("/api/v1/merchants/create_profile/", submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.success) {
        Alert.alert(
          "Application Submitted! 🎉",
          "Your merchant application has been submitted successfully. We'll review it and get back to you soon.",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert("Error", response.error || "Failed to submit application");
      }
    } catch (error: any) {
      console.error("Error submitting application:", error);
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to submit application. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear error for this field
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Business Information</Text>
      <Text style={styles.stepDescription}>
        Tell us about your business
      </Text>

      {/* Logo Upload */}
      <View style={styles.logoSection}>
        <Text style={styles.label}>Business Logo</Text>
        <TouchableOpacity
          style={styles.logoUpload}
          onPress={handlePickImage}
          activeOpacity={0.7}
        >
          {formData.logo ? (
            <Image source={{ uri: formData.logo }} style={styles.logoImage} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Ionicons name="camera" size={32} color="#999" />
              <Text style={styles.logoPlaceholderText}>Add Logo</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.hint}>Optional - You can add this later</Text>
      </View>

      {/* Business Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Business Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.businessName && styles.inputError]}
          placeholder="e.g., FoodHub Uganda Ltd"
          value={formData.businessName}
          onChangeText={(text) => updateFormData("businessName", text)}
          autoCapitalize="words"
        />
        {errors.businessName && (
          <Text style={styles.errorText}>{errors.businessName}</Text>
        )}
      </View>

      {/* Display Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Display Name <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.displayName && styles.inputError]}
          placeholder="e.g., FoodHub"
          value={formData.displayName}
          onChangeText={(text) => updateFormData("displayName", text)}
          autoCapitalize="words"
        />
        {errors.displayName && (
          <Text style={styles.errorText}>{errors.displayName}</Text>
        )}
        <Text style={styles.hint}>This will be shown to customers</Text>
      </View>

      {/* Business Category */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Business Category <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.businessCategory && styles.inputError]}
          placeholder="e.g., Food & Beverages, Electronics, Fashion"
          value={formData.businessCategory}
          onChangeText={(text) => updateFormData("businessCategory", text)}
          autoCapitalize="words"
        />
        {errors.businessCategory && (
          <Text style={styles.errorText}>{errors.businessCategory}</Text>
        )}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Business Description</Text>
      <Text style={styles.stepDescription}>
        Help customers understand what you offer
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Description <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            errors.description && styles.inputError,
          ]}
          placeholder="Describe your business, products, and what makes you unique..."
          value={formData.description}
          onChangeText={(text) => updateFormData("description", text)}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        <View style={styles.characterCount}>
          <Text
            style={[
              styles.hint,
              formData.description.length < 50 && styles.hintError,
            ]}
          >
            {formData.description.length}/50 minimum
          </Text>
        </View>
        {errors.description && (
          <Text style={styles.errorText}>{errors.description}</Text>
        )}
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={20} color="#2196F3" />
        <Text style={styles.infoText}>
          A good description helps customers find and trust your business
        </Text>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Contact Information</Text>
      <Text style={styles.stepDescription}>
        How can customers reach you?
      </Text>

      {/* Phone Number */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Phone Number <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.phoneNumber && styles.inputError]}
          placeholder="e.g., +256700000000"
          value={formData.phoneNumber}
          onChangeText={(text) => updateFormData("phoneNumber", text)}
          keyboardType="phone-pad"
        />
        {errors.phoneNumber && (
          <Text style={styles.errorText}>{errors.phoneNumber}</Text>
        )}
      </View>

      {/* Email */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Email Address <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="e.g., info@foodhub.com"
          value={formData.email}
          onChangeText={(text) => updateFormData("email", text)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && (
          <Text style={styles.errorText}>{errors.email}</Text>
        )}
      </View>

      {/* Address */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Business Address <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            errors.address && styles.inputError,
          ]}
          placeholder="Enter your physical business address"
          value={formData.address}
          onChangeText={(text) => updateFormData("address", text)}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
        {errors.address && (
          <Text style={styles.errorText}>{errors.address}</Text>
        )}
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="shield-checkmark-outline" size={20} color="#4CAF50" />
        <Text style={styles.infoText}>
          Your information will be verified before approval
        </Text>
      </View>
    </View>
  );

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3].map((step) => (
        <View key={step} style={styles.progressStepContainer}>
          <View
            style={[
              styles.progressDot,
              currentStep >= step && styles.progressDotActive,
            ]}
          >
            {currentStep > step ? (
              <Ionicons name="checkmark" size={16} color="white" />
            ) : (
              <Text
                style={[
                  styles.progressDotText,
                  currentStep >= step && styles.progressDotTextActive,
                ]}
              >
                {step}
              </Text>
            )}
          </View>
          {step < 3 && (
            <View
              style={[
                styles.progressLine,
                currentStep > step && styles.progressLineActive,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="storefront" size={32} color="#E60549" />
          </View>
          <Text style={styles.headerTitle}>Become a Merchant</Text>
          <Text style={styles.headerSubtitle}>
            Start selling your products on Kakebe
          </Text>
        </View>

        {/* Progress Bar */}
        {renderProgressBar()}

        {/* Steps */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <View style={styles.actionButtons}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
              disabled={loading}
            >
              <Ionicons name="arrow-back" size={20} color="#666" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.nextButton,
              currentStep === 1 && styles.nextButtonFull,
            ]}
            onPress={handleNext}
            activeOpacity={0.7}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {currentStep === 3 ? "Submit Application" : "Continue"}
                </Text>
                {currentStep < 3 && (
                  <Ionicons name="arrow-forward" size={20} color="white" />
                )}
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },

  // Header
  header: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: "white",
  },
  headerIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFE5ED",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },

  // Progress Bar
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: "white",
  },
  progressStepContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E5E5",
  },
  progressDotActive: {
    backgroundColor: "#E60549",
    borderColor: "#E60549",
  },
  progressDotText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#999",
  },
  progressDotTextActive: {
    color: "white",
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: "#E5E5E5",
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: "#E60549",
  },

  // Steps
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
  },

  // Logo Section
  logoSection: {
    marginBottom: 24,
  },
  logoUpload: {
    alignSelf: "center",
    marginBottom: 8,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F5F5F5",
    borderWidth: 2,
    borderColor: "#E5E5E5",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  logoPlaceholderText: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
  },

  // Input Group
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  required: {
    color: "#E60549",
  },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: "#1A1A1A",
  },
  inputError: {
    borderColor: "#F44336",
  },
  textArea: {
    height: 120,
    paddingTop: 14,
  },
  hint: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
  },
  hintError: {
    color: "#F44336",
  },
  errorText: {
    fontSize: 12,
    color: "#F44336",
    marginTop: 6,
  },
  characterCount: {
    alignItems: "flex-end",
  },

  // Info Box
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },

  // Bottom Actions
  bottomActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  backButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#F5F5F5",
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },
  nextButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#E60549",
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
  },
});