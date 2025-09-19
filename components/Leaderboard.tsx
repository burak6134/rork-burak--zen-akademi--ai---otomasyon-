import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { TrendingUp, TrendingDown, Minus, Trophy, Medal, Award } from 'lucide-react-native';
import { colors, spacing, typography } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import { gamifyService, LeaderboardRow, UserStats } from '@/services/gamify';

type RangeType = 'weekly' | 'monthly' | 'all';

export default function Leaderboard() {
  const { isDark } = useThemeStore();
  const theme = isDark ? colors.dark : colors.light;
  const [range, setRange] = useState<RangeType>('weekly');
  const [myStats, setMyStats] = useState<UserStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadLeaderboard = useCallback(async (refresh = false, selectedRange?: RangeType) => {
    if (loading && !refresh) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const currentRange = selectedRange || range;
      
      if (refresh) {
        setLeaderboard([]);
        setCursor(null);
        setHasMore(true);
      }

      const response = await gamifyService.getLeaderboard(currentRange, cursor || undefined);
      
      if (refresh) {
        setLeaderboard(response.items);
      } else {
        setLeaderboard(prev => [...prev, ...response.items]);
      }
      
      setCursor(response.nextCursor);
      setHasMore(!!response.nextCursor);
    } catch (err) {
      console.error('Leaderboard load error:', err);
      setError('Bağlantı hatası. Tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }, [loading, cursor, range]);



  useEffect(() => {
    const initialLoad = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [leaderboardResponse, statsResponse] = await Promise.all([
          gamifyService.getLeaderboard(range),
          gamifyService.getMyStats()
        ]);
        
        setLeaderboard(leaderboardResponse.items);
        setCursor(leaderboardResponse.nextCursor);
        setHasMore(!!leaderboardResponse.nextCursor);
        setMyStats(statsResponse);
      } catch (err) {
        console.error('Initial load error:', err);
        setError('Bağlantı hatası. Tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };
    
    initialLoad();
  }, []);

  const handleRangeChange = useCallback((newRange: RangeType) => {
    if (!newRange || (newRange !== 'weekly' && newRange !== 'monthly' && newRange !== 'all')) return;
    setRange(newRange);
    loadLeaderboard(true, newRange);
  }, [loadLeaderboard]);

  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderAvatar = useCallback((user: LeaderboardRow | UserStats) => {
    if (user.avatar) {
      return (
        <Image
          source={{ uri: user.avatar }}
          style={[styles.avatar, { borderColor: theme.border }]}
        />
      );
    }
    
    return (
      <View style={[styles.avatarFallback, { backgroundColor: theme.primary }]}>
        <Text style={[styles.avatarText, { color: theme.surface }]}>
          {getUserInitials(user.name || 'U')}
        </Text>
      </View>
    );
  }, [theme]);

  const renderRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={20} color="#FFD700" />;
    if (rank === 2) return <Medal size={20} color="#C0C0C0" />;
    if (rank === 3) return <Award size={20} color="#CD7F32" />;
    return null;
  };

  const renderRankDelta = useCallback((delta?: number) => {
    if (!delta || delta === 0) return <Minus size={16} color={theme.textMuted} />;
    if (delta > 0) return <TrendingUp size={16} color="#10B981" />;
    return <TrendingDown size={16} color="#EF4444" />;
  }, [theme]);

  const handleUserPress = useCallback((userId: number) => {
    router.push(`/user/${userId}`);
  }, []);

  const renderLeaderboardItem = useCallback(({ item, index }: { item: LeaderboardRow; index: number }) => {
    const isTopThree = item.rank <= 3;
    
    return (
      <Pressable
        style={[
          styles.leaderboardItem,
          { backgroundColor: theme.surface, borderBottomColor: theme.border },
          isTopThree && { backgroundColor: theme.primary + '10' }
        ]}
        onPress={() => handleUserPress(item.userId)}
        android_ripple={{ color: theme.primary + '20' }}
      >
        <View style={styles.rankContainer}>
          {renderRankIcon(item.rank) || (
            <Text style={[styles.rankText, { color: theme.text }]}>
              #{item.rank}
            </Text>
          )}
        </View>
        
        {renderAvatar(item)}
        
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.deltaContainer}>
            {renderRankDelta(item.rankDelta)}
          </View>
        </View>
        
        <Text style={[styles.points, { color: theme.primary }]}>
          {item.points}p
        </Text>
      </Pressable>
    );
  }, [theme, renderAvatar, renderRankDelta, handleUserPress]);

  const renderMyStats = () => {
    if (!myStats) return null;
    
    const isInList = leaderboard.some(item => item.userId === myStats.userId);
    
    if (isInList && leaderboard.length > 0) return null;
    
    return (
      <Pressable
        style={[styles.myStatsContainer, { backgroundColor: theme.surface, borderColor: theme.primary }]}
        onPress={() => handleUserPress(myStats.userId)}
        android_ripple={{ color: theme.primary + '20' }}
      >
        <Text style={[styles.myStatsTitle, { color: theme.primary }]}>
          Benim Sıram
        </Text>
        <View style={styles.myStatsContent}>
          <View style={styles.rankContainer}>
            {renderRankIcon(myStats.rank) || (
              <Text style={[styles.rankText, { color: theme.text }]}>
                #{myStats.rank}
              </Text>
            )}
          </View>
          
          {renderAvatar(myStats)}
          
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
              {myStats.name || 'Ben'}
            </Text>
            {myStats.level && (
              <Text style={[styles.userLevel, { color: theme.textMuted }]}>
                {myStats.level}
              </Text>
            )}
          </View>
          
          <Text style={[styles.points, { color: theme.primary }]}>
            {myStats.points}p
          </Text>
        </View>
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
      <Text style={[styles.emptyText, { color: theme.textMuted }]}>
        Henüz liste yok.
      </Text>
      <Pressable
        style={[styles.retryButton, { backgroundColor: theme.primary }]}
        onPress={() => loadLeaderboard(true)}
      >
        <Text style={[styles.retryButtonText, { color: theme.surface }]}>
          Yenile
        </Text>
      </Pressable>
    </View>
  );

  const renderError = () => (
    <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
      <Text style={[styles.errorText, { color: theme.textMuted }]}>
        {error}
      </Text>
      <Pressable
        style={[styles.retryButton, { backgroundColor: theme.primary }]}
        onPress={() => loadLeaderboard(true)}
      >
        <Text style={[styles.retryButtonText, { color: theme.surface }]}>
          Tekrar Dene
        </Text>
      </Pressable>
    </View>
  );

  const loadMore = () => {
    if (hasMore && !loading) {
      loadLeaderboard(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Range Selector */}
      <View style={[styles.rangeSelector, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Pressable
          style={[
            styles.rangeButton,
            range === 'weekly' && { borderBottomColor: theme.primary }
          ]}
          onPress={() => handleRangeChange('weekly')}
        >
          <Text style={[
            styles.rangeButtonText,
            { color: range === 'weekly' ? theme.primary : theme.textMuted }
          ]}>
            Haftalık
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.rangeButton,
            range === 'monthly' && { borderBottomColor: theme.primary }
          ]}
          onPress={() => handleRangeChange('monthly')}
        >
          <Text style={[
            styles.rangeButtonText,
            { color: range === 'monthly' ? theme.primary : theme.textMuted }
          ]}>
            Aylık
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.rangeButton,
            range === 'all' && { borderBottomColor: theme.primary }
          ]}
          onPress={() => handleRangeChange('all')}
        >
          <Text style={[
            styles.rangeButtonText,
            { color: range === 'all' ? theme.primary : theme.textMuted }
          ]}>
            Tüm Zamanlar
          </Text>
        </Pressable>
      </View>

      {error && !leaderboard.length ? (
        renderError()
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => String(item.userId)}
          renderItem={renderLeaderboardItem}
          ListHeaderComponent={renderMyStats}
          ListEmptyComponent={renderEmpty}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={leaderboard.length === 0 ? styles.emptyList : styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  rangeSelector: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  rangeButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  emptyList: {
    flex: 1,
  },
  myStatsContainer: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
  },
  myStatsTitle: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  myStatsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  rankText: {
    ...typography.body,
    fontWeight: '600',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
    borderWidth: 2,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.caption,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  userName: {
    ...typography.body,
    fontWeight: '600',
  },
  userLevel: {
    ...typography.caption,
    marginTop: 2,
  },
  deltaContainer: {
    marginTop: 2,
  },
  points: {
    ...typography.body,
    fontWeight: '700',
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
    marginBottom: spacing.lg,
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
});