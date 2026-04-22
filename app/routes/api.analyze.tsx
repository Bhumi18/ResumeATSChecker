import { getResumeWithAnalysis, saveResumeAnalysis, updateResumeStatus } from "../lib/database/index.server";
import { analyzeResumeText } from "../lib/ai-analyzer";

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

// POST handler for re-analysis
export async function action({ request }: { request: Request }) {
  try {
    const body = await request.json();
    const { resumeId, resumeText, jobDescription, jobTitle } = body;

    console.log('🔄 API action called for re-analysis');
    console.log('📝 Resume ID:', resumeId);
    console.log('📄 Text length:', resumeText?.length);

    if (!resumeId || !resumeText) {
      console.error('❌ Missing required fields');
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

    console.log('🔄 Starting resume analysis...');

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
      console.error('❌ Analysis failed:', analysisError);

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

    console.log('📊 Analysis results:');
    console.log('  - Model Used:', analysis.modelUsed || 'unknown');
    console.log('  - Fallback Used:', analysis.modelUsed === 'fallback-heuristic');
    console.log('  - ATS Score:', analysis.atsScore);
    console.log('  - Tone/Style Score:', analysis.toneStyleScore);
    console.log('  - Content Score:', analysis.contentScore);
    console.log('  - Structure Score:', analysis.structureScore);
    console.log('  - Skills Score:', analysis.skillsScore);

    // Calculate overall score
    const overallScore = Math.round(
      (analysis.atsScore +
        analysis.toneStyleScore +
        analysis.contentScore +
        analysis.structureScore +
        analysis.skillsScore) / 5
    );
    
    console.log('🎯 Overall Score:', overallScore);

    // Save the new analysis to database
    console.log('💾 Saving analysis to database...');
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
      console.log('✅ Analysis saved successfully');
    } catch (dbError: any) {
      console.error('❌ Database save failed:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Update resume status and score
    console.log('🔄 Updating resume status...');
    try {
      await updateResumeStatus(resumeId, 'completed', overallScore);
      console.log('✅ Resume status updated');
    } catch (statusError: any) {
      console.error('❌ Status update failed:', statusError);
      // Don't throw here, analysis is already saved
    }

    // Fetch updated data
    console.log('📥 Fetching updated data...');
    const updatedData = await getResumeWithAnalysis(resumeId);

    console.log('✅ Re-analysis complete!');
    console.log('📤 Returning updated data with score:', updatedData.resume?.overall_score);

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
    console.error('❌ Error in re-analysis:', error);
    return Response.json({
      error: 'Failed to re-analyze resume',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
