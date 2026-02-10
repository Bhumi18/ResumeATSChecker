// Simple test endpoint to check database connection
export async function loader() {
  try {
    const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
    
    if (!dbUrl) {
      return Response.json({ 
        error: 'DATABASE_URL not set',
      }, { status: 500 });
    }

    // Try to import neon
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(dbUrl);
    
    // Test simple query
    const result = await sql`SELECT NOW() as current_time`;
    
    return Response.json({ 
      success: true,
      message: 'Database connected',
      time: result[0].current_time,
    });
  } catch (error) {
    return Response.json({ 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
