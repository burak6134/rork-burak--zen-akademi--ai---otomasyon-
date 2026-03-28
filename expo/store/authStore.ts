import { create } from 'zustand';
import { User } from '@/types/api';
import { apiService } from '@/services/api';
import { router } from 'expo-router';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      const response = await apiService.login(email, password);
      await apiService.setToken(response.token);
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (name: string, email: string, password: string) => {
    try {
      set({ isLoading: true });
      // In a real app, you would call a register API endpoint here
      const response = await apiService.register(name, email, password);
      await apiService.setToken(response.token);
      set({ user: response.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await apiService.clearToken();
    set({ user: null, isAuthenticated: false, isLoading: false });
    // Navigate to login screen after logout
    router.replace('/login');
  },

  deleteAccount: async () => {
    try {
      set({ isLoading: true });
      await apiService.deleteAccount();
      await apiService.clearToken();
      set({ user: null, isAuthenticated: false, isLoading: false });
      // Navigate to login screen after account deletion
      router.replace('/login');
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  checkAuth: async () => {
    try {
      const token = await apiService.getToken();
      if (token) {
        // In a real app, you'd validate the token here
        // For now, we'll assume it's valid if it exists
        // Mock user for testing
        const mockUser: User = {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          avatar: undefined,
        };
        set({ user: mockUser, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));