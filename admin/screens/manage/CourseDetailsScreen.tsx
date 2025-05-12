import { dashboardStyles } from "@/styles/dashboard/dashboard.styles";
import api from "@/utils/api";
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from "@expo-google-fonts/nunito";
import { Raleway_700Bold, useFonts } from "@expo-google-fonts/raleway";
import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Toast } from "react-native-toast-notifications";

// Component wrapper để xử lý tải font
const FontLoader = ({ children }: { children: React.ReactNode }) => {
  const [fontsLoaded, fontError] = useFonts({
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#009990" />
        <Text style={{ marginTop: 10, fontSize: 16, color: "#333" }}>
          Đang tải font...
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};

const CourseDetailsScreen = () => {
  const { courseId } = useLocalSearchParams(); // Hook 1
  const [course, setCourse] = useState<any>(null); // Hook 2
  const [loading, setLoading] = useState(true); // Hook 3

  useEffect(() => {
    // Hook 4
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        if (typeof courseId !== "string" || !courseId) {
          throw new Error("ID khóa học không hợp lệ");
        }
        const response = await api.get(`/get-course/${courseId}`);
        setCourse(response.data.course);
      } catch (error: any) {
        console.error("Lỗi khi tải chi tiết khóa học:", error);
        Toast.show("Không thể tải chi tiết khóa học!", { type: "danger" });
      } finally {
        setLoading(false);
      }
    };
    fetchCourseDetails();
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
      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#009990" />
        </View>
      ) : !course ? (
        <View style={dashboardStyles.container}>
          <Text
            style={[
              dashboardStyles.welcomeText,
              { fontFamily: "Raleway_700Bold" },
            ]}
          >
            Không tìm thấy khóa học
          </Text>
        </View>
      ) : (
        <View style={dashboardStyles.container}>
          <Text
            style={[
              dashboardStyles.welcomeText,
              { fontFamily: "Raleway_700Bold" },
            ]}
          >
            Chi Tiết Khóa Học: {course.name}
          </Text>
          <Text style={{ fontFamily: "Nunito_400Regular", marginBottom: 10 }}>
            Mô tả: {course.description}
          </Text>
          <Text style={{ fontFamily: "Nunito_400Regular", marginBottom: 10 }}>
            Danh mục: {course.categories}
          </Text>
          <Text style={{ fontFamily: "Nunito_400Regular", marginBottom: 10 }}>
            Giá: {course.price} VND
          </Text>
          <Text style={{ fontFamily: "Nunito_400Regular", marginBottom: 10 }}>
            Trạng thái: {course.isHidden ? "Đã ẩn" : "Hiển thị"}
          </Text>
          <TouchableOpacity style={dashboardStyles.button}>
            <Link
              href={{
                pathname: "/(admin)/create-lesson",
                params: { courseId },
              }}
            >
              <Text
                style={[
                  dashboardStyles.buttonText,
                  { fontFamily: "Nunito_600SemiBold" },
                ]}
              >
                Thêm Bài Học
              </Text>
            </Link>
          </TouchableOpacity>
          <TouchableOpacity style={dashboardStyles.button}>
            <Link
              href={{
                pathname: "/(admin)/enrolled-users",
                params: { courseId },
              }}
            >
              <Text
                style={[
                  dashboardStyles.buttonText,
                  { fontFamily: "Nunito_600SemiBold" },
                ]}
              >
                Xem Người Dùng Đăng Ký
              </Text>
            </Link>
          </TouchableOpacity>
          <Text
            style={{
              fontFamily: "Nunito_700Bold",
              marginTop: 20,
              marginBottom: 10,
            }}
          >
            Danh Sách Bài Học
          </Text>
          <FlatList
            data={course.courseData}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  padding: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: "#ccc",
                  backgroundColor: item.isHidden ? "#f0f0f0" : "white",
                }}
              >
                <Text style={{ fontFamily: "Nunito_400Regular" }}>
                  {item.title}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TouchableOpacity
                    style={{
                      backgroundColor: "#009990",
                      padding: 5,
                      borderRadius: 5,
                      marginRight: 5,
                    }}
                  >
                    <Link
                      href={{
                        pathname: "/(admin)/edit-lesson",
                        params: { courseId, lessonId: item._id },
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontFamily: "Nunito_600SemiBold",
                        }}
                      >
                        Sửa
                      </Text>
                    </Link>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      backgroundColor: item.isHidden ? "green" : "gray",
                      padding: 5,
                      borderRadius: 5,
                    }}
                    onPress={() =>
                      handleHideLesson(item._id, item.isHidden || false)
                    }
                  >
                    <Text
                      style={{
                        color: "white",
                        fontFamily: "Nunito_600SemiBold",
                      }}
                    >
                      {item.isHidden ? "Hiện" : "Ẩn"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      )}
    </FontLoader>
  );
};

export default CourseDetailsScreen;
