import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  Text,
  Pressable,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { colors, spacing, typography } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import { gamifyService, LeaderboardRow, UserStats } from '@/services/gamify';
import { router } from 'expo-router';

type RangeType = 'weekly' | 'monthly' | 'all';

export default function LeaderboardScreen() {
  const { isDark } = useThemeStore();
  const theme = isDark ? colors.dark : colors.light;
  
  const [range, setRange] = useState<RangeType>('weekly');
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [myStats, setMyStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(async (refresh = false, selectedRange?: RangeType) => {
    if (loading && !refresh) return;
    
    try {
      setError(null);
      if (refresh) {
        setRefreshing(true);
        setLeaderboard([]);
        setNextCursor(null);
      } else {
        setLoading(true);
      }

      const currentRange = selectedRange || range;
      const cursor = refresh ? undefined : nextCursor;
      const response = await gamifyService.getLeaderboard(currentRange, cursor || undefined);
      
      if (refresh) {
        setLeaderboard(response.items);
      } else {
        setLeaderboard(prev => [...prev, ...response.items]);
      }
      
      setNextCursor(response.nextCursor);
    } catch (err) {
      console.error('Leaderboard load error:', err);
      setError('Bağlantı hatası. Tekrar deneyin.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading, nextCursor, range]);

  const loadMyStats = useCallback(async () => {
    try {
      const stats = await gamifyService.getMyStats();
      setMyStats(stats);
    } catch (err) {
      console.error('My stats load error:', err);
    }
  }, []);

  useEffect(() => {
    loadLeaderboard(true);
    loadMyStats();
  }, []);

  useEffect(() => {
    loadLeaderboard(true, range);
  }, [range]);

  const handleRangeChange = useCallback((newRange: RangeType) => {
    setRange(newRange);
  }, []);

  const handleProfilePress = useCallback(() => {
    router.push('/profile' as any);
  }, []);

  const renderRankDelta = (delta?: number) => {
    if (!delta || delta === 0) {
      return <Minus size={16} color={theme.textMuted} />;
    }
    
    if (delta > 0) {
      return <TrendingUp size={16} color={theme.success} />;
    }
    
    return <TrendingDown size={16} color={theme.error} />;
  };

  const renderAvatar = (user: LeaderboardRow | UserStats) => {
    if (user.avatar) {
      return (
        <Image
          source={{ uri: user.avatar }}
          style={styles.avatar}
          defaultSource={require('@/assets/images/icon.png')}
        />
      );
    }
    
    const initials = user.name?.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
    
    return (
      <View style={[styles.avatarFallback, { backgroundColor: theme.primary }]}>
        <Text style={[styles.avatarText, { color: theme.background }]}>
          {initials}
        </Text>
      </View>
    );
  };

  const renderLeaderboardItem = useCallback(({ item, index }: { item: LeaderboardRow; index: number }) => {
    const isTopThree = index < 3;
    const trophyColor = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32';
    
    return (
      <View style={[
        styles.leaderboardItem,
        { 
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        isTopThree && styles.topThreeItem
      ]}>
        <View style={styles.rankContainer}>
          {isTopThree ? (
            <Trophy size={20} color={trophyColor} />
          ) : (
            <Text style={[styles.rankText, { color: theme.textMuted }]}>
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
      </View>
    );
  }, [theme]);

  const renderMyStats = () => {
    if (!myStats) return null;
    
    const isInList = leaderboard.some(item => item.userId === myStats.userId);
    
    if (isInList && leaderboard.length > 0) return null;
    
    return (
      <View style={[styles.myStatsContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.myStatsTitle, { color: theme.text }]}>
          Benim Sıram
        </Text>
        <View style={styles.myStatsContent}>
          <View style={styles.myStatsLeft}>
            {renderAvatar(myStats)}
            <View style={styles.myStatsInfo}>
              <Text style={[styles.myStatsName, { color: theme.text }]}>
                Sen
              </Text>
              <Text style={[styles.myStatsRank, { color: theme.textMuted }]}>
                #{myStats.rank} • {myStats.points} puan
              </Text>
            </View>
          </View>
          <Pressable
            style={[styles.profileButton, { backgroundColor: theme.primary }]}
            onPress={handleProfilePress}
          >
            <Text style={[styles.profileButtonText, { color: theme.background }]}>
              Profili Gör
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Trophy size={48} color={theme.textMuted} />
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        Henüz liste yok
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
        İlk sıralarda yer almak için aktif ol!
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={[styles.errorText, { color: theme.error }]}>
        {error}
      </Text>
      <Pressable
        style={[styles.retryButton, { backgroundColor: theme.primary }]}
        onPress={() => loadLeaderboard(true)}
      >
        <Text style={[styles.retryButtonText, { color: theme.background }]}>
          Tekrar Dene
        </Text>
      </Pressable>
    </View>
  );

  const renderFooter = () => {
    if (!loading || refreshing) return null;
    
    return (
      <View style={styles.footerLoader}>
        <Text style={[styles.footerText, { color: theme.textMuted }]}>
          Yükleniyor...
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Range Selector */}
      <View style={[styles.rangeSelector, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Pressable
          style={[
            styles.rangeButton,
            range === 'weekly' && { backgroundColor: theme.primary }
          ]}
          onPress={() => handleRangeChange('weekly')}
        >
          <Text style={[
            styles.rangeButtonText,
            { color: range === 'weekly' ? theme.background : theme.textMuted }
          ]}>
            Haftalık
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.rangeButton,
            range === 'monthly' && { backgroundColor: theme.primary }
          ]}
          onPress={() => handleRangeChange('monthly')}
        >
          <Text style={[
            styles.rangeButtonText,
            { color: range === 'monthly' ? theme.background : theme.textMuted }
          ]}>
            Aylık
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.rangeButton,
            range === 'all' && { backgroundColor: theme.primary }
          ]}
          onPress={() => handleRangeChange('all')}
        >
          <Text style={[
            styles.rangeButtonText,
            { color: range === 'all' ? theme.background : theme.textMuted }
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
          keyExtractor={(item) => `${item.userId}-${range}`}
          renderItem={renderLeaderboardItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadLeaderboard(true)}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          onEndReached={() => {
            if (nextCursor && !loading) {
              loadLeaderboard(false);
            }
          }}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={renderMyStats}
          ListEmptyComponent={!loading && !refreshing ? renderEmpty : null}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={leaderboard.length === 0 ? styles.emptyList : styles.listContent}
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
    margin: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rangeButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  rangeButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: spacing.md,
  },
  emptyList: {
    flex: 1,
  },
  myStatsContainer: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  myStatsTitle: {
    ...typography.h4,
    marginBottom: spacing.sm,
  },
  myStatsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  myStatsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  myStatsInfo: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  myStatsName: {
    ...typography.body,
    fontWeight: '600',
  },
  myStatsRank: {
    ...typography.caption,
    marginTop: 2,
  },
  profileButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  profileButtonText: {
    ...typography.caption,
    fontWeight: '600',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: 12,
    borderWidth: 1,
  },
  topThreeItem: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
  },
  rankText: {
    ...typography.body,
    fontWeight: '600',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: spacing.sm,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.body,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
  },
  deltaContainer: {
    marginLeft: spacing.xs,
  },
  points: {
    ...typography.body,
    fontWeight: '700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    ...typography.h3,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  footerLoader: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  footerText: {
    ...typography.caption,
  },
});