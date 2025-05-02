// frontend/app/(routes)/profile/index.tsx
import { useUser } from "@/context/UserContext"; // Cập nhật import
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
import {
  AntDesign,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ToastProvider } from "react-native-toast-notifications";

export default function ProfileScreen() {
  const { user, loading, fetchUser } = useUser(); // Sử dụng UserContext

  let [fontsLoaded, fontError] = useFonts({
    Raleway_600SemiBold,
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const logoutHandler = async () => {
    await AsyncStorage.removeItem("access_token");
    await AsyncStorage.removeItem("refresh_token");
    router.push("/(routes)/login");
  };

  return (
    <ToastProvider>
      <LinearGradient
        colors={["#009990", "#F6F7F9"]}
        style={{ flex: 1, paddingTop: 80 }}
      >
        <ScrollView>
          <View style={{ flexDirection: "row", justifyContent: "center" }}>
            <View>
              <Image
                source={{
                  uri:
                    user?.avatar?.url ||
                    "https://res.cloudinary.com/dshp9jnuy/image/upload/v1665822253/avatars/nrxsg8sd9iy10bbsoenn.png",
                }}
                style={{ width: 90, height: 90, borderRadius: 100 }}
              />
            </View>
          </View>
          <Text
            style={{
              textAlign: "center",
              fontSize: 25,
              paddingTop: 10,
              fontWeight: "600",
            }}
          >
            {user?.name}
          </Text>
          <View style={{ marginHorizontal: 16, marginTop: 30 }}>
            <Text
              style={{
                fontSize: 20,
                marginBottom: 16,
                fontFamily: "Raleway_700Bold",
              }}
            >
              Chi Tiết Tài Khoản
            </Text>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
              onPress={() => router.push("/(routes)/profile-details")}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  columnGap: 30,
                }}
              >
                <View
                  style={{
                    borderWidth: 2,
                    borderColor: "#dde2ec",
                    padding: 15,
                    borderRadius: 100,
                    width: 55,
                    height: 55,
                  }}
                >
                  <FontAwesome
                    style={{ alignSelf: "center" }}
                    name="user-o"
                    size={20}
                    color={"black"}
                  />
                </View>
                <View>
                  <Text
                    style={{ fontSize: 16, fontFamily: "Nunito_700Bold" }}
                  >
                    Chi Tiết Hồ Sơ
                  </Text>
                  <Text
                    style={{
                      color: "#575757",
                      fontFamily: "Nunito_400Regular",
                    }}
                  >
                    Thông Tin Tài Khoản
                  </Text>
                </View>
              </View>
              <AntDesign name="right" size={26} color={"#CBD5E0"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
              onPress={() => router.push("/(routes)/enrolled-courses")}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  columnGap: 30,
                }}
              >
                <View
                  style={{
                    borderWidth: 2,
                    borderColor: "#dde2ec",
                    padding: 15,
                    borderRadius: 100,
                    width: 55,
                    height: 55,
                  }}
                >
                  <MaterialCommunityIcons
                    style={{ alignSelf: "center" }}
                    name="book-account-outline"
                    size={20}
                    color={"black"}
                  />
                </View>
                <View>
                  <Text
                    style={{ fontSize: 16, fontFamily: "Nunito_700Bold" }}
                  >
                    Khóa Học Đã Đăng Ký
                  </Text>
                  <Text
                    style={{
                      color: "#575757",
                      fontFamily: "Nunito_400Regular",
                    }}
                  >
                    Tất cả các khóa học đã đăng ký
                  </Text>
                </View>
              </View>
              <AntDesign name="right" size={26} color={"#CBD5E0"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
              onPress={() => router.push("/(routes)/change-password")}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  columnGap: 30,
                }}
              >
                <View
                  style={{
                    borderWidth: 2,
                    borderColor: "#dde2ec",
                    padding: 15,
                    borderRadius: 100,
                    width: 55,
                    height: 55,
                  }}
                >
                  <MaterialCommunityIcons
                    style={{ alignSelf: "center" }}
                    name="lock-reset"
                    size={20}
                    color={"black"}
                  />
                </View>
                <View>
                  <Text
                    style={{ fontSize: 16, fontFamily: "Nunito_700Bold" }}
                  >
                    Đổi Mật Khẩu
                  </Text>
                  <Text
                    style={{
                      color: "#575757",
                      fontFamily: "Nunito_400Regular",
                    }}
                  >
                    Thay đổi mật khẩu của bạn
                  </Text>
                </View>
              </View>
              <AntDesign name="right" size={26} color={"#CBD5E0"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
              onPress={() => logoutHandler()}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  columnGap: 30,
                }}
              >
                <View
                  style={{
                    borderWidth: 2,
                    borderColor: "#dde2ec",
                    padding: 15,
                    borderRadius: 100,
                    width: 55,
                    height: 55,
                  }}
                >
                  <Ionicons
                    style={{ alignSelf: "center" }}
                    name="log-out-outline"
                    size={20}
                    color={"black"}
                  />
                </View>
                <View>
                  <Text
                    style={{ fontSize: 16, fontFamily: "Nunito_700Bold" }}
                  >
                    Đăng Xuất
                  </Text>
                </View>
              </View>
              <AntDesign name="right" size={26} color={"#CBD5E0"} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </ToastProvider>
  );
}