import { Text } from "@/components/Text";
import { useTheme } from "@/contexts/ThemeContext";
import apiService from "@/utils/apiBase";
import { useAuthStore } from "@/utils/authStore";
import { MenuItem, UserProfile } from "@/utils/types/models";
import { Ionicons } from "@expo/vector-icons";
import { useScrollToTop } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";



type MerchantStatusDisplay = { label: string; color: string; bg: string };

const getMerchantStatusDisplay = (
  merchant: NonNullable<UserProfile["merchant"]>
): MerchantStatusDisplay => {
  const status = merchant.status?.toUpperCase();
  if (status === "ACTIVE") {
    return merchant.verified
      ? { label: "Verified", color: "#4CAF50", bg: "#4CAF5018" }
      : { label: "Unverified", color: "#F59E0B", bg: "#FEF3C7" };
  }
  if (status === "PENDING" || status === "UNDER_REVIEW") {
    return { label: "Pending", color: "#F59E0B", bg: "#FEF3C7" };
  }
  if (status === "SUSPENDED") {
    return { label: "Suspended", color: "#F97316", bg: "#FFEDD5" };
  }
  if (status === "BANNED") {
    return { label: "Banned", color: "#DC2626", bg: "#FEE2E2" };
  }
  if (status === "REJECTED") {
    return { label: "Rejected", color: "#EF4444", bg: "#FEE2E2" };
  }
  return { label: status ?? "Unknown", color: "#9CA3AF", bg: "#F3F4F6" };
};

