import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { userDatabase } from "../../../../lib/database/userDatabase";
import { rateLimit } from "../../../../lib/middleware/rateLimit";
import {
  validateEmail,
  validatePassword,
} from "../../../../lib/utils/validation";

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await rateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const {
      username,
      email,
      password,
      firstName,
      lastName,
      role = "free",
    } = await request.json();

    // Validate required fields
    if (!username || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Username, email, and password are required",
        },
        { status: 400 },
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 },
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, message: passwordValidation.message },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existingEmail = await userDatabase.findUserByEmail(email);
    if (existingEmail) {
      return NextResponse.json(
        { success: false, message: "Email already registered" },
        { status: 409 },
      );
    }

    const existingUsername = await userDatabase.findUserByUsername(username);
    if (existingUsername) {
      return NextResponse.json(
        { success: false, message: "Username already taken" },
        { status: 409 },
      );
    }

    // Create user. NOTE: createUser() hashes the password internally (PBKDF2 +
    // per-user salt), which is what login verification checks against. Do NOT
    // pre-hash here or the stored hash won't match at login time.
    const userData = {
      username,
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      role: role as "admin" | "pro" | "enterprise" | "free",
    };

    const newUser = await userDatabase.createUser(userData);

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // Convert to app user format
    const appUser = userDatabase.convertToAppUser(newUser);

    const response = NextResponse.json({
      success: true,
      message: "Registration successful",
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
  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
