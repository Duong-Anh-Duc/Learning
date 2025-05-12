import ejs from "ejs";
import path from "path";
import CartModel from "../models/cart.model";
import CourseModel from "../models/course.model";
import NotificationModel from "../models/notification.Model";
import OrderModel from "../models/order.Model";
import userModel from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { redis } from "../utils/redis";
import sendMail from "../utils/sendMail";

interface CreateMobileOrderData {
  userId: string;
  payment_info: any;
  selectedCourseIds: string[];
}

export const createMobileOrderService = async (data: CreateMobileOrderData) => {
  const { userId, payment_info, selectedCourseIds } = data;

  const user = await userModel.findById(userId);
  if (!user) {
    throw new ErrorHandler("Người dùng không tồn tại", 404);
  }

  const cart = await CartModel.findOne({ userId });
  if (!cart) {
    throw new ErrorHandler("Giỏ hàng không tồn tại", 404);
  }

  const coursesInCart = await Promise.all(
    cart.items
      .filter((item) => selectedCourseIds.includes(item.courseId))
      .map(async (item) => {
        const course = await CourseModel.findById(item.courseId);
        if (!course) {
          throw new Error(`Khóa học không tồn tại: ${item.courseId}`);
        }
        return {
          courseId: item.courseId,
          courseName: course.name,
          priceAtPurchase: course.price,
        };
      })
  );

  if (coursesInCart.length === 0) {
    throw new ErrorHandler("Không có khóa học nào được chọn", 400);
  }

  for (const course of coursesInCart) {
    const courseExistInUser = user.courses.some(
      (c: any) => c.courseId && c.courseId.toString() === course.courseId
    );
    if (courseExistInUser) {
      throw new ErrorHandler(`Bạn đã mua khóa học: ${course.courseName}`, 400);
    }
  }

  const totalPrice = coursesInCart.reduce(
    (total, course) => total + course.priceAtPurchase,
    0
  );

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

  const order = await OrderModel.create({
    userId,
    userName: user.name,
    courses: coursesInCart,
    payment_info: formattedPaymentInfo,
    totalPrice,
    status:
      formattedPaymentInfo.status === "succeeded" ? "Completed" : "Failed",
  });

  // Sửa đoạn code này: Thêm enrollmentDate khi đẩy vào user.courses
  coursesInCart.forEach((course) => {
    if (course.courseId) {
      user.courses.push({
        courseId: course.courseId,
        enrollmentDate: new Date(), // Thêm enrollmentDate
      });
    }
  });

  await user.save();
  await redis.set(userId, JSON.stringify(user));

  cart.items = cart.items.filter(
    (item) => !selectedCourseIds.includes(item.courseId)
  );
  await cart.save();

  await NotificationModel.create({
    user: userId,
    title: "Đơn Hàng Mới",
    message: `Bạn đã đặt mua thành công ${coursesInCart.length} khóa học`,
  });

  await Promise.all(
    coursesInCart.map(async (course) => {
      const courseDoc = await CourseModel.findById(course.courseId);
      if (courseDoc) {
        courseDoc.purchased = (courseDoc.purchased || 0) + 1;
        await courseDoc.save();
      }
    })
  );

  const mailData = {
    order: {
      _id: order._id.toString().slice(0, 6),
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

  const html = await ejs.renderFile(
    path.join(__dirname, "../mails/order-confirmation.ejs"),
    { order: mailData }
  );

  if (user) {
    await sendMail({
      email: user.email,
      subject: "Xác Nhận Đơn Hàng",
      template: "order-confirmation.ejs",
      data: mailData,
    });
  }

  return order;
};

export const getAllOrdersService = async () => {
  const orders = await OrderModel.find().sort({ createdAt: -1 });
  return orders;
};

export const newPaymentService = async (amount: number) => {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  if (!amount) {
    throw new ErrorHandler("Vui lòng cung cấp số tiền", 400);
  }
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: "vnd",
    payment_method_types: ["card"],
  });
  return {
    client_secret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  };
};

export const getPaymentIntentDetailsService = async (
  paymentIntentId: string
) => {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  if (!paymentIntentId) {
    throw new ErrorHandler("Vui lòng cung cấp PaymentIntent ID", 400);
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  return {
    id: paymentIntent.id,
    status: paymentIntent.status,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    payment_method_types: paymentIntent.payment_method_types,
    created: paymentIntent.created,
  };
};
