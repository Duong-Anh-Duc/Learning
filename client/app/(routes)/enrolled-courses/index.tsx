// frontend/screens/enrolled-courses/index.tsx
import CourseCard from "@/components/cards/course.card";
import useUser from "@/hooks/auth/useUser";
import { CoursesType } from "@/types/courses";
import { SERVER_URI } from "@/utils/uri";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { Toast } from "react-native-toast-notifications";

export default function EnrolledCoursesScreen() {
  const [courses, setCourses] = useState<CoursesType[]>([]);
  const [loader, setLoader] = useState(false);
  const { loading, user, refreshUser } = useUser();

  useEffect(() => {
    // Chỉ gọi refreshUser một lần khi component mount
    refreshUser();
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user || loading) return; // Chờ user được tải xong
      try {
        setLoader(true);
        const response = await axios.get(`${SERVER_URI}/get-courses`);
        const fetchedCourses: CoursesType[] = response.data.courses || [];
        const data = fetchedCourses.filter((i: CoursesType) =>
          user?.courses?.some((d: any) => d.courseId === i._id)
        );
        setCourses(data);
      } catch (error: any) {
        console.error("Lỗi khi lấy danh sách khóa học:", error);
        Toast.show("Không thể lấy danh sách khóa học. Vui lòng thử lại sau.", { type: "danger" });
      } finally {
        setLoader(false);
      }
    };

    fetchCourses();
  }, [user, loading]); // Dependency là user và loading

  if (loader || loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#009990" />
        <Text style={{ marginTop: 10, fontSize: 16, color: "#333" }}>
          Đang tải...
        </Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#009990", "#F6F7F9"]} style={{ flex: 1 }}>
      <FlatList
        data={courses}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item._id.toString()}
        renderItem={({ item }) => <CourseCard item={item} />}
        ListEmptyComponent={() => (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontSize: 16, color: "#333" }}>
              Bạn chưa đăng ký khóa học nào!
            </Text>
          </View>
        )}
      />
    </LinearGradient>
  );
}