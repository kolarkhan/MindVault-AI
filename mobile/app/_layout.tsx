import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";

import { queryClient } from "@/services/queryClient";
import { useAppStore } from "@/store/appStore";
import { useAuthStore } from "@/store/authStore";

SplashScreen.preventAutoHideAsync().catch(() => {
  /* no-op: fine if this races with a fast reload */
});

export default function RootLayout() {
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateApp = useAppStore((s) => s.hydrate);
  const [ready, setReady] = useState(false);
  const scheme = useColorScheme();

  useEffect(() => {
    Promise.all([hydrateAuth(), hydrateApp()]).finally(() => setReady(true));
  }, [hydrateAuth, hydrateApp]);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="memory/create" options={{ presentation: "modal" }} />
          <Stack.Screen name="memory/processing" options={{ presentation: "modal", gestureEnabled: false }} />
          <Stack.Screen name="memory/confirm" options={{ presentation: "modal" }} />
          <Stack.Screen name="memory/[id]" />
          <Stack.Screen name="categories/index" />
          <Stack.Screen name="profile" />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
