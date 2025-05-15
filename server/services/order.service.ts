// order.service.ts
import ejs from "ejs";
import path from "path";
import CartModel from "../models/cart.model";
import CourseModel from "../models/course.model";
import NotificationModel from "../models/notification.Model";
import OrderModel from "../models/order.Model";
import userModel from "../models/user.model";
import { io } from "../server"; // Import io từ server
import ErrorHandler from "../utils/ErrorHandler";
import { redis } from "../utils/redis";
import sendMail from "../utils/sendMail";
import { createInvoiceFromOrderService } from "./invoice.service";

interface CreateMobileOrderData {
  userId: string;
  payment_info: any;
  selectedCourseIds: string[];
}

export const createMobileOrderService = async (data: CreateMobileOrderData) => {
  const { userId, payment_info, selectedCourseIds } = data;

  console.log("Bắt đầu tạo đơn hàng trong createMobileOrderService...");
  console.log("Dữ liệu đầu vào:", { userId, payment_info, selectedCourseIds });

  console.log("Tìm người dùng với ID:", userId);
  const user = await userModel.findById(userId);
  if (!user) {
    console.log("Không tìm thấy người dùng với ID:", userId);
    throw new ErrorHandler("Người dùng không tồn tại", 404);
  }
  console.log("Người dùng tìm thấy:", {
    id: user._id,
    name: user.name,
    email: user.email,
    courses: user.courses,
  });

  console.log("Tìm giỏ hàng của người dùng...");
  const cart = await CartModel.findOne({ userId });
  if (!cart) {
    console.log("Không tìm thấy giỏ hàng cho người dùng:", userId);
    throw new ErrorHandler("Giỏ hàng không tồn tại", 404);
  }
  console.log("Giỏ hàng tìm thấy:", cart);

  console.log("Lọc các khóa học trong giỏ hàng theo selectedCourseIds...");
  const coursesInCart = await Promise.all(
    cart.items
      .filter((item) => selectedCourseIds.includes(item.courseId))
      .map(async (item) => {
        console.log("Tìm khóa học với ID:", item.courseId);
        const course = await CourseModel.findById(item.courseId);
        if (!course) {
          console.log("Không tìm thấy khóa học với ID:", item.courseId);
          throw new Error(`Khóa học không tồn tại: ${item.courseId}`);
        }
        console.log("Khóa học tìm thấy:", {
          id: course._id,
          name: course.name,
          price: course.price,
        });
        return {
          courseId: item.courseId,
          courseName: course.name,
          priceAtPurchase: course.price,
        };
      })
  );

  console.log("Danh sách khóa học trong giỏ hàng sau khi lọc:", coursesInCart);

  if (coursesInCart.length === 0) {
    console.log("Không có khóa học nào được chọn để tạo đơn hàng.");
    throw new ErrorHandler("Không có khóa học nào được chọn", 400);
  }

  console.log("Kiểm tra xem người dùng đã mua các khóa học này chưa...");
  for (const course of coursesInCart) {
    const courseExistInUser = user.courses.some(
      (c: any) => c.courseId && c.courseId.toString() === course.courseId
    );
    if (courseExistInUser) {
      console.log(`Người dùng đã mua khóa học ${course.courseName} trước đó.`);
      throw new ErrorHandler(`Bạn đã mua khóa học: ${course.courseName}`, 400);
    }
  }

  console.log("Tính tổng giá đơn hàng...");
  const totalPrice = coursesInCart.reduce(
    (total, course) => total + course.priceAtPurchase,
    0
  );
  console.log("Tổng giá đơn hàng:", totalPrice);

  console.log("Định dạng thông tin thanh toán...");
  const formattedPaymentInfo = {
    paymentIntentId: payment_info.paymentIntent?.id || "",
    status: payment_info.paymentIntent?.status || "succeeded",
    amount: payment_info.paymentIntent?.amount || totalPrice * 100,
    currency: payment_info.paymentIntent?.currency || "vnd",
    paymentMethod:
      payment_info.paymentIntent?.payment_method_types?.[0] || "card",
    created:
      payment_info.paymentIntent?.created || Math.floor(Date.now() / 1000),
  };
  console.log("Thông tin thanh toán đã định dạng:", formattedPaymentInfo);

  console.log("Tạo đơn hàng trong cơ sở dữ liệu...");
  const order = await OrderModel.create({
    userId,
    userName: user.name,
    courses: coursesInCart,
    payment_info: formattedPaymentInfo,
    totalPrice,
    status:
      formattedPaymentInfo.status === "succeeded" ? "Completed" : "Failed",
  });
  console.log("Đơn hàng đã được tạo:", order);

  // Tạo hóa đơn từ đơn hàng
  console.log("Tạo hóa đơn từ đơn hàng...");
  const invoice = await createInvoiceFromOrderService(order._id.toString());
  console.log("Hóa đơn đã được tạo:", invoice);

  console.log("Cập nhật danh sách khóa học đã mua của người dùng...");
  coursesInCart.forEach((course) => {
    if (course.courseId) {
      user.courses.push({
        courseId: course.courseId,
        enrollmentDate: new Date(),
      });
    }
  });
  await user.save();
  console.log(
    "Danh sách khóa học của người dùng sau khi cập nhật:",
    user.courses
  );

  console.log("Cập nhật Redis với thông tin người dùng mới...");
  await redis.set(userId, JSON.stringify(user));
  console.log("Đã cập nhật Redis thành công.");

  console.log("Xóa các khóa học đã mua khỏi giỏ hàng...");
  cart.items = cart.items.filter(
    (item) => !selectedCourseIds.includes(item.courseId)
  );
  await cart.save();
  console.log("Giỏ hàng sau khi xóa:", cart);

  console.log("Tạo thông báo cho từng khóa học");
  for (const course of coursesInCart) {
    await NotificationModel.create({
      userId: userId,
      title: "Đơn Hàng Mới",
      message: `Bạn đã mua thành công khóa học "${course.courseName}"`,
      courseId: course.courseId,
      price: course.priceAtPurchase,
      status: "unread",
    });
  }
  console.log("Đã tạo thông báo cho tất cả khóa học.");

  // Gửi thông báo qua socket.io cho học viên
  io.to(userId).emit("orderSuccess", {
    message: `Bạn đã mua thành công ${coursesInCart.length} khóa học!`,
    order,
  });

  // Gửi thông báo qua socket.io cho quản trị viên
  const admins = await userModel.find({ role: "admin" });
  admins.forEach(async (admin) => {
    // Tạo thông báo trong database cho admin
    const notification = await NotificationModel.create({
      userId: admin._id.toString(),
      title: "Đơn Hàng Mới",
      message: `${
        user.name
      } đã mua khóa học với tổng giá ${totalPrice.toLocaleString("vi-VN")}đ`,
      status: "unread",
      type: "order",
      order: {
        _id: order._id,
        userName: user.name,
        courses: coursesInCart,
        totalPrice: totalPrice,
        createdAt: order.createdAt,
      },
    });

    // Gửi thông báo qua socket
    io.to(admin._id.toString()).emit("newOrder", {
      message: `Đơn hàng mới từ ${user.name}`,
      order: {
        _id: order._id,
        userName: user.name,
        courses: coursesInCart,
        totalPrice: totalPrice,
        createdAt: order.createdAt,
      },
      _id: notification._id,
      type: "order",
      status: "unread",
    });
  });

  console.log("Cập nhật số lượng người mua cho các khóa học...");
  await Promise.all(
    coursesInCart.map(async (course) => {
      const courseDoc = await CourseModel.findById(course.courseId);
      if (courseDoc) {
        courseDoc.purchased = (courseDoc.purchased || 0) + 1;
        await courseDoc.save();
        console.log(
          `Đã cập nhật số lượng người mua cho khóa học ${course.courseName}:`,
          courseDoc.purchased
        );
      }
    })
  );

  console.log("Chuẩn bị gửi email xác nhận...");
  const mailData = {
    order: {
      _id: order._id.toString().slice(0, 6),
      invoiceId: invoice.invoiceId,
      courses: coursesInCart.map((course) => ({
        name: course.courseName,
        price: course.priceAtPurchase,
      })),
      totalPrice,
      date: new Date().toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    },
  };

  console.log("Dữ liệu email:", mailData);

  const html = await ejs.renderFile(
    path.join(__dirname, "../mails/order-confirmation.ejs"),
    { order: mailData }
  );

  if (user) {
    console.log("Gửi email xác nhận đến:", user.email);
    await sendMail({
      email: user.email,
      subject: "Xác Nhận Đơn Hàng",
      template: "order-confirmation.ejs",
      data: mailData,
    });
    console.log("Email xác nhận đã được gửi.");
  }

  return order;
};

