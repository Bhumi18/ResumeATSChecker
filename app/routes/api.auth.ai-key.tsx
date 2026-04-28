import { clearUserAiApiKey, getUserBySession, setUserAiApiKey } from '../lib/auth.server';
import { safeConsole } from '../lib/logging';

function getSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
  const sessionCookie = cookies.find((cookie) => cookie.startsWith('session='));
  return sessionCookie ? sessionCookie.split('=')[1] : null;
}

export async function action({ request }: { request: Request }) {
  try {
    const sessionToken = getSessionToken(request);
    if (!sessionToken) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await getUserBySession(sessionToken);
    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (request.method === 'DELETE') {
      const cleared = await clearUserAiApiKey(user.id);
      if (!cleared) {
        return Response.json({ error: 'Failed to remove API key' }, { status: 500 });
      }

      return Response.json({ success: true, has_api_key: false });
    }

    const body = await request.json();
    const apiKey = typeof body?.apiKey === 'string' ? body.apiKey.trim() : '';

    if (!apiKey || apiKey.length < 10) {
      return Response.json({ error: 'API key is required' }, { status: 400 });
    }

    const saved = await setUserAiApiKey(user.id, apiKey);
    if (!saved) {
      return Response.json({ error: 'Failed to save API key' }, { status: 500 });
    }

    return Response.json({
      success: true,
      has_api_key: true,
      ai_api_key_last4: saved.last4,
    });
  } catch (error) {
    safeConsole.error('User API key error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
