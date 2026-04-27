/**
 * Server-side Authentication Library
 * Handles user authentication, session management, and password hashing
 */

import { sql, queryOne, execute, query } from './neon.server';
import type { Database } from '../../types/database';
import { safeConsole } from './logging';
import argon2 from 'argon2';

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

// Password hashing configuration (Argon2id)
const ARGON2_CONFIG: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

type PasswordValidationResult = {
  valid: boolean;
  message?: string;
};

const COMMON_PASSWORDS = new Set([
  'password',
  'password123',
  '12345678',
  'qwerty123',
  'admin123',
  'letmein',
  'welcome123',
  'iloveyou',
]);

export function validatePasswordStrength(password: string): PasswordValidationResult {
  const value = String(password || '');

  if (value.length < 12) {
    return { valid: false, message: 'Password must be at least 12 characters long.' };
  }

  if (value.length > 128) {
    return { valid: false, message: 'Password must be 128 characters or fewer.' };
  }

  if (!/[a-z]/.test(value)) {
    return { valid: false, message: 'Password must include at least one lowercase letter.' };
  }

  if (!/[A-Z]/.test(value)) {
    return { valid: false, message: 'Password must include at least one uppercase letter.' };
  }

  if (!/[0-9]/.test(value)) {
    return { valid: false, message: 'Password must include at least one number.' };
  }

  if (!/[^A-Za-z0-9]/.test(value)) {
    return { valid: false, message: 'Password must include at least one special character.' };
  }

  if (COMMON_PASSWORDS.has(value.toLowerCase())) {
    return { valid: false, message: 'Password is too common. Please choose a stronger password.' };
  }

  return { valid: true };
}

/**
 * Hash password using Argon2id.
 */
async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_CONFIG);
}

/**
 * Verify password against either Argon2id (current) or legacy SHA-256 hashes.
 */
async function verifyPassword(
  password: string,
  hash: string
): Promise<{ isValid: boolean; needsRehash: boolean }> {
  if (!hash) return { isValid: false, needsRehash: false };

  if (hash.startsWith('sha256:')) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    const isValid = `sha256:${hashHex}` === hash;
    return { isValid, needsRehash: isValid };
  }

  try {
    const isValid = await argon2.verify(hash, password);
    if (!isValid) {
      return { isValid: false, needsRehash: false };
    }

    return {
      isValid: true,
      needsRehash: argon2.needsRehash(hash, ARGON2_CONFIG),
    };
  } catch {
    return { isValid: false, needsRehash: false };
  }
}

