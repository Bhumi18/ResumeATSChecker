import { getOrCreateUser, getUserResumes, getResumeWithAnalysis } from "../lib/database/index.server";

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
    console.error('Error in resumes API:', error);
    return Response.json({ 
      error: 'Failed to load resumes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
