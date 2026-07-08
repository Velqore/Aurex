/**
 * Browser Socket.io client for real-time chat.
 * Connects to the custom server (same origin) and authenticates with the JWT
 * stored in localStorage. Safe to import anywhere — all calls no-op on the server.
 */

import { io, Socket } from "socket.io-client";

export interface RealtimeMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  encrypted: boolean;
  type: "text" | "file" | "image" | "system" | "command";
  metadata?: any;
  replyTo?: string;
}

let socket: Socket | null = null;

/** Get (and lazily create) the shared socket. Returns null on the server. */
export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null;
  if (socket) return socket;

  const token = localStorage.getItem("auth-token");
  socket = io({
    path: "/socket.io",
    auth: { token },
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
  });

  socket.on("connect_error", (err) => {
    console.warn("Socket connect error:", err.message);
  });

  return socket;
}

/** Reconnect with the current token (call after login if the socket predated it). */
export function refreshSocketAuth(): void {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem("auth-token");
  if (!socket) {
    getSocket();
    return;
  }
  socket.auth = { token: token || undefined };
  if (!socket.connected) socket.connect();
}

export function isSocketConnected(): boolean {
  return !!socket && socket.connected;
}

export function joinRoom(roomId: string): void {
  const s = getSocket();
  if (s && roomId) s.emit("join", roomId);
}

export function leaveRoom(roomId: string): void {
  if (socket && roomId) socket.emit("leave", roomId);
}

export function emitMessage(
  payload: {
    roomId: string;
    content: string;
    type?: string;
    senderName?: string;
    replyTo?: string;
    metadata?: any;
  },
  ack?: (res: { ok: boolean; message?: RealtimeMessage; error?: string }) => void,
): boolean {
  const s = getSocket();
  if (!s || !s.connected) return false;
  s.emit("message", payload, ack);
  return true;
}

export function emitTyping(roomId: string, isTyping: boolean): void {
  const s = getSocket();
  if (s && s.connected && roomId) s.emit("typing", { roomId, isTyping });
}

/** Subscribe to incoming messages. Returns an unsubscribe function. */
export function onMessage(cb: (msg: RealtimeMessage) => void): () => void {
  const s = getSocket();
  if (!s) return () => {};
  s.on("message", cb);
  return () => {
    s.off("message", cb);
  };
}

/** Subscribe to typing indicators. Returns an unsubscribe function. */
export function onTyping(
  cb: (data: { userId: string; isTyping: boolean }) => void,
): () => void {
  const s = getSocket();
  if (!s) return () => {};
  s.on("typing", cb);
  return () => {
    s.off("typing", cb);
  };
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
