import type { Route } from "./+types/api.auth.google";

export async function loader({ request }: Route.LoaderArgs) {
  // Get environment variables
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${new URL(request.url).origin}/api/auth/google/callback`;

  if (!clientId) {
    return Response.json({ error: "Google OAuth not configured" }, { status: 500 });
  }

  // Generate random state for CSRF protection
  const state = crypto.randomUUID();
  
  // Build Google OAuth URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: state,
    access_type: 'offline',
    prompt: 'consent'
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  // Store state in cookie for verification in callback
  const headers = new Headers();
  headers.set('Set-Cookie', `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`);
  headers.set('Location', authUrl);

  return new Response(null, {
    status: 302,
    headers
  });
}
