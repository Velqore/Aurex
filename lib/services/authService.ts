/**
 * Authentication Service
 * Handles user authentication, token management, and session validation
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userDatabase } from '../database/userDatabase';

export interface AuthCredentials {
  identifier: string; // email or username
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: any;
  token?: string;
  requiresOtp?: boolean;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: 'admin' | 'pro' | 'enterprise' | 'free';
}

/**
 * Validate JWT_SECRET is configured
 */
function validateJWTSecret(): void {
  if (!process.env.JWT_SECRET) {
    throw new Error('CRITICAL: JWT_SECRET environment variable is not set');
  }
}

/**
 * Authenticate user with credentials
 */
export async function authenticateUser(
  credentials: AuthCredentials
): Promise<AuthResponse> {
  try {
    const { identifier, password } = credentials;

    if (!identifier || !password) {
      return {
        success: false,
        message: 'Email/username and password are required'
      };
    }

    // Find user by email or username
    let user = await userDatabase.findUserByEmail(identifier);
    if (!user) {
      user = await userDatabase.findUserByUsername(identifier);
    }

    if (!user) {
      return {
        success: false,
        message: 'Invalid credentials'
      };
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    
    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid credentials'
      };
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Generate and send OTP
      const otpCode = await userDatabase.generateLoginOtp(user.email);
      console.log(`2FA OTP for ${user.email}: ${otpCode}`);

      return {
        success: false,
        message: 'Two-factor authentication required. OTP sent to your email.',
        requiresOtp: true
      };
    }

    // Update login statistics
    await userDatabase.updateLoginStats(user.email);

    // Generate JWT token
    validateJWTSecret();
    const token = generateAuthToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Convert to app user format
    const appUser = userDatabase.convertToAppUser(user);

    return {
      success: true,
      message: 'Login successful',
      user: appUser,
      token
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      message: 'Authentication failed'
    };
  }
}

/**
 * Register new user
 */
export async function registerUser(data: RegisterData): Promise<AuthResponse> {
  try {
    const { username, email, password, firstName, lastName, role = 'free' } = data;

    // Check if user already exists
    const existingEmail = await userDatabase.findUserByEmail(email);
    if (existingEmail) {
      return {
        success: false,
        message: 'Email already registered'
      };
    }

    const existingUsername = await userDatabase.findUserByUsername(username);
    if (existingUsername) {
      return {
        success: false,
        message: 'Username already taken'
      };
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const userData = {
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      role
    };

    const newUser = await userDatabase.createUser(userData);

    // Generate JWT token
    validateJWTSecret();
    const token = generateAuthToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role
    });

    // Convert to app user format
    const appUser = userDatabase.convertToAppUser(newUser);

    return {
      success: true,
      message: 'Registration successful',
      user: appUser,
      token
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: 'Registration failed'
    };
  }
}

/**
 * Generate JWT authentication token
 */
export function generateAuthToken(payload: {
  userId: string;
  email: string;
  role: string;
}): string {
  validateJWTSecret();
  
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  return jwt.sign(
    payload,
    process.env.JWT_SECRET!,
    { expiresIn }
  );
}

/**
 * Verify JWT token
 */
export function verifyAuthToken(token: string): any {
  try {
    validateJWTSecret();
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Validate OTP and complete login
 */
export async function verifyOtpAndLogin(
  email: string,
  otpCode: string
): Promise<AuthResponse> {
  try {
    const isValid = await userDatabase.verifyOtp(email, otpCode, 'login');
    
    if (!isValid) {
      return {
        success: false,
        message: 'Invalid or expired OTP'
      };
    }

    const user = await userDatabase.findUserByEmail(email);
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }

    // Update login statistics
    await userDatabase.updateLoginStats(user.email);

    // Generate JWT token
    validateJWTSecret();
    const token = generateAuthToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Convert to app user format
    const appUser = userDatabase.convertToAppUser(user);

    return {
      success: true,
      message: 'Login successful',
      user: appUser,
      token
    };
  } catch (error) {
    console.error('OTP verification error:', error);
    return {
      success: false,
      message: 'OTP verification failed'
    };
  }
}

export default {
  authenticateUser,
  registerUser,
  generateAuthToken,
  verifyAuthToken,
  verifyOtpAndLogin
};
