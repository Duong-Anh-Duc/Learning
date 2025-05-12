import { dashboardStyles } from "@/styles/dashboard/dashboard.styles";
import api from "@/utils/api";
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from "@expo-google-fonts/nunito";
import { Raleway_700Bold, useFonts } from "@expo-google-fonts/raleway";
import * as ImagePicker from "expo-image-picker";
import { Link } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Toast } from "react-native-toast-notifications";

// Định nghĩa kiểu cho courseData
interface CourseData {
  name: string;
  description: string;
  categories: string;
  price: string;
  estimatedPrice: string;
  tags: string;
  level: string;
  demoUrl: string;
}

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

const CreateCourseScreen = () => {
  const [courseData, setCourseData] = useState<CourseData>({
    name: "",
    description: "",
    categories: "",
    price: "",
    estimatedPrice: "",
    tags: "",
    level: "",
    demoUrl: "",
  });
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickThumbnail = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Toast.show("Cần quyền truy cập thư viện ảnh!", { type: "danger" });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setThumbnail(result.assets[0].uri);
    }
  };

  const handleCreateCourse = async () => {
    if (
      !courseData.name ||
      !courseData.description ||
      !courseData.categories ||
      !courseData.price ||
      !courseData.tags ||
      !courseData.level
    ) {
      Toast.show("Vui lòng điền đầy đủ thông tin!", { type: "danger" });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", courseData.name);
      formData.append("description", courseData.description);
      formData.append("categories", courseData.categories);
      formData.append("price", courseData.price);
      formData.append("estimatedPrice", courseData.estimatedPrice);
      formData.append("tags", courseData.tags);
      formData.append("level", courseData.level);
      formData.append("demoUrl", courseData.demoUrl);

      if (thumbnail) {
        formData.append("thumbnail", {
          uri: thumbnail,
          name: "thumbnail.jpg",
          type: "image/jpeg",
        } as any);
      }

      await api.post("/create-course", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Toast.show("Tạo khóa học thành công!", { type: "success" });
    } catch (error: any) {
      console.error("Lỗi khi tạo khóa học:", error);
      Toast.show(error.response?.data?.message || "Không thể tạo khóa học!", {
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FontLoader>
      <ScrollView style={dashboardStyles.container}>
        <Text
          style={[
            dashboardStyles.welcomeText,
            { fontFamily: "Raleway_700Bold" },
          ]}
        >
          Tạo Khóa Học Mới
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            marginBottom: 10,
            borderRadius: 5,
          }}
          placeholder="Tên khóa học"
          value={courseData.name}
          onChangeText={(text) => setCourseData({ ...courseData, name: text })}
        />
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            marginBottom: 10,
            borderRadius: 5,
          }}
          placeholder="Mô tả"
          value={courseData.description}
          onChangeText={(text) =>
            setCourseData({ ...courseData, description: text })
          }
        />
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            marginBottom: 10,
            borderRadius: 5,
          }}
          placeholder="Danh mục"
          value={courseData.categories}
          onChangeText={(text) =>
            setCourseData({ ...courseData, categories: text })
          }
        />
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            marginBottom: 10,
            borderRadius: 5,
          }}
          placeholder="Giá"
          value={courseData.price}
          onChangeText={(text) => setCourseData({ ...courseData, price: text })}
          keyboardType="numeric"
        />
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            marginBottom: 10,
            borderRadius: 5,
          }}
          placeholder="Giá ước tính (nếu có)"
          value={courseData.estimatedPrice}
          onChangeText={(text) =>
            setCourseData({ ...courseData, estimatedPrice: text })
          }
          keyboardType="numeric"
        />
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            marginBottom: 10,
            borderRadius: 5,
          }}
          placeholder="Thẻ (tags)"
          value={courseData.tags}
          onChangeText={(text) => setCourseData({ ...courseData, tags: text })}
        />
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            marginBottom: 10,
            borderRadius: 5,
          }}
          placeholder="Cấp độ (Beginner, Intermediate, Advanced)"
          value={courseData.level}
          onChangeText={(text) => setCourseData({ ...courseData, level: text })}
        />
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            marginBottom: 10,
            borderRadius: 5,
          }}
          placeholder="URL video demo"
          value={courseData.demoUrl}
          onChangeText={(text) =>
            setCourseData({ ...courseData, demoUrl: text })
          }
        />
        <TouchableOpacity
          style={{
            backgroundColor: "#009990",
            padding: 10,
            borderRadius: 5,
            marginBottom: 10,
          }}
          onPress={pickThumbnail}
        >
          <Text
            style={{
              color: "white",
              textAlign: "center",
              fontFamily: "Nunito_600SemiBold",
            }}
          >
            {thumbnail ? "Thay đổi ảnh thumbnail" : "Chọn ảnh thumbnail"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={dashboardStyles.button}
          onPress={handleCreateCourse}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text
              style={[
                dashboardStyles.buttonText,
                { fontFamily: "Nunito_600SemiBold" },
              ]}
            >
              Tạo Khóa Học
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            dashboardStyles.button,
            { backgroundColor: "#ccc", marginTop: 10 },
          ]}
        >
          <Link href="/(admin)/manage-courses">
            <Text
              style={[
                dashboardStyles.buttonText,
                { fontFamily: "Nunito_600SemiBold" },
              ]}
            >
              Quay Lại
            </Text>
          </Link>
        </TouchableOpacity>
      </ScrollView>
    </FontLoader>
  );
};

export default CreateCourseScreen;
