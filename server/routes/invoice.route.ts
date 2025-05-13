import express from "express";
import {
    createInvoiceFromOrder,
    deleteInvoice,
    getAllInvoices,
    getInvoiceById,
} from "../controllers/invoice.controller";
import { authorizeRoles, isAutheticated } from "../middleware/auth";

const invoiceRouter = express.Router();

// Tạo hóa đơn từ đơn hàng (admin only)
invoiceRouter.post(
  "/create-invoice",
  isAutheticated,
  authorizeRoles("admin"),
  createInvoiceFromOrder
);

// Lấy danh sách hóa đơn (admin only)
invoiceRouter.get(
  "/get-invoices",
  isAutheticated,
  authorizeRoles("admin"),
  getAllInvoices
);

// Lấy chi tiết hóa đơn (admin only)
invoiceRouter.get(
  "/get-invoice/:invoiceId",
  isAutheticated,
  authorizeRoles("admin"),
  getInvoiceById
);

// Xóa hóa đơn (admin only)
invoiceRouter.delete(
  "/delete-invoice/:invoiceId",
  isAutheticated,
  authorizeRoles("admin"),
  deleteInvoice
);

export default invoiceRouter;