import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { ErrorBoundary } from "@/components/ErrorBoundary";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function RootLayoutNav() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack screenOptions={{ headerBackTitle: "Geri" }}>
      {!isAuthenticated ? (
        <Stack.Screen name="login" options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="course/[id]" 
            options={{ 
              presentation: "card",
              headerShown: true,
            }} 
          />
          <Stack.Screen 
            name="lesson/[id]" 
            options={{ 
              presentation: "card",
              headerShown: true,
            }} 
          />
          <Stack.Screen 
            name="certificates/[id]" 
            options={{ 
              presentation: "card",
              headerShown: true,
            }} 
          />
          <Stack.Screen 
            name="community" 
            options={{ 
              headerShown: false,
            }} 
          />
        </>
      )}
    </Stack>
  );
}

export default function RootLayout() {
  const { checkAuth } = useAuthStore();
  const { loadTheme } = useThemeStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('[RootLayout] Starting app initialization...');
        
        // Set a timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Initialization timeout')), 10000)
        );
        
        const initPromise = Promise.all([
          checkAuth().catch(error => {
            console.error('[RootLayout] Auth check failed:', error?.message || 'Unknown error');
            return null;
          }),
          loadTheme().catch(error => {
            console.error('[RootLayout] Theme load failed:', error?.message || 'Unknown error');
            return null;
          }),
        ]);
        
        await Promise.race([initPromise, timeoutPromise]);
        
        console.log('[RootLayout] App initialization completed');
      } catch (error) {
        console.error('[RootLayout] App initialization failed:', error);
      } finally {
        setIsInitialized(true);
        // Hide splash screen after a short delay to ensure smooth transition
        setTimeout(() => {
          SplashScreen.hideAsync().catch(console.error);
        }, 100);
      }
    };

    initializeApp();
  }, [checkAuth, loadTheme]);

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.container}>
        <ErrorBoundary>
          <RootLayoutNav />
        </ErrorBoundary>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});