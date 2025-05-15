import CustomHeader from "@/components/CustomHeader";
import { dashboardStyles } from "@/styles/dashboard/dashboard.styles";
import { theme } from "@/styles/theme";
import api from "@/utils/api";
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from "@expo-google-fonts/nunito";
import { Raleway_700Bold, useFonts } from "@expo-google-fonts/raleway";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { Link, useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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

const CourseDetailsScreen = () => {
  const { courseId } = useLocalSearchParams();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();

  const fetchCourseDetails = async () => {
    try {
      if (typeof courseId !== "string" || !courseId) {
        throw new Error("ID khóa học không hợp lệ");
      }
      const response = await api.get(`/get-course/${courseId}`);
      setCourse(response.data.course);
    } catch (error: any) {
      console.error("Lỗi khi tải chi tiết khóa học:", error);
      Toast.show("Không thể tải chi tiết khóa học!", { type: "danger" });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchCourseDetails();
    } catch (error) {
      console.error("Lỗi khi làm mới dữ liệu:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchCourseDetails();
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [courseId]);

  const handleHideLesson = async (contentId: string, isHidden: boolean) => {
    try {
      await api.put(`/hide-lesson/${courseId}`, {
        contentId,
        isHidden: !isHidden,
      });
      setCourse({
        ...course,
        courseData: course.courseData.map((content: any) =>
          content._id === contentId
            ? { ...content, isHidden: !isHidden }
            : content
        ),
      });
      Toast.show(
        isHidden ? "Hiện bài học thành công!" : "Ẩn bài học thành công!",
        { type: "success" }
      );
    } catch (error: any) {
      console.error("Lỗi khi cập nhật trạng thái bài học:", error);
      Toast.show("Không thể cập nhật trạng thái bài học!", { type: "danger" });
    }
  };

  return (
    <FontLoader>
      <SafeAreaView style={styles.safeArea}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : !course ? (
          <View style={[dashboardStyles.container, styles.container]}>
            <CustomHeader title="Chi Tiết Khóa Học" navigation={navigation} />
            <Text style={styles.errorTitle}>Không tìm thấy khóa học</Text>
          </View>
        ) : (
          <View style={styles.container}>
            <CustomHeader
              title={`Chi Tiết Khóa Học: ${course.name}`}
              navigation={navigation}
            />
            <View style={[dashboardStyles.container, styles.contentContainer]}>
              <View style={styles.infoCard}>
                <Text style={styles.infoText}>Mô tả: {course.description}</Text>
                <Text style={styles.infoText}>
                  Danh mục: {course.categories}
                </Text>
                <Text style={styles.infoText}>Giá: {course.price} VNĐ</Text>
                <Text
                  style={[
                    styles.infoText,
                    {
                      color: course.isHidden
                        ? theme.colors.error
                        : theme.colors.success,
                    },
                  ]}
                >
                  Trạng thái: {course.isHidden ? "Đã ẩn" : "Hiển thị"}
                </Text>
              </View>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    { backgroundColor: theme.colors.primary },
                  ]}
                >
                  <Link
                    href={{
                      pathname: "/(admin)/create-lesson",
                      params: { courseId },
                    }}
                  >
                    <Text style={styles.buttonText}>Thêm Bài Học</Text>
                  </Link>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    { backgroundColor: theme.colors.secondary },
                  ]}
                >
                  <Link
                    href={{
                      pathname: "/(admin)/enrolled-users",
                      params: { courseId },
                    }}
                  >
                    <Text style={styles.buttonText}>
                      Xem Người Dùng Đăng Ký
                    </Text>
                  </Link>
                </TouchableOpacity>
              </View>
              <Text style={styles.sectionTitle}>Danh Sách Bài Học</Text>
              <FlatList
                data={course.courseData}
                keyExtractor={(item) => item._id}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[theme.colors.primary]}
                    tintColor={theme.colors.primary}
                  />
                }
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.lessonCard,
                      {
                        backgroundColor: item.isHidden
                          ? theme.colors.disabled
                          : theme.colors.white,
                      },
                    ]}
                  >
                    <Text style={styles.lessonText}>{item.title}</Text>
                    <View style={styles.lessonActions}>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          { backgroundColor: theme.colors.primary },
                        ]}
                      >
                        <Link
                          href={{
                            pathname: "/(admin)/edit-lesson",
                            params: { courseId, lessonId: item._id },
                          }}
                        >
                          <Text style={styles.actionButtonText}>Sửa</Text>
                        </Link>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          {
                            backgroundColor: item.isHidden
                              ? theme.colors.success
                              : theme.colors.disabled,
                          },
                        ]}
                        onPress={() =>
                          handleHideLesson(item._id, item.isHidden || false)
                        }
                      >
                        <Text style={styles.actionButtonText}>
                          {item.isHidden ? "Hiện" : "Ẩn"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    Không có bài học nào để hiển thị.
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
  errorTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.h1,
    color: theme.colors.error,
    textAlign: "center",
  },
  infoCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.large,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
    elevation: theme.elevation.medium,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.body,
    color: theme.colors.text,
    marginBottom: theme.spacing.small,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.medium,
  },
  button: {
    flex: 1,
    borderRadius: theme.borderRadius.medium,
    paddingVertical: theme.spacing.medium,
    marginHorizontal: theme.spacing.small,
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
  sectionTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.h2,
    color: theme.colors.primary,
    marginVertical: theme.spacing.medium,
  },
  lessonCard: {
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
  lessonText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.body,
    color: theme.colors.text,
    flex: 1,
  },
  lessonActions: {
    flexDirection: "row",
  },
  actionButton: {
    paddingVertical: theme.spacing.small,
    paddingHorizontal: theme.spacing.medium,
    borderRadius: theme.borderRadius.small,
    marginLeft: theme.spacing.small,
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

export default CourseDetailsScreen;
