import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import {
  createMobileOrderService,
  getAllOrdersService,
  getPaymentIntentDetailsService,
  newPaymentService,
} from "../services/order.service";
import ErrorHandler from "../utils/ErrorHandler";

export const createMobileOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return next(new ErrorHandler("Người dùng chưa đăng nhập", 401));
      }

      const { payment_info, selectedCourseIds } = req.body;
      if (
        !payment_info ||
        !selectedCourseIds ||
        !Array.isArray(selectedCourseIds)
      ) {
        return next(
          new ErrorHandler(
            "Vui lòng cung cấp thông tin thanh toán và danh sách khóa học",
            400
          )
        );
      }

      const order = await createMobileOrderService({
        userId,
        payment_info,
        selectedCourseIds,
      });

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

export const getAllOrders = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await getAllOrdersService();

      res.status(201).json({
        success: true,
        orders,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const sendStripePublishableKey = CatchAsyncError(
  async (req: Request, res: Response) => {
    res.status(200).json({
      publishablekey: process.env.STRIPE_PUBLISHABLE_KEY,
      message: "Lấy khóa công khai Stripe thành công",
    });
  }
);

export const newPayment = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { amount } = req.body;
      const { client_secret, paymentIntentId } = await newPaymentService(
        amount
      );

      res.status(200).json({
        success: true,
        client_secret,
        paymentIntentId,
        message: "Tạo thanh toán mới thành công",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getPaymentIntentDetails = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const details = await getPaymentIntentDetailsService(id);

      res.status(200).json({
        success: true,
        ...details,
        message: "Lấy chi tiết Payment Intent thành công",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
