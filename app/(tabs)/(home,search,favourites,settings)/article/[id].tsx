// import CommentItem from "@/components/CommentItem";
import CommentItem from "@/components/CommentItem";
import RelatedCarousel from "@/components/RelatedCarousel";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors } from "@/constants/theme";
import {
  deleteComment,
  getArticleComments,
  getArticleDetails,
  postComment,
  replyComment,
} from "@/utils/apiEndpoints";
import { useAuthStore } from "@/utils/authStore";
import { Article, ArticleComment } from "@/utils/types";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getItemAsync, setItemAsync } from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastReadDate: string;
  totalArticlesRead: number;
}

interface ReplyState {
  isReplying: boolean;
  commentId: number | null;
  commentAuthor: string | null;
}

export default function NewsArticleDetails() {
  // Article states
  const [bookmarked, setBookmarked] = useState(false);
  const [articleData, setArticleData] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streakUpdated, setStreakUpdated] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // ArticleComment states
  const [comments, setArticleComments] = useState<ArticleComment[]>([]);
  const [commentText, setArticleCommentText] = useState("");
  const [isSubmittingArticleComment, setIsSubmittingArticleComment] =
    useState(false);

  // Reply states
  const [replyState, setReplyState] = useState<ReplyState>({
    isReplying: false,
    commentId: null,
    commentAuthor: null,
  });

  const scrollY = useRef(new Animated.Value(0)).current;
  const commentInputRef = useRef<TextInput>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  // Get the article ID from route params
  const { id } = useLocalSearchParams();
  const articleID =
    typeof id === "string"
      ? parseInt(id)
      : Array.isArray(id)
      ? parseInt(id[0])
      : null;

  // ArticleComment Functions
  const loadArticleComments = async (articleId: number) => {
    try {
      const allArticleComments: ArticleComment[] = await getArticleComments(
        articleId
      );
      if (allArticleComments && Array.isArray(allArticleComments)) {
        const filtered = allArticleComments.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setArticleComments(filtered);
      }
    } catch (error) {
      console.error("Failed to load comments:", error);
    }
  };

  const addArticleComment = async () => {
    if (!commentText.trim()) return;
    if (!articleData) return;

    setIsSubmittingArticleComment(true);
    try {
      if (replyState.isReplying && replyState.commentId) {
        // Handle reply submission
        const newReply = await replyComment(
          replyState.commentId,
          commentText.trim()
        );
        if (!newReply) {
          throw new Error("Failed to post reply");
        }
        
        // Update the comments list with the new reply
        setArticleComments((prev) => 
          prev.map(comment => 
            comment.id === replyState.commentId 
              ? { ...comment, replies: [newReply, ...(comment.replies || [])] }
              : comment
          )
        );
        
        // Clear reply state
        setReplyState({
          isReplying: false,
          commentId: null,
          commentAuthor: null,
        });
      } else {
        // Handle regular comment submission
        const newArticleComment = await postComment(
          articleData.id,
          commentText.trim()
        );
        if (!newArticleComment) {
          throw new Error("Failed to post comment");
        }
        setArticleComments((prev) => [newArticleComment, ...prev]);
      }
      
      setArticleCommentText("");
    } catch (error) {
      console.error("Failed to add comment/reply:", error);
      Alert.alert("Error", replyState.isReplying ? "Failed to add reply" : "Failed to add comment");
    } finally {
      setIsSubmittingArticleComment(false);
    }
  };

  const deleteArticleComment = async (commentId: number) => {
    Alert.alert("Delete comment?", "", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await deleteComment(commentId);
            if (response.success) {
              setArticleComments((prev) =>
                prev.filter((c) => c.id !== commentId)
              );
            }
          } catch (error) {
            console.error("Failed to delete comment:", error);
          }
        },
      },
    ]);
  };

  const handleReply = (commentId: number, user: string) => {
    // Set reply state
    setReplyState({
      isReplying: true,
      commentId: commentId,
      commentAuthor: user || "Unknown User",
    });

    // Focus the input
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 100);
  };

  const cancelReply = () => {
    setReplyState({
      isReplying: false,
      commentId: null,
      commentAuthor: null,
    });
    setArticleCommentText("");
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const hours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (hours < 1) return "now";
    if (hours < 24) return `${hours}h`;
    if (hours < 168) return `${Math.floor(hours / 24)}d`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Article Functions
  const checkBookmarkStatus = async (articleId: number) => {
    try {
      const bookmarksData = await getItemAsync("bookmarkedArticles");
      if (bookmarksData) {
        const bookmarks = JSON.parse(bookmarksData);
        return bookmarks.some((bookmark: any) => bookmark.id === articleId);
      }
      return false;
    } catch (error) {
      console.error("Failed to check bookmark status:", error);
      return false;
    }
  };

  const toggleBookmark = async () => {
    if (!articleData || bookmarkLoading) return;

    setBookmarkLoading(true);
    try {
      const bookmarksData = await getItemAsync("bookmarkedArticles");
      let bookmarks = bookmarksData ? JSON.parse(bookmarksData) : [];

      const isCurrentlyBookmarked = bookmarks.some(
        (bookmark: any) => bookmark.id === articleData.id
      );

      if (isCurrentlyBookmarked) {
        bookmarks = bookmarks.filter(
          (bookmark: any) => bookmark.id !== articleData.id
        );
        setBookmarked(false);
        Alert.alert("Removed", "Article removed from bookmarks");
      } else {
        const bookmarkData = {
          ...articleData,
          bookmarkedAt: new Date().toISOString(),
        };
        bookmarks.unshift(bookmarkData);
        setBookmarked(true);
        Alert.alert("Saved", "Article bookmarked successfully!");
      }

      await setItemAsync("bookmarkedArticles", JSON.stringify(bookmarks));
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
      Alert.alert("Error", "Failed to update bookmark");
    } finally {
      setBookmarkLoading(false);
    }
  };

  const updateReadingStreak = async () => {
    if (streakUpdated) return;

    try {
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      const storedStreak = await getItemAsync("streakData");
      let streakData: StreakData = storedStreak
        ? JSON.parse(storedStreak)
        : {
            currentStreak: 0,
            longestStreak: 0,
            lastReadDate: "",
            totalArticlesRead: 0,
          };

      if (streakData.lastReadDate === today) {
        streakData.totalArticlesRead += 1;
      } else {
        streakData.totalArticlesRead += 1;

        if (streakData.lastReadDate === yesterday) {
          streakData.currentStreak += 1;
        } else if (streakData.lastReadDate === "") {
          streakData.currentStreak = 1;
        } else {
          streakData.currentStreak = 1;
        }

        if (streakData.currentStreak > streakData.longestStreak) {
          streakData.longestStreak = streakData.currentStreak;
        }

        streakData.lastReadDate = today;

        if (streakData.currentStreak === 1) {
          setTimeout(() => {
            Alert.alert(
              "🔥 Reading Streak Started!",
              "Great job! Keep reading daily to build your streak.",
              [{ text: "Keep Reading!", style: "default" }]
            );
          }, 1000);
        } else if (streakData.currentStreak % 7 === 0) {
          setTimeout(() => {
            Alert.alert(
              `🏆 ${streakData.currentStreak} Day Streak!`,
              `Amazing! You've read articles for ${streakData.currentStreak} consecutive days. Keep it up!`,
              [{ text: "Awesome!", style: "default" }]
            );
          }, 1000);
        } else if (
          streakData.currentStreak === streakData.longestStreak &&
          streakData.currentStreak > 1
        ) {
          setTimeout(() => {
            Alert.alert(
              "🎉 New Personal Best!",
              `You've reached a new reading streak record of ${streakData.currentStreak} days!`,
              [{ text: "Celebrate!", style: "default" }]
            );
          }, 1000);
        }
      }

      await setItemAsync("streakData", JSON.stringify(streakData));
      setStreakUpdated(true);
    } catch (error) {
      console.error("Failed to update reading streak:", error);
    }
  };

  const handleShare = async () => {
    if (!articleData) return;

    try {
      await Share.share({
        message: `${articleData.title}\n\nRead more at: ${
          articleData.source?.base_url || ""
        }`,
        title: articleData.title,
      });
    } catch (error) {
      console.error("Failed to share article:", error);
      Alert.alert("Error", "Failed to share article");
    }
  };

  const formatContent = (content: string) => {
    return content
      .split("\n\n")
      .map((paragraph, index) => {
        if (paragraph.trim() === "") return null;

        return (
          <Text key={index} style={[styles.paragraph]}>
            {paragraph.trim()}
          </Text>
        );
      })
      .filter(Boolean);
  };

  const getInitials = (name?: string) => {
    if (!name) return "NA";

    return name
      .trim()
      .split(" ")
      .filter((word) => word.length > 0)
      .filter((word) => word.toLowerCase() !== "by")
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .substring(0, 2);
  };

  const getAuthorColor = (name?: string) => {
    const colorOptions = [
      "#EF4444",
      "#F97316",
      "#EAB308",
      "#22C55E",
      "#3B82F6",
      "#8B5CF6",
      "#EC4899",
      "#06B6D4",
      "#84CC16",
      "#F59E0B",
    ];

    if (!name) return colorOptions[0];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colorOptions[Math.abs(hash) % colorOptions.length];
  };

  useEffect(() => {
    const fetchArticleDetails = async () => {
      if (!articleID) {
        console.error("❌ No article ID provided");
        setError("No article ID provided");
        setIsLoading(false);
        return;
      }


      try {
        setIsLoading(true);
        setError(null);

        const data = await getArticleDetails(articleID);
        

        if (data) {
          setArticleData(data);
          const isBookmarked = await checkBookmarkStatus(data.id);
          setBookmarked(isBookmarked);
          await updateReadingStreak();
          await loadArticleComments(data.id);
          console.log("✅ All data loaded successfully");
        } else {
          console.log("❌ No data returned");
          setError("Article not found");
        }
      } catch (error) {
        console.error("💥 Article fetch error:", error);
        setError("Failed to load article. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticleDetails();
  }, [articleID]);

  const hasArticleCommentContent = commentText.trim();

  // Loading state
  if (isLoading) {
    return (
      <ScreenWrapper style={styles.container}>
        <StatusBar style="dark" backgroundColor="#1F2937" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.matteBlack} />
          <Typo size={16} fontWeight="400" color={colors.matteBlack}>
            Loading article...
          </Typo>
        </View>
      </ScreenWrapper>
    );
  }

  // Error state
  if (error || !articleData) {
    return (
      <ScreenWrapper style={styles.container}>
        <StatusBar style="dark" backgroundColor="#1F2937" />
        <View style={styles.errorContainer}>
          <Typo size={18} fontWeight="600" color={colors.matteBlack}>
            Oops! Something went wrong
          </Typo>
          <Typo size={16} fontWeight="400" color={colors.matteBlack}>
            {error || "Article not found"}
          </Typo>
          <Text
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setIsLoading(true);
              setStreakUpdated(false);
            }}
          >
            Try Again
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper style={styles.container}>
      <StatusBar style="dark" backgroundColor="transparent" translucent />

      {/* Top Navigation Bar */}
      <View style={styles.topBarContainer}>
        <View style={styles.topBar}>
          <Pressable style={styles.navButton} onPress={() => router.back()}>
            <Text style={styles.navIcon}>←</Text>
          </Pressable>

          <View style={styles.rightButtons}>
            <Pressable style={styles.navButton} onPress={handleShare}>
              <Text style={styles.navIcon}>⤴</Text>
            </Pressable>

            <Pressable
              style={[
                styles.navButton,
                bookmarkLoading && styles.navButtonDisabled,
              ]}
              onPress={toggleBookmark}
              disabled={bookmarkLoading}
            >
              <Text style={[styles.navIcon, bookmarked && styles.bookmarked]}>
                {bookmarked ? "★" : "☆"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ 
          paddingBottom: insets.bottom + (replyState.isReplying ? 120 : 80)
        }}
      >
        <View style={styles.content}>
          {/* ✅ UPGRADED: Optional chaining for category */}
          <Typo size={15} fontWeight={"800"} color={colors.matteBlack}>
            {articleData.category?.name || "GENERAL"}
          </Typo>

          <Typo size={27} fontWeight={"800"} color={colors.matteBlack}>
            {articleData.title}
          </Typo>

          <View style={styles.authorContainer}>
            {/* ✅ UPGRADED: Safe author name handling */}
            <View
              style={[
                styles.authorInitials,
                {
                  backgroundColor: getAuthorColor(articleData.author?.name || "Unknown"),
                },
              ]}
            >
              <Text style={styles.initialsText}>
                {getInitials(articleData.author?.name || "Unknown")}
              </Text>
            </View>

            <View style={styles.articleMeta}>
              <Typo size={15} fontWeight={"500"} color={colors.matteBlack}>
                {articleData.author?.name || "Unknown Author"}
              </Typo>

              <View style={styles.news_info}>
                <Typo size={15} fontWeight={"300"} color={colors.matteBlack}>
                  {new Date(articleData.published_at).toLocaleString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Typo>
                <Typo size={15} fontWeight={"300"} color={colors.matteBlack}>
                  •
                </Typo>
                <Typo size={15} fontWeight={"300"} color={colors.matteBlack}>
                  {articleData.read_time_minutes || 0} min read
                </Typo>
              </View>
            </View>
          </View>

          {articleData.excerpt && (
            <Typo size={20} fontWeight={"500"} color={colors.matteBlack}>
              {articleData.excerpt}
            </Typo>
          )}

          {/* ✅ UPGRADED: Conditional image rendering */}
          {articleData.featured_image_url && (
            <Image
              source={{ uri: articleData.featured_image_url }}
              style={{ width: "100%", height: 200, borderRadius: 10 }}
              contentFit="cover"
              transition={1000}
            />
          )}

          {articleData.image_caption && (
            <Typo
              size={14}
              fontWeight={"300"}
              color={colors.matteBlack}
              style={styles.caption}
            >
              {articleData.image_caption}
            </Typo>
          )}

          <View style={styles.contentContainer}>
            {articleData.content && formatContent(articleData.content)}
          </View>

          <View style={styles.contentContainer}>
            {/* ✅ UPGRADED: Safe tags array handling */}
            {articleData.tags && articleData.tags.length > 0 && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {articleData.tags.map((tag) => (
                  <View key={tag.id} style={styles.tagText}>
                    <Typo
                      size={14}
                      fontWeight={"400"}
                      color={colors.matteBlack}
                    >
                      {tag?.name || "Unknown"}
                    </Typo>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.contentContainer}>
            {/* ✅ UPGRADED: Safe URL handling */}
            <Typo size={16} fontWeight={"400"} color={colors.matteBlack}>
              Web Link:{" "}
              <Text
                style={{ textDecorationLine: "underline" }}
                onPress={() => {
                  if (articleData.url) {
                    Linking.openURL(articleData.url);
                  }
                }}
              >
                {articleData.url || "No link available"}
              </Text>
            </Typo>
            <Typo size={16} fontWeight={"400"} color={colors.matteBlack}>
              Date:{" "}
              {new Date(articleData.published_at).toLocaleString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </Typo>
            <Typo size={16} fontWeight={"400"} color={colors.matteBlack}>
              Source Credit:{" "}
              <Text>{articleData.source?.name || "Unknown Source"}</Text>
            </Typo>
            <Typo size={16} fontWeight={"400"} color={colors.matteBlack}>
              Website:{" "}
              <Text
                style={{ textDecorationLine: "underline" }}
                onPress={() => {
                  if (articleData.source?.base_url) {
                    Linking.openURL(articleData.source.base_url);
                  }
                }}
              >
                {articleData.source?.base_url || "Unknown Source"}
              </Text>
            </Typo>
          </View>
        </View>

        <View style={styles.section}>
          <RelatedCarousel
            articleID={articleData.id}
            sectionHeading={"Related Articles"}
          />

          {/* ArticleComments Section */}
          <View style={styles.commentsContainer}>
            <View style={styles.commentsHeader}>
              <Typo size={25} fontWeight={"800"} color={colors.black}>
                Comments
              </Typo>
              <Text style={styles.commentsCount}>{comments.length}</Text>
            </View>

            {comments.length === 0 ? (
              <View style={styles.emptyArticleComments}>
                <Text style={styles.emptyArticleCommentsText}>
                  Share your thoughts...
                </Text>
              </View>
            ) : (
              <View style={styles.commentsList}>
                {comments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    onReply={handleReply}
                    onDelete={deleteArticleComment}
                    formatTime={formatTime}
                    currentUser={user?.email || ""}
                    isReply={false}
                  />
                ))} 
              </View>
            )}
          </View>
        </View>
      </Animated.ScrollView>

      {/* Fixed ArticleComment Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.fixedArticleCommentInput}
      >
        <View style={styles.commentInputContainer}>
          {/* Reply Indicator */}
          {replyState.isReplying && (
            <View style={styles.replyIndicator}>
              <View style={styles.replyIndicatorContent}>
                <Text style={styles.replyIndicatorText}>
                  Replying to {replyState.commentAuthor}
                </Text>
                <TouchableOpacity onPress={cancelReply} style={styles.cancelReplyBtn}>
                  <Text style={styles.cancelReplyText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Input Row */}
          <View style={styles.inputRow}>
            <TextInput
              ref={commentInputRef}
              style={styles.commentTextInput}
              placeholder={replyState.isReplying ? "Write a reply..." : "Add a comment..."}
              placeholderTextColor="rgba(0,0,0,0.4)"
              value={commentText}
              onChangeText={setArticleCommentText}
              maxLength={300}
              multiline
            />

            <TouchableOpacity
              style={[
                styles.sendBtn,
                !hasArticleCommentContent && styles.sendBtnDisabled,
              ]}
              onPress={addArticleComment}
              disabled={!hasArticleCommentContent || isSubmittingArticleComment}
            >
              {isSubmittingArticleComment ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendBtnText}>→</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topBarContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    height: 56,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  navIcon: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.matteBlack,
  },
  authorInitials: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  initialsText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  bookmarked: {
    color: "#FFD700",
  },
  navButtonDisabled: {
    opacity: 0.6,
  },
  rightButtons: {
    flexDirection: "row",
    gap: 12,
  },
  section: {
    paddingTop: 20,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 40,
    gap: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  retryButton: {
    color: colors.matteBlack,
    fontSize: 16,
    fontWeight: "600",
    textDecorationLine: "underline",
    marginTop: 10,
  },
  authorContainer: {
    gap: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  featuredImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
  },
  articleMeta: {
    gap: 2,
  },
  news_info: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  caption: {
    fontStyle: "italic",
    marginTop: -10,
  },
  contentContainer: {
    gap: 16,
  },
  paragraph: {
    fontSize: 18,
    lineHeight: 28,
    color: colors.matteBlack,
    marginBottom: 8,
  },
  tagText: {
    backgroundColor: "rgba(59, 130, 246, 0.08)",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontStyle: "italic",
    borderLeftWidth: 3,
    borderLeftColor: "rgba(59, 130, 246, 0.3)",
    paddingLeft: 8,
  },

  // ArticleComments Styles
  commentsContainer: {
    paddingTop: 24,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  commentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.matteBlack,
  },
  commentsCount: {
    fontSize: 14,
    color: "rgba(0,0,0,0.5)",
  },
  emptyArticleComments: {
    padding: 24,
    alignItems: "center",
  },
  emptyArticleCommentsText: {
    fontSize: 15,
    color: "rgba(0,0,0,0.5)",
  },
  commentsList: {
    gap: 12,
  },
  commentItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  commentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  commentTime: {
    fontSize: 12,
    color: "rgba(0,0,0,0.5)",
    flex: 1,
  },
  deleteArticleCommentBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteArticleCommentText: {
    fontSize: 18,
    color: "rgba(0,0,0,0.3)",
    fontWeight: "300",
  },
  commentText: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.matteBlack,
    marginBottom: 6,
  },
  commentStickers: {
    flexDirection: "row",
    gap: 4,
  },
  commentSticker: {
    fontSize: 16,
  },

  // Reply Indicator Styles
  replyIndicator: {
    backgroundColor: "rgba(59, 130, 246, 0.08)",
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#3B82F6",
  },
  replyIndicatorContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  replyIndicatorText: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "500",
    flex: 1,
  },
  cancelReplyBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  cancelReplyText: {
    fontSize: 12,
    color: "rgba(0,0,0,0.6)",
    fontWeight: "600",
  },

  // Fixed ArticleComment Input Styles
  fixedArticleCommentInput: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
    backgroundColor: "#fff",
  },
  commentInputContainer: {
    padding: 12,
  },
  selectedStickers: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  selectedSticker: {
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  selectedStickerText: {
    fontSize: 14,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  commentTextInput: {
    flex: 1,
    fontSize: 15,
    color: colors.matteBlack,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 80,
  },
  stickerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  stickerBtnActive: {
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  stickerBtnText: {
    fontSize: 16,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.matteBlack,
  },
  sendBtnDisabled: {
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  sendBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },
  stickerPicker: {
    marginTop: 8,
  },
  stickerOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.04)",
    marginRight: 6,
  },
  stickerSelected: {
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  stickerOptionText: {
    fontSize: 16,
  },
});