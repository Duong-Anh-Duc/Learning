import CustomHeader from "@/components/CustomHeader";
import { dashboardStyles } from "@/styles/dashboard/dashboard.styles";
import { theme } from "@/styles/theme";
import api from "@/utils/api";
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Raleway_700Bold, useFonts } from '@expo-google-fonts/raleway';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { Link, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

interface CoursesType {
  _id: string;
  name: string;
  description: string;
  categories: string;
  price: number;
  estimatedPrice?: number;
  thumbnail: {
    public_id: string | any;
    url: string | any;
  };
  tags: string;
  level: string;
  demoUrl: string;
  benefits: { title: string }[];
  prerequisites: { title: string }[];
  reviews: any[];
  courseData: any[];
  ratings?: number;
  purchased: number;
  isHidden: boolean;
}

const CourseManagementScreen = () => {
  const [courses, setCourses] = useState<CoursesType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get("/get-admin-courses");
      setCourses(response.data.courses || []);
    } catch (error: any) {
      console.error("Lỗi khi tải danh sách khóa học:", error);
      Toast.show(error.response?.data?.message || "Không thể tải danh sách khóa học!", { type: "danger" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleHideCourse = async (courseId: string, isHidden: boolean) => {
    try {
      await api.put(`/hide-course/${courseId}`, { isHidden: !isHidden });
      setCourses(courses.map((course) =>
        course._id === courseId ? { ...course, isHidden: !isHidden } : course
      ));
      Toast.show(isHidden ? "Hiện khóa học thành công!" : "Ẩn khóa học thành công!", { type: "success" });
    } catch (error: any) {
      console.error("Lỗi khi cập nhật trạng thái khóa học:", error);
      Toast.show(error.response?.data?.message || "Không thể cập nhật trạng thái khóa học!", { type: "danger" });
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa khóa học này? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          onPress: async () => {
            try {
              await api.delete(`/delete-course/${courseId}`);
              setCourses(courses.filter((course) => course._id !== courseId));
              Toast.show("Xóa khóa học thành công!", { type: "success" });
            } catch (error: any) {
              console.error("Lỗi khi xóa khóa học:", error);
              Toast.show(error.response?.data?.message || "Không thể xóa khóa học!", { type: "danger" });
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCourses();
  };

  return (
    <FontLoader>
      <SafeAreaView style={styles.safeArea}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <View style={styles.container}>
            <CustomHeader title="Quản Lý Khóa Học" navigation={navigation} />
            <View style={[dashboardStyles.container, styles.contentContainer]}>
              <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }]}>
                <Link href="/(admin)/create-course">
                  <Text style={styles.buttonText}>
                    Tạo Khóa Học Mới
                  </Text>
                </Link>
              </TouchableOpacity>
              <FlatList
                data={courses}
                keyExtractor={(item) => item._id}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.courseCard,
                      { backgroundColor: item.isHidden ? theme.colors.disabled : theme.colors.white },
                    ]}
                  >
                    <View style={styles.courseInfo}>
                      <Text style={styles.courseTitle}>
                        {item.name}
                      </Text>
                      <Text style={styles.courseDetails}>
                        Giá: {item.price.toFixed(2)} VNĐ | Học viên: {item.purchased}
                      </Text>
                    </View>
                    <View style={styles.courseActions}>
                      <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}>
                        <Link href={{ pathname: "/(admin)/manage-courses/course-details", params: { courseId: item._id } }}>
                          <Text style={styles.actionButtonText}>Xem</Text>
                        </Link>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}>
                        <Link href={{ pathname: "/(admin)/edit-course", params: { courseId: item._id } }}>
                          <Text style={styles.actionButtonText}>Sửa</Text>
                        </Link>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: item.isHidden ? theme.colors.success : theme.colors.disabled }]}
                        onPress={() => handleHideCourse(item._id, item.isHidden)}
                      >
                        <Text style={styles.actionButtonText}>{item.isHidden ? "Hiện" : "Ẩn"}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
                        onPress={() => handleDeleteCourse(item._id)}
                      >
                        <Text style={styles.actionButtonText}>Xóa</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    Không có khóa học nào để hiển thị.
                  </Text>
                }
              />
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
  button: {
    borderRadius: theme.borderRadius.medium,
    paddingVertical: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
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
  courseCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.medium,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.small,
    elevation: theme.elevation.small,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  courseInfo: {
    flex: 1,
    marginRight: theme.spacing.medium,
  },
  courseTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.body,
    color: theme.colors.text,
  },
  courseDetails: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.small,
  },
  courseActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  actionButton: {
    paddingVertical: theme.spacing.small,
    paddingHorizontal: theme.spacing.medium,
    borderRadius: theme.borderRadius.small,
    marginLeft: theme.spacing.small,
    marginBottom: theme.spacing.small,
  },
  actionButtonText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.caption,
    color: theme.colors.white,
  },
  emptyText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.body,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: theme.spacing.large,
  },
});

export default CourseManagementScreen;