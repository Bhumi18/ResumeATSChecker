import { sql, queryOne, execute, query } from '../neon.server';
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
    const result = await query<Resume>(
      `INSERT INTO resumes (
        user_id, company_name, job_title, job_description, 
        resume_file_url, resume_file_name, resume_thumbnail_url, status
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        resumeData.company_name,
        resumeData.job_title,
        resumeData.job_description,
        resumeData.resume_file_url,
        resumeData.resume_file_name,
        resumeData.resume_thumbnail_url,
        'pending'
      ]
    );

    return result[0] || null;
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
    const result = await query<Resume>(
      `SELECT * FROM resumes WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    return result || [];
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
    const resume = await queryOne<Resume>(
      `SELECT * FROM resumes WHERE id = $1`,
      [resumeId]
    );

    if (!resume) {
      return { resume: null, analysis: null };
    }

    const analysis = await queryOne<ResumeAnalysis>(
      `SELECT * FROM resume_analysis WHERE resume_id = $1`,
      [resumeId]
    );

    return {
      resume,
      analysis,
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
    let query: string;
    let params: any[];

    if (overallScore !== undefined) {
      query = `UPDATE resumes SET status = $1, overall_score = $2, updated_at = NOW() WHERE id = $3`;
      params = [status, overallScore, resumeId];
    } else {
      query = `UPDATE resumes SET status = $1, updated_at = NOW() WHERE id = $2`;
      params = [status, resumeId];
    }

    return await execute(query, params);
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
    return await execute(
      `DELETE FROM resumes WHERE id = $1`,
      [resumeId]
    );
  } catch (error) {
    console.error('Error in deleteResume:', error);
    return false;
  }
}

/**
 * Delete a resume owned by a specific user
 */
export async function deleteResumeForUser(
  resumeId: string,
  userId: string
): Promise<boolean> {
  try {
    return await execute(
      `DELETE FROM resumes WHERE id = $1 AND user_id = $2`,
      [resumeId, userId]
    );
  } catch (error) {
    console.error('Error in deleteResumeForUser:', error);
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
    await execute(
      `INSERT INTO resume_analysis (
        resume_id, ats_score, ats_tips, tone_style_score, tone_style_tips,
        content_score, content_tips, structure_score, structure_tips,
        skills_score, skills_tips, keywords_found, keywords_missing,
        sections_found, sections_missing, ai_model_used
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       ON CONFLICT (resume_id) 
       DO UPDATE SET
         ats_score = EXCLUDED.ats_score,
         ats_tips = EXCLUDED.ats_tips,
         tone_style_score = EXCLUDED.tone_style_score,
         tone_style_tips = EXCLUDED.tone_style_tips,
         content_score = EXCLUDED.content_score,
         content_tips = EXCLUDED.content_tips,
         structure_score = EXCLUDED.structure_score,
         structure_tips = EXCLUDED.structure_tips,
         skills_score = EXCLUDED.skills_score,
         skills_tips = EXCLUDED.skills_tips,
         keywords_found = EXCLUDED.keywords_found,
         keywords_missing = EXCLUDED.keywords_missing,
         sections_found = EXCLUDED.sections_found,
         sections_missing = EXCLUDED.sections_missing,
         ai_model_used = EXCLUDED.ai_model_used,
         updated_at = NOW()`,
      [
        resumeId,
        analysisData.atsScore,
        JSON.stringify(analysisData.atsTips),
        analysisData.toneStyleScore,
        JSON.stringify(analysisData.toneStyleTips),
        analysisData.contentScore,
        JSON.stringify(analysisData.contentTips),
        analysisData.structureScore,
        JSON.stringify(analysisData.structureTips),
        analysisData.skillsScore,
        JSON.stringify(analysisData.skillsTips),
        analysisData.keywordsFound || [],
        analysisData.keywordsMissing || [],
        analysisData.sectionsFound || [],
        analysisData.sectionsMissing || [],
        analysisData.aiModelUsed || 'gemini-2.0-flash-exp'
      ]
    );

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
