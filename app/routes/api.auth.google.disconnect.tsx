import { getUserBySession, unlinkOAuthAccount } from '../lib/auth.server';

function getSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith('session='));
  
  return sessionCookie ? sessionCookie.split('=')[1] : null;
}

export async function action({ request }: { request: Request }) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const sessionToken = getSessionToken(request);
    if (!sessionToken) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await getUserBySession(sessionToken);
    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check that the user has a password set before allowing disconnect
    // (so they don't lock themselves out)
    if (!user.password_hash) {
      return Response.json(
        { error: 'You must set a password before disconnecting Google. Otherwise you will not be able to sign in.' },
        { status: 400 }
      );
    }

    const success = await unlinkOAuthAccount(user.id, 'google');

    if (!success) {
      return Response.json({ error: 'Failed to disconnect Google account' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Disconnect Google error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
