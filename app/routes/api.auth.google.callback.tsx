import type { Route } from "./+types/api.auth.google.callback";
import { findOrCreateOAuthUser, createSession } from "../lib/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    return Response.redirect(`${url.origin}/sign-in?error=oauth_${error}`);
  }

  if (!code || !state) {
    return Response.redirect(`${url.origin}/sign-in?error=invalid_oauth_response`);
  }

  // Verify state (CSRF protection)
  const cookies = request.headers.get('Cookie') || '';
  const stateCookie = cookies.split(';').find(c => c.trim().startsWith('oauth_state='));
  const storedState = stateCookie?.split('=')[1];

  if (!storedState || storedState !== state) {
    return Response.redirect(`${url.origin}/sign-in?error=invalid_state`);
  }

  try {
    // Exchange code for tokens
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${url.origin}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth not configured');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();

    // Get user profile from Google
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const profile = await profileResponse.json();

    // Find or create user in database
    const user = await findOrCreateOAuthUser('google', profile, tokens);

    if (!user) {
      return Response.redirect(`${url.origin}/sign-in?error=auth_failed`);
    }

    // Create session
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     undefined;

    const sessionToken = await createSession(user.id, userAgent, ipAddress);

    if (!sessionToken) {
      return Response.redirect(`${url.origin}/sign-in?error=session_failed`);
    }

    // Set session cookie and redirect to dashboard
    const headers = new Headers();
    headers.set('Set-Cookie', `session=${sessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 60 * 60}`);
    headers.set('Location', url.origin + '/dashboard');

    return new Response(null, {
      status: 302,
      headers
    });

  } catch (error) {
    safeConsole.error('Google OAuth callback error:', error);
    return Response.redirect(`${url.origin}/sign-in?error=oauth_failed`);
  }
}
