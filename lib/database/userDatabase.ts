import { User } from "../types/user";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { DatabaseUser, IUserDatabase, OtpRequest } from "./userTypes";
import { PgUserDatabase } from "./pgUserDatabase";

// Re-exported for backwards compatibility with existing imports.
export type { DatabaseUser, OtpRequest };

class UserDatabase implements IUserDatabase {
  private users: Map<string, DatabaseUser> = new Map();
  private otpRequests: Map<string, OtpRequest> = new Map();
  private instanceId: string;
  private otpStoragePath: string;
  private usersStoragePath: string;
  private filePersistenceEnabled: boolean;

  constructor() {
    this.instanceId = Math.random().toString(36).substr(2, 9);
    this.otpStoragePath = path.join(process.cwd(), ".tmp-otp-storage.json");
    this.usersStoragePath = path.join(process.cwd(), ".tmp-users-storage.json");
    this.filePersistenceEnabled = this.canPersistToDisk();
    this.initializeDefaultUsers();
    this.loadUsersFromFile();
    this.loadOtpFromFile();
  }

  private canPersistToDisk(): boolean {
    try {
      fs.accessSync(process.cwd(), fs.constants.W_OK);
      return true;
    } catch {
      console.warn(
        "⚠️ File persistence disabled: current environment is read-only",
      );
      return false;
    }
  }

  private initializeDefaultUsers() {
    // Admin user
    const adminId = "admin-001";
    const adminSalt = this.generateSalt();
    const adminUser: DatabaseUser = {
      id: adminId,
      username: "admin",
      email: "admin@cybersecchat.com",
      passwordHash: this.hashPassword("admin123", adminSalt),
      salt: adminSalt,
      role: "admin",
      firstName: "System",
      lastName: "Administrator",
      department: "IT Security",
      specializations: ["Network Security", "Incident Response", "Forensics"],
      joinDate: new Date("2023-01-01"),
      lastActive: new Date(),
      isOnline: true,
      emailVerified: true,
      phoneVerified: false,
      twoFactorEnabled: true,
      preferences: {
        theme: "cyber",
        notifications: {
          email: true,
          desktop: true,
          threatAlerts: true,
          chatMessages: true,
          systemUpdates: true,
        },
        privacy: {
          profileVisibility: "team",
          activityTracking: true,
          dataSharing: false,
        },
        security: {
          twoFactorEnabled: true,
          sessionTimeout: 30,
          loginAlerts: true,
        },
        interface: {
          defaultView: "chat",
          compactMode: false,
          showTooltips: true,
          autoRefresh: true,
        },
      },
      statistics: {
        totalLogins: 245,
        threatsAnalyzed: 1532,
        filesProcessed: 892,
        chatMessages: 3421,
        toolsUsed: 156,
        lastLoginLocation: "New York, US",
        sessionDuration: 425,
      },
    };

    // Aurex user
    const aurexId = "aurex-001";
    const aurexSalt = this.generateSalt();
    const aurexUser: DatabaseUser = {
      id: aurexId,
      username: "Aurex",
      email: "ayushtyagi2213@gmail.com",
      passwordHash: this.hashPassword("Aurex213454", aurexSalt),
      salt: aurexSalt,
      role: "enterprise",
      firstName: "Aurex",
      lastName: "Pro",
      department: "Cybersecurity",
      specializations: [
        "Penetration Testing",
        "Malware Analysis",
        "Digital Forensics",
      ],
      joinDate: new Date("2024-01-01"),
      lastActive: new Date(),
      isOnline: true,
      emailVerified: true,
      phoneVerified: true,
      twoFactorEnabled: true,
      preferences: {
        theme: "cyber",
        notifications: {
          email: true,
          desktop: true,
          threatAlerts: true,
          chatMessages: true,
          systemUpdates: true,
        },
        privacy: {
          profileVisibility: "team",
          activityTracking: true,
          dataSharing: false,
        },
        security: {
          twoFactorEnabled: true,
          sessionTimeout: 60,
          loginAlerts: true,
        },
        interface: {
          defaultView: "tools",
          compactMode: false,
          showTooltips: true,
          autoRefresh: true,
        },
      },
      statistics: {
        totalLogins: 89,
        threatsAnalyzed: 342,
        filesProcessed: 156,
        chatMessages: 678,
        toolsUsed: 89,
        lastLoginLocation: "San Francisco, US",
        sessionDuration: 320,
      },
      subscription: {
        plan: "enterprise",
        status: "active",
        renewalDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        paymentMethod: "**** 1234",
      },
    };

    this.users.set(adminUser.email, adminUser);
    this.users.set(aurexUser.email, aurexUser);
  }

