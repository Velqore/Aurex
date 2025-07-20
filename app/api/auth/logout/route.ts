import { NextRequest, NextResponse } from "next/server";
import { userDatabase } from "../../../../lib/database/userDatabase";
import { verifyToken } from "../../../../lib/utils/auth";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        // Update user's online status
        const user = await userDatabase.findUserByEmail(decoded.email);
        if (user) {
          await userDatabase.updateUser(user.email, { isOnline: false });
        }
      }
    }

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    // Clear the auth cookie
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);

    // Even if there's an error, clear the cookie
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
    });

    return response;
  }
}
