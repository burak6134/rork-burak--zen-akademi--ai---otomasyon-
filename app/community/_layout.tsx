import { Stack } from 'expo-router';
import React from 'react';
import { colors } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

export default function CommunityLayout() {
  const { isDark } = useThemeStore();
  const theme = isDark ? colors.dark : colors.light;

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.surface,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen
        name="create"
        options={{
          title: 'Yeni Gönderi',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="post/[id]"
        options={{
          title: 'Gönderi',
        }}
      />
    </Stack>
  );
}