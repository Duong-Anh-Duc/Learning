// // screens/auth/ForgotPasswordScreen.tsx
// import api from '@/utils/api';
// import {
//     Nunito_400Regular,
//     Nunito_600SemiBold,
//     Nunito_700Bold,
//     useFonts,
// } from "@expo-google-fonts/nunito";
// import { LinearGradient } from "expo-linear-gradient";
// import { router } from "expo-router";
// import { useState } from "react";
// import {
//     StyleSheet,
//     Text,
//     TextInput,
//     TouchableOpacity,
//     View,
// } from "react-native";
// import { Toast } from "react-native-toast-notifications";

// export default function ForgotPasswordScreen() {
//   let [fontsLoaded, fontError] = useFonts({
//     Nunito_600SemiBold,
//     Nunito_700Bold,
//     Nunito_400Regular,
//   });

//   const [email, setEmail] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleSendResetEmail = async () => {
//     if (!email) {
//       Toast.show("Vui lòng nhập email của bạn", { type: "warning" });
//       return;
//     }

//     setLoading(true);
//     try {
//       const res = await api.post(`/forgot-password`, { email });
//       Toast.show(res.data.message, { type: "success" });
//       router.push({
//         pathname: "/(routes)/verify-reset-password",
//         params: { resetToken: res.data.resetToken },
//       });
//     } catch (error: any) {
//       let errorMessage = "Không thể gửi email đặt lại mật khẩu";
//       if (error.response) {
//         errorMessage = error.response.data.message || errorMessage;
//       } else if (error.code === "ECONNABORTED") {
//         errorMessage = "Yêu cầu hết thời gian. Vui lòng kiểm tra kết nối mạng.";
//       } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
//         errorMessage = "Không thể kết nối với máy chủ. Vui lòng đảm bảo máy chủ đang chạy và URL máy chủ chính xác.";
//       } else {
//         errorMessage = error.message || errorMessage;
//       }
//       console.error("Lỗi gọi API:", errorMessage);
//       Toast.show(errorMessage, { type: "danger" });
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!fontsLoaded && !fontError) {
//     return null;
//   }

//   return (
//     <LinearGradient colors={["#009990", "#F6F7F9"]} style={styles.container}>
//       <Text style={[styles.headerText, { fontFamily: "Nunito_600SemiBold" }]}>
//         Đặt Lại Mật Khẩu Qua Email
//       </Text>
//       <TextInput
//         style={[styles.input, { fontFamily: "Nunito_400Regular" }]}
//         placeholder="Username@gmail.com"
//         keyboardType="email-address"
//         value={email}
//         onChangeText={setEmail}
//       />
//       <TouchableOpacity
//         style={styles.button}
//         onPress={handleSendResetEmail}
//         disabled={loading}
//       >
//         <Text style={[styles.buttonText, { fontFamily: "Nunito_600SemiBold" }]}>
//           {loading ? "Đang gửi..." : "Gửi"}
//         </Text>
//       </TouchableOpacity>
//       <View style={styles.loginLink}>
//         <Text style={[styles.backText, { fontFamily: "Nunito_700Bold" }]}>
//           Quay lại để?
//         </Text>
//         <TouchableOpacity onPress={() => router.back()}>
//           <Text style={[styles.loginText, { fontFamily: "Nunito_700Bold" }]}>
//             Đăng Nhập
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </LinearGradient>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingHorizontal: 20,
//   },
//   headerText: {
//     fontSize: 18,
//     textAlign: "center",
//     marginBottom: 20,
//     color: "#333",
//   },
//   input: {
//     width: "100%",
//     height: 55,
//     borderRadius: 8,
//     padding: 10,
//     marginBottom: 20,
//     backgroundColor: "white",
//     color: "#333",
//     fontSize: 16,
//   },
//   button: {
//     backgroundColor: "#009990",
//     width: "100%",
//     height: 45,
//     justifyContent: "center",
//     alignItems: "center",
//     borderRadius: 5,
//   },
//   buttonText: {
//     color: "white",
//     fontSize: 16,
//   },
//   loginLink: {
//     flexDirection: "row",
//     marginTop: 30,
//   },
//   loginText: {
//     color: "#009990",
//     marginLeft: 5,
//     fontSize: 16,
//   },
//   backText: {
//     fontSize: 16,
//     color: "#575757",
//   },
// });