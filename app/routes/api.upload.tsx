import { createResume, saveResumeAnalysis } from "../lib/database/index.server";
import { uploadResumeFile } from "../lib/storage.server";
import { analyzeResume, getMockAnalysis } from "../lib/ai-analyzer";

export async function action({ request }: { request: Request }) {
  try {
    const formData = await request.formData();
    
    // Extract data from form
    const userId = formData.get('userId') as string;
    const companyName = formData.get('companyName') as string | null;
    const jobTitle = formData.get('jobTitle') as string | null;
    const jobDescription = formData.get('jobDescription') as string | null;
    const file = formData.get('file') as File;

    if (!userId || !file) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

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

    // Step 4: Analyze resume
    let analysisResult;
    try {
      analysisResult = await analyzeResume(
        file,
        jobTitle || undefined,
        jobDescription || undefined,
        false
      );
    } catch (aiError) {
      console.warn("AI analysis failed, using mock data:", aiError);
      analysisResult = getMockAnalysis();
    }

    // Step 5: Save analysis
    await saveResumeAnalysis(resume.id, {
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
    console.error('Error in upload API:', error);
    return Response.json({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
