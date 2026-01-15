import { supabase } from '../supabase';
import type { Database } from '../../../types/database';

type Resume = Database['public']['Tables']['resumes']['Row'];
type ResumeInsert = Database['public']['Tables']['resumes']['Insert'];
type ResumeAnalysis = Database['public']['Tables']['resume_analysis']['Row'];

/**
 * Create a new resume entry
 */
export async function createResume(
  userId: string,
  resumeData: Omit<ResumeInsert, 'user_id'>
): Promise<Resume | null> {
  try {
    const insertData = {
      ...resumeData,
      user_id: userId,
      status: 'pending' as const,
    };

    const { data, error } = await supabase
      .from('resumes')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating resume:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createResume:', error);
    return null;
  }
}

/**
 * Get all resumes for a user
 */
export async function getUserResumes(userId: string): Promise<Resume[]> {
  try {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching resumes:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserResumes:', error);
    return [];
  }
}

/**
 * Get a single resume with its analysis
 */
export async function getResumeWithAnalysis(resumeId: string): Promise<{
  resume: Resume | null;
  analysis: ResumeAnalysis | null;
}> {
  try {
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .single();

    if (resumeError) {
      console.error('Error fetching resume:', resumeError);
      return { resume: null, analysis: null };
    }

    const { data: analysis, error: analysisError } = await supabase
      .from('resume_analysis')
      .select('*')
      .eq('resume_id', resumeId)
      .single();

    return {
      resume,
      analysis: analysisError ? null : analysis,
    };
  } catch (error) {
    console.error('Error in getResumeWithAnalysis:', error);
    return { resume: null, analysis: null };
  }
}

/**
 * Update resume status
 */
export async function updateResumeStatus(
  resumeId: string,
  status: 'pending' | 'analyzing' | 'completed' | 'failed',
  overallScore?: number
): Promise<boolean> {
  try {
    const updates: any = { status };
    if (overallScore !== undefined) {
      updates.overall_score = overallScore;
    }

    const { error } = await supabase
      .from('resumes')
      .update(updates)
      .eq('id', resumeId);

    if (error) {
      console.error('Error updating resume status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateResumeStatus:', error);
    return false;
  }
}

/**
 * Delete a resume
 */
export async function deleteResume(resumeId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', resumeId);

    if (error) {
      console.error('Error deleting resume:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteResume:', error);
    return false;
  }
}

/**
 * Save resume analysis results
 */
export async function saveResumeAnalysis(
  resumeId: string,
  analysisData: {
    atsScore: number;
    atsTips: any[];
    toneStyleScore: number;
    toneStyleTips: any[];
    contentScore: number;
    contentTips: any[];
    structureScore: number;
    structureTips: any[];
    skillsScore: number;
    skillsTips: any[];
    keywordsFound?: string[];
    keywordsMissing?: string[];
    sectionsFound?: string[];
    sectionsMissing?: string[];
    aiModelUsed?: string;
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('resume_analysis')
      .upsert({
        resume_id: resumeId,
        ats_score: analysisData.atsScore,
        ats_tips: analysisData.atsTips,
        tone_style_score: analysisData.toneStyleScore,
        tone_style_tips: analysisData.toneStyleTips,
        content_score: analysisData.contentScore,
        content_tips: analysisData.contentTips,
        structure_score: analysisData.structureScore,
        structure_tips: analysisData.structureTips,
        skills_score: analysisData.skillsScore,
        skills_tips: analysisData.skillsTips,
        keywords_found: analysisData.keywordsFound,
        keywords_missing: analysisData.keywordsMissing,
        sections_found: analysisData.sectionsFound,
        sections_missing: analysisData.sectionsMissing,
        ai_model_used: analysisData.aiModelUsed,
      });

    if (error) {
      console.error('Error saving analysis:', error);
      return false;
    }

    // Calculate overall score
    const overallScore = Math.round(
      (analysisData.atsScore +
        analysisData.toneStyleScore +
        analysisData.contentScore +
        analysisData.structureScore +
        analysisData.skillsScore) / 5
    );

    // Update resume with overall score and status
    await updateResumeStatus(resumeId, 'completed', overallScore);

    return true;
  } catch (error) {
    console.error('Error in saveResumeAnalysis:', error);
    return false;
  }
}
