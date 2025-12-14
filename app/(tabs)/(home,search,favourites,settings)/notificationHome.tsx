import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors } from "@/constants/theme";
import { useHaptic } from "@/hooks/useHaptics";
import {
  getUserNotificationsList,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/utils/apiEndpoints"; // Adjust import as needed
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image_url: string;
  source_name: string;
  category_name: string;
  published_at: string;
  read_time_minutes: number;
  url: string;
}

interface Notification {
  id: number;
  notification_type: string;
  title: string;
  body: string;
  articles: Article[];
  article_count: number;
  is_read: boolean;
  read_at: string | null;
  sent_at: string;
  time_ago: string;
  priority: string;
  metadata: {
    frequency: string;
    article_count: number;
  };
}

interface NotificationResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Notification[];
}

export default function NotificationHome() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { trigger } = useHaptic();
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState<number | null>(null);

  const fetchNotifications = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      else setRefreshing(true);

      const response = await getUserNotificationsList(1);
      console.log("Fetched notifications:", response); // Debug log

      setNotifications(response.results);
    } catch (error) {
      Alert.alert("Error", "Failed to load notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const markAllAsRead = async () => {
    if (markingAll) return;

    try {
      setMarkingAll(true);
      await trigger("success");

      const result = await markAllNotificationsAsRead();

      if (result.status === "success") {
        setNotifications((prev) =>
          prev.map((n) => ({
            ...n,
            is_read: true,
            read_at: new Date().toISOString(),
          }))
        );
        Alert.alert("Success", result.message);
      }
    } catch (error: any) {
      await trigger("light");
      Alert.alert("Error", error?.message || "Something went wrong");
    } finally {
      setMarkingAll(false);
    }
  };

  const openArticle = async (url: string) => {
    await trigger("selection");
    Linking.openURL(url);
  };

  const renderArticle = ({ item }: { item: Article }) => (
    <TouchableOpacity
      style={styles.articleCard}
      onPress={() => openArticle(item.url)}
      activeOpacity={0.7}
    >
      {item.featured_image_url ? (
        <Image
          source={{ uri: item.featured_image_url }}
          style={styles.articleImage}
        />
      ) : (
        <View style={[styles.articleImage, styles.placeholderImage]}>
          <Ionicons name="newspaper-outline" size={24} color="#999" />
        </View>
      )}
      <View style={styles.articleContent}>
        <Text style={styles.articleSource}>{item.source_name}</Text>
        <Text style={styles.articleTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.read_time_minutes > 0 && (
          <Text style={styles.readTime}>{item.read_time_minutes} min read</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderNotification = ({ item }: { item: Notification }) => {
    return (
      <View style={[styles.notificationCard, item.is_read && styles.readCard]}>
        <View style={styles.notificationHeader}>
          <View style={styles.titleRow}>
            {!item.is_read && <View style={styles.unreadDot} />}
            <Typo
              fontWeight="700"
              size={18}
              color={item.is_read ? "#666" : "#000"}
            >
              {item.title}
            </Typo>
          </View>
          <Text style={styles.timeAgo}>{item.time_ago}</Text>
        </View>

        <Text style={styles.body}>{item.body}</Text>

        <View style={styles.articlesContainer}>
          <FlatList
            data={item.articles.slice(0, 3)}
            keyExtractor={(a) => a.id.toString()}
            renderItem={renderArticle}
            scrollEnabled={false}
          />
          {item.article_count > 3 && (
            <TouchableOpacity
              style={styles.moreArticles}
              onPress={() => {
                trigger("light");
                // Could open full digest modal
              }}
            >
              <Text style={styles.moreText}>
                + {item.article_count - 3} more articles
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.frequency}>
            {item.metadata.frequency.charAt(0).toUpperCase() +
              item.metadata.frequency.slice(1)}{" "}
            digest
          </Text>
          {!item.is_read && (
            <TouchableOpacity
            onPress={async () => {
              if (markingId === item.id) return; // prevent double tap
            
              try {
                setMarkingId(item.id);
                await trigger("selection");
            
                const result = await markNotificationAsRead(item.id);
            
                if (result?.status === "success") {
                  setNotifications((prev) =>
                    prev.map((n) =>
                      n.id === item.id
                        ? {
                            ...n,
                            is_read: true,
                            read_at: result.notification.read_at,
                          }
                        : n
                    )
                  );
                }
              } catch (error: any) {
                await trigger("light");
                Alert.alert("Error", error.message || "Failed to update");
              } finally {
                setMarkingId(null);
              }
            }}
            >
              <Text style={styles.markRead}>Mark as read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <ScreenWrapper style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <ScreenWrapper style={styles.container}>
      <StatusBar style="dark" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <Typo fontWeight="700" size={28} color="#000">
          Notifications
        </Typo>
        {hasUnread && (
          <TouchableOpacity
            style={[styles.markAllBtn, markingAll && { opacity: 0.7 }]}
            onPress={markAllAsRead}
            disabled={markingAll}
          >
            {markingAll ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.markAllText}>Mark all as read</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="notifications-off-outline" size={64} color="#CCC" />
          <Typo color="#666" size={18} style={{ marginTop: 16 }}>
            No notifications yet
          </Typo>
          <Text style={styles.emptySubtitle}>
            Check back later for updates!
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderNotification}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchNotifications(true)}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  markAllBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  markAllText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  notificationCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  readCard: {
    opacity: 0.75,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  timeAgo: {
    fontSize: 13,
    color: "#888",
    marginLeft: 8,
  },
  body: {
    fontSize: 15,
    color: "#444",
    marginBottom: 16,
    lineHeight: 22,
  },
  articlesContainer: {
    marginBottom: 12,
  },
  articleCard: {
    flexDirection: "row",
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 8,
  },
  articleImage: {
    width: 80,
    height: 80,
    backgroundColor: "#EEE",
  },
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
  },
  articleContent: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  articleSource: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    lineHeight: 18,
  },
  readTime: {
    fontSize: 12,
    color: "#666",
  },
  moreArticles: {
    alignItems: "center",
    paddingVertical: 12,
  },
  moreText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  frequency: {
    fontSize: 13,
    color: "#666",
    fontStyle: "italic",
  },
  markReadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: `${colors.primary}15`,
    alignSelf: "flex-start",
  },
  markRead: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
    textAlign: "center",
  },
});
