import { getResumeWithAnalysis } from "../lib/database/index.server";

export async function loader({ request }: { request: Request }) {
  try {
    const url = new URL(request.url);
    const resumeId = url.searchParams.get('id');

    if (!resumeId) {
      return Response.json({ error: 'Missing resume ID' }, { status: 400 });
    }

    const data = await getResumeWithAnalysis(resumeId);

    if (!data.resume) {
      return Response.json({ error: 'Resume not found' }, { status: 404 });
    }

    // For local storage, the URL is already a public path
    const resumeUrl = data.resume.resume_file_url || '';

    return Response.json({
      resume: data.resume,
      analysis: data.analysis,
      resumeUrl,
    });
  } catch (error) {
    console.error('Error in analyze API:', error);
    return Response.json({
      error: 'Failed to load resume',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
