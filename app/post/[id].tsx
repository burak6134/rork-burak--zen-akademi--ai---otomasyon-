import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Send, MessageCircle } from 'lucide-react-native';
import { Post, Comment } from '@/types/api';
import { colors, spacing, typography } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import { communityService, formatRelativeTime, getUserInitials } from '@/services/community';
import PostCard from '@/components/PostCard';

export default function PostDetailScreen() {
  const { isDark } = useThemeStore();
  const theme = isDark ? colors.dark : colors.light;
  const { id } = useLocalSearchParams();
  const postId = parseInt(id as string);
  
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [commentText, setCommentText] = useState<string>('');
  const [isCommenting, setIsCommenting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadPostAndComments = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      
      // In a real implementation, you'd have a getPost endpoint
      // For now, we'll simulate getting the post from the feed
      const feedResponse = await communityService.getFeed();
      const foundPost = feedResponse.items.find(p => p.id === postId);
      
      if (!foundPost) {
        setError('Gönderi bulunamadı.');
        return;
      }
      
      setPost(foundPost);
      
      // Load comments
      const commentsResponse = await communityService.getComments(postId);
      setComments(commentsResponse);
      
    } catch (err) {
      console.error('Load post error:', err);
      setError('Gönderi yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (postId) {
      loadPostAndComments();
    }
  }, [postId, loadPostAndComments]);

  const handleLike = useCallback(async () => {
    if (!post) return;

    // Optimistic update
    setPost(prev => {
      if (!prev) return prev;
      const newLikedByMe = !prev.likedByMe;
      return {
        ...prev,
        likedByMe: newLikedByMe,
        likeCount: newLikedByMe ? prev.likeCount + 1 : prev.likeCount - 1,
      };
    });

    try {
      await communityService.likePost(post.id, !post.likedByMe);
    } catch (err) {
      console.error('Like error:', err);
      // Rollback optimistic update
      setPost(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          likedByMe: post.likedByMe,
          likeCount: post.likeCount,
        };
      });
    }
  }, [post]);

  const handleReport = useCallback(async () => {
    if (!post) return;
    
    Alert.alert(
      'Gönderiyi Raporla',
      'Bu gönderiyi neden raporlamak istiyorsunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Spam',
          onPress: () => submitReport('spam'),
        },
        {
          text: 'Uygunsuz İçerik',
          onPress: () => submitReport('inappropriate'),
        },
        {
          text: 'Diğer',
          onPress: () => submitReport('other'),
        },
      ]
    );
  }, [post]);

  const submitReport = async (reason: string) => {
    if (!post) return;
    
    try {
      await communityService.reportPost(post.id, reason);
      Alert.alert('Teşekkürler', 'Bildiriminiz alındı ve incelenecek.');
    } catch (err) {
      console.error('Report error:', err);
      Alert.alert('Hata', 'Rapor gönderilirken bir hata oluştu.');
    }
  };

  const handleAddComment = async () => {
    if (!post || !commentText.trim() || isCommenting) return;

    setIsCommenting(true);
    try {
      const newComment = await communityService.addComment(post.id, commentText.trim());
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      
      // Update post comment count
      setPost(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          commentCount: prev.commentCount + 1,
        };
      });
      
    } catch (err) {
      console.error('Comment error:', err);
      Alert.alert('Hata', 'Yorum eklenirken bir hata oluştu.');
    } finally {
      setIsCommenting(false);
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={[styles.commentItem, { borderBottomColor: theme.border }]}>
      <View style={styles.commentHeader}>
        <View style={[styles.commentAvatar, { backgroundColor: theme.primary }]}>
          <Text style={[styles.commentAvatarText, { color: theme.background }]}>
            {getUserInitials(item.author.name)}
          </Text>
        </View>
        <View style={styles.commentInfo}>
          <Text style={[styles.commentAuthor, { color: theme.text }]}>
            {item.author.name}
          </Text>
          <Text style={[styles.commentTime, { color: theme.textMuted }]}>
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>
      </View>
      <Text style={[styles.commentText, { color: theme.text }]}>
        {item.text}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <Stack.Screen
          options={{
            title: 'Gönderi',
            headerStyle: { backgroundColor: theme.surface },
            headerTintColor: theme.text,
          }}
        />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>
          Yükleniyor...
        </Text>
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
        <Stack.Screen
          options={{
            title: 'Hata',
            headerStyle: { backgroundColor: theme.surface },
            headerTintColor: theme.text,
          }}
        />
        <Text style={[styles.errorText, { color: theme.error }]}>
          {error || 'Gönderi bulunamadı'}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen
        options={{
          title: 'Gönderi',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Post */}
        <PostCard
          post={post}
          onLike={handleLike}
          onReport={handleReport}
          showFullText={true}
        />

        {/* Comments Section */}
        <View style={[styles.commentsSection, { borderTopColor: theme.border }]}>
          <View style={styles.commentsHeader}>
            <MessageCircle size={20} color={theme.text} />
            <Text style={[styles.commentsTitle, { color: theme.text }]}>
              Yorumlar ({comments.length})
            </Text>
          </View>

          {comments.length === 0 ? (
            <View style={styles.noComments}>
              <Text style={[styles.noCommentsText, { color: theme.textMuted }]}>
                Henüz yorum yok. İlk yorumu sen yap!
              </Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderComment}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={[styles.commentInput, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <TextInput
          style={[
            styles.commentTextInput,
            {
              backgroundColor: theme.background,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          placeholder="Yorum yaz..."
          placeholderTextColor={theme.textMuted}
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
        />
        <Pressable
          style={[
            styles.sendButton,
            {
              backgroundColor: commentText.trim() && !isCommenting ? theme.primary : theme.surfaceVariant,
            },
          ]}
          onPress={handleAddComment}
          disabled={!commentText.trim() || isCommenting}
        >
          <Send
            size={16}
            color={commentText.trim() && !isCommenting ? theme.background : theme.textMuted}
          />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  loadingText: {
    ...typography.body,
  },
  errorText: {
    ...typography.body,
    textAlign: 'center',
  },
  commentsSection: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  commentsTitle: {
    ...typography.h3,
    marginLeft: spacing.xs,
  },
  noComments: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  noCommentsText: {
    ...typography.body,
    textAlign: 'center',
  },
  commentItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    ...typography.caption,
    fontWeight: '600',
  },
  commentInfo: {
    marginLeft: spacing.sm,
  },
  commentAuthor: {
    ...typography.caption,
    fontWeight: '600',
  },
  commentTime: {
    ...typography.small,
  },
  commentText: {
    ...typography.body,
    marginLeft: 40, // Avatar width + margin
    lineHeight: 20,
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  commentTextInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: spacing.sm,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});