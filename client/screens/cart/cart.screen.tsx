// frontend/app/(routes)/cart/index.tsx
import { useCart } from "@/context/CartContext";
import { SERVER_URI } from "@/utils/uri";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
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
import * as Animatable from "react-native-animatable";
import { Toast } from "react-native-toast-notifications";

type CartItemType = {
  courseId: string;
  courseName: string;
  priceAtPurchase: number;
  thumbnail?: {
    public_id: string;
    url: string;
  };
  quantity?: number;
};

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
      Toast.show("Đã xóa khóa học khỏi giỏ hàng!", { type: "success" });
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#009990" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={["#4A00E0", "#8E2DE2"]} style={styles.container}>
      {orderSuccess ? (
        <View style={styles.successContainer}>
          <Animatable.Image
            animation="bounceIn"
            source={require("@/assets/images/account_confirmation.png")}
            style={styles.successImage}
          />
          <Animatable.Text animation="fadeInUp" style={styles.successTitle}>
            Thanh Toán Thành Công!
          </Animatable.Text>
          <Animatable.Text animation="fadeInUp" style={styles.successText}>
            Cảm ơn bạn đã mua hàng!
          </Animatable.Text>
          <Animatable.View animation="fadeInUp" style={styles.orderDetails}>
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
          </Animatable.View>
          <Animatable.View animation="fadeInUp">
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setOrderSuccess(false);
                router.push("/(tabs)");
              }}
            >
              <Text style={styles.backButtonText}>Quay lại Trang chủ</Text>
            </TouchableOpacity>
          </Animatable.View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <Animatable.View animation="fadeInDown" style={styles.header}>
            <Text style={styles.headerText}>Giỏ Hàng</Text>
            <View style={styles.cartCount}>
              <Text style={styles.cartCountText}>{cartItems.length}</Text>
            </View>
          </Animatable.View>
          <FlatList<CartItemType>
            data={cartItems}
            keyExtractor={(item) => item.courseId || Math.random().toString()}
            renderItem={({ item, index }) => (
              <Animatable.View
                animation="fadeInUp"
                delay={index * 100}
                style={styles.cartItem}
              >
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
                        ? "#4A00E0"
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
                    {(item.priceAtPurchase).toFixed(2)} VNĐ
                  </Text>
                  {enrolledCourses.includes(item.courseId) ? (
                    <TouchableOpacity
                      style={styles.accessButton}
                      onPress={() => handleAccessCourse(item.courseId)}
                    >
                      <MaterialIcons name="play-circle-outline" size={20} color="#fff" />
                      <Text style={styles.accessButtonText}>Truy cập khóa học</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveItem(item.courseId)}
                    >
                      <MaterialIcons name="delete" size={20} color="#fff" />
                      <Text style={styles.removeButtonText}>Xóa</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Animatable.View>
            )}
            ListEmptyComponent={() => (
              <Animatable.View animation="fadeIn" style={styles.emptyContainer}>
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
              </Animatable.View>
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
          {cartItems.length > 0 && (
            <Animatable.View animation="fadeInUp" style={styles.footer}>
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
            </Animatable.View>
          )}
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
    fontFamily: "Nunito_600SemiBold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E1E2E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: {
    fontSize: 24,
    fontFamily: "Raleway_700Bold",
    color: "#333",
  },
  cartCount: {
    backgroundColor: "#4A00E0",
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
    backgroundColor: "#fff",
    borderRadius: 10,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: "#4A00E0",
    textAlign: "center",
  },
  successText: {
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
    color: "#575757",
    marginTop: 10,
    textAlign: "center",
  },
  orderDetails: {
    marginTop: 20,
    alignItems: "center",
    backgroundColor: "#F5F5F5",
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
    backgroundColor: "#4A00E0",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    textAlign: "center",
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
    borderRadius: 8,
    overflow: "hidden",
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
    flexDirection: "row",
    alignItems: "center",
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    marginLeft: 5,
  },
  accessButton: {
    backgroundColor: "#4A00E0",
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginTop: 10,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
  },
  accessButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    marginLeft: 5,
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
    backgroundColor: "#4A00E0",
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
    backgroundColor: "#4A00E0",
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