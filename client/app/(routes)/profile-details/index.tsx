// frontend/app/(routes)/profile-details/index.tsx
import { useUser } from "@/context/UserContext"; // Cập nhật import
import { SERVER_URI } from "@/utils/uri";
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from "@expo-google-fonts/nunito";
import {
  Raleway_600SemiBold,
  Raleway_700Bold,
  useFonts,
} from "@expo-google-fonts/raleway";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Toast } from "react-native-toast-notifications";

export default function ProfileDetailsScreen() {
  const { user, loading, setUser, fetchUser } = useUser();
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
  });
  const [image, setImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [buttonSpinner, setButtonSpinner] = useState(false);
  const [avatarSpinner, setAvatarSpinner] = useState(false);

  let [fontsLoaded, fontError] = useFonts({
    Raleway_600SemiBold,
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    if (user) {
      setUserInfo({
        name: user.name || "",
        email: user.email || "",
      });
      if (!image) {
        setImage(user.avatar?.url || null);
      }
    }
  }, [user]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#009990" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setAvatarSpinner(true);
      const base64Image = `data:image/jpeg;base64,${base64}`;
      setImage(base64Image);

      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      try {
        const response = await axios.put(
          `${SERVER_URI}/update-user-avatar`,
          {
            avatar: base64Image,
          },
          {
            headers: {
              "access-token": accessToken,
              "refresh-token": refreshToken,
            },
          }
        );
        if (response.data.success) {
          // Cập nhật user trong context ngay lập tức
          setUser((prev) => ({
            ...prev!,
            avatar: {
              public_id: response.data.user.avatar.public_id,
              url: response.data.user.avatar.url,
            },
          }));
          Toast.show("Cập nhật avatar thành công!", { type: "success" });
        }
      } catch (error: any) {
        Toast.show(error.response?.data?.message || "Cập nhật avatar thất bại!", {
          type: "danger",
        });
        setImage(user?.avatar?.url || null);
      } finally {
        setAvatarSpinner(false);
      }
    }
  };

  const handleUpdateProfile = async () => {
    setButtonSpinner(true);
    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      if (!accessToken || !refreshToken) {
        Toast.show("Vui lòng đăng nhập để cập nhật thông tin", { type: "warning" });
        router.push("/(routes)/login");
        return;
      }

      const response = await axios.put(
        `${SERVER_URI}/update-user-info`,
        {
          name: userInfo.name,
          email: userInfo.email,
        },
        {
          headers: {
            "access-token": accessToken,
            "refresh-token": refreshToken,
          },
        }
      );

      if (response.data.success) {
        // Cập nhật user trong context ngay lập tức
        setUser((prev) => ({
          ...prev!,
          name: response.data.user.name,
          email: response.data.user.email,
        }));
        setIsEditing(false);
        Toast.show("Cập nhật thông tin thành công!", { type: "success" });
      }
    } catch (error: any) {
      Toast.show(error.response?.data?.message || "Cập nhật thông tin thất bại!", {
        type: "danger",
      });
    } finally {
      setButtonSpinner(false);
    }
  };

  return (
    <LinearGradient
      colors={["#009990", "#F6F7F9"]}
      style={{ flex: 1, paddingTop: 50 }}
    >
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={[styles.headerText, { fontFamily: "Raleway_700Bold" }]}>Chi Tiết Hồ Sơ</Text>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            <Text style={[styles.editText, { fontFamily: "Nunito_600SemiBold" }]}>{isEditing ? "Hủy" : "Chỉnh sửa"}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.container}>
          <View style={styles.avatarContainer}>
            <View style={{ position: "relative" }}>
              <Image
                source={{
                  uri:
                    image ||
                    user?.avatar?.url ||
                    "https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png",
                }}
                style={styles.avatar}
              />
              {isEditing && (
                <TouchableOpacity
                  style={styles.cameraIcon}
                  onPress={pickImage}
                  disabled={avatarSpinner}
                >
                  {avatarSpinner ? (
                    <ActivityIndicator size="small" color="#009990" />
                  ) : (
                    <Ionicons name="camera-outline" size={25} color="#333" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.infoContainer}>
            <Text style={[styles.label, { fontFamily: "Nunito_700Bold" }]}>Tên:</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, { fontFamily: "Nunito_400Regular" }]}
                value={userInfo.name}
                onChangeText={(value) => setUserInfo({ ...userInfo, name: value })}
                placeholder="Nhập tên"
              />
            ) : (
              <Text style={[styles.infoText, { fontFamily: "Nunito_400Regular" }]}>{userInfo.name}</Text>
            )}
          </View>
          <View style={styles.infoContainer}>
            <Text style={[styles.label, { fontFamily: "Nunito_700Bold" }]}>Email:</Text>
            <Text style={[styles.infoText, { fontFamily: "Nunito_400Regular" }]}>{userInfo.email}</Text>
          </View>
          {isEditing && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdateProfile}
              disabled={buttonSpinner}
            >
              {buttonSpinner ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[styles.saveButtonText, { fontFamily: "Nunito_600SemiBold" }]}>Lưu</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E1E2E5",
  },
  headerText: {
    fontSize: 20,
    color: "#333",
  },
  editText: {
    fontSize: 16,
    color: "#009990",
  },
  container: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  avatarContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 100,
  },
  cameraIcon: {
    position: "absolute",
    bottom: 5,
    right: 0,
    width: 30,
    height: 30,
    backgroundColor: "#f5f5f5",
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
  },
  infoText: {
    fontSize: 16,
    color: "#575757",
  },
  input: {
    height: 50,
    borderColor: "#E1E2E5",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    color: "#333",
  },
  saveButton: {
    backgroundColor: "#009990",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});