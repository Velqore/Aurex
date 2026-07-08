/**
 * Custom Aurex server: runs the Next.js app AND a Socket.io real-time layer
 * on a single HTTP port. Required because real-time chat needs a persistent
 * websocket connection, which serverless/`next start` cannot provide.
 *
 * Runs anywhere that supports a long-lived Node process (Koyeb, Railway,
 * Render, Fly.io, a VPS). Start with `npm run dev` (dev) or `npm start` (prod).
 */

const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { loadEnvConfig } = require("@next/env");
const messageStore = require("./lib/server/messageStore");

const dev = process.env.NODE_ENV !== "production";

// Load .env / .env.local into process.env before we use JWT_SECRET etc.
loadEnvConfig(process.cwd(), dev);

const port = parseInt(process.env.PORT || "3002", 10);
const hostname = process.env.HOST || "0.0.0.0";

const app = next({ dev });
const handle = app.getRequestHandler();

function getTokenFromHandshake(socket) {
  // Prefer an explicit token from the client; fall back to the auth cookie.
  const authToken = socket.handshake.auth && socket.handshake.auth.token;
  if (authToken) return authToken;

  const cookie = socket.handshake.headers.cookie;
  if (cookie) {
    const match = cookie.match(/(?:^|;\s*)auth-token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
}

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));

  const io = new Server(server, {
    path: "/socket.io",
    cors: { origin: true, credentials: true },
  });

  // Authenticate every socket connection with the same JWT used by the API.
  io.use((socket, done) => {
    try {
      const token = getTokenFromHandshake(socket);
      if (!token) return done(new Error("Authentication required"));

      const secret = process.env.JWT_SECRET;
      if (!secret) return done(new Error("Server auth not configured"));

      const decoded = jwt.verify(token, secret);
      socket.data.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
      return done();
    } catch (err) {
      return done(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;

    socket.on("join", (roomId) => {
      if (typeof roomId === "string" && roomId) socket.join(roomId);
    });

    socket.on("leave", (roomId) => {
      if (typeof roomId === "string" && roomId) socket.leave(roomId);
    });

    // Live message: persist once, then broadcast to everyone in the room
    // (including the sender, so all clients render from a single source).
    socket.on("message", (payload, ack) => {
      try {
        const { roomId, content, type, senderName, replyTo, metadata } =
          payload || {};
        if (!roomId || !content) {
          if (typeof ack === "function")
            ack({ ok: false, error: "roomId and content are required" });
          return;
        }

        const record = messageStore.addMessage({
          roomId,
          senderId: user.userId,
          senderName: senderName || user.email || user.userId,
          content,
          type: type || "text",
          replyTo,
          metadata,
          encrypted: true,
        });

        io.to(roomId).emit("message", record);
        if (typeof ack === "function") ack({ ok: true, message: record });
      } catch (err) {
        console.error("socket message error:", err);
        if (typeof ack === "function") ack({ ok: false, error: "send failed" });
      }
    });

    socket.on("typing", (data) => {
      const roomId = data && data.roomId;
      if (!roomId) return;
      socket.to(roomId).emit("typing", {
        userId: user.userId,
        isTyping: !!(data && data.isTyping),
      });
    });
  });

  server.listen(port, hostname, () => {
    console.log(
      `🚀 Aurex ready on http://${hostname}:${port}  (realtime: Socket.io enabled)`,
    );
  });
});
