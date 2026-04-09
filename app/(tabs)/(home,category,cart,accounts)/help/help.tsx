import React, { useCallback, useState } from "react";
import { Text } from "@/components/Text";
import { Linking, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { DetailHeaderSection } from "@/components/test/DetailHeader";

// ─── FAQ data ─────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: "How do I place an order?",
    a: "Browse listings, tap a product you like, then tap 'Add to Cart'. When you're ready, go to your Cart and tap 'Checkout'. Follow the steps to enter your delivery address and confirm your order.",
  },
  {
    q: "How do I track my order?",
    a: "Go to Settings → My Orders to see the status of all your orders. You'll also receive push notifications as your order progresses.",
  },
  {
    q: "Can I cancel an order?",
    a: "Orders can be cancelled within 5 minutes of placing them. After that, please contact the merchant directly or reach out to our support team.",
  },
  {
    q: "How do I become a merchant?",
    a: "Go to your Settings screen and tap 'Apply Now' on the Start Selling card. Complete the merchant application form and our team will review it within 1–3 business days.",
  },
  {
    q: "How do I return or report an item?",
    a: "Contact the merchant through the order details page. If you're unable to resolve the issue, reach out to our support team using the contact options below.",
  },
  {
    q: "How are payments handled?",
    a: "Payments are processed securely through our checkout flow. We support mobile money and card payments. You'll receive an order confirmation once payment is successful.",
  },
];

// ─── Contact channels ─────────────────────────────────────────────────────────

const CONTACT_CHANNELS = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    detail: "+256 770 650 636",
    icon: "logo-whatsapp" as const,
    color: "#25D366",
    onPress: () => Linking.openURL("https://wa.me/256770650636"),
  },
  {
    id: "email",
    label: "Email Support",
    detail: "support@kakebeshop.com",
    icon: "mail-outline" as const,
    color: "#E60549",
    onPress: () => Linking.openURL("mailto:support@kakebeshop.com"),
  },
  {
    id: "phone",
    label: "Call Us",
    detail: "+256 770 650 636",
    icon: "call-outline" as const,
    color: "#2196F3",
    onPress: () => Linking.openURL("tel:256770650636"),
  },
];

// ─── FAQ accordion item ───────────────────────────────────────────────────────

const FAQItem: React.FC<{ question: string; answer: string }> = ({
  question,
  answer,
}) => {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={[styles.faqItem, { borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={styles.faqQuestion}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.7}
      >
        <Text style={[styles.faqQuestionText, { color: colors.textPrimary }]}>
          {question}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textMuted}
        />
      </TouchableOpacity>
      {open && (
        <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
          {answer}
        </Text>
      )}
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HelpSupportMain() {
  const { isDark, colors } = useTheme();

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(isDark ? "light-content" : "dark-content");
    }, [isDark])
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailHeaderSection
        title="Help & Support"
        subheading="Get answers or reach our team"
        showBackButton
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* FAQ Section */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
          FREQUENTLY ASKED QUESTIONS
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {FAQ_ITEMS.map((item, i) => (
            <FAQItem key={i} question={item.q} answer={item.a} />
          ))}
        </View>

        {/* Contact Section */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
          CONTACT US
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {CONTACT_CHANNELS.map((ch, i) => (
            <TouchableOpacity
              key={ch.id}
              style={[
                styles.contactRow,
                i < CONTACT_CHANNELS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
              ]}
              onPress={ch.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.contactIcon, { backgroundColor: `${ch.color}18` }]}>
                <Ionicons name={ch.icon} size={20} color={ch.color} />
              </View>
              <View style={styles.contactText}>
                <Text style={[styles.contactLabel, { color: colors.textPrimary }]}>
                  {ch.label}
                </Text>
                <Text style={[styles.contactDetail, { color: colors.textSecondary }]}>
                  {ch.detail}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Support hours note */}
        <View style={[styles.noteRow, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}>
          <Ionicons name="time-outline" size={15} color={colors.textMuted} />
          <Text style={[styles.noteText, { color: colors.textMuted }]}>
            Support hours: Mon – Sat, 8 AM – 8 PM (EAT)
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 4,
  },
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginBottom: 24,
  },

  // FAQ
  faqItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
  },
  faqQuestion: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    gap: 12,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 20,
    paddingBottom: 14,
  },

  // Contact
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  contactText: {
    flex: 1,
    gap: 2,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  contactDetail: {
    fontSize: 12,
  },

  // Note
  noteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  noteText: {
    fontSize: 12,
    flex: 1,
  },
});
