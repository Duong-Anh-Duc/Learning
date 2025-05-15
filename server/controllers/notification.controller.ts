import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import NotificationModel from "../models/notification.Model";
import ErrorHandler from "../utils/ErrorHandler";

// Lấy tất cả thông báo (cho admin)
export const getNotifications = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notifications = await NotificationModel.find().sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        notifications,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Lấy thông báo cho user cụ thể
export const getUserNotifications = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return next(new ErrorHandler("Vui lòng đăng nhập", 401));
      }

      const notifications = await NotificationModel.find({ userId }).sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        notifications,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const updateNotification = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notificationId = req.params.id;
      const userId = req.user?._id;

      if (!userId) {
        return next(new ErrorHandler("Vui lòng đăng nhập", 401));
      }

      // Tìm thông báo
      const notification = await NotificationModel.findById(notificationId);

      if (!notification) {
        return next(new ErrorHandler("Không tìm thấy thông báo", 404));
      }

      // Kiểm tra quyền sở hữu thông báo
      if (
        notification.userId !== userId.toString() &&
        req.user?.role !== "admin"
      ) {
        return next(
          new ErrorHandler("Bạn không có quyền cập nhật thông báo này", 403)
        );
      }

      // Cập nhật trạng thái thông báo
      notification.status = "read";
      await notification.save();

      res.status(200).json({
        success: true,
        notification,
      });
    } catch (error: any) {
      console.error("Lỗi khi cập nhật thông báo:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
