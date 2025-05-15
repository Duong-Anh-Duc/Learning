import { useAuth } from "@/context/AuthContext";
import { theme } from "@/styles/theme";
import { Ionicons } from "@expo/vector-icons";
import {
  DrawerNavigationProp,
  useDrawerStatus,
} from "@react-navigation/drawer";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Toast } from "react-native-toast-notifications";
import NotificationIcon from "./notification/NotificationIcon";

// Định nghĩa ParamList cho DrawerNavigator
type DrawerParamList = {
  dashboard: undefined;
  "manage-courses": undefined;
  "manage-courses/course-details": undefined;
  "manage-users": undefined;
  "manage-categories": undefined;
  "manage-orders": undefined;
  "manage-comments": undefined;
  "change-password": undefined;
  "create-course": undefined;
  "create-lesson": undefined;
  "edit-course": undefined;
  "edit-lesson": undefined;
  "enrolled-users": undefined;
};

type CustomHeaderProps = {
  title: string;
  navigation: DrawerNavigationProp<DrawerParamList>;
};

const CustomHeader = ({ title, navigation }: CustomHeaderProps) => {
  const drawerStatus = useDrawerStatus(); // Lấy trạng thái drawer (open/closed)
  const isDrawerOpen = drawerStatus === "open"; // Đồng bộ trạng thái drawer
  const [isInteracting, setIsInteracting] = useState(false); // Trạng thái khi người dùng tương tác
  const { logout } = useAuth();

  const toggleDrawer = () => {
    if (isDrawerOpen) {
      navigation.closeDrawer();
    } else {
      navigation.openDrawer();
    }
  };

  const handleLogout = async () => {
    await logout();
    Toast.show("Đăng xuất thành công!", {
      type: "success",
      placement: "top",
      duration: 3000,
    });
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={toggleDrawer}
        onPressIn={() => setIsInteracting(true)}
        onPressOut={() => setIsInteracting(false)}
      >
        <Ionicons
          name={isDrawerOpen ? "close" : "menu"}
          size={30}
          color={theme.colors.white}
          style={{ opacity: isInteracting ? 1 : 0.5 }}
        />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerButton}>
        <NotificationIcon />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.large,
    paddingHorizontal: theme.spacing.medium,
    elevation: theme.elevation.medium,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerButton: {
    padding: theme.spacing.small,
  },
  headerTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.h1,
    color: theme.colors.white,
    textAlign: "center",
    flex: 1,
  },
});

export default CustomHeader;
