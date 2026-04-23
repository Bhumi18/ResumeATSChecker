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
Uses advanced AI to analyze your resume like a professional recruiter would, providing detailed feedback across 5 critical dimensions.

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

# Google AI Studio (Gemini) - server-side only
# IMPORTANT: do NOT use `VITE_*` for secrets, as those can be exposed to the browser.
GOOGLE_AI_STUDIO_API_KEY=your-gemini-key
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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Ready to land your dream job?**

⭐ **Star this repo** if ATSEngine helped you!

Made with ❤️ for job seekers everywhere

</div>
