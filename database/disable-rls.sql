-- Disable Row Level Security for Clerk Authentication
-- Run this in Supabase SQL Editor to allow Clerk users to access the database

-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE resumes DISABLE ROW LEVEL SECURITY;
ALTER TABLE resume_analysis DISABLE ROW LEVEL SECURITY;
ALTER TABLE resume_keywords DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_templates DISABLE ROW LEVEL SECURITY;

-- Drop existing policies (they won't work with Clerk auth anyway)
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can view own resumes" ON resumes;
DROP POLICY IF EXISTS "Users can insert own resumes" ON resumes;
DROP POLICY IF EXISTS "Users can update own resumes" ON resumes;
DROP POLICY IF EXISTS "Users can delete own resumes" ON resumes;
DROP POLICY IF EXISTS "Users can view own resume analysis" ON resume_analysis;
DROP POLICY IF EXISTS "Users can insert own resume analysis" ON resume_analysis;
DROP POLICY IF EXISTS "Users can update own resume analysis" ON resume_analysis;
DROP POLICY IF EXISTS "Users can view own keywords" ON resume_keywords;
DROP POLICY IF EXISTS "Users can insert own keywords" ON resume_keywords;
DROP POLICY IF EXISTS "Users can view own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Anyone can view templates" ON analysis_templates;

-- Note: With RLS disabled, make sure your Supabase API keys are kept secure
-- The application logic will handle authorization through Clerk
