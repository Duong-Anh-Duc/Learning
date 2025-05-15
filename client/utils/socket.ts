// frontend/utils/socket.ts
import { io } from "socket.io-client";

const socket = io("http://192.168.0.102:8001", {
  autoConnect: false,
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  query: {},
});

export const connectSocket = async (
  accessToken: string,
  refreshToken: string,
  userId?: string
) => {
  try {
    socket.auth = { accessToken, refreshToken };
    if (userId) {
      socket.io.opts.query = { userId };
      console.log("Connecting socket with userId:", userId);
    }

    // Handle connection events
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      // Attempt to reconnect after error
      setTimeout(() => {
        socket.connect();
      }, 3000);
    });

    socket.on("connect", () => {
      console.log("Socket connected successfully");
      if (userId) {
        socket.emit("join", userId);
      }
    });

    socket.connect();
  } catch (error) {
    console.error("Error in connectSocket:", error);
  }
};

export const disconnectSocket = () => {
  try {
    if (socket.connected) {
      const userId = socket.io.opts.query?.userId;
      if (userId) {
        socket.emit("leave", userId);
      }
      socket.disconnect();
    }
  } catch (error) {
    console.error("Error in disconnectSocket:", error);
  }
};

export default socket;
