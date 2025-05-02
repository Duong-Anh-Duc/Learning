import { SERVER_URI } from "@/utils/uri";
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from "@expo-google-fonts/nunito";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Toast } from "react-native-toast-notifications";

export default function ChangePasswordScreen() {
  const [passwordInfo, setPasswordInfo] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [isPasswordVisible, setPasswordVisible] = useState({
    oldPassword: false,
    newPassword: false,
    confirmNewPassword: false,
  });
  const [buttonSpinner, setButtonSpinner] = useState(false);
  const [error, setError] = useState({
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  let [fontsLoaded, fontError] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_400Regular,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  const validateOldPassword = () => {
    if (!passwordInfo.oldPassword) {
      setError((prev) => ({
        ...prev,
        oldPassword: "Vui lòng nhập mật khẩu cũ",
      }));
      return false;
    }
    setError((prev) => ({
      ...prev,
      oldPassword: "",
    }));
    return true;
  };

  const validateNewPassword = () => {
    const passwordSpecialCharacter = /(?=.*[!@#$&*])/;
    const passwordOneNumber = /(?=.*[0-9])/;
    const passwordSixValue = /(?=.{6,})/;

    if (!passwordInfo.newPassword) {
      setError((prev) => ({
        ...prev,
        newPassword: "Vui lòng nhập mật khẩu mới",
      }));
      return false;
    } else if (!passwordSpecialCharacter.test(passwordInfo.newPassword)) {
      setError((prev) => ({
        ...prev,
        newPassword: "Phải có ít nhất một ký tự đặc biệt",
      }));
      return false;
    } else if (!passwordOneNumber.test(passwordInfo.newPassword)) {
      setError((prev) => ({
        ...prev,
        newPassword: "Phải có ít nhất một số",
      }));
      return false;
    } else if (!passwordSixValue.test(passwordInfo.newPassword)) {
      setError((prev) => ({
        ...prev,
        newPassword: "Phải có ít nhất 6 ký tự",
      }));
      return false;
    }
    setError((prev) => ({
      ...prev,
      newPassword: "",
    }));
    return true;
  };

  const validateConfirmNewPassword = () => {
    if (!passwordInfo.confirmNewPassword) {
      setError((prev) => ({
        ...prev,
        confirmNewPassword: "Vui lòng nhập lại mật khẩu mới",
      }));
      return false;
    } else if (passwordInfo.confirmNewPassword !== passwordInfo.newPassword) {
      setError((prev) => ({
        ...prev,
        confirmNewPassword: "Mật khẩu nhập lại không khớp",
      }));
      return false;
    }
    setError((prev) => ({
      ...prev,
      confirmNewPassword: "",
    }));
    return true;
  };

  const handleChangePassword = async () => {
    setButtonSpinner(true);
    try {
      const isOldPasswordValid = validateOldPassword();
      const isNewPasswordValid = validateNewPassword();
      const isConfirmNewPasswordValid = validateConfirmNewPassword();

      if (!isOldPasswordValid) {
        Toast.show(error.oldPassword, { type: "danger", placement: "top", duration: 3000 });
        setButtonSpinner(false);
        return;
      }
      if (!isNewPasswordValid) {
        Toast.show(error.newPassword, { type: "danger", placement: "top", duration: 3000 });
        setButtonSpinner(false);
        return;
      }
      if (!isConfirmNewPasswordValid) {
        Toast.show(error.confirmNewPassword, { type: "danger", placement: "top", duration: 3000 });
        setButtonSpinner(false);
        return;
      }

      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      if (!accessToken || !refreshToken) {
        Toast.show("Vui lòng đăng nhập để đổi mật khẩu", { type: "warning" });
        router.push("/(routes)/login");
        return;
      }

      const response = await axios.put(
        `${SERVER_URI}/update-user-password`,
        {
          oldPassword: passwordInfo.oldPassword,
          newPassword: passwordInfo.newPassword,
        },
        {
          headers: {
            "access-token": accessToken,
            "refresh-token": refreshToken,
          },
        }
      );

      if (response.data.success) {
        Toast.show("Đổi mật khẩu thành công!", { type: "success" });
        router.back();
      }
    } catch (error: any) {
      Toast.show(error.response?.data?.message || "Đổi mật khẩu thất bại!", {
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
          <Text style={styles.headerText}>Đổi Mật Khẩu</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.container}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mật khẩu cũ:</Text>
            <TextInput
              style={styles.input}
              value={passwordInfo.oldPassword}
              onChangeText={(value) => setPasswordInfo({ ...passwordInfo, oldPassword: value })}
              placeholder="Nhập mật khẩu cũ"
              secureTextEntry={!isPasswordVisible.oldPassword}
              onSubmitEditing={validateOldPassword}
              returnKeyType="next"
            />
            <TouchableOpacity
              style={styles.visibleIcon}
              onPress={() =>
                setPasswordVisible({
                  ...isPasswordVisible,
                  oldPassword: !isPasswordVisible.oldPassword,
                })
              }
            >
              {isPasswordVisible.oldPassword ? (
                <Ionicons name="eye-off-outline" size={23} color={"#747474"} />
              ) : (
                <Ionicons name="eye-outline" size={23} color={"#747474"} />
              )}
            </TouchableOpacity>
            {error.oldPassword && (
              <Text style={styles.errorText}>{error.oldPassword}</Text>
            )}
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mật khẩu mới:</Text>
            <TextInput
              style={styles.input}
              value={passwordInfo.newPassword}
              onChangeText={(value) => setPasswordInfo({ ...passwordInfo, newPassword: value })}
              placeholder="Nhập mật khẩu mới"
              secureTextEntry={!isPasswordVisible.newPassword}
              onSubmitEditing={validateNewPassword}
              returnKeyType="next"
            />
            <TouchableOpacity
              style={styles.visibleIcon}
              onPress={() =>
                setPasswordVisible({
                  ...isPasswordVisible,
                  newPassword: !isPasswordVisible.newPassword,
                })
              }
            >
              {isPasswordVisible.newPassword ? (
                <Ionicons name="eye-off-outline" size={23} color={"#747474"} />
              ) : (
                <Ionicons name="eye-outline" size={23} color={"#747474"} />
              )}
            </TouchableOpacity>
            {error.newPassword && (
              <Text style={styles.errorText}>{error.newPassword}</Text>
            )}
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Xác nhận mật khẩu mới:</Text>
            <TextInput
              style={styles.input}
              value={passwordInfo.confirmNewPassword}
              onChangeText={(value) =>
                setPasswordInfo({ ...passwordInfo, confirmNewPassword: value })
              }
              placeholder="Xác nhận mật khẩu mới"
              secureTextEntry={!isPasswordVisible.confirmNewPassword}
              onSubmitEditing={validateConfirmNewPassword}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={styles.visibleIcon}
              onPress={() =>
                setPasswordVisible({
                  ...isPasswordVisible,
                  confirmNewPassword: !isPasswordVisible.confirmNewPassword,
                })
              }
            >
              {isPasswordVisible.confirmNewPassword ? (
                <Ionicons name="eye-off-outline" size={23} color={"#747474"} />
              ) : (
                <Ionicons name="eye-outline" size={23} color={"#747474"} />
              )}
            </TouchableOpacity>
            {error.confirmNewPassword && (
              <Text style={styles.errorText}>{error.confirmNewPassword}</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleChangePassword}
            disabled={buttonSpinner}
          >
            {buttonSpinner ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Đổi Mật Khẩu</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
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
    fontFamily: "Nunito_700Bold", // Sử dụng font giống LoginScreen
    color: "#333", // Đồng bộ màu chữ
  },
  container: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  inputContainer: {
    marginBottom: 20,
    position: "relative",
  },
  label: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: "#333",
    marginBottom: 5,
  },
  input: {
    height: 55, // Đồng bộ với LoginScreen
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
    backgroundColor: "white", // Đồng bộ màu nền
    color: "#333", // Đồng bộ màu chữ
  },
  visibleIcon: {
    position: "absolute",
    right: 10,
    top: 35,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    fontFamily: "Nunito_400Regular",
    marginTop: 5,
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
    fontFamily: "Nunito_600SemiBold",
  },
});