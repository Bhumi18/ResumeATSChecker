// Server-only environment bootstrap.
// Loads variables from a local `.env` file into `process.env` during development.
//
// IMPORTANT:
// - Do NOT expose secrets to the browser. Avoid `VITE_*` env vars for server secrets.
// - Production should inject env vars via the runtime/platform.

import 'dotenv/config';

if (!process.env.USER_AI_API_KEY_ENCRYPTION_KEY) {
  // Keep this as a warning (not an error) so non-AI pages can still load.
  console.warn(
    '[env] USER_AI_API_KEY_ENCRYPTION_KEY is not set. User API keys cannot be stored securely.'
  );
}
