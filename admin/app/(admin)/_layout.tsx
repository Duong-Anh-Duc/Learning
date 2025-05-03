// app/(admin)/_layout.tsx
import { Stack } from "expo-router";

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: "Quay Lại",
        title: "", // Tiêu đề mặc định, sẽ được override bởi từng route nếu cần
      }}
    />
  );
}