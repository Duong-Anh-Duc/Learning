// frontend/components/search/SearchInput.tsx
import { CategoryType, CoursesType } from "@/types/courses";
import { SERVER_URI } from "@/utils/uri";
import { Nunito_700Bold, useFonts } from "@expo-google-fonts/nunito";
import { AntDesign } from "@expo/vector-icons";
import axios from "axios";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { widthPercentageToDP } from "react-native-responsive-screen";
import CourseCard from "../cards/course.card";

export default function SearchInput({ homeScreen, showFilters }: { homeScreen?: boolean; showFilters?: boolean }) {
  const [value, setValue] = useState(""); // Tìm kiếm theo tên
  const [courses, setCourses] = useState<CoursesType[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CoursesType[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [open, setOpen] = useState(false); // Trạng thái mở/đóng dropdown
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [categoryItems, setCategoryItems] = useState<{ label: string; value: string }[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  useEffect(() => {
    // Lấy danh sách khóa học
    const fetchCourses = async () => {
      try {
        const response = await axios.get(`${SERVER_URI}/get-courses`);
        setCourses(response.data.courses);
        if (!homeScreen) {
          setFilteredCourses(response.data.courses);
        }
      } catch (error) {
        console.log("Error fetching courses:", error);
      }
    };

    // Lấy danh sách danh mục
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${SERVER_URI}/get-categories`);
        const fetchedCategories: CategoryType[] = response.data?.categories || [];
        setCategories(fetchedCategories);
    
        const items = [
          { label: "Tất cả", value: "Tất cả" },
          ...fetchedCategories.map((category) => ({
            label: category.title,
            value: category.title,
          })),
        ];
        setCategoryItems(items);
      } catch (error) {
        console.log("Error fetching categories:", error);
        setCategories([]);
        setCategoryItems([{ label: "Tất cả", value: "Tất cả" }]);
      }
    };

    fetchCourses();
    fetchCategories();
  }, []);

  useEffect(() => {
    const filterCourses = async () => {
      try {
        // Chuẩn bị các tham số lọc
        const params: any = {};
        if (value) params.name = value;
        if (selectedCategory !== "Tất cả") params.category = selectedCategory;
        if (minPrice) params.minPrice = parseFloat(minPrice);
        if (maxPrice) params.maxPrice = parseFloat(maxPrice);

        // Gọi API filter-courses
        const response = await axios.get(`${SERVER_URI}/filter-courses`, { params });
        const filtered = response.data.courses || [];

        if (homeScreen && value === "") {
          setFilteredCourses([]);
        } else {
          setFilteredCourses(filtered);
        }
      } catch (error) {
        console.log("Error filtering courses:", error);
        setFilteredCourses([]);
      }
    };

    filterCourses();
  }, [value, selectedCategory, minPrice, maxPrice, courses]);

  let [fontsLoaded, fontError] = useFonts({
    Nunito_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const renderCourseItem = ({ item }: { item: CoursesType }) => (
    <TouchableOpacity
      style={{
        backgroundColor: "#fff",
        padding: 10,
        width: widthPercentageToDP("90%"),
        marginLeft: "1.5%",
        flexDirection: "row",
      }}
      onPress={() =>
        router.push({
          pathname: "/(routes)/course-details",
          params: { item: JSON.stringify(item) },
        })
      }
    >
      <Image
        source={{ uri: item?.thumbnail?.url }}
        style={{ width: 60, height: 60, borderRadius: 10 }}
      />
      <Text
        style={{
          fontSize: 14,
          paddingLeft: 10,
          width: widthPercentageToDP("75%"),
        }}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View>
      <View style={styles.filteringContainer}>
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.input, { fontFamily: "Nunito_700Bold" }]}
            placeholder="Tìm kiếm"
            value={value}
            onChangeText={setValue}
            placeholderTextColor={"#C67cc"}
          />
          <TouchableOpacity
            style={styles.searchIconContainer}
            onPress={() => router.push("/(tabs)/search")}
          >
            <AntDesign name="search1" size={20} color={"#fff"} />
          </TouchableOpacity>
        </View>
      </View>

      {showFilters && (
        <>
          {/* Dropdown chọn danh mục */}
          <View style={styles.pickerContainer}>
            <DropDownPicker
              open={open}
              value={selectedCategory}
              items={categoryItems}
              setOpen={setOpen}
              setValue={setSelectedCategory}
              setItems={setCategoryItems}
              placeholder="Chọn danh mục"
              containerStyle={styles.dropdownContainer}
              style={styles.dropdown}
              dropDownContainerStyle={styles.dropDownStyle}
              textStyle={styles.dropdownText}
              placeholderStyle={styles.dropdownPlaceholder}
            />
          </View>

          {/* Khoảng giá */}
          <View style={styles.priceFilterContainer}>
            <TextInput
              style={styles.priceInput}
              placeholder="Giá tối thiểu (VNĐ)"
              value={minPrice}
              onChangeText={setMinPrice}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.priceInput}
              placeholder="Giá tối đa (VNĐ)"
              value={maxPrice}
              onChangeText={setMaxPrice}
              keyboardType="numeric"
            />
          </View>
        </>
      )}

      <View style={{ paddingHorizontal: 10 }}>
        <FlatList
          data={filteredCourses}
          keyExtractor={(item: CoursesType) => item._id}
          renderItem={
            homeScreen
              ? renderCourseItem
              : ({ item }) => <CourseCard item={item} key={item._id} />
          }
        />
      </View>
      {!homeScreen && (
        <>
          {filteredCourses?.length === 0 && (
            <Text
              style={{
                textAlign: "center",
                paddingTop: 50,
                fontSize: 20,
                fontWeight: "600",
              }}
            >
              Không có dữ liệu để hiển thị!
            </Text>
          )}
        </>
      )}
    </View>
  );
}

export const styles = StyleSheet.create({
  filteringContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginVertical: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIconContainer: {
    width: 36,
    height: 36,
    backgroundColor: "#009990",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "black",
    paddingVertical: 10,
    height: 48,
  },
  pickerContainer: {
    marginHorizontal: 16,
    marginBottom: 10,
    zIndex: 1000, // Đảm bảo dropdown hiển thị trên các thành phần khác
  },
  dropdownContainer: {
    height: 50,
  },
  dropdown: {
    backgroundColor: "#fff",
    borderColor: "#E1E2E5",
    borderRadius: 8,
  },
  dropDownStyle: {
    backgroundColor: "#fff",
    borderColor: "#E1E2E5",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    color: "#333",
  },
  dropdownPlaceholder: {
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    color: "#C67cc",
  },
  priceFilterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 10,
  },
  priceInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    width: "48%",
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
    borderWidth: 1,
    borderColor: "#E1E2E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    color: "#333",
  },
});