/**
 * Server-side Authentication Library
 * Handles user authentication, session management, and password hashing
 */

import { sql, queryOne, execute } from './neon.server';
import type { Database } from '../../types/database';

type User = Database['public']['Tables']['users']['Row'];
type Session = {
  id: string;
  user_id: string;
  session_token: string;
  expires_at: string;
  created_at: string;
  last_accessed_at: string;
};

// Session configuration
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

/**
 * Hash password using Web Crypto API (available in Node.js 16+)
 */
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `sha256:${hashHex}`;
}

/**
 * Verify password against hash
 */
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const newHash = await hashPassword(password);
  return newHash === hash;
}

/**
 * Generate a secure random session token
 */
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a new user account
 */
export async function createUser(
  email: string,
  password: string,
  firstName?: string,
  lastName?: string
): Promise<User | null> {
  try {
    const passwordHash = await hashPassword(password);
    const username = email.split('@')[0]; // Simple username from email
    
    const result = await queryOne<User>(
      `INSERT INTO users (email, password_hash, username, first_name, last_name, clerk_user_id)
       VALUES ($1, $2, $3, $4, $5, 'local_' || gen_random_uuid())
       RETURNING *`,
      [email, passwordHash, username, firstName || null, lastName || null]
    );
    
    return result;
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

/**
 * Authenticate user with email and password
 */
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const user = await queryOne<User>(
      `SELECT * FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );
    
    if (!user || !user.password_hash) {
      return null;
    }
    
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
}

/**
 * Create a new session for a user
 */
export async function createSession(
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<string | null> {
  try {
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION);
    
    await execute(
      `INSERT INTO user_sessions (user_id, session_token, expires_at, user_agent, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, sessionToken, expiresAt.toISOString(), userAgent || null, ipAddress || null]
    );
    
    return sessionToken;
  } catch (error) {
    console.error('Error creating session:', error);
    return null;
  }
}

/**
 * Validate a session token and return the user
 */
export async function validateSession(sessionToken: string): Promise<User | null> {
  try {
    // First update the session and get the user_id
    const session = await queryOne<Session>(
      `UPDATE user_sessions
       SET last_accessed_at = NOW()
       WHERE session_token = $1 AND expires_at > NOW()
       RETURNING id, user_id, session_token, expires_at, created_at, last_accessed_at, user_agent, ip_address`,
      [sessionToken]
    );
    
    if (!session) {
      return null;
    }
    
    // Then fetch the user
    const user = await queryOne<User>(
      `SELECT id, email, first_name, last_name, username, profile_image_url
       FROM users
       WHERE id = $1`,
      [session.user_id]
    );
    
    return user;
  } catch (error) {
    console.error('Error validating session:', error);
    return null;
  }
}

/**
 * Get user by session token
 */
export async function getUserBySession(sessionToken: string): Promise<User | null> {
  try {
    const session = await queryOne<Session>(
      `SELECT * FROM user_sessions WHERE session_token = $1 AND expires_at > NOW()`,
      [sessionToken]
    );
    
    if (!session) {
      return null;
    }
    
    const user = await queryOne<User>(
      `SELECT * FROM users WHERE id = $1`,
      [session.user_id]
    );
    
    return user;
  } catch (error) {
    console.error('Error getting user by session:', error);
    return null;
  }
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(sessionToken: string): Promise<boolean> {
  try {
    await execute(
      `DELETE FROM user_sessions WHERE session_token = $1`,
      [sessionToken]
    );
    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    return false;
  }
}

/**
 * Delete all sessions for a user (logout from all devices)
 */
export async function deleteAllUserSessions(userId: string): Promise<boolean> {
  try {
    await execute(
      `DELETE FROM user_sessions WHERE user_id = $1`,
      [userId]
    );
    return true;
  } catch (error) {
    console.error('Error deleting all user sessions:', error);
    return false;
  }
}

/**
 * Update user password
 */
export async function updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
  try {
    const passwordHash = await hashPassword(newPassword);
    await execute(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [passwordHash, userId]
    );
    return true;
  } catch (error) {
    console.error('Error updating password:', error);
    return false;
  }
}

/**
 * Check if email is already registered
 */
export async function isEmailTaken(email: string): Promise<boolean> {
  try {
    const result = await queryOne(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );
    return !!result;
  } catch (error) {
    console.error('Error checking email:', error);
    return false;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    return await queryOne<User>(
      `SELECT * FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  try {
    return await queryOne<User>(
      `SELECT * FROM users WHERE id = $1 LIMIT 1`,
      [id]
    );
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    first_name?: string;
    last_name?: string;
    username?: string;
    profile_image_url?: string;
  }
): Promise<User | null> {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (updates.first_name !== undefined) {
      fields.push(`first_name = $${paramIndex++}`);
      values.push(updates.first_name);
    }
    if (updates.last_name !== undefined) {
      fields.push(`last_name = $${paramIndex++}`);
      values.push(updates.last_name);
    }
    if (updates.username !== undefined) {
      fields.push(`username = $${paramIndex++}`);
      values.push(updates.username);
    }
    if (updates.profile_image_url !== undefined) {
      fields.push(`profile_image_url = $${paramIndex++}`);
      values.push(updates.profile_image_url);
    }
    
    fields.push(`updated_at = NOW()`);
    values.push(userId);
    
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    
    return await queryOne<User>(query, values);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
}

/**
 * Password Reset Functions
 */

const RESET_TOKEN_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Generate a secure random reset token
 */
function generateResetToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a password reset token for a user
 */
export async function createPasswordResetToken(
  email: string,
  ipAddress?: string
): Promise<{ token: string; userId: string } | null> {
  try {
    // Find user by email
    const user = await getUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return null;
    }
    
    // Generate reset token
    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_DURATION);
    
    // Delete any existing unused tokens for this user
    await execute(
      `DELETE FROM password_reset_tokens WHERE user_id = $1 AND used_at IS NULL`,
      [user.id]
    );
    
    // Create new reset token
    await execute(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [user.id, token, expiresAt.toISOString(), ipAddress || null]
    );
    
    return { token, userId: user.id };
  } catch (error) {
    console.error('Error creating password reset token:', error);
    return null;
  }
}

/**
 * Validate a password reset token
 */
export async function validateResetToken(token: string): Promise<string | null> {
  try {
    const result = await queryOne<{ user_id: string }>(
      `SELECT user_id FROM password_reset_tokens 
       WHERE token = $1 
       AND expires_at > NOW() 
       AND used_at IS NULL 
       LIMIT 1`,
      [token]
    );
    
    return result?.user_id || null;
  } catch (error) {
    console.error('Error validating reset token:', error);
    return null;
  }
}

/**
 * Reset password using a valid token
 */
export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<boolean> {
  try {
    // Validate token and get user ID
    const userId = await validateResetToken(token);
    if (!userId) {
      return false;
    }
    
    // Update password
    const success = await updateUserPassword(userId, newPassword);
    if (!success) {
      return false;
    }
    
    // Mark token as used
    await execute(
      `UPDATE password_reset_tokens SET used_at = NOW() WHERE token = $1`,
      [token]
    );
    
    // Optionally: Delete all sessions for this user (force re-login)
    await deleteAllUserSessions(userId);
    
    return true;
  } catch (error) {
    console.error('Error resetting password:', error);
    return false;
  }
}
