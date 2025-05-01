// backend/routes/cart.route.ts
import express from "express";
import {
    addToCart,
    clearCart,
    getCart,
    removeFromCart,
} from "../controllers/cart.controller";
import { isAutheticated } from "../middleware/auth";

const cartRouter = express.Router();

cartRouter.post("/add-to-cart", isAutheticated, addToCart);
cartRouter.post("/remove-from-cart", isAutheticated, removeFromCart);
cartRouter.get("/get-cart", isAutheticated, getCart);
cartRouter.delete("/clear-cart", isAutheticated, clearCart);

export default cartRouter;