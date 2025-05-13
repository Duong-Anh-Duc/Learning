import { useCart } from "@/context/CartContext";
import { SERVER_URI } from "@/utils/uri";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useStripe } from "@stripe/stripe-react-native";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Toast } from "react-native-toast-notifications";
import { cartStyles } from "@/styles/cart/cartStyles";
import { modalStyles } from "@/styles/cart//modalStyles";

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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { cartItems, removeFromCart, clearCart, fetchCart } = useCart();

  const fetchEnrolledCourses = useCallback(async () => {
    try {
      const cachedEnrolledCourses = await AsyncStorage.getItem(
        "enrolledCourses"
      );
      if (cachedEnrolledCourses) {
        setEnrolledCourses(JSON.parse(cachedEnrolledCourses));
        return;
      }

      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      if (!accessToken || !refreshToken) {
        return;
      }

      const response = await axios.get(`${SERVER_URI}/user-courses`, {
        headers: {
          "access-token": accessToken,
          "refresh-token": refreshToken,
        },
      });

      const courses = response.data.courses.map(
        (course: any) => course.courseId
      );
      setEnrolledCourses(courses);
      await AsyncStorage.setItem("enrolledCourses", JSON.stringify(courses));
    } catch (error: any) {
      console.error("Error fetching enrolled courses:", error);
      Toast.show("Unable to fetch enrolled courses", { type: "danger" });
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        await fetchCart();
        await fetchEnrolledCourses();
      } catch (error: any) {
        console.error("Error loading cart data:", error);
        Toast.show("Unable to load cart data", { type: "danger" });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [fetchCart, fetchEnrolledCourses]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await AsyncStorage.removeItem("enrolledCourses");
      await fetchCart();
      await fetchEnrolledCourses();
    } catch (error: any) {
      Toast.show("Unable to refresh data", { type: "danger" });
    } finally {
      setRefreshing(false);
    }
  }, [fetchCart, fetchEnrolledCourses]);

  const calculateTotalPrice = useCallback(() => {
    const totalPrice = cartItems
      .filter((item) => selectedCourseIds.includes(item.courseId))
      .reduce((total: number, item: CartItemType) => {
        return total + Number(item.priceAtPurchase);
      }, 0);
    return totalPrice.toFixed(2);
  }, [cartItems, selectedCourseIds]);

  const toggleSelection = useCallback((courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  }, []);

  const handleCourseDetails = useCallback((item: CartItemType) => {
    if (!item.courseId) {
      Toast.show("Invalid course data", { type: "danger" });
      return;
    }
    router.push({
      pathname: "/(routes)/course-details",
      params: {
        courseId: item.courseId,
      },
    });
  }, []);

  const handleAccessCourse = useCallback(async (courseId: string) => {
    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      if (!accessToken || !refreshToken) {
        Toast.show("Please log in to access the course", { type: "warning" });
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
      console.error("Error accessing course:", error);
      Toast.show("Unable to access course", { type: "danger" });
    }
  }, []);

  const handleRemoveItem = useCallback(
    async (courseId: string) => {
      try {
        await removeFromCart(courseId);
        Toast.show("Course removed from cart!", { type: "success" });
      } catch (error: any) {
        Toast.show("Unable to remove course from cart", { type: "danger" });
      }
    },
    [removeFromCart]
  );

  const handleShowModal = useCallback(() => {
    if (selectedCourseIds.length === 0) {
      Toast.show("Please select at least one course to proceed", {
        type: "warning",
      });
      return;
    }
    setIsModalVisible(true);
  }, [selectedCourseIds]);

  const handlePayment = useCallback(async () => {
    setIsModalVisible(false);
    try {
      setIsLoading(true);
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");
      if (!accessToken || !refreshToken) {
        Toast.show("Please log in to proceed with payment", {
          type: "warning",
        });
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

      const { client_secret: clientSecret, paymentIntentId } =
        paymentIntentResponse.data;

      const initSheetResponse = await initPaymentSheet({
        merchantDisplayName: "EduBridge",
        paymentIntentClientSecret: clientSecret,
        returnURL: "edubridge://payment-complete",
      });

      if (initSheetResponse.error) {
        Toast.show("Error initializing payment", { type: "danger" });
        return;
      }

      const paymentResponse = await presentPaymentSheet();

      if (paymentResponse.error) {
        Toast.show("Payment failed", { type: "danger" });
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

        await createOrder(paymentResponse, paymentIntentDetailsResponse.data);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      Toast.show("Error processing payment", { type: "danger" });
    } finally {
      setIsLoading(false);
    }
  }, [calculateTotalPrice, createOrder]);

  const createOrder = useCallback(
    async (paymentResponse: any, paymentIntentDetails: any) => {
      try {
        setIsLoading(true);
        const accessToken = await AsyncStorage.getItem("access_token");
        const refreshToken = await AsyncStorage.getItem("refresh_token");

        if (!accessToken || !refreshToken) {
          Toast.show("Please log in to create order", { type: "warning" });
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
        Toast.show("Payment successful!", { type: "success" });
      } catch (error: any) {
        console.error("Error creating order:", error);
        Toast.show("Error creating order", { type: "danger" });
      } finally {
        setIsLoading(false);
      }
    },
    [fetchCart, fetchEnrolledCourses, selectedCourseIds]
  );

  if (isLoading) {
    return (
      <View style={cartStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#009990" />
        <Text style={cartStyles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#009990", "#F6F7F9"]}
      style={cartStyles.container}
    >
      {orderSuccess ? (
        <View style={cartStyles.successContainer}>
          <Ionicons
            name="checkmark-circle"
            size={80}
            color="#009990"
            style={cartStyles.successIcon}
          />
          <Text style={cartStyles.successTitle}>Payment Successful!</Text>
          <Text style={cartStyles.successText}>
            Thank you for your purchase!
          </Text>
          <View style={cartStyles.orderDetails}>
            <Text style={cartStyles.orderText}>
              Order ID: {orderDetails?._id?.slice(0, 6) ?? "N/A"}
            </Text>
            <Text style={cartStyles.orderText}>
              Status: {orderDetails?.status ?? "N/A"}
            </Text>
            <Text style={cartStyles.orderText}>
              Total: {orderDetails?.totalPrice?.toFixed(2) ?? "0"} VNĐ
            </Text>
            <Text style={cartStyles.orderText}>
              Courses: {orderDetails?.courses?.length ?? 0}
            </Text>
            <Text style={cartStyles.orderText}>
              Buyer: {orderDetails?.userName ?? "N/A"}
            </Text>
            <Text style={cartStyles.orderText}>
              Payment Method:{" "}
              {orderDetails?.payment_info?.paymentMethod ?? "N/A"}
            </Text>
            <Text style={cartStyles.orderText}>
              Payment Time:{" "}
              {orderDetails?.payment_info?.created
                ? new Date(
                    orderDetails.payment_info.created * 1000
                  ).toLocaleString()
                : "N/A"}
            </Text>
            <Text style={cartStyles.orderText}>
              You will receive an email notification!
            </Text>
          </View>
          <TouchableOpacity
            style={cartStyles.backButton}
            onPress={() => {
              setOrderSuccess(false);
              router.push("/(tabs)");
            }}
          >
            <Text style={cartStyles.backButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={cartStyles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={cartStyles.headerText}>Cart</Text>
            <View style={cartStyles.cartCount}>
              <Text style={cartStyles.cartCountText}>{cartItems.length}</Text>
            </View>
          </View>
          <FlatList<CartItemType>
            data={cartItems}
            keyExtractor={(item) => item.courseId || Math.random().toString()}
            renderItem={({ item }) => (
              <View style={cartStyles.cartItem}>
                <TouchableOpacity
                  style={cartStyles.checkbox}
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
                  style={cartStyles.courseImageContainer}
                  onPress={() => handleCourseDetails(item)}
                >
                  <Image
                    source={{
                      uri:
                        item.thumbnail?.url || "https://via.placeholder.com/80",
                    }}
                    style={cartStyles.courseImage}
                  />
                </TouchableOpacity>
                <View style={cartStyles.courseDetails}>
                  <TouchableOpacity onPress={() => handleCourseDetails(item)}>
                    <Text style={cartStyles.courseName}>{item.courseName}</Text>
                  </TouchableOpacity>
                  <Text style={cartStyles.coursePrice}>
                    {item.priceAtPurchase.toFixed(2)} VNĐ
                  </Text>
                  {enrolledCourses.includes(item.courseId) ? (
                    <TouchableOpacity
                      style={cartStyles.accessButton}
                      onPress={() => handleAccessCourse(item.courseId)}
                    >
                      <MaterialIcons
                        name="play-circle-outline"
                        size={20}
                        color="#fff"
                      />
                      <Text style={cartStyles.accessButtonText}>
                        Access Course
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={cartStyles.removeButton}
                      onPress={() => handleRemoveItem(item.courseId)}
                    >
                      <MaterialIcons name="delete" size={20} color="#fff" />
                      <Text style={cartStyles.removeButtonText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
            ListEmptyComponent={() => (
              <View style={cartStyles.emptyContainer}>
                <Ionicons
                  name="cart-outline"
                  size={80}
                  color="#575757"
                  style={cartStyles.emptyIcon}
                />
                <Text style={cartStyles.emptyText}>Your Cart is Empty!</Text>
                <TouchableOpacity
                  style={cartStyles.shopButton}
                  onPress={() => router.push("/(tabs)")}
                >
                  <Text style={cartStyles.shopButtonText}>Explore Courses</Text>
                </TouchableOpacity>
              </View>
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            initialNumToRender={5}
            windowSize={10}
            removeClippedSubviews={true}
            getItemLayout={(data, index) => ({
              length: 120,
              offset: 120 * index,
              index,
            })}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
          {cartItems.length > 0 && (
            <View style={cartStyles.footer}>
              <Text style={cartStyles.totalText}>
                Total: {calculateTotalPrice()} VNĐ
              </Text>
              <TouchableOpacity
                style={[
                  cartStyles.checkoutButton,
                  {
                    opacity: selectedCourseIds.length === 0 ? 0.5 : 1,
                  },
                ]}
                onPress={handleShowModal}
                disabled={selectedCourseIds.length === 0 || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={cartStyles.checkoutButtonText}>
                    Checkout ({selectedCourseIds.length})
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          <Modal
            animationType="slide"
            transparent={true}
            visible={isModalVisible}
            onRequestClose={() => setIsModalVisible(false)}
          >
            <View style={modalStyles.modalOverlay}>
              <View style={modalStyles.modalContainer}>
                <Text style={modalStyles.modalTitle}>Confirm Payment</Text>
                <Text style={modalStyles.modalMessage}>
                  Are you sure you want to proceed with the payment?
                </Text>
                <FlatList
                  data={cartItems.filter((item) =>
                    selectedCourseIds.includes(item.courseId)
                  )}
                  keyExtractor={(item) => item.courseId}
                  renderItem={({ item }) => (
                    <View style={modalStyles.modalCourseItem}>
                      <Text style={modalStyles.modalCourseName}>
                        {item.courseName}
                      </Text>
                      <Text style={modalStyles.modalCoursePrice}>
                        {item.priceAtPurchase.toFixed(2)} VNĐ
                      </Text>
                    </View>
                  )}
                  style={modalStyles.modalCourseList}
                />
                <Text style={modalStyles.modalTotal}>
                  Total: {calculateTotalPrice()} VNĐ
                </Text>
                <View style={modalStyles.modalButtons}>
                  <TouchableOpacity
                    style={modalStyles.modalCancelButton}
                    onPress={() => setIsModalVisible(false)}
                  >
                    <Text style={modalStyles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={modalStyles.modalConfirmButton}
                    onPress={handlePayment}
                  >
                    <Text style={modalStyles.modalConfirmText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      )}
    </LinearGradient>
  );
}
