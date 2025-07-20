import { NextRequest, NextResponse } from "next/server";
import { userDatabase } from "../../../../lib/database/userDatabase";
import { rateLimit } from "../../../../lib/middleware/rateLimit";
import { sendOtpEmail } from "../../../../lib/services/emailService";

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (stricter for OTP)
    const rateLimitResult = await rateLimit(request, {
      windowMs: 60000, // 1 minute
      maxRequests: 3, // Max 3 OTP requests per minute
    });
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const { identifier, type } = await request.json();

    if (!identifier || !type) {
      return NextResponse.json(
        { success: false, message: "Identifier and type are required" },
        { status: 400 },
      );
    }

    if (!["login", "register", "password_reset"].includes(type)) {
      return NextResponse.json(
        { success: false, message: "Invalid OTP type" },
        { status: 400 },
      );
    }

    let user = null;
    let email = identifier;

    if (type === "login") {
      // For login, identifier can be email or username
      user = await userDatabase.findUserByEmail(identifier);
      if (!user) {
        user = await userDatabase.findUserByUsername(identifier);
      }

      if (!user) {
        // For security, don't reveal if user exists
        return NextResponse.json({
          success: true,
          message: "If an account exists, an OTP has been sent.",
          otpSent: false,
        });
      }
      email = user.email;
    } else if (type === "register") {
      // For registration, check if email is already registered
      const existingUser = await userDatabase.findUserByEmail(identifier);
      if (existingUser) {
        return NextResponse.json(
          { success: false, message: "Email already registered" },
          { status: 409 },
        );
      }
      email = identifier;
    }

    // Generate OTP
    let otpCode: string;
    let expiresIn: number;

    if (type === "register") {
      otpCode = await userDatabase.generateRegistrationOtp(email);
      expiresIn = 10 * 60 * 1000; // 10 minutes
    } else {
      otpCode = await userDatabase.generateLoginOtp(email);
      expiresIn = 5 * 60 * 1000; // 5 minutes
    }

    // Send OTP via email
    try {
      await sendOtpEmail(email, otpCode, type);
      console.log(`OTP sent to ${email}: ${otpCode}`); // For development
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      // For now, continue with success response since we're logging OTP
      // In production, you might want to return an error here
    }

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${email}`,
      otpSent: true,
      expiresIn: Math.floor(expiresIn / 1000), // Return in seconds
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send OTP" },
      { status: 500 },
    );
  }
}
