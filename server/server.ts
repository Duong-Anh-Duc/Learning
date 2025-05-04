// backend/server.ts
import { v2 as cloudinary } from "cloudinary";
import http from "http";
import { app } from "./app";
import { initSocketServer } from "./socketServer";
import connectDB from "./utils/db";
require("dotenv").config();
const server = http.createServer(app);

// Khởi tạo WebSocket và lưu instance io
export const io = initSocketServer(server);

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET_KEY,
});

// Create server
server.listen(process.env.PORT, () => {
  console.log(`Server is connected with port ${process.env.PORT}`);
  connectDB();
});