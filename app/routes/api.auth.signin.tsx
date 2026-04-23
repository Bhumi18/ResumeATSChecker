/**
 * Sign In API Route
 */
import { authenticateUser, createSession } from '../lib/auth.server';
import { safeConsole } from '../lib/logging';

export async function action({ request }: { request: Request }) {
  try {
    const { email, password } = await request.json();

    // Validation
    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Authenticate user
    const user = await authenticateUser(email, password);
    if (!user) {
      return Response.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Create session
    const userAgent = request.headers.get('user-agent') || undefined;
    const sessionToken = await createSession(user.id, userAgent);
    
    if (!sessionToken) {
      return Response.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // Set session cookie
    const response = Response.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        profile_image_url: user.profile_image_url
      }
    });

    response.headers.set('Set-Cookie', `session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`);

    return response;
  } catch (error) {
    safeConsole.error('Sign in error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
