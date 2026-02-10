import { sql, queryOne, execute } from '../neon.server';
import type { Database } from '../../../types/database';

type UserSubscription = Database['public']['Tables']['user_subscriptions']['Row'];

/**
 * Get user subscription
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    return await queryOne<UserSubscription>(
      `SELECT * FROM user_subscriptions WHERE user_id = $1`,
      [userId]
    );
  } catch (error) {
    console.error('Error in getUserSubscription:', error);
    return null;
  }
}

/**
 * Check if user can analyze more resumes
 * Note: ATS checker is now free for all users with unlimited analyses
 */
export async function canAnalyzeResume(userId: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
}> {
  try {
    // ATS checker is free for all users - unlimited analyses
    return {
      allowed: true,
      remaining: 999,
      limit: 999,
    };
  } catch (error) {
    console.error('Error in canAnalyzeResume:', error);
    return { allowed: true, remaining: 999, limit: 999 };
  }
}

/**
 * Increment resume analyzed count
 */
export async function incrementResumeCount(userId: string): Promise<boolean> {
  try {
    return await execute(
      `UPDATE user_subscriptions 
       SET resumes_analyzed_count = resumes_analyzed_count + 1,
           updated_at = NOW()
       WHERE user_id = $1`,
      [userId]
    );
  } catch (error) {
    console.error('Error in incrementResumeCount:', error);
    return false;
  }
}

/**
 * Update subscription plan
 */
export async function updateSubscriptionPlan(
  userId: string,
  planType: 'free' | 'basic' | 'premium' | 'enterprise',
  resumesLimit: number
): Promise<boolean> {
  try {
    return await execute(
      `UPDATE user_subscriptions 
       SET plan_type = $1, resumes_limit = $2, is_active = true, updated_at = NOW()
       WHERE user_id = $3`,
      [planType, resumesLimit, userId]
    );
  } catch (error) {
    console.error('Error in updateSubscriptionPlan:', error);
    return false;
  }
}
