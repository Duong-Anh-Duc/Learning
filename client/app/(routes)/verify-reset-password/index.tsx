import { SERVER_URI } from "@/utils/uri";
import {
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    useFonts,
} from "@expo-google-fonts/nunito";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Toast } from "react-native-toast-notifications";
  
  export default function VerifyResetPassword() {
    let [fontsLoaded, fontError] = useFonts({
      Nunito_600SemiBold,
      Nunito_700Bold,
      Nunito_400Regular,
    });
  
    const { resetToken } = useLocalSearchParams();
    const [resetCode, setResetCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
  
    const handleResetPassword = async () => {
      if (!resetCode || !newPassword) {
        Toast.show("Vui lòng nhập mã đặt lại và mật khẩu mới", { type: "warning" });
        return;
      }
  
      setLoading(true);
      try {
        const res = await axios.post(`${SERVER_URI}/reset-password`, {
          resetToken,
          resetCode,
          newPassword,
        });
        Toast.show(res.data.message, { type: "success" });
        router.push("/(routes)/login");
      } catch (error: any) {
        Toast.show(error.response?.data?.message || "Không thể đặt lại mật khẩu", {
          type: "danger",
        });
      } finally {
        setLoading(false);
      }
    };
  
    if (!fontsLoaded && !fontError) {
      return null;
    }
  
    return (
      <LinearGradient colors={["#009990", "#F6F7F9"]} style={styles.container}>
        <Text style={[styles.headerText, { fontFamily: "Nunito_600SemiBold" }]}>
          Xác Minh Mã Đặt Lại
        </Text>
        <TextInput
          style={[styles.input, { fontFamily: "Nunito_400Regular" }]}
          placeholder="Nhập mã đặt lại"
          keyboardType="numeric"
          value={resetCode}
          onChangeText={setResetCode}
        />
        <TextInput
          style={[styles.input, { fontFamily: "Nunito_400Regular" }]}
          placeholder="Nhập mật khẩu mới"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleResetPassword}
          disabled={loading}
        >
          <Text style={[styles.buttonText, { fontFamily: "Nunito_600SemiBold" }]}>
            {loading ? "Đang đặt lại..." : "Đặt Lại Mật Khẩu"}
          </Text>
        </TouchableOpacity>
        <View style={styles.loginLink}>
          <Text style={[styles.backText, { fontFamily: "Nunito_700Bold" }]}>
            Quay lại để?
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.loginText, { fontFamily: "Nunito_700Bold" }]}>
              Đăng Nhập
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
    },
    headerText: {
      fontSize: 18,
      textAlign: "center",
      marginBottom: 20,
    },
    input: {
      width: "100%",
      height: 50,
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 5,
      padding: 10,
      marginBottom: 20,
    },
    button: {
      backgroundColor: "#009990",
      width: "100%",
      height: 45,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 5,
    },
    buttonText: {
      color: "white",
      fontSize: 16,
    },
    loginLink: {
      flexDirection: "row",
      marginTop: 30,
    },
    loginText: {
      color: "#009990",
      marginLeft: 5,
      fontSize: 16,
    },
    backText: { fontSize: 16 },
  });