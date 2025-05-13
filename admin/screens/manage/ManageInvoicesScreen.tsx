import CustomHeader from "@/components/CustomHeader";
import { dashboardStyles } from "@/styles/dashboard/dashboard.styles";
import { theme } from "@/styles/theme";
import api from "@/utils/api";
import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Raleway_700Bold, useFonts } from '@expo-google-fonts/raleway';
import { useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Toast } from "react-native-toast-notifications";

// Định nghĩa ParamList cho DrawerNavigator (giữ nguyên để tham khảo)
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
  "manage-invoices": undefined;
};

// Định nghĩa interface cho dữ liệu hóa đơn
interface Invoice {
  invoiceId: string;
  userId: string;
  userName: string;
  userEmail: string;
  courses: Array<{
    courseId: string;
    courseName: string;
    priceAtPurchase: number;
  }>;
  totalPrice: number;
  paymentInfo: {
    paymentIntentId?: string;
    status: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    created: number;
  };
  status: string;
  createdAt: string;
  updatedAt: string;
}

const FontLoader = ({ children }: { children: React.ReactNode }) => {
  const [fontsLoaded, fontError] = useFonts({
    Raleway_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
};

const ManageInvoicesScreen = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  // Hàm lấy danh sách hóa đơn
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get("/get-invoices"); // Đã bỏ /invoice
      setInvoices(response.data.invoices || []);
    } catch (error: any) {
      console.error("Lỗi khi tải danh sách hóa đơn:", error);
      Toast.show(error.response?.data?.message || "Không thể tải danh sách hóa đơn!", { type: "danger" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Hàm làm mới danh sách hóa đơn
  const handleRefresh = () => {
    setRefreshing(true);
    fetchInvoices();
  };

  // Hàm xóa hóa đơn
  const handleDeleteInvoice = async (invoiceId: string) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa hóa đơn này? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          onPress: async () => {
            try {
              await api.delete(`/delete-invoice/${invoiceId}`); // Đã bỏ /invoice
              setInvoices(invoices.filter((invoice) => invoice.invoiceId !== invoiceId));
              Toast.show("Xóa hóa đơn thành công!", { type: "success" });
            } catch (error: any) {
              console.error("Lỗi khi xóa hóa đơn:", error);
              Toast.show(error.response?.data?.message || "Không thể xóa hóa đơn!", { type: "danger" });
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  // Hàm xem chi tiết hóa đơn
  const handleViewInvoice = async (invoiceId: string) => {
    try {
      const response = await api.get(`/get-invoice/${invoiceId}`); // Đã bỏ /invoice
      const invoice = response.data.invoice;
      Alert.alert(
        "Chi Tiết Hóa Đơn",
        `
Mã hóa đơn: ${invoice.invoiceId}
Người dùng: ${invoice.userName} (${invoice.userEmail})
Tổng tiền: ${invoice.totalPrice} VNĐ
Trạng thái: ${invoice.status}
Ngày tạo: ${new Date(invoice.createdAt).toLocaleDateString()}
Số khóa học: ${invoice.courses.length}
        `,
        [
          { text: "Đóng", style: "cancel" },
        ]
      );
    } catch (error: any) {
      console.error("Lỗi khi xem chi tiết hóa đơn:", error);
      Toast.show(error.response?.data?.message || "Không thể xem chi tiết hóa đơn!", { type: "danger" });
    }
  };

  // Hàm render từng hóa đơn
  const renderInvoiceItem = ({ item }: { item: Invoice }) => (
    <View style={styles.invoiceCard}>
      <View style={styles.invoiceInfo}>
        <Text style={styles.invoiceTitle}>
          Mã hóa đơn: {item.invoiceId}
        </Text>
        <Text style={styles.invoiceDetails}>
          Người dùng: {item.userName} ({item.userEmail})
        </Text>
        <Text style={styles.invoiceDetails}>
          Tổng tiền: {item.totalPrice} VNĐ
        </Text>
        <Text style={[styles.invoiceDetails, { color: item.status === "Completed" ? theme.colors.success : theme.colors.error }]}>
          Trạng thái: {item.status}
        </Text>
      </View>
      <View style={styles.invoiceActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
          onPress={() => handleViewInvoice(item.invoiceId)}
        >
          <Text style={styles.actionButtonText}>Xem</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
          onPress={() => handleDeleteInvoice(item.invoiceId)}
        >
          <Text style={styles.actionButtonText}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <FontLoader>
      <SafeAreaView style={styles.safeArea}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : (
          <View style={styles.container}>
            <CustomHeader title="Quản Lý Hóa Đơn" navigation={navigation} />
            <View style={[dashboardStyles.container, styles.contentContainer]}>
              <FlatList
                data={invoices}
                keyExtractor={(item) => item.invoiceId}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                renderItem={renderInvoiceItem}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    Không có hóa đơn nào để hiển thị.
                  </Text>
                }
              />
            </View>
          </View>
        )}
      </SafeAreaView>
    </FontLoader>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.medium,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  invoiceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.medium,
    borderRadius: theme.borderRadius.medium,
    marginBottom: theme.spacing.small,
    backgroundColor: theme.colors.white,
    elevation: theme.elevation.small,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  invoiceInfo: {
    flex: 1,
    marginRight: theme.spacing.medium,
  },
  invoiceTitle: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.body,
    color: theme.colors.text,
  },
  invoiceDetails: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.small,
  },
  invoiceActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  actionButton: {
    paddingVertical: theme.spacing.small,
    paddingHorizontal: theme.spacing.medium,
    borderRadius: theme.borderRadius.small,
    marginLeft: theme.spacing.small,
    marginBottom: theme.spacing.small,
  },
  actionButtonText: {
    fontFamily: theme.typography.fontFamily.semiBold,
    fontSize: theme.typography.fontSize.caption,
    color: theme.colors.white,
  },
  emptyText: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.fontSize.body,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: theme.spacing.large,
  },
});

export default ManageInvoicesScreen;