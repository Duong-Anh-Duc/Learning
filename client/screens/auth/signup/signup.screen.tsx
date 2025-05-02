// frontend/app/(routes)/signup/index.tsx
import { commonStyles } from "@/styles/common/common.styles";
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
import {
  AntDesign,
  Entypo,
  FontAwesome,
  Fontisto,
  Ionicons,
  SimpleLineIcons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
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

export default function SignUpScreen() {
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [buttonSpinner, setButtonSpinner] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [required, setRequired] = useState("");
  const [error, setError] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  let [fontsLoaded, fontError] = useFonts({
    Raleway_600SemiBold,
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_700Bold,
    Nunito_600SemiBold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Kiểm tra ký tự đặc biệt trong tên người dùng
  const validateName = () => {
    const specialCharacterRegex = /[!@#$%^&*()+=[\]{};':"\\|,.<>?]/;
    if (!userInfo.name) {
      setError((prev) => ({
        ...prev,
        name: "Vui lòng nhập tên người dùng",
      }));
      return false;
    } else if (specialCharacterRegex.test(userInfo.name)) {
      setError((prev) => ({
        ...prev,
        name: "Tên người dùng không được chứa ký tự đặc biệt",
      }));
      return false;
    }
    setError((prev) => ({
      ...prev,
      name: "",
    }));
    return true;
  };

  // Kiểm tra định dạng email (không gọi API /registration ở đây)
  const validateEmail = () => {
    const specialCharacterRegex = /[^a-zA-Z0-9@._-]/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex kiểm tra định dạng email cơ bản
    if (!userInfo.email) {
      setError((prev) => ({
        ...prev,
        email: "Vui lòng nhập email",
      }));
      return false;
    } else if (specialCharacterRegex.test(userInfo.email)) {
      setError((prev) => ({
        ...prev,
        email: "Email không được chứa ký tự đặc biệt ngoài @, ., _, -",
      }));
      return false;
    } else if (!emailRegex.test(userInfo.email)) {
      setError((prev) => ({
        ...prev,
        email: "Email không hợp lệ",
      }));
      return false;
    }
    setError((prev) => ({
      ...prev,
      email: "",
    }));
    return true;
  };

  const validatePassword = () => {
    const password = userInfo.password;
    const passwordSpecialCharacter = /(?=.*[!@#$&*])/;
    const passwordOneNumber = /(?=.*[0-9])/;
    const passwordSixValue = /(?=.{6,})/;

    if (!password) {
      setError((prev) => ({
        ...prev,
        password: "Vui lòng nhập mật khẩu",
      }));
      return false;
    } else if (!passwordSpecialCharacter.test(password)) {
      setError((prev) => ({
        ...prev,
        password: "Phải có ít nhất một ký tự đặc biệt",
      }));
      return false;
    } else if (!passwordOneNumber.test(password)) {
      setError((prev) => ({
        ...prev,
        password: "Phải có ít nhất một số",
      }));
      return false;
    } else if (!passwordSixValue.test(password)) {
      setError((prev) => ({
        ...prev,
        password: "Phải có ít nhất 6 ký tự",
      }));
      return false;
    }
    setError((prev) => ({
      ...prev,
      password: "",
    }));
    return true;
  };

  const validateConfirmPassword = () => {
    if (!userInfo.confirmPassword) {
      setError((prev) => ({
        ...prev,
        confirmPassword: "Vui lòng nhập lại mật khẩu",
      }));
      return false;
    } else if (userInfo.confirmPassword !== userInfo.password) {
      setError((prev) => ({
        ...prev,
        confirmPassword: "Mật khẩu nhập lại không khớp",
      }));
      return false;
    }
    setError((prev) => ({
      ...prev,
      confirmPassword: "",
    }));
    return true;
  };

  const handleSignUp = async () => {
    setButtonSpinner(true);
    try {
      // Validate tất cả các trường khi nhấn "Đăng ký"
      const isNameValid = validateName();
      const isEmailValid = validateEmail(); // Chỉ kiểm tra định dạng email
      const isPasswordValid = validatePassword();
      const isConfirmPasswordValid = validateConfirmPassword();

      // Hiển thị thông báo cụ thể dựa trên lỗi đầu tiên
      if (!isNameValid) {
        Toast.show(error.name, {
          type: "danger",
          placement: "top",
          duration: 3000,
        });
        setButtonSpinner(false);
        return;
      }
      if (!isEmailValid) {
        Toast.show(error.email, {
          type: "danger",
          placement: "top",
          duration: 3000,
        });
        setButtonSpinner(false);
        return;
      }
      if (!isPasswordValid) {
        Toast.show(error.password, {
          type: "danger",
          placement: "top",
          duration: 3000,
        });
        setButtonSpinner(false);
        return;
      }
      if (!isConfirmPasswordValid) {
        Toast.show(error.confirmPassword, {
          type: "danger",
          placement: "top",
          duration: 3000,
        });
        setButtonSpinner(false);
        return;
      }

      // Chỉ gọi API nếu tất cả validate đều pass
      console.log("Sending registration request:", userInfo);
      const res = await axios.post(`${SERVER_URI}/registration`, {
        name: userInfo.name,
        email: userInfo.email,
        password: userInfo.password,
      });

      console.log("Registration response:", res.data);

      await AsyncStorage.setItem("activation_token", res.data.activationToken);
      Toast.show(res.data.message, {
        type: "success",
      });
      setUserInfo({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setButtonSpinner(false);

      console.log("Navigating to verifyAccount...");
      router.push("/(routes)/verifyAccount");
    } catch (error: any) {
      console.error("Error during registration:", error.response?.data || error.message);
      setButtonSpinner(false);
      Toast.show(error.response?.data?.message || "Đăng ký thất bại, vui lòng thử lại!", {
        type: "danger",
      });
    }
  };

  return (
    <LinearGradient
      colors={["#009990", "#F6F7F9"]}
      style={{ flex: 1, paddingTop: 20 }}
    >
      <ScrollView>
        <Image
          style={styles.signInImage}
          source={require("@/assets/sign-in/signup.png")}
        />
        <Text style={[styles.welcomeText, { fontFamily: "Raleway_700Bold" }]}>
          Bắt đầu thôi!
        </Text>
        <Text style={styles.learningText}>
          Tạo tài khoản để sử dụng đầy đủ tính năng của EduBridge
        </Text>
        <View style={styles.inputContainer}>
          <View>
            <TextInput
              style={[styles.input, { paddingLeft: 40, marginBottom: -12 }]}
              keyboardType="default"
              value={userInfo.name}
              placeholder="Tên người dùng"
              onChangeText={(value) => setUserInfo({ ...userInfo, name: value })}
              onSubmitEditing={validateName} // Validate khi nhấn "Done"/"Submit"
              returnKeyType="next"
            />
            <AntDesign
              style={{ position: "absolute", left: 26, top: 14 }}
              name="user"
              size={20}
              color={"#A1A1A1"}
            />
            {error.name && (
              <View style={[commonStyles.errorContainer, { top: 70 }]}>
                <Entypo name="cross" size={18} color={"red"} />
                <Text style={{ color: "red", fontSize: 11, marginTop: -1 }}>
                  {error.name}
                </Text>
              </View>
            )}
          </View>
          <View>
            <TextInput
              style={[styles.input, { paddingLeft: 40 }]}
              keyboardType="email-address"
              value={userInfo.email}
              placeholder="Nhập Email"
              onChangeText={(value) => setUserInfo({ ...userInfo, email: value })}
              onSubmitEditing={validateEmail} // Validate khi nhấn "Done"/"Submit"
              returnKeyType="next"
            />
            <Fontisto
              style={{ position: "absolute", left: 26, top: 17.8 }}
              name="email"
              size={20}
              color={"#A1A1A1"}
            />
            {error.email && (
              <View style={[commonStyles.errorContainer, { top: 70 }]}>
                <Entypo name="cross" size={18} color={"red"} />
                <Text style={{ color: "red", fontSize: 11, marginTop: -1 }}>
                  {error.email}
                </Text>
              </View>
            )}
            <View style={{ marginTop: 15 }}>
              <TextInput
                style={[styles.input, { paddingLeft: 40 }]}
                keyboardType="default"
                secureTextEntry={!isPasswordVisible}
                value={userInfo.password}
                placeholder="Mật khẩu"
                onChangeText={(value) => setUserInfo({ ...userInfo, password: value })}
                onSubmitEditing={validatePassword} // Validate khi nhấn "Done"/"Submit"
                returnKeyType="next"
              />
              <TouchableOpacity
                style={styles.visibleIcon}
                onPress={() => setPasswordVisible(!isPasswordVisible)}
              >
                {isPasswordVisible ? (
                  <Ionicons
                    name="eye-off-outline"
                    size={23}
                    color={"#747474"}
                  />
                ) : (
                  <Ionicons name="eye-outline" size={23} color={"#747474"} />
                )}
              </TouchableOpacity>
              <SimpleLineIcons
                style={styles.icon2}
                name="lock"
                size={20}
                color={"#A1A1A1"}
              />
            </View>
            {error.password && (
              <View style={[commonStyles.errorContainer, { top: 145 }]}>
                <Entypo name="cross" size={18} color={"red"} />
                <Text style={{ color: "red", fontSize: 11, marginTop: -1 }}>
                  {error.password}
                </Text>
              </View>
            )}

            <View style={{ marginTop: 15 }}>
              <TextInput
                style={[styles.input, { paddingLeft: 40 }]}
                keyboardType="default"
                secureTextEntry={!isConfirmPasswordVisible}
                value={userInfo.confirmPassword}
                placeholder="Nhập lại mật khẩu"
                onChangeText={(value) => setUserInfo({ ...userInfo, confirmPassword: value })}
                onSubmitEditing={handleSignUp} // Gọi handleSignUp khi nhấn "Done"/"Submit"
                returnKeyType="done"
              />
              <TouchableOpacity
                style={styles.visibleIcon}
                onPress={() => setConfirmPasswordVisible(!isConfirmPasswordVisible)}
              >
                {isConfirmPasswordVisible ? (
                  <Ionicons
                    name="eye-off-outline"
                    size={23}
                    color={"#747474"}
                  />
                ) : (
                  <Ionicons name="eye-outline" size={23} color={"#747474"} />
                )}
              </TouchableOpacity>
              <SimpleLineIcons
                style={styles.icon2}
                name="lock"
                size={20}
                color={"#A1A1A1"}
              />
            </View>
            {error.confirmPassword && (
              <View style={[commonStyles.errorContainer, { top: 240 }]}> {/* Điều chỉnh top để hiển thị rõ hơn */}
                <Entypo name="cross" size={18} color={"red"} />
                <Text style={{ color: "red", fontSize: 11, marginTop: -1 }}>
                  {error.confirmPassword}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={{
              padding: 16,
              borderRadius: 8,
              marginHorizontal: 16,
              backgroundColor: "#009990",
              marginTop: 50, // Tăng marginTop để tạo không gian cho thông báo lỗi
            }}
            onPress={handleSignUp}
          >
            {buttonSpinner ? (
              <ActivityIndicator size="small" color={"white"} />
            ) : (
              <Text
                style={{
                  color: "white",
                  textAlign: "center",
                  fontSize: 16,
                  fontFamily: "Raleway_700Bold",
                }}
              >
                Đăng ký
              </Text>
            )}
          </TouchableOpacity>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 20,
              gap: 10,
            }}
          >
            <TouchableOpacity>
              <FontAwesome name="google" size={30} />
            </TouchableOpacity>
            <TouchableOpacity>
              <FontAwesome name="github" size={30} />
            </TouchableOpacity>
          </View>

          <View style={styles.signupRedirect}>
            <Text style={{ fontSize: 18, fontFamily: "Raleway_600SemiBold" }}>
              Bạn đã có tài khoản?
            </Text>
            <TouchableOpacity onPress={() => router.push("/(routes)/login")}>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "Raleway_600SemiBold",
                  color: "#009990",
                  marginLeft: 5,
                }}
              >
                Đăng nhập
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  signInImage: {
    width: "60%",
    height: 250,
    alignSelf: "center",
    marginTop: 50,
  },
  welcomeText: {
    textAlign: "center",
    fontSize: 24,
  },
  learningText: {
    textAlign: "center",
    color: "#575757",
    fontSize: 15,
    marginTop: 5,
  },
  inputContainer: {
    marginHorizontal: 16,
    marginTop: 30,
    rowGap: 30,
  },
  input: {
    height: 55,
    marginHorizontal: 16,
    borderRadius: 8,
    paddingLeft: 35,
    fontSize: 16,
    backgroundColor: "white",
    color: "#333",
  },
  visibleIcon: {
    position: "absolute",
    right: 30,
    top: 15,
  },
  icon2: {
    position: "absolute",
    left: 23,
    top: 17.8,
    marginTop: -2,
  },
  forgotSection: {
    marginHorizontal: 16,
    textAlign: "right",
    fontSize: 16,
    marginTop: 10,
  },
  signupRedirect: {
    flexDirection: "row",
    marginHorizontal: 16,
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 20,
  },
});