import express from "express";
import {
  createMobileOrder,
  //createOrder,
  getAllOrders,
  getPaymentIntentDetails,
  newPayment,
  sendStripePublishableKey,
} from "../controllers/order.controller";
import { isAutheticated } from "../middleware/auth";
const orderRouter = express.Router();

orderRouter.get("/payment-intent/:id", getPaymentIntentDetails);
orderRouter.post("/create-mobile-order", isAutheticated, createMobileOrder);

orderRouter.get("/get-orders", isAutheticated, getAllOrders);

orderRouter.get("/payment/stripepublishablekey", sendStripePublishableKey);

orderRouter.post("/payment", isAutheticated, newPayment);

export default orderRouter;