// Các service khác giữ nguyên
export const getAllOrdersService = async () => {
  console.log("Bắt đầu lấy tất cả đơn hàng trong getAllOrdersService...");
  const orders = await OrderModel.find().sort({ createdAt: -1 });
  console.log("Danh sách đơn hàng:", orders);
  return orders;
};

export const newPaymentService = async (amount: number) => {
  console.log("Bắt đầu tạo PaymentIntent trong newPaymentService...");
  console.log("Số tiền:", amount);

  if (!amount || amount <= 0) {
    console.log("Số tiền không hợp lệ:", amount);
    throw new ErrorHandler("Số tiền không hợp lệ", 400);
  }

  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  console.log(
    "Khởi tạo Stripe với STRIPE_SECRET_KEY:",
    process.env.STRIPE_SECRET_KEY ? "Đã thiết lập" : "Chưa thiết lập"
  );

  try {
    console.log("Tạo PaymentIntent với Stripe...");
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "vnd",
      payment_method_types: ["card"],
    });
    console.log("PaymentIntent đã được tạo:", {
      id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      status: paymentIntent.status,
    });

    return {
      client_secret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error: any) {
    console.error("Lỗi khi tạo PaymentIntent với Stripe:", {
      message: error.message,
      type: error.type,
      code: error.code,
      raw: error.raw,
    });
    throw error;
  }
};

export const getPaymentIntentDetailsService = async (
  paymentIntentId: string
) => {
  console.log(
    "Bắt đầu lấy chi tiết PaymentIntent trong getPaymentIntentDetailsService..."
  );
  console.log("PaymentIntent ID:", paymentIntentId);

  if (!paymentIntentId) {
    console.log("PaymentIntent ID không được cung cấp.");
    throw new ErrorHandler("Vui lòng cung cấp PaymentIntent ID", 400);
  }

  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  console.log(
    "Khởi tạo Stripe với STRIPE_SECRET_KEY:",
    process.env.STRIPE_SECRET_KEY ? "Đã thiết lập" : "Chưa thiết lập"
  );

  try {
    console.log("Lấy chi tiết PaymentIntent từ Stripe...");
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log("Chi tiết PaymentIntent:", paymentIntent);

    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      payment_method_types: paymentIntent.payment_method_types,
      created: paymentIntent.created,
    };
  } catch (error: any) {
    console.error("Lỗi khi lấy chi tiết PaymentIntent từ Stripe:", {
      message: error.message,
      type: error.type,
      code: error.code,
      raw: error.raw,
    });
    throw error;
  }
};
