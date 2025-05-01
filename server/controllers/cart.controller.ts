// backend/controllers/cart.controller.ts
import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import CartModel from "../models/cart.model";
import CourseModel, { ICourse } from "../models/course.model";
import ErrorHandler from "../utils/ErrorHandler";

// Thêm khóa học vào giỏ hàng
export const addToCart = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.body;
      const userId = req.user?._id;

      if (!courseId) {
        return next(new ErrorHandler("Vui lòng cung cấp courseId", 400));
      }

      const course = await CourseModel.findById(courseId) as ICourse | null;
      if (!course) {
        return next(new ErrorHandler("Khóa học không tồn tại", 404));
      }

      let cart = await CartModel.findOne({ userId });
      if (!cart) {
        cart = await CartModel.create({
          userId,
          items: [],
        });
      }

      const itemExists = cart.items.some(
        (item) => item.courseId === courseId
      );
      if (itemExists) {
        return next(new ErrorHandler("Khóa học đã có trong giỏ hàng", 400));
      }

      // Kiểm tra và xử lý thumbnail
      const thumbnail = course.thumbnail &&
                       "public_id" in course.thumbnail &&
                       "url" in course.thumbnail &&
                       course.thumbnail.public_id &&
                       course.thumbnail.url
        ? {
            public_id: String(course.thumbnail.public_id), 
            url: String(course.thumbnail.url), 
          }
        : undefined;

      cart.items.push({
        courseId,
        courseName: course.name,
        priceAtPurchase: course.price,
        thumbnail, 
      });

      await cart.save();

      res.status(200).json({
        success: true,
        cart,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Xóa khóa học khỏi giỏ hàng
export const removeFromCart = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.body;
      const userId = req.user?._id;

      const cart = await CartModel.findOne({ userId });
      if (!cart) {
        return next(new ErrorHandler("Giỏ hàng không tồn tại", 404));
      }

      cart.items = cart.items.filter((item) => item.courseId !== courseId);
      await cart.save();

      res.status(200).json({
        success: true,
        cart,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Lấy giỏ hàng của người dùng
export const getCart = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const cart = await CartModel.findOne({ userId });

      res.status(200).json({
        success: true,
        cart: cart || { userId, items: [] },
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Xóa toàn bộ giỏ hàng
export const clearCart = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      await CartModel.deleteOne({ userId });

      res.status(200).json({
        success: true,
        message: "Giỏ hàng đã được xóa",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);