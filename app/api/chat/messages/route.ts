import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/utils/auth";
import fs from "fs";
import path from "path";

// Simple file-based message storage
const messagesFile = path.join(process.cwd(), ".tmp-messages.json");

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  encrypted: boolean;
  type: "text" | "file" | "image" | "system";
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    fileUrl?: string;
    isImage?: boolean;
  };
  replyTo?: string;
}

function loadMessages(): ChatMessage[] {
  try {
    if (fs.existsSync(messagesFile)) {
      const data = fs.readFileSync(messagesFile, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error loading messages:", error);
  }
  return [];
}

function saveMessages(messages: ChatMessage[]): void {
  try {
    fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
    console.log(`💾 Saved ${messages.length} total messages`);
  } catch (error) {
    console.error("Error saving messages:", error);
  }
}

// Generate consistent room ID for private chats
function generateRoomId(userId1: string, userId2: string): string {
  const sorted = [userId1, userId2].sort();
  return `private-${sorted[0]}-${sorted[1]}`;
}

// GET endpoint to fetch messages for a specific room
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roomId = request.nextUrl.searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json(
        { error: "roomId parameter is required" },
        { status: 400 }
      );
    }

    const allMessages = loadMessages();
    
    // Filter messages for the requested room
    let roomMessages = allMessages
      .filter((msg) => msg.roomId === roomId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Remove duplicates (keep only last occurrence of each message ID)
    const seenIds = new Map<string, ChatMessage>();
    roomMessages.forEach((msg) => {
      seenIds.set(msg.id, msg);
    });
    
    roomMessages = Array.from(seenIds.values())
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    console.log(`📨 Retrieved ${roomMessages.length} unique messages for room ${roomId}`);

    return NextResponse.json({
      success: true,
      messages: roomMessages,
      count: roomMessages.length,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST endpoint to send a new message
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId, content, type = "text", senderName, metadata, replyTo } = await request.json();

    if (!roomId || !content) {
      return NextResponse.json(
        { error: "roomId and content are required" },
        { status: 400 }
      );
    }

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newMessage: ChatMessage = {
      id: messageId,
      roomId,
      senderId: user.userId,
      senderName: senderName || user.userId, // Use provided username or fallback to ID
      content,
      timestamp: new Date().toISOString(),
      encrypted: true,
      type,
      metadata,
      replyTo,
    };

    const allMessages = loadMessages();
    allMessages.push(newMessage);
    saveMessages(allMessages);

    console.log(`💬 New message in ${roomId} from ${senderName}: ${content.substring(0, 50)}...`);

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (error) {
    console.error("Error saving message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to clear messages for a specific room
export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roomId = request.nextUrl.searchParams.get("roomId");
    if (!roomId) {
      return NextResponse.json(
        { error: "roomId parameter is required" },
        { status: 400 }
      );
    }

    const allMessages = loadMessages();
    const remainingMessages = allMessages.filter((msg) => msg.roomId !== roomId);
    saveMessages(remainingMessages);

    return NextResponse.json({
      success: true,
      message: "Chat cleared",
      removed: allMessages.length - remainingMessages.length,
    });
  } catch (error) {
    console.error("Error clearing messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export { generateRoomId };
