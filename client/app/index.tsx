import useUser from "@/hooks/auth/useUser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function TabsIndex() {
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    const checkUser = async () => {
      const token = await AsyncStorage.getItem("access_token");
      if (token) {
        setLoading(false);
      } else {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#009990" />
        <Text>Đang tải...</Text>
      </View>
    );
  }

  return <Redirect href={user ? "/(tabs)" : "/(routes)/onboarding"} />;
}