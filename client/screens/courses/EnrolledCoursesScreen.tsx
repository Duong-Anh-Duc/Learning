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
        Toast.show("Không thể lấy danh sách khóa học. Vui lòng thử lại sau.", {
          type: "danger",
        });
      } finally {
        setLoader(false);
      }
    };

    fetchCourses();
}