// app/(admin)/manage-courses/index.tsx
import { useNavigation } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";

export default function ManageCourses() {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      title: "Quản Lý Khóa Học",
    });
  }, [navigation]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Manage Courses Screen (To be implemented)</Text>
    </View>
  );
}