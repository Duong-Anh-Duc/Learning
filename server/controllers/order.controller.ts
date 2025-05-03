import ejs from "ejs";
import { NextFunction, Request, Response } from "express";
import path from "path";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import CartModel from "../models/cart.model";
import CourseModel from "../models/course.model";
import NotificationModel from "../models/notification.Model";
import OrderModel from "../models/order.Model";
import userModel from "../models/user.model";
import { getAllOrdersService } from "../services/order.service";
import ErrorHandler from "../utils/ErrorHandler";
import { redis } from "../utils/redis";
import sendMail from "../utils/sendMail";
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Tạo đơn hàng từ ứng dụng di động
export const createMobileOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return next(new ErrorHandler("Người dùng chưa đăng nhập", 401));
      }

      const { payment_info, selectedCourseIds } = req.body;
      if (!payment_info || !selectedCourseIds || !Array.isArray(selectedCourseIds)) {
        return next(
          new ErrorHandler("Vui lòng cung cấp thông tin thanh toán và danh sách khóa học", 400)
        );
      }

      const user = await userModel.findById(userId);
      if (!user) {
        return next(new ErrorHandler("Người dùng không tồn tại", 404));
      }

      const cart = await CartModel.findOne({ userId });
      if (!cart) {
        return next(new ErrorHandler("Giỏ hàng không tồn tại", 404));
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
        return next(new ErrorHandler("Không có khóa học nào được chọn", 400));
      }

      for (const course of coursesInCart) {
        const courseExistInUser = user.courses.some(
          (c: any) => c.courseId && c.courseId.toString() === course.courseId
        );
        if (courseExistInUser) {
          return next(
            new ErrorHandler(
              `Bạn đã mua khóa học: ${course.courseName}`,
              400
            )
          );
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
        paymentMethod: payment_info.paymentIntent?.payment_method_types?.[0] || "card",
        created: payment_info.paymentIntent?.created || Math.floor(Date.now() / 1000),
      };

      const order = await OrderModel.create({
        userId,
        userName: user.name,
        courses: coursesInCart,
        payment_info: formattedPaymentInfo,
        totalPrice,
        status: formattedPaymentInfo.status === "succeeded" ? "Completed" : "Failed", // Sửa ở đây
      });

      console.log("Đơn hàng đã được tạo:", order);

      coursesInCart.forEach((course) => {
        if (course.courseId) {
          user.courses.push({ courseId: course.courseId });
        }
      });

      await user.save();
      console.log("Người dùng đã được cập nhật với khóa học:", user.courses);

      await redis.set(userId, JSON.stringify(user));
      console.log("Người dùng đã được lưu vào Redis:", userId);

      cart.items = cart.items.filter(
        (item) => !selectedCourseIds.includes(item.courseId)
      );
      await cart.save();
      console.log("Giỏ hàng đã được cập nhật:", cart.items);

      await NotificationModel.create({
        user: userId,
        title: "Đơn Hàng Mới",
        message: `Bạn đã đặt mua thành công ${coursesInCart.length} khóa học`,
      });
      console.log("Thông báo đã được tạo cho người dùng:", userId);

      await Promise.all(
        coursesInCart.map(async (course) => {
          const courseDoc = await CourseModel.findById(course.courseId);
          if (courseDoc) {
            courseDoc.purchased = (courseDoc.purchased || 0) + 1;
            await courseDoc.save();
            console.log("Số lượng mua khóa học đã được cập nhật:", course.courseId);
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
        console.log("Email đã được gửi đến:", user.email);
      }

      res.status(201).json({
        success: true,
        order,
        message: "Tạo đơn hàng thành công",
      });
    } catch (error: any) {
      console.error("Lỗi khi tạo đơn hàng:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Lấy tất cả đơn hàng --- chỉ dành cho admin
export const getAllOrders = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllOrdersService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Gửi khóa công khai của Stripe
export const sendStripePublishableKey = CatchAsyncError(
  async (req: Request, res: Response) => {
    res.status(200).json({
      publishablekey: process.env.STRIPE_PUBLISHABLE_KEY,
      message: "Lấy khóa công khai Stripe thành công",
    });
  }
);

// Tạo thanh toán mới
export const newPayment = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { amount } = req.body;
      if (!amount) {
        return next(new ErrorHandler("Vui lòng cung cấp số tiền", 400));
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "vnd",
        payment_method_types: ["card"],
      });

      res.status(200).json({
        success: true,
        client_secret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        message: "Tạo thanh toán mới thành công",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Lấy chi tiết Payment Intent
export const getPaymentIntentDetails = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        return next(new ErrorHandler("Vui lòng cung cấp PaymentIntent ID", 400));
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(id);

      res.status(200).json({
        success: true,
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        payment_method_types: paymentIntent.payment_method_types,
        created: paymentIntent.created,
        message: "Lấy chi tiết Payment Intent thành công",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);