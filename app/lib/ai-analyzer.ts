/**
 * ATSEngine - AI Resume Analyzer Service
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
  atsTips: Array<{ type: 'good' | 'bad'; tip: string; original?: string; replacement?: string }>;
  toneStyleScore: number;
  toneStyleTips: Array<{ type: 'good' | 'improve'; tip: string; explanation: string; original?: string; replacement?: string }>;
  contentScore: number;
  contentTips: Array<{ type: 'good' | 'improve'; tip: string; explanation: string; original?: string; replacement?: string }>;
  structureScore: number;
  structureTips: Array<{ type: 'good' | 'improve'; tip: string; explanation: string; original?: string; replacement?: string }>;
  skillsScore: number;
  skillsTips: Array<{ type: 'good' | 'improve'; tip: string; explanation: string; original?: string; replacement?: string }>;
  keywordsFound: string[];
  keywordsMissing: string[];
  sectionsFound: string[];
  sectionsMissing: string[];
  modelUsed?: string;
  optimizedResume?: string; // Complete optimized resume content
}

interface EmbeddingResult {
  embedding: number[];
  text: string;
}

// Available Gemini models
const GEMINI_MODELS = {
  FLASH: 'gemini-flash-latest',
  PRO: 'gemini-pro-latest',
  EMBEDDING: 'text-embedding-004',
} as const;

type SectionDefinition = {
  key: string;
  label: string;
  aliases: string[];
};

const SECTION_DEFINITIONS: SectionDefinition[] = [
  {
    key: 'summary',
    label: 'Professional Summary',
    aliases: [
      'professional summary',
      'summary',
      'profile',
      'career objective',
      'objective',
      'professional profile',
    ],
  },
  {
    key: 'skills',
    label: 'Technical Skills',
    aliases: [
      'technical skills',
      'skills',
      'core competencies',
      'competencies',
      'technology stack',
      'tech stack',
      'tools and technologies',
      'tools & technologies',
    ],
  },
  {
    key: 'experience',
    label: 'Professional Experience',
    aliases: [
      'professional experience',
      'work experience',
      'employment history',
      'experience',
      'career history',
    ],
  },
  {
    key: 'projects',
    label: 'Projects',
    aliases: [
      'projects',
      'project experience',
      'personal projects',
      'academic projects',
      'key projects',
      'selected projects',
    ],
  },
  {
    key: 'education',
    label: 'Education',
    aliases: [
      'education',
      'academic background',
      'academic qualifications',
      'qualifications',
    ],
  },
  {
    key: 'certifications',
    label: 'Certifications',
    aliases: [
      'certification',
      'certifications',
      'licenses',
      'licences',
      'professional certifications',
      'certificates',
    ],
  },
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseSectionKey(value: string): string | null {
  const normalized = normalizeText(value);
  if (!normalized) return null;

  const directMatch = SECTION_DEFINITIONS.find(
    (section) =>
      normalizeText(section.label) === normalized ||
      section.aliases.some((alias) => normalizeText(alias) === normalized)
  );

  if (directMatch) return directMatch.key;

  const includesMatch = SECTION_DEFINITIONS.find((section) =>
    section.aliases.some((alias) => {
      const aliasNormalized = normalizeText(alias);
      return normalized.includes(aliasNormalized) || aliasNormalized.includes(normalized);
    })
  );

  return includesMatch?.key ?? null;
}

function hasSectionHeadingEvidence(text: string, alias: string): boolean {
  const escapedAlias = escapeRegex(alias).replace(/\s+/g, '\\s+');

  // Strong heading signals: line-heading format, explicit section label with punctuation,
  // or standalone uppercase heading (common in resumes).
  const lineHeading = new RegExp(`(?:^|[\\r\\n])\\s*${escapedAlias}\\s*(?:[:\\-|]|$)`, 'im');
  const explicitLabel = new RegExp(`\\b${escapedAlias}\\b\\s*[:\\-|]`, 'i');
  const uppercaseHeading = new RegExp(`\\b${escapeRegex(alias.toUpperCase()).replace(/\s+/g, '\\s+')}\\b`);

  return lineHeading.test(text) || explicitLabel.test(text) || uppercaseHeading.test(text);
}

function detectSectionsFromResumeText(resumeText: string): string[] {
  if (!resumeText) return [];

  return SECTION_DEFINITIONS.filter((section) =>
    section.aliases.some((alias) => hasSectionHeadingEvidence(resumeText, alias))
  ).map((section) => section.label);
}

function mergeAndNormalizeSections(
  modelSectionsFound: unknown,
  modelSectionsMissing: unknown,
  resumeText: string
): { sectionsFound: string[]; sectionsMissing: string[] } {
  const foundKeys = new Set<string>();

  if (Array.isArray(modelSectionsFound)) {
    for (const section of modelSectionsFound) {
      if (typeof section !== 'string') continue;
      const key = parseSectionKey(section);
      if (key) foundKeys.add(key);
    }
  }

  if (Array.isArray(modelSectionsMissing)) {
    for (const section of modelSectionsMissing) {
      if (typeof section !== 'string') continue;
      const key = parseSectionKey(section);
      if (!key) continue;

      // Keep model intent for unknown/marginal sections, but explicit text evidence wins.
      if (!foundKeys.has(key)) {
        // Intentionally no-op here; final missing list is derived below.
      }
    }
  }

  for (const detectedSection of detectSectionsFromResumeText(resumeText)) {
    const key = parseSectionKey(detectedSection);
    if (key) foundKeys.add(key);
  }

  const sectionsFound = SECTION_DEFINITIONS
    .filter((section) => foundKeys.has(section.key))
    .map((section) => section.label);

  const sectionsMissing = SECTION_DEFINITIONS
    .filter((section) => !foundKeys.has(section.key))
    .map((section) => section.label);

  return { sectionsFound, sectionsMissing };
}

function applySectionPostProcessing(
  analysis: Record<string, any>,
  resumeText: string
): ResumeAnalysisResult {
  const toSafeScore = (value: unknown): number => {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.min(100, Math.round(parsed)));
  };

  const overallScore = Math.round(
    (toSafeScore(analysis.atsScore) +
      toSafeScore(analysis.toneStyleScore) +
      toSafeScore(analysis.contentScore) +
      toSafeScore(analysis.structureScore) +
      toSafeScore(analysis.skillsScore)) / 5
  );

  const { sectionsFound, sectionsMissing } = mergeAndNormalizeSections(
    analysis.sectionsFound,
    analysis.sectionsMissing,
    resumeText
  );

  return {
    overallScore,
    ...analysis,
    atsScore: toSafeScore(analysis.atsScore),
    toneStyleScore: toSafeScore(analysis.toneStyleScore),
    contentScore: toSafeScore(analysis.contentScore),
    structureScore: toSafeScore(analysis.structureScore),
    skillsScore: toSafeScore(analysis.skillsScore),
    keywordsFound: Array.isArray(analysis.keywordsFound) ? analysis.keywordsFound : [],
    keywordsMissing: Array.isArray(analysis.keywordsMissing) ? analysis.keywordsMissing : [],
    sectionsFound,
    sectionsMissing,
  } as ResumeAnalysisResult;
}

function extractJsonObject(text: string): string {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const start = text.indexOf('{');
  if (start === -1) {
    throw new Error('No JSON object found in model response');
  }

  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (char === '\\') {
        isEscaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  throw new Error('Incomplete JSON object in model response');
}

/**
 * Extract text from PDF file using pdf.js
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log('📄 Starting PDF text extraction...', {
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(2)} KB`,
      fileType: file.type
    });

    // Dynamic import to avoid SSR issues
    const pdfjsLib = await import('pdfjs-dist');
    
    // Disable worker to avoid version mismatch issues - use main thread
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    
    console.log('🔧 PDF.js configured (no worker, main thread mode)');
    console.log('🔧 PDF.js version:', pdfjsLib.version);

    const arrayBuffer = await file.arrayBuffer();
    
    // Use disableWorker option
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    });
    
    const pdf = await loadingTask.promise;
    
    console.log(`📖 PDF loaded: ${pdf.numPages} pages`);
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      const textItems = textContent.items
        .filter((item: any) => typeof item?.str === 'string')
        .map((item: any) => ({
          text: item.str,
          x: Number(item.transform?.[4] ?? 0),
          y: Number(item.transform?.[5] ?? 0),
        }));

      const lineBuckets: Array<{ y: number; items: Array<{ text: string; x: number }> }> = [];
      const yTolerance = 2.5;

      for (const item of textItems) {
        const cleanText = String(item.text ?? '').trim();
        if (!cleanText) continue;

        let targetLine = lineBuckets.find((line) => Math.abs(line.y - item.y) <= yTolerance);
        if (!targetLine) {
          targetLine = { y: item.y, items: [] };
          lineBuckets.push(targetLine);
        }

        targetLine.items.push({ text: cleanText, x: item.x });
      }

      lineBuckets.sort((a, b) => b.y - a.y);
      const pageText = lineBuckets
        .map((line) =>
          line.items
            .sort((a, b) => a.x - b.x)
            .map((part) => part.text)
            .join(' ')
        )
        .join('\n');

      fullText += pageText + '\n\n';
      console.log(`✓ Extracted page ${i}/${pdf.numPages}`);
    }
    
    console.log(`✅ PDF extraction complete: ${fullText.length} characters`);
    return fullText;
  } catch (error) {
    console.error('❌ Error extracting text from PDF:', error);
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

Important for section detection:
- Treat singular/plural as equivalent (e.g., "Certification" == "Certifications", "Project" == "Projects")
- Recognize common heading variants (e.g., "Professional Experience", "Work Experience")
- Do not mark a section as missing if a clear heading variant exists in the resume text

Provide 3-5 actionable tips per category.`;

  try {
    console.log(`🚀 Calling Gemini Flash API: ${GEMINI_MODELS.FLASH}`);
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
    
    const jsonText = extractJsonObject(text);
    const analysis = JSON.parse(jsonText);
    const postProcessed = applySectionPostProcessing(analysis, resumeText);

    return {
      ...postProcessed,
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

Important for section detection:
- Treat singular/plural as equivalent (e.g., "Certification" == "Certifications", "Project" == "Projects")
- Recognize common heading variants (e.g., "Professional Experience", "Work Experience")
- Do not mark a section as missing if a clear heading variant exists in the resume text

Provide 5-8 highly actionable, specific tips per category with examples.`;

  try {
    console.log(`🚀 Calling Gemini Pro API: ${GEMINI_MODELS.PRO}`);
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
    
    const jsonText = extractJsonObject(text);
    const analysis = JSON.parse(jsonText);
    const postProcessed = applySectionPostProcessing(analysis, resumeText);

    return {
      ...postProcessed,
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
 * Analyze resume from text (for re-analysis after editing)
 */
