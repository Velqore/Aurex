import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { userDatabase } from "../../../../lib/database/userDatabase";

export async function POST(request: NextRequest) {
  try {
    // Get auth token from cookie or header
    const token = request.cookies.get("auth-token")?.value || 
                  request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify token and get user
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    const user = await userDatabase.findUserByEmail(decoded.email);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, message: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "avatars");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split(".").pop();
    const filename = `${user.id}-${timestamp}.${extension}`;
    const filepath = path.join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Generate public URL
    const avatarUrl = `/uploads/avatars/${filename}`;

    // Update user in database
    await userDatabase.updateUser(user.email, {
      avatar: avatarUrl,
    });

    console.log(`✅ Avatar uploaded for user ${user.username}: ${avatarUrl}`);

    return NextResponse.json({
      success: true,
      message: "Avatar uploaded successfully",
      avatar: avatarUrl,
    });
  } catch (error: any) {
    console.error("Avatar upload error:", error);
    
    if (error.name === "JsonWebTokenError") {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}
