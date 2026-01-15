-- =============================================
-- ATS Resume Analyzer Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Users Table (synced with Clerk)
-- =============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    profile_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Resumes Table
-- =============================================
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_name TEXT,
    job_title TEXT,
    job_description TEXT,
    resume_file_url TEXT NOT NULL,
    resume_file_name TEXT NOT NULL,
    resume_thumbnail_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'completed', 'failed')),
    overall_score INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Resume Analysis Table
-- =============================================
CREATE TABLE resume_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    
    -- ATS Score
    ats_score INTEGER,
    ats_tips JSONB DEFAULT '[]',
    
    -- Tone and Style
    tone_style_score INTEGER,
    tone_style_tips JSONB DEFAULT '[]',
    
    -- Content Analysis
    content_score INTEGER,
    content_tips JSONB DEFAULT '[]',
    
    -- Structure Analysis
    structure_score INTEGER,
    structure_tips JSONB DEFAULT '[]',
    
    -- Skills Analysis
    skills_score INTEGER,
    skills_tips JSONB DEFAULT '[]',
    
    -- Additional Analysis Data
    keywords_found TEXT[],
    keywords_missing TEXT[],
    sections_found TEXT[],
    sections_missing TEXT[],
    
    -- AI Model Info
    ai_model_used TEXT,
    analysis_version TEXT DEFAULT '1.0',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(resume_id)
);

-- =============================================
-- Resume Keywords Table (for matching)
-- =============================================
CREATE TABLE resume_keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    frequency INTEGER DEFAULT 1,
    category TEXT CHECK (category IN ('technical', 'soft_skill', 'industry', 'certification', 'tool')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- User Subscriptions Table (for future premium features)
-- =============================================
CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'basic', 'premium', 'enterprise')),
    resumes_analyzed_count INTEGER DEFAULT 0,
    resumes_limit INTEGER DEFAULT 5,
    subscription_start_date TIMESTAMPTZ,
    subscription_end_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- =============================================
-- Analysis Templates Table (for job-specific analysis)
-- =============================================
CREATE TABLE analysis_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    job_category TEXT NOT NULL,
    required_keywords TEXT[],
    required_sections TEXT[],
    scoring_weights JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Indexes for Performance
-- =============================================
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_status ON resumes(status);
CREATE INDEX idx_resumes_created_at ON resumes(created_at DESC);
CREATE INDEX idx_resume_analysis_resume_id ON resume_analysis(resume_id);
CREATE INDEX idx_resume_keywords_resume_id ON resume_keywords(resume_id);
CREATE INDEX idx_resume_keywords_keyword ON resume_keywords(keyword);
CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);

-- =============================================
-- Updated At Trigger Function
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- Triggers for Updated At
-- =============================================
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resumes_updated_at BEFORE UPDATE ON resumes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resume_analysis_updated_at BEFORE UPDATE ON resume_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Row Level Security (RLS) Policies
-- =============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (clerk_user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Resumes policies
CREATE POLICY "Users can view own resumes" ON resumes
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
    ));

CREATE POLICY "Users can insert own resumes" ON resumes
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
    ));

CREATE POLICY "Users can update own resumes" ON resumes
    FOR UPDATE USING (user_id IN (
        SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
    ));

CREATE POLICY "Users can delete own resumes" ON resumes
    FOR DELETE USING (user_id IN (
        SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
    ));

-- Resume analysis policies
CREATE POLICY "Users can view own resume analysis" ON resume_analysis
    FOR SELECT USING (resume_id IN (
        SELECT id FROM resumes WHERE user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    ));

-- Resume keywords policies
CREATE POLICY "Users can view own resume keywords" ON resume_keywords
    FOR SELECT USING (resume_id IN (
        SELECT id FROM resumes WHERE user_id IN (
            SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
        )
    ));

-- User subscriptions policies
CREATE POLICY "Users can view own subscription" ON user_subscriptions
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE clerk_user_id = auth.jwt() ->> 'sub'
    ));

-- =============================================
-- Sample Data for Testing
-- =============================================
-- Note: This should be removed in production
-- INSERT INTO analysis_templates (name, job_category, required_keywords, required_sections, scoring_weights) VALUES
-- ('Software Engineer Template', 'Software Development', 
--  ARRAY['programming', 'software', 'development', 'algorithms', 'data structures'],
--  ARRAY['experience', 'education', 'skills', 'projects'],
--  '{"ats": 0.25, "content": 0.25, "structure": 0.20, "skills": 0.20, "tone_style": 0.10}'::jsonb
-- );
