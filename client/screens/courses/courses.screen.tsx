// frontend/app/(routes)/courses/index.tsx
import CourseCard from "@/components/cards/course.card";
import { CategoryType, CoursesType } from "@/types/courses";
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
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  RefreshControl,
} from "react-native";

export default function CoursesScreen() {
  const [courses, setCourses] = useState<CoursesType[]>([]);
  const [originalCourses, setOriginalCourses] = useState<CoursesType[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [activeCategory, setActiveCategory] = useState("Tất cả");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${SERVER_URI}/get-layout/Categories`);
        const fetchedCategories: CategoryType[] =
          response.data?.layout?.categories || [];
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
    Nunito_400Regular,
    Nunito_700Bold,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Raleway_600SemiBold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const handleCategories = (category: string) => {
    setActiveCategory(category);
    if (category === "Tất cả") {
      setCourses(originalCourses);
    } else {
      const filterCourses = originalCourses.filter(
        (i: CoursesType) => i.categories === category
      );
      setCourses(filterCourses);
    }
  };

  return (
    <>
      <LinearGradient
        colors={["#009990", "#F6F7F9"]}
        style={{ flex: 1, paddingTop: 65 }}
      >
        <View style={{ padding: 10 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={{
                padding: 10,
                backgroundColor:
                  activeCategory === "Tất cả" ? "#2467EC" : "#000",
                borderRadius: 20,
                paddingHorizontal: 20,
                marginRight: 5,
              }}
              onPress={() => handleCategories("Tất cả")}
            >
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}>
                Tất cả
              </Text>
            </TouchableOpacity>
            {categories?.map((category: CategoryType, index: number) => (
              <TouchableOpacity
                style={{
                  padding: 10,
                  backgroundColor:
                    activeCategory === category?.title ? "#2467EC" : "#000",
                  borderRadius: 50,
                  paddingHorizontal: 20,
                  marginHorizontal: 15,
                }}
                onPress={() => handleCategories(category?.title)}
                key={index}
              >
                <Text
                  style={{ color: "#fff", fontSize: 18, fontWeight: "600" }}
                >
                  {category?.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        <View style={{ flex: 1 }}>
          {loading ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 18, fontFamily: "Nunito_700Bold" }}>
                Đang tải...
              </Text>
            </View>
          ) : courses?.length === 0 ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ textAlign: "center", fontSize: 18 }}>
                Không có dữ liệu để hiển thị!
              </Text>
            </View>
          ) : (
            <FlatList
              data={courses}
              keyExtractor={(item: CoursesType) => item._id}
              renderItem={({ item }) => <CourseCard item={item} />}
              contentContainerStyle={{ paddingHorizontal: 15, gap: 12 }}
              refreshControl={
                <RefreshControl
                  refreshing={loading}
                  onRefresh={fetchCourses}
                  colors={["#009990"]}
                  tintColor="#009990"
                />
              }
            />
          )}
        </View>
      </LinearGradient>
    </>
  );
}
