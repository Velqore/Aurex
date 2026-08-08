/**
 * Database Connection Module
 * Provides database connection and query utilities
 */

import { Pool } from 'pg';

function resolveDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error('Database not configured: DATABASE_URL is missing');
  }

  // Handle accidental wrapping quotes/spaces from platform env editors.
  const trimmed = raw.trim().replace(/^["']|["']$/g, '');

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('Database not configured: DATABASE_URL is not a valid URL');
  }

  if (!parsed.protocol || (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:')) {
    throw new Error('Database not configured: DATABASE_URL must start with postgres:// or postgresql://');
  }

  if (!parsed.hostname) {
    throw new Error('Database not configured: DATABASE_URL hostname is missing');
  }

  return trimmed;
}

function createPoolConfig() {
  return {
    connectionString: resolveDatabaseUrl(),
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : undefined,
    max: 20, // Maximum number of clients in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}

// Create connection pool
let pool: Pool | null = null;

/**
 * Get database connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not configured. Using in-memory storage.');
      throw new Error('Database not configured');
    }
    pool = new Pool(createPoolConfig());
    
    // Handle connection errors
    pool.on('error', (err: Error) => {
      console.error('Unexpected database error:', err);
    });
    
    console.log('✅ Database connection pool initialized');
  }
  
  return pool;
}

/**
 * Execute a query
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  try {
    const client = await getPool().connect();
    try {
      const result = await client.query(text, params);
      return result.rows;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Execute a transaction
 */
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close database connection
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✅ Database connection pool closed');
  }
}

/**
 * Check if database is configured and accessible
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    if (!process.env.DATABASE_URL) {
      return false;
    }
    const result = await query('SELECT 1');
    return result.length > 0;
  } catch (error) {
    return false;
  }
}

export default {
  getPool,
  query,
  transaction,
  closePool,
  isDatabaseAvailable
};
