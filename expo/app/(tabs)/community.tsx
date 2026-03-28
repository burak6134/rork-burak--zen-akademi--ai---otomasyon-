import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { Stack } from 'expo-router';
import { colors, spacing, typography } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import CommunityFeed from '@/components/CommunityFeed';
import Leaderboard from '@/components/Leaderboard';

type TabType = 'feed' | 'leaderboard';

export default function CommunityScreen() {
  const { isDark } = useThemeStore();
  const theme = isDark ? colors.dark : colors.light;
  const [activeTab, setActiveTab] = useState<TabType>('feed');

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen
        options={{
          title: 'Topluluk',
          headerStyle: { backgroundColor: theme.surface },
          headerTintColor: theme.text,
        }}
      />
      
      {/* Tab Selector */}
      <View style={[styles.tabSelector, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Pressable
          style={[
            styles.tabButton,
            activeTab === 'feed' && { borderBottomColor: theme.primary }
          ]}
          onPress={() => handleTabChange('feed')}
        >
          <Text style={[
            styles.tabButtonText,
            { color: activeTab === 'feed' ? theme.primary : theme.textMuted }
          ]}>
            Akış
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tabButton,
            activeTab === 'leaderboard' && { borderBottomColor: theme.primary }
          ]}
          onPress={() => handleTabChange('leaderboard')}
        >
          <Text style={[
            styles.tabButtonText,
            { color: activeTab === 'leaderboard' ? theme.primary : theme.textMuted }
          ]}>
            Liderlik
          </Text>
        </Pressable>
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'feed' ? (
          <CommunityFeed />
        ) : (
          <Leaderboard />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabSelector: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
});