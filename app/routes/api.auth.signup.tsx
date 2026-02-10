/**
 * Sign Up API Route
 */
import { createUser, createSession, isEmailTaken } from '../lib/auth.server';

export async function action({ request }: { request: Request }) {
  try {
    const { email, password, firstName, lastName } = await request.json();

    // Validation
    if (!email || !password) {
      return Response.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Check if email is already taken
    const emailExists = await isEmailTaken(email);
    if (emailExists) {
      return Response.json({ error: 'Email is already registered' }, { status: 409 });
    }

    // Create user
    const user = await createUser(email, password, firstName, lastName);
    if (!user) {
      return Response.json({ error: 'Failed to create account' }, { status: 500 });
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
    console.error('Sign up error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