  private generateSalt(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  private hashPassword(password: string, salt: string): string {
    return crypto
      .pbkdf2Sync(password, salt, 10000, 64, "sha512")
      .toString("hex");
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // User management methods
  async findUserByEmail(email: string): Promise<DatabaseUser | null> {
    return this.users.get(email.toLowerCase()) || null;
  }

  async findUserByUsername(username: string): Promise<DatabaseUser | null> {
    for (const user of this.users.values()) {
      if (user.username.toLowerCase() === username.toLowerCase()) {
        return user;
      }
    }
    return null;
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    const user = await this.findUserByEmail(email);
    if (!user) return false;

    const hashedPassword = this.hashPassword(password, user.salt);
    return hashedPassword === user.passwordHash;
  }

  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: "admin" | "pro" | "enterprise" | "free";
  }): Promise<DatabaseUser> {
    const existingUser = await this.findUserByEmail(userData.email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const existingUsername = await this.findUserByUsername(userData.username);
    if (existingUsername) {
      throw new Error("Username already taken");
    }

    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const salt = this.generateSalt();
    const passwordHash = this.hashPassword(userData.password, salt);

    const newUser: DatabaseUser = {
      id: userId,
      username: userData.username,
      email: userData.email.toLowerCase(),
      passwordHash,
      salt,
      role: userData.role || "free",
      firstName: userData.firstName,
      lastName: userData.lastName,
      specializations: [],
      joinDate: new Date(),
      lastActive: new Date(),
      isOnline: false,
      emailVerified: false,
      phoneVerified: false,
      twoFactorEnabled: false,
      preferences: {
        theme: "cyber",
        notifications: {
          email: true,
          desktop: true,
          threatAlerts: true,
          chatMessages: true,
          systemUpdates: false,
        },
        privacy: {
          profileVisibility: "team",
          activityTracking: true,
          dataSharing: false,
        },
        security: {
          twoFactorEnabled: false,
          sessionTimeout: 30,
          loginAlerts: true,
        },
        interface: {
          defaultView: "chat",
          compactMode: false,
          showTooltips: true,
          autoRefresh: true,
        },
      },
      statistics: {
        totalLogins: 0,
        threatsAnalyzed: 0,
        filesProcessed: 0,
        chatMessages: 0,
        toolsUsed: 0,
        sessionDuration: 0,
      },
    };

        this.users.set(newUser.email, newUser);
    this.saveUsersToFile(); // Persist user immediately
    console.log(`👤 Created new user: ${newUser.email} (${newUser.username})`);
    return newUser;
  }

  async updateUser(
    email: string,
    updates: Partial<DatabaseUser>,
  ): Promise<DatabaseUser | null> {
    const user = await this.findUserByEmail(email);
    if (!user) return null;

        const updatedUser = { ...user, ...updates, lastActive: new Date() };
    this.users.set(email, updatedUser);
    this.saveUsersToFile(); // Persist user updates
    return updatedUser;
  }

  // OTP management methods
  async generateLoginOtp(email: string): Promise<string> {
    const user = await this.findUserByEmail(email.toLowerCase());
    if (!user) {
      throw new Error("User not found");
    }

    const otpCode = this.generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await this.updateUser(email.toLowerCase(), {
      pendingOtp: {
        code: otpCode,
        type: "login",
        expiresAt,
        attempts: 0,
      },
    });

    this.otpRequests.set(email.toLowerCase(), {
      email: email.toLowerCase(),
      type: "login",
      code: otpCode,
      expiresAt,
    });

    this.saveOtpToFile(); // Persist to file immediately

    console.log(`OTP for ${email}: ${otpCode} (expires at ${expiresAt})`);

    return otpCode;
  }

    async generateRegistrationOtp(email: string): Promise<string> {
    const otpCode = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const otpData = {
      email: email.toLowerCase(),
      type: "register" as const,
      code: otpCode,
      expiresAt,
    };

        this.otpRequests.set(email.toLowerCase(), otpData);
    this.saveOtpToFile(); // Persist to file immediately

    console.log(
      `Registration OTP for ${email}: ${otpCode} (expires at ${expiresAt})`,
    );
    console.log(`Stored OTP data:`, otpData);
    console.log(`Current OTP requests after storing:`, Array.from(this.otpRequests.keys()));
    console.log(`Total OTP requests count:`, this.otpRequests.size);

    return otpCode;
  }

    async verifyOtp(
    email: string,
    code: string,
    type: "login" | "register" | "password_reset",
  ): Promise<boolean> {
    const emailKey = email.toLowerCase();
    const inputOtp = code.trim();

    // Debug logging
        console.log("Verifying OTP for:", emailKey, "Type:", type, "Input:", inputOtp);
    console.log(`🔍 Database instance ID: ${this.instanceId}`);
    console.log("Available OTP requests:", Array.from(this.otpRequests.keys()));

    // For registration, always check OTP requests map first since user doesn't exist yet
    if (type === "register") {
      const otpRequest = this.otpRequests.get(emailKey);
      console.log("Registration OTP request:", otpRequest);

      if (
        otpRequest &&
        otpRequest.type === type &&
        new Date() < otpRequest.expiresAt
      ) {
        console.log("OTP request found, comparing:", otpRequest.code.trim(), "vs", inputOtp);
                if (otpRequest.code.trim() === inputOtp) {
          this.otpRequests.delete(emailKey);
          this.saveOtpToFile(); // Update file after successful verification
          console.log("Registration OTP verification successful!");
          return true;
        } else {
          console.log("OTP code mismatch for registration");
        }
      } else {
        console.log("No valid registration OTP request found or expired");
        if (otpRequest) {
          console.log("Found request but invalid:", {
            type: otpRequest.type,
            expired: new Date() >= otpRequest.expiresAt,
            expiresAt: otpRequest.expiresAt,
            now: new Date()
          });
        }
      }
      return false;
    }

    // For login and password reset, check user's pending OTP first
    const user = await this.findUserByEmail(emailKey);
    if (user?.pendingOtp) {
      const {
        code: userOtpCode,
        type: otpType,
        expiresAt,
        attempts,
      } = user.pendingOtp;

      console.log("User pendingOtp:", user.pendingOtp);

      if (otpType === type && new Date() < expiresAt && attempts < 3) {
        if (userOtpCode.trim() === inputOtp) {
          // Clear the pending OTP after successful verification
          await this.updateUser(emailKey, { pendingOtp: undefined });
          this.otpRequests.delete(emailKey);
          return true;
        } else {
          // Increment failed attempts
          await this.updateUser(emailKey, {
            pendingOtp: {
              ...user.pendingOtp,
              attempts: attempts + 1,
            },
          });
        }
      }
    }

    // Also check the OTP requests map for login and password reset
    const otpRequest = this.otpRequests.get(emailKey);
    if (
      otpRequest &&
      otpRequest.type === type &&
      new Date() < otpRequest.expiresAt
    ) {
      console.log("OTP request:", otpRequest);
            if (otpRequest.code.trim() === inputOtp) {
        this.otpRequests.delete(emailKey);
        this.saveOtpToFile(); // Update file after successful verification
        return true;
      }
    }

    console.log("OTP verification failed - no matching OTP found");
    return false;
  }

  async markEmailVerified(email: string): Promise<void> {
    await this.updateUser(email, { emailVerified: true });
  }

  async updateLoginStats(email: string): Promise<void> {
    const user = await this.findUserByEmail(email);
    if (user) {
      await this.updateUser(email, {
        isOnline: true,
        lastActive: new Date(),
        statistics: {
          ...user.statistics,
          totalLogins: user.statistics.totalLogins + 1,
        },
      });
    }
  }

  // Convert database user to app user format
  convertToAppUser(dbUser: DatabaseUser): User {
    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      role: dbUser.role,
      avatar: dbUser.avatar,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      department: dbUser.department,
      specializations: dbUser.specializations,
      joinDate: dbUser.joinDate,
      lastActive: dbUser.lastActive,
      isOnline: dbUser.isOnline,
      preferences: dbUser.preferences,
      statistics: dbUser.statistics,
      subscription: dbUser.subscription,
      password: undefined, // Never expose password
    };
  }

