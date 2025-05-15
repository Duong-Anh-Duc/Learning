import { SERVER_URI } from "@/utils/uri";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useMemo, useState, useEffect } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  ScrollView,
} from "react-native";
import io from "socket.io-client";

interface SocketOrderData {
  message: string;
  _id: string;
  type: string;
  status: "read" | "unread";
  order: {
    _id: string;
    userName: string;
    courses: Array<{
      courseId: string;
      courseName: string;
      priceAtPurchase: number;
    }>;
    totalPrice: number;
    createdAt: string;
  };
}

interface NotificationItem {
  _id: string;
  message: string;
  type: string;
  courseId?: string;
  price?: number;
  status: "read" | "unread";
  order?: {
    _id: string;
    userName: string;
    courses: Array<{
      courseId: string;
      courseName: string;
      priceAtPurchase: number;
    }>;
    totalPrice: number;
    createdAt: string;
  };
}

const formatPrice = (price?: number) => {
  if (!price) return "";
  return price.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const NotificationIcon = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationItem | null>(null);
  const slideAnim = useState(new Animated.Value(0))[0];

  // Kết nối socket khi component mount
  useEffect(() => {
    const connectSocket = async () => {
      try {
        const accessToken = await AsyncStorage.getItem("access_token");
        const userId = await AsyncStorage.getItem("user_id"); // Make sure you store user_id when logging in

        const socket = io("http://192.168.0.102:8001", {
          transports: ["websocket"],
          auth: {
            token: accessToken,
          },
        });

        socket.connect();

        socket.on("connect", () => {
          console.log("Socket connected successfully");
          if (userId) {
            socket.emit("join", userId);
            console.log("Joined room:", userId);
          }
        });

        socket.on("newOrder", (data: SocketOrderData) => {
          console.log("Received new order notification:", data);
          setNotifications((prev) => [
            {
              _id: data._id,
              message: data.message,
              type: data.type,
              status: data.status,
              order: data.order,
            },
            ...prev,
          ]);
        });

        socket.on("connect_error", (error: Error) => {
          console.error("Socket connection error:", error);
        });

        return () => {
          if (userId) {
            socket.emit("leave", userId);
          }
          socket.disconnect();
        };
      } catch (error) {
        console.error("Error setting up socket connection:", error);
      }
    };

    connectSocket();
  }, []);

  // Lấy thông báo từ server
  const fetchNotifications = async () => {
    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      if (accessToken && refreshToken) {
        const response = await axios.get(`${SERVER_URI}/get-notifications`, {
          headers: {
            "access-token": accessToken,
            "refresh-token": refreshToken,
          },
        });
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông báo:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Đếm số thông báo chưa đọc
  const unreadCount = useMemo(() => {
    return notifications.filter((item) => item.status === "unread").length;
  }, [notifications]);

  // Animation khi mở/đóng modal
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: modalVisible ? 1 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  }, [modalVisible]);

  const handleNotificationPress = async (notification: NotificationItem) => {
    try {
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      if (accessToken && refreshToken) {
        // Mark notification as read
        await axios.put(
          `${SERVER_URI}/update-notification/${notification._id}`,
          {},
          {
            headers: {
              "access-token": accessToken,
              "refresh-token": refreshToken,
            },
          }
        );

        // Update local state
        setNotifications((prevNotifications) =>
          prevNotifications.map((item) =>
            item._id === notification._id ? { ...item, status: "read" } : item
          )
        );

        // Set selected notification and show modal
        console.log("Opening modal with notification:", notification);
        setSelectedNotification(notification);
        setOrderModalVisible(true);
      }
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  const clearNotifications = async () => {
    try {
      setNotifications([]);
      setModalVisible(false);
    } catch (error) {
      console.error("Lỗi khi xóa thông báo:", error);
    }
  };

  const renderNotification = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        item.status === "unread" && styles.unreadNotification,
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationHeader}>
        <MaterialIcons name="shopping-cart" size={24} color="#009990" />
        {item.status === "unread" && <View style={styles.unreadDot} />}
      </View>
      <Text
        style={[
          styles.notificationMessage,
          item.status === "unread" && styles.unreadText,
        ]}
      >
        {item.message}
      </Text>
      {item.order && (
        <Text style={styles.notificationPrice}>
          Tổng: {formatPrice(item.order.totalPrice)}
        </Text>
      )}
      <Text style={styles.viewCourse}>Xem chi tiết đơn hàng →</Text>
    </TouchableOpacity>
  );

  const renderOrderModal = () => {
    console.log(
      "Rendering order modal with notification:",
      selectedNotification
    );

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={orderModalVisible}
        onRequestClose={() => setOrderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.orderModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi Tiết Đơn Hàng</Text>
              <TouchableOpacity onPress={() => setOrderModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {selectedNotification?.order ? (
              <ScrollView style={styles.orderDetails}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderLabel}>Mã đơn hàng:</Text>
                  <Text style={styles.orderValue}>
                    #{selectedNotification.order._id}
                  </Text>
                </View>

                <View style={styles.orderInfo}>
                  <Text style={styles.orderLabel}>Khách hàng:</Text>
                  <Text style={styles.orderValue}>
                    {selectedNotification.order.userName}
                  </Text>
                </View>

                <View style={styles.orderInfo}>
                  <Text style={styles.orderLabel}>Ngày mua:</Text>
                  <Text style={styles.orderValue}>
                    {formatDate(selectedNotification.order.createdAt)}
                  </Text>
                </View>

                <View style={styles.coursesContainer}>
                  <Text style={styles.coursesTitle}>Danh sách khóa học:</Text>
                  {selectedNotification.order.courses.map((course, index) => (
                    <View key={index} style={styles.courseItem}>
                      <Text style={styles.courseName}>{course.courseName}</Text>
                      <Text style={styles.coursePrice}>
                        {formatPrice(course.priceAtPurchase)}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Tổng cộng:</Text>
                  <Text style={styles.totalPrice}>
                    {formatPrice(selectedNotification.order.totalPrice)}
                  </Text>
                </View>
              </ScrollView>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Không có thông tin đơn hàng
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={styles.iconContainer}
      >
        <Ionicons name="notifications-outline" size={26} color="white" />
        {unreadCount > 0 && (
          <Animated.View
            style={[
              styles.badge,
              {
                transform: [
                  {
                    scale: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 0.8],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </Animated.View>
        )}
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [300, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thông Báo</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="notifications-off-outline"
                  size={50}
                  color="#575757"
                />
                <Text style={styles.emptyText}>Không có thông báo nào</Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item._id}
                renderItem={renderNotification}
                style={styles.notificationList}
                showsVerticalScrollIndicator={false}
              />
            )}

            {notifications.length > 0 && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearNotifications}
                >
                  <MaterialIcons name="delete-outline" size={20} color="#fff" />
                  <Text style={styles.clearButtonText}>Xóa Tất Cả</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>

      {renderOrderModal()}
    </View>
  );
};

export default NotificationIcon;

const styles = StyleSheet.create({
  iconContainer: {
    position: "relative",
    padding: 5,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#FF6347",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Nunito_700Bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: "50%",
    maxHeight: "80%",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E1E2E5",
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Raleway_700Bold",
    color: "#333",
  },
  notificationList: {
    marginBottom: 15,
  },
  notificationItem: {
    backgroundColor: "#F8F9FB",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E1E2E5",
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  notificationMessage: {
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    color: "#333",
    marginBottom: 8,
  },
  notificationPrice: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: "#FF6347",
    marginBottom: 5,
  },
  viewCourse: {
    fontSize: 14,
    fontFamily: "Nunito_600SemiBold",
    color: "#009990",
    textAlign: "right",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
    color: "#575757",
    marginTop: 10,
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: "#E1E2E5",
    paddingTop: 15,
  },
  clearButton: {
    backgroundColor: "#FF6347",
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    marginLeft: 8,
  },
  unreadNotification: {
    backgroundColor: "#E6F7F6",
    borderColor: "#009990",
    shadowColor: "#009990",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadText: {
    fontFamily: "Nunito_700Bold",
    color: "#000",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#009990",
    position: "absolute",
    right: 0,
    top: 0,
  },
  orderModalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: "60%",
    maxHeight: "90%",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  orderDetails: {
    flex: 1,
  },
  orderInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E1E2E5",
  },
  orderLabel: {
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    color: "#666",
  },
  orderValue: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: "#333",
  },
  coursesContainer: {
    marginTop: 20,
  },
  coursesTitle: {
    fontSize: 18,
    fontFamily: "Raleway_700Bold",
    color: "#333",
    marginBottom: 15,
  },
  courseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E1E2E5",
  },
  courseName: {
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  coursePrice: {
    fontSize: 16,
    fontFamily: "Nunito_700Bold",
    color: "#009990",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 2,
    borderTopColor: "#009990",
  },
  totalLabel: {
    fontSize: 18,
    fontFamily: "Raleway_700Bold",
    color: "#333",
  },
  totalPrice: {
    fontSize: 20,
    fontFamily: "Raleway_700Bold",
    color: "#FF6347",
  },
});
