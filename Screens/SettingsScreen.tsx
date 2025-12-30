import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/utils/authStore";
import apiService from "@/utils/apiBase";

interface UserProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  profile_image: string | null;
  phone: string | null;
  bio: string | null;
  is_verified: boolean;
  phone_verified: boolean;
  is_merchant: boolean;
  merchant?: {
    id: string;
    display_name: string;
    business_name: string;
    logo: string | null;
    verified: boolean;
    status: string;
    rating: number;
    total_reviews: number;
    is_active: boolean;
  };
  intent?: {
    intent: string;
    intent_display: string;
  };
}

interface MenuItem {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route?: string;
  onPress?: () => void;
  badge?: string;
  color?: string;
}

export default function AccountScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { logout } = useAuthStore();

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
      console.error("Error fetching user profile:", error);
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
    router.push("/merchant/apply/signup" as any);
  };

  const accountMenuItems: MenuItem[] = [
    {
      id: "orders",
      title: "My Orders",
      icon: "receipt-outline",
      route: "/orders/orders",
      color: "#E60549",
    },
    {
      id: "wishlist",
      title: "Wishlist",
      icon: "heart-outline",
      route: "/wishlist/wishlist",
      color: "#E60549",
    },
    {
      id: "addresses",
      title: "Saved Addresses",
      icon: "location-outline",
      route: "/savedAddress/addresses",
      color: "#E60549",
    },
  ];

  // Merchant menu items (only show if user is a merchant)
  const merchantMenuItems: MenuItem[] = [
    {
      id: "merchant-dashboard",
      title: "Merchant Dashboard",
      icon: "stats-chart-outline",
      route: "/merchant/dashboard",
      color: "#4CAF50",
    },
    {
      id: "my-listings",
      title: "My Listings",
      icon: "pricetags-outline",
      route: "/merchant/listings",
      color: "#4CAF50",
    },
    {
      id: "merchant-orders",
      title: "Merchant Orders",
      icon: "cube-outline",
      route: "/merchant/orders",
      color: "#4CAF50",
    },
    {
      id: "merchant-profile",
      title: "Business Profile",
      icon: "business-outline",
      route: "/merchant/profile",
      color: "#4CAF50",
    },
  ];

  const settingsMenuItems: MenuItem[] = [
    {
      id: "profile",
      title: "Edit Profile",
      icon: "person-outline",
      route: "/editprofile/edit-profile",
      color: "#666",
    },
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
      icon: "notifications-outline",
      route: "/notification_preference/notificationpreference",
      color: "#666",
    },
    {
      id: "privacy",
      title: "Privacy & Security",
      icon: "shield-outline",
      route: "/privacy/privacy",
      color: "#666",
    },
    {
      id: "language",
      title: "Language",
      icon: "language-outline",
      route: "/language/language",
      badge: "English",
      color: "#666",
    },
  ];

  const supportMenuItems: MenuItem[] = [
    {
      id: "help",
      title: "Help Center",
      icon: "help-circle-outline",
      route: "/help/help",
      color: "#666",
    },
    {
      id: "support",
      title: "Contact Support",
      icon: "chatbubble-outline",
      route: "/support/support",
      color: "#666",
    },
    {
      id: "about",
      title: "About",
      icon: "information-circle-outline",
      route: "/about/about",
      color: "#666",
    },
    {
      id: "terms",
      title: "Terms & Conditions",
      icon: "document-text-outline",
      route: "/terms/terms",
      color: "#666",
    },
  ];

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
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
        <Text style={styles.menuItemText}>{item.title}</Text>
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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E60549" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#E60549"
        />
      }
    >
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileImageContainer}>
          {profile?.profile_image ? (
            <Image
              source={{ uri: profile.profile_image }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Ionicons name="person" size={40} color="#999" />
            </View>
          )}
          {profile?.is_verified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            </View>
          )}
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>
            {profile?.name || profile?.username || "Guest User"}
          </Text>
          <Text style={styles.profileEmail}>{profile?.email || ""}</Text>
          {profile?.phone && (
            <Text style={styles.profilePhone}>{profile.phone}</Text>
          )}
          {profile?.intent && (
            <View style={styles.intentBadge}>
              <Ionicons 
                name={
                  profile.intent.intent === "buy" 
                    ? "cart-outline" 
                    : profile.intent.intent === "sell" 
                    ? "pricetag-outline" 
                    : "swap-horizontal-outline"
                } 
                size={12} 
                color="#666" 
              />
              <Text style={styles.intentText}>{profile.intent.intent_display}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push("/editprofile/edit-profile" as any)}
          activeOpacity={0.7}
        >
          <Ionicons name="create-outline" size={20} color="#E60549" />
        </TouchableOpacity>
      </View>

      {/* Merchant Status Card */}
      {profile?.is_merchant && profile.merchant ? (
        <View style={styles.merchantCard}>
          <View style={styles.merchantHeader}>
            <View style={styles.merchantLogoContainer}>
              {profile.merchant.logo ? (
                <Image
                  source={{ uri: profile.merchant.logo }}
                  style={styles.merchantLogo}
                />
              ) : (
                <View style={styles.merchantLogoPlaceholder}>
                  <Ionicons name="business" size={24} color="#4CAF50" />
                </View>
              )}
              {profile.merchant.verified && (
                <View style={styles.merchantVerifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                </View>
              )}
            </View>
            <View style={styles.merchantInfo}>
              <Text style={styles.merchantName}>{profile.merchant.display_name}</Text>
              <Text style={styles.businessName}>{profile.merchant.business_name}</Text>
              <View style={styles.merchantStats}>
                <View style={styles.statItem}>
                  <Ionicons name="star" size={14} color="#FF9800" />
                  <Text style={styles.statText}>
                    {profile.merchant.rating.toFixed(1)} ({profile.merchant.total_reviews})
                  </Text>
                </View>
                <View style={[styles.statusBadge, { 
                  backgroundColor: profile.merchant.status === "ACTIVE" ? "#E8F5E9" : "#FFF3E0" 
                }]}>
                  <Text style={[styles.statusText, { 
                    color: profile.merchant.status === "ACTIVE" ? "#4CAF50" : "#FF9800" 
                  }]}>
                    {profile.merchant.status}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.manageMerchantButton}
            onPress={() => router.push("/merchant/dashboard" as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.manageMerchantText}>Manage Business</Text>
            <Ionicons name="arrow-forward" size={16} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      ) : profile?.intent?.intent === "sell" || profile?.intent?.intent === "both" ? (
        <View style={styles.becomeMerchantCard}>
          <View style={styles.becomeMerchantContent}>
            <Ionicons name="storefront-outline" size={32} color="#E60549" />
            <Text style={styles.becomeMerchantTitle}>Start Selling</Text>
            <Text style={styles.becomeMerchantText}>
              Apply to become a merchant and start listing your products
            </Text>
          </View>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleBecomeMerchant}
            activeOpacity={0.7}
          >
            <Text style={styles.applyButtonText}>Apply Now</Text>
            <Ionicons name="arrow-forward" size={16} color="white" />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Merchant Section - Only show if user is merchant */}
      {profile?.is_merchant && profile?.merchant?.verified && profile?.merchant?.is_active && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Merchant</Text>
          <View style={styles.menuCard}>
            {merchantMenuItems.map(renderMenuItem)}
          </View>
        </View>
      )}

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.menuCard}>
          {accountMenuItems.map(renderMenuItem)}
        </View>
      </View>

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.menuCard}>
          {settingsMenuItems.map(renderMenuItem)}
        </View>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.menuCard}>
          {supportMenuItems.map(renderMenuItem)}
        </View>
      </View>

      {/* Logout Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={22} color="#E60549" />
          <Text style={styles.logoutText}>Logout</Text>
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

  // Profile Header
  profileHeader: {
    backgroundColor: "white",
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  profileImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: 10,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 13,
    color: "#999",
    marginBottom: 4,
  },
  intentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 4,
  },
  intentText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666",
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF5F8",
    justifyContent: "center",
    alignItems: "center",
  },

  // Merchant Card
  merchantCard: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E8F5E9",
  },
  merchantHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  merchantLogoContainer: {
    position: "relative",
  },
  merchantLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  merchantLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  merchantVerifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: 8,
  },
  merchantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  businessName: {
    fontSize: 13,
    color: "#666",
    marginBottom: 6,
  },
  merchantStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  manageMerchantButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    gap: 6,
  },
  manageMerchantText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4CAF50",
  },

  // Become Merchant Card
  becomeMerchantCard: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#FFE5ED",
  },
  becomeMerchantContent: {
    alignItems: "center",
    marginBottom: 16,
  },
  becomeMerchantTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginTop: 12,
    marginBottom: 8,
  },
  becomeMerchantText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#E60549",
    borderRadius: 10,
    gap: 6,
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
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
    backgroundColor: "white",
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
    borderBottomColor: "#F5F5F5",
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
    color: "#1A1A1A",
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
    backgroundColor: "white",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#E60549",
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