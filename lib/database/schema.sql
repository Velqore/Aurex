-- Aurex database schema (PostgreSQL)
--
-- The application creates these tables automatically on first use when
-- DATABASE_URL is set (see lib/database/pgUserDatabase.ts). This file is
-- provided for reference and for manual/CI provisioning.
--
-- Apply manually with:  psql "$DATABASE_URL" -f lib/database/schema.sql

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
);

CREATE TABLE IF NOT EXISTS otp_requests (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(10) NOT NULL,
  type VARCHAR(50) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email, type)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_requests(email);
