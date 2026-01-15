# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### 🚨 Database Connection Issues

#### Error: "Missing Supabase environment variables"
**Solution:**
1. Check `.env` file exists in project root
2. Verify these variables are set:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Restart development server: `npm run dev`

#### Error: "Failed to authenticate user"
**Possible Causes:**
- RLS policies not configured correctly
- Clerk JWT template not set up
- User not in database

**Solution:**
1. Check RLS policies in Supabase:
   ```sql
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   ```
2. Verify Clerk JWT template exists (see SUPABASE_SETUP.md)
3. Check browser console for specific errors

#### Error: "Row Level Security" related errors
**Solution:**
1. Ensure all RLS policies from `database/schema.sql` are applied
2. Check JWT token is being passed correctly
3. Verify user exists in `users` table:
   ```sql
   SELECT * FROM users WHERE clerk_user_id = 'your-clerk-id';
   ```

### 🤖 AI Analysis Issues

#### Error: "Failed to analyze resume with AI"
**Possible Causes:**
- API key not set or invalid
- API quota exceeded
- Network issues
- Invalid PDF format

**Solution:**
1. Verify API key in `.env`:
   ```env
   VITE_OPENAI_API_KEY=sk-...
   # OR
   VITE_GOOGLE_AI_API_KEY=your-key
   ```
2. Check API credits/quota on provider dashboard
3. Test with a simple PDF first
4. Check browser console for detailed error

**Note:** System automatically falls back to mock data if AI fails

#### Mock Data Always Used
**Cause:** No AI API key configured

**Solution:**
1. Get API key from OpenAI or Google AI
2. Add to `.env` file
3. Restart dev server

#### Poor Analysis Quality
**Solutions:**
- Include job title and description for better analysis
- Ensure resume has clear formatting
- Check PDF text extraction worked (console logs)
- Try different AI model in `ai-analyzer.ts`

### 📁 File Upload Issues

#### Error: "Failed to upload resume file"
**Possible Causes:**
- Storage bucket doesn't exist
- Storage policies not configured
- File too large
- Invalid file type

**Solution:**
1. Verify bucket exists in Supabase Storage
2. Check bucket is named exactly `resumes`
3. Apply storage policies from SUPABASE_SETUP.md
4. Verify file is PDF and under 20MB
5. Check network tab in browser for specific error

#### Error: "Storage API not available"
**Solution:**
1. Verify Supabase project is active
2. Check Storage is enabled in project settings
3. Ensure bucket access is set to "private"

### 🔐 Authentication Issues

#### Error: "You must be logged in to analyze resumes"
**Solution:**
1. Verify Clerk is configured correctly
2. Check VITE_CLERK_PUBLISHABLE_KEY in `.env`
3. Ensure user is signed in (check console)
4. Clear browser cache and cookies

#### User Not Redirected After Upload
**Possible Causes:**
- Navigation blocked by error
- Analysis failed silently

**Solution:**
1. Check browser console for errors
2. Verify resume was created in database
3. Check upload.tsx handleAnalyze function logs

### 📊 Subscription Limit Issues

#### Error: "You've reached your analysis limit"
**Solutions:**
1. Check current limit in database:
   ```sql
   SELECT * FROM user_subscriptions WHERE user_id = 'your-user-id';
   ```
2. Increase limit manually:
   ```sql
   UPDATE user_subscriptions 
   SET resumes_limit = 100 
   WHERE user_id = 'your-user-id';
   ```
3. Reset count for testing:
   ```sql
   UPDATE user_subscriptions 
   SET resumes_analyzed_count = 0 
   WHERE user_id = 'your-user-id';
   ```

#### Subscription Not Created for New User
**Solution:**
1. Check `getOrCreateUser` function in `users.ts`
2. Verify subscription insert is working
3. Manually create subscription:
   ```sql
   INSERT INTO user_subscriptions (user_id, plan_type, resumes_limit)
   VALUES ('user-id', 'free', 5);
   ```

### 🎨 UI/Display Issues

#### Resumes Not Showing on Home Page
**Possible Causes:**
- No resumes in database
- RLS blocking query
- Component not re-rendering

**Solution:**
1. Check if resumes exist:
   ```sql
   SELECT * FROM resumes WHERE user_id = 'your-user-id';
   ```
2. Check browser console for errors
3. Verify user is authenticated
4. Check RLS policies allow SELECT

