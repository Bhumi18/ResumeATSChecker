/**
 * Update Profile API Route
 */
import { getUserBySession, updateUserProfile } from '../lib/auth.server';
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
    
    if (!sessionToken) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await getUserBySession(sessionToken);
    if (!user) {
      return Response.json({ error: 'Invalid session' }, { status: 401 });
    }

    const updates = await request.json();
    
    // Map client field names to database field names
    const dbUpdates: any = {};
    if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
    if (updates.username !== undefined) dbUpdates.username = updates.username;
    if (updates.profileImageUrl !== undefined) dbUpdates.profile_image_url = updates.profileImageUrl;

    const updatedUser = await updateUserProfile(user.id, dbUpdates);

    if (!updatedUser) {
      return Response.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return Response.json({ 
      success: true, 
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        username: updatedUser.username,
        profile_image_url: updatedUser.profile_image_url
      }
    });
  } catch (error) {
    safeConsole.error('Update profile error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
