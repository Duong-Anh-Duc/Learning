// frontend/utils/socket.ts
import { io } from "socket.io-client";
import { SERVER_URI } from "./uri";

const socket = io(SERVER_URI, {
  autoConnect: false,
  transports: ["websocket"],
  query: {}, // Sẽ cập nhật userId sau khi đăng nhập
});

export const connectSocket = async (accessToken: string, refreshToken: string, userId?: string) => {
  socket.auth = { accessToken, refreshToken };
  if (userId) {
    socket.io.opts.query = { userId }; // Gửi userId để backend nhận diện
  }
  socket.connect();
};

export const disconnectSocket = () => {
  socket.disconnect();
};

export default socket;