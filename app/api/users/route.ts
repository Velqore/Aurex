import { NextRequest, NextResponse } from "next/server";
import { userDatabase, DatabaseUser } from "@/lib/database/userDatabase";
import { verifyToken } from "@/lib/utils/auth";
import { User } from "@/lib/types/user";

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    let currentUserId: string;
    try {
      const decoded = verifyToken(token);
      if (!decoded) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
      currentUserId = decoded.userId;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get all users except the current user
    const allUsers = await userDatabase.getAllUsers();
    
    // Filter out current user and sensitive data
    const publicUsers = allUsers
      .filter((user: User) => user.id !== currentUserId)
      .map((user: User) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        department: user.department,
        specializations: user.specializations,
        role: user.role,
        joinDate: user.joinDate,
        lastActive: user.lastActive,
        isOnline: user.isOnline,
        // Don't expose sensitive fields like passwordHash, salt, etc.
      }));

    return NextResponse.json({
      success: true,
      users: publicUsers,
      count: publicUsers.length
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Update user online status
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { isOnline } = await request.json();
    
    // Verify JWT token
    let currentUserId: string;
    try {
      const decoded = verifyToken(token);
      if (!decoded) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
      currentUserId = decoded.userId;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Find user by ID and update online status
    const allUsers = await userDatabase.getAllUsers();
    const currentUser = allUsers.find((user: User) => user.id === currentUserId);
    
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user online status
    await userDatabase.updateUser(currentUser.email, { 
      isOnline,
      lastActive: new Date()
    });
    
    return NextResponse.json({
      success: true,
      message: `User status updated to ${isOnline ? 'online' : 'offline'}`
    });

  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
