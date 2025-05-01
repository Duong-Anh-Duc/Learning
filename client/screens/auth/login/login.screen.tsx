import { View, Text, ScrollView, Image, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Entypo, Fontisto, Ionicons, SimpleLineIcons, FontAwesome } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useFonts, Raleway_700Bold, Raleway_600SemiBold } from '@expo-google-fonts/raleway'
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_500Medium, Nunito_700Bold } from '@expo-google-fonts/nunito'
import { useState } from 'react'
import { commonStyles } from '@/styles/common/common.styles'
import { router } from 'expo-router'
import { SERVER_URI } from '@/utils/uri'
import { Toast } from 'react-native-toast-notifications'
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from 'axios';

const LoginScreen = () => {
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const [buttonSpinner, setButtonSpinner] = useState(false);
  const [userInfo, setUserInfo] = useState({
    email: "",
    password: "",
  });
  const [required, setRequired] = useState("");
  const [error, setError] = useState({
    password: "",
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

  const handlePasswordValidation = (value: string) => {
    const password = value;
    const passwordSpecialCharacter = /(?=.*[!@#$&*])/;
    const passwordOneNumber = /(?=.*[0-9])/;
    const passwordSixValue = /(?=.{6,})/;

    if (!passwordSpecialCharacter.test(password)) {
      setError({
        ...error,
        password: "Nhập ít nhất một ký tự đặc biệt",
      });
      setUserInfo({ ...userInfo, password: "" });
    } else if (!passwordOneNumber.test(password)) {
      setError({
        ...error,
        password: "Nhập ít nhất một số",
      });
      setUserInfo({ ...userInfo, password: "" });
    } else if (!passwordSixValue.test(password)) {
      setError({
        ...error,
        password: "Nhập ít nhất 6 ký tự",
      });
      setUserInfo({ ...userInfo, password: "" });
    } else {
      setError({
        ...error,
        password: "",
      });
      setUserInfo({ ...userInfo, password: value });
    }
  };

  const handleSignIn = async () => {
    setButtonSpinner(true);
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
      router.push("/(tabs)");
    } catch (error: any) {
      console.error("Lỗi đăng nhập:", error.message);
      Toast.show(error.message || "Email hoặc mật khẩu không đúng!", {
        type: "danger",
      });
    } finally {
      setButtonSpinner(false);
    }
  };

  return (
    <LinearGradient colors={["#009990","#F6F7F9"]} style={{flex:1,paddingTop:20}}>
      <ScrollView>
        <Image style={styles.signInImage} source={require('@/assets/sign-in/sign_in.png')}/>
        <Text style={[styles.welcomeText,{fontFamily:"Raleway_700Bold"}]}> Chào Mừng Bạn Trở Lại!</Text>
        <Text style={styles.learningText}> Đăng nhập vào tài khoản EduBridge của bạn</Text>
        <View style={styles.inputContainer}>
          <View>
            <TextInput 
            style={[styles.input,{paddingLeft:40}]} 
            keyboardType='email-address' 
            value={userInfo.email} 
            placeholder='abc@gmail.com' 
            onChangeText={(value)=>setUserInfo({...userInfo,email:value})}/>
            <Fontisto style={{position:"absolute",left:26,top:17.8}} 
            name="email" size={20} color={"#A1A1A1"}/>
            {required && (
              <View style={commonStyles.errorContainer}>
               <Entypo name="cross" size={18} color={"red"}/> 
              </View>
            )}
            <View style={{marginTop:15}}>
              <TextInput style={commonStyles.input}
              keyboardType='default'
              secureTextEntry={!isPasswordVisible}
              defaultValue=''
              placeholder='**********'
              onChangeText={handlePasswordValidation}/>
              <TouchableOpacity style={styles.visibleIcon} onPress={()=>setPasswordVisible(!isPasswordVisible)}>
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
          </View>
          <TouchableOpacity
              onPress={() => router.push("../(routes)/forgot-password")}
            >
              <Text
                style={[
                  styles.forgotSection,
                  { fontFamily: "Nunito_600SemiBold",color:"blue" },
                ]}
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
              <Text style={{ fontSize: 18, fontFamily: "Raleway_600SemiBold"}}>
                Chưa có tài khoản?
              </Text>
              <TouchableOpacity
                onPress={() => router.push("../(routes)/sign-up")}
              >
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
  }

const styles=StyleSheet.create({
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
    color: "#A1A1A1",
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

export default LoginScreen