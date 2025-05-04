// frontend/context/UserContext.tsx
import socket, { connectSocket, disconnectSocket } from "@/utils/socket";
import { SERVER_URI } from "@/utils/uri";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Toast } from "react-native-toast-notifications";

interface IUser {
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

interface UserContextType {
  user: IUser | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<IUser | null>>;
  fetchUser: () => Promise<void>;
  notifications: Array<{ id: string; message: string; type: string }>;
  clearNotifications: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: string }>>([]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      if (!accessToken || !refreshToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await axios.get(`${SERVER_URI}/me`, {
        headers: {
          "access-token": accessToken,
          "refresh-token": refreshToken,
        },
      });

      setUser(response.data.user);
    } catch (error: any) {
      console.error("Error fetching user:", error);
      if (error.response?.status === 401) {
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

          // Retry fetching user with new token
          const retryResponse = await axios.get(`${SERVER_URI}/me`, {
            headers: {
              "access-token": newAccessToken,
              "refresh-token": refreshToken,
            },
          });

          setUser(retryResponse.data.user);
        } catch (refreshError: any) {
          console.error("Error refreshing token:", refreshError);
          Toast.show("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.", {
            type: "warning",
            placement: "top",
            duration: 4000,
            animationType: "zoom-in",
          });
          setUser(null);
        }
      } else {
        Toast.show("Không thể lấy thông tin người dùng. Vui lòng thử lại sau.", {
          type: "danger",
          placement: "top",
          duration: 4000,
          animationType: "zoom-in",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const addNotification = (message: string, type: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { id, message, type }]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  useEffect(() => {
    fetchUser();

    const initializeSocket = async () => {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      if (accessToken && refreshToken && user?._id) {
        connectSocket(accessToken, refreshToken, user._id);

        socket.on("connect", () => {
          console.log("Connected to WebSocket server");
        });

        socket.on("userUpdated", (updatedUser: IUser) => {
          setUser(updatedUser);
          Toast.show("Thông tin người dùng đã được cập nhật!", { type: "success" });
        });

        socket.on("newCourse", (data: { message: string; course: any }) => {
          addNotification(data.message, "newCourse");
          Toast.show(data.message, { type: "info" });
        });

        socket.on("orderSuccess", (data: { message: string; order: any }) => {
          addNotification(data.message, "orderSuccess");
          Toast.show(data.message, { type: "success" });
        });

        socket.on("courseUpdated", (data: { message: string; course: any }) => {
          addNotification(data.message, "courseUpdated");
          Toast.show(data.message, { type: "info" });
        });

        socket.on("newLesson", (data: { message: string; courseId: string; lesson: any }) => {
          addNotification(data.message, "newLesson");
          Toast.show(data.message, { type: "info" });
        });

        socket.on("disconnect", () => {
          console.log("Disconnected from WebSocket server");
        });
      }
    };

    if (user?._id) {
      initializeSocket();
    }

    return () => {
      disconnectSocket();
      socket.off("connect");
      socket.off("userUpdated");
      socket.off("newCourse");
      socket.off("orderSuccess");
      socket.off("courseUpdated");
      socket.off("newLesson");
      socket.off("disconnect");
    };
  }, [user?._id]);

  return (
    <UserContext.Provider value={{ user, loading, setUser, fetchUser, notifications, clearNotifications }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};