import { getUserResumes, getResumeWithAnalysis, deleteResumeForUser } from "../lib/database/index.server";
import { getUserBySession } from "../lib/auth.server";
import { safeConsole } from "../lib/logging";

function getSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
  const sessionCookie = cookies.find((cookie) => cookie.startsWith('session='));
  return sessionCookie ? sessionCookie.split('=')[1] : null;
}

export async function loader({ request }: { request: Request }) {
  try {
    const sessionToken = getSessionToken(request);
    if (!sessionToken) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await getUserBySession(sessionToken);
    if (!user) {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = user.id;

    // Get user resumes
    const userResumes = await getUserResumes(userId);

    // Get analysis for each resume
    const resumesWithAnalysis = await Promise.all(
      userResumes.map(async (resume) => {
        const { analysis } = await getResumeWithAnalysis(resume.id, userId);
        return { resume, analysis };
      })
    );

    return Response.json({ resumes: resumesWithAnalysis });
  } catch (error) {
    safeConsole.error('Error in resumes API:', error);
    return Response.json({ 
      error: 'Failed to load resumes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function action({ request }: { request: Request }) {
  if (request.method !== 'DELETE') {
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

    const body = await request.json();
    const resumeId = body?.resumeId;

    if (!resumeId) {
      return Response.json({ error: 'Missing resume ID' }, { status: 400 });
    }

    const deleted = await deleteResumeForUser(resumeId, user.id);

    if (!deleted) {
      return Response.json({ error: 'Resume not found or not authorized' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    safeConsole.error('Error deleting resume:', error);
    return Response.json(
      {
        error: 'Failed to delete resume',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
