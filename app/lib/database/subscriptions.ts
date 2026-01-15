import { supabase } from '../supabase';
import type { Database } from '../../../types/database';

type UserSubscription = Database['public']['Tables']['user_subscriptions']['Row'];

/**
 * Get user subscription
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return null;
    }

    return data;
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
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('resumes_analyzed_count')
      .eq('user_id', userId)
      .single();

    if (!subscription) return false;

    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        resumes_analyzed_count: subscription.resumes_analyzed_count + 1,
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error incrementing resume count:', error);
      return false;
    }

    return true;
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
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        plan_type: planType,
        resumes_limit: resumesLimit,
        is_active: true,
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating subscription:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateSubscriptionPlan:', error);
    return false;
  }
}
