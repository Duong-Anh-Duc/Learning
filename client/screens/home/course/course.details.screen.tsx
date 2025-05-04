// frontend/screens/home/course/course.details.screen.tsx
import ReviewCard from "@/components/cards/review.card";
import CourseLesson from "@/components/courses/course.lesson";
import { useCart } from "@/context/CartContext";
import useUser from "@/hooks/auth/useUser";
import { SERVER_URI } from "@/utils/uri";
import {
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from "@expo-google-fonts/nunito";
import {
  Raleway_600SemiBold,
  Raleway_700Bold,
  useFonts,
} from "@expo-google-fonts/raleway";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Toast } from "react-native-toast-notifications";

// Định nghĩa các kiểu tại đây
interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: {
    public_id: string;
    url: string;
  };
}

interface ReviewType {
  user: User;
  rating?: number;
  comment: string;
  commentReplies?: ReviewType[];
}

interface PrerequisiteType {
  title: string;
}

interface BenefitType {
  title: string;
}

interface CommentType {
  _id: string;
  user: User;
  question: string;
  questionReplies: CommentType[];
}

interface LinkType {
  title: string;
  url: string;
}

interface CourseDataType {
  _id: string | any;
  title: string;
  description: string;
  videoUrl: string;
  videoThumbnail: object;
  videoSection: string;
  videoLength: number;
  videoPlayer: string;
  links: LinkType[];
  suggestion: string;
  questions: CommentType[];
}

interface CoursesType {
  _id: any;
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
  benefits: BenefitType[];
  prerequisites: PrerequisiteType[];
  reviews: ReviewType[];
  courseData: CourseDataType[];
  ratings?: number;
  purchased: number;
}

