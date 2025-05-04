// frontend/components/notification/NotificationIcon.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@/context/UserContext";

const NotificationIcon = () => {
  const { notifications, clearNotifications } = useUser();
  const [modalVisible, setModalVisible] = useState(false);

  const renderNotification = ({ item }: { item: { id: string; message: string; type: string } }) => (
    <View style={styles.notificationItem}>
      <Text style={styles.notificationText}>{item.message}</Text>
    </View>
  );

  return (
    <View>
      <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.iconContainer}>
        <Ionicons name="notifications-outline" size={26} color="black" />
        {notifications.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{notifications.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Thông Báo</Text>
            {notifications.length === 0 ? (
              <Text style={styles.emptyText}>Không có thông báo nào</Text>
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderNotification}
                style={styles.notificationList}
              />
            )}
            <View style={styles.modalButtons}>
              {notifications.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => {
                    clearNotifications();
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.clearButtonText}>Xóa Tất Cả</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF6347",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Raleway_700Bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  notificationList: {
    maxHeight: 400,
    marginBottom: 15,
  },
  notificationItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E1E2E5",
  },
  notificationText: {
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
    color: "#333",
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Nunito_400Regular",
    color: "#575757",
    textAlign: "center",
    marginVertical: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  clearButton: {
    backgroundColor: "#FF6347",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flex: 1,
    marginRight: 10,
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: "#009990",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flex: 1,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Nunito_600SemiBold",
    textAlign: "center",
  },
});

export default NotificationIcon;