// frontend/context/CartContext.tsx
import { CoursesType } from "@/types/courses";
import { SERVER_URI } from "@/utils/uri";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Toast } from "react-native-toast-notifications";

type CartItemType = {
  courseId: string;
  courseName: string;
  priceAtPurchase: number;
  thumbnail?: {
    public_id: string;
    url: string;
  };
};

interface CartContextType {
  cartItems: CartItemType[];
  addToCart: (course: CoursesType) => Promise<void>;
  removeFromCart: (courseId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
  isFetching: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [isFetching, setIsFetching] = useState(false);

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

  const makeAuthenticatedRequest = async (
    method: "get" | "post" | "delete",
    url: string,
    data?: any
  ) => {
    const originalRequest = async () => {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      return await axios({
        method,
        url,
        data,
        headers: {
          "access-token": accessToken,
          "refresh-token": refreshToken,
        },
      });
    };

    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      if (!accessToken || !refreshToken) {
        throw new Error("No tokens available");
      }

      let response = await originalRequest();
      let newAccessToken = response.headers["access-token"];
      if (newAccessToken) {
        await AsyncStorage.setItem("access_token", newAccessToken);
      }
      return response;
    } catch (error: any) {
      if (error.response?.status === 401) {
        return await refreshTokenAndRetry(originalRequest);
      }
      throw error;
    }
  };

  const fetchCart = async () => {
    if (isFetching) return;
    setIsFetching(true);
    try {
      const response = await makeAuthenticatedRequest("get", `${SERVER_URI}/get-cart`);
      const newCartItems = response.data.cart.items || [];
      console.log("Fetched cart items:", newCartItems);
      setCartItems(newCartItems);
    } catch (error: any) {
      console.error("Lỗi khi lấy giỏ hàng:", error);
      Toast.show("Không thể lấy giỏ hàng. Vui lòng thử lại sau.", { type: "danger" });
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const addToCart = async (course: CoursesType) => {
    if (isFetching) return;
    setIsFetching(true);
    try {
      const response = await makeAuthenticatedRequest(
        "post",
        `${SERVER_URI}/add-to-cart`,
        { courseId: course._id }
      );
      const newCartItems = response.data.cart.items;
      console.log("Added to cart, new items:", newCartItems);
      setCartItems(newCartItems);
      Toast.show("Đã thêm vào giỏ hàng!", { type: "success" });
    } catch (error: any) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
      Toast.show(error.response?.data?.message || "Không thể thêm vào giỏ hàng", {
        type: "danger",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const removeFromCart = async (courseId: string) => {
    if (isFetching) return;
    setIsFetching(true);
    try {
      const response = await makeAuthenticatedRequest(
        "post",
        `${SERVER_URI}/remove-from-cart`,
        { courseId }
      );
      const newCartItems = response.data.cart.items;
      console.log("Removed from cart, new items:", newCartItems);
      setCartItems(newCartItems);
      Toast.show("Đã xóa khỏi giỏ hàng!", { type: "success" });
    } catch (error: any) {
      console.error("Lỗi khi xóa khỏi giỏ hàng:", error);
      Toast.show(error.response?.data?.message || "Không thể xóa khỏi giỏ hàng", {
        type: "danger",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const clearCart = async () => {
    if (isFetching) return;
    setIsFetching(true);
    try {
      await makeAuthenticatedRequest("delete", `${SERVER_URI}/clear-cart`);
      console.log("Cleared cart, new items: []");
      setCartItems([]);
      Toast.show("Đã xóa toàn bộ giỏ hàng!", { type: "success" });
    } catch (error: any) {
      console.error("Lỗi khi xóa giỏ hàng:", error);
      Toast.show(error.response?.data?.message || "Không thể xóa giỏ hàng", {
        type: "danger",
      });
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <CartContext.Provider
      value={{ cartItems, addToCart, removeFromCart, clearCart, fetchCart, isFetching }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart phải được sử dụng trong CartProvider");
  }
  return context;
};