#### Infinite Loading State
**Cause:** API call hanging or failing silently

**Solution:**
1. Check network tab for pending requests
2. Add timeout to fetch calls
3. Check for JavaScript errors in console
4. Verify Supabase project is online

### 🔨 Build/Development Issues

#### TypeScript Errors
**Common Errors:**
- Cannot find module errors
- Type mismatch errors

**Solutions:**
1. Run type check: `npm run typecheck`
2. Ensure all imports use correct paths
3. Check `tsconfig.json` is correct
4. Run `npm install` to ensure dependencies
5. Restart TypeScript server in VSCode

#### Environment Variables Not Loading
**Solution:**
1. Ensure `.env` file is in project root
2. Restart development server
3. Variables must start with `VITE_` for client-side access
4. Don't quote values in `.env` file

#### Module Resolution Errors
**Solution:**
1. Clear node_modules: `rm -rf node_modules`
2. Clear cache: `npm cache clean --force`
3. Reinstall: `npm install`
4. Restart dev server

### 🗄️ Database Issues

#### Tables Not Created
**Solution:**
1. Check SQL execution in Supabase:
   - Go to SQL Editor
   - Run schema.sql again
   - Check for error messages
2. Verify UUID extension enabled:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

#### RLS Policies Blocking All Queries
**Solution:**
1. Temporarily disable RLS for testing:
   ```sql
   ALTER TABLE resumes DISABLE ROW LEVEL SECURITY;
   ```
2. Check JWT token format
3. Re-apply policies from schema.sql
4. Re-enable RLS:
   ```sql
   ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
   ```

#### Foreign Key Violations
**Cause:** Trying to insert with invalid user_id or resume_id

**Solution:**
1. Ensure user exists before creating resume
2. Check cascade deletes are working
3. Verify referential integrity in schema

### 🌐 Network/CORS Issues

#### CORS Errors
**Solution:**
1. Supabase should handle CORS automatically
2. Check project URL is correct
3. Verify API keys are valid
4. Check browser console for specific CORS error

#### Request Timeout
**Solution:**
1. Check internet connection
2. Verify Supabase project is running
3. Check for rate limiting
4. Add timeout handling in code

## 🧪 Testing Tips

### Test Database Connection
```typescript
// Add to any component
import { supabase } from './lib/supabase';

async function testConnection() {
  const { data, error } = await supabase.from('users').select('count');
  console.log('DB Connection:', data, error);
}
```

### Test AI Analysis
```typescript
// Use mock data first
import { getMockAnalysis } from './lib/ai-analyzer';

const mock = getMockAnalysis();
console.log('Mock analysis:', mock);
```

### Test File Upload
```typescript
// Check if storage is accessible
const { data, error } = await supabase
  .storage
  .from('resumes')
  .list();
console.log('Storage buckets:', data, error);
```

### Check User Authentication
```typescript
import { useUser } from '@clerk/clerk-react';

function TestComponent() {
  const { user } = useUser();
  console.log('Current user:', user);
  return null;
}
```

## 📞 Getting More Help

### Supabase Issues
- Dashboard: Check project status and logs
- Docs: https://supabase.com/docs
- Community: https://github.com/supabase/supabase/discussions

### Clerk Issues
- Dashboard: Check application settings
- Docs: https://clerk.com/docs
- Support: https://clerk.com/support

### OpenAI Issues
- Dashboard: Check API usage and limits
- Docs: https://platform.openai.com/docs
- Status: https://status.openai.com

### Google AI Issues
- Console: https://aistudio.google.com
- Docs: https://ai.google.dev/docs

## 🔍 Debug Checklist

When something isn't working:

- [ ] Check browser console for errors
- [ ] Check network tab for failed requests
- [ ] Verify all environment variables are set
- [ ] Ensure Supabase project is active
- [ ] Check database tables exist
- [ ] Verify RLS policies are applied
- [ ] Test authentication is working
- [ ] Check API keys are valid
- [ ] Verify file is valid PDF
- [ ] Clear browser cache
- [ ] Restart development server
- [ ] Check logs in Supabase dashboard

## 💬 Still Stuck?

1. Review [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) again
2. Check [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
3. Review code comments in implementation files
4. Create an issue with:
   - Error message
   - Browser console output
   - Network tab screenshot
   - Steps to reproduce
