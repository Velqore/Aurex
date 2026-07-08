/**
 * Shared user/database types and the storage interface.
 *
 * Both the in-memory store (userDatabase.ts) and the Postgres-backed store
 * (pgUserDatabase.ts) implement `IUserDatabase`, so the rest of the app can
 * depend on a single stable contract regardless of which backend is active.
 */

import { User } from "../types/user";

export type UserRole = "admin" | "pro" | "enterprise" | "free";
export type OtpType = "login" | "register" | "password_reset";

export interface DatabaseUser {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  specializations: string[];
  joinDate: Date;
  lastActive: Date;
  isOnline: boolean;
  emailVerified: boolean;
  phoneNumber?: string;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  preferences: any;
  statistics: any;
  subscription?: any;

  // OTP related fields (in-memory only; the Postgres store keeps OTPs in a table)
  otpSecret?: string;
  pendingOtp?: {
    code: string;
    type: OtpType;
    expiresAt: Date;
    attempts: number;
  };
}

export interface OtpRequest {
  email: string;
  type: OtpType;
  code: string;
  expiresAt: Date;
}

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

/**
 * Storage contract shared by every user-store backend.
 */
export interface IUserDatabase {
  findUserByEmail(email: string): Promise<DatabaseUser | null>;
  findUserByUsername(username: string): Promise<DatabaseUser | null>;
  verifyPassword(email: string, password: string): Promise<boolean>;
  createUser(userData: CreateUserInput): Promise<DatabaseUser>;
  updateUser(
    email: string,
    updates: Partial<DatabaseUser>,
  ): Promise<DatabaseUser | null>;
  generateLoginOtp(email: string): Promise<string>;
  generateRegistrationOtp(email: string): Promise<string>;
  verifyOtp(email: string, code: string, type: OtpType): Promise<boolean>;
  markEmailVerified(email: string): Promise<void>;
  updateLoginStats(email: string): Promise<void>;
  convertToAppUser(dbUser: DatabaseUser): User;
  getAllUsers(): Promise<User[]>;
  cleanupExpiredOtps(): void | Promise<void>;
}
