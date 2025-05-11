import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import {
  addToCartService,
  clearCartService,
  getCartService,
  removeFromCartService,
} from "../services/cart.service";
import ErrorHandler from "../utils/ErrorHandler";

export const addToCart = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.body;
      const userId = req.user?._id;
      console.log(userId);
      const cart = await addToCartService(userId, courseId);
      console.log("OK");
      res.status(200).json({
        success: true,
        cart,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const removeFromCart = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.body;
      const userId = req.user?._id;

      const cart = await removeFromCartService(userId, courseId);

      res.status(200).json({
        success: true,
        cart,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getCart = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const cart = await getCartService(userId);

      res.status(200).json({
        success: true,
        cart,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const clearCart = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const result = await clearCartService(userId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
