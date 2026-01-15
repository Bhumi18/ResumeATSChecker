import { supabase } from '../supabase';
import type { Database } from '../../../types/database';

type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];

/**
 * Get or create a user in Supabase based on Clerk user data
 */
export async function getOrCreateUser(clerkUserId: string, userData: {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
}): Promise<User | null> {
  try {
    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (existingUser) {
      return existingUser;
    }

    // Create new user if doesn't exist
    const newUser: UserInsert = {
      clerk_user_id: clerkUserId,
      email: userData.email,
      first_name: userData.firstName,
      last_name: userData.lastName,
      profile_image_url: userData.profileImageUrl,
    };

    const { data: createdUser, error: createError } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      return null;
    }

    // Create default subscription for new user
    if (createdUser) {
      await supabase.from('user_subscriptions').insert({
        user_id: createdUser.id,
        plan_type: 'free',
        resumes_limit: 5,
        is_active: true,
      });
    }

    return createdUser;
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
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
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('clerk_user_id', clerkUserId);

    if (error) {
      console.error('Error updating user:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return false;
  }
}

/**
 * Get user by Clerk ID
 */
export async function getUserByClerkId(clerkUserId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserByClerkId:', error);
    return null;
  }
}
