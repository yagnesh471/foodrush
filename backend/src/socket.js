import { Server } from "socket.io";
import { env } from "./config/env.js";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.frontendUrl,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("join_order", (orderId) => {
      socket.join(orderId);
    });
  });

  return io;
};

export const getIo = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

