/**
 * Shared chat message store (CommonJS so it can be used by both the Next.js
 * API route and the custom Socket.io server in server.js — the whole app runs
 * in a single process, so they share this in-memory cache + file).
 *
 * File-based persistence for now (same .tmp-messages.json used previously).
 * This is the natural seam to swap for Postgres later without touching the
 * route or the socket server.
 */

const fs = require("fs");
const path = require("path");

const MESSAGES_FILE = path.join(process.cwd(), ".tmp-messages.json");

/** @type {any[] | null} */
let cache = null;

function load() {
  if (cache) return cache;
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      cache = JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf-8"));
    } else {
      cache = [];
    }
  } catch (err) {
    console.error("messageStore: failed to load messages:", err);
    cache = [];
  }
  return cache;
}

function persist() {
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(cache || [], null, 2));
  } catch (err) {
    // Read-only filesystem (e.g. serverless) — keep working in-memory.
    console.error("messageStore: failed to persist messages:", err);
  }
}

/** Return all messages for a room, sorted oldest -> newest, de-duplicated by id. */
function getRoomMessages(roomId) {
  const all = load().filter((m) => m.roomId === roomId);
  const byId = new Map();
  for (const m of all) byId.set(m.id, m);
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}

/**
 * Append a message. Accepts a partial record and fills in id/timestamp/defaults.
 * Returns the stored record.
 */
function addMessage(input) {
  const all = load();
  const record = {
    id:
      input.id ||
      `msg-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    roomId: input.roomId,
    senderId: input.senderId,
    senderName: input.senderName || input.senderId,
    content: input.content,
    timestamp: input.timestamp || new Date().toISOString(),
    encrypted: input.encrypted !== undefined ? input.encrypted : true,
    type: input.type || "text",
    metadata: input.metadata,
    replyTo: input.replyTo,
  };
  all.push(record);
  persist();
  return record;
}

/** Remove all messages for a room. Returns the number removed. */
function clearRoom(roomId) {
  const all = load();
  const remaining = all.filter((m) => m.roomId !== roomId);
  const removed = all.length - remaining.length;
  cache = remaining;
  persist();
  return removed;
}

module.exports = {
  getRoomMessages,
  addMessage,
  clearRoom,
};
