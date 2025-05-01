// frontend/app/_layout.tsx
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from "@expo-google-fonts/nunito";
import { Raleway_700Bold } from "@expo-google-fonts/raleway";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { ActivityIndicator, LogBox, Text, View } from "react-native";
import "react-native-reanimated";
import { ToastProvider } from "react-native-toast-notifications"; // Thêm import
import { CartProvider } from "../context/CartContext";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    LogBox.ignoreAllLogs(true);
  }, []);

  if (!loaded && !error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#009990" />
        <Text style={{ marginTop: 10, fontSize: 16, color: "#333" }}>
          Đang tải font...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
        <Text style={{ fontSize: 16, color: "red", textAlign: "center" }}>
          Lỗi khi tải font: {error.message}
        </Text>
      </View>
    );
  }

  return (
    <ToastProvider>
      <CartProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(routes)/welcome-intro/index" />
          <Stack.Screen name="(routes)/login/index" />
          <Stack.Screen name="(routes)/sign-up/index" />
          <Stack.Screen name="(routes)/forgot-password/index" />
          <Stack.Screen name="(routes)/verify-reset-password/index" />
          <Stack.Screen name="(routes)/verifyAccount/index" />
          <Stack.Screen
            name="(routes)/course-details/index"
            options={{
              headerShown: true,
              title: "Chi Tiết Khóa Học",
              headerBackTitle: "Quay Lại",
            }}
          />
          <Stack.Screen
            name="(routes)/cart/index"
            options={{
              headerShown: true,
              title: "Giỏ Hàng",
              headerBackTitle: "Quay Lại",
            }}
          />
          <Stack.Screen
            name="(routes)/profile-details/index"
            options={{
              headerShown: true,
              title: "Chi Tiết Hồ Sơ",
              headerBackTitle: "Quay Lại",
            }}
          />
          <Stack.Screen
            name="(routes)/course-access/index"
            options={{
              headerShown: true,
              title: "Bài Giảng Khóa Học",
              headerBackTitle: "Quay Lại",
            }}
          />
          <Stack.Screen
            name="(routes)/enrolled-courses/index"
            options={{
              headerShown: true,
              title: "Khóa Học Đã Đăng Ký",
              headerBackTitle: "Quay Lại",
            }}
          />
        </Stack>
      </CartProvider>
    </ToastProvider>
  );
}