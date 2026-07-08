import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/utils/auth";
import {
  addMessage,
  clearRoom,
  getRoomMessages,
} from "@/lib/server/messageStore";

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
        { status: 400 },
      );
    }

    const roomMessages = getRoomMessages(roomId);

    return NextResponse.json({
      success: true,
      messages: roomMessages,
      count: roomMessages.length,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST endpoint to send a new message (REST fallback; real-time path is Socket.io)
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId, content, type = "text", senderName, metadata, replyTo } =
      await request.json();

    if (!roomId || !content) {
      return NextResponse.json(
        { error: "roomId and content are required" },
        { status: 400 },
      );
    }

    const newMessage = addMessage({
      roomId,
      senderId: user.userId,
      senderName: senderName || user.userId,
      content,
      type,
      metadata,
      replyTo,
      encrypted: true,
    });

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (error) {
    console.error("Error saving message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
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
        { status: 400 },
      );
    }

    const removed = clearRoom(roomId);

    return NextResponse.json({
      success: true,
      message: "Chat cleared",
      removed,
    });
  } catch (error) {
    console.error("Error clearing messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
