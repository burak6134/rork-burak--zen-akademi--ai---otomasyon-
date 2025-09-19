import React from 'react';
import { Text, TextProps } from 'react-native';
import { colors, typography } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

interface ThemedTextProps extends TextProps {
  type?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'small';
  color?: 'primary' | 'secondary' | 'muted' | 'error' | 'success';
}

export function ThemedText({ style, type = 'body', color, ...props }: ThemedTextProps) {
  const { isDark } = useThemeStore();
  const theme = isDark ? colors.dark : colors.light;

  const getTextColor = () => {
    if (!color) return theme.text;
    
    switch (color) {
      case 'primary':
        return theme.primary;
      case 'secondary':
        return theme.secondary;
      case 'muted':
        return theme.textMuted;
      case 'error':
        return theme.error;
      case 'success':
        return theme.success;
      default:
        return theme.text;
    }
  };

  const textColor = getTextColor();

  const typeStyle = typography[type];

  return (
    <Text
      style={[
        typeStyle,
        { color: textColor },
        style,
      ]}
      {...props}
    />
  );
}