import { randomBytes } from "crypto"; // Sử dụng crypto thay cho nanoid
import InvoiceModel, { IInvoice } from "../models/invoice.model";
import OrderModel from "../models/order.Model";
import userModel from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";

export const createInvoiceFromOrderService = async (orderId: string): Promise<IInvoice> => {
  const order = await OrderModel.findById(orderId);
  if (!order) {
    throw new ErrorHandler("Đơn hàng không tồn tại", 404);
  }

  // Tạo chuỗi ngẫu nhiên bằng crypto.randomBytes
  const randomString = randomBytes(5).toString("hex"); // Tạo chuỗi 10 ký tự (5 bytes = 10 ký tự hex)
  const invoiceId = `INV-${randomString}`; // Ví dụ: INV-a1b2c3d4e5

  const invoiceData: Partial<IInvoice> = {
    invoiceId,
    userId: order.userId,
    userName: order.userName,
    userEmail: (await userModel.findById(order.userId))?.email || "",
    courses: order.courses.map((course) => ({
      courseId: course.courseId,
      courseName: course.courseName,
      priceAtPurchase: course.priceAtPurchase,
    })),
    totalPrice: order.totalPrice,
    paymentInfo: {
      paymentIntentId: order.payment_info.paymentIntentId,
      status: order.payment_info.status,
      amount: order.payment_info.amount,
      currency: order.payment_info.currency,
      paymentMethod: order.payment_info.paymentMethod,
      created: order.payment_info.created,
    },
    status: order.status,
  };

  const invoice = await InvoiceModel.create(invoiceData);
  return invoice;
};

export const getAllInvoicesService = async (): Promise<IInvoice[]> => {
  const invoices = await InvoiceModel.find().sort({ createdAt: -1 });
  return invoices;
};

export const getInvoiceByIdService = async (invoiceId: string): Promise<IInvoice> => {
  const invoice = await InvoiceModel.findOne({ invoiceId });
  if (!invoice) {
    throw new ErrorHandler("Hóa đơn không tồn tại", 404);
  }
  return invoice;
};

export const deleteInvoiceService = async (invoiceId: string): Promise<{ message: string }> => {
  const invoice = await InvoiceModel.findOne({ invoiceId });
  if (!invoice) {
    throw new ErrorHandler("Hóa đơn không tồn tại", 404);
  }

  await InvoiceModel.deleteOne({ invoiceId });
  return { message: "Xóa hóa đơn thành công" };
};