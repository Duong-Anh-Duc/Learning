import CustomHeader from "@/components/CustomHeader";
import { dashboardStyles } from "@/styles/dashboard/dashboard.styles";
import { theme } from "@/styles/theme";
import api from "@/utils/api";
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Raleway_700Bold, useFonts } from '@expo-google-fonts/raleway';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { Link, router, useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Toast } from "react-native-toast-notifications";

// Định nghĩa ParamList cho DrawerNavigator
type DrawerParamList = {
  dashboard: undefined;
  "manage-courses": undefined;
  "manage-courses/course-details": undefined;
  "manage-users": undefined;
  "manage-categories": undefined;
  "manage-orders": undefined;
  "manage-comments": undefined;
  "change-password": undefined;
  "create-course": undefined;
  "create-lesson": undefined;
  "edit-course": undefined;
  "edit-lesson": undefined;
  "enrolled-users": undefined;
};

interface User {
  _id: string;
  name: string;
  email: string;
  enrollmentDate: string;
}

const FontLoader = ({ children }: { children: React.ReactNode }) => {
  const [fontsLoaded, fontError] = useFonts({
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
};

const EnrolledUsersScreen = () => {
  const { courseId } = useLocalSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();

  useEffect(() => {
    const fetchEnrolledUsers = async () => {
      try {
        if (!courseId || typeof courseId !== "string") {
          throw new Error("ID khóa học không hợp lệ");
        }
        setLoading(true);
        const response = await api.get(`/enrolled-users/${courseId}`);
        if (!response.data.users) {
          throw new Error("Không tìm thấy danh sách người dùng");
        }
        setUsers(response.data.users);
      } catch (error: any) {
        console.error("Lỗi khi tải danh sách người dùng:", error);
        setError(error.response?.data?.message || "Không thể tải danh sách người dùng!");
        Toast.show(error.response?.data?.message || "Không thể tải danh sách người dùng!", { type: "danger" });
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchEnrolledUsers();
  }, [courseId]);

  return (
    <FontLoader>
      <SafeAreaView style={styles.safeArea}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : error ? (
          <View style={[dashboardStyles.container, styles.container]}>
            <CustomHeader title="Người Dùng Đăng Ký Khóa Học" navigation={navigation} />
            <Text style={styles.errorTitle}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.disabled, marginTop: theme.spacing.large }]}
              onPress={() => router.back()}
            >
              <Text style={styles.buttonText}>
                Quay Lại
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.container}>
            <CustomHeader title="Người Dùng Đăng Ký Khóa Học" navigation={navigation} />
            <View style={[dashboardStyles.container, styles.contentContainer]}>
              <FlatList
                data={users}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <View style={styles.userCard}>
                    <Text style={styles.userText}>
                      Tên: {item.name || "Không có tên"}
                    </Text>
                    <Text style={styles.userText}>
                      Email: {item.email || "Không có email"}
                    </Text>
                    <Text style={styles.userText}>
                      Ngày đăng ký: {item.enrollmentDate ? new Date(item.enrollmentDate).toLocaleDateString() : "Không có ngày"}
                    </Text>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    Không có người dùng nào đăng ký khóa học này.
                  </Text>
                }
                contentContainerStyle={{ paddingBottom: theme.spacing.large }}
              />
              <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.disabled, marginTop: theme.spacing.medium }]}>
                <Link href={{ pathname: "/(admin)/manage-courses/course-details", params: { courseId } }}>
                  <Text style={styles.buttonText}>
                    Quay Lại
                  </Text>
                </Link>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </FontLoader>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.medium,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  errorTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.h1,
    color: theme.colors.error,
    textAlign: "center",
    marginBottom: theme.spacing.large,
  },
  userCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
    elevation: theme.elevation.small,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  userText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.small,
  },
  emptyText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.body,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: theme.spacing.large,
  },
  button: {
    borderRadius: theme.borderRadius.medium,
    paddingVertical: theme.spacing.medium,
    elevation: theme.elevation.small,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: "center",
  },
  buttonText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.button,
    color: theme.colors.white,
  },
});

export default EnrolledUsersScreen;