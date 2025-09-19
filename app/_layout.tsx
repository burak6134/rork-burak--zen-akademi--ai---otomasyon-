import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

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

  useEffect(() => {
    const initializeApp = async () => {
      await Promise.all([
        checkAuth(),
        loadTheme(),
      ]);
      SplashScreen.hideAsync();
    };

    initializeApp();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootLayoutNav />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}