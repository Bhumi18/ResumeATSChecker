import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { safeConsole } from './logging';

// Neon database configuration
// Use DATABASE_URL for server-side (no VITE_ prefix)
// VITE_ prefixed variables are only for browser/client
const databaseUrl = process.env.DATABASE_URL || import.meta.env.VITE_NEON_DATABASE_URL || '';

if (!databaseUrl) {
  safeConsole.error('❌ DATABASE_URL is not set! Database operations will fail.');
  safeConsole.error('Please set DATABASE_URL in your .env file');
}

// Create a SQL query function for Neon
export const sql: NeonQueryFunction<false, false> = neon(databaseUrl);

// Helper function to execute queries with error handling
export async function query<T = any>(
  sqlQuery: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const result = await sql(sqlQuery, params);
    return result as T[];
  } catch (error) {
    safeConsole.error('Database query error:', error);
    throw error;
  }
}

// Helper to get a single record
export async function queryOne<T = any>(
  sqlQuery: string,
  params: any[] = []
): Promise<T | null> {
  try {
    const result = await sql(sqlQuery, params);
    return result[0] as T || null;
  } catch (error) {
    safeConsole.error('Database query error:', error);
    throw error;
  }
}

// Helper to execute non-query commands (INSERT, UPDATE, DELETE)
export async function execute(
  sqlQuery: string,
  params: any[] = []
): Promise<boolean> {
  try {
    await sql(sqlQuery, params);
    return true;
  } catch (error) {
    safeConsole.error('Database execution error:', error);
    return false;
  }
}
