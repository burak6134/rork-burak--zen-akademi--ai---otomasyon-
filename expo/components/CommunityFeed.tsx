import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Plus, RefreshCw } from 'lucide-react-native';
import { colors, spacing, typography } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import { communityService } from '@/services/community';
import { Post } from '@/types/api';
import PostCard from './PostCard';

export default function CommunityFeed() {
  const { isDark } = useThemeStore();
  const theme = isDark ? colors.dark : colors.light;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [isLandscape, setIsLandscape] = useState(screenWidth > screenHeight);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setIsLandscape(window.width > window.height);
    });

    return () => subscription?.remove();
  }, []);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadPosts = useCallback(async (refresh = false) => {
    if (loading && !refresh) return;
    
    try {
      if (refresh) {
        setPosts([]);
        setCursor(null);
        setHasMore(true);
      }
      setLoading(true);
      setError(null);

      const response = await communityService.getFeed(refresh ? undefined : cursor || undefined);
      
      if (refresh) {
        setPosts(response.items);
      } else {
        setPosts(prev => [...prev, ...response.items]);
      }
      
      setCursor(response.nextCursor);
      setHasMore(!!response.nextCursor);
    } catch (err) {
      console.error('Feed load error:', err);
      setError('Bağlantı hatası. Tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }, [loading, cursor]);

  useEffect(() => {
    const initialLoad = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await communityService.getFeed();
        setPosts(response.items);
        setCursor(response.nextCursor);
        setHasMore(!!response.nextCursor);
      } catch (err) {
        console.error('Initial load error:', err);
        setError('Bağlantı hatası. Tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };
    
    initialLoad();
  }, []);

  const handleLike = useCallback(async (postId: number, currentlyLiked: boolean) => {
    try {
      // Optimistic update
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              likedByMe: !currentlyLiked,
              likeCount: currentlyLiked ? post.likeCount - 1 : post.likeCount + 1
            }
          : post
      ));

      await communityService.likePost(postId, !currentlyLiked);
    } catch (err) {
      console.error('Like error:', err);
      // Rollback optimistic update
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              likedByMe: currentlyLiked,
              likeCount: currentlyLiked ? post.likeCount + 1 : post.likeCount - 1
            }
          : post
      ));
    }
  }, []);

  const handlePostPress = useCallback((postId: number) => {
    router.push(`/community/post/${postId}`);
  }, []);

  const handleUserPress = useCallback((userId: number) => {
    console.log('User profile pressed:', userId);
    router.push(`/user/${userId}`);
  }, []);

  const handleCommentPress = useCallback((postId: number) => {
    router.push(`/community/post/${postId}`);
  }, []);

  const handleCreatePost = useCallback(() => {
    router.push('/community/create');
  }, []);

  const renderPost = useCallback(({ item }: { item: Post }) => (
    <PostCard
      post={item}
      onPress={() => handlePostPress(item.id)}
      onLike={() => handleLike(item.id, item.likedByMe)}
      onComment={() => handleCommentPress(item.id)}
      onUserPress={handleUserPress}
    />
  ), [handlePostPress, handleLike, handleCommentPress, handleUserPress]);

  const renderEmpty = () => (
    <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
      <Text style={[styles.emptyText, { color: theme.textMuted }]}>
        Henüz gönderi yok.
      </Text>
      <Text style={[styles.emptySubtext, { color: theme.textMuted }]}>
        İlk gönderiyi sen paylaş!
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
      <Text style={[styles.errorText, { color: theme.textMuted }]}>
        {error}
      </Text>
      <Pressable
        style={[styles.retryButton, { backgroundColor: theme.primary }]}
        onPress={() => loadPosts(true)}
      >
        <Text style={[styles.retryButtonText, { color: theme.surface }]}>
          Tekrar Dene
        </Text>
      </Pressable>
    </View>
  );

  const loadMore = () => {
    if (hasMore && !loading) {
      loadPosts(false);
    }
  };

  const getNumColumns = () => {
    if (isLandscape) {
      return screenWidth > 1024 ? 3 : 2; // More columns in landscape on larger screens
    }
    return 1; // Single column in portrait
  };

  const getFabStyle = () => {
    const baseStyle = [styles.fab, { backgroundColor: theme.primary }];
    if (isLandscape) {
      return [...baseStyle, styles.landscapeFab];
    }
    return baseStyle;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header with refresh button */}
      <View style={[
        styles.header, 
        isLandscape && styles.landscapeHeader,
        { backgroundColor: theme.surface, borderBottomColor: theme.border }
      ]}>
        <Text style={[
          styles.headerTitle, 
          isLandscape && styles.landscapeHeaderTitle,
          { color: theme.text }
        ]}>Akış</Text>
        <Pressable
          style={styles.refreshButton}
          onPress={() => loadPosts(true)}
          disabled={loading}
        >
          <RefreshCw 
            size={isLandscape ? 18 : 20} 
            color={loading ? theme.textMuted : theme.primary}
            style={loading ? { transform: [{ rotate: '180deg' }] } : undefined}
          />
        </Pressable>
      </View>
      
      <FlatList
        data={posts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderPost}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={error ? renderError : renderEmpty}
        contentContainerStyle={[
          posts.length === 0 ? styles.emptyList : styles.listContent,
          isLandscape && styles.landscapeListContent
        ]}
        showsVerticalScrollIndicator={false}
        numColumns={getNumColumns()}
        key={`${getNumColumns()}-${isLandscape}`} // Force re-render when columns change
      />
      
      {/* Floating Action Button */}
      <Pressable
        style={getFabStyle()}
        onPress={handleCreatePost}
      >
        <Plus size={isLandscape ? 20 : 24} color={theme.surface} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  landscapeHeader: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    fontWeight: '600',
  },
  landscapeHeaderTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  refreshButton: {
    padding: spacing.xs,
  },
  listContent: {
    paddingBottom: 80, // Space for FAB
  },
  landscapeListContent: {
    paddingBottom: 60,
    paddingHorizontal: spacing.sm,
  },
  emptyList: {
    flex: 1,
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  landscapeFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    bottom: spacing.md,
    right: spacing.md,
  },
});