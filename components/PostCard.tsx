import React from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { Heart, MessageCircle, FileText, Play, MoreVertical } from 'lucide-react-native';
import { Post } from '@/types/api';
import { colors, spacing, typography } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import { formatRelativeTime, getUserInitials, communityService } from '@/services/community';

interface PostCardProps {
  post: Post;
  onPress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onReport?: () => void;
  onUserPress?: (userId: number) => void;
  showFullText?: boolean;
}



export default function PostCard({
  post,
  onPress,
  onLike,
  onComment,
  onReport,
  onUserPress,
  showFullText = false,
}: PostCardProps) {
  const { isDark } = useThemeStore();
  const theme = isDark ? colors.dark : colors.light;
  const { width } = useWindowDimensions();
  
  const mediaSize = Math.min(width - spacing.md * 2, 400);

  const handleUserPress = () => {
    if (onUserPress) {
      onUserPress(post.author.id);
    }
  };

  const handleMorePress = () => {
    Alert.alert(
      'Seçenekler',
      `${post.author.name} için seçenekler`,
      [
        {
          text: 'Gönderiyi Bildir',
          onPress: () => handleReportPost(),
          style: 'destructive',
        },
        {
          text: 'Kullanıcıyı Bildir',
          onPress: () => handleReportUser(),
          style: 'destructive',
        },
        {
          text: 'Kullanıcıyı Engelle',
          onPress: () => handleBlockUser(),
          style: 'destructive',
        },
        {
          text: 'İptal',
          style: 'cancel',
        },
      ]
    );
  };

  const handleReportPost = () => {
    Alert.alert(
      'Gönderiyi Bildir',
      'Bu gönderiyi neden bildirmek istiyorsunuz?',
      [
        {
          text: 'Spam',
          onPress: () => submitReport('post', 'spam'),
        },
        {
          text: 'Uygunsuz İçerik',
          onPress: () => submitReport('post', 'inappropriate'),
        },
        {
          text: 'Diğer',
          onPress: () => submitReport('post', 'other'),
        },
        {
          text: 'İptal',
          style: 'cancel',
        },
      ]
    );
  };

  const handleReportUser = () => {
    Alert.alert(
      'Kullanıcıyı Bildir',
      'Bu kullanıcıyı neden bildirmek istiyorsunuz?',
      [
        {
          text: 'Spam',
          onPress: () => submitReport('user', 'spam'),
        },
        {
          text: 'Taciz',
          onPress: () => submitReport('user', 'harassment'),
        },
        {
          text: 'Diğer',
          onPress: () => submitReport('user', 'other'),
        },
        {
          text: 'İptal',
          style: 'cancel',
        },
      ]
    );
  };

  const handleBlockUser = () => {
    Alert.alert(
      'Kullanıcıyı Engelle',
      `${post.author.name} kullanıcısını engellemek istediğinizden emin misiniz? Bu kullanıcının gönderilerini artık görmeyeceksiniz.`,
      [
        {
          text: 'Engelle',
          onPress: async () => {
            try {
              await communityService.blockUser(post.author.id);
              Alert.alert('Başarılı', 'Kullanıcı engellendi.');
            } catch (error) {
              Alert.alert('Hata', 'Kullanıcı engellenirken bir hata oluştu.');
            }
          },
          style: 'destructive',
        },
        {
          text: 'İptal',
          style: 'cancel',
        },
      ]
    );
  };

  const submitReport = async (type: 'post' | 'user', reason: string) => {
    try {
      if (type === 'post') {
        await communityService.reportPost(post.id, reason);
      } else {
        await communityService.reportUser(post.author.id, reason);
      }
      Alert.alert('Teşekkürler', 'Raporunuz alındı ve incelenecek.');
    } catch (error) {
      Alert.alert('Hata', 'Rapor gönderilirken bir hata oluştu.');
    }
  };

  const renderAvatar = () => {
    return (
      <Pressable
        onPress={handleUserPress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {post.author.avatar ? (
          <Image
            source={{ uri: post.author.avatar }}
            style={[styles.avatar, { borderColor: theme.border }]}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: theme.primary }]}>
            <Text style={[styles.avatarText, { color: theme.background }]}>
              {getUserInitials(post.author.name)}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  const renderMedia = () => {
    if (post.media.length === 0) return null;

    const media = post.media[0]; // Show first media item

    if (media.mime.startsWith('image/')) {
      return (
        <Image
          source={{ uri: media.url }}
          style={[
            styles.mediaImage,
            {
              backgroundColor: theme.surfaceVariant,
              width: mediaSize,
              height: mediaSize * 0.6,
            },
          ]}
          resizeMode="cover"
        />
      );
    }

    if (media.mime.startsWith('video/')) {
      return (
        <View style={[
          styles.mediaContainer,
          {
            backgroundColor: theme.surfaceVariant,
            width: mediaSize,
            height: mediaSize * 0.6,
          },
        ]}>
          <Image
            source={{ uri: media.url }}
            style={[
              styles.mediaImage,
              {
                width: mediaSize,
                height: mediaSize * 0.6,
              },
            ]}
            resizeMode="cover"
          />
          <View style={styles.mediaOverlay}>
            <View style={[styles.playButton, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
              <Play size={24} color="#fff" />
            </View>
          </View>
        </View>
      );
    }



    // File/Blueprint
    return (
      <View style={[styles.fileContainer, { backgroundColor: theme.surfaceVariant, borderColor: theme.border }]}>
        <FileText size={20} color={theme.primary} />
        <Text style={[styles.fileText, { color: theme.text }]} numberOfLines={1}>
          {media.name || 'Dosya'}
        </Text>
      </View>
    );
  };

  const renderText = () => {
    if (showFullText) {
      return (
        <Text style={[styles.postText, { color: theme.text }]}>
          {post.text}
        </Text>
      );
    }

    const maxLines = 4;
    const shouldTruncate = post.text.length > 200;

    return (
      <View>
        <Text
          style={[styles.postText, { color: theme.text }]}
          numberOfLines={maxLines}
        >
          {post.text}
        </Text>
        {shouldTruncate && (
          <Pressable onPress={onPress}>
            <Text style={[styles.readMore, { color: theme.primary }]}>
              Devamını oku...
            </Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <Pressable
      style={[styles.container, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}
      onPress={onPress}
    >
      {/* Header */}
      <View style={styles.header}>
        {renderAvatar()}
        <View style={styles.headerText}>
          <Pressable onPress={handleUserPress}>
            <Text style={[styles.authorName, { color: theme.text }]}>
              {post.author.name}
            </Text>
          </Pressable>
          <View style={styles.metaRow}>
            <Text style={[styles.timestamp, { color: theme.textMuted }]}>
              {formatRelativeTime(post.createdAt)}
            </Text>
            {post.group && (
              <>
                <Text style={[styles.separator, { color: theme.textMuted }]}> • </Text>
                <Text style={[styles.group, { color: theme.primary }]}>
                  {post.group}
                </Text>
              </>
            )}
          </View>
        </View>
        <Pressable
          style={styles.reportButton}
          onPress={handleMorePress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MoreVertical size={16} color={theme.textMuted} />
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {renderText()}
        {renderMedia()}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={styles.actionButton}
          onPress={onLike}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Heart
            size={20}
            color={post.likedByMe ? theme.error : theme.textMuted}
            fill={post.likedByMe ? theme.error : 'transparent'}
          />
          <Text style={[styles.actionText, { color: theme.textMuted }]}>
            {post.likeCount > 0 ? post.likeCount : 'Beğen'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={onComment}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MessageCircle size={20} color={theme.textMuted} />
          <Text style={[styles.actionText, { color: theme.textMuted }]}>
            {post.commentCount > 0 ? post.commentCount : 'Yorum Yap'}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  authorName: {
    ...typography.body,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timestamp: {
    ...typography.caption,
  },
  separator: {
    ...typography.caption,
  },
  group: {
    ...typography.caption,
    fontWeight: '500',
  },
  reportButton: {
    padding: spacing.xs,
  },
  content: {
    marginBottom: spacing.sm,
  },
  postText: {
    ...typography.body,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  readMore: {
    ...typography.caption,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
  mediaImage: {
    borderRadius: 8,
  },
  mediaContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
  },
  fileText: {
    ...typography.body,
    marginLeft: spacing.sm,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.lg,
    paddingVertical: spacing.xs,
  },
  actionText: {
    ...typography.caption,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
});