import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Linking } from "react-native";

import {
  colors,
  spacingX,
  spacingY,
  borderRadius,
  fontSize,
  fontWeight,
  shadow,
} from "@/constants/theme";

interface ContactMethodProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionText: string;
  onPress: () => void;
  available?: boolean;
}

const ContactMethod: React.FC<ContactMethodProps> = ({
  icon,
  title,
  description,
  actionText,
  onPress,
  available = true,
}) => (
  <TouchableOpacity
    style={[styles.contactMethod, !available && styles.contactMethodDisabled]}
    onPress={onPress}
    activeOpacity={0.7}
    disabled={!available}
  >
    <View style={styles.contactMethodIcon}>{icon}</View>
    <View style={styles.contactMethodContent}>
      <Text style={styles.contactMethodTitle}>{title}</Text>
      <Text style={styles.contactMethodDescription}>{description}</Text>
      {available ? (
        <Text style={styles.contactMethodAction}>{actionText}</Text>
      ) : (
        <Text style={styles.contactMethodUnavailable}>Currently Offline</Text>
      )}
    </View>
    {available && (
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    )}
  </TouchableOpacity>
);

interface CategoryButtonProps {
  icon: string;
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({
  icon,
  label,
  isSelected,
  onPress,
}) => (
  <TouchableOpacity
    style={[styles.categoryButton, isSelected && styles.categoryButtonSelected]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Ionicons
      name={icon as any}
      size={20}
      color={isSelected ? colors.primary : colors.textSecondary}
    />
    <Text
      style={[
        styles.categoryButtonText,
        isSelected && styles.categoryButtonTextSelected,
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

interface QuickTopicProps {
  title: string;
  onPress: () => void;
}

const QuickTopic: React.FC<QuickTopicProps> = ({ title, onPress }) => (
  <TouchableOpacity
    style={styles.quickTopic}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={styles.quickTopicText}>{title}</Text>
  </TouchableOpacity>
);

export default function SupportScreen() {
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);


  const handleCall = (phonenumber: string) => {
    Linking.openURL(`tel:${phonenumber}`).catch((err) =>
      Alert.alert("Error", "Unable to make a call. Please try again later.")
    );
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch((err) =>
      Alert.alert("Error", "Unable to open email app. Please try again later.")
    );
  };

  const handleWhatsApp = (phonenumber: string) => {
    const whatsappURL = `whatsapp://send?phone=${phonenumber}`;
    Linking.openURL(whatsappURL).catch((err) =>
      Alert.alert(
        "Error",
        "WhatsApp is not installed on your device. Please install it and try again."
      )
    );
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert("Missing Information", "Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        "Message Sent!",
        "Thank you for contacting us. We'll get back to you within 24 hours.",
        [
          {
            text: "OK",
            onPress: () => {
              setSubject("");
              setMessage("");
              setEmail("");
            },
          },
        ]
      );
    }, 1500);
  };

  const handleQuickTopic = (topic: string) => {
    setSubject(topic);
  };

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
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Help & Support</Text>
              <Text style={styles.headerSubtitle}>We're here to help you</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Contact Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>

         

          <ContactMethod
            icon={<Ionicons name="call" size={24} color={colors.primary} />}
            title="Phone Support"
            description="Mon-Fri, 8am-6pm EAT"
            actionText="+256 787 250 196"
            onPress={() => handleCall("256787250196")}
            available={true}
          />

          <ContactMethod
            icon={<Ionicons name="mail" size={24} color={colors.primary} />}
            title="Email Support"
            description="Response within 24 hours"
            actionText="support@kakebe.com"
            onPress={() => handleEmail("info@kakebeshop.com")}
            available={true}
          />

          <ContactMethod
            icon={
              <MaterialCommunityIcons
                name="whatsapp"
                size={24}
                color={colors.primary}
              />
            }
            title="WhatsApp"
            description="Quick responses"
            actionText="Message on WhatsApp"
            onPress={() => handleWhatsApp("256787250196")}
            available={true}
          />
        </View>

        {/* Message Form */}
        <View style={[styles.section, styles.formSection]}>
          <Text style={styles.sectionTitle}>Send us a Message</Text>
          <Text style={styles.sectionDescription}>
            Fill out the form below and we'll get back to you soon
          </Text>

          {/* Category Selection */}
          <View style={styles.categoriesContainer}>
            <Text style={styles.inputLabel}>What can we help you with?</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              <CategoryButton
                icon="help-circle-outline"
                label="General"
                isSelected={selectedCategory === "general"}
                onPress={() => setSelectedCategory("general")}
              />
              <CategoryButton
                icon="card-outline"
                label="Payment"
                isSelected={selectedCategory === "payment"}
                onPress={() => setSelectedCategory("payment")}
              />
              <CategoryButton
                icon="cube-outline"
                label="Orders"
                isSelected={selectedCategory === "orders"}
                onPress={() => setSelectedCategory("orders")}
              />
              <CategoryButton
                icon="person-outline"
                label="Account"
                isSelected={selectedCategory === "account"}
                onPress={() => setSelectedCategory("account")}
              />
              <CategoryButton
                icon="storefront-outline"
                label="Selling"
                isSelected={selectedCategory === "selling"}
                onPress={() => setSelectedCategory("selling")}
              />
              <CategoryButton
                icon="bug-outline"
                label="Technical"
                isSelected={selectedCategory === "technical"}
                onPress={() => setSelectedCategory("technical")}
              />
            </ScrollView>
          </View>

          {/* Quick Topics */}
          <View style={styles.quickTopicsContainer}>
            <Text style={styles.inputLabel}>Quick Topics</Text>
            <View style={styles.quickTopicsGrid}>
              <QuickTopic
                title="Track my order"
                onPress={() => handleQuickTopic("Track my order")}
              />
              <QuickTopic
                title="Refund request"
                onPress={() => handleQuickTopic("Refund request")}
              />
              <QuickTopic
                title="Change delivery address"
                onPress={() => handleQuickTopic("Change delivery address")}
              />
              <QuickTopic
                title="Account verification"
                onPress={() => handleQuickTopic("Account verification")}
              />
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Your Email <Text style={styles.optional}>(Optional)</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="your.email@example.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Subject Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Subject <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Brief description of your issue"
              placeholderTextColor={colors.textMuted}
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          {/* Message Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Message <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Please describe your issue in detail..."
              placeholderTextColor={colors.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>{message.length}/500</Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Text style={styles.submitButtonText}>Sending...</Text>
            ) : (
              <>
                <Text style={styles.submitButtonText}>Send Message</Text>
                <Ionicons name="send" size={18} color={colors.white} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* FAQ Quick Links */}
        <View style={styles.section}>
          <View style={styles.faqHeader}>
            <Text style={styles.sectionTitle}>Common Questions</Text>
            <TouchableOpacity onPress={() => Linking.openURL("https://kakebeshop.com/mobile/help")}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.faqItem}
            onPress={() => Linking.openURL("https://kakebeshop.com/mobile/help")}
          >
            <View style={styles.faqIconContainer}>
              <Ionicons
                name="location-outline"
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.faqContent}>
              <Text style={styles.faqTitle}>How do I track my order?</Text>
              <Text style={styles.faqPreview}>
                You can track your order in the Orders section...
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.faqItem}
            onPress={() => Linking.openURL("https://kakebeshop.com/mobile/help")}
          >
            <View style={styles.faqIconContainer}>
              <Ionicons name="card-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.faqContent}>
              <Text style={styles.faqTitle}>
                What payment methods are accepted?
              </Text>
              <Text style={styles.faqPreview}>
                We accept mobile money, bank transfers, and cards...
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.faqItem}
            onPress={() => Linking.openURL("https://kakebeshop.com/mobile/help")}
          >
            <View style={styles.faqIconContainer}>
              <Ionicons
                name="refresh-outline"
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.faqContent}>
              <Text style={styles.faqTitle}>What is your return policy?</Text>
              <Text style={styles.faqPreview}>
                You can return items within 7 days of delivery...
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Help Center */}
        <View style={[styles.section, styles.helpCenterSection]}>
          <View style={styles.helpCenterCard}>
            <View style={styles.helpCenterIcon}>
              <Ionicons name="book-outline" size={32} color={colors.primary} />
            </View>
            <Text style={styles.helpCenterTitle}>Visit our Help Center</Text>
            <Text style={styles.helpCenterDescription}>
              Browse articles and guides to find answers to common questions
            </Text>
            <TouchableOpacity
              style={styles.helpCenterButton}
              onPress={() => Linking.openURL("https://kakebeshop.com/mobile/help")}
            >
              <Text style={styles.helpCenterButtonText}>Visit our website</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
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
    paddingBottom: spacingY._24,
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

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacingY._20,
  },

  // Section
  section: {
    paddingHorizontal: spacingX._20,
    marginBottom: spacingY._24,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacingY._16,
  },
  sectionDescription: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacingY._20,
    lineHeight: 22,
  },

  // Contact Methods
  contactMethod: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacingX._16,
    marginBottom: spacingY._12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactMethodDisabled: {
    opacity: 0.5,
  },
  contactMethodIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacingX._12,
  },
  contactMethodContent: {
    flex: 1,
  },
  contactMethodTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacingY._2,
  },
  contactMethodDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacingY._4,
  },
  contactMethodAction: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  contactMethodUnavailable: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.error,
  },

  // Form Section
  formSection: {
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: spacingY._24,
  },

  // Categories
  categoriesContainer: {
    marginBottom: spacingY._20,
  },
  categoriesScroll: {
    paddingRight: spacingX._20,
    gap: 8,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacingX._16,
    paddingVertical: spacingY._10,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  categoryButtonSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
  },
  categoryButtonTextSelected: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },

  // Quick Topics
  quickTopicsContainer: {
    marginBottom: spacingY._20,
  },
  quickTopicsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickTopic: {
    paddingHorizontal: spacingX._12,
    paddingVertical: spacingY._8,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickTopicText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },

  // Input
  inputContainer: {
    marginBottom: spacingY._20,
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
  textArea: {
    height: 140,
    paddingTop: spacingY._16,
  },
  characterCount: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: "right",
    marginTop: spacingY._4,
  },

  // Submit Button
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacingY._16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...shadow.primary,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },

  // FAQ Section
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacingY._16,
  },
  viewAllText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  faqItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacingX._16,
    marginBottom: spacingY._12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  faqIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacingX._12,
  },
  faqContent: {
    flex: 1,
  },
  faqTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacingY._4,
  },
  faqPreview: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },

  // Help Center
  helpCenterSection: {
    backgroundColor: colors.backgroundSecondary,
    paddingVertical: spacingY._24,
  },
  helpCenterCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacingX._24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  helpCenterIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacingY._16,
  },
  helpCenterTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacingY._8,
    textAlign: "center",
  },
  helpCenterDescription: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacingY._20,
  },
  helpCenterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._12,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primarySoft,
    gap: 8,
  },
  helpCenterButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
});
