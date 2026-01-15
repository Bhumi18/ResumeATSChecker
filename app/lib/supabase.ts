import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
// Note: Not using Database generic type due to TypeScript inference issues
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We're using Clerk for auth
    autoRefreshToken: false,
  },
});

// Helper function to set the auth token from Clerk
export const setSupabaseAuth = (token: string) => {
  // This sets the JWT token for RLS policies
  supabase.functions.setAuth(token);
};
