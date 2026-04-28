/**
 * Get Current User API Route
 */
import { getUserBySession, getUserOAuthProviders } from '../lib/auth.server';
import { safeConsole } from '../lib/logging';

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

    const hasApiKey = Boolean(
      user.ai_api_key_encrypted && user.ai_api_key_iv && user.ai_api_key_tag
    );

    return Response.json({ 
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        profile_image_url: user.profile_image_url,
        oauth_providers: oauthProviders,
        has_ai_api_key: hasApiKey,
        ai_api_key_last4: user.ai_api_key_last4 || null,
      }
    });
  } catch (error) {
    safeConsole.error('Get user error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
