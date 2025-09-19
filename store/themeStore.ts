import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: true, // Default to dark theme

  toggleTheme: async () => {
    const newTheme = !get().isDark;
    set({ isDark: newTheme });
    await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
  },

  loadTheme: async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme) {
        set({ isDark: savedTheme === 'dark' });
      }
    } catch (error) {
      console.log('Error loading theme:', error);
    }
  },
}));