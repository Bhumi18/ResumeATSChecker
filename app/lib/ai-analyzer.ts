/**
 * AI Resume Analyzer Service
 * 
 * This service integrates with Google AI Studio (Gemini models)
 * to analyze resumes and provide ATS-compliant feedback.
 * 
 * Models used:
 * - gemini-2.0-flash-exp: Fast analysis (primary) & Deep analysis (fallback)
 * - text-embedding-004: Semantic matching & embeddings
 */

interface ResumeAnalysisResult {
  overallScore: number;
  atsScore: number;
  atsTips: Array<{ type: 'good' | 'bad'; tip: string }>;
  toneStyleScore: number;
  toneStyleTips: Array<{ type: 'good' | 'improve'; tip: string; explanation: string }>;
  contentScore: number;
  contentTips: Array<{ type: 'good' | 'improve'; tip: string; explanation: string }>;
  structureScore: number;
  structureTips: Array<{ type: 'good' | 'improve'; tip: string; explanation: string }>;
  skillsScore: number;
  skillsTips: Array<{ type: 'good' | 'improve'; tip: string; explanation: string }>;
  keywordsFound: string[];
  keywordsMissing: string[];
  sectionsFound: string[];
  sectionsMissing: string[];
  modelUsed?: string;
}

interface EmbeddingResult {
  embedding: number[];
  text: string;
}

// Available Gemini models
const GEMINI_MODELS = {
  FLASH: 'gemini-2.0-flash-exp',
  PRO: 'gemini-2.0-flash-exp',
  EMBEDDING: 'text-embedding-004',
} as const;

/**
 * Extract text from PDF file using pdf.js
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Dynamic import to avoid SSR issues
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set worker path
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Generate embeddings for semantic matching using text-embedding-004
 */
export async function generateEmbedding(
  text: string
): Promise<number[] | null> {
  const apiKey = import.meta.env.VITE_GOOGLE_AI_STUDIO_API_KEY;
  
  if (!apiKey) {
    console.error('Google AI Studio API key not configured');
    return null;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODELS.EMBEDDING}:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: `models/${GEMINI_MODELS.EMBEDDING}`,
          content: {
            parts: [{
              text: text.substring(0, 20000), // Limit text length
            }],
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Embedding API error:', error);
      return null;
    }

    const data = await response.json();
    return data.embedding?.values || null;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) return 0;
  
  const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
  const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  
  return dotProduct / (mag1 * mag2);
}

/**
 * Analyze resume using Gemini Flash (Fast analysis & feedback)
 */
async function analyzeWithGeminiFlash(
  resumeText: string,
  jobTitle?: string,
  jobDescription?: string
): Promise<ResumeAnalysisResult> {
  const apiKey = import.meta.env.VITE_GOOGLE_AI_STUDIO_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google AI Studio API key not configured');
  }

  const prompt = `You are an expert ATS (Applicant Tracking System) resume analyzer. Analyze the following resume quickly and provide concise, actionable feedback.

${jobTitle ? `Target Job Title: ${jobTitle}` : ''}
${jobDescription ? `Job Description: ${jobDescription}` : ''}

Resume Content:
${resumeText}

Provide analysis in this EXACT JSON format (no markdown, just JSON):
{
  "atsScore": <number 0-100>,
  "atsTips": [{"type": "good" or "bad", "tip": "description"}],
  "toneStyleScore": <number 0-100>,
  "toneStyleTips": [{"type": "good" or "improve", "tip": "description", "explanation": "details"}],
  "contentScore": <number 0-100>,
  "contentTips": [{"type": "good" or "improve", "tip": "description", "explanation": "details"}],
  "structureScore": <number 0-100>,
  "structureTips": [{"type": "good" or "improve", "tip": "description", "explanation": "details"}],
  "skillsScore": <number 0-100>,
  "skillsTips": [{"type": "good" or "improve", "tip": "description", "explanation": "details"}],
  "keywordsFound": ["keyword1", "keyword2"],
  "keywordsMissing": ["missing1", "missing2"],
  "sectionsFound": ["section1", "section2"],
  "sectionsMissing": ["section1", "section2"]
}

Focus on:
1. ATS compatibility (formatting, keywords, structure)
2. Professional tone and writing style
3. Content quality (achievements, quantifiable results)
4. Resume structure and organization
5. Relevant skills and their presentation

Provide 3-5 actionable tips per category.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODELS.FLASH}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2000,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini Flash API error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
    
    const analysis = JSON.parse(jsonText);

    const overallScore = Math.round(
      (analysis.atsScore +
        analysis.toneStyleScore +
        analysis.contentScore +
        analysis.structureScore +
        analysis.skillsScore) / 5
    );

    return {
      overallScore,
      ...analysis,
      modelUsed: GEMINI_MODELS.FLASH,
    };
  } catch (error) {
    console.error('Error analyzing with Gemini Flash:', error);
    throw error;
  }
}

/**
 * Analyze resume using Gemini Pro (Deep analysis with premium features)
 */
async function analyzeWithGeminiPro(
  resumeText: string,
  jobTitle?: string,
  jobDescription?: string
): Promise<ResumeAnalysisResult> {
  const apiKey = import.meta.env.VITE_GOOGLE_AI_STUDIO_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google AI Studio API key not configured');
  }

  const prompt = `You are an expert ATS (Applicant Tracking System) resume analyzer performing DEEP, PREMIUM analysis. Provide comprehensive, detailed feedback with advanced insights.

