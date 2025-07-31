import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

export interface JWTPayload {
  userId: string;
  email: string;
  role: "admin" | "pro" | "enterprise" | "free";
  iat?: number;
  exp?: number;
}

export function generateToken(
  payload: Omit<JWTPayload, "iat" | "exp">,
): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

export function extractTokenFromRequest(request: NextRequest): string | null {
  // Try to get token from Authorization header
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Try to get token from cookie
  const cookieToken = request.cookies.get("auth-token")?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

export function getUserFromRequest(request: NextRequest): JWTPayload | null {
  const token = extractTokenFromRequest(request);
  if (!token) {
    return null;
  }

  return verifyToken(token);
}

export function isAuthorized(
  user: JWTPayload | null,
  requiredRoles?: string[],
): boolean {
  if (!user) {
    return false;
  }

  if (!requiredRoles || requiredRoles.length === 0) {
    return true; // Any authenticated user
  }

  return requiredRoles.includes(user.role);
}

export function requireAuth(requiredRoles?: string[]) {
  return (request: NextRequest) => {
    const user = getUserFromRequest(request);

    if (!isAuthorized(user, requiredRoles)) {
      return {
        authorized: false,
        user: null,
        error: !user ? "Authentication required" : "Insufficient permissions",
      };
    }

    return {
      authorized: true,
      user,
      error: null,
    };
  };
}
