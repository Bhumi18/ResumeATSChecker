import { getOrCreateUser, getUserResumes, getResumeWithAnalysis, deleteResumeForUser } from "../lib/database/index.server";
import { safeConsole } from "../lib/logging";

export async function loader({ request }: { request: Request }) {
  try {
    // Get user ID from query params
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return Response.json({ error: 'Missing user ID' }, { status: 400 });
    }

    // Get user resumes
    const userResumes = await getUserResumes(userId);

    // Get analysis for each resume
    const resumesWithAnalysis = await Promise.all(
      userResumes.map(async (resume) => {
        const { analysis } = await getResumeWithAnalysis(resume.id);
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
    const body = await request.json();
    const resumeId = body?.resumeId;
    const userId = body?.userId;

    if (!resumeId || !userId) {
      return Response.json({ error: 'Missing resume ID or user ID' }, { status: 400 });
    }

    const deleted = await deleteResumeForUser(resumeId, userId);

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
