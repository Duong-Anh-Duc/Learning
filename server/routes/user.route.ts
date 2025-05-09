import express from "express";
import {
  activateUser,
  banUser,
  deleteUser,
  forgotPassword,
  getAllUsers,
  getUserCourses,
  getUserInfo,
  loginUser,
  logoutUser,
  registrationUser,
  resetPassword,
  socialAuth,
  updatePassword,
  updateProfilePicture,
  updateUserInfo,
  updateUserRole,
} from "../controllers/user.controller";
import { authorizeRoles, isAutheticated } from "../middleware/auth";

const userRouter = express.Router();

userRouter.post("/registration", registrationUser);
userRouter.get("/user-courses", isAutheticated, getUserCourses);
userRouter.post("/activate-user", activateUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", isAutheticated, logoutUser);
userRouter.get("/me", isAutheticated, getUserInfo);
userRouter.post("/social-auth", socialAuth);
userRouter.put("/update-user-info", isAutheticated, updateUserInfo);
userRouter.put("/update-user-password", isAutheticated, updatePassword);
userRouter.put("/update-user-avatar", isAutheticated, updateProfilePicture);
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password", resetPassword);
userRouter.get("/get-users", isAutheticated, authorizeRoles("admin"), getAllUsers);
userRouter.put("/update-user", isAutheticated, authorizeRoles("admin"), updateUserRole);
userRouter.delete("/delete-user/:id", isAutheticated, authorizeRoles("admin"), deleteUser);
userRouter.put("/ban-user/:id", isAutheticated, authorizeRoles("admin"), banUser);
export default userRouter;