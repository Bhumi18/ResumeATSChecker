import type { Route } from "./+types/api.migrate-password-reset";
import { execute } from "../lib/neon.server";

export async function loader({ request }: Route.LoaderArgs) {
  try {
    // Create password_reset_tokens table
    await execute(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          token TEXT UNIQUE NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          used_at TIMESTAMPTZ,
          ip_address TEXT
      )
    `);

    // Create indexes
    await execute(`CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token)`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id)`);
    await execute(`CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at)`);

    return Response.json({ 
      success: true, 
      message: "Password reset table created successfully" 
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
