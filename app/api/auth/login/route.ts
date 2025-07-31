import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { userDatabase } from "../../../../lib/database/userDatabase";
import { rateLimit } from "../../../../lib/middleware/rateLimit";

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: "Email/username and password are required" },
        { status: 400 },
      );
    }

        console.log(`🔍 Login attempt for: ${identifier}`);

    // Find user by email or username
    let user = await userDatabase.findUserByEmail(identifier);
    if (!user) {
      user = await userDatabase.findUserByUsername(identifier);
    }

    console.log(`👤 User found:`, user ? `${user.username} (${user.email})` : 'Not found');

    if (!user) {
      console.log(`❌ User not found for identifier: ${identifier}`);
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Verify password
    console.log(`🔐 Verifying password for user: ${user.username}`);
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    console.log(`🔐 Password valid:`, isPasswordValid);

    if (!isPasswordValid) {
      console.log(`❌ Invalid password for user: ${user.username}`);
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 },
      );
    }

        // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Generate and send OTP
      const otpCode = await userDatabase.generateLoginOtp(user.email);

      // In production, send actual email/SMS here
      console.log(`2FA OTP for ${user.email}: ${otpCode}`);

      return NextResponse.json({
        success: false,
        message: "Two-factor authentication required. OTP sent to your email.",
        requiresOtp: true,
        email: user.email,
      });
    }

    // Update login statistics
    await userDatabase.updateLoginStats(user.email);

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // Convert to app user format
    const appUser = userDatabase.convertToAppUser(user);

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      user: appUser,
      token,
    });

    // Set HTTP-only cookie for additional security
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
