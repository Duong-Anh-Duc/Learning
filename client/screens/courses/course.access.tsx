// frontend/app/(routes)/course-access/index.tsx
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from "react-native";
import React, { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import axios from "axios";
import { SERVER_URI } from "@/utils/uri";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";
import useUser from "@/hooks/auth/useUser";
import { Toast } from "react-native-toast-notifications";
import ReviewCard from "@/components/cards/review.card";
import { CoursesType, CourseDataType, ReviewType } from "@/types/courses";
import { widthPercentageToDP } from "react-native-responsive-screen";

export default function CourseAccessScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const { courseId } = useLocalSearchParams();
  const [courseData, setCourseData] = useState<CoursesType | null>(null);
  const [courseContentData, setCourseContentData] = useState<CourseDataType[]>([]);
  const [activeButton, setActiveButton] = useState("Về Khóa Học");
  const [isExpanded, setIsExpanded] = useState(false);
  const [rating, setRating] = useState(1);
  const [review, setReview] = useState("");
  const [reviewAvailable, setReviewAvailable] = useState(false);

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
    const subscription = async () => {
      if (!courseData) return;
      await fetchCourseContent();
      const isReviewAvailable = courseData?.reviews?.find(
        (i: ReviewType) => i.user._id === user?._id
      );
      if (isReviewAvailable) {
        setReviewAvailable(true);
      }
    };
    subscription();
  }, [courseData, user]);

  const fetchCourseContent = async () => {
    if (!courseData) return;
    const accessToken = await AsyncStorage.getItem("access_token");
    const refreshToken = await AsyncStorage.getItem("refresh_token");
    try {
      const res = await axios.get(`${SERVER_URI}/get-course-content/${courseData._id}`, {
        headers: {
          "access-token": accessToken,
          "refresh-token": refreshToken,
        },
      });
      const content = res.data.content || [];
      const validContent = content.map((item: CourseDataType) => ({
        ...item,
        videoUrl: item.videoUrl && isValidUrl(item.videoUrl) ? item.videoUrl : "",
      }));
      setCourseContentData(validContent);
    } catch (error) {
      setIsLoading(false);
      Toast.show("Không thể tải nội dung khóa học", { type: "danger" });
      router.push({
        pathname: "/(routes)/course-details",
        params: { courseId: courseData._id },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleReviewSubmit = async () => {
    if (!courseData || !courseData._id) {
      Toast.show("Không tìm thấy ID khóa học", { type: "danger" });
      return;
    }

    const isPurchased = user?.courses?.find((course: any) => course.courseId === courseData._id);
    if (!isPurchased) {
      Toast.show("Bạn chưa mua khóa học này, không thể gửi đánh giá", { type: "warning" });
      return;
    }

    const accessToken = await AsyncStorage.getItem("access_token");
    const refreshToken = await AsyncStorage.getItem("refresh_token");

    if (!accessToken || !refreshToken) {
      Toast.show("Vui lòng đăng nhập để gửi đánh giá", { type: "warning" });
      router.push("/(routes)/login");
      return;
    }

    try {
      await axios.put(
        `${SERVER_URI}/add-review/${courseData._id}`,
        {
          review,
          rating,
        },
        {
          headers: {
            "access-token": accessToken,
            "refresh-token": refreshToken,
          },
        }
      );
      setRating(1);
      setReview("");
      Toast.show("Gửi đánh giá thành công!", { type: "success" });
      router.push({
        pathname: "/(routes)/course-details",
        params: { courseId: courseData._id },
      });
    } catch (error: any) {
      console.error("Lỗi khi gửi đánh giá:", error);
      Toast.show(
        error.response?.data?.message || "Không thể gửi đánh giá, vui lòng thử lại",
        { type: "danger" }
      );
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => setRating(i)}>
          <FontAwesome
            name={i <= rating ? "star" : "star-o"}
            size={25}
            color={"#FF8D07"}
            style={{ marginHorizontal: 4 }}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const renderLessonItem = ({ item, index }: { item: CourseDataType; index: number }) => (
    <TouchableOpacity
      style={styles.lessonItem}
      onPress={() =>
        router.push({
          pathname: "/(routes)/lesson",
          params: { courseId: courseData?._id, lessonId: item._id, lessonIndex: index },
        })
      }
    >
      <Text style={styles.lessonNumber}>{index + 1}.</Text>
      <Text style={styles.lessonTitle}>{item.title || "Không có tiêu đề"}</Text>
    </TouchableOpacity>
  );

  if (isLoading || !courseData || !courseContentData) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ fontSize: 18, fontFamily: "Nunito_700Bold" }}>
          Đang tải...
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={[1]}
      keyExtractor={() => "course-access"}
      renderItem={() => null}
      ListHeaderComponent={
        <>
          {/* Danh sách bài học */}
          <View style={styles.lessonListContainer}>
            <Text style={styles.lessonListTitle}>Danh sách bài học</Text>
            {courseContentData.map((item, index) => (
              <TouchableOpacity
                key={item._id?.toString() || index.toString()}
                style={styles.lessonItem}
                onPress={() =>
                  router.push({
                    pathname: "/(routes)/lesson",
                    params: { courseId: courseData?._id, lessonId: item._id, lessonIndex: index },
                  })
                }
              >
                <Text style={styles.lessonNumber}>{index + 1}.</Text>
                <Text style={styles.lessonTitle}>{item.title || "Không có tiêu đề"}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabContainer}
          >
            {["Về Khóa Học", "Đánh Giá"].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabButton,
                  activeButton === tab && styles.activeTabButton,
                ]}
                onPress={() => setActiveButton(tab)}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    activeButton === tab && styles.activeTabButtonText,
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      }
      ListFooterComponent={
        <>
          {activeButton === "Về Khóa Học" && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Về khóa học</Text>
              <Text style={styles.description}>
                {isExpanded
                  ? courseData?.description || "Không có mô tả"
                  : courseData?.description.slice(0, 302) || "Không có mô tả"}
              </Text>
              {courseData?.description?.length > 302 && (
                <TouchableOpacity
                  style={styles.expandButton}
                  onPress={() => setIsExpanded(!isExpanded)}
                >
                  <Text style={styles.expandButtonText}>
                    {isExpanded ? "Thu gọn" : "Xem thêm"}
                    {isExpanded ? " -" : " +"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {activeButton === "Đánh Giá" && (
            <View style={styles.tabContent}>
              {!reviewAvailable && (
                <View>
                  <View style={styles.ratingContainer}>
                    <Text style={styles.ratingLabel}>Đánh giá:</Text>
                    <View style={styles.starsContainer}>{renderStars()}</View>
                  </View>
                  <TextInput
                    value={review}
                    onChangeText={setReview}
                    placeholder="Viết một đánh giá..."
                    style={styles.textInput}
                    multiline={true}
                  />
                  <View style={styles.submitButtonContainer}>
                    <TouchableOpacity
                      style={[styles.button, review === "" && styles.disabledButton]}
                      disabled={review === ""}
                      onPress={() => handleReviewSubmit()}
                    >
                      <Text style={styles.buttonText}>Gửi</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {courseData?.reviews?.length > 0 ? (
                courseData.reviews.map((item: ReviewType, index: number) => (
                  <ReviewCard key={item.user._id + index.toString()} item={item} />
                ))
              ) : (
                <Text style={styles.emptyText}>Chưa có đánh giá nào</Text>
              )}
            </View>
          )}
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  button: {
    width: widthPercentageToDP("35%"),
    height: 40,
    backgroundColor: "#2467EC",
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  lessonListContainer: {
    marginVertical: 15,
    marginHorizontal: 10,
  },
  lessonListTitle: {
    fontSize: 20,
    fontFamily: "Raleway_700Bold",
    color: "#333",
    marginBottom: 10,
  },
  lessonItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    marginBottom: 10,
  },
  lessonNumber: {
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    color: "#333",
    marginRight: 10,
  },
  lessonTitle: {
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    color: "#333",
    flex: 1,
  },
  tabContainer: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#E1E9F8",
    borderRadius: 25,
    marginHorizontal: 10,
    marginBottom: 15,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  activeTabButton: {
    backgroundColor: "#2467EC",
  },
  tabButtonText: {
    color: "#000",
    fontFamily: "Nunito_600SemiBold",
    fontSize: 16,
  },
  activeTabButtonText: {
    color: "#fff",
  },
  tabContent: {
    marginHorizontal: 16,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Raleway_700Bold",
    color: "#333",
    marginBottom: 10,
  },
  description: {
    color: "#525258",
    fontSize: 16,
    textAlign: "justify",
    fontFamily: "Nunito_500Medium",
  },
  expandButton: {
    marginTop: 5,
  },
  expandButtonText: {
    color: "#2467EC",
    fontSize: 14,
  },
  textInput: {
    flex: 1,
    textAlignVertical: "top",
    justifyContent: "flex-start",
    backgroundColor: "white",
    borderRadius: 10,
    height: 100,
    padding: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E1E2E5",
  },
  submitButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#575757",
    textAlign: "center",
    marginVertical: 20,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  ratingLabel: {
    fontSize: 18,
    paddingRight: 5,
  },
  starsContainer: {
    flexDirection: "row",
  },
});
