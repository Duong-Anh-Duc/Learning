// frontend/context/CartContext.tsx
import { useUser } from "@/context/UserContext";
import { CoursesType } from "@/types/courses";
import socket from "@/utils/socket";
import { SERVER_URI } from "@/utils/uri";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
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
  errorMessage: string | null;
  clearError: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastAddToCartTime, setLastAddToCartTime] = useState<number>(0);
  const [shouldFetchCart, setShouldFetchCart] = useState<boolean>(true);
  const { user } = useUser();

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
      Toast.show("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.", {
        type: "warning",
        placement: "top",
        duration: 4000,
        animationType: "zoom-in",
      });
      throw error;
    }
  };

  const makeAuthenticatedRequest = async (
    method: "get" | "post" | "delete",
    url: string,
    data?: any
  ) => {
    const accessToken = await AsyncStorage.getItem("access_token");
    const refreshToken = await AsyncStorage.getItem("refresh_token");

    if (!accessToken || !refreshToken) {
      Toast.show("Vui lòng đăng nhập để thực hiện hành động này", {
        type: "warning",
        placement: "top",
        duration: 4000,
        animationType: "zoom-in",
      });
      router.push("/(routes)/login");
      throw new Error("No tokens available");
    }

    const originalRequest = async () => {
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
    if (!user) {
      console.log("User not logged in, skipping fetchCart");
      return;
    }

    setIsFetching(true);
    try {
      const response = await makeAuthenticatedRequest("get", `${SERVER_URI}/get-cart`);
      const newCartItems = response.data.cart.items || [];
      setCartItems(newCartItems);
    } catch (error: any) {
      console.error("Lỗi khi lấy giỏ hàng:", error);
      setErrorMessage("Không thể tải giỏ hàng. Vui lòng thử lại sau!");
    } finally {
      setIsFetching(false);
    }
  };

  const addToCart = async (course: CoursesType) => {
    if (!user) {
      Toast.show("Vui lòng đăng nhập để thêm vào giỏ hàng!", {
        type: "warning",
        placement: "top",
        duration: 4000,
        animationType: "zoom-in",
      });
      router.push("/(routes)/login");
      return;
    }

    // Kiểm tra xem khóa học đã có trong giỏ hàng chưa
    const isCourseInCart = cartItems.some((item) => item.courseId === course._id);
    if (isCourseInCart) {
      setErrorMessage(`Khóa học "${course.name}" đã có trong giỏ hàng của bạn!`);
      Toast.show(`Khóa học "${course.name}" đã có trong giỏ hàng của bạn!`, {
        type: "warning",
        placement: "top",
        duration: 4000,
        animationType: "zoom-in",
      });
      return;
    }

    setIsFetching(true);
    try {
      const response = await makeAuthenticatedRequest(
        "post",
        `${SERVER_URI}/add-to-cart`,
        { courseId: course._id }
      );
      const newCartItems = response.data.cart.items;
      setCartItems(newCartItems);
      setErrorMessage(null);
      setLastAddToCartTime(Date.now());
      setShouldFetchCart(false);
    } catch (error: any) {
      console.error("Lỗi khi thêm vào giỏ hàng:", error);
      const errorMsg = error.response?.data?.message || "Không thể thêm vào giỏ hàng. Vui lòng thử lại sau!";
      setErrorMessage(errorMsg);
      Toast.show(errorMsg, {
        type: "warning",
        placement: "top",
        duration: 4000,
        animationType: "zoom-in",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const removeFromCart = async (courseId: string) => {
    if (!user) {
      Toast.show("Vui lòng đăng nhập để xóa sản phẩm khỏi giỏ hàng!", {
        type: "warning",
        placement: "top",
        duration: 4000,
        animationType: "zoom-in",
      });
      router.push("/(routes)/login");
      return;
    }

    setIsFetching(true);
    try {
      const course = cartItems.find((item) => item.courseId === courseId);
      const response = await makeAuthenticatedRequest(
        "post",
        `${SERVER_URI}/remove-from-cart`,
        { courseId }
      );
      const newCartItems = response.data.cart.items;
      setCartItems(newCartItems);
      Toast.show(
        course
          ? `Đã xóa "${course.courseName}" khỏi giỏ hàng!`
          : "Đã xóa sản phẩm khỏi giỏ hàng!",
        {
          type: "success",
          placement: "top",
          duration: 4000,
          animationType: "zoom-in",
        }
      );
      setErrorMessage(null);
    } catch (error: any) {
      console.error("Lỗi khi xóa khỏi giỏ hàng:", error);
      setErrorMessage("Không thể xóa sản phẩm khỏi giỏ hàng. Vui lòng thử lại!");
    } finally {
      setIsFetching(false);
    }
  };

  const clearCart = async () => {
    if (!user) {
      Toast.show("Vui lòng đăng nhập để xóa toàn bộ giỏ hàng!", {
        type: "warning",
        placement: "top",
        duration: 4000,
        animationType: "zoom-in",
      });
      router.push("/(routes)/login");
      return;
    }

    setIsFetching(true);
    try {
      await makeAuthenticatedRequest("delete", `${SERVER_URI}/clear-cart`);
      setCartItems([]);
      Toast.show("Đã xóa toàn bộ giỏ hàng thành công!", {
        type: "success",
        placement: "top",
        duration: 4000,
        animationType: "zoom-in",
      });
      setErrorMessage(null);
    } catch (error: any) {
      console.error("Lỗi khi xóa giỏ hàng:", error);
      setErrorMessage("Không thể xóa toàn bộ giỏ hàng. Vui lòng thử lại sau!");
    } finally {
      setIsFetching(false);
    }
  };

  const clearError = () => {
    setErrorMessage(null);
  };

  useEffect(() => {
    if (!user) {
      return;
    }

    const now = Date.now();
    if (shouldFetchCart && now - lastAddToCartTime > 5000) {
      fetchCart();
    }

    socket.on("cartUpdated", (updatedCart: { items: CartItemType[] }) => {
      setCartItems(updatedCart.items);
      Toast.show("Giỏ hàng đã được cập nhật!", {
        type: "success",
        placement: "top",
        duration: 4000,
        animationType: "zoom-in",
      });
    });

    socket.on("courseUpdated", (data: { message: string; course: any }) => {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.courseId === data.course._id
            ? { ...item, priceAtPurchase: data.course.price, courseName: data.course.name }
            : item
        )
      );
    });

    const interval = setInterval(() => {
      if (user && !isFetching) {
        const now = Date.now();
        if (shouldFetchCart && now - lastAddToCartTime > 5000) {
          fetchCart();
        }
      }
    }, 30000);

    return () => {
      socket.off("cartUpdated");
      socket.off("courseUpdated");
      clearInterval(interval);
    };
  }, [user, isFetching, lastAddToCartTime, shouldFetchCart]);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart, fetchCart, isFetching, errorMessage, clearError }}>
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