import type { Route } from "./+types/api.migrate-oauth";
import { execute } from "../lib/neon.server";
import { safeConsole } from "../lib/logging";

export async function loader({ request }: Route.LoaderArgs) {
  try {
    // Create oauth_accounts table
    await execute(`
      CREATE TABLE IF NOT EXISTS oauth_accounts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          provider TEXT NOT NULL,
          provider_account_id TEXT NOT NULL,
          access_token TEXT,
          refresh_token TEXT,
          expires_at TIMESTAMPTZ,
          token_type TEXT,
          scope TEXT,
          id_token TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(provider, provider_account_id)
      )
    `);

    // Create indexes
    await execute(`CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON oauth_accounts(user_id)`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_oauth_accounts_provider ON oauth_accounts(provider, provider_account_id)`);

    return Response.json({ 
      success: true, 
      message: "OAuth tables created successfully" 
    });
  } catch (error: any) {
    safeConsole.error('OAuth migration error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