export default function CourseDetailScreen() {
  const [activeButton, setActiveButton] = useState("Về Khóa Học");
  const { user, loading: userLoading, error: userError, refreshUser } = useUser();
  const [isExpanded, setIsExpanded] = useState(false);
  const { courseId } = useLocalSearchParams();
  const [courseData, setCourseData] = useState<CoursesType | null>(null);
  const [checkPurchased, setCheckPurchased] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart, removeFromCart, cartItems, errorMessage, clearError } = useCart();

  // Kiểm tra xem khóa học đã có trong giỏ hàng chưa
  const isCourseInCart = cartItems.some((item) => item.courseId === courseId);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setIsLoading(true);
        if (typeof courseId !== "string" || !courseId) {
          throw new Error("ID khóa học không hợp lệ");
        }

        const response = await axios.get(`${SERVER_URI}/get-course/${courseId}`);
        const fetchedCourse: CoursesType = response.data.course;
        setCourseData(fetchedCourse);
        await refreshUser();
      } catch (error: any) {
        console.error("Lỗi khi tải dữ liệu khóa học:", error);
        Toast.show("Không thể tải thông tin khóa học", { type: "danger" });
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  useEffect(() => {
    if (courseData && user?.courses?.find((i: any) => i.courseId === courseData?._id)) {
      setCheckPurchased(true);
    }
  }, [user, courseData]);

  const handleAddToCart = async () => {
    if (!courseData) return;
    try {
      await addToCart(courseData);
      if (!errorMessage) {
        Toast.show("Thêm sản phẩm vào giỏ hàng thành công!", {
          type: "success",
          placement: "top",
          duration: 3000,
        });
      }
    } catch (error: any) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
    }
  };

  const handleRemoveFromCart = async () => {
    if (!courseId) return;
    try {
      await removeFromCart(courseId as string);
      Toast.show("Đã xóa sản phẩm khỏi giỏ hàng!", {
        type: "success",
        placement: "top",
        duration: 3000,
      });
      clearError();
    } catch (error: any) {
      console.error("Lỗi khi xóa khỏi giỏ hàng:", error);
      Toast.show("Không thể xóa sản phẩm khỏi giỏ hàng", {
        type: "warning",
        placement: "top",
        duration: 3000,
      });
    }
  };

  const handleAccessCourse = async () => {
    if (!courseData) return;
    if (!checkPurchased) {
      Toast.show("Bạn chưa mua khóa học này!", { type: "warning" });
      return;
    }

    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      if (!accessToken || !refreshToken) {
        Toast.show("Vui lòng đăng nhập để truy cập khóa học", { type: "warning" });
        router.push("/(routes)/login");
        return;
      }

      await axios.get(`${SERVER_URI}/get-course-content/${courseData._id}`, {
        headers: {
          "access-token": accessToken,
          "refresh-token": refreshToken,
        },
      });

      router.push({
        pathname: "/(routes)/course-access",
        params: { courseId: courseData._id },
      });
    } catch (error: any) {
      console.error("Lỗi khi truy cập khóa học:", error);
      if (error.response?.status === 401) {
        Toast.show("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.", { type: "warning" });
        await AsyncStorage.removeItem("access_token");
        await AsyncStorage.removeItem("refresh_token");
        router.push("/(routes)/login");
      } else {
        Toast.show("Bạn không có quyền truy cập khóa học này", { type: "danger" });
      }
    }
  };

  let [fontsLoaded, fontError] = useFonts({
    Raleway_600SemiBold,
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_700Bold,
    Nunito_600SemiBold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (isLoading || userLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#009990" />
        <Text style={{ marginTop: 10, fontSize: 16, color: "#333" }}>
          Đang tải...
        </Text>
      </View>
    );
  }

  if (!courseData) {
    return null;
  }

  return (
    <LinearGradient
      colors={["#009990", "#F6F7F9"]}
      style={{ flex: 1, paddingTop: 15 }}
    >
      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity onPress={clearError} style={styles.clearErrorButton}>
            <Ionicons name="close-circle" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ marginHorizontal: 16 }}>
          <View
            style={{
              position: "absolute",
              zIndex: 1,
              backgroundColor: "#FFB013",
              borderRadius: 54,
              paddingVertical: 8,
              paddingHorizontal: 12,
              marginTop: 8,
              marginLeft: 8,
            }}
          >
            <Text
              style={{
                color: "black",
                fontSize: 14,
                fontFamily: "Nunito_600SemiBold",
              }}
            >
              Bán Chạy Nhất
            </Text>
          </View>
          <View style={{ position: "absolute", zIndex: 14, right: 0 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#141517",
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 3,
                marginTop: 8,
                marginRight: 8,
              }}
            >
              <FontAwesome name="star" size={14} color={"#FFB800"} />
              <Text
                style={{
                  color: "white",
                  marginLeft: 4,
                  fontFamily: "Nunito_600SemiBold",
                }}
              >
                {courseData?.ratings ?? 0}
              </Text>
            </View>
          </View>
          <Image
            source={{ uri: courseData?.thumbnail.url || "https://via.placeholder.com/230" }}
            style={{ width: "100%", height: 230, borderRadius: 6 }}
          />
        </View>
        <Text
          style={{
            marginHorizontal: 16,
            marginTop: 15,
            fontSize: 20,
            fontWeight: "600",
            fontFamily: "Raleway_700Bold",
          }}
        >
          {courseData?.name ?? "Khóa học không xác định"}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingRight: 10,
            paddingTop: 5,
          }}
        >
          <View style={{ flexDirection: "row" }}>
            <Text
              style={{
                color: "#000",
                fontSize: 22,
                marginLeft: 10,
                paddingVertical: 10,
              }}
            >
              {courseData?.price?.toFixed(2) ?? "0"} VNĐ
            </Text>
            <Text
              style={{
                color: "#808080",
                fontSize: 20,
                marginLeft: 10,
                textDecorationLine: "line-through",
              }}
            >
              {courseData?.estimatedPrice?.toFixed(2) ?? "0"} VNĐ
            </Text>
          </View>
          <Text style={{ fontSize: 15 }}>
            {courseData?.purchased ?? 0} học viên
          </Text>
        </View>
        <View style={{ padding: 10 }}>
          <Text style={{ fontSize: 20, fontWeight: "600" }}>
            Điều Kiện Tiên Quyết Của Khóa Học
          </Text>
          {courseData?.prerequisites?.length > 0 ? (
            courseData.prerequisites.map((item: PrerequisiteType, index: number) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  width: "95%",
                  paddingVertical: 5,
                }}
              >
                <Ionicons name="checkmark-done-outline" size={18} />
                <Text style={{ paddingLeft: 5, fontSize: 16 }}>
                  {item.title}
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 16, color: "#575757" }}>
              Không có điều kiện tiên quyết
            </Text>
          )}
        </View>
        <View style={{ padding: 10 }}>
          <Text style={{ fontSize: 20, fontWeight: "600" }}>
            Lợi Ích Của Khóa Học
          </Text>
          {courseData?.benefits?.length > 0 ? (
            courseData.benefits.map((item: BenefitType, index: number) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  width: "95%",
                  paddingVertical: 5,
                }}
              >
                <Ionicons name="checkmark-done-outline" size={18} />
                <Text style={{ paddingLeft: 5, fontSize: 16 }}>
                  {item.title}
                </Text>
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 16, color: "#575757" }}>
              Không có lợi ích được liệt kê
            </Text>
          )}
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            marginTop: 25,
            marginHorizontal: 16,
            backgroundColor: "#E1E9F8",
            borderRadius: 50,
          }}
        >
          <TouchableOpacity
            style={{
              paddingVertical: 10,
              paddingHorizontal: 42,
              backgroundColor:
                activeButton === "Về Khóa Học" ? "#009990" : "transparent",
              borderRadius: activeButton === "Về Khóa Học" ? 50 : 0,
            }}
            onPress={() => setActiveButton("Về Khóa Học")}
          >
            <Text
              style={{
                color: activeButton === "Về Khóa Học" ? "#fff" : "#000",
                fontFamily: "Nunito_600SemiBold",
              }}
            >
              Về Khóa Học
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              paddingVertical: 10,
              paddingHorizontal: 42,
              backgroundColor:
                activeButton === "Bài Giảng" ? "#009990" : "transparent",
              borderRadius: activeButton === "Bài Giảng" ? 50 : 0,
            }}
            onPress={() => setActiveButton("Bài Giảng")}
          >
            <Text
              style={{
                color: activeButton === "Bài Giảng" ? "#fff" : "#000",
                fontFamily: "Nunito_600SemiBold",
              }}
            >
              Bài Giảng
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              paddingVertical: 10,
              paddingHorizontal: 42,
              backgroundColor:
                activeButton === "Đánh Giá" ? "#009990" : "transparent",
              borderRadius: activeButton === "Đánh Giá" ? 50 : 0,
            }}
            onPress={() => setActiveButton("Đánh Giá")}
          >
            <Text
              style={{
                color: activeButton === "Đánh Giá" ? "#fff" : "#000",
                fontFamily: "Nunito_600SemiBold",
              }}
            >
              Đánh Giá
            </Text>
          </TouchableOpacity>
        </View>
        {activeButton === "Về Khóa Học" && (
          <View
            style={{
              marginHorizontal: 16,
              marginVertical: 25,
              paddingHorizontal: 10,
            }}
          >
            <Text style={{ fontSize: 18, fontFamily: "Raleway_700Bold" }}>
              Về khóa học
            </Text>
            <Text
              style={{
                color: "#525258",
                fontSize: 16,
                marginTop: 10,
                textAlign: "justify",
                fontFamily: "Nunito_500Medium",
              }}
            >
              {isExpanded
                ? courseData?.description || "Không có mô tả"
                : courseData?.description.slice(0, 302) || "Không có mô tả"}
            </Text>
            {courseData?.description?.length > 302 && (
              <TouchableOpacity
                style={{ marginTop: 3 }}
                onPress={() => setIsExpanded(!isExpanded)}
              >
                <Text
                  style={{
                    color: "#009990",
                    fontSize: 14,
                  }}
                >
                  {isExpanded ? "Thu gọn" : "Xem thêm"}
                  {isExpanded ? "-" : "+"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {activeButton === "Bài Giảng" && (
          <View style={{ marginHorizontal: 16, marginVertical: 25 }}>
            <CourseLesson courseDetails={courseData} />
          </View>
        )}
        {activeButton === "Đánh Giá" && (
          <View style={{ marginHorizontal: 16, marginVertical: 25 }}>
            <View style={{ rowGap: 25 }}>
              {courseData?.reviews?.length > 0 ? (
                courseData.reviews.map((item: ReviewType, index: number) => (
                  <ReviewCard item={item} key={index} />
                ))
              ) : (
                <Text style={{ fontSize: 16, color: "#575757" }}>
                  Chưa có đánh giá nào
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>
      <View
        style={{
          backgroundColor: "#FFFF",
          marginHorizontal: 16,
          paddingVertical: 11,
          marginBottom: 10,
        }}
      >
        {checkPurchased ? (
          <TouchableOpacity
            style={{
              backgroundColor: "#009990",
              paddingVertical: 16,
              borderRadius: 4,
            }}
            onPress={handleAccessCourse}
          >
            <Text
              style={{
                textAlign: "center",
                color: "#FFFF",
                fontSize: 16,
                fontFamily: "Nunito_600SemiBold",
              }}
            >
              Truy cập khóa học
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={{
              backgroundColor: isCourseInCart ? "#FF6347" : "#009990", // Đổi màu nút: đỏ nếu đã có, xanh nếu chưa có
              paddingVertical: 16,
              borderRadius: 4,
            }}
            onPress={isCourseInCart ? handleRemoveFromCart : handleAddToCart}
          >
            <Text
              style={{
                textAlign: "center",
                color: "#FFFF",
                fontSize: 16,
                fontFamily: "Nunito_600SemiBold",
              }}
            >
              {isCourseInCart ? "Xóa khỏi giỏ hàng" : "Thêm vào giỏ hàng"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: "#FF6347",
    padding: 10,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 1000,
  },
  errorText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
  },
  clearErrorButton: {
    padding: 5,
  },
});