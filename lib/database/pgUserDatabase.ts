/**
 * Postgres-backed implementation of IUserDatabase.
 *
 * Activated automatically (see userDatabase.ts) when DATABASE_URL is set.
 * The schema is created lazily on first use, so no manual migration step is
 * required for a fresh database — though the equivalent SQL also lives in
 * lib/database/schema.sql for reference / manual setup.
 */

import crypto from "crypto";
import { query } from "./connection";
import {
  CreateUserInput,
  DatabaseUser,
  IUserDatabase,
  OtpType,
  UserRole,
} from "./userTypes";
import { User } from "../types/user";

/* ------------------------------------------------------------------ */
/* Password / OTP helpers (must match the in-memory store exactly so    */
/* hashes remain compatible across backends).                           */
/* ------------------------------------------------------------------ */

function generateSalt(): string {
  return crypto.randomBytes(32).toString("hex");
}

function hashPassword(password: string, salt: string): string {
  return crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function defaultPreferences() {
  return {
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
  };
}

function defaultStatistics() {
  return {
    totalLogins: 0,
    threatsAnalyzed: 0,
    filesProcessed: 0,
    chatMessages: 0,
    toolsUsed: 0,
    sessionDuration: 0,
  };
}

/* ------------------------------------------------------------------ */
/* Schema bootstrap (idempotent, memoized per process).                 */
/* ------------------------------------------------------------------ */

const CREATE_USERS = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'free',
  avatar TEXT,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  department VARCHAR(255),
  specializations TEXT[] NOT NULL DEFAULT '{}',
  join_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_online BOOLEAN NOT NULL DEFAULT false,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  phone_number VARCHAR(50),
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  preferences JSONB NOT NULL DEFAULT '{}',
  statistics JSONB NOT NULL DEFAULT '{}',
  subscription JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);`;

const CREATE_OTP = `
CREATE TABLE IF NOT EXISTS otp_requests (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(10) NOT NULL,
  type VARCHAR(50) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email, type)
);`;

const CREATE_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_requests(email);`;

let schemaReady: Promise<void> | null = null;

async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await query(CREATE_USERS);
      await query(CREATE_OTP);
      await query(CREATE_INDEXES);
      await seedAdmin();
    })().catch((err) => {
      // Reset so a later call can retry after a transient failure.
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

async function seedAdmin(): Promise<void> {
  const email = (process.env.ADMIN_EMAIL || "admin@cybersecchat.com").toLowerCase();
  const existing = await query("SELECT 1 FROM users WHERE email = $1", [email]);
  if (existing.length > 0) return;

  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  // Default seeded admin has 2FA OFF so it can log in on a fresh deploy with
  // no SMTP configured. Set ADMIN_2FA=true to require OTP.
  const twoFactor = process.env.ADMIN_2FA === "true";
  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);

  const prefs = defaultPreferences();
  prefs.security.twoFactorEnabled = twoFactor;

  await query(
    `INSERT INTO users
      (id, username, email, password_hash, salt, role, first_name, last_name,
       department, specializations, is_online, email_verified, phone_verified,
       two_factor_enabled, preferences, statistics)
     VALUES ($1,$2,$3,$4,$5,'admin','System','Administrator','IT Security',
       $6, false, true, false, $7, $8, $9)
     ON CONFLICT (email) DO NOTHING`,
    [
      "admin-001",
      username,
      email,
      passwordHash,
      salt,
      ["Network Security", "Incident Response", "Forensics"],
      twoFactor,
      JSON.stringify(prefs),
      JSON.stringify(defaultStatistics()),
    ],
  );

  if (!process.env.ADMIN_PASSWORD) {
    console.warn(
      "⚠️ Seeded default admin (admin/admin123). Set ADMIN_EMAIL/ADMIN_PASSWORD env vars and change this before going to production.",
    );
  }
}

/* ------------------------------------------------------------------ */
/* Row <-> DatabaseUser mapping                                         */
/* ------------------------------------------------------------------ */

function rowToUser(row: any): DatabaseUser {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    passwordHash: row.password_hash,
    salt: row.salt,
    role: row.role as UserRole,
    avatar: row.avatar ?? undefined,
    firstName: row.first_name ?? undefined,
    lastName: row.last_name ?? undefined,
    department: row.department ?? undefined,
    specializations: row.specializations ?? [],
    joinDate: new Date(row.join_date),
    lastActive: new Date(row.last_active),
    isOnline: row.is_online,
    emailVerified: row.email_verified,
    phoneNumber: row.phone_number ?? undefined,
    phoneVerified: row.phone_verified,
    twoFactorEnabled: row.two_factor_enabled,
    preferences: row.preferences ?? {},
    statistics: row.statistics ?? {},
    subscription: row.subscription ?? undefined,
  };
}

