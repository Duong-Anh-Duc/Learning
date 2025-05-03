// app/_layout.tsx
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import { ToastProvider } from "react-native-toast-notifications";
import { AuthProvider } from "../context/AuthContext";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ToastProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Nhóm các route thuộc (auth) */}
          <Stack.Screen name="(auth)" />

          {/* Nhóm các route thuộc (admin) */}
          <Stack.Screen name="(admin)" />
        </Stack>
      </AuthProvider>
    </ToastProvider>
  );
}