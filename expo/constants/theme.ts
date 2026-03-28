export const colors = {
  dark: {
    background: '#0A0A0A',
    surface: '#1A1A1A',
    surfaceVariant: '#2A2A2A',
    primary: '#00E5FF',
    secondary: '#7C4DFF',
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textMuted: '#808080',
    border: '#333333',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    tabBarBackground: '#1A1A1A',
    tabBarBorder: '#333333',
  },
  light: {
    background: '#FFFFFF',
    surface: '#F5F5F5',
    surfaceVariant: '#E0E0E0',
    primary: '#00BCD4',
    secondary: '#673AB7',
    text: '#000000',
    textSecondary: '#666666',
    textMuted: '#999999',
    border: '#E0E0E0',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    tabBarBackground: '#FFFFFF',
    tabBarBorder: '#E0E0E0',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Responsive breakpoints
export const breakpoints = {
  phone: 0,
  tablet: 768,
  desktop: 1024,
} as const;

// Utility function to get responsive values
export const getResponsiveValue = <T>(
  values: { phone: T; tablet?: T; desktop?: T },
  screenWidth: number
): T => {
  if (screenWidth >= breakpoints.desktop && values.desktop !== undefined) {
    return values.desktop;
  }
  if (screenWidth >= breakpoints.tablet && values.tablet !== undefined) {
    return values.tablet;
  }
  return values.phone;
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: 'normal' as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 16,
  },
};