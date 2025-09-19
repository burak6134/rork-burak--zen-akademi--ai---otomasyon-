import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
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
            options={{ presentation: "card", headerShown: true }}
          />
          <Stack.Screen
            name="lesson/[id]"
            options={{ presentation: "card", headerShown: true }}
          />
          <Stack.Screen
            name="certificates/[id]"
            options={{ presentation: "card", headerShown: true }}
          />
          <Stack.Screen name="community" options={{ headerShown: false }} />
        </>
      )}
    </Stack>
  );
}

export default function RootLayout() {
  const { checkAuth } = useAuthStore();
  const { loadTheme } = useThemeStore();
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(Platform.OS !== 'web');

  useEffect(() => {
    if (Platform.OS === 'web') {
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        console.log('[RootLayout] init');
        if (Platform.OS !== 'web') {
          await SplashScreen.preventAutoHideAsync().catch(() => {});
        }
        const timeoutMs = 2500;
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Initialization timeout')), timeoutMs)
        );
        const initPromise = Promise.all([
          checkAuth().catch((e) => {
            console.error('[RootLayout] Auth check failed:', e?.message ?? e);
            return null;
          }),
          loadTheme().catch((e) => {
            console.error('[RootLayout] Theme load failed:', e?.message ?? e);
            return null;
          }),
        ]);
        await Promise.race([initPromise, timeoutPromise]);
      } catch (e) {
        console.error('[RootLayout] init error', e);
      } finally {
        setIsInitialized(true);
        if (Platform.OS !== 'web') {
          setTimeout(() => {
            SplashScreen.hideAsync().catch(() => {});
          }, 100);
        }
      }
    };
    run();
  }, [checkAuth, loadTheme]);

  if (Platform.OS === 'web' && !mounted) {
    return (
      <View style={styles.ssrShell} testID="ssr-shell">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.container}>
        <ErrorBoundary>
          <View style={styles.flex1}>
            <RootLayoutNav />
            {!isInitialized && (
              <View style={styles.loadingOverlay} testID="app-loading-overlay">
                <ActivityIndicator size="large" color="#007AFF" />
              </View>
            )}
          </View>
        </ErrorBoundary>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  ssrShell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});