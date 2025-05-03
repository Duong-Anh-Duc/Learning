// ... (các import giữ nguyên)

import cloudinary from "cloudinary";
import ejs from "ejs";
import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import path from "path";
import { CatchAsyncError } from "../middleware/catchAsyncErrors";
import userModel, { IUser } from "../models/user.model";
import {
  getAllUsersService,
  getUserById,
  updateUserRoleService,
} from "../services/user.service";
import ErrorHandler from "../utils/ErrorHandler";
import { sendToken } from "../utils/jwt";
import { redis } from "../utils/redis";
import sendMail from "../utils/sendMail";

// Đăng ký người dùng
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export const registrationUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body;

      const isEmailExist = await userModel.findOne({ email });
      if (isEmailExist) {
        return next(new ErrorHandler("Email đã tồn tại", 400));
      }

      const user: IRegistrationBody = {
        name,
        email,
        password,
      };

      const activationToken = createActivationToken(user);

      const activationCode = activationToken.activationCode;

      const data = { user: { name: user.name }, activationCode };
      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/activation-mail.ejs"),
        data
      );

      console.log(req.body);

      try {
        await sendMail({
          email: user.email,
          subject: "Kích hoạt tài khoản của bạn",
          template: "activation-mail.ejs",
          data,
        });

        res.status(201).json({
          success: true,
          message: `Vui lòng kiểm tra email: ${user.email} để kích hoạt tài khoản!`,
          activationToken: activationToken.token,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface IActivationToken {
  token: string;
  activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: "5m",
    }
  );

  return { token, activationCode };
};

// Kích hoạt người dùng
interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

export const activateUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } =
        req.body as IActivationRequest;

      const newUser: { user: IUser; activationCode: string } = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string
      ) as { user: IUser; activationCode: string };

      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler("Mã kích hoạt không hợp lệ", 400));
      }

      const { name, email, password } = newUser.user;

      const existUser = await userModel.findOne({ email });

      if (existUser) {
        return next(new ErrorHandler("Email đã tồn tại", 400));
      }
      const user = await userModel.create({
        name,
        email,
        password,
      });

      res.status(201).json({
        success: true,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Đăng nhập người dùng
interface ILoginRequest {
  email: string;
  password: string;
}

// controllers/user.controller.ts
export const loginUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;
      if (!email || !password) {
        return next(new ErrorHandler("Vui lòng nhập email và mật khẩu", 400));
      }

      const user = await userModel.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("Email hoặc mật khẩu không hợp lệ", 400));
      }

      // Kiểm tra trạng thái ban
      if (user.isBanned) {
        return next(new ErrorHandler("Tài khoản của bạn đã bị khóa!", 403));
      }

      const isPasswordMatch = await user.comparePassword(password);
      if (!isPasswordMatch) {
        return next(new ErrorHandler("Email hoặc mật khẩu không hợp lệ", 400));
      }
      sendToken(user, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Đăng xuất người dùng
export const logoutUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });
      const userId = req.user?._id || "";
      redis.del(userId);
      res.status(200).json({
        success: true,
        message: "Đăng xuất thành công",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Cập nhật access token
export const updateAccessToken = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.headers["refresh-token"] as string;
      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN as string
      ) as JwtPayload;

      const message = "Không thể làm mới token";
      if (!decoded) {
        return next(new ErrorHandler(message, 400));
      }
      const session = await redis.get(decoded.id as string);

      if (!session) {
        return next(
          new ErrorHandler("Vui lòng đăng nhập để truy cập tài nguyên này!", 400)
        );
      }

      const user = JSON.parse(session);

      req.user = user;

      await redis.set(user._id, JSON.stringify(user), "EX", 604800); // 7 ngày

      return next();
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Lấy thông tin người dùng
export const getUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      getUserById(userId, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface ISocialAuthBody {
  email: string;
  name: string;
  avatar: string;
}

// Đăng nhập bằng mạng xã hội
export const socialAuth = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, avatar } = req.body as ISocialAuthBody;
      const user = await userModel.findOne({ email });
      if (!user) {
        const newUser = await userModel.create({ email, name, avatar });
        sendToken(newUser, 200, res);
      } else {
        sendToken(user, 200, res);
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Cập nhật thông tin người dùng
interface IUpdateUserInfo {
  name?: string;
  email?: string;
}

export const updateUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.body as IUpdateUserInfo;

      const userId = req.user?._id;
      const user = await userModel.findById(userId);

      if (name && user) {
        user.name = name;
      }

      await user?.save();

      await redis.set(userId, JSON.stringify(user));

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Cập nhật mật khẩu
interface IUpdatePassword {
  oldPassword: string;
  newPassword: string;
}

export const updatePassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword } = req.body as IUpdatePassword;

      if (!oldPassword || !newPassword) {
        return next(new ErrorHandler("Vui lòng nhập mật khẩu cũ và mới", 400));
      }

      const user = await userModel.findById(req.user?._id).select("+password");

      if (user?.password === undefined) {
        return next(new ErrorHandler("Người dùng không hợp lệ", 400));
      }

      const isPasswordMatch = await user?.comparePassword(oldPassword);

      if (!isPasswordMatch) {
        return next(new ErrorHandler("Mật khẩu cũ không đúng", 400));
      }

      user.password = newPassword;

      await user.save();

      await redis.set(req.user?._id, JSON.stringify(user));

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Quên mật khẩu
interface IForgotPasswordRequest {
  email: string;
}

export const forgotPassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log("OK");
    try {
      const { email } = req.body as IForgotPasswordRequest;

      if (!email) {
        return next(new ErrorHandler("Vui lòng nhập email của bạn", 400));
      }

      const user = await userModel.findOne({ email });
      if (!user) {
        return next(new ErrorHandler("Email không tồn tại", 404));
      }

      // Tạo mã reset (4 chữ số)
      const resetCode = Math.floor(1000 + Math.random() * 9000).toString();

      // Tạo token chứa mã reset
      const resetToken = jwt.sign(
        { email, resetCode },
        process.env.RESET_PASSWORD_SECRET as Secret,
        { expiresIn: "10m" }
      );

      // Lưu token vào Redis để sử dụng sau
      await redis.set(`reset:${email}`, resetToken, "EX", 600); // Hết hạn sau 10 phút

      // Gửi email chứa mã reset
      const data = { user: { name: user.name }, resetCode };
      await sendMail({
        email: user.email,
        subject: "Đặt lại mật khẩu",
        template: "reset-password-mail.ejs",
        data,
      });

      res.status(200).json({
        success: true,
        message: `Mã đặt lại đã được gửi đến ${email}. Vui lòng kiểm tra hộp thư của bạn.`,
        resetToken, // Gửi token để frontend sử dụng sau
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Đặt lại mật khẩu
interface IResetPasswordRequest {
  resetToken: string;
  resetCode: string;
  newPassword: string;
}

export const resetPassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log("OK");
    try {
      const { resetToken, resetCode, newPassword } = req.body as IResetPasswordRequest;

      if (!resetToken || !resetCode || !newPassword) {
        return next(new ErrorHandler("Vui lòng cung cấp đầy đủ các trường bắt buộc", 400));
      }

      // Xác thực token
      const decoded = jwt.verify(
        resetToken,
        process.env.RESET_PASSWORD_SECRET as string
      ) as { email: string; resetCode: string };

      if (decoded.resetCode !== resetCode) {
        return next(new ErrorHandler("Mã đặt lại không hợp lệ", 400));
      }

      // Kiểm tra token trong Redis
      const storedToken = await redis.get(`reset:${decoded.email}`);
      if (storedToken !== resetToken) {
        return next(new ErrorHandler("Token đặt lại không hợp lệ hoặc đã hết hạn", 400));
      }

      // Kiểm tra độ mạnh của mật khẩu mới
      const passwordRegex = /^(?=.*[!@#$&*])(?=.*[0-9]).{6,}$/;
      if (!passwordRegex.test(newPassword)) {
        return next(
          new ErrorHandler(
            "Mật khẩu phải có ít nhất 6 ký tự, chứa một số và một ký tự đặc biệt",
            400
          )
        );
      }

      // Cập nhật mật khẩu
      const user = await userModel.findOne({ email: decoded.email }).select("+password");
      if (!user) {
        return next(new ErrorHandler("Người dùng không tồn tại", 404));
      }

      user.password = newPassword;
      await user.save();

      // Xóa token trong Redis
      await redis.del(`reset:${decoded.email}`);

      res.status(200).json({
        success: true,
        message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface IUpdateProfilePicture {
  avatar: string;
}

// Cập nhật ảnh hồ sơ
export const updateProfilePicture = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { avatar } = req.body as IUpdateProfilePicture;

      const userId = req.user?._id;

      const user = await userModel.findById(userId).select("+password");

      if (avatar && user) {
        // Nếu người dùng đã có ảnh đại diện thì xóa ảnh cũ
        if (user?.avatar?.public_id) {
          // Xóa ảnh cũ
          await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);

          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avatars",
            width: 150,
          });
          user.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        } else {
          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avatars",
            width: 150,
          });
          user.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        }
      }

      await user?.save();

      await redis.set(userId, JSON.stringify(user));

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      console.log(error);
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Lấy tất cả người dùng --- chỉ dành cho admin
export const getAllUsers = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllUsersService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Cập nhật vai trò người dùng --- chỉ dành cho admin
export const updateUserRole = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, role } = req.body;
      const isUserExist = await userModel.findOne({ email });
      if (isUserExist) {
        const id = isUserExist._id;
        updateUserRoleService(res, id, role);
      } else {
        res.status(400).json({
          success: false,
          message: "Người dùng không tồn tại",
        });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Xóa người dùng --- chỉ dành cho admin
export const deleteUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const user = await userModel.findById(id);

      if (!user) {
        return next(new ErrorHandler("Người dùng không tồn tại", 404));
      }

      await user.deleteOne({ id });

      await redis.del(id);

      res.status(200).json({
        success: true,
        message: "Xóa người dùng thành công",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Lấy danh sách khóa học của người dùng
export const getUserCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return next(new ErrorHandler("Người dùng chưa đăng nhập", 401));
      }

      const user = await userModel.findById(userId);
      if (!user) {
        return next(new ErrorHandler("Người dùng không tồn tại", 404));
      }

      res.status(200).json({
        success: true,
        courses: user.courses || [],
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
// controllers/user.controller.ts
export const banUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { isBanned } = req.body; // true để ban, false để bỏ ban

      const user = await userModel.findById(id);
      if (!user) {
        return next(new ErrorHandler("Người dùng không tồn tại", 404));
      }

      user.isBanned = isBanned;
      await user.save();

      // Cập nhật Redis
      await redis.set(id, JSON.stringify(user));

      res.status(200).json({
        success: true,
        message: isBanned ? "Khóa người dùng thành công!" : "Bỏ khóa người dùng thành công!",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);