# Resume Analyzer

Resume Analyzer helps you quickly evaluate a resume and get short, actionable feedback. It’s intended for recruiters, hiring managers, and candidates who want a fast, repeatable check of formatting, structure, and key content.

Why this project

- Save time reviewing CVs by surfacing obvious improvements (formatting, missing sections, clarity of role descriptions).
- Provide a simple numeric score plus a few short suggestions the candidate can act on.

How it works

- Upload a PDF resume through the web interface.
- The app extracts text, runs the analyzer (combining heuristic checks and model-driven scoring), and returns a score with bullet suggestions.
- Results can be viewed in the UI and (optionally) persisted in the configured Supabase backend.

Quick start

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

Build and preview:

```bash
npm run build
npm run preview
```
