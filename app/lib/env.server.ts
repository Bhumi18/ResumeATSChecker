// Server-only environment bootstrap.
// Loads variables from a local `.env` file into `process.env` during development.
//
// IMPORTANT:
// - Do NOT expose secrets to the browser. Avoid `VITE_*` env vars for server secrets.
// - Production should inject env vars via the runtime/platform.

import 'dotenv/config';

if (!process.env.GOOGLE_AI_STUDIO_API_KEY) {
  // Keep this as a warning (not an error) so non-AI pages can still load.
  console.warn(
    '[env] GOOGLE_AI_STUDIO_API_KEY is not set. AI analysis endpoints will fail until it is configured.'
  );
}
