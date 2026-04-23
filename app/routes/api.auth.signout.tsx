/**
 * Sign Out API Route
 */
import { deleteSession } from '../lib/auth.server';
import { safeConsole } from '../lib/logging';

function getSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith('session='));
  
  return sessionCookie ? sessionCookie.split('=')[1] : null;
}

export async function action({ request }: { request: Request }) {
  try {
    const sessionToken = getSessionToken(request);
    
    if (sessionToken) {
      await deleteSession(sessionToken);
    }

    // Clear session cookie
    const response = Response.json({ success: true });
    response.headers.set('Set-Cookie', 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');

    return response;
  } catch (error) {
    safeConsole.error('Sign out error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
