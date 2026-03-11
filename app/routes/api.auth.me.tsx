/**
 * Get Current User API Route
 */
import { getUserBySession, getUserOAuthProviders } from '../lib/auth.server';

function getSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith('session='));
  
  return sessionCookie ? sessionCookie.split('=')[1] : null;
}

export async function loader({ request }: { request: Request }) {
  try {
    const sessionToken = getSessionToken(request);
    
    if (!sessionToken) {
      return Response.json({ user: null });
    }

    const user = await getUserBySession(sessionToken);
    
    if (!user) {
      return Response.json({ user: null });
    }

    const oauthProviders = await getUserOAuthProviders(user.id);

    return Response.json({ 
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        profile_image_url: user.profile_image_url,
        oauth_providers: oauthProviders
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