export async function analyzeResumeText(
  resumeText: string,
  jobTitle?: string,
  jobDescription?: string
): Promise<ResumeAnalysisResult> {
  const apiKey = import.meta.env.VITE_GOOGLE_AI_STUDIO_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google AI Studio API key not configured. Please set VITE_GOOGLE_AI_STUDIO_API_KEY in your .env file');
  }

  if (!resumeText || resumeText.trim().length < 100) {
    throw new Error('Resume text is too short or empty');
  }

  try {
    console.log('🔄 Analyzing resume text...');
    // Use Flash for fast re-analysis
    try {
      console.log('Trying Gemini Flash...');
      return await analyzeWithGeminiFlash(resumeText, jobTitle, jobDescription);
    } catch (flashError: any) {
      // If Flash fails (quota/rate limit), fallback to Pro
      console.warn('Gemini Flash failed, falling back to Pro:', flashError.message);
      console.log('Retrying with Gemini Pro...');
      try {
        return await analyzeWithGeminiPro(resumeText, jobTitle, jobDescription);
      } catch (proError: any) {
        console.error('Both Gemini Flash and Pro failed:', proError.message);
        // Last resort: return a simple re-calculated analysis
        console.warn('Using simplified analysis as fallback...');
        throw new Error('AI analysis temporarily unavailable. Please try again in a moment.');
      }
    }
  } catch (error) {
    console.error('Error in analyzeResumeText:', error);
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

/**
 * Generate a completely optimized resume that matches the job description
 * This applies ALL AI suggestions automatically
 */
export async function generateOptimizedResume(
  resumeText: string,
  jobTitle: string,
  jobDescription: string
): Promise<string> {
  const apiKey = import.meta.env.VITE_GOOGLE_AI_STUDIO_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google AI Studio API key not configured');
  }

  const prompt = `You are an expert resume writer. Rewrite this entire resume to perfectly match the job description while maintaining truthfulness and the candidate's actual experience.

JOB TITLE: ${jobTitle}

JOB DESCRIPTION:
${jobDescription}

CURRENT RESUME:
${resumeText}

INSTRUCTIONS:
1. Rewrite the COMPLETE resume content
2. Incorporate keywords from the job description naturally
3. Emphasize relevant experience and skills
4. Use strong action verbs and quantifiable achievements
5. Maintain the same factual information but optimize presentation
6. Structure should be: Contact Info → Professional Summary → Experience → Education → Skills → (optional) Projects/Certifications
7. Make it sound natural and human-written, NOT AI-generated
8. Use professional but conversational language
9. Add metrics and numbers where appropriate
10. Ensure ATS-friendly formatting

OUTPUT FORMAT: Return ONLY the complete resume text, no explanations, no JSON, no markdown. Just the plain text resume content that can be directly copied into a Word document.`;

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
            temperature: 0.8,
            maxOutputTokens: 3000,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    const optimizedResume = data.candidates[0].content.parts[0].text.trim();
    
    return optimizedResume;
  } catch (error) {
    console.error('Error generating optimized resume:', error);
    throw error;
  }
}

/**
 * Re-analyze resume after changes to update scores
 */
export async function reAnalyzeResume(
  resumeText: string,
  jobTitle?: string,
  jobDescription?: string
): Promise<ResumeAnalysisResult> {
  const apiKey = import.meta.env.VITE_GOOGLE_AI_STUDIO_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google AI Studio API key not configured');
  }

  // Use the same analysis function but mark it as re-analysis
  console.log('Re-analyzing resume with updated content...');
  return await analyzeWithGeminiFlash(resumeText, jobTitle, jobDescription);
}
