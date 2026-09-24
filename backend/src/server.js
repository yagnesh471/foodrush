import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { createApp } from "./app.js";
import { createServer } from "http";
import { initSocket } from "./socket.js";

async function start() {
  await connectDB();

  const app = createApp();
  const server = createServer(app);
  
  initSocket(server);

  server.listen(env.port, () => {
    console.log(`🚀 Server running on http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