${jobTitle ? `Target Job Title: ${jobTitle}` : ''}
${jobDescription ? `Job Description: ${jobDescription}` : ''}

Resume Content:
${resumeText}

Provide an in-depth analysis in this EXACT JSON format (no markdown):
{
  "atsScore": <number 0-100>,
  "atsTips": [{"type": "good" or "bad", "tip": "detailed description with examples"}],
  "toneStyleScore": <number 0-100>,
  "toneStyleTips": [{"type": "good" or "improve", "tip": "description", "explanation": "comprehensive details with specific examples"}],
  "contentScore": <number 0-100>,
  "contentTips": [{"type": "good" or "improve", "tip": "description", "explanation": "detailed analysis with suggestions"}],
  "structureScore": <number 0-100>,
  "structureTips": [{"type": "good" or "improve", "tip": "description", "explanation": "structural improvements with examples"}],
  "skillsScore": <number 0-100>,
  "skillsTips": [{"type": "good" or "improve", "tip": "description", "explanation": "skill-specific recommendations"}],
  "keywordsFound": ["keyword1", "keyword2", ...],
  "keywordsMissing": ["important_keyword1", "important_keyword2", ...],
  "sectionsFound": ["section1", "section2", ...],
  "sectionsMissing": ["recommended_section1", ...]
}

Perform DEEP analysis on:
1. ATS compatibility (formatting, keyword density, parsing friendliness)
2. Professional tone and persuasive writing
3. Content quality (quantified achievements, impact statements, ROI)
4. Resume structure and visual hierarchy
5. Skills presentation and relevance
6. Industry-specific best practices

Provide 5-8 highly actionable, specific tips per category with examples.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODELS.PRO}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 4000,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini Pro API error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    
    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
    const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
    
    const analysis = JSON.parse(jsonText);

    const overallScore = Math.round(
      (analysis.atsScore +
        analysis.toneStyleScore +
        analysis.contentScore +
        analysis.structureScore +
        analysis.skillsScore) / 5
    );

    return {
      overallScore,
      ...analysis,
      modelUsed: GEMINI_MODELS.PRO,
    };
  } catch (error) {
    console.error('Error analyzing with Gemini Pro:', error);
    throw error;
  }
}

/**
 * Analyze resume with FAST analysis (Gemini Flash)
 * For quick feedback and standard use cases
 */
export async function analyzeResumeFast(
  file: File,
  jobTitle?: string,
  jobDescription?: string
): Promise<ResumeAnalysisResult> {
  const apiKey = import.meta.env.VITE_GOOGLE_AI_STUDIO_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google AI Studio API key not configured. Please set VITE_GOOGLE_AI_STUDIO_API_KEY');
  }

  try {
    // Extract text from PDF
    const resumeText = await extractTextFromPDF(file);
    
    if (!resumeText || resumeText.trim().length < 100) {
      throw new Error('Could not extract sufficient text from resume');
    }

    // Try Gemini Flash first
    try {
      return await analyzeWithGeminiFlash(resumeText, jobTitle, jobDescription);
    } catch (flashError: any) {
      // If Flash fails due to rate limit or quota, throw to allow fallback
      console.warn('Gemini Flash failed:', flashError.message);
      throw flashError;
    }
  } catch (error) {
    console.error('Error in analyzeResumeFast:', error);
    throw error;
  }
}

/**
 * Analyze resume with DEEP analysis (Gemini Pro)
 * For premium features and comprehensive feedback
 */
