import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { userDatabase } from "../../../../lib/database/userDatabase";
import { rateLimit } from "../../../../lib/middleware/rateLimit";

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimit(request, {
      windowMs: 60000, // 1 minute
      maxRequests: 5, // Max 5 verification attempts per minute
    });
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const { identifier, otpCode, type } = await request.json();

    if (!identifier || !otpCode || !type) {
      return NextResponse.json(
        {
          success: false,
          message: "Identifier, OTP code, and type are required",
        },
        { status: 400 },
      );
    }

    const trimmedOtp = otpCode.trim();

    if (!/^\d{6}$/.test(trimmedOtp)) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP format" },
        { status: 400 },
      );
    }

    // For login, need to resolve identifier to email first
    let email = identifier;
    let user = null;

    if (type === "login") {
      // Find user by email or username to get the email
      user = await userDatabase.findUserByEmail(identifier);
      if (!user) {
        user = await userDatabase.findUserByUsername(identifier);
      }

      if (!user) {
        return NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 },
        );
      }

      email = user.email; // Use the email for OTP verification
    }

    // Debug log for OTP values
    console.log("Verifying OTP for:", email, "(identifier:", identifier, ") OTP:", trimmedOtp, "Type:", type);

    // Verify OTP using the email address
    const isOtpValid = await userDatabase.verifyOtp(
      email,
      trimmedOtp,
      type as "login" | "register" | "password_reset",
    );

    if (!isOtpValid) {
      console.warn("OTP verification failed for", email, "with OTP", trimmedOtp);
      return NextResponse.json(
        { success: false, message: "Invalid or expired OTP code" },
        { status: 400 },
      );
    }

    if (type === "login") {
      // User was already found above for email lookup
      // TypeScript safety check (user is guaranteed to exist here)
      if (!user) {
        return NextResponse.json(
          { success: false, message: "User session error" },
          { status: 500 }
        );
      }

      if (!jwtSecret) {
        console.error("JWT_SECRET is not configured");
        return NextResponse.json(
          { success: false, message: "Server authentication is misconfigured" },
          { status: 500 },
        );
      }

      // Update login statistics
      await userDatabase.updateLoginStats(email);

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        jwtSecret,
        { expiresIn: "7d" }
      );

      // Convert to app user format
      const appUser = userDatabase.convertToAppUser(user);

      const response = NextResponse.json({
        success: true,
        message: "OTP verification successful",
        user: appUser,
        token,
      });

      // Set HTTP-only cookie
      response.cookies.set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return response;
    } else if (type === "register") {
      // Mark email as verified for registration
      await userDatabase.markEmailVerified(identifier);

      return NextResponse.json({
        success: true,
        message: "Email verified successfully",
        emailVerified: true,
      });
    } else if (type === "password_reset") {
      if (!jwtSecret) {
        console.error("JWT_SECRET is not configured");
        return NextResponse.json(
          { success: false, message: "Server authentication is misconfigured" },
          { status: 500 },
        );
      }

      // For password reset, return a temporary token
      const resetToken = jwt.sign(
        { email: identifier, purpose: "password_reset" },
        jwtSecret,
        { expiresIn: "30s" },
      );

      return NextResponse.json({
        success: true,
        message: "OTP verified. You can now reset your password.",
        resetToken,
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid OTP type" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { success: false, message: "OTP verification failed" },
      { status: 500 },
    );
  }
}
    const jwtSecret = process.env.JWT_SECRET;
