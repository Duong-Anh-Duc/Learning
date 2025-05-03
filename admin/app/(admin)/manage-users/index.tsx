// app/(admin)/manage-users/index.tsx
import api from "@/utils/api";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Toast } from "react-native-toast-notifications";

interface User {
  _id: string;
  email: string;
  role: string;
  isBanned: boolean;
  createdAt: string;
  updatedAt: string;
}

const ManageUsers = () => {
  const navigation = useNavigation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: "Quản Lý Người Dùng",
    });
  }, [navigation]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/get-users");
      setUsers(response.data.users || []);
    } catch (error: any) {
      Toast.show("Không thể tải danh sách người dùng!", {
        type: "danger",
        placement: "top",
        duration: 3000,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleUpdateRole = async (userId: string, currentRole: string) => {
    try {
      const newRole = currentRole === "admin" ? "user" : "admin";
      const user = users.find((u) => u._id === userId);
      if (!user) return;

      await api.put("/update-user", {
        email: user.email,
        role: newRole,
      });

      Toast.show("Cập nhật vai trò thành công!", {
        type: "success",
        placement: "top",
        duration: 3000,
      });

      setUsers(users.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
    } catch (error: any) {
      Toast.show(error.response?.data?.message || "Lỗi khi cập nhật vai trò!", {
        type: "danger",
        placement: "top",
        duration: 3000,
      });
    }
  };

  const handleBanUser = async (userId: string, currentBanStatus: boolean) => {
    try {
      const newBanStatus = !currentBanStatus; // Đảo ngược trạng thái ban
      await api.put(`/ban-user/${userId}`, { isBanned: newBanStatus });

      Toast.show(
        newBanStatus ? "Khóa người dùng thành công!" : "Bỏ khóa người dùng thành công!",
        {
          type: "success",
          placement: "top",
          duration: 3000,
        }
      );

      setUsers(users.map((u) => (u._id === userId ? { ...u, isBanned: newBanStatus } : u)));
    } catch (error: any) {
      Toast.show(error.response?.data?.message || "Lỗi khi cập nhật trạng thái ban!", {
        type: "danger",
        placement: "top",
        duration: 3000,
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await api.delete(`/delete-user/${userId}`);
      Toast.show("Xóa người dùng thành công!", {
        type: "success",
        placement: "top",
        duration: 3000,
      });

      setUsers(users.filter((u) => u._id !== userId));
    } catch (error: any) {
      Toast.show(error.response?.data?.message || "Lỗi khi xóa người dùng!", {
        type: "danger",
        placement: "top",
        duration: 3000,
      });
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userRole}>{item.role}</Text>
        <Text style={styles.userStatus}>
          Trạng thái: {item.isBanned ? "Bị khóa" : "Hoạt động"}
        </Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleUpdateRole(item._id, item.role)}
        >
          <Ionicons
            name={item.role === "admin" ? "person-outline" : "shield-checkmark-outline"}
            size={24}
            color="#009990"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleBanUser(item._id, item.isBanned)}
        >
          <Ionicons
            name={item.isBanned ? "lock-open-outline" : "lock-closed-outline"}
            size={24}
            color={item.isBanned ? "#00cc00" : "#ff9900"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeleteUser(item._id)}
        >
          <Ionicons name="trash-outline" size={24} color="#ff4444" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#009990" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item._id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có người dùng nào!</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7F9",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  userItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  userRole: {
    fontSize: 14,
    color: "#575757",
    marginTop: 5,
  },
  userStatus: {
    fontSize: 14,
    color: "#575757",
    marginTop: 5,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#575757",
  },
});

export default ManageUsers;