import { sql, queryOne, execute, query } from '../neon.server';
import type { Database } from '../../../types/database';
import { safeConsole } from '../logging';

type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];

/**
 * Get user by ID (used with custom auth)
 */
export async function getOrCreateUser(userId: string, userData: {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
}): Promise<User | null> {
  try {
    // Just fetch the user by ID
    const existingUser = await queryOne<User>(
      `SELECT * FROM users WHERE id = $1`,
      [userId]
    );

    return existingUser;
  } catch (error) {
    safeConsole.error('Error in getOrCreateUser:', error);
    return null;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  clerkUserId: string,
  updates: Partial<UserInsert>
): Promise<boolean> {
  try {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.email !== undefined) {
      updateFields.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }
    if (updates.first_name !== undefined) {
      updateFields.push(`first_name = $${paramCount++}`);
      values.push(updates.first_name);
    }
    if (updates.last_name !== undefined) {
      updateFields.push(`last_name = $${paramCount++}`);
      values.push(updates.last_name);
    }
    if (updates.profile_image_url !== undefined) {
      updateFields.push(`profile_image_url = $${paramCount++}`);
      values.push(updates.profile_image_url);
    }

    if (updateFields.length === 0) {
      return true; // Nothing to update
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(clerkUserId);

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE clerk_user_id = $${paramCount}`;
    return await execute(query, values);
  } catch (error) {
    safeConsole.error('Error in updateUserProfile:', error);
    return false;
  }
}

/**
 * Get user by Clerk ID
 */
export async function getUserByClerkId(clerkUserId: string): Promise<User | null> {
  try {
    return await queryOne<User>(
      `SELECT * FROM users WHERE clerk_user_id = $1`,
      [clerkUserId]
    );
  } catch (error) {
    safeConsole.error('Error in getUserByClerkId:', error);
    return null;
  }
}
