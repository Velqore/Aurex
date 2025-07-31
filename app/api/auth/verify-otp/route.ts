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

    // Debug log for OTP values
    console.log("Verifying OTP for:", identifier, "OTP:", trimmedOtp, "Type:", type);

    // Verify OTP
    const isOtpValid = await userDatabase.verifyOtp(
      identifier,
      trimmedOtp,
      type as "login" | "register" | "password_reset",
    );

    if (!isOtpValid) {
      console.warn("OTP verification failed for", identifier, "with OTP", trimmedOtp);
      return NextResponse.json(
        { success: false, message: "Invalid or expired OTP code" },
        { status: 400 },
      );
    }

    let user = null;
    let email = identifier;

    if (type === "login") {
      // Find user for login
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

      email = user.email;

      // Update login statistics
      await userDatabase.updateLoginStats(email);

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
      // For password reset, return a temporary token
      const resetToken = jwt.sign(
        { email: identifier, purpose: "password_reset" },
        process.env.JWT_SECRET!,
        { expiresIn: "15m" },
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
