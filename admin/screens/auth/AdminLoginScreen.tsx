// screens/auth/AdminLoginScreen.tsx
import { ROLES } from '@/constants/constants';
import { useAuth } from '@/context/AuthContext';
import { authStyles } from '@/styles/auth/auth.styles';
import { commonStyles } from '@/styles/common/common.styles';
import api from '@/utils/api';
import { Nunito_400Regular, Nunito_500Medium, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Raleway_600SemiBold, Raleway_700Bold, useFonts } from '@expo-google-fonts/raleway';
import { Entypo } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Toast } from 'react-native-toast-notifications';
import CustomInput from '../../components/CustomInput';

const AdminLoginScreen = () => {
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

  const { setAuth } = useAuth();

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

 // screens/auth/AdminLoginScreen.tsx (trích đoạn)
const handleSignIn = async () => {
    setButtonSpinner(true);
  
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
  
    if (!isEmailValid || !isPasswordValid) {
      setButtonSpinner(false);
      return;
    }
  
    try {
      const res = await api.post(`/login`, {
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
  
      if (user.role !== ROLES.ADMIN) {
        Toast.show("Bạn không có quyền truy cập khu vực Admin!", {
          type: "danger",
          placement: "top",
          duration: 3000,
        });
        setButtonSpinner(false);
        return;
      }
  
      setAuth(accessToken, refreshToken, user);
      Toast.show("Đăng nhập thành công!", {
        type: "success",
        placement: "top",
        duration: 3000,
      });
  
      router.push("/(admin)/dashboard"); // Điều hướng đến (admin)/dashboard sau khi đăng nhập
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
        <Image style={authStyles.signInImage} source={require('@/assets/sign-in/sign_in.png')} />
        <Text style={[authStyles.welcomeText, { fontFamily: "Raleway_700Bold" }]}>
          Đăng Nhập Admin
        </Text>
        <Text style={authStyles.learningText}>
          Đăng nhập vào tài khoản Admin EduBridge
        </Text>
        <View style={authStyles.inputContainer}>
          <View>
            <CustomInput
              iconName="mail-outline"
              keyboardType="email-address"
              value={userInfo.email}
              placeholder="Nhập Email"
              onChangeText={(value) => setUserInfo({ ...userInfo, email: value })}
              onSubmitEditing={validateEmail}
              returnKeyType="next"
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
              <CustomInput
                iconName="lock-closed-outline"
                secureTextEntry
                isPasswordVisible={isPasswordVisible}
                togglePasswordVisibility={() => setPasswordVisible(!isPasswordVisible)}
                value={userInfo.password}
                placeholder="Mật Khẩu"
                onChangeText={(value) => setUserInfo({ ...userInfo, password: value })}
                onSubmitEditing={handleSignIn}
                returnKeyType="done"
              />
              {error.password && (
                <View style={[commonStyles.errorContainer, { top: 145 }]}>
                  <Entypo name="cross" size={18} color={"red"} />
                  <Text style={{ color: "red", fontSize: 11, marginTop: -1 }}>
                    {error.password}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push("../(routes)/forgot-password")}>
            <Text
              style={[authStyles.forgotSection, { fontFamily: "Nunito_600SemiBold", color: "blue" }]}
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
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default AdminLoginScreen;