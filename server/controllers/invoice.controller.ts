import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import {
    createInvoiceFromOrderService,
    deleteInvoiceService,
    getAllInvoicesService,
    getInvoiceByIdService,
} from "../services/invoice.service";
import ErrorHandler from "../utils/ErrorHandler";

export const createInvoiceFromOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.body;
      const invoice = await createInvoiceFromOrderService(orderId);

      res.status(201).json({
        success: true,
        invoice,
        message: "Tạo hóa đơn thành công",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Lấy danh sách hóa đơn
export const getAllInvoices = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invoices = await getAllInvoicesService();

      res.status(200).json({
        success: true,
        invoices,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Lấy chi tiết hóa đơn
export const getInvoiceById = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { invoiceId } = req.params;
      const invoice = await getInvoiceByIdService(invoiceId);

      res.status(200).json({
        success: true,
        invoice,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Xóa hóa đơn
export const deleteInvoice = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { invoiceId } = req.params;
      const result = await deleteInvoiceService(invoiceId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);