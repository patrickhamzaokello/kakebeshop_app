import { ArticleComment } from "@/utils/types";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const CommentItem = ({
  comment,
  onReply,
  onDelete,
  formatTime,
  isReply = false,
  currentUser,
}: {comment: ArticleComment, onReply: any, onDelete: any, formatTime: any, isReply: boolean, currentUser: string}) => {
  const [showReplies, setShowReplies] = useState(true);

  const handleDelete = () => {
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(comment.id),
        },
      ]
    );
  };

  const isOwner = comment.user === currentUser;
  const hasReplies = comment.replies && comment.replies.length > 0;

  // ✅ SAFETY: Ensure user is a string
  const userEmail = comment.user || "unknown@user.com";
  const userInitial = userEmail.charAt(0).toUpperCase();
  const username = userEmail.split("@")[0];

  return (
    <View style={[styles.commentContainer, isReply && styles.replyContainer]}>
      <View style={styles.commentContent}>
        {/* Avatar and main content */}
        <View style={styles.avatarColumn}>
          <View style={[styles.avatar, isReply && styles.replyAvatar]}>
            {/* ✅ FIXED: Safe access to user initial */}
            <Text style={styles.avatarText}>
              {userInitial}
            </Text>
          </View>
          {hasReplies && <View style={styles.threadLine} />}
        </View>

        <View style={styles.messageColumn}>
          {/* Header with user info and actions */}
          <View style={styles.commentHeader}>
            <View style={styles.userInfo}>
              {/* ✅ FIXED: Safe username extraction */}
              <Text style={styles.username}>{username}</Text>
              <Text style={styles.timestamp}>
                {formatTime(comment.created_at)}
              </Text>
            </View>

            <View style={styles.actions}>
              {isOwner && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDelete}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Comment text */}
          <Text style={styles.commentText}>{comment.content}</Text>

          {/* Action buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.replyButton}
              onPress={() => onReply(comment.id, comment.user)}
            >
              <Text style={styles.replyButtonText}>Reply</Text>
            </TouchableOpacity>

            {hasReplies && (
              <TouchableOpacity
                style={styles.toggleRepliesButton}
                onPress={() => setShowReplies(!showReplies)}
              >
                <Text style={styles.toggleRepliesText}>
                  {/* ✅ FIXED: Safe access to replies length */}
                  {showReplies ? "Hide" : "Show"} {comment.replies?.length || 0}
                  {(comment.replies?.length || 0) === 1 ? " reply" : " replies"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Replies */}
      {showReplies && hasReplies && (
        <View style={styles.repliesContainer}>
          {/* ✅ FIXED: Safe mapping over replies */}
          {comment.replies?.map((reply: any) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onDelete={onDelete}
              formatTime={formatTime}
              isReply={true}
              currentUser={currentUser}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default CommentItem;

const styles = StyleSheet.create({
  commentsList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  commentContainer: {
    marginBottom: 16,
  },
  replyContainer: {
    marginLeft: 20,
    marginTop: 12,
    marginBottom: 8,
  },
  commentContent: {
    flexDirection: 'row',
  },
  avatarColumn: {
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  replyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#34C759',
  },
  avatarText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  threadLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E5E7',
    marginTop: 8,
    minHeight: 20,
  },
  messageColumn: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  username: {
    fontWeight: '600',
    fontSize: 15,
    color: '#1D1D1F',
    marginRight: 8,
  },
  timestamp: {
    fontSize: 13,
    color: '#8E8E93',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '500',
  },
  commentText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#1D1D1F',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  replyButton: {
    paddingVertical: 6,
    paddingHorizontal: 0,
    marginRight: 16,
  },
  replyButtonText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '500',
  },
  toggleRepliesButton: {
    paddingVertical: 6,
    paddingHorizontal: 0,
  },
  toggleRepliesText: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '500',
  },
  repliesContainer: {
    marginTop: 8,
  },
});