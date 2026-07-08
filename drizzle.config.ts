/**
 * Drizzle ORM Configuration
 * Database migrations and schema management
 */

import type { Config } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL not set. Database features will be limited.');
}

export default {
  schema: './lib/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
  verbose: true,
  strict: true,
} satisfies Config;
