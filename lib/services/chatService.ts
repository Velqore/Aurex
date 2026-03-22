import { ChatMessage, ChatRoom } from "@/lib/stores/appStore";

const API_BASE = "/api/chat";

interface ChatServiceConfig {
  token: string;
}

class ChatServiceImpl {
  private token: string | null = null;

  constructor() {
    this.token = typeof window !== "undefined" ? localStorage.getItem("auth-token") : null;
  }

  setToken(token: string) {
    this.token = token;
  }

  private getHeaders() {
    return {
      "Content-Type": "application/json",
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
    };
  }

  async fetchMessages(roomId: string): Promise<ChatMessage[]> {
    try {
      const response = await fetch(`${API_BASE}/messages?roomId=${roomId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.error(`Error fetching messages: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      return [];
    }
  }

  async sendMessage(
    roomId: string,
    content: string,
    type: "text" | "file" | "system" = "text",
    senderName?: string
  ) {
    try {
      const response = await fetch(`${API_BASE}/messages`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          roomId,
          content,
          type,
          senderName,
        }),
      });

      if (!response.ok) {
        console.error(`Error sending message: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return data.message;
    } catch (error) {
      console.error("Failed to send message:", error);
      return null;
    }
  }

  async fetchRooms(): Promise<ChatRoom[]> {
    try {
      const response = await fetch(`${API_BASE}/rooms`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        console.error(`Error fetching rooms: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.rooms || [];
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
      return [];
    }
  }

  async createRoom(
    name: string,
    type: "private" | "group" | "channel",
    description?: string
  ): Promise<ChatRoom | null> {
    try {
      const response = await fetch(`${API_BASE}/rooms`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          name,
          type,
          description,
        }),
      });

      if (!response.ok) {
        console.error(`Error creating room: ${response.status}`);
        return null;
      }

      const data = await response.json();
      return data.room;
    } catch (error) {
      console.error("Failed to create room:", error);
      return null;
    }
  }

  async joinRoom(roomId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/rooms/${roomId}/join`, {
        method: "POST",
        headers: this.getHeaders(),
      });

      return response.ok;
    } catch (error) {
      console.error("Failed to join room:", error);
      return false;
    }
  }

  async leaveRoom(roomId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/rooms/${roomId}/leave`, {
        method: "POST",
        headers: this.getHeaders(),
      });

      return response.ok;
    } catch (error) {
      console.error("Failed to leave room:", error);
      return false;
    }
  }

  /**
   * Format timestamp for display
   */
  formatTimestamp(date: Date): string {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / 60000);

    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return messageDate.toLocaleDateString();
  }

  /**
   * Encrypt message content (placeholder for actual encryption)
   */
  encryptMessage(content: string): string {
    // TODO: Implement proper encryption
    return Buffer.from(content).toString("base64");
  }

  /**
   * Decrypt message content (placeholder for actual decryption)
   */
  decryptMessage(encrypted: string): string {
    // TODO: Implement proper decryption
    try {
      return Buffer.from(encrypted, "base64").toString("utf-8");
    } catch {
      return encrypted;
    }
  }

  /**
   * Validate file for upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Max 50MB
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: `File size exceeds 50MB limit` };
    }

    // Allowed types
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "text/csv",
      "application/json",
      "application/zip",
      "application/x-zip-compressed",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: `File type ${file.type} not allowed` };
    }

    return { valid: true };
  }

  /**
   * Get file icon/emoji based on type
   */
  getFileIcon(fileType: string): string {
    if (fileType.startsWith("image/")) return "🖼️";
    if (fileType === "application/pdf") return "📄";
    if (fileType.includes("word") || fileType.includes("document"))
      return "📝";
    if (fileType.includes("sheet") || fileType.includes("excel"))
      return "📊";
    if (
      fileType.includes("zip") ||
      fileType.includes("archive") ||
      fileType.includes("compressed")
    )
      return "📦";
    if (fileType === "text/plain" || fileType === "text/csv") return "📋";
    return "📎";
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }
}

export const chatService = new ChatServiceImpl();
