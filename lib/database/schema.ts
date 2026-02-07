/**
 * Database Schema Definitions
 * TypeScript types and table schemas for the application
 */

// User table schema
export interface UserSchema {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  salt: string;
  role: 'admin' | 'pro' | 'enterprise' | 'free';
  first_name?: string;
  last_name?: string;
  department?: string;
  specializations: string[];
  join_date: Date;
  last_active: Date;
  is_online: boolean;
  email_verified: boolean;
  phone_number?: string;
  phone_verified: boolean;
  two_factor_enabled: boolean;
  preferences: Record<string, any>;
  statistics: Record<string, any>;
  subscription?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

// Session table schema
export interface SessionSchema {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
  ip_address?: string;
  user_agent?: string;
}

// Terminal session schema
export interface TerminalSessionSchema {
  id: string;
  user_id: string;
  username: string;
  role: string;
  container_id?: string;
  start_time: Date;
  last_activity: Date;
  is_active: boolean;
  environment: Record<string, any>;
  security: Record<string, any>;
  created_at: Date;
}

// Terminal command schema
export interface TerminalCommandSchema {
  id: string;
  session_id: string;
  command: string;
  args: string[];
  output: string;
  error?: string;
  exit_code: number;
  timestamp: Date;
  duration: number;
  blocked?: boolean;
  block_reason?: string;
}

// OTP request schema
export interface OtpSchema {
  id: string;
  email: string;
  code: string;
  type: 'login' | 'register' | 'password_reset';
  expires_at: Date;
  attempts: number;
  created_at: Date;
}

// Chat message schema
export interface ChatMessageSchema {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  encrypted: boolean;
  timestamp: Date;
  edited: boolean;
  deleted: boolean;
}

// File vault schema
export interface FileSchema {
  id: string;
  user_id: string;
  filename: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  encrypted: boolean;
  upload_date: Date;
  metadata: Record<string, any>;
  scan_status?: 'pending' | 'clean' | 'infected' | 'error';
  scan_results?: Record<string, any>;
}

// Threat intelligence schema
export interface ThreatSchema {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  source: string;
  indicators: string[];
  timestamp: Date;
  metadata: Record<string, any>;
}

// SQL table creation queries (for PostgreSQL)
export const CREATE_TABLES_SQL = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'free',
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  department VARCHAR(255),
  specializations TEXT[] DEFAULT '{}',
  join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_online BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  phone_number VARCHAR(50),
  phone_verified BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}',
  statistics JSONB DEFAULT '{}',
  subscription JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT
);

-- Terminal sessions table
CREATE TABLE IF NOT EXISTS terminal_sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  container_id VARCHAR(255),
  start_time TIMESTAMP NOT NULL,
  last_activity TIMESTAMP NOT NULL,
  is_active BOOLEAN DEFAULT true,
  environment JSONB DEFAULT '{}',
  security JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Terminal commands table
CREATE TABLE IF NOT EXISTS terminal_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) REFERENCES terminal_sessions(id) ON DELETE CASCADE,
  command TEXT NOT NULL,
  args TEXT[] DEFAULT '{}',
  output TEXT,
  error TEXT,
  exit_code INTEGER,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration INTEGER,
  blocked BOOLEAN DEFAULT false,
  block_reason TEXT
);

-- OTP requests table
CREATE TABLE IF NOT EXISTS otp_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  code VARCHAR(10) NOT NULL,
  type VARCHAR(50) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_terminal_sessions_user_id ON terminal_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_requests(email);
`;

export default {
  CREATE_TABLES_SQL
};