  // Get all users (for admin purposes)
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values()).map((user) =>
      this.convertToAppUser(user),
    );
  }

      // File-based user storage for development persistence
  private saveUsersToFile(): void {
    if (!this.filePersistenceEnabled) return;

    try {
      const usersData = Array.from(this.users.entries()).map(([email, user]) => ({
        ...user,
        joinDate: user.joinDate.toISOString(),
        lastActive: user.lastActive.toISOString(),
        pendingOtp: user.pendingOtp ? {
          ...user.pendingOtp,
          expiresAt: user.pendingOtp.expiresAt.toISOString()
        } : undefined
      }));
      fs.writeFileSync(this.usersStoragePath, JSON.stringify(usersData, null, 2));
      console.log(`💾 Saved ${usersData.length} user(s) to file`);
    } catch (error) {
      console.error('Failed to save users to file:', error);
    }
  }

  private loadUsersFromFile(): void {
    if (!this.filePersistenceEnabled) return;

    try {
      if (fs.existsSync(this.usersStoragePath)) {
        const data = fs.readFileSync(this.usersStoragePath, "utf8");
        const usersArray = JSON.parse(data);

        let loadedCount = 0;

        usersArray.forEach((userData: any) => {
          const user: DatabaseUser = {
            ...userData,
            joinDate: new Date(userData.joinDate),
            lastActive: new Date(userData.lastActive),
            pendingOtp: userData.pendingOtp ? {
              ...userData.pendingOtp,
              expiresAt: new Date(userData.pendingOtp.expiresAt)
            } : undefined
          };

          this.users.set(userData.email, user);
          loadedCount++;
        });

        console.log(`📂 Loaded ${loadedCount} user(s) from file`);
      }
    } catch (error) {
      console.error("Failed to load users from file:", error);
      // Create empty file if it doesn't exist or is corrupted
      this.saveUsersToFile();
    }
  }

  // File-based OTP storage for development persistence
  private saveOtpToFile(): void {
    if (!this.filePersistenceEnabled) return;

    try {
      const otpData = Array.from(this.otpRequests.entries()).map(([email, otp]) => ({
        ...otp,
        expiresAt: otp.expiresAt.toISOString()
      }));
      fs.writeFileSync(this.otpStoragePath, JSON.stringify(otpData, null, 2));
      console.log(`💾 Saved ${otpData.length} OTP(s) to file`);
    } catch (error) {
      console.error('Failed to save OTP to file:', error);
    }
  }

  private loadOtpFromFile(): void {
    if (!this.filePersistenceEnabled) return;

    try {
      if (fs.existsSync(this.otpStoragePath)) {
        const data = fs.readFileSync(this.otpStoragePath, "utf8");
        const otpArray = JSON.parse(data);

        // Clean up expired OTPs while loading
        const now = new Date();
        let loadedCount = 0;

        otpArray.forEach((item: any) => {
          const expiresAt = new Date(item.expiresAt);
          if (now < expiresAt) {
            this.otpRequests.set(item.email, {
              email: item.email,
              type: item.type,
              code: item.code,
              expiresAt
            });
            loadedCount++;
          }
        });

        console.log(`📂 Loaded ${loadedCount} valid OTP(s) from file`);

        // Save back cleaned data
        if (loadedCount !== otpArray.length) {
          this.saveOtpToFile();
        }
      }
    } catch (error) {
      console.error('Failed to load OTP from file:', error);
      // Create empty file if it doesn't exist or is corrupted
      this.saveOtpToFile();
    }
  }

  // Clean up expired OTPs (should be called periodically)
  cleanupExpiredOtps(): void {
    const now = new Date();
    let hasExpired = false;

    for (const [email, otp] of this.otpRequests.entries()) {
      if (now > otp.expiresAt) {
        this.otpRequests.delete(email);
        hasExpired = true;
      }
    }

    if (hasExpired) {
      this.saveOtpToFile();
    }

    // Also clean up expired user OTPs
    for (const user of this.users.values()) {
      if (user.pendingOtp && now > user.pendingOtp.expiresAt) {
        this.updateUser(user.email, { pendingOtp: undefined });
      }
    }
  }
}

// Select storage backend: PostgreSQL when DATABASE_URL is configured,
// otherwise the in-memory store (development / no-DB fallback).
export const userDatabase: IUserDatabase = process.env.DATABASE_URL
  ? new PgUserDatabase()
  : new UserDatabase();

if (process.env.DATABASE_URL) {
  console.log("🗄️  User store: PostgreSQL");
} else {
  console.warn(
    "🗄️  User store: in-memory (set DATABASE_URL to persist users across restarts / instances)",
  );
}

// Auto cleanup expired OTPs every minute
setInterval(() => {
  userDatabase.cleanupExpiredOtps();
}, 60000);
