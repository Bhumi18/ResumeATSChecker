import "../lib/env.server";
import { getResumeWithAnalysis, saveResumeAnalysis, updateResumeStatus } from "../lib/database/index.server";
import { analyzeResumeText, extractTextFromFile } from "../lib/ai-analyzer";
import { safeConsole } from "../lib/logging";

function guessMimeTypeFromFileName(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (lower.endsWith('.doc')) return 'application/msword';
  if (lower.endsWith('.txt')) return 'text/plain';
  return 'application/octet-stream';
}

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
    safeConsole.error('Error in analyze API:', error);
    return Response.json({
      error: 'Failed to load resume',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST handler for re-analysis
export async function action({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const { resumeId } = body || {};
    let { resumeText, jobDescription, jobTitle } = body || {};

    safeConsole.log('🔄 API action called for re-analysis');
    safeConsole.log('📝 Resume ID:', resumeId);
    safeConsole.log('📄 Text length:', resumeText?.length);

    if (!resumeId) {
      safeConsole.error('❌ Missing resumeId');
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Allow retry from stored resume file when resumeText isn't provided.
    if (!resumeText) {
      const existing = await getResumeWithAnalysis(String(resumeId));
      if (!existing.resume) {
        return Response.json({ error: 'Resume not found' }, { status: 404 });
      }

      const resumeUrl = existing.resume.resume_file_url;
      if (!resumeUrl) {
        return Response.json({ error: 'Resume file URL missing' }, { status: 400 });
      }

      // If the client didn't provide job details, fall back to stored values.
      jobTitle = jobTitle || existing.resume.job_title || '';
      jobDescription = jobDescription || existing.resume.job_description || '';

      const absoluteUrl = new URL(resumeUrl, request.url);
      safeConsole.log('📥 Fetching resume file for retry analysis:', absoluteUrl.toString());

      const fileResponse = await fetch(absoluteUrl);
      if (!fileResponse.ok) {
        const bodyText = await fileResponse.text().catch(() => '');
        throw new Error(
          `Failed to fetch resume file (status ${fileResponse.status}). ${bodyText ? `Details: ${bodyText}` : ''}`.trim()
        );
      }

      const arrayBuffer = await fileResponse.arrayBuffer();
      const fallbackName = absoluteUrl.pathname.split('/').pop() || 'resume';
      const fileName = existing.resume.resume_file_name || fallbackName;
      const mimeType = guessMimeTypeFromFileName(fileName);

      const file = new File([new Uint8Array(arrayBuffer)], fileName, { type: mimeType });
      resumeText = await extractTextFromFile(file);
      safeConsole.log('📄 Extracted text length (retry):', resumeText?.length);
    }

    if (!resumeText) {
      safeConsole.error('❌ Missing resumeText');
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cleanedResumeText = String(resumeText).trim();
    if (cleanedResumeText.length < 100) {
      return Response.json(
        {
          error: 'Resume content is too short after editing. Please include more content before re-analyzing.',
        },
        { status: 400 }
      );
    }

    safeConsole.log('🔄 Starting resume analysis...');

    // Analyze the edited resume text
    let analysis;
    try {
      analysis = await analyzeResumeText(
        cleanedResumeText,
        jobTitle || '',
        jobDescription || '',
        { aiOnly: true }
      );
    } catch (analysisError: any) {
      safeConsole.error('❌ Analysis failed:', analysisError);

      const details =
        analysisError instanceof Error
          ? analysisError.message
          : String(analysisError || 'Unknown error');

      const lowerDetails = details.toLowerCase();
      const hint = lowerDetails.includes('api key')
        ? 'Missing or invalid Google AI Studio API key. Set GOOGLE_AI_STUDIO_API_KEY (server) and restart the server.'
        : lowerDetails.includes('quota') || lowerDetails.includes('rate')
          ? 'Google AI quota/rate limit may be exceeded. Try again later or use a different key.'
          : undefined;

      return Response.json(
        {
          error: 'AI analysis failed',
          details,
          hint,
        },
        { status: 503 }
      );
    }

    safeConsole.log('📊 Analysis results:', {
      modelUsed: analysis.modelUsed || 'unknown',
      atsScore: analysis.atsScore,
      toneStyleScore: analysis.toneStyleScore,
      contentScore: analysis.contentScore,
      structureScore: analysis.structureScore,
      skillsScore: analysis.skillsScore,
    });

    // Calculate overall score
    const overallScore = Math.round(
      (analysis.atsScore +
        analysis.toneStyleScore +
        analysis.contentScore +
        analysis.structureScore +
        analysis.skillsScore) / 5
    );
    
    safeConsole.log('🎯 Overall Score:', overallScore);

    // Save the new analysis to database
    safeConsole.log('💾 Saving analysis to database...');
    try {
      const saved = await saveResumeAnalysis(resumeId, {
        atsScore: analysis.atsScore,
        atsTips: analysis.atsTips,
        toneStyleScore: analysis.toneStyleScore,
        toneStyleTips: analysis.toneStyleTips,
        contentScore: analysis.contentScore,
        contentTips: analysis.contentTips,
        structureScore: analysis.structureScore,
        structureTips: analysis.structureTips,
        skillsScore: analysis.skillsScore,
        skillsTips: analysis.skillsTips,
        keywordsFound: analysis.keywordsFound,
        keywordsMissing: analysis.keywordsMissing,
        sectionsFound: analysis.sectionsFound,
        sectionsMissing: analysis.sectionsMissing,
        aiModelUsed: analysis.modelUsed || 'unknown',
      });

      if (!saved) {
        throw new Error('Failed to save analysis to database');
      }
      safeConsole.log('✅ Analysis saved successfully');
    } catch (dbError: any) {
      safeConsole.error('❌ Database save failed:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Update resume status and score
    safeConsole.log('🔄 Updating resume status...');
    try {
      await updateResumeStatus(resumeId, 'completed', overallScore);
      safeConsole.log('✅ Resume status updated');
    } catch (statusError: any) {
      safeConsole.error('❌ Status update failed:', statusError);
      // Don't throw here, analysis is already saved
    }

    // Fetch updated data
    safeConsole.log('📥 Fetching updated data...');
    const updatedData = await getResumeWithAnalysis(resumeId);

    safeConsole.log('✅ Re-analysis complete!');
    safeConsole.log('📤 Returning updated data with score:', updatedData.resume?.overall_score);

    const analysisSource = analysis.modelUsed || updatedData.analysis?.ai_model_used || 'unknown';
    const aiFailureReason = (analysis as any).aiFailureReason as string | undefined;
    const fallbackUsed =
      (analysisSource || '').toLowerCase().includes('fallback') ||
      Boolean(aiFailureReason);

    return Response.json({
      success: true,
      analysis: updatedData.analysis,
      resume: updatedData.resume,
      analysisSource,
      fallbackUsed,
      aiFailureReason: fallbackUsed ? aiFailureReason : undefined,
      message: 'Resume re-analyzed successfully',
    });
  } catch (error) {
    safeConsole.error('❌ Error in re-analysis:', error);
    return Response.json({
      error: 'Failed to re-analyze resume',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
