// frontend/app/(routes)/login/index.tsx
import { useCart } from '@/context/CartContext'; // Thêm import
import { commonStyles } from '@/styles/common/common.styles';
import { SERVER_URI } from '@/utils/uri';
import { Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Raleway_600SemiBold, Raleway_700Bold, useFonts } from '@expo-google-fonts/raleway';
import { FontAwesome, Fontisto, Ionicons, SimpleLineIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from 'axios';
import { LinearGradient } from "expo-linear-gradient";
import { router } from 'expo-router';
import { Entypo } from 'expo-vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Toast } from 'react-native-toast-notifications';

const LoginScreen = () => {
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [buttonSpinner, setButtonSpinner] = useState(false);
  const [userInfo, setUserInfo] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState({
    email: "",
    password: "",
  });

  const { fetchCart } = useCart(); // Lấy fetchCart từ CartContext

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

  const validateEmail = () => {
    if (!userInfo.email) {
      setError((prev) => ({
        ...prev,
        email: "Vui lòng nhập email",
      }));
      Toast.show("Vui lòng nhập email!", {
        type: "danger",
        placement: "top",
        duration: 3000,
      });
      return false;
    }
    setError((prev) => ({
      ...prev,
      email: "",
    }));
    return true;
  };

  const validatePassword = () => {
    if (!userInfo.password) {
      setError((prev) => ({
        ...prev,
        password: "Vui lòng nhập mật khẩu",
      }));
      Toast.show("Vui lòng nhập mật khẩu!", {
        type: "danger",
        placement: "top",
        duration: 3000,
      });
      return false;
    }
    setError((prev) => ({
      ...prev,
      password: "",
    }));
    return true;
  };

  const handleSignIn = async () => {
    setButtonSpinner(true);

    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();

    if (!isEmailValid || !isPasswordValid) {
      setButtonSpinner(false);
      return;
    }

    try {
      const res = await axios.post(`${SERVER_URI}/login`, {
        email: userInfo.email,
        password: userInfo.password,
      });

      const { accessToken, refreshToken, user } = res.data;

      if (!accessToken) {
        throw new Error("Thiếu accessToken trong phản hồi");
      }
      if (!refreshToken) {
        throw new Error("Thiếu refreshToken trong phản hồi");
      }

      await AsyncStorage.setItem("access_token", accessToken);
      await AsyncStorage.setItem("refresh_token", refreshToken);
      Toast.show("Đăng nhập thành công!", {
        type: "success",
        placement: "top",
        duration: 3000,
      });

      // Gọi fetchCart ngay sau khi đăng nhập thành công
      await fetchCart();

      router.push("/(tabs)");
    } catch (error: any) {
      console.error("Lỗi đăng nhập:", error.response?.data || error.message);
      Toast.show(error.response?.data?.message || "Email hoặc mật khẩu không đúng!", {
        type: "danger",
        placement: "top",
        duration: 3000,
      });
    } finally {
      setButtonSpinner(false);
    }
  };

  return (
    <LinearGradient colors={["#009990", "#F6F7F9"]} style={{ flex: 1, paddingTop: 20 }}>
      <ScrollView>
        <Image style={styles.signInImage} source={require('@/assets/sign-in/sign_in.png')} />
        <Text style={[styles.welcomeText, { fontFamily: "Raleway_700Bold" }]}>Chào Mừng Bạn Trở Lại!</Text>
        <Text style={styles.learningText}>Đăng nhập vào tài khoản EduBridge của bạn</Text>
        <View style={styles.inputContainer}>
          <View>
            <TextInput
              style={[styles.input, { paddingLeft: 40 }]}
              keyboardType='email-address'
              value={userInfo.email}
              placeholder='Nhập Email'
              onChangeText={(value) => setUserInfo({ ...userInfo, email: value })}
              onSubmitEditing={validateEmail}
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
                keyboardType='default'
                secureTextEntry={!isPasswordVisible}
                value={userInfo.password}
                placeholder='Mật Khẩu'
                onChangeText={(value) => setUserInfo({ ...userInfo, password: value })}
                onSubmitEditing={handleSignIn}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={styles.visibleIcon}
                onPress={() => setPasswordVisible(!isPasswordVisible)}
              >
                {isPasswordVisible ? (
                  <Ionicons name="eye-off-outline" size={23} color={"#747474"} />
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
          </View>
          <TouchableOpacity onPress={() => router.push("../(routes)/forgot-password")}>
            <Text
              style={[styles.forgotSection, { fontFamily: "Nunito_600SemiBold", color: "blue" }]}
            >
              Quên Mật Khẩu?
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              padding: 16,
              borderRadius: 8,
              marginHorizontal: 16,
              backgroundColor: "#009990",
              marginTop: 15,
            }}
            onPress={handleSignIn}
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
                Đăng Nhập
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
              Chưa có tài khoản?
            </Text>
            <TouchableOpacity onPress={() => router.push("../(routes)/sign-up")}>
              <Text
                style={{
                  fontSize: 18,
                  fontFamily: "Raleway_600SemiBold",
                  color: "#009990",
                  marginLeft: 5,
                }}
              >
                Đăng Ký
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

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

export default LoginScreen;