import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors } from "@/constants/theme";
import { useAuthStore } from "@/utils/authStore";
import { getItemAsync, setItemAsync } from "expo-secure-store";
import React, { useEffect, useState } from "react";
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  Dimensions,
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastReadDate: string;
}

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    lastReadDate: ""
  });

  useEffect(() => {
    loadStreakData();
  }, []);

  const loadStreakData = async () => {
    try {
      const storedStreak = await getItemAsync("streakData");
      if (storedStreak) {
        setStreakData(JSON.parse(storedStreak));
      }
    } catch (error) {
    }
  };

  const updateStreak = async () => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    let newStreakData = { ...streakData };

    if (streakData.lastReadDate === today) {
      Alert.alert("Already counted!", "You've already read today. Keep it up!");
      return;
    }

    if (streakData.lastReadDate === yesterday) {
      newStreakData.currentStreak += 1;
    } else if (streakData.lastReadDate === "") {
      newStreakData.currentStreak = 1;
    } else {
      newStreakData.currentStreak = 1;
    }

    if (newStreakData.currentStreak > newStreakData.longestStreak) {
      newStreakData.longestStreak = newStreakData.currentStreak;
    }

    newStreakData.lastReadDate = today;
    
    try {
      await setItemAsync("streakData", JSON.stringify(newStreakData));
      setStreakData(newStreakData);
      Alert.alert("Streak updated!", `Current streak: ${newStreakData.currentStreak} days`);
    } catch (error) {
    }
  };

  const getStreakEmoji = () => {
    if (streakData.currentStreak === 0) return "📚";
    if (streakData.currentStreak < 7) return "🔥";
    if (streakData.currentStreak < 30) return "💪";
    return "🏆";
  };

  const getStreakMessage = () => {
    if (streakData.currentStreak === 0) return "Start your reading journey!";
    if (streakData.currentStreak < 7) return "Great start! Keep going!";
    if (streakData.currentStreak < 30) return "You're on fire! Amazing consistency!";
    return "Legend! You're a reading champion!";
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: logout }
      ]
    );
  };

  const menuItems = [
    { icon: "settings", title: "Settings", subtitle: "Manage your preferences" },
    { icon: "bookmark", title: "Saved Articles", subtitle: "Your reading list" },
    { icon: "trending-up", title: "Statistics", subtitle: "View your progress" },
    { icon: "help-circle", title: "Help & Support", subtitle: "Get assistance" },
  ];

  return (
    <ScreenWrapper style={styles.container} statusBarStyle="light-content">
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={styles.header}>
          <Typo color={colors.white} fontWeight="700" size={28}>
            Profile
          </Typo>

          {/* User Profile Section */}
          {user && (
            <View style={styles.profileSection}>
              <View style={styles.avatarWrapper}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user.username?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || "U"}
                  </Text>
                </View>
                <View style={styles.onlineIndicator} />
              </View>
              
              <Typo color={colors.white} fontWeight="700" size={24} style={styles.username}>
                {user.username || "User"}
              </Typo>
              
              <Text style={styles.email}>{user.email}</Text>
              
              <View style={styles.userStats}>
                <View style={styles.userStatItem}>
                  <MaterialIcons name="auto-stories" size={20} color={colors.white} />
                  <Text style={styles.userStatText}>Reader</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.userStatItem}>
                  <MaterialIcons name="schedule" size={20} color={colors.white} />
                  <Text style={styles.userStatText}>Daily</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.content}>
          {/* Streak Card with Enhanced Design */}
          <View style={styles.streakCard}>
            <View style={styles.streakCardHeader}>
              <View style={styles.streakIconContainer}>
                <Text style={styles.streakEmoji}>{getStreakEmoji()}</Text>
              </View>
              <View style={styles.streakHeaderText}>
                <Typo color={colors.black} fontWeight="700" size={18}>
                  Reading Streak
                </Typo>
                <Text style={styles.streakMessage}>{getStreakMessage()}</Text>
              </View>
            </View>
            
            <View style={styles.streakStatsContainer}>
              <View style={styles.streakStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{streakData.currentStreak}</Text>
                  <Text style={styles.statLabel}>Current Streak</Text>
                  <Text style={styles.statUnit}>days</Text>
                </View>
                
                <View style={styles.verticalDivider} />
                
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{streakData.longestStreak}</Text>
                  <Text style={styles.statLabel}>Personal Best</Text>
                  <Text style={styles.statUnit}>days</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.streakButton} onPress={updateStreak}>
                <MaterialIcons name="check-circle" size={20} color={colors.white} />
                <Text style={styles.streakButtonText}>Mark Today as Read</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Menu Items */}
          <View style={styles.menuSection}>
            <Typo color={colors.white} fontWeight="600" size={16} style={styles.sectionTitle}>
              Quick Actions
            </Typo>
            
            {menuItems.map((item, index) => (
              <TouchableOpacity key={index} style={styles.menuItem}>
                <View style={styles.menuIconContainer}>
                  <Feather name={item.icon as any} size={20} color={colors.white} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Feather name="chevron-right" size={20} color="rgba(255, 255, 255, 0.4)" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color={colors.white} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  headerGradient: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingBottom: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    justifyContent: "center",
    borderBottomWidth: 1,
    backgroundColor: colors.black,
    paddingBottom: 10,
    paddingHorizontal: 20,
    paddingTop: 25,
    borderBottomColor: colors.border,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    backdropFilter: "blur(10px)",
  },
  profileSection: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.primary,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#00C851",
    borderWidth: 2,
    borderColor: colors.white,
  },
  username: {
    marginBottom: 4,
  },
  email: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    marginBottom: 20,
  },
  userStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backdropFilter: "blur(10px)",
  },
  userStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  userStatText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 16,
  },
  content: {
    padding: 20,
    gap: 24,
  },
  streakCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  streakCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  streakIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  streakEmoji: {
    fontSize: 28,
  },
  streakHeaderText: {
    flex: 1,
  },
  streakMessage: {
    color: "rgba(0, 0, 0, 0.6)",
    fontSize: 14,
    marginTop: 4,
    fontWeight: "500",
  },
  streakStatsContainer: {
    gap: 20,
  },
  streakStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "rgba(0, 0, 0, 0.6)",
    fontWeight: "600",
    marginBottom: 2,
  },
  statUnit: {
    fontSize: 12,
    color: "rgba(0, 0, 0, 0.4)",
    fontWeight: "500",
  },
  verticalDivider: {
    width: 1,
    height: 60,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    marginHorizontal: 20,
  },
  streakButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  streakButtonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
  menuSection: {
    gap: 12,
  },
  sectionTitle: {
    marginBottom: 8,
    opacity: 0.8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  menuSubtitle: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(11, 11, 11, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(63, 63, 63, 0.3)",
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 20,
    marginBottom: 40,
  },
  logoutText: {
    color: colors.neutral100,
    fontWeight: "600",
    fontSize: 16,
  },
});