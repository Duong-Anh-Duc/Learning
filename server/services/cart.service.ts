import CartModel from "../models/cart.model";
import CourseModel, { ICourse } from "../models/course.model";
import ErrorHandler from "../utils/ErrorHandler";

export const addToCartService = async (userId: string, courseId: string) => {
  if (!courseId) {
    throw new ErrorHandler("Vui lòng cung cấp courseId", 400);
  }

  const course = await CourseModel.findById(courseId) as ICourse | null;
  if (!course) {
    throw new ErrorHandler("Khóa học không tồn tại", 404);
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
    throw new ErrorHandler("Khóa học đã có trong giỏ hàng", 400);
  }

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
  return cart;
};

export const removeFromCartService = async (userId: string, courseId: string) => {
  const cart = await CartModel.findOne({ userId });
  if (!cart) {
    throw new ErrorHandler("Giỏ hàng không tồn tại", 404);
  }

  cart.items = cart.items.filter((item) => item.courseId !== courseId);
  await cart.save();
  return cart;
};

export const getCartService = async (userId: string) => {
  const cart = await CartModel.findOne({ userId });
  return cart || { userId, items: [] };
};

export const clearCartService = async (userId: string) => {
  await CartModel.deleteOne({ userId });
  return { message: "Giỏ hàng đã được xóa" };
};