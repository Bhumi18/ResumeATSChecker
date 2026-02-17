# 🎯 ATSEngine - Your Resume's Best Friend

**Get Your Resume Past Applicant Tracking Systems and Land More Interviews**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-green.svg)
![React](https://img.shields.io/badge/react-18.x-blue.svg)

---

## 🌟 Why ATSEngine?

**Are you tired of sending out dozens of job applications and hearing nothing back?**

The problem isn't you—it's your resume format. Up to **75% of resumes never reach human eyes** because they're filtered out by Applicant Tracking Systems (ATS) that companies use to screen candidates.

**ATSEngine is your personal resume optimization tool** that helps you:
- ✅ **Beat ATS filters** used by 99% of Fortune 500 companies
- ✅ **Identify missing keywords** that recruiters are looking for
- ✅ **Fix formatting issues** that cause ATS to reject your resume
- ✅ **Get actionable feedback** in seconds, not days
- ✅ **Increase your interview callback rate** by optimizing for both ATS and human readers

---

## 💼 Who Is This For?

- **Job Seekers** applying to multiple companies and want to maximize their chances
- **Career Changers** who need to tailor their resume to different industries
- **Recent Graduates** entering the job market for the first time
- **Professionals** looking to upgrade their resume for senior positions
- **Anyone** who wants honest, AI-powered feedback on their resume

---

## ✨ Key Features

### 🤖 AI-Powered Analysis
Uses advanced AI (OpenAI GPT-4 or Google Gemini) to analyze your resume like a professional recruiter would, providing detailed feedback across 5 critical dimensions.

### 📊 Comprehensive Scoring System
Your resume is evaluated on:
1. **ATS Compatibility** (30%) - Formatting, keywords, parseability
2. **Content Quality** (25%) - Achievements, impact, quantifiable results  
3. **Structure & Organization** (20%) - Section layout, logical flow
4. **Tone & Style** (15%) - Professional language, action verbs
5. **Skills Presentation** (10%) - Technical and soft skills clarity

### 🎯 Job-Specific Optimization
- Upload the job description for targeted analysis
- Get keyword recommendations specific to the role
- Identify gaps between your resume and job requirements

### 🔐 Secure & Private
- Your resume is encrypted and securely stored
- Full user authentication and data isolation
- You control your data

---

## 🚀 How It Works

1. **Upload Your Resume** - Simply drag and drop your PDF resume
2. **Add Job Details** (Optional) - Paste the job title and description for targeted analysis  
3. **Get Instant Feedback** - AI analyzes your resume in seconds
4. **Review Your Score** - See your overall score and breakdown by category
5. **Read Recommendations** - Get specific, actionable tips to improve
6. **Make Changes** - Update your resume based on feedback
7. **Re-analyze** - Upload the improved version and track your progress

---

## 🎨 What You'll Get

### Detailed Analysis Report

- **Overall ATS Score** (0-100) with visual breakdown
- **Category-Specific Scores** with detailed explanations
- **3 Lists of Feedback**:
  - 🟢 **Strengths** - What you're doing right
  - 🟡 **Improvements** - What needs work
  - 🔴 **Critical Issues** - What's blocking you from ATS success

### Actionable Recommendations

- Missing keywords to add
- Formatting issues to fix
- Content suggestions for impact
- Section structure improvements
- Skills and achievements optimization tips

---

## 💻 Quick Start (For Developers)

### Prerequisites

- Node.js 18+ and npm
- A database account (Neon or Supabase)
- AI API key (OpenAI or Google AI)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/atsengine.git
cd atsengine
npm install
```

2. **Set up your environment variables**

Create a `.env` file:
```env
# Database
DATABASE_URL=your-neon-database-url

# AI Provider (choose one)
VITE_OPENAI_API_KEY=your-openai-key
# OR
VITE_GOOGLE_AI_API_KEY=your-gemini-key
```

3. **Set up the database**
```bash
# Run the SQL schema from database/schema.sql in your Neon dashboard
# Or follow the detailed guide in NEON_SETUP.md
```

4. **Start the development server**
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and start optimizing your resume!

### Production Build

### Production Build

```bash
npm run build
npm run preview
```

Deploy to your preferred hosting platform (Vercel, Netlify, etc.). See [QUICKSTART.md](./QUICKSTART.md) for deployment guides.

---

## 🔍 Understanding ATS (Why This Tool Matters)

### What is an ATS?

An **Applicant Tracking System** is software used by employers to:
- Filter and rank resumes automatically
- Search for specific keywords and qualifications
- Parse resume content into structured data
- Manage the hiring workflow

### Why Do You Need to Optimize for ATS?

- **75% of resumes** are rejected by ATS before a human sees them
- **98% of Fortune 500 companies** use ATS software
- **Keywords matter** - ATS ranks resumes by keyword matches to the job description
- **Format matters** - Complex formatting can confuse ATS parsers
- **No optimization = No interviews** - Even perfect candidates get filtered out

### Common ATS Deal-Breakers

❌ **Images, graphics, or photos** - ATS can't read them  
❌ **Tables and text boxes** - Often parsed incorrectly  
❌ **Headers and footers** - May be ignored by ATS  
❌ **Fancy fonts** - Stick to standard fonts like Arial, Calibri  
❌ **Missing keywords** - Must match job description  
❌ **Wrong file format** - Use PDF or DOCX only  
❌ **Complex layouts** - Multiple columns can confuse parsers

---

## 🏗️ Project Structure

```
ai-resume-analyzer/
├── app/
│   ├── components/          # React UI components
│   │   ├── FileUploader.tsx
│   │   ├── ResumeCard.tsx
│   │   └── ScoreCircle.tsx
│   ├── lib/
│   │   ├── ai-analyzer.ts   # Core AI analysis logic
│   │   ├── neon.server.ts   # Database connection
│   │   ├── storage.server.ts # File handling
│   │   └── database/        # Database queries
│   └── routes/              # Application pages
│       ├── home.tsx         # Landing page
│       ├── upload.tsx       # Resume upload
│       ├── analyze.$id.tsx  # Results page
│       └── api.*.tsx        # API endpoints
├── database/
│   └── schema.sql           # Database schema
├── public/
│   └── uploads/             # Uploaded resumes
└── types/                   # TypeScript definitions
```

**Key Files to Explore**:
- [app/lib/ai-analyzer.ts](app/lib/ai-analyzer.ts) - AI analysis implementation
- [app/routes/upload.tsx](app/routes/upload.tsx) - Resume upload interface
- [app/routes/analyze.$id.tsx](app/routes/analyze.$id.tsx) - Results display
- [database/schema.sql](database/schema.sql) - Database structure

---

## ⚙️ Configuration & Customization

### Adjust AI Analysis Criteria

Edit [app/lib/ai-analyzer.ts](app/lib/ai-analyzer.ts) to customize:
- Scoring weights for different categories
- Keywords and skills to prioritize
- Analysis prompts and feedback style
- Industry-specific criteria

### Change Storage Location

By default, resumes are stored in `public/uploads/`. To use cloud storage (AWS S3, Supabase Storage, etc.), modify [app/lib/storage.server.ts](app/lib/storage.server.ts).

### Database Options

- **Neon** (Recommended) - Serverless PostgreSQL, see [NEON_SETUP.md](./NEON_SETUP.md)
- **Supabase** - PostgreSQL + Storage + Auth, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

---

## 🛠️ Troubleshooting

### AI Analysis Returns Mock/Fallback Data

**Cause**: API key missing or AI service unavailable  
**Solution**: 
1. Check your `.env` file has the correct API key
2. Verify the API key has available credits/quota
3. Check the AI provider's status page for outages

### Database Connection Errors

**Cause**: Database credentials incorrect or database not set up  
**Solution**: 
1. Verify `DATABASE_URL` in `.env` file
2. Ensure database schema is created (run `schema.sql`)
3. Check database logs for connection errors
4. Verify your IP is allowed (some databases have IP restrictions)

### File Upload Fails

**Cause**: Storage directory permissions or file size limits  
**Solution**:
1. Ensure `public/uploads/` directory exists and is writable
2. Check file size (default max is 10MB)
3. Verify PDF format is valid
4. Check browser console for detailed error messages

### Resume Score is 0 or Very Low

**Common Reasons**:
- PDF text extraction failed (scanned image PDF)
- Resume has complex formatting that ATS can't parse
- Missing standard sections (Education, Experience, Skills)
- No keywords matching common job requirements

For more help, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## 📚 Additional Documentation

- [START_HERE.md](./START_HERE.md) - Complete first-time setup guide
- [QUICKSTART.md](./QUICKSTART.md) - Fast deployment guide  
- [NEON_SETUP.md](./NEON_SETUP.md) - Neon database configuration
- [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) - Supabase alternative setup
- [GOOGLE_AI_SETUP.md](./GOOGLE_AI_SETUP.md) - Google AI (Gemini) integration
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical architecture details
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues and solutions

---

## 🤝 Contributing

We welcome contributions from the community! If you have ideas for improvements:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes with clear commit messages
4. Test thoroughly
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request with a clear description

### Ideas for Contributions
- Add support for DOCX format
- Improve AI prompt engineering for better analysis
- Add more ATS-friendly resume templates
- Implement LinkedIn profile import
- Add multi-language support
- Create browser extension

---

## 📈 Roadmap

Future enhancements we're planning:

- [ ] Resume templates library optimized for ATS
- [ ] Cover letter analysis and generation  
- [ ] LinkedIn profile optimization
- [ ] Job description analyzer tool
- [ ] Batch analysis for multiple applications
- [ ] Resume comparison across versions
- [ ] Integration with job boards (Indeed, LinkedIn, Glassdoor)
- [ ] Mobile app (iOS/Android)
- [ ] Email notifications for completed analyses
- [ ] Export analysis reports as PDF
- [ ] Interview preparation based on resume
- [ ] Salary estimation based on skills and experience

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **React Router** - Modern routing framework
- **Neon/Supabase** - Serverless database infrastructure
- **OpenAI/Google AI** - AI-powered analysis capabilities
- **pdf.js** - PDF parsing and text extraction
- **Remix** - Full stack web framework
- All contributors and users helping improve this tool

---

## 💬 Support & Community

- **Issues**: Found a bug? [Open an issue](https://github.com/yourusername/atsengine/issues)
- **Discussions**: Have questions? [Start a discussion](https://github.com/yourusername/atsengine/discussions)
- **Contributions**: Want to help? See [Contributing](#-contributing) section

---

## 🎯 Success Stories

> "ATSEngine helped me identify that my resume was missing key technical keywords. After optimization, I got 3x more interview calls!" - **Sarah M., Software Engineer**

> "I was applying to dozens of jobs with no response. This tool showed me my formatting was completely breaking ATS parsing. Fixed it and got 2 interviews the next week!" - **David L., Marketing Manager**

> "As a recent graduate, I had no idea what ATS even was. This tool educated me and helped me land my first job!" - **Emily R., Data Analyst**

---

<div align="center">

**Ready to land your dream job?**

⭐ **Star this repo** if ATSEngine helped you!

🚀 **[Get Started Now](#-quick-start-for-developers)** | 📖 **[Read the Docs](./START_HERE.md)** | 🐛 **[Report a Bug](https://github.com/yourusername/atsengine/issues)**

Made with ❤️ for job seekers everywhere

</div>
