# Supabase Database Setup Guide

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - Project name: `ai-resume-analyzer`
   - Database password: (save this securely)
   - Region: Choose closest to your users
   - Pricing plan: Free tier is sufficient to start

## Step 2: Run Database Migration

1. Once your project is created, go to the SQL Editor
2. Copy the entire contents of `database/schema.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute the migration
5. Verify all tables were created successfully

## Step 3: Configure Storage for Resume Files

1. Go to Storage in the Supabase dashboard
2. Create a new bucket called `resumes`
3. Set bucket to **private** (important for security)
4. Add storage policies:

```sql
-- Allow authenticated users to upload their own resumes
CREATE POLICY "Users can upload own resumes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own resumes
CREATE POLICY "Users can view own resumes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own resumes
CREATE POLICY "Users can delete own resumes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## Step 4: Get Your Credentials

1. Go to Project Settings → API
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

## Step 5: Configure Environment Variables

1. Create a `.env` file in your project root (copy from `.env.example`)
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 6: Configure Clerk Integration

Since you're using Clerk for authentication, you need to set up JWT templates:

1. Go to your Clerk Dashboard
2. Navigate to JWT Templates
3. Create a new template named "supabase"
4. Use this configuration:

```json
{
  "aud": "authenticated",
  "exp": {{user.exp}},
  "sub": "{{user.id}}",
  "email": "{{user.email}}",
  "app_metadata": {
    "provider": "clerk"
  },
  "user_metadata": {}
}
```

5. Update the Supabase JWT Secret:
   - In Supabase Dashboard → Settings → API → JWT Settings
   - Copy the JWT Secret
   - In Clerk Dashboard → JWT Templates → Your Template → Add to issuer allowlist

## Step 7: Test the Connection

Run the development server and check if the database connection works:

```bash
npm run dev
```

## Database Structure Overview

### Tables Created:

1. **users** - Synced with Clerk authentication
2. **resumes** - Stores uploaded resume metadata
3. **resume_analysis** - Stores AI analysis results
4. **resume_keywords** - Extracted keywords from resumes
5. **user_subscriptions** - Manages user plans and limits
6. **analysis_templates** - Job-specific analysis templates

### Key Features:

- ✅ Row Level Security (RLS) enabled
- ✅ Automatic timestamps with triggers
- ✅ Cascading deletes for data integrity
- ✅ Indexed columns for performance
- ✅ JSONB fields for flexible data storage

## Next Steps

After database setup:

1. ✅ Install dependencies: `npm install @supabase/supabase-js`
2. ✅ Configure Supabase client
3. ✅ Create database utility functions
4. 🔲 Set up file upload with Supabase Storage
5. 🔲 Integrate AI service (OpenAI/Gemini) for resume analysis
6. 🔲 Update UI components to use database

## Troubleshooting

### Connection Issues
- Verify environment variables are loaded correctly
- Check Supabase project is active
- Ensure API keys are correct

### RLS Policies Not Working
- Make sure JWT token is being passed correctly
- Verify Clerk JWT template is configured
- Check user exists in users table

### Migration Errors
- Run migrations in order
- Check for syntax errors in SQL
- Verify UUID extension is enabled

## Useful Supabase Queries

Check if tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

View all users:
```sql
SELECT * FROM users;
```

Check resume count by user:
```sql
SELECT u.email, COUNT(r.id) as resume_count
FROM users u
LEFT JOIN resumes r ON r.user_id = u.id
GROUP BY u.id, u.email;
```
