// app/(admin)/_layout.tsx
import { Stack } from "expo-router";
import AdminNavbar from "../../components/AdminNavbar";

export default function AdminLayout() {
  return (
    <>
      <AdminNavbar />
      <Stack
        screenOptions={{
          headerShown: true,
          headerBackTitle: "Quay Lại",
          headerStyle: { backgroundColor: "#009990" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
    </>
  );
}