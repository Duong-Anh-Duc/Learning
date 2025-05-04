// backend/socketServer.ts
import http from "http";
import { Server as SocketIOServer } from "socket.io";

export const initSocketServer = (server: http.Server) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*", // Cập nhật theo domain frontend của bạn
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Lấy userId từ query
    const userId = socket.handshake.query.userId as string;
    if (userId) {
      socket.join(userId); // Người dùng tham gia room của riêng họ
      console.log(`User ${userId} joined room ${userId}`);
    }

    // Người dùng tham gia room "allUsers" để nhận thông báo chung
    socket.join("allUsers");

    // Admin tham gia vào room adminRoom
    socket.on("joinAdmin", () => {
      socket.join("adminRoom");
      console.log("Admin joined adminRoom");
    });

    socket.on("notification", (data) => {
      io.to("adminRoom").emit("newNotification", data);
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
      if (userId) {
        socket.leave(userId);
        socket.leave("allUsers");
      }
    });
  });

  return io; // Đảm bảo trả về io
};