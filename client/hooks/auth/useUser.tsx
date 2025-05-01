// frontend/hooks/auth/useUser.tsx
import { SERVER_URI } from "@/utils/uri";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Toast } from "react-native-toast-notifications";

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: {
    public_id: string;
    url: string;
  };
  role: string;
  isVerified: boolean;
  courses: Array<{ courseId: string }>;
}

export default function useUser() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string>("");
  const [refetch, setRefetch] = useState(false);

  const refreshTokenAndRetry = async (originalRequest: () => Promise<any>) => {
    try {
      const refreshToken = await AsyncStorage.getItem("refresh_token");
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await axios.post(
        `${SERVER_URI}/refresh-token`,
        {},
        {
          headers: {
            "refresh-token": refreshToken,
          },
        }
      );

      const newAccessToken = response.data.accessToken;
      await AsyncStorage.setItem("access_token", newAccessToken);
      return await originalRequest();
    } catch (error: any) {
      Toast.show("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.", { type: "warning" });
      await AsyncStorage.removeItem("access_token");
      await AsyncStorage.removeItem("refresh_token");
      router.push("/(routes)/login");
      throw error;
    }
  };

  const fetchUser = async () => {
    const originalRequest = async () => {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      return await axios.get(`${SERVER_URI}/me`, {
        headers: {
          "access-token": accessToken,
          "refresh-token": refreshToken,
        },
      });
    };

    try {
      setLoading(true);
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      if (!accessToken || !refreshToken) {
        setLoading(false);
        return;
      }

      let response = await originalRequest();
      let newAccessToken = response.headers["access-token"];
      if (newAccessToken) {
        await AsyncStorage.setItem("access_token", newAccessToken);
      }

      setUser(response.data.user);
      setError("");
    } catch (error: any) {
      if (error.response?.status === 401) {
        let response = await originalRequest();
        try {
          response = await refreshTokenAndRetry(originalRequest);
          const newAccessToken = response.headers["access-token"];
          if (newAccessToken) {
            await AsyncStorage.setItem("access_token", newAccessToken);
          }
      
          setUser(response.data.user);
          setError("");
        } catch (refreshError) {
          setError("Không thể làm mới token");
        }
      } else {
        setError(error?.message || "Lỗi khi lấy thông tin người dùng");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [refetch]);

  const refreshUser = async () => {
    setRefetch((prev) => !prev);
  };

  return { loading, user, error, setRefetch, refetch, refreshUser };
}