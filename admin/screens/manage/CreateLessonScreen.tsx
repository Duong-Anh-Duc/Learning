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
import * as ImagePicker from "expo-image-picker"; // Đổi tên import để dùng chung cho cả ảnh và video
import { Link, useLocalSearchParams, useNavigation } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
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

interface LessonData {
  title: string;
  description: string;
  videoSection: string;
  videoLength: string;
  videoPlayer: string;
  suggestion: string;
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

const CreateLessonScreen = () => {
  const { courseId } = useLocalSearchParams();
  const [lessonData, setLessonData] = useState<LessonData>({
    title: "",
    description: "",
    videoSection: "",
    videoLength: "",
    videoPlayer: "",
    suggestion: "",
  });
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<string | null>(null); // Thêm state cho thumbnailFile
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();

  const pickVideo = async () => {
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
      setVideoFile(result.assets[0].uri);
    }
  };

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
      setThumbnailFile(result.assets[0].uri);
    }
  };

  const handleCreateLesson = async () => {
    if (!courseId || typeof courseId !== "string") {
      Toast.show("ID khóa học không hợp lệ!", { type: "danger" });
      return;
    }

    if (
      !lessonData.title ||
      !lessonData.description ||
      !lessonData.videoSection ||
      !lessonData.videoLength ||
      !lessonData.videoPlayer
    ) {
      Toast.show("Vui lòng điền đầy đủ thông tin!", { type: "danger" });
      return;
    }

    if (!videoFile) {
      Toast.show("Vui lòng chọn video bài học!", { type: "danger" });
      return;
    }

    if (!thumbnailFile) {
      Toast.show("Vui lòng chọn thumbnail bài học!", { type: "danger" });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("courseId", courseId);
      formData.append("title", lessonData.title);
      formData.append("description", lessonData.description);
      formData.append("videoSection", lessonData.videoSection);
      formData.append("videoLength", lessonData.videoLength);
      formData.append("videoPlayer", lessonData.videoPlayer);
      formData.append("suggestion", lessonData.suggestion);

      formData.append("videoFile", {
        uri: videoFile,
        name: "lesson_video.mp4",
        type: "video/mp4",
      } as any);

      formData.append("thumbnailFile", {
        uri: thumbnailFile,
        name: "thumbnail.jpg",
        type: "image/jpeg",
      } as any);

      await api.post("/add-lesson", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 100000,
      });
      Toast.show("Thêm bài học thành công!", { type: "success" });
    } catch (error: any) {
      console.error("Lỗi khi thêm bài học:", error);
      Toast.show(error.response?.data?.message || "Không thể thêm bài học!", {
        type: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FontLoader>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <CustomHeader title="Thêm Bài Học" navigation={navigation} />
          <ScrollView
            style={[dashboardStyles.container, styles.contentContainer]}
          >
            <TextInput
              style={styles.input}
              placeholder="Tiêu đề bài học"
              value={lessonData.title}
              onChangeText={(text) =>
                setLessonData({ ...lessonData, title: text })
              }
            />
            <TextInput
              style={[styles.input, { height: 100 }]}
              placeholder="Mô tả"
              value={lessonData.description}
              onChangeText={(text) =>
                setLessonData({ ...lessonData, description: text })
              }
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Phần video (Video Section)"
              value={lessonData.videoSection}
              onChangeText={(text) =>
                setLessonData({ ...lessonData, videoSection: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Độ dài video (phút)"
              value={lessonData.videoLength}
              onChangeText={(text) =>
                setLessonData({ ...lessonData, videoLength: text })
              }
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Video Player (e.g., Vimeo, YouTube)"
              value={lessonData.videoPlayer}
              onChangeText={(text) =>
                setLessonData({ ...lessonData, videoPlayer: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Gợi ý (nếu có)"
              value={lessonData.suggestion}
              onChangeText={(text) =>
                setLessonData({ ...lessonData, suggestion: text })
              }
            />
            <TouchableOpacity style={styles.videoButton} onPress={pickVideo}>
              <Text style={styles.videoButtonText}>
                {videoFile ? "Thay đổi video" : "Chọn video bài học"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.thumbnailButton}
              onPress={pickThumbnail}
            >
              <Text style={styles.thumbnailButtonText}>
                {thumbnailFile
                  ? "Thay đổi thumbnail"
                  : "Chọn thumbnail bài học"}
              </Text>
            </TouchableOpacity>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={handleCreateLesson}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={theme.colors.white} />
                ) : (
                  <Text style={styles.buttonText}>Thêm Bài Học</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: theme.colors.disabled },
                ]}
              >
                <Link
                  href={{
                    pathname: "/(admin)/manage-courses/course-details",
                    params: { courseId },
                  }}
                >
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
  thumbnailButton: {
    backgroundColor: theme.colors.secondary,
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
  thumbnailButtonText: {
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

export default CreateLessonScreen;