// Map DatabaseUser (camelCase) keys to DB columns for updates.
const COLUMN_MAP: Record<string, string> = {
  username: "username",
  email: "email",
  passwordHash: "password_hash",
  salt: "salt",
  role: "role",
  avatar: "avatar",
  firstName: "first_name",
  lastName: "last_name",
  department: "department",
  specializations: "specializations",
  joinDate: "join_date",
  lastActive: "last_active",
  isOnline: "is_online",
  emailVerified: "email_verified",
  phoneNumber: "phone_number",
  phoneVerified: "phone_verified",
  twoFactorEnabled: "two_factor_enabled",
  preferences: "preferences",
  statistics: "statistics",
  subscription: "subscription",
};

const JSON_COLUMNS = new Set(["preferences", "statistics", "subscription"]);

/* ------------------------------------------------------------------ */
/* Store implementation                                                 */
/* ------------------------------------------------------------------ */

export class PgUserDatabase implements IUserDatabase {
  async findUserByEmail(email: string): Promise<DatabaseUser | null> {
    await ensureSchema();
    const rows = await query("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);
    return rows.length ? rowToUser(rows[0]) : null;
  }

  async findUserByUsername(username: string): Promise<DatabaseUser | null> {
    await ensureSchema();
    const rows = await query(
      "SELECT * FROM users WHERE LOWER(username) = LOWER($1)",
      [username],
    );
    return rows.length ? rowToUser(rows[0]) : null;
  }

  async verifyPassword(email: string, password: string): Promise<boolean> {
    const user = await this.findUserByEmail(email);
    if (!user) return false;
    const hashed = hashPassword(password, user.salt);
    // Constant-time comparison to avoid timing leaks.
    const a = Buffer.from(hashed);
    const b = Buffer.from(user.passwordHash);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  async createUser(userData: CreateUserInput): Promise<DatabaseUser> {
    await ensureSchema();

    const existingEmail = await this.findUserByEmail(userData.email);
    if (existingEmail) {
      throw new Error("User with this email already exists");
    }
    const existingUsername = await this.findUserByUsername(userData.username);
    if (existingUsername) {
      throw new Error("Username already taken");
    }

    const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const salt = generateSalt();
    const passwordHash = hashPassword(userData.password, salt);

    const rows = await query(
      `INSERT INTO users
        (id, username, email, password_hash, salt, role, first_name, last_name,
         specializations, is_online, email_verified, phone_verified,
         two_factor_enabled, preferences, statistics)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,false,false,false,false,$10,$11)
       RETURNING *`,
      [
        id,
        userData.username,
        userData.email.toLowerCase(),
        passwordHash,
        salt,
        userData.role || "free",
        userData.firstName ?? null,
        userData.lastName ?? null,
        [],
        JSON.stringify(defaultPreferences()),
        JSON.stringify(defaultStatistics()),
      ],
    );

    console.log(`👤 Created new user: ${userData.email} (${userData.username})`);
    return rowToUser(rows[0]);
  }

  async updateUser(
    email: string,
    updates: Partial<DatabaseUser>,
  ): Promise<DatabaseUser | null> {
    await ensureSchema();

    const setClauses: string[] = [];
    const values: any[] = [];
    let i = 1;

    for (const [key, value] of Object.entries(updates)) {
      const column = COLUMN_MAP[key];
      if (!column) continue; // skip non-persistent keys (pendingOtp, otpSecret…)
      setClauses.push(`${column} = $${i++}`);
      values.push(JSON_COLUMNS.has(key) ? JSON.stringify(value) : value);
    }

    // Always refresh bookkeeping timestamps.
    setClauses.push(`last_active = now()`);
    setClauses.push(`updated_at = now()`);

    values.push(email.toLowerCase());

    const rows = await query(
      `UPDATE users SET ${setClauses.join(", ")} WHERE email = $${i} RETURNING *`,
      values,
    );
    return rows.length ? rowToUser(rows[0]) : null;
  }

  private async upsertOtp(
    email: string,
    type: OtpType,
    ttlMs: number,
  ): Promise<string> {
    await ensureSchema();
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + ttlMs);
    await query(
      `INSERT INTO otp_requests (email, code, type, expires_at, attempts)
       VALUES ($1,$2,$3,$4,0)
       ON CONFLICT (email, type)
       DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at, attempts = 0`,
      [email.toLowerCase(), code, type, expiresAt],
    );
    console.log(`OTP for ${email} (${type}): ${code} (expires ${expiresAt.toISOString()})`);
    return code;
  }

  async generateLoginOtp(email: string): Promise<string> {
    const user = await this.findUserByEmail(email);
    if (!user) throw new Error("User not found");
    return this.upsertOtp(email, "login", 5 * 60 * 1000);
  }

  async generateRegistrationOtp(email: string): Promise<string> {
    return this.upsertOtp(email, "register", 10 * 60 * 1000);
  }

  async verifyOtp(
    email: string,
    code: string,
    type: OtpType,
  ): Promise<boolean> {
    await ensureSchema();
    const emailKey = email.toLowerCase();
    const input = code.trim();

    const rows = await query(
      `SELECT * FROM otp_requests
       WHERE email = $1 AND type = $2 AND expires_at > now()`,
      [emailKey, type],
    );

    if (!rows.length) return false;
    const otp = rows[0];

    if (otp.attempts >= 3) {
      await query("DELETE FROM otp_requests WHERE email = $1 AND type = $2", [
        emailKey,
        type,
      ]);
      return false;
    }

    if (String(otp.code).trim() === input) {
      await query("DELETE FROM otp_requests WHERE email = $1 AND type = $2", [
        emailKey,
        type,
      ]);
      return true;
    }

    await query(
      "UPDATE otp_requests SET attempts = attempts + 1 WHERE email = $1 AND type = $2",
      [emailKey, type],
    );
    return false;
  }

  async markEmailVerified(email: string): Promise<void> {
    await ensureSchema();
    await query(
      "UPDATE users SET email_verified = true, updated_at = now() WHERE email = $1",
      [email.toLowerCase()],
    );
  }

  async updateLoginStats(email: string): Promise<void> {
    await ensureSchema();
    await query(
      `UPDATE users
       SET is_online = true,
           last_active = now(),
           updated_at = now(),
           statistics = jsonb_set(
             COALESCE(statistics, '{}'::jsonb),
             '{totalLogins}',
             to_jsonb(COALESCE((statistics->>'totalLogins')::int, 0) + 1)
           )
       WHERE email = $1`,
      [email.toLowerCase()],
    );
  }

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
      password: undefined,
    };
  }

  async getAllUsers(): Promise<User[]> {
    await ensureSchema();
    const rows = await query("SELECT * FROM users ORDER BY created_at ASC");
    return rows.map((row) => this.convertToAppUser(rowToUser(row)));
  }

  async cleanupExpiredOtps(): Promise<void> {
    try {
      await ensureSchema();
      await query("DELETE FROM otp_requests WHERE expires_at < now()");
    } catch (err) {
      console.error("Failed to clean up expired OTPs:", err);
    }
  }
}
