import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

interface ThemedViewProps extends ViewProps {
  surface?: boolean;
  variant?: boolean;
}

export function ThemedView({ style, surface, variant, ...props }: ThemedViewProps) {
  const { isDark } = useThemeStore();
  const theme = isDark ? colors.dark : colors.light;

  const backgroundColor = variant 
    ? theme.surfaceVariant 
    : surface 
    ? theme.surface 
    : theme.background;

  return (
    <View
      style={[
        { backgroundColor },
        style,
      ]}
      {...props}
    />
  );
}