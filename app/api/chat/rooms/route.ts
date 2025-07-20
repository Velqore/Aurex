import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "../../../../lib/utils/auth";
import { rateLimit } from "../../../../lib/middleware/rateLimit";

// Mock chat rooms data (replace with database in production)
const mockChatRooms = [
  {
    id: "general",
    name: "General Discussion",
    description: "Open discussion for all team members",
    type: "public",
    participants: ["admin-001", "aurex-001"],
    createdAt: new Date("2024-01-01"),
    lastActivity: new Date(),
    messageCount: 156,
    encrypted: true,
  },
  {
    id: "incident-response",
    name: "Incident Response",
    description: "Emergency security incident coordination",
    type: "private",
    participants: ["admin-001"],
    createdAt: new Date("2024-01-15"),
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    messageCount: 89,
    encrypted: true,
  },
  {
    id: "threat-intel",
    name: "Threat Intelligence",
    description: "Sharing and discussing latest threat intelligence",
    type: "private",
    participants: ["admin-001", "aurex-001"],
    createdAt: new Date("2024-02-01"),
    lastActivity: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    messageCount: 234,
    encrypted: true,
  },
  {
    id: "red-team",
    name: "Red Team Operations",
    description: "Coordination for red team exercises",
    type: "private",
    participants: ["aurex-001"],
    createdAt: new Date("2024-02-15"),
    lastActivity: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    messageCount: 67,
    encrypted: true,
  },
];

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );
    }

    // Filter rooms based on user access
    const accessibleRooms = mockChatRooms.filter((room) => {
      // Public rooms are accessible to all
      if (room.type === "public") return true;

      // Private rooms only accessible to participants
      return room.participants.includes(user.userId);
    });

    // Add user-specific information
    const roomsWithStatus = accessibleRooms.map((room) => ({
      ...room,
      unreadCount: Math.floor(Math.random() * 5), // Mock unread count
      lastMessage: {
        content: "This is the last message preview...",
        timestamp: room.lastActivity,
        sender: room.participants[0],
      },
    }));

    return NextResponse.json({
      success: true,
      message: "Chat rooms retrieved successfully",
      rooms: roomsWithStatus,
    });
  } catch (error) {
    console.error("Get chat rooms error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve chat rooms" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimit(request, {
      windowMs: 60000, // 1 minute
      maxRequests: 5, // Max 5 room creations per minute
    });
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Check authentication
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );
    }

    const { name, description, type, participants } = await request.json();

    // Validation
    if (!name || name.trim().length < 3) {
      return NextResponse.json(
        { success: false, message: "Room name must be at least 3 characters" },
        { status: 400 },
      );
    }

    if (type && !["public", "private"].includes(type)) {
      return NextResponse.json(
        { success: false, message: "Invalid room type" },
        { status: 400 },
      );
    }

    // Create new room
    const newRoom = {
      id: `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      description: description?.trim() || "",
      type: type || "private",
      participants: [user.userId, ...(participants || [])],
      createdAt: new Date(),
      lastActivity: new Date(),
      messageCount: 0,
      encrypted: true,
      createdBy: user.userId,
    };

    // In production, save to database
    mockChatRooms.push(newRoom);

    return NextResponse.json({
      success: true,
      message: "Chat room created successfully",
      room: newRoom,
    });
  } catch (error) {
    console.error("Create chat room error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create chat room" },
      { status: 500 },
    );
  }
}
