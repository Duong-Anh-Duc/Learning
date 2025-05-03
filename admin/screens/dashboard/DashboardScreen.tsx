// app/(admin)/dashboard/index.tsx
import { useAuth } from '@/context/AuthContext';
import { dashboardStyles } from '@/styles/dashboard/dashboard.styles';
import api from '@/utils/api';
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Raleway_700Bold, useFonts } from '@expo-google-fonts/raleway';
import { router, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Toast } from 'react-native-toast-notifications';

const DashboardScreen = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  let [fontsLoaded, fontError] = useFonts({
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    navigation.setOptions({
      title: "Admin Dashboard",
    });
  }, [navigation]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [usersRes, coursesRes] = await Promise.all([
          api.get("/users/count"),
          api.get("/courses/count"),
        ]);
        setStats({
          totalUsers: usersRes.data.count || 0,
          totalCourses: coursesRes.data.count || 0,
        });
      } catch (error: any) {
        Toast.show("Không thể tải dữ liệu thống kê!", {
          type: "danger",
          placement: "top",
          duration: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    } else {
      router.replace("/(auth)/login");
    }
  }, [user]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#009990" />
      </View>
    );
  }

  const handleLogout = async () => {
    await logout();
    Toast.show("Đăng xuất thành công!", {
      type: "success",
      placement: "top",
      duration: 3000,
    });
    router.replace("/(auth)/login");
  };

  return (
    <ScrollView style={dashboardStyles.container}>
      <Text style={[dashboardStyles.welcomeText, { fontFamily: "Raleway_700Bold" }]}>
        Chào mừng, {user?.email}!
      </Text>
      <View style={dashboardStyles.card}>
        <Text style={[dashboardStyles.cardTitle, { fontFamily: "Nunito_700Bold" }]}>
          Tổng số người dùng
        </Text>
        <Text style={[dashboardStyles.cardValue, { fontFamily: "Nunito_600SemiBold" }]}>
          {stats.totalUsers}
        </Text>
      </View>
      <View style={dashboardStyles.card}>
        <Text style={[dashboardStyles.cardTitle, { fontFamily: "Nunito_700Bold" }]}>
          Tổng số khóa học
        </Text>
        <Text style={[dashboardStyles.cardValue, { fontFamily: "Nunito_600SemiBold" }]}>
          {stats.totalCourses}
        </Text>
      </View>
      <TouchableOpacity
        style={dashboardStyles.button}
        onPress={() => router.push("/(admin)/manage-courses")}
      >
        <Text style={[dashboardStyles.buttonText, { fontFamily: "Nunito_600SemiBold" }]}>
          Quản Lý Khóa Học
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={dashboardStyles.button}
        onPress={() => router.push("/(admin)/manage-users")}
      >
        <Text style={[dashboardStyles.buttonText, { fontFamily: "Nunito_600SemiBold" }]}>
          Quản Lý Người Dùng
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={dashboardStyles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={[dashboardStyles.buttonText, { fontFamily: "Nunito_600SemiBold" }]}>
          Đăng Xuất
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default DashboardScreen;