export async function analyzeResumePremium(
  file: File,
  jobTitle?: string,
  jobDescription?: string
): Promise<ResumeAnalysisResult> {
  const apiKey = import.meta.env.VITE_GOOGLE_AI_STUDIO_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google AI Studio API key not configured. Please set VITE_GOOGLE_AI_STUDIO_API_KEY');
  }

  try {
    // Extract text from PDF
    const resumeText = await extractTextFromPDF(file);
    
    if (!resumeText || resumeText.trim().length < 100) {
      throw new Error('Could not extract sufficient text from resume');
    }

    return await analyzeWithGeminiPro(resumeText, jobTitle, jobDescription);
  } catch (error) {
    console.error('Error in analyzeResumePremium:', error);
    throw error;
  }
}

/**
 * Main function to analyze resume with automatic model selection
 * Priority: Flash (fast) -> Pro (if Flash fails)
 */
export async function analyzeResume(
  file: File,
  jobTitle?: string,
  jobDescription?: string,
  usePremium: boolean = false
): Promise<ResumeAnalysisResult> {
  const apiKey = import.meta.env.VITE_GOOGLE_AI_STUDIO_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google AI Studio API key not configured. Please set VITE_GOOGLE_AI_STUDIO_API_KEY in your .env file');
  }

  try {
    // Extract text from PDF
    const resumeText = await extractTextFromPDF(file);
    
    if (!resumeText || resumeText.trim().length < 100) {
      throw new Error('Could not extract sufficient text from resume');
    }

    // If premium requested, use Pro model directly
    if (usePremium) {
      console.log('Using Gemini Pro for premium analysis...');
      return await analyzeWithGeminiPro(resumeText, jobTitle, jobDescription);
    }

    // Otherwise, try Flash first for fast analysis
    try {
      console.log('Using Gemini Flash for fast analysis...');
      return await analyzeWithGeminiFlash(resumeText, jobTitle, jobDescription);
    } catch (flashError: any) {
      // If Flash fails (quota/rate limit), fallback to Pro
      console.warn('Gemini Flash failed, falling back to Pro:', flashError.message);
      console.log('Retrying with Gemini Pro...');
      return await analyzeWithGeminiPro(resumeText, jobTitle, jobDescription);
    }
  } catch (error) {
    console.error('Error in analyzeResume:', error);
    throw error;
  }
}

/**
 * Get mock analysis for testing (when AI is not configured)
 */
export function getMockAnalysis(): ResumeAnalysisResult {
  return {
    overallScore: 78,
    atsScore: 82,
    atsTips: [
      { type: 'good', tip: 'Uses standard resume sections that ATS can easily parse' },
      { type: 'bad', tip: 'Contains some special characters that may confuse ATS systems' },
      { type: 'good', tip: 'File format is ATS-friendly (PDF)' },
    ],
    toneStyleScore: 75,
    toneStyleTips: [
      {
        type: 'good',
        tip: 'Professional language throughout',
        explanation: 'Maintains appropriate professional tone',
      },
      {
        type: 'improve',
        tip: 'Use more action verbs',
        explanation: 'Start bullet points with strong action verbs like "Led", "Developed", "Achieved"',
      },
    ],
    contentScore: 80,
    contentTips: [
      {
        type: 'good',
        tip: 'Includes quantifiable achievements',
        explanation: 'Uses metrics and numbers to demonstrate impact',
      },
      {
        type: 'improve',
        tip: 'Add more specific project outcomes',
        explanation: 'Include measurable results for each major project or accomplishment',
      },
    ],
    structureScore: 77,
    structureTips: [
      {
        type: 'good',
        tip: 'Clear section headers',
        explanation: 'Well-organized with distinct sections',
      },
      {
        type: 'improve',
        tip: 'Optimize spacing and formatting',
        explanation: 'Some sections could benefit from better spacing for readability',
      },
    ],
    skillsScore: 76,
    skillsTips: [
      {
        type: 'good',
        tip: 'Relevant technical skills listed',
        explanation: 'Includes industry-relevant technologies',
      },
      {
        type: 'improve',
        tip: 'Add more soft skills',
        explanation: 'Include leadership, communication, and teamwork skills',
      },
    ],
    keywordsFound: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Git'],
    keywordsMissing: ['Agile', 'CI/CD', 'Testing', 'Cloud'],
    sectionsFound: ['Experience', 'Education', 'Skills'],
    sectionsMissing: ['Projects', 'Certifications'],
    modelUsed: 'mock',
  };
}
