# Quick Start Guide

## Setup Checklist

Follow these steps to get your AI Resume Analyzer up and running:

### ✅ Step 1: Install Dependencies
```bash
npm install
```

### ✅ Step 2: Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for project to be fully provisioned (~2 minutes)
3. Note down your project URL and anon key

### ✅ Step 3: Run Database Migration
1. Open Supabase SQL Editor
2. Copy contents from `database/schema.sql`
3. Paste and execute in SQL Editor
4. Verify all tables were created

### ✅ Step 4: Create Storage Bucket
1. Go to Storage in Supabase dashboard
2. Create new bucket named `resumes`
3. Set to **private**
4. Copy and run storage policies from `SUPABASE_SETUP.md`

### ✅ Step 5: Get Clerk Credentials
1. Sign up at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy your Publishable Key
4. Configure JWT template (see `SUPABASE_SETUP.md`)

### ✅ Step 6: Get AI API Key
Choose one:
- **OpenAI**: Get key from [platform.openai.com](https://platform.openai.com)
- **Google Gemini**: Get key from [ai.google.dev](https://ai.google.dev)

### ✅ Step 7: Configure Environment Variables
Create `.env` file:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-key
VITE_OPENAI_API_KEY=your-openai-key
```

### ✅ Step 8: Start Development Server
```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

## 🎉 You're Ready!

Try uploading your first resume to test the system.

## Need Help?

- Detailed setup: See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)
- Full documentation: See [PROJECT_README.md](./PROJECT_README.md)
- Troubleshooting: Check the troubleshooting section in PROJECT_README.md
