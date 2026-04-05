import React, { useCallback, useState } from "react";
import {
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { DetailHeaderSection } from "@/components/test/DetailHeader";

// ─── Collapsible legal section ────────────────────────────────────────────────

const LegalSection: React.FC<{
  title: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  children: React.ReactNode;
}> = ({ title, icon, children }) => {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View style={[styles.legalBlock, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <TouchableOpacity
        style={styles.legalHeader}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.7}
      >
        <View style={styles.legalHeaderLeft}>
          <Ionicons name={icon} size={18} color={colors.textSecondary} />
          <Text style={[styles.legalTitle, { color: colors.textPrimary }]}>{title}</Text>
        </View>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textMuted}
        />
      </TouchableOpacity>
      {open && (
        <View style={[styles.legalBody, { borderTopColor: colors.border }]}>
          {children}
        </View>
      )}
    </View>
  );
};

const BodyText: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { colors } = useTheme();
  return (
    <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
      {children}
    </Text>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AboutLegalMain() {
  const { isDark, colors } = useTheme();

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle(isDark ? "light-content" : "dark-content");
    }, [isDark])
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailHeaderSection
        title="About & Legal"
        subheading="App info, privacy, and terms"
      />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* App info card */}
        <View style={[styles.appCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.appLogo, { backgroundColor: "#E6054918" }]}>
            <Ionicons name="storefront" size={32} color="#E60549" />
          </View>
          <View style={styles.appInfo}>
            <Text style={[styles.appName, { color: colors.textPrimary }]}>KakebeShop</Text>
            <Text style={[styles.appTagline, { color: colors.textSecondary }]}>
              Your local marketplace — buy and sell with ease
            </Text>
            <Text style={[styles.appVersion, { color: colors.textMuted }]}>
              Version 1.0.0
            </Text>
          </View>
        </View>

        {/* Quick links */}
        <View style={[styles.linksCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.linkRow, { borderBottomColor: colors.border }]}
            onPress={() => Linking.openURL("https://kakebeshop.com")}
            activeOpacity={0.7}
          >
            <Ionicons name="globe-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.linkText, { color: colors.textPrimary }]}>Visit our website</Text>
            <Ionicons name="open-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL("mailto:hello@kakebeshop.com")}
            activeOpacity={0.7}
          >
            <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.linkText, { color: colors.textPrimary }]}>hello@kakebeshop.com</Text>
            <Ionicons name="open-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Legal — collapsible sections */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>LEGAL</Text>

        <LegalSection title="Privacy Policy" icon="shield-checkmark-outline">
          <BodyText>
            At KakebeShop, your privacy matters. We collect only the information necessary to provide
            our marketplace service — including your name, email, and delivery addresses.
          </BodyText>
          <BodyText>
            We do not sell your personal data to third parties. Your payment details are processed
            securely and never stored on our servers.
          </BodyText>
          <BodyText>
            By using KakebeShop you consent to our data practices as described here.
            For the full policy, visit kakebeshop.com/privacy.
          </BodyText>
        </LegalSection>

        <LegalSection title="Terms & Conditions" icon="document-text-outline">
          <BodyText>
            By accessing or using KakebeShop, you agree to these terms. We reserve the right
            to suspend accounts that violate our community standards or engage in fraudulent activity.
          </BodyText>
          <BodyText>
            Merchants are responsible for the accuracy of their listings and the quality of goods
            or services delivered. KakebeShop acts as a marketplace facilitator and is not a party
            to transactions between buyers and sellers.
          </BodyText>
          <BodyText>
            For the complete terms of service, visit kakebeshop.com/terms.
          </BodyText>
        </LegalSection>

        <LegalSection title="Licenses" icon="code-slash-outline">
          <BodyText>
            KakebeShop is built with open-source software. We are grateful to the React Native,
            Expo, and wider open-source communities whose work makes this app possible.
          </BodyText>
        </LegalSection>

        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },

  // App card
  appCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 18,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  appLogo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  appInfo: {
    flex: 1,
    gap: 3,
  },
  appName: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  appTagline: {
    fontSize: 13,
    lineHeight: 18,
  },
  appVersion: {
    fontSize: 12,
    marginTop: 2,
  },

  // Quick links
  linksCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
  },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginTop: 8,
    marginBottom: 4,
  },

  // Legal blocks
  legalBlock: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  legalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  legalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  legalTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  legalBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