export default function AccountScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { logout } = useAuthStore();
  const { colors } = useTheme();

  // Scroll to top when accounts tab is pressed
  useScrollToTop(scrollRef);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await apiService.get("/auth/profile/");
      
      if (response.success && response.data.user) {
        setProfile(response.data.user);
      }
    } catch (error) {
      if (__DEV__) console.error("Error fetching user profile:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserProfile();
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            const result = await logout();
            if (result.success) {
              router.replace("/login" as any);
            }
          },
        },
      ]
    );
  };

  const handleBecomeMerchant = () => {
    router.push({ pathname: "/merchant/apply/signup" as any, params: { autoOpen: "1" } });
  };



  const settingsMenuItems: MenuItem[] = [
   
    {
      id: "notifications",
      title: "Notifications",
      icon: "notifications-outline",
      route: "/notification/notifications",
      color: "#666",
    },
    {
      id: "notifications-pref",
      title: "Notification Preferences",
      icon: "options-outline",
      route: "/notification_preference/notificationpreference",
      color: "#666",
    },
    {
      id: "language",
      title: "Language",
      icon: "language-outline",
      badge: "English",
      color: "#666",
    },
  ];

  const supportMenuItems: MenuItem[] = [
    {
      id: "help",
      title: "Help & Support",
      icon: "help-circle-outline",
      route: "/help/help",
      color: "#666",
    },
    {
      id: "about",
      title: "About & Legal",
      icon: "information-circle-outline",
      route: "/about/about",
      color: "#666",
    },
  ];

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.menuItem, { borderBottomColor: colors.border }]}
      onPress={() => {
        if (item.onPress) {
          item.onPress();
        } else if (item.route) {
          router.push(item.route as any);
        }
      }}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
          <Ionicons name={item.icon} size={22} color={item.color} />
        </View>
        <Text style={[styles.menuItemText, {color: colors.textPrimary}]}>{item.title}</Text>
      </View>
      <View style={styles.menuItemRight}>
        {item.badge && (
          <Text style={styles.menuBadge}>{item.badge}</Text>
        )}
        <Ionicons name="chevron-forward" size={20} color="#CCC" />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* ── User profile card ── */}
      <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Top row: avatar + core info + edit */}
        <View style={styles.profileTop}>
          <View style={styles.avatarWrap}>
            {profile?.profile_image ? (
              <Image source={{ uri: profile.profile_image }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="person" size={38} color={colors.textMuted} />
              </View>
            )}
            {profile?.is_verified && (
              <View style={[styles.verifiedRing, { backgroundColor: colors.surface }]}>
                <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
              </View>
            )}
          </View>

          <View style={styles.profileMeta}>
            <Text style={[styles.profileName, { color: colors.textPrimary }]} numberOfLines={1}>
              {profile?.name || profile?.username || "Guest User"}
            </Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]} numberOfLines={1}>
              {profile?.email || ""}
            </Text>
            {profile?.phone && (
              <View style={styles.phoneRow}>
                <Ionicons name="call-outline" size={12} color={colors.textMuted} />
                <Text style={[styles.profilePhone, { color: colors.textMuted }]}>{profile.phone}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: "#E6054912", borderColor: "#E6054930" }]}
            onPress={() => router.push("/userprofile/edit-profile" as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={18} color="#E60549" />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={[styles.profileDivider, { backgroundColor: colors.border }]} />

        {/* Bottom row: intent badge + verification status */}
        <View style={styles.profileBottom}>
          {profile?.intent ? (
            <View style={[styles.intentChip, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons
                name={
                  profile.intent.intent === "buy"
                    ? "cart-outline"
                    : profile.intent.intent === "sell"
                    ? "pricetag-outline"
                    : "swap-horizontal-outline"
                }
                size={13}
                color={colors.textSecondary}
              />
              <Text style={[styles.intentChipText, { color: colors.textSecondary }]}>
                {profile.intent.intent_display}
              </Text>
            </View>
          ) : null}

          {profile?.is_merchant && (
            <View style={[styles.merchantChip, { backgroundColor: "#4CAF5015" }]}>
              <Ionicons name="storefront-outline" size={13} color="#4CAF50" />
              <Text style={[styles.merchantChipText, { color: "#4CAF50" }]}>Merchant</Text>
            </View>
          )}

          {profile?.phone_verified && (
            <View style={[styles.verifiedChip, { backgroundColor: "#2196F315" }]}>
              <Ionicons name="shield-checkmark-outline" size={13} color="#2196F3" />
              <Text style={[styles.verifiedChipText, { color: "#2196F3" }]}>Verified</Text>
            </View>
          )}
        </View>

        {/* Divider before account actions */}
        <View style={[styles.profileDivider, { backgroundColor: colors.border }]} />

        {/* Account action rows */}
        <TouchableOpacity
          style={styles.profileActionRow}
          onPress={() => router.push("/orders" as any)}
          activeOpacity={0.6}
        >
          <View style={styles.profileActionLeft}>
            <Ionicons name="receipt-outline" size={19} color="#E60549" />
            <Text style={[styles.profileActionLabel, { color: colors.textPrimary }]}>My Orders</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.profileActionRow}
          onPress={() => router.push("/wishlist/wishlist" as any)}
          activeOpacity={0.6}
        >
          <View style={styles.profileActionLeft}>
            <Ionicons name="heart-outline" size={19} color="#E60549" />
            <Text style={[styles.profileActionLabel, { color: colors.textPrimary }]}>Wishlist</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.profileActionRow}
          onPress={() => router.push("/savedAddress/addresses" as any)}
          activeOpacity={0.6}
        >
          <View style={styles.profileActionLeft}>
            <Ionicons name="location-outline" size={19} color="#E60549" />
            <Text style={[styles.profileActionLabel, { color: colors.textPrimary }]}>Saved Addresses</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        
        <TouchableOpacity
            style={styles.merchantActionRow}
            onPress={() => router.push("/userprofile/edit-user-profile-image" as any)}
            activeOpacity={0.6}
          >
            <View style={styles.merchantActionLeft}>
              <Ionicons name="camera-outline" size={19} color="#E60549" />
              <Text style={[styles.merchantActionLabel, { color: colors.textPrimary }]}>Edit Profile Image</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

        

      </View>

      {/* ── Merchant profile card ── */}
      {profile?.is_merchant && profile.merchant ? (
        <View style={[styles.merchantCard, { backgroundColor: colors.surface }]}>

          {/* Header — tinted identity section */}
          <View style={styles.merchantCardHeader}>
            {/* Logo */}
            <View style={styles.merchantLogoWrap}>
              {profile.merchant.logo ? (
                <Image source={{ uri: profile.merchant.logo }} style={styles.merchantLogo} />
              ) : (
                <View style={styles.merchantLogoPlaceholder}>
                  <Ionicons name="business" size={26} color="#4CAF50" />
                </View>
              )}
              {profile.merchant.verified && (
                <View style={[styles.merchantVerifiedBadge, { backgroundColor: colors.surface }]}>
                  <Ionicons name="checkmark-circle" size={17} color="#4CAF50" />
                </View>
              )}
            </View>

            {/* Name + meta */}
            <View style={styles.merchantIdentity}>
              <Text style={[styles.merchantDisplayName, { color: colors.textPrimary }]} numberOfLines={1}>
                {profile.merchant.display_name}
              </Text>
              <Text style={[styles.merchantBusinessName, { color: colors.textSecondary }]} numberOfLines={1}>
                {profile.merchant.business_name}
              </Text>
              <View style={styles.merchantMeta}>
                <Ionicons name="star" size={12} color="#FF9800" />
                <Text style={styles.ratingText}>{profile.merchant.rating.toFixed(1)}</Text>
                <Text style={[styles.reviewCount, { color: colors.textMuted }]}>
                  · {profile.merchant.total_reviews} reviews
                </Text>
              </View>
            </View>

            {/* Status pill — top right */}
            {(() => {
              const s = getMerchantStatusDisplay(profile.merchant);
              return (
                <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
                  <View style={[styles.statusDot, { backgroundColor: s.color }]} />
                  <Text style={[styles.statusPillText, { color: s.color }]}>
                    {s.label}
                  </Text>
                </View>
              );
            })()}
          </View>

          {/* Divider */}
          <View style={[styles.merchantDivider, { backgroundColor: colors.border }]} />

          {/* Unverified notice */}
          {!profile.merchant.verified && (
            <View style={[styles.unverifiedNotice, { backgroundColor: "#FEF3C7" }]}>
              <Ionicons name="lock-closed-outline" size={15} color="#F59E0B" />
              <Text style={styles.unverifiedNoticeText}>
                Available once your account is verified
              </Text>
            </View>
          )}

          {/* Action rows — locked when unverified */}
          {[
            { icon: "pricetags-outline", label: "My Listings",         color: "#4CAF50", onPress: () => router.push("/merchant/mylistings" as any) },
            { icon: "cube-outline",      label: "Orders",              color: "#4CAF50", onPress: () => router.push("/merchant/orders" as any) },
          ].map((item) => {
            const locked = !profile.merchant!.verified;
            return (
              <TouchableOpacity
                key={item.label}
                style={[styles.merchantActionRow, locked && styles.merchantActionRowLocked]}
                onPress={locked
                  ? () => Alert.alert("Verification Required", "This feature is only available after your account has been verified.")
                  : item.onPress}
                activeOpacity={locked ? 1 : 0.6}
              >
                <View style={styles.merchantActionLeft}>
                  <Ionicons name={item.icon as any} size={19} color={locked ? colors.textMuted : item.color} />
                  <Text style={[styles.merchantActionLabel, { color: locked ? colors.textMuted : colors.textPrimary }]}>
                    {item.label}
                  </Text>
                </View>
                <Ionicons
                  name={locked ? "lock-closed-outline" : "chevron-forward"}
                  size={16}
                  color={locked ? colors.textMuted : colors.textMuted}
                />
              </TouchableOpacity>
            );
          })}

          {/* Divider before secondary CTAs */}
          <View style={[styles.merchantDivider, { backgroundColor: colors.border }]} />

          {[
            { icon: "camera-outline", label: "Edit Business Images", color: colors.textSecondary, onPress: () => router.push("/merchant/edit-merchant-profile" as any) },
            { icon: "grid-outline",   label: "Manage Business",      color: colors.textSecondary, onPress: () => {
                if (profile?.merchant?.id) router.push(`/merchant/${profile.merchant.id}`);
                else Alert.alert("Error", "Merchant ID not found.");
              }
            },
          ].map((item) => {
            const locked = !profile.merchant!.verified;
            return (
              <TouchableOpacity
                key={item.label}
                style={[styles.merchantActionRow, locked && styles.merchantActionRowLocked]}
                onPress={locked
                  ? () => Alert.alert("Verification Required", "This feature is only available after your account has been verified.")
                  : item.onPress}
                activeOpacity={locked ? 1 : 0.6}
              >
                <View style={styles.merchantActionLeft}>
                  <Ionicons name={item.icon as any} size={19} color={locked ? colors.textMuted : item.color} />
                  <Text style={[styles.merchantActionLabel, { color: locked ? colors.textMuted : colors.textPrimary }]}>
                    {item.label}
                  </Text>
                </View>
                <Ionicons
                  name={locked ? "lock-closed-outline" : "chevron-forward"}
                  size={16}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            );
          })}

        </View>
      ) : (profile?.intent?.intent === "sell" || profile?.intent?.intent === "both") ? (
        <TouchableOpacity
          style={[styles.sellBannerCard, { backgroundColor: colors.surface, borderColor: "#E6054930" }]}
          onPress={handleBecomeMerchant}
          activeOpacity={0.85}
        >
          <View style={[styles.sellBannerIcon, { backgroundColor: "#E6054912" }]}>
            <Ionicons name="storefront-outline" size={26} color="#E60549" />
          </View>
          <View style={styles.sellBannerText}>
            <Text style={[styles.sellBannerTitle, { color: colors.textPrimary }]}>Start Selling</Text>
            <Text style={[styles.sellBannerSub, { color: colors.textSecondary }]}>
              Apply to list your products and reach buyers
            </Text>
          </View>
          <View style={[styles.sellBannerArrow, { backgroundColor: "#E60549" }]}>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
      ) : null}

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
          {settingsMenuItems.map(renderMenuItem)}
        </View>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
          {supportMenuItems.map(renderMenuItem)}
        </View>
      </View>

      {/* Logout Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.black }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.white} />
          <Text style={[styles.logoutText,, { color: colors.white }]}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>

      {/* Bottom Spacing */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── User profile card ──────────────────────────────────────────────────────
  profileCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  profileTop: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 14,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedRing: {
    position: "absolute",
    bottom: -2,
    right: -2,
    borderRadius: 12,
    padding: 1,
  },
  profileMeta: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  profileEmail: {
    fontSize: 13,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  profilePhone: {
    fontSize: 12,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#E60549",
  },
  profileDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 18,
  },
  profileActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  profileActionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  profileActionLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  profileBottom: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  intentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  intentChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  merchantChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  merchantChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  verifiedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  verifiedChipText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // ── Merchant profile card ───────────────────────────────────────────────────
  merchantCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    overflow: "hidden",
  },
  merchantCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: "#4CAF500D",
  },
  merchantLogoWrap: {
    position: "relative",
  },
  merchantLogo: {
    width: 58,
    height: 58,
    borderRadius: 14,
  },
  merchantLogoPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: "#4CAF5020",
    alignItems: "center",
    justifyContent: "center",
  },
  merchantVerifiedBadge: {
    position: "absolute",
    bottom: -3,
    right: -3,
    borderRadius: 10,
    padding: 1,
  },
  merchantIdentity: {
    flex: 1,
    gap: 2,
  },
  merchantDisplayName: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  merchantBusinessName: {
    fontSize: 12,
  },
  merchantMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FF9800",
  },
  reviewCount: {
    fontSize: 12,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  merchantDivider: {
    height: StyleSheet.hairlineWidth,
  },
  merchantActionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  merchantActionRowLocked: {
    opacity: 0.45,
  },
  unverifiedNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  unverifiedNoticeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#92400E",
  },
  merchantActionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  merchantActionLabel: {
    fontSize: 14,
    fontWeight: "500",
  },

  // ── Start Selling banner ────────────────────────────────────────────────────
  sellBannerCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 14,
  },
  sellBannerIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sellBannerText: {
    flex: 1,
    gap: 3,
  },
  sellBannerTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  sellBannerSub: {
    fontSize: 12,
    lineHeight: 17,
  },
  sellBannerArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  // Section
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  // Menu Card
  menuCard: {
    borderRadius: 12,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  menuBadge: {
    fontSize: 13,
    color: "#999",
  },

  // Logout Button
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
  },

  // Version
  versionContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 12,
    color: "#CCC",
  },
});