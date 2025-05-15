import CustomHeader from "@/components/CustomHeader";
import { dashboardStyles } from "@/styles/dashboard/dashboard.styles";
import { theme } from "@/styles/theme";
import api from "@/utils/api";
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from "@expo-google-fonts/nunito";
import { Raleway_700Bold, useFonts } from "@expo-google-fonts/raleway";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import axiosRetry from "axios-retry";
import * as ImagePicker from "expo-image-picker";
import { Link, useNavigation } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ImageResizer from "react-native-image-resizer";
import { Toast } from "react-native-toast-notifications";

// Định nghĩa ParamList cho DrawerNavigator
type DrawerParamList = {
  dashboard: undefined;
  "manage-courses": undefined;
  "manage-courses/course-details": undefined;
  "manage-users": undefined;
  "manage-categories": undefined;
  "manage-orders": undefined;
  "manage-comments": undefined;
  "change-password": undefined;
  "create-course": undefined;
  "create-lesson": undefined;
  "edit-course": undefined;
  "edit-lesson": undefined;
  "enrolled-users": undefined;
};

axiosRetry(api, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 2000,
  retryCondition: (error) =>
    error.code === "ECONNABORTED" || error.code === "ERR_NETWORK",
});

interface CourseData {
  name: string;
  description: string;
  categories: string;
  price: string;
  estimatedPrice: string;
  tags: string;
  level: string;
}

const FontLoader = ({ children }: { children: React.ReactNode }) => {
  const [fontsLoaded, fontError] = useFonts({
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
};

const compressImage = async (uri: string): Promise<string> => {
  try {
    const compressed = await ImageResizer.createResizedImage(
      uri,
      400,
      400,
      "JPEG",
      60,
      0,
      undefined,
      false,
      { mode: "contain" }
    );
    return compressed.uri;
  } catch (error) {
    console.error("Lỗi khi nén ảnh:", error);
    return uri;
  }
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
  });
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [demoVideo, setDemoVideo] = useState<string | null>(null); // Thêm state cho demoVideo
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();

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
      const compressedUri = await compressImage(result.assets[0].uri);
      setThumbnail(compressedUri);
    }
  };

  const pickDemoVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Toast.show("Cần quyền truy cập thư viện video!", { type: "danger" });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setDemoVideo(result.assets[0].uri);
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

    if (!thumbnail) {
      Toast.show("Vui lòng chọn thumbnail!", { type: "danger" });
      return;
    }

    if (!demoVideo) {
      Toast.show("Vui lòng chọn demo video!", { type: "danger" });
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

      formData.append("thumbnail", {
        uri: thumbnail,
        name: "thumbnail.jpg",
        type: "image/jpeg",
      } as any);

      formData.append("demoVideo", {
        uri: demoVideo,
        name: "demoVideo.mp4",
        type: "video/mp4",
      } as any);

      await api.post("/create-course", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 10000000,
      });
      Toast.show("Tạo khóa học thành công!", { type: "success" });
    } catch (error: any) {
      console.error("Lỗi khi tạo khóa học:", error);
      if (error.code === "ECONNABORTED") {
        Toast.show(
          "Yêu cầu mất quá nhiều thời gian. Vui lòng kiểm tra kết nối mạng hoặc thử lại với file nhỏ hơn!",
          { type: "danger" }
        );
      } else if (error.response?.status === 413) {
        Toast.show("File quá lớn! Vui lòng chọn file nhỏ hơn 50MB.", {
          type: "danger",
        });
      } else {
        Toast.show(
          error.response?.data?.message ||
            "Không thể tạo khóa học! Vui lòng thử lại sau.",
          { type: "danger" }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <FontLoader>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <CustomHeader title="Tạo Khóa Học Mới" navigation={navigation} />
          <ScrollView
            style={[dashboardStyles.container, styles.contentContainer]}
          >
            <TextInput
              style={styles.input}
              placeholder="Tên khóa học"
              value={courseData.name}
              onChangeText={(text) =>
                setCourseData({ ...courseData, name: text })
              }
            />
            <TextInput
              style={[styles.input, { height: 100 }]}
              placeholder="Mô tả"
              value={courseData.description}
              onChangeText={(text) =>
                setCourseData({ ...courseData, description: text })
              }
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Danh mục"
              value={courseData.categories}
              onChangeText={(text) =>
                setCourseData({ ...courseData, categories: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Giá"
              value={courseData.price}
              onChangeText={(text) =>
                setCourseData({ ...courseData, price: text })
              }
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Giá ước tính (nếu có)"
              value={courseData.estimatedPrice}
              onChangeText={(text) =>
                setCourseData({ ...courseData, estimatedPrice: text })
              }
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Thẻ (tags)"
              value={courseData.tags}
              onChangeText={(text) =>
                setCourseData({ ...courseData, tags: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Cấp độ (Beginner, Intermediate, Advanced)"
              value={courseData.level}
              onChangeText={(text) =>
                setCourseData({ ...courseData, level: text })
              }
            />
            <TouchableOpacity
              style={styles.thumbnailContainer}
              onPress={pickThumbnail}
            >
              {thumbnail ? (
                <Image
                  source={{ uri: thumbnail }}
                  style={styles.thumbnailPreview}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.thumbnailText}>
                  {thumbnail ? "Thay đổi ảnh thumbnail" : "Chọn ảnh thumbnail"}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.videoButton}
              onPress={pickDemoVideo}
            >
              <Text style={styles.videoButtonText}>
                {demoVideo ? "Thay đổi demo video" : "Chọn demo video"}
              </Text>
            </TouchableOpacity>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={handleCreateCourse}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={theme.colors.white} />
                ) : (
                  <Text style={styles.buttonText}>Tạo Khóa Học</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: theme.colors.disabled },
                ]}
              >
                <Link href="/(admin)/manage-courses">
                  <Text style={styles.buttonText}>Quay Lại</Text>
                </Link>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </FontLoader>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.medium,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
    borderRadius: theme.borderRadius.medium,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.body,
    backgroundColor: theme.colors.white,
    elevation: theme.elevation.small,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  thumbnailContainer: {
    height: 150,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.medium,
    backgroundColor: theme.colors.border,
    justifyContent: "center",
    alignItems: "center",
    elevation: theme.elevation.small,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  thumbnailPreview: {
    width: "100%",
    height: "100%",
    borderRadius: theme.borderRadius.medium,
  },
  thumbnailText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.body,
    color: theme.colors.textSecondary,
  },
  videoButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.medium,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.medium,
    alignItems: "center",
    elevation: theme.elevation.small,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  videoButtonText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.button,
    color: theme.colors.white,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.large,
  },
  button: {
    flex: 1,
    borderRadius: theme.borderRadius.medium,
    paddingVertical: theme.spacing.medium,
    marginHorizontal: theme.spacing.small,
    elevation: theme.elevation.small,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: "center",
  },
  buttonText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.button,
    color: theme.colors.white,
  },
});

export default CreateCourseScreen;