function isLegacyPasswordHash(hash: string): boolean {
  return typeof hash === 'string' && hash.startsWith('sha256:');
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
    const passwordPolicy = validatePasswordStrength(password);
    if (!passwordPolicy.valid) {
      safeConsole.warn('Rejected weak password during account creation for email:', email);
      return null;
    }

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
    safeConsole.error('Error creating user:', error);
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
    
    const verification = await verifyPassword(password, user.password_hash);
    if (!verification.isValid) {
      return null;
    }

    // Transparent migration: upgrade legacy SHA-256 and outdated Argon2 hashes after successful login.
    if (verification.needsRehash || isLegacyPasswordHash(user.password_hash)) {
      try {
        const upgradedHash = await hashPassword(password);
        await execute(
          `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
          [upgradedHash, user.id]
        );
      } catch (migrationError) {
        // Do not block login if migration fails; user is already authenticated.
        safeConsole.warn('Password hash migration failed for user:', user.id, migrationError);
      }
    }
    
    return user;
  } catch (error) {
    safeConsole.error('Error authenticating user:', error);
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
    safeConsole.error('Error creating session:', error);
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
    safeConsole.error('Error validating session:', error);
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
    safeConsole.error('Error getting user by session:', error);
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
    safeConsole.error('Error deleting session:', error);
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
    safeConsole.error('Error deleting all user sessions:', error);
    return false;
  }
}

/**
 * Update user password
 */
export async function updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
  try {
    const passwordPolicy = validatePasswordStrength(newPassword);
    if (!passwordPolicy.valid) {
      safeConsole.warn('Rejected weak password update for user:', userId);
      return false;
    }

    const passwordHash = await hashPassword(newPassword);
    await execute(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [passwordHash, userId]
    );
    return true;
  } catch (error) {
    safeConsole.error('Error updating password:', error);
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
    safeConsole.error('Error checking email:', error);
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
    safeConsole.error('Error getting user by email:', error);
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
    safeConsole.error('Error getting user by ID:', error);
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
    safeConsole.error('Error updating user profile:', error);
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
    safeConsole.error('Error creating password reset token:', error);
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
    safeConsole.error('Error validating reset token:', error);
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
    safeConsole.error('Error resetting password:', error);
    return false;
  }
}

/**
 * OAuth Functions
 */

type OAuthAccount = {
  id: string;
  user_id: string;
  provider: string;
  provider_account_id: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
};

/**
 * Find or create user from OAuth provider data
 */
export async function findOrCreateOAuthUser(
  provider: string,
  profile: {
    id: string;
    email: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
  },
  tokens: {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    id_token?: string;
    scope?: string;
  }
): Promise<User | null> {
  try {
    // Check if OAuth account already exists
    const oauthAccount = await queryOne<OAuthAccount>(
      `SELECT * FROM oauth_accounts WHERE provider = $1 AND provider_account_id = $2 LIMIT 1`,
      [provider, profile.id]
    );

    let user: User | null = null;

    if (oauthAccount) {
      // Get existing user
      user = await getUserById(oauthAccount.user_id);
      
      // Update OAuth tokens
      const expiresAt = tokens.expires_in 
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null;
      
      await execute(
        `UPDATE oauth_accounts 
         SET access_token = $1, refresh_token = $2, expires_at = $3, updated_at = NOW()
         WHERE id = $4`,
        [tokens.access_token, tokens.refresh_token || null, expiresAt, oauthAccount.id]
      );
    } else {
      // Check if user exists with this email
      user = await getUserByEmail(profile.email);

      if (!user) {
        // Create new user
        const firstName = profile.given_name || profile.name?.split(' ')[0] || null;
        const lastName = profile.family_name || profile.name?.split(' ').slice(1).join(' ') || null;
        const username = profile.email.split('@')[0];

        user = await queryOne<User>(
          `INSERT INTO users (email, username, first_name, last_name, profile_image_url, clerk_user_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [
            profile.email,
            username,
            firstName,
            lastName,
            profile.picture || null,
            `${provider}_${profile.id}`
          ]
        );
      }

      if (!user) {
        return null;
      }

      // Link OAuth account to user
      const expiresAt = tokens.expires_in 
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null;

      await execute(
        `INSERT INTO oauth_accounts 
         (user_id, provider, provider_account_id, access_token, refresh_token, expires_at, id_token, scope)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          user.id,
          provider,
          profile.id,
          tokens.access_token,
          tokens.refresh_token || null,
          expiresAt,
          tokens.id_token || null,
          tokens.scope || null
        ]
      );
    }

    return user;
  } catch (error) {
    safeConsole.error('Error finding/creating OAuth user:', error);
    return null;
  }
}

/**
 * Get OAuth account for a user
 */
export async function getOAuthAccount(
  userId: string,
  provider: string
): Promise<OAuthAccount | null> {
  try {
    return await queryOne<OAuthAccount>(
      `SELECT * FROM oauth_accounts WHERE user_id = $1 AND provider = $2 LIMIT 1`,
      [userId, provider]
    );
  } catch (error) {
    safeConsole.error('Error getting OAuth account:', error);
    return null;
  }
}

/**
 * Get all OAuth accounts for a user
 */
export async function getUserOAuthProviders(
  userId: string
): Promise<{ provider: string; provider_account_id: string; created_at: string }[]> {
  try {
    return await query<{ provider: string; provider_account_id: string; created_at: string }>(
      `SELECT provider, provider_account_id, created_at FROM oauth_accounts WHERE user_id = $1`,
      [userId]
    );
  } catch (error) {
    safeConsole.error('Error getting user OAuth providers:', error);
    return [];
  }
}

/**
 * Unlink OAuth account from user
 */
export async function unlinkOAuthAccount(
  userId: string,
  provider: string
): Promise<boolean> {
  try {
    await execute(
      `DELETE FROM oauth_accounts WHERE user_id = $1 AND provider = $2`,
      [userId, provider]
    );
    return true;
  } catch (error) {
    safeConsole.error('Error unlinking OAuth account:', error);
    return false;
  }
}

