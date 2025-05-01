// backend/models/cart.model.ts
import mongoose, { Document, Schema } from "mongoose";

export interface ICartItem {
  courseId: string;
  courseName: string;
  priceAtPurchase: number;
  thumbnail?: {
    public_id: string;
    url: string;
  };
}

export interface ICart extends Document {
  userId: string;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<ICartItem>({
  courseId: { type: String, required: true },
  courseName: { type: String, required: true },
  priceAtPurchase: { type: Number, required: true },
  thumbnail: {
    public_id: { type: String },
    url: { type: String },
  },
});

const cartSchema = new Schema<ICart>(
  {
    userId: { type: String, required: true, unique: true },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

const CartModel = mongoose.model<ICart>("Cart", cartSchema);
export default CartModel;