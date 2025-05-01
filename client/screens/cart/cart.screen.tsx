// frontend/app/(routes)/cart/index.tsx
import { useCart } from "@/context/CartContext";
import { SERVER_URI } from "@/utils/uri";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useStripe } from "@stripe/stripe-react-native";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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

interface CoursesType {
  _id: string;
  name: string;
  price: number;
  estimatedPrice: number;
  thumbnail: {
    public_id: string;
    url: string;
  };
  ratings: number;
  purchased: number;
  description: string;
  prerequisites: Array<{ title: string }>;
  benefits: Array<{ title: string }>;
  reviews: Array<{ user: any; rating: number; comment: string; commentReplies?: any[] }>;
}

export default function CartScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { cartItems, removeFromCart, clearCart, fetchCart } = useCart();

  const fetchEnrolledCourses = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      if (!accessToken || !refreshToken) {
        Toast.show("Vui lòng đăng nhập để xem khóa học đã đăng ký", { type: "warning" });
        router.push("/(routes)/login");
        return;
      }

      const response = await axios.get(`${SERVER_URI}/user-courses`, {
        headers: {
          "access-token": accessToken,
          "refresh-token": refreshToken,
        },
      });

      const courses = response.data.courses.map((course: any) => course.courseId);
      setEnrolledCourses(courses);
    } catch (error: any) {
      console.error("Lỗi khi lấy danh sách khóa học đã đăng ký:", error);
      Toast.show("Không thể lấy danh sách khóa học đã đăng ký", { type: "danger" });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        await fetchCart();
        await fetchEnrolledCourses();
      } catch (error: any) {
        console.error("Lỗi khi tải dữ liệu giỏ hàng:", error);
        Toast.show("Không thể tải dữ liệu giỏ hàng", { type: "danger" });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchCart();
      await fetchEnrolledCourses();
    } catch (error: any) {
      Toast.show("Không thể làm mới dữ liệu", { type: "danger" });
    } finally {
      setRefreshing(false);
    }
  };

  const calculateTotalPrice = () => {
    const totalPrice = cartItems
      .filter((item) => selectedCourseIds.includes(item.courseId))
      .reduce((total: number, item: CartItemType) => {
        return total + Number(item.priceAtPurchase);
      }, 0);
    return totalPrice.toFixed(2);
  };

  const toggleSelection = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleCourseDetails = (item: CartItemType) => {
    if (!item.courseId) {
      Toast.show("Dữ liệu khóa học không hợp lệ", { type: "danger" });
      return;
    }
    router.push({
      pathname: "/(routes)/course-details",
      params: {
        courseId: item.courseId,
      },
    });
  };

  const handleAccessCourse = async (courseId: string) => {
    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      if (!accessToken || !refreshToken) {
        Toast.show("Vui lòng đăng nhập để truy cập khóa học", { type: "warning" });
        router.push("/(routes)/login");
        return;
      }

      await axios.get(`${SERVER_URI}/get-course-content/${courseId}`, {
        headers: {
          "access-token": accessToken,
          "refresh-token": refreshToken,
        },
      });

      router.push({
        pathname: "/(routes)/course-access",
        params: { courseId },
      });
    } catch (error: any) {
      console.error("Lỗi khi truy cập khóa học:", error);
      Toast.show("Không thể truy cập khóa học", { type: "danger" });
    }
  };

  const handleRemoveItem = async (courseId: string) => {
    try {
      await removeFromCart(courseId);
    } catch (error: any) {
      Toast.show("Không thể xóa khóa học khỏi giỏ hàng", { type: "danger" });
    }
  };

  const handlePayment = async () => {
    if (selectedCourseIds.length === 0) {
      Toast.show("Vui lòng chọn ít nhất một khóa học để thanh toán", {
        type: "warning",
      });
      return;
    }

    try {
      setIsLoading(true);
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      if (!accessToken || !refreshToken) {
        Toast.show("Vui lòng đăng nhập để thanh toán", { type: "warning" });
        router.push("/(routes)/login");
        return;
      }

      const amount = Math.round(Number(calculateTotalPrice()) * 100);

      const paymentIntentResponse = await axios.post(
        `${SERVER_URI}/payment`,
        { amount },
        {
          headers: {
            "access-token": accessToken,
            "refresh-token": refreshToken,
          },
        }
      );

      const { client_secret: clientSecret, paymentIntentId } = paymentIntentResponse.data;
      console.log("Payment intent response:", paymentIntentResponse.data);

      const initSheetResponse = await initPaymentSheet({
        merchantDisplayName: "EduBridge",
        paymentIntentClientSecret: clientSecret,
        returnURL: "edubridge://payment-complete",
      });

      if (initSheetResponse.error) {
        Toast.show("Lỗi khi khởi tạo thanh toán", { type: "danger" });
        return;
      }

      const paymentResponse = await presentPaymentSheet();
      console.log("Payment response:", paymentResponse);

      if (paymentResponse.error) {
        Toast.show("Thanh toán thất bại", { type: "danger" });
      } else {
        const paymentIntentDetailsResponse = await axios.get(
          `${SERVER_URI}/payment-intent/${paymentIntentId}`,
          {
            headers: {
              "access-token": accessToken,
              "refresh-token": refreshToken,
            },
          }
        );

        console.log("Payment intent details:", paymentIntentDetailsResponse.data);
        await createOrder(paymentResponse, paymentIntentDetailsResponse.data);
      }
    } catch (error) {
      console.error("Lỗi khi xử lý thanh toán:", error);
      Toast.show("Lỗi khi xử lý thanh toán", { type: "danger" });
    } finally {
      setIsLoading(false);
    }
  };

  const createOrder = async (paymentResponse: any, paymentIntentDetails: any) => {
    try {
      setIsLoading(true);
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      if (!accessToken || !refreshToken) {
        Toast.show("Vui lòng đăng nhập để tạo đơn hàng", { type: "warning" });
        router.push("/(routes)/login");
        return;
      }

      const response = await axios.post(
        `${SERVER_URI}/create-mobile-order`,
        {
          selectedCourseIds,
          payment_info: {
            ...paymentResponse,
            paymentIntent: paymentIntentDetails,
          },
        },
        {
          headers: {
            "access-token": accessToken,
            "refresh-token": refreshToken,
          },
        }
      );

      setOrderSuccess(true);
      setOrderDetails(response.data.order);
      await fetchCart();
      await fetchEnrolledCourses();
      console.log("Cart items after create order:", cartItems);
      Toast.show("Thanh toán thành công!", { type: "success" });
    } catch (error: any) {
      console.error("Lỗi khi tạo đơn hàng:", error);
      Toast.show("Lỗi khi tạo đơn hàng", { type: "danger" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#009990" />
        <Text style={{ marginTop: 10, fontSize: 16, color: "#333" }}>
          Đang tải...
        </Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#009990", "#F6F7F9"]} style={styles.container}>
      {orderSuccess ? (
        <View style={{ flex: 1 }}>
          <View style={styles.successContainer}>
            <Image
              source={require("@/assets/images/account_confirmation.png")}
              style={styles.successImage}
            />
            <Text style={styles.successTitle}>Thanh Toán Thành Công!</Text>
            <Text style={styles.successText}>Cảm ơn bạn đã mua hàng!</Text>
            <View style={styles.orderDetails}>
              <Text style={styles.orderText}>
                Mã đơn hàng: {orderDetails?._id?.slice(0, 6) ?? "N/A"}
              </Text>
              <Text style={styles.orderText}>
                Trạng thái: {orderDetails?.status ?? "N/A"}
              </Text>
              <Text style={styles.orderText}>
                Tổng giá: {orderDetails?.totalPrice?.toFixed(2) ?? "0"} VNĐ
              </Text>
              <Text style={styles.orderText}>
                Số lượng khóa học: {orderDetails?.courses?.length ?? 0}
              </Text>
              <Text style={styles.orderText}>
                Người mua: {orderDetails?.userName ?? "N/A"}
              </Text>
              <Text style={styles.orderText}>
                Phương thức thanh toán: {orderDetails?.payment_info?.paymentMethod ?? "N/A"}
              </Text>
              <Text style={styles.orderText}>
                Thời gian thanh toán:{" "}
                {orderDetails?.payment_info?.created
                  ? new Date(orderDetails.payment_info.created * 1000).toLocaleString()
                  : "N/A"}
              </Text>
              <Text style={styles.orderText}>
                Bạn sẽ nhận được email xác nhận!
              </Text>
            </View>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setOrderSuccess(false);
                router.push("/(tabs)");
              }}
            >
              <Text style={styles.backButtonText}>Quay lại Trang chủ</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Giỏ Hàng</Text>
            <View style={styles.cartCount}>
              <Text style={styles.cartCountText}>{cartItems.length}</Text>
            </View>
          </View>
          <FlatList<CartItemType>
            data={cartItems}
            keyExtractor={(item) => item.courseId || Math.random().toString()}
            renderItem={({ item }) => (
              <View style={styles.cartItem}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => toggleSelection(item.courseId)}
                >
                  <Ionicons
                    name={
                      selectedCourseIds.includes(item.courseId)
                        ? "checkbox"
                        : "square-outline"
                    }
                    size={24}
                    color={
                      selectedCourseIds.includes(item.courseId)
                        ? "#009990"
                        : "#808080"
                    }
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.courseImageContainer}
                  onPress={() => handleCourseDetails(item)}
                >
                  <Image
                    source={{
                      uri: item.thumbnail?.url || "https://via.placeholder.com/80",
                    }}
                    style={styles.courseImage}
                  />
                </TouchableOpacity>
                <View style={styles.courseDetails}>
                  <TouchableOpacity onPress={() => handleCourseDetails(item)}>
                    <Text style={styles.courseName}>{item.courseName}</Text>
                  </TouchableOpacity>
                  <Text style={styles.coursePrice}>
                    {item.priceAtPurchase.toFixed(2)} VNĐ
                  </Text>
                  {enrolledCourses.includes(item.courseId) ? (
                    <TouchableOpacity
                      style={[styles.accessButton]}
                      onPress={() => handleAccessCourse(item.courseId)}
                    >
                      <Text style={styles.accessButtonText}>Truy cập vào khóa học</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveItem(item.courseId)}
                    >
                      <Text style={styles.removeButtonText}>Xóa</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Image
                  source={require("@/assets/empty_cart.png")}
                  style={styles.emptyImage}
                />
                <Text style={styles.emptyText}>
                  Giỏ Hàng Của Bạn Đang Trống!
                </Text>
                <TouchableOpacity
                  style={styles.shopButton}
                  onPress={() => router.push("/(tabs)")}
                >
                  <Text style={styles.shopButtonText}>Khám phá khóa học</Text>
                </TouchableOpacity>
              </View>
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
          {cartItems.length > 0 && (
            <View style={styles.footer}>
              <Text style={styles.totalText}>
                Tổng Cộng: {calculateTotalPrice()} VNĐ
              </Text>
              <TouchableOpacity
                style={[
                  styles.checkoutButton,
                  {
                    opacity: selectedCourseIds.length === 0 ? 0.5 : 1,
                  },
                ]}
                onPress={handlePayment}
                disabled={selectedCourseIds.length === 0 || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.checkoutButtonText}>
                    Thanh Toán ({selectedCourseIds.length})
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </LinearGradient>
  );
}

// ... styles không đổi

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E1E2E5",
  },
  headerText: {
    fontSize: 24,
    fontFamily: "Raleway_700Bold",
    color: "#333",
  },
  cartCount: {
    backgroundColor: "#009990",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cartCountText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successImage: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: "Raleway_700Bold",
    color: "#333",
  },
  successText: {
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
    color: "#575757",
    marginTop: 10,
  },
  orderDetails: {
    marginTop: 20,
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 10,
    width: "100%",
  },
  orderText: {
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
    color: "#575757",
    marginVertical: 5,
  },
  backButton: {
    backgroundColor: "#009990",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  checkbox: {
    marginRight: 10,
  },
  courseImageContainer: {
    marginRight: 12,
  },
  courseImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  courseDetails: {
    flex: 1,
    justifyContent: "space-between",
  },
  courseName: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: "#333",
  },
  coursePrice: {
    fontSize: 14,
    fontFamily: "Nunito_400Regular",
    color: "#575757",
    marginTop: 5,
  },
  removeButton: {
    backgroundColor: "#FF6347",
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginTop: 10,
    alignSelf: "flex-start",
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
  },
  accessButton: {
    backgroundColor: "#009990",
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginTop: 10,
    alignSelf: "flex-start",
  },
  accessButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    marginTop: 100,
  },
  emptyImage: {
    width: 200,
    height: 200,
    resizeMode: "contain",
  },
  emptyText: {
    fontSize: 20,
    fontFamily: "Raleway_700Bold",
    color: "#333",
    marginTop: 20,
  },
  shopButton: {
    backgroundColor: "#009990",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  shopButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
  },
  footer: {
    backgroundColor: "#fff",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E1E2E5",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  totalText: {
    fontSize: 18,
    fontFamily: "Nunito_700Bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  checkoutButton: {
    backgroundColor: "#009990",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  checkoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
  },
});