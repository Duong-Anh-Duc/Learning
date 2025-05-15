// frontend/components/notification/NotificationIcon.tsx
import { useUser } from "@/context/UserContext";
import { SERVER_URI } from "@/utils/uri";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { router } from "expo-router";
import React, { useMemo, useState, useEffect } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  ActivityIndicator,
} from "react-native";

interface NotificationItem {
  id: string;
  message: string;
  type: string;
  courseId?: string;
  price?: number;
  status: "read" | "unread";
}

const formatPrice = (price?: number) => {
  if (!price) return "";
  return price.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
};

const NotificationIcon = () => {
  const { notifications: rawNotifications, clearNotifications } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const notifications: NotificationItem[] = rawNotifications.map((item) => ({
    ...item,
    status: item.status as "read" | "unread",
  }));
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useState(new Animated.Value(0))[0];

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
      setIsLoading(true);
      // Cập nhật trạng thái đã đọc
      const accessToken = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");

      if (accessToken && refreshToken) {
        await axios.put(
          `${SERVER_URI}/update-notification/${notification.id}`,
          {},
          {
            headers: {
              "access-token": accessToken,
              "refresh-token": refreshToken,
            },
          }
        );
      }

      // Nếu có courseId, chuyển đến trang chi tiết khóa học
      if (notification.courseId) {
        router.push({
          pathname: "/(routes)/course-details",
          params: { courseId: notification.courseId },
        });
        setModalVisible(false);
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái thông báo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderNotification = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        item.status === "unread" && styles.unreadNotification,
      ]}
      onPress={() => handleNotificationPress(item)}
      disabled={isLoading}
    >
      <View style={styles.notificationHeader}>
        <MaterialIcons
          name={
            item.type === "orderSuccess" ? "shopping-cart" : "notifications"
          }
          size={24}
          color="#009990"
        />
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
      {item.price && (
        <Text style={styles.notificationPrice}>
          Giá: {formatPrice(item.price)}
        </Text>
      )}
      {item.courseId && (
        <Text style={styles.viewCourse}>Xem chi tiết khóa học →</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={styles.iconContainer}
      >
        <Ionicons name="notifications-outline" size={26} color="black" />
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
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                disabled={isLoading}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#009990" />
                <Text style={styles.loadingText}>Đang tải...</Text>
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="notifications-off-outline"
                  size={50}
                  color="#575757"
                />
                <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
              </View>
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderNotification}
                style={styles.notificationList}
                showsVerticalScrollIndicator={false}
              />
            )}

            {notifications.length > 0 && !isLoading && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => {
                    clearNotifications();
                    setModalVisible(false);
                  }}
                >
                  <MaterialIcons name="delete-outline" size={20} color="#fff" />
                  <Text style={styles.clearButtonText}>Xóa Tất Cả</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

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
    justifyContent: "flex-end", // Modal hiển thị từ dưới lên
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
  notificationTime: {
    fontSize: 12,
    fontFamily: "Nunito_600SemiBold",
    color: "#009990",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    color: "#575757",
  },
});

export default NotificationIcon;
