// frontend/app/(routes)/course-access/index.tsx
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import React, { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import axios from "axios";
import { SERVER_URI } from "@/utils/uri";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";
import { widthPercentageToDP } from "react-native-responsive-screen";
import QuestionsCard from "@/components/cards/question.card";
import { Toast } from "react-native-toast-notifications";
import ReviewCard from "@/components/cards/review.card";
import { FontAwesome } from "@expo/vector-icons";
import useUser from "@/hooks/auth/useUser";
import { CoursesType, CourseDataType, CommentType, ReviewType } from "@/types/courses";

export default function CourseAccessScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const { courseId } = useLocalSearchParams();
  const [courseData, setCourseData] = useState<CoursesType | null>(null);
  const [courseContentData, setCourseContentData] = useState<CourseDataType[]>([]);
  const [activeVideo, setActiveVideo] = useState(0);
  const [activeButton, setActiveButton] = useState("Về Khóa Học");
  const [isExpanded, setIsExpanded] = useState(false);
  const [question, setQuestion] = useState("");
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
    await axios
      .get(`${SERVER_URI}/get-course-content/${courseData._id}`, {
        headers: {
          "access-token": accessToken,
          "refresh-token": refreshToken,
        },
      })
      .then((res: any) => {
        setIsLoading(false);
        setCourseContentData(res.data.content || []);
      })
      .catch((error) => {
        setIsLoading(false);
        router.push({
          pathname: "/(routes)/course-details",
          params: { courseId: courseData._id },
        });
      });
  };

  const handleQuestionSubmit = async () => {
    if (!courseData) return;
    const accessToken = await AsyncStorage.getItem("access_token");
    const refreshToken = await AsyncStorage.getItem("refresh_token");

    await axios
      .put(
        `${SERVER_URI}/add-question`,
        {
          question: question,
          courseId: courseData?._id,
          contentId: courseContentData[activeVideo]?._id,
        },
        {
          headers: {
            "access-token": accessToken,
            "refresh-token": refreshToken,
          },
        }
      )
      .then((res) => {
        setQuestion("");
        Toast.show("Câu hỏi đã được tạo thành công!", {
          placement: "bottom",
        });
        fetchCourseContent();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleReviewSubmit = async () => {
    if (!courseData) return;
    const accessToken = await AsyncStorage.getItem("access_token");
    const refreshToken = await AsyncStorage.getItem("refresh_token");

    await axios
      .put(
        `${SERVER_URI}/add-review/${courseData?._id}`,
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
      )
      .then((res) => {
        setRating(1);
        setReview("");
        router.push({
          pathname: "/(routes)/course-details",
          params: { courseId: courseData._id },
        });
      })
      .catch((error: any) => {
        console.log(error);
      });
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
            style={{ marginHorizontal: 4, marginTop: -5 }}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

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
    <>
      <ScrollView stickyHeaderIndices={[0]} style={{ flex: 1, padding: 10 }}>
        <View
          style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: 10 }}
        >
          <WebView
            source={{ uri: courseContentData[activeVideo]?.videoUrl || "" }}
            allowsFullscreenVideo={true}
          />
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity
            style={styles.button}
            disabled={activeVideo === 0}
            onPress={() => setActiveVideo(activeVideo - 1)}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>
              Trước
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setActiveVideo(activeVideo + 1)}
            disabled={activeVideo === courseContentData.length - 1}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>
              Tiếp Theo
            </Text>
          </TouchableOpacity>
        </View>
        <View
          style={{
            paddingVertical: 10,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>
            {activeVideo + 1}. {courseContentData[activeVideo]?.title || "Không có tiêu đề"}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            marginTop: 25,
            marginHorizontal: 10,
            backgroundColor: "#E1E9F8",
            borderRadius: 50,
            gap: 10,
          }}
        >
          <TouchableOpacity
            style={{
              paddingVertical: 10,
              paddingHorizontal: 42,
              backgroundColor:
                activeButton === "Về Khóa Học" ? "#2467EC" : "transparent",
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
                activeButton === "Hỏi Đáp" ? "#2467EC" : "transparent",
              borderRadius: activeButton === "Hỏi Đáp" ? 50 : 0,
            }}
            onPress={() => setActiveButton("Hỏi Đáp")}
          >
            <Text
              style={{
                color: activeButton === "Hỏi Đáp" ? "#fff" : "#000",
                fontFamily: "Nunito_600SemiBold",
              }}
            >
              Hỏi Đáp
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              paddingVertical: 10,
              paddingHorizontal: 42,
              backgroundColor:
                activeButton === "Đánh Giá" ? "#2467EC" : "transparent",
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
                    color: "#2467EC",
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
        {activeButton === "Hỏi Đáp" && (
          <View style={{ flex: 1, margin: 15 }}>
            <View>
              <TextInput
                value={question}
                onChangeText={setQuestion}
                placeholder="Đặt một câu hỏi..."
                style={{
                  marginVertical: 20,
                  flex: 1,
                  textAlignVertical: "top",
                  justifyContent: "flex-start",
                  backgroundColor: "white",
                  borderRadius: 10,
                  height: 100,
                  padding: 10,
                }}
                multiline={true}
              />
              <View
                style={{ flexDirection: "row", justifyContent: "flex-end" }}
              >
                <TouchableOpacity
                  style={[styles.button]}
                  disabled={question === ""}
                  onPress={() => handleQuestionSubmit()}
                >
                  <Text
                    style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}
                  >
                    Gửi
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ marginBottom: 20 }}>
              {courseContentData[activeVideo]?.questions
                ?.slice()
                .reverse()
                .map((item: CommentType, index: number) => (
                  <QuestionsCard
                    item={item}
                    key={index}
                    fetchCourseContent={fetchCourseContent}
                    courseData={courseData}
                    contentId={courseContentData[activeVideo]?._id}
                  />
                ))}
            </View>
          </View>
        )}
        {activeButton === "Đánh Giá" && (
          <View style={{ marginHorizontal: 16, marginVertical: 25 }}>
            {!reviewAvailable && (
              <View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text
                    style={{
                      fontSize: 18,
                      paddingBottom: 10,
                      paddingLeft: 2,
                      paddingRight: 5,
                    }}
                  >
                    Đánh giá:
                  </Text>
                  {renderStars()}
                </View>

                <TextInput
                  value={review}
                  onChangeText={setReview}
                  placeholder="Viết một đánh giá..."
                  style={{
                    flex: 1,
                    textAlignVertical: "top",
                    justifyContent: "flex-start",
                    backgroundColor: "white",
                    borderRadius: 10,
                    height: 100,
                    padding: 10,
                  }}
                  multiline={true}
                />
                <View
                  style={{ flexDirection: "row", justifyContent: "flex-end" }}
                >
                  <TouchableOpacity
                    style={[styles.button]}
                    disabled={review === ""}
                    onPress={() => handleReviewSubmit()}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 18,
                        fontWeight: "600",
                      }}
                    >
                      Gửi
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: widthPercentageToDP("35%"),
    height: 40,
    backgroundColor: "#2467EC",
    marginVertical: 10,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});