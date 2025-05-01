import mongoose, { Document, Model, Schema } from "mongoose";

interface PaymentInfo {
  paymentIntentId?: string;
  status: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  created: number;
}

export interface IOrder extends Document {
  userId: string;
  courses: Array<{
    courseId: string;
    courseName: string;
    priceAtPurchase: number;
  }>;
  userName: string;
  payment_info: PaymentInfo;
  totalPrice: number;
  status: string; // Trạng thái đơn hàng
}

const paymentInfoSchema = new Schema<PaymentInfo>({
  paymentIntentId: { type: String, required: true },
  status: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  created: { type: Number, required: true },
});

const orderSchema = new Schema<IOrder>(
  {
    userId: {
      type: String,
      required: true,
    },
    courses: [
      {
        courseId: {
          type: String,
          required: true,
        },
        courseName: {
          type: String,
          required: true,
        },
        priceAtPurchase: {
          type: Number,
          required: true,
        },
      },
    ],
    userName: {
      type: String,
      required: true,
    },
    payment_info: {
      type: paymentInfoSchema,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Completed", "Cancelled", "Failed"], // Các trạng thái có thể có
      default: "Pending", // Mặc định là "Pending"
    },
  },
  { timestamps: true }
);

const OrderModel: Model<IOrder> = mongoose.model("Order", orderSchema);

export default OrderModel;