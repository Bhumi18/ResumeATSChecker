import "../lib/env.server";
import { safeConsole } from "../lib/logging";
import { createResume, saveResumeAnalysis, updateResumeStatus } from "../lib/database/index.server";
import { uploadResumeFile } from "../lib/storage.server";
import { analyzeResume } from "../lib/ai-analyzer";
import { getUserAiApiKey, getUserBySession } from "../lib/auth.server";

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

    const formData = await request.formData();
    
    // Extract data from form
    const companyName = formData.get('companyName') as string | null;
    const jobTitle = formData.get('jobTitle') as string | null;
    const jobDescription = formData.get('jobDescription') as string | null;
    const file = formData.get('file') as File;

    if (!file) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const userId = user.id;

    // Step 1: Upload file
    const uploadResult = await uploadResumeFile(userId, file);
    
    if (!uploadResult) {
      return Response.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Step 3: Create resume record
    const resume = await createResume(userId, {
      company_name: companyName,
      job_title: jobTitle,
      job_description: jobDescription,
      resume_file_url: uploadResult.url,
      resume_file_name: file.name,
      status: 'analyzing',
      resume_thumbnail_url: null,
    });

    if (!resume) {
      return Response.json({ error: 'Failed to create resume record' }, { status: 500 });
    }

    const apiKey = await getUserAiApiKey(userId);
    if (!apiKey) {
      return Response.json(
        {
          error: 'API key required',
          details: 'Add your Google AI Studio API key in Account Settings to run analysis.',
        },
        { status: 400 }
      );
    }

    // Step 4: Analyze resume (AI-only: Gemini Flash -> Gemini Pro fallback)
    let analysisResult;
    try {
      analysisResult = await analyzeResume(
        file,
        jobTitle || undefined,
        jobDescription || undefined,
        false,
        { apiKey }
      );
    } catch (aiError: any) {
      safeConsole.error('❌ Upload AI analysis failed:', aiError);
      try {
        await updateResumeStatus(resume.id, userId, 'failed', undefined);
      } catch (statusError) {
        safeConsole.error('❌ Failed to mark resume as failed:', statusError);
      }

      return Response.json(
        {
          error: 'AI analysis failed',
          details: aiError instanceof Error ? aiError.message : String(aiError || 'Unknown error'),
        },
        { status: 503 }
      );
    }

    safeConsole.log('📊 Upload analysis source:', {
      resumeId: resume.id,
      fileName: file.name,
      modelUsed: analysisResult.modelUsed,
    });

    // Step 5: Save analysis
    await saveResumeAnalysis(resume.id, userId, {
      atsScore: analysisResult.atsScore,
      atsTips: analysisResult.atsTips,
      toneStyleScore: analysisResult.toneStyleScore,
      toneStyleTips: analysisResult.toneStyleTips,
      contentScore: analysisResult.contentScore,
      contentTips: analysisResult.contentTips,
      structureScore: analysisResult.structureScore,
      structureTips: analysisResult.structureTips,
      skillsScore: analysisResult.skillsScore,
      skillsTips: analysisResult.skillsTips,
      keywordsFound: analysisResult.keywordsFound,
      keywordsMissing: analysisResult.keywordsMissing,
      sectionsFound: analysisResult.sectionsFound,
      sectionsMissing: analysisResult.sectionsMissing,
      aiModelUsed: analysisResult.modelUsed || 'gemini-flash',
    });

    return Response.json({ 
      success: true, 
      resumeId: resume.id 
    });
  } catch (error) {
    safeConsole.error('Error in upload API:', error);
    return Response.json({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
