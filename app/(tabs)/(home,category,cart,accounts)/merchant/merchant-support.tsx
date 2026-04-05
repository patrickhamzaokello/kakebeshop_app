import React, { useState, useCallback } from "react";
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
  StatusBar,
  Linking,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";
import {
  spacingX,
  spacingY,
  borderRadius,
  fontSize,
  fontWeight,
  shadow,
} from "@/constants/theme";

// ─── Sub-components ───────────────────────────────────────────────────────────

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
}) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.contactMethod,
        { backgroundColor: colors.surface, borderColor: colors.border },
        !available && { opacity: 0.5 },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      disabled={!available}
    >
      <View style={[styles.contactMethodIcon, { backgroundColor: colors.backgroundSecondary }]}>
        {icon}
      </View>
      <View style={styles.contactMethodContent}>
        <Text style={[styles.contactMethodTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.contactMethodDescription, { color: colors.textSecondary }]}>{description}</Text>
        {available ? (
          <Text style={[styles.contactMethodAction, { color: colors.primary }]}>{actionText}</Text>
        ) : (
          <Text style={[styles.contactMethodUnavailable, { color: "#F44336" }]}>Currently Offline</Text>
        )}
      </View>
      {available && (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );
};

interface CategoryButtonProps {
  icon: string;
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

const CategoryButton: React.FC<CategoryButtonProps> = ({ icon, label, isSelected, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        {
          backgroundColor: isSelected ? colors.backgroundSecondary : colors.surface,
          borderColor: isSelected ? colors.primary : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Ionicons
        name={icon as any}
        size={18}
        color={isSelected ? colors.primary : colors.textSecondary}
      />
      <Text style={[
        styles.categoryButtonText,
        { color: isSelected ? colors.primary : colors.textSecondary },
        isSelected && { fontWeight: "700" },
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

interface QuickTopicProps {
  title: string;
  onPress: () => void;
}

const QuickTopic: React.FC<QuickTopicProps> = ({ title, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.quickTopic, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.quickTopicText, { color: colors.textSecondary }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SupportScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState("general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle("light-content"); // header is always gradient
    }, [])
  );

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert("Error", "Unable to make a call. Please try again later.")
    );
  };

  const handleEmail = (addr: string) => {
    Linking.openURL(`mailto:${addr}`).catch(() =>
      Alert.alert("Error", "Unable to open email app. Please try again later.")
    );
  };

  const handleWhatsApp = (phone: string) => {
    Linking.openURL(`whatsapp://send?phone=${phone}`).catch(() =>
      Alert.alert("Error", "WhatsApp is not installed on your device.")
    );
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert("Missing Information", "Please fill in all required fields");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        "Message Sent!",
        "Thank you for contacting us. We'll get back to you within 24 hours.",
        [{ text: "OK", onPress: () => { setSubject(""); setMessage(""); setEmail(""); } }]
      );
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Gradient header */}
      <LinearGradient colors={["#E60549", "#B0003A"]} style={{ paddingBottom: spacingY._24 }}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={22} color="#fff" />
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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* ── Contact methods ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Get in Touch</Text>

          <ContactMethod
            icon={<Ionicons name="call" size={22} color={colors.primary} />}
            title="Phone Support"
            description="Mon–Fri, 8am–6pm EAT"
            actionText="+256 787 250 196"
            onPress={() => handleCall("256787250196")}
          />
          <ContactMethod
            icon={<Ionicons name="mail" size={22} color={colors.primary} />}
            title="Email Support"
            description="Response within 24 hours"
            actionText="support@kakebe.com"
            onPress={() => handleEmail("info@kakebeshop.com")}
          />
          <ContactMethod
            icon={<MaterialCommunityIcons name="whatsapp" size={22} color="#25D366" />}
            title="WhatsApp"
            description="Quick responses"
            actionText="Message on WhatsApp"
            onPress={() => handleWhatsApp("256787250196")}
          />
        </View>

        {/* ── Message form ── */}
        <View style={[styles.section, styles.formSection, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Send us a Message</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            Fill out the form below and we'll get back to you soon
          </Text>

          {/* Category chips */}
          <View style={styles.categoriesContainer}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>What can we help you with?</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {[
                { id: "general", icon: "help-circle-outline", label: "General" },
                { id: "payment", icon: "card-outline", label: "Payment" },
                { id: "orders", icon: "cube-outline", label: "Orders" },
                { id: "account", icon: "person-outline", label: "Account" },
                { id: "selling", icon: "storefront-outline", label: "Selling" },
                { id: "technical", icon: "bug-outline", label: "Technical" },
              ].map((c) => (
                <CategoryButton
                  key={c.id}
                  icon={c.icon}
                  label={c.label}
                  isSelected={selectedCategory === c.id}
                  onPress={() => setSelectedCategory(c.id)}
                />
              ))}
            </ScrollView>
          </View>

          {/* Quick topics */}
          <View style={styles.quickTopicsContainer}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Quick Topics</Text>
            <View style={styles.quickTopicsGrid}>
              {["Track my order", "Refund request", "Change delivery address", "Account verification"].map((t) => (
                <QuickTopic key={t} title={t} onPress={() => setSubject(t)} />
              ))}
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              Your Email <Text style={{ color: colors.textMuted }}>(Optional)</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="your.email@example.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Subject */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              Subject <Text style={{ color: "#F44336" }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Brief description of your issue"
              placeholderTextColor={colors.textMuted}
              value={subject}
              onChangeText={setSubject}
            />
          </View>

          {/* Message */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              Message <Text style={{ color: "#F44336" }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Please describe your issue in detail..."
              placeholderTextColor={colors.textMuted}
              value={message}
              onChangeText={(t) => t.length <= 500 && setMessage(t)}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Text style={[styles.characterCount, { color: colors.textMuted }]}>{message.length}/500</Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }, isSubmitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            activeOpacity={0.82}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>{isSubmitting ? "Sending…" : "Send Message"}</Text>
            {!isSubmitting && <Ionicons name="send" size={16} color="#fff" />}
          </TouchableOpacity>
        </View>

        {/* ── FAQ ── */}
        <View style={styles.section}>
          <View style={styles.faqHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Common Questions</Text>
            <TouchableOpacity onPress={() => Linking.openURL("https://kakebeshop.com/mobile/help")} activeOpacity={0.7}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>

          {[
            { icon: "location-outline", title: "How do I track my order?", preview: "You can track your order in the Orders section…" },
            { icon: "card-outline", title: "What payment methods are accepted?", preview: "We accept mobile money, bank transfers, and cards…" },
            { icon: "refresh-outline", title: "What is your return policy?", preview: "You can return items within 7 days of delivery…" },
          ].map((faq) => (
            <TouchableOpacity
              key={faq.title}
              style={[styles.faqItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => Linking.openURL("https://kakebeshop.com/mobile/help")}
              activeOpacity={0.75}
            >
              <View style={[styles.faqIconContainer, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name={faq.icon as any} size={18} color={colors.primary} />
              </View>
              <View style={styles.faqContent}>
                <Text style={[styles.faqTitle, { color: colors.textPrimary }]}>{faq.title}</Text>
                <Text style={[styles.faqPreview, { color: colors.textSecondary }]}>{faq.preview}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Help center card ── */}
        <View style={[styles.section, styles.helpCenterSection, { backgroundColor: colors.backgroundSecondary }]}>
          <View style={[styles.helpCenterCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.helpCenterIcon, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="book-outline" size={30} color={colors.primary} />
            </View>
            <Text style={[styles.helpCenterTitle, { color: colors.textPrimary }]}>Visit our Help Center</Text>
            <Text style={[styles.helpCenterDescription, { color: colors.textSecondary }]}>
              Browse articles and guides to find answers to common questions
            </Text>
            <TouchableOpacity
              style={[styles.helpCenterButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => Linking.openURL("https://kakebeshop.com/mobile/help")}
              activeOpacity={0.75}
            >
              <Text style={[styles.helpCenterButtonText, { color: colors.primary }]}>Visit our website</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
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
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: fontSize.sm,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  scrollContent: {
    paddingTop: spacingY._20,
  },
  section: {
    paddingHorizontal: spacingX._20,
    marginBottom: spacingY._24,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacingY._16,
  },
  sectionDescription: {
    fontSize: fontSize.md,
    marginBottom: spacingY._20,
    lineHeight: 22,
  },

  // Contact methods
  contactMethod: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.lg,
    padding: spacingX._14,
    marginBottom: spacingY._10,
    borderWidth: 1,
  },
  contactMethodIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacingX._12,
  },
  contactMethodContent: {
    flex: 1,
    gap: 2,
  },
  contactMethodTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  contactMethodDescription: {
    fontSize: fontSize.sm,
  },
  contactMethodAction: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  contactMethodUnavailable: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },

  // Form
  formSection: {
    paddingVertical: spacingY._24,
  },
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
    paddingHorizontal: spacingX._14,
    paddingVertical: spacingY._8,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    gap: 5,
  },
  categoryButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
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
    borderWidth: 1,
  },
  quickTopicText: {
    fontSize: fontSize.sm,
  },
  inputContainer: {
    marginBottom: spacingY._18,
  },
  inputLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: spacingY._8,
  },
  input: {
    borderRadius: borderRadius.md,
    padding: spacingX._14,
    fontSize: fontSize.md,
    borderWidth: 1,
  },
  textArea: {
    height: 130,
    paddingTop: spacingY._14,
  },
  characterCount: {
    fontSize: fontSize.xs,
    textAlign: "right",
    marginTop: spacingY._4,
  },
  submitButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacingY._14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: "#fff",
  },

  // FAQ
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacingY._16,
  },
  viewAllText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  faqItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.lg,
    padding: spacingX._14,
    marginBottom: spacingY._10,
    borderWidth: 1,
    gap: 10,
  },
  faqIconContainer: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  faqContent: {
    flex: 1,
    gap: 3,
  },
  faqTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  faqPreview: {
    fontSize: fontSize.sm,
  },

  // Help center
  helpCenterSection: {
    paddingVertical: spacingY._24,
  },
  helpCenterCard: {
    borderRadius: borderRadius.lg,
    padding: spacingX._20,
    alignItems: "center",
    borderWidth: 1,
    gap: 8,
  },
  helpCenterIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacingY._8,
  },
  helpCenterTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    textAlign: "center",
  },
  helpCenterDescription: {
    fontSize: fontSize.md,
    textAlign: "center",
    lineHeight: 22,
  },
  helpCenterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._10,
    borderRadius: borderRadius.lg,
    gap: 6,
    marginTop: spacingY._8,
  },
  helpCenterButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
