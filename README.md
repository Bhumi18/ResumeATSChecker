# Resume Analyzer

Resume Analyzer helps you quickly evaluate a resume and get short, actionable feedback. It’s intended for recruiters, hiring managers, and candidates who want a fast, repeatable check of formatting, structure, and key content.

Why this project

- Save time reviewing CVs by surfacing obvious improvements (formatting, missing sections, clarity of role descriptions).
- Provide a simple numeric score plus a few short suggestions the candidate can act on.

How it works

- Upload a PDF resume through the web interface.
- The app extracts text, runs the analyzer (combining heuristic checks and model-driven scoring), and returns a score with bullet suggestions.
- Results can be viewed in the UI and (optionally) persisted in the configured Neon database backend.

Key features

- PDF upload and text extraction
- Readability, structure and keyword checks
- Short, prioritized suggestions for improvement
- Simple, extensible analyzer logic in `app/lib/`

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

Important files

- `app/` — source (routes, components, helpers)
- `app/lib/ai-analyzer.ts` — analyzer logic and scoring rules
- `app/routes/` — upload and result pages

Configuration & notes

- See `QUICKSTART.md` and `NEON_SETUP.md` for environment variables and external services like Neon database.
- Uploaded files are processed server-side and stored locally in `public/uploads/`; review the configuration in `app/lib/storage.ts` if you need to change to cloud storage.

Want more?

If you’d like, I can add example environment variables, a sample `.env` file, or deployment instructions for a target platform (Vercel, Netlify, Docker). Tell me which and I’ll expand the README.
