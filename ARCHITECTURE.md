# 🏗️ Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Home      │  │   Upload     │  │  Sign In/Up  │      │
│  │   /home      │  │   /upload    │  │   /sign-in   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                 ┌───────────┴───────────┐
                 │                       │
         ┌───────▼────────┐     ┌───────▼────────┐
         │  Clerk Auth    │     │   Supabase     │
         │  (JWT Tokens)  │     │   (Backend)    │
         └────────────────┘     └────────────────┘
                                         │
                      ┌──────────────────┼──────────────────┐
                      │                  │                  │
              ┌───────▼───────┐  ┌──────▼──────┐  ┌───────▼───────┐
              │   Database    │  │   Storage   │  │   Row Level   │
              │  (PostgreSQL) │  │  (S3-like)  │  │   Security    │
              └───────────────┘  └─────────────┘  └───────────────┘
                                         │
                                         │
                                ┌────────▼────────┐
                                │   AI Provider   │
                                │  OpenAI/Gemini  │
                                └─────────────────┘
```

## Data Flow

### Resume Upload & Analysis Flow

```
User Uploads PDF
       │
       ▼
┌──────────────────┐
│ 1. Authenticate  │──────► Check Clerk JWT Token
└──────────────────┘
       │
       ▼
┌──────────────────┐
│ 2. Check Limits  │──────► Query user_subscriptions table
└──────────────────┘
       │
       ▼
┌──────────────────┐
│ 3. Upload File   │──────► Supabase Storage (resumes bucket)
└──────────────────┘              │
       │                           ▼
       │                    Returns file URL
       ▼
┌──────────────────┐
│ 4. Create Record │──────► Insert into resumes table
└──────────────────┘              Status: 'analyzing'
       │
       ▼
┌──────────────────┐
│ 5. Extract Text  │──────► pdf.js parses PDF
└──────────────────┘
       │
       ▼
┌──────────────────┐
│ 6. AI Analysis   │──────► Send to OpenAI/Gemini API
└──────────────────┘              │
       │                           ▼
       │                    Returns structured analysis
       ▼
┌──────────────────┐
│ 7. Save Results  │──────► Insert into resume_analysis table
└──────────────────┘              Update resume status: 'completed'
       │
       ▼
┌──────────────────┐
│ 8. Update Count  │──────► Increment resumes_analyzed_count
└──────────────────┘
       │
       ▼
   Navigate to Home
```

## Database Schema Relationships

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id (PK)         │◄─────────┐
│ clerk_user_id   │          │
│ email           │          │
│ first_name      │          │
│ last_name       │          │
└─────────────────┘          │
                             │
                             │ user_id (FK)
                             │
┌─────────────────┐          │
│    resumes      │◄─────────┘
│─────────────────│
│ id (PK)         │◄─────────┐
│ user_id (FK)    │          │
│ file_url        │          │
│ status          │          │
│ overall_score   │          │
└─────────────────┘          │
                             │ resume_id (FK)
                             │
┌──────────────────┐         │
│ resume_analysis  │◄────────┤
│──────────────────│         │
│ id (PK)          │         │
│ resume_id (FK)   │         │
│ ats_score        │         │
│ ats_tips         │         │
│ content_score    │         │
│ ...              │         │
└──────────────────┘         │
                             │
┌──────────────────┐         │
│ resume_keywords  │◄────────┘
│──────────────────│
│ id (PK)          │
│ resume_id (FK)   │
│ keyword          │
│ category         │
└──────────────────┘

┌──────────────────────┐
│ user_subscriptions   │
│──────────────────────│
│ id (PK)              │
│ user_id (FK) ────────┼──► users.id
│ plan_type            │
│ resumes_limit        │
│ resumes_analyzed_count │
└──────────────────────┘
```

## File Structure

```
ai-resume-analyzer/
│
├── app/
│   ├── components/              # React Components
│   │   ├── Navbar.tsx
│   │   ├── FileUploader.tsx
│   │   ├── ResumeCard.tsx
│   │   └── ProtectedRoute.tsx
│   │
│   ├── lib/                     # Core Business Logic
│   │   ├── supabase.ts         # Supabase Client
│   │   ├── storage.ts          # File Upload/Download
│   │   ├── ai-analyzer.ts      # AI Integration
│   │   ├── api.ts              # API Helpers
│   │   └── database/           # Database Operations
│   │       ├── users.ts        # User CRUD
│   │       ├── resumes.ts      # Resume CRUD
│   │       ├── subscriptions.ts # Subscription Logic
│   │       └── index.ts        # Exports
│   │
│   └── routes/                 # Page Routes
│       ├── home.tsx            # Dashboard
│       ├── upload.tsx          # Upload Page
│       ├── sign-in.tsx         # Auth Pages
│       └── sign-up.tsx
│
├── database/
│   └── schema.sql              # Database Schema
│
├── types/
│   ├── index.d.ts              # Global Types
│   └── database.ts             # Supabase Types
│
└── public/                     # Static Assets
```

## Component Hierarchy

```
App
│
├── ProtectedRoute
│   │
│   ├── Home
│   │   ├── Navbar
│   │   │   └── ProfileMenu
│   │   └── ResumeCard (multiple)
│   │       └── ScoreCircle
│   │
│   └── Upload
│       ├── Navbar
│       │   └── ProfileMenu
│       └── FileUploader
│
├── SignIn
│   └── Clerk Components
│
└── SignUp
    └── Clerk Components
```

## State Management Flow

```
┌─────────────────────────────┐
│       Clerk (Auth)          │
│  - User session             │
│  - JWT tokens               │
└─────────────────────────────┘
            │
            ▼
┌─────────────────────────────┐
│    Component State          │
│  - selectedFile             │
│  - loading                  │
│  - error                    │
│  - success                  │
└─────────────────────────────┘
            │
            ▼
┌─────────────────────────────┐
│    Supabase Client          │
│  - Database queries         │
│  - Storage operations       │
│  - RLS enforcement          │
└─────────────────────────────┘
```

## Security Layers

```
┌───────────────────────────────────────┐
│         1. Clerk Authentication       │
│    - JWT token validation             │
│    - User session management          │
└───────────────────────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────┐
│      2. Supabase RLS Policies         │
│    - Row-level access control         │
│    - User can only see own data       │
└───────────────────────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────┐
│       3. Storage Bucket Policies      │
│    - Private file access              │
│    - User-specific folders            │
└───────────────────────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────┐
│      4. API Key Security              │
│    - Server-side env variables        │
│    - No client exposure               │
└───────────────────────────────────────┘
```

## API Integration Points

```
Frontend                  Supabase                  External APIs
   │                         │                           │
   │──── Upload File ────────►│                          │
   │                         │                           │
   │◄─── File URL ───────────│                           │
   │                         │                           │
   │──── Save Metadata ──────►│                          │
   │                         │                           │
   │──── Extract PDF Text ───┼──────────────────────────►│
   │                         │                           │
   │◄─── Analysis ───────────┼───────────────────────────│
   │                         │                           │
   │──── Save Analysis ──────►│                          │
   │                         │                           │
   │──── Fetch Resumes ──────►│                          │
   │                         │                           │
   │◄─── Resume List ────────│                           │
```

## Scoring Algorithm

```
Overall Score Calculation:

overallScore = (
    atsScore +
    toneStyleScore +
    contentScore +
    structureScore +
    skillsScore
) / 5

Each category scored 0-100:
├── ATS Score (0-100)
│   ├── Keyword matching
│   ├── Format compatibility
│   └── Section detection
│
├── Tone & Style (0-100)
│   ├── Professional language
│   ├── Action verb usage
│   └── Writing clarity
│
├── Content (0-100)
│   ├── Quantifiable results
│   ├── Achievement focus
│   └── Relevance to job
│
├── Structure (0-100)
│   ├── Section organization
│   ├── Visual hierarchy
│   └── Readability
│
└── Skills (0-100)
    ├── Technical skills
    ├── Soft skills
    └── Keyword coverage
```

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│          Production Setup               │
│                                         │
│  ┌────────────────────────────────┐    │
│  │   Vercel / Netlify / Hosting   │    │
│  │   - Static files               │    │
│  │   - React app                  │    │
│  └────────────────────────────────┘    │
│             │                           │
│             ▼                           │
│  ┌────────────────────────────────┐    │
│  │      Supabase Cloud            │    │
│  │   - PostgreSQL database        │    │
│  │   - Storage buckets            │    │
│  │   - Edge functions (optional)  │    │
│  └────────────────────────────────┘    │
│             │                           │
│             ▼                           │
│  ┌────────────────────────────────┐    │
│  │      Clerk Authentication      │    │
│  │   - User management            │    │
│  │   - JWT tokens                 │    │
│  └────────────────────────────────┘    │
│             │                           │
│             ▼                           │
│  ┌────────────────────────────────┐    │
│  │    OpenAI / Google AI API      │    │
│  │   - Resume analysis            │    │
│  │   - Natural language processing│    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

This architecture provides:
- ✅ Scalability (serverless)
- ✅ Security (RLS, JWT, private storage)
- ✅ Performance (CDN, edge functions)
- ✅ Reliability (managed services)
- ✅ Cost-effective (pay-per-use)
