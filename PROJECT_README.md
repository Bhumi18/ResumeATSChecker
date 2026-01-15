# AI Resume Analyzer - ATS Checker

An intelligent resume analysis tool powered by AI that helps job seekers optimize their resumes for Applicant Tracking Systems (ATS).

## 🚀 Features

- **AI-Powered Analysis**: Uses OpenAI GPT or Google Gemini to analyze resumes
- **ATS Compatibility Check**: Evaluates resume formatting and keyword optimization
- **Comprehensive Scoring**: Analyzes 5 key areas:
  - ATS Compatibility (formatting, keywords, structure)
  - Tone & Style (professional language, action verbs)
  - Content Quality (achievements, quantifiable results)
  - Structure & Organization (sections, layout)
  - Skills Presentation (technical & soft skills)
- **Job-Specific Analysis**: Optional job title and description for targeted feedback
- **Secure Storage**: Encrypted file storage with Supabase
- **User Authentication**: Powered by Clerk
- **Subscription Management**: Track analysis limits and plan usage

## 📋 Prerequisites

- Node.js 18+ and npm
- A Supabase account ([supabase.com](https://supabase.com))
- A Clerk account ([clerk.com](https://clerk.com))
- OpenAI API key OR Google AI API key

## 🛠️ Installation

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd ai-resume-analyzer
npm install
```

### 2. Set Up Supabase

Follow the detailed instructions in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md):

1. Create a new Supabase project
2. Run the database migration from `database/schema.sql`
3. Create a storage bucket named `resumes`
4. Configure storage policies
5. Get your project URL and anon key

### 3. Set Up Clerk Authentication

1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Get your publishable key
3. Configure JWT template for Supabase (see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md))

### 4. Get AI API Key

Choose one of the following:

**Option A: OpenAI (Recommended)**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Add credits to your account

**Option B: Google AI (Gemini)**
1. Go to [ai.google.dev](https://ai.google.dev)
2. Get an API key for Gemini

### 5. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Clerk
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-key

# AI Provider (choose one)
VITE_OPENAI_API_KEY=your-openai-key
# OR
VITE_GOOGLE_AI_API_KEY=your-gemini-key
```

## 🚀 Running the Application

### Development Mode

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

### Production Build

```bash
npm run build
npm start
```

## 📁 Project Structure

```
ai-resume-analyzer/
├── app/
│   ├── components/          # React components
│   ├── lib/
│   │   ├── supabase.ts     # Supabase client
│   │   ├── storage.ts      # File upload utilities
│   │   ├── ai-analyzer.ts  # AI analysis service
│   │   └── database/       # Database operations
│   │       ├── users.ts
│   │       ├── resumes.ts
│   │       └── subscriptions.ts
│   └── routes/             # React Router pages
├── database/
│   └── schema.sql          # Database schema
├── types/
│   ├── index.d.ts          # Type definitions
│   └── database.ts         # Supabase types
└── constants/              # App constants
```

## 🔑 Key Features Implementation

### Resume Upload & Analysis Flow

1. User uploads PDF resume
2. System checks subscription limits
3. File uploaded to Supabase Storage
4. Resume record created in database
5. AI analyzes the resume content
6. Analysis results saved to database
7. User redirected to view results

### Database Schema

The application uses these main tables:
- `users` - User profiles synced with Clerk
- `resumes` - Resume metadata and status
- `resume_analysis` - Detailed AI analysis results
- `resume_keywords` - Extracted keywords
- `user_subscriptions` - Plan limits and usage

See [database/schema.sql](./database/schema.sql) for complete schema.

### AI Analysis

The AI analyzer:
1. Extracts text from PDF using pdf.js
2. Sends to OpenAI GPT-4 or Google Gemini
3. Receives structured analysis with scores and tips
4. Categorizes feedback by type (good/improve/bad)
5. Identifies missing keywords and sections

## 🔒 Security Features

- Row Level Security (RLS) policies in Supabase
- JWT-based authentication with Clerk
- Encrypted file storage
- User data isolation
- Secure API key handling

## 📊 Subscription Plans

Current implementation supports:
- **Free**: 5 resume analyses
- **Basic**: Custom limit (upgradeable)
- **Premium**: Custom limit (upgradeable)
- **Enterprise**: Custom limit (upgradeable)

## 🎨 Customization

### Adjust AI Prompts

Edit [app/lib/ai-analyzer.ts](./app/lib/ai-analyzer.ts) to customize:
- Analysis criteria
- Scoring weights
- Feedback categories
- Prompt instructions

### Modify Database Schema

1. Update [database/schema.sql](./database/schema.sql)
2. Run migration in Supabase SQL Editor
3. Regenerate types in [types/database.ts](./types/database.ts)

### Change Subscription Limits

Update in [app/lib/database/users.ts](./app/lib/database/users.ts):

```typescript
await supabase.from('user_subscriptions').insert({
  user_id: createdUser.id,
  plan_type: 'free',
  resumes_limit: 10, // Change this
  is_active: true,
});
```

## 🐛 Troubleshooting

### AI Analysis Fails

The system automatically falls back to mock data if AI fails. To debug:
1. Check API key is correct in `.env`
2. Verify API has credits/quota
3. Check browser console for errors
4. Review AI provider status pages

### Database Connection Issues

1. Verify Supabase URL and key
2. Check RLS policies are configured
3. Ensure Clerk JWT template is set up
4. Test connection in Supabase dashboard

### File Upload Fails

1. Verify storage bucket exists
2. Check storage policies are configured
3. Ensure file size is under limit
4. Review browser network tab for errors

## 📈 Future Enhancements

- [ ] Resume comparison feature
- [ ] Export analysis as PDF report
- [ ] Integration with job boards
- [ ] Resume templates library
- [ ] Batch analysis for multiple resumes
- [ ] Advanced analytics dashboard
- [ ] Email notifications for analysis completion
- [ ] Resume version history

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 📞 Support

For issues or questions:
- Create an issue on GitHub
- Check [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for setup help
- Review troubleshooting section above

## 🙏 Acknowledgments

- React Router for routing
- Supabase for backend infrastructure
- Clerk for authentication
- OpenAI/Google for AI capabilities
- pdf.js for PDF parsing
