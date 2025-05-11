import cloudinary from "cloudinary";
import ejs from "ejs";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import path from "path";
import CourseModel from "../models/course.model";
import userModel, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { generateTokens } from "../utils/jwt";
import { redis } from "../utils/redis";
import sendMail from "../utils/sendMail";

interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

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

export const registrationUserService = async (data: IRegistrationBody) => {
  const { name, email, password } = data;

  const isEmailExist = await userModel.findOne({ email });
  if (isEmailExist) {
    throw new ErrorHandler("Email đã tồn tại", 400);
  }

  const user: IRegistrationBody = { name, email, password };
  const activationToken = createActivationToken(user);
  const activationCode = activationToken.activationCode;

  const mailData = { user: { name: user.name }, activationCode };
  const html = await ejs.renderFile(
    path.join(__dirname, "../mails/activation-mail.ejs"),
    mailData
  );

  await sendMail({
    email: user.email,
    subject: "Kích hoạt tài khoản của bạn",
    template: "activation-mail.ejs",
    data: mailData,
  });

  return {
    message: `Vui lòng kiểm tra email: ${user.email} để kích hoạt tài khoản!`,
    activationToken: activationToken.token,
  };
};

export const activateUserService = async (activationData: {
  activation_token: string;
  activation_code: string;
}) => {
  const { activation_token, activation_code } = activationData;

  const newUser: { user: IUser; activationCode: string } = jwt.verify(
    activation_token,
    process.env.ACTIVATION_SECRET as string
  ) as { user: IUser; activationCode: string };

  if (newUser.activationCode !== activation_code) {
    throw new ErrorHandler("Mã kích hoạt không hợp lệ", 400);
  }

  const { name, email, password } = newUser.user;

  const existUser = await userModel.findOne({ email });
  if (existUser) {
    throw new ErrorHandler("Email đã tồn tại", 400);
  }

  await userModel.create({ name, email, password });
};
