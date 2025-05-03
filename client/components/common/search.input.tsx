// frontend/components/search/SearchInput.tsx
import { CategoryType, CoursesType } from "@/types/courses";
import { SERVER_URI } from "@/utils/uri";
import { Nunito_700Bold, useFonts } from "@expo-google-fonts/nunito";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
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
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<CoursesType[]>([]);
  const [courses, setCourses] = useState<CoursesType[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CoursesType[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [openCategory, setOpenCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [categoryItems, setCategoryItems] = useState<{ label: string; value: string }[]>([]);
  const [openSort, setOpenSort] = useState(false);
  const [sortOrder, setSortOrder] = useState("");
  const [sortItems] = useState([
    { label: "Không sắp xếp", value: "" },
    { label: "Giá: Tăng dần", value: "asc" },
    { label: "Giá: Giảm dần", value: "desc" },
  ]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  useEffect(() => {
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
    if (value.trim() === "") {
      setSuggestions([]);
    } else {
      const filteredSuggestions = courses.filter((course) =>
        course.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filteredSuggestions);
    }
  }, [value, courses]);

  // Cập nhật kết quả khi bộ lọc thay đổi
  useEffect(() => {
    const applyFilters = async () => {
      try {
        const params: any = {};
        if (value.trim()) {
          params.name = value.trim();
        }
        if (selectedCategory !== "Tất cả") {
          params.categories = selectedCategory;
        }
        if (sortOrder) {
          params.sortOrder = sortOrder;
        }

        const response = await axios.get(`${SERVER_URI}/filter-courses`, { params });
        const filtered = response.data.courses || [];

        if (homeScreen && value.trim() === "" && selectedCategory === "Tất cả" && !sortOrder) {
          setFilteredCourses([]);
        } else {
          setFilteredCourses(filtered);
        }
      } catch (error) {
        console.log("Error applying filters:", error);
        setFilteredCourses([]);
      }
    };

    applyFilters();
  }, [selectedCategory, sortOrder]); // Lắng nghe thay đổi của selectedCategory và sortOrder

  const handleSearch = async () => {
    try {
      const params: any = {};
      if (value.trim()) {
        params.name = value.trim();
      }
      if (selectedCategory !== "Tất cả") {
        params.categories = selectedCategory;
      }
      if (sortOrder) {
        params.sortOrder = sortOrder;
      }

      const response = await axios.get(`${SERVER_URI}/filter-courses`, { params });
      const filtered = response.data.courses || [];

      if (homeScreen && value.trim() === "") {
        setFilteredCourses([]);
      } else {
        setFilteredCourses(filtered);
      }
      setSuggestions([]);
    } catch (error) {
      console.log("Error filtering courses:", error);
      setFilteredCourses([]);
    }
  };

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

  const renderSuggestionItem = ({ item }: { item: CoursesType }) => (
    <TouchableOpacity
      style={{
        backgroundColor: "#fff",
        padding: 10,
        width: widthPercentageToDP("90%"),
        marginLeft: "1.5%",
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#E1E2E5",
      }}
      onPress={() => {
        setValue(item.name);
        setSuggestions([]);
        handleSearch();
      }}
    >
      <Text style={{ fontSize: 14 }}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View>
      <View style={styles.filteringContainer}>
        <View style={[styles.searchContainer, { width: widthPercentageToDP("80%") }]}>
          <TextInput
            style={[styles.input, { fontFamily: "Nunito_700Bold" }]}
            placeholder="Tìm kiếm"
            value={value}
            onChangeText={setValue}
            placeholderTextColor={"#C67cc"}
          />
          <TouchableOpacity
            style={styles.searchIconContainer}
            onPress={handleSearch}
          >
            <AntDesign name="search1" size={20} color={"#fff"} />
          </TouchableOpacity>
        </View>
        {showFilters && (
          <TouchableOpacity
            style={styles.filterIconContainer}
            onPress={() => setIsFilterModalVisible(true)}
          >
            <MaterialIcons name="more-vert" size={24} color="#333" />
          </TouchableOpacity>
        )}
      </View>

      {suggestions.length > 0 && (
        <FlatList
          data={suggestions}
          keyExtractor={(item: CoursesType) => item._id}
          renderItem={renderSuggestionItem}
          style={styles.suggestionList}
        />
      )}

      {/* Modal bộ lọc */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isFilterModalVisible}
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Bộ Lọc</Text>

            {/* Dropdown chọn danh mục */}
            <View style={[styles.pickerContainer, { zIndex: 1000 }]}>
              <DropDownPicker
                open={openCategory}
                value={selectedCategory}
                items={categoryItems}
                setOpen={setOpenCategory}
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

            {/* Dropdown chọn sắp xếp theo giá */}
            <View style={[styles.pickerContainer, { zIndex: 900 }]}>
              <DropDownPicker
                open={openSort}
                value={sortOrder}
                items={sortItems}
                setOpen={setOpenSort}
                setValue={setSortOrder}
                setItems={() => {}}
                placeholder="Sắp xếp theo giá"
                containerStyle={styles.dropdownContainer}
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropDownStyle}
                textStyle={styles.dropdownText}
                placeholderStyle={styles.dropdownPlaceholder}
              />
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsFilterModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
      {!homeScreen && filteredCourses?.length === 0 && value.trim() !== "" && (
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
  filterIconContainer: {
    padding: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "black",
    paddingVertical: 10,
    height: 48,
  },
  suggestionList: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginHorizontal: 16,
    maxHeight: 200,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: widthPercentageToDP("80%"),
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Nunito_700Bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  pickerContainer: {
    marginBottom: 20,
    zIndex: 1000,
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
  closeButton: {
    backgroundColor: "#009990",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 10,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
  },
});