/**
 * Database Migration Route - Run Auth Schema
 */
import { execute } from '../lib/neon.server';

export async function loader() {
  try {
    // Step 1: Add columns to users table
    await execute(`
      ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS password_hash TEXT,
        ADD COLUMN IF NOT EXISTS username TEXT,
        ALTER COLUMN clerk_user_id DROP NOT NULL;
    `);

    // Step 2: Create sessions table
    await execute(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        session_token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
        user_agent TEXT,
        ip_address TEXT
      );
    `);

    // Step 3: Create indexes
    await execute(`
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);

    // Step 4: Add unique constraint on email
    await execute(`
      ALTER TABLE users 
        DROP CONSTRAINT IF EXISTS users_email_unique;
    `);
    
    await execute(`
      ALTER TABLE users 
        ADD CONSTRAINT users_email_unique UNIQUE (email);
    `);

    // Step 5: Add unique constraint on username (allow nulls)
    await execute(`
      ALTER TABLE users 
        DROP CONSTRAINT IF EXISTS users_username_unique;
    `);
    
    await execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users(username) WHERE username IS NOT NULL;
    `);

    return Response.json({
      success: true,
      message: 'Authentication schema migration completed successfully!',
      changes: [
        'Added password_hash and username columns to users table',
        'Made clerk_user_id nullable',
        'Created user_sessions table',
        'Created indexes for performance',
        'Added unique constraints on email and username'
      ]
    });
  } catch (error) {
    console.error('Migration error:', error);
    return Response.json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
