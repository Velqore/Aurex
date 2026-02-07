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
    console.log(`\n🔐 Attempting to send ${type} OTP to ${email}...`);
    
    try {
      await sendOtpEmail(email, otpCode, type);
      
      // If we get here, email was sent successfully
      console.log(`✅ OTP successfully sent to ${email}`);
      
      return NextResponse.json({
        success: true,
        message: `OTP sent to ${email}`,
        otpSent: true,
        expiresIn: Math.floor(expiresIn / 1000), // Return in seconds
      });
      
    } catch (emailError: any) {
      console.error("❌ Failed to send OTP email:", emailError);
      
      // In development, return success anyway since OTP is logged to console
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚠️ [DEV] Returning success despite email failure - OTP logged to console`);
        
        return NextResponse.json({
          success: true,
          message: `OTP generated (check server console in development)`,
          otpSent: false, // Indicate email didn't send
          expiresIn: Math.floor(expiresIn / 1000),
          devMode: true,
          devNote: "Email failed but OTP is logged to server console"
        });
      }
      
      // Production: Return proper error response
      return NextResponse.json(
        {
          success: false,
          message: emailError.message || "Failed to send OTP email. Please check your email configuration.",
          otpSent: false,
          error: process.env.NODE_ENV === 'development' ? emailError.message : undefined
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("❌ Send OTP error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to process OTP request",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 },
    );
  }
}
