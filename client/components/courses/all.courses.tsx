// frontend/components/courses/all.courses.tsx
import CourseCard from "@/components/cards/course.card";
import HomeBannerSlider from "@/components/home/home.banner.slider";
import { SERVER_URI } from "@/utils/uri";
import {
  Nunito_500Medium,
  Nunito_600SemiBold,
} from "@expo-google-fonts/nunito";
import {
  Raleway_600SemiBold,
  Raleway_700Bold,
  useFonts,
} from "@expo-google-fonts/raleway";
import axios from "axios";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { CoursesType, CategoryType } from "@/types/courses";

export default function AllCourses() {
  const [courses, setCourses] = useState<CoursesType[]>([]);
  const [originalCourses, setOriginalCourses] = useState<CoursesType[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const flatListRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${SERVER_URI}/get-layout/Categories`);
        const fetchedCategories: CategoryType[] = response.data?.layout?.categories || [];
        setCategories(fetchedCategories);
      } catch (error) {
        console.log("Error fetching categories:", error);
        setCategories([]);
      }
    };

    fetchCategories();
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${SERVER_URI}/get-courses`);
      const fetchedCourses: CoursesType[] = response.data.courses || [];
      setCourses(fetchedCourses);
      setOriginalCourses(fetchedCourses);
    } catch (error) {
      console.log("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  let [fontsLoaded, fontError] = useFonts({
    Raleway_700Bold,
    Nunito_600SemiBold,
    Raleway_600SemiBold,
    Nunito_500Medium,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={{ flex: 1, marginHorizontal: 16 }}>
      <FlatList
        ListHeaderComponent={
          <>
            <HomeBannerSlider />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  color: "#000000",
                  fontFamily: "Raleway_700Bold",
                }}
              >
                Khóa học phổ biến
              </Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/courses")}>
                <Text
                  style={{
                    fontSize: 15,
                    color: "#2467EC",
                    fontFamily: "Nunito_600SemiBold",
                  }}
                >
                  Xem tất cả
                </Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ref={flatListRef}
        data={courses}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item) => item._id.toString()}
        renderItem={({ item }) => <CourseCard item={item} />}
      />
    </View>
  );
}