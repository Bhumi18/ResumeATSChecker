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

import { redactErrorMessage, safeConsole } from "./logging";

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
  // When heuristic fallback is used, include why Gemini failed.
  aiFailureReason?: string;
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

const MISSING_API_KEY_ERROR =
  'Google AI Studio API key not configured for this account. Add it in Account Settings.';

function resolveGoogleAiStudioApiKey(apiKey?: string): string {
  const normalized = String(apiKey || '').trim();
  if (!normalized) {
    throw new Error(MISSING_API_KEY_ERROR);
  }
  return normalized;
}

function truncateForPrompt(text: string, maxChars: number): { value: string; truncated: boolean } {
  const input = String(text || '');
  if (input.length <= maxChars) return { value: input, truncated: false };

  const headSize = Math.floor(maxChars * 0.6);
  const tailSize = Math.max(0, maxChars - headSize);
  return {
    value: `${input.slice(0, headSize)}\n\n...(middle omitted for length)...\n\n${input.slice(-tailSize)}`,
    truncated: true,
  };
}

function formatAiError(error: unknown): string {
  if (!error) return 'Unknown error';
  if (error instanceof Error) return error.message || 'Unknown error';
  return String(error);
}

function looksLikeModelOutputOrParseError(message: string): boolean {
  const text = String(message || '').toLowerCase();
  return (
    text.includes('no json object found') ||
    text.includes('incomplete json object') ||
    text.includes('unexpected token') ||
    text.includes('json')
  );
}

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

type KeywordMatchContext = {
  resumeRawLower: string;
  resumeNormalized: string;
  resumeCollapsed: string;
  resumeTokens: Set<string>;
  resumeStems: Set<string>;
};

const NLP_STOPWORDS = new Set([
  'a','an','the','and','or','to','of','in','on','for','with','from','by','as','at','is','are','be','been','being',
  'this','that','these','those','it','its','their','our','your','you','we','they','he','she','them','us','i',
  'will','would','can','could','should','must','may','might','have','has','had','do','does','did','done',
  'about','into','over','under','between','across','through','during','within','without','per',
  'required','preferred','plus','ability','skills','skill','experience','experienced','knowledge',
  'strong','excellent','good','proven','working','hands','hand','including','etc',
  'com','org','net','www','http','https','careers','career','apply','click','here',
  'role','position','company','job','jobs',
  'but','not','full','time','salary','annualized','range','reasonable','faith',
]);

const LOW_SIGNAL_KEYWORDS = new Set([
  'team',
  'build',
  'built',
  'help',
  'all',
  'new',
  'developer',
  'developers',
  'work',
  'closely',
  'hiring',
  'join',
  'opportunity',
  'candidate',
  'candidates',
  'ecosystem',
  'company',
  'mission',
  'values',
  'technical',
  'development',
  'software',
  'data',
  'salary',
  'annualized',
  'range',
  'reasonable',
  'faith',
  'full time',
  'part time',
  'contract',
  'onsite',
  'remote',
  'hybrid',
]);

const ORGANIZATION_SUFFIXES = new Set([
  'inc',
  'llc',
  'ltd',
  'corp',
  'corporation',
  'technologies',
  'technology',
  'tech',
  'labs',
  'lab',
  'foundation',
  'group',
  'systems',
  'solutions',
  'university',
]);

const KEYWORD_STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'to',
  'of',
  'in',
  'on',
  'for',
  'with',
  'using',
  'use',
  'ability',
  'skills',
  'skill',
  'experience',
  'experienced',
  'knowledge',
  'understanding',
  'familiarity',
  'proficiency',
  'strong',
  'working',
  'hands',
  'hand',
  'plus',
  'preferred',
  'required',
  'nice',
  'have',
  'must',
]);

function normalizeKeywordText(value: string): string {
  return normalizeText(
    value
      .toLowerCase()
      .replace(/c\+\+/g, ' cpp ')
      .replace(/c#/g, ' csharp ')
      .replace(/\.net/g, ' dotnet ')
      .replace(/node\.js/g, ' nodejs ')
      .replace(/next\.js/g, ' nextjs ')
      .replace(/react\.js/g, ' reactjs ')
      .replace(/vue\.js/g, ' vuejs ')
      .replace(/angular\.js/g, ' angularjs ')
      .replace(/ci\s*\/\s*cd/g, ' cicd ')
      .replace(/ui\s*\/\s*ux/g, ' uiux ')
  );
}

function simpleStem(word: string): string {
  const token = word.trim();
  if (token.length <= 3) return token;
  if (token.endsWith('ies') && token.length > 4) return `${token.slice(0, -3)}y`;
  if (token.endsWith('ing') && token.length > 5) return token.slice(0, -3);
  if (token.endsWith('ed') && token.length > 4) return token.slice(0, -2);
  if (token.endsWith('es') && token.length > 4) return token.slice(0, -2);
  if (token.endsWith('s') && token.length > 3) return token.slice(0, -1);
  return token;
}

function createKeywordMatchContext(resumeText: string): KeywordMatchContext {
  const resumeRawLower = resumeText.toLowerCase();
  const resumeNormalized = normalizeKeywordText(resumeText);
  const resumeCollapsed = resumeNormalized.replace(/\s+/g, '');
  const resumeTokens = new Set(resumeNormalized.split(' ').filter(Boolean));
  const resumeStems = new Set(Array.from(resumeTokens).map((token) => simpleStem(token)));

  return {
    resumeRawLower,
    resumeNormalized,
    resumeCollapsed,
    resumeTokens,
    resumeStems,
  };
}

function tokenizeKeyword(keyword: string): string[] {
  return normalizeKeywordText(keyword)
    .split(' ')
    .map((word) => word.trim())
    .filter(Boolean);
}

function getCoreKeywordTokens(tokens: string[]): string[] {
  const core = tokens.filter((token) => !KEYWORD_STOPWORDS.has(token));
  return core.length > 0 ? core : tokens;
}

function expandKeywordCandidates(keyword: string): string[] {
  const input = String(keyword || '').trim();
  if (!input) return [];

  const pieces = input
    .split(/[,;|]/)
    .map((part) => part.trim())
    .filter(Boolean);

  const candidates = pieces.length > 1 ? pieces : [input];
  const expanded = new Set<string>();

  for (const candidate of candidates) {
    expanded.add(candidate);

    const andSplit = candidate
      .split(/\band\b/i)
      .map((part) => part.trim())
      .filter(Boolean);

    if (andSplit.length > 1) {
      for (const part of andSplit) {
        if (part.length >= 2) expanded.add(part);
      }
    }
  }

  return Array.from(expanded);
}

function cleanKeywordCandidate(keyword: string): string {
  return String(keyword || '')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9+#/. -]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isLikelyNoiseKeyword(keyword: string, jobContextNormalized?: string): boolean {
  const cleaned = cleanKeywordCandidate(keyword);
  if (!cleaned) return true;

  const lower = cleaned.toLowerCase();
  if (LOW_SIGNAL_KEYWORDS.has(lower)) return true;

  if (/https?:\/\//i.test(lower)) return true;
  if (/\b[a-z0-9.-]+\.(com|org|net|io|ai|dev|co)\b/i.test(lower)) return true;
  if (/@/.test(lower) && /\./.test(lower)) return true;
  if (/\b(full\s*time|part\s*time|salary|annualized|compensation|benefits?|pay\s*range|salary\s*range)\b/i.test(lower)) {
    return true;
  }
  if (/\b(equal\s*opportunity|affirmative\s*action|legally\s*authorized|reasonable\s*accommodation)\b/i.test(lower)) {
    return true;
  }

  const normalized = normalizeKeywordText(cleaned);
  const tokens = normalized.split(' ').filter(Boolean);
  if (tokens.length === 0) return true;

  const coreTokens = tokens.filter((token) => !NLP_STOPWORDS.has(token));
  if (coreTokens.length === 0) return true;

  if (coreTokens.every((token) => LOW_SIGNAL_KEYWORDS.has(token))) return true;

  if (coreTokens.length <= 2 && coreTokens.every((token) => NLP_STOPWORDS.has(token) || LOW_SIGNAL_KEYWORDS.has(token))) {
    return true;
  }

  // If we have job context, down-rank single generic terms that are not explicitly present there.
  if (jobContextNormalized && coreTokens.length === 1) {
    const token = coreTokens[0];
    if (LOW_SIGNAL_KEYWORDS.has(token) && !jobContextNormalized.includes(token)) {
      return true;
    }
  }

  return false;
}

function extractLikelyOrganizationTerms(jobTitle?: string, jobDescription?: string): Set<string> {
  const raw = `${jobTitle || ''}\n${jobDescription || ''}`.toLowerCase();
  const result = new Set<string>();

  // Domain-based terms: mystenlabs.com -> mystenlabs
  const domainRegex = /\b([a-z0-9-]+)\.(com|org|net|io|ai|dev|co)\b/g;
  let match: RegExpExecArray | null;
  while ((match = domainRegex.exec(raw)) !== null) {
    const root = (match[1] || '').trim();
    if (!root) continue;
    result.add(root);

    // Split domain roots like "mystenlabs" -> "mysten" + "labs".
    for (const suffix of ORGANIZATION_SUFFIXES) {
      if (root.endsWith(suffix) && root.length > suffix.length + 2) {
        const prefix = root.slice(0, -suffix.length).replace(/[-_]+$/, '').trim();
        if (prefix.length >= 3) {
          result.add(prefix);
          result.add(`${prefix} ${suffix}`);
        }
      }
    }

    for (const piece of root.split(/[-_]/).filter(Boolean)) {
      if (piece.length >= 3) result.add(piece);
    }
  }

  // Capture product/brand references used in company context, e.g. "Sui ecosystem".
  const ecosystemRegex = /\b([a-z0-9+.-]{2,})\s+ecosystem\b/g;
  while ((match = ecosystemRegex.exec(raw)) !== null) {
    const token = (match[1] || '').trim();
    if (token.length >= 2) {
      result.add(token);
      result.add(`${token} ecosystem`);
    }
  }

  const normalized = normalizeKeywordText(raw);
  const tokens = normalized.split(' ').filter(Boolean);
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token || token.length < 3) continue;

    // Capture organization-like names near suffixes: "mysten labs", "acme technologies".
    if (i < tokens.length - 1 && ORGANIZATION_SUFFIXES.has(tokens[i + 1])) {
      result.add(token);
      result.add(tokens[i + 1]);
      result.add(`${token} ${tokens[i + 1]}`);
    }

    if (ORGANIZATION_SUFFIXES.has(token)) {
      result.add(token);
    }
  }

  return result;
}

function isOrganizationLikeKeyword(keyword: string, organizationTerms: Set<string>): boolean {
  const normalized = normalizeKeywordText(keyword);
  if (!normalized) return false;

  if (organizationTerms.has(normalized)) return true;

  const tokens = normalized.split(' ').filter(Boolean);
  if (tokens.length === 0) return false;

  if (
    tokens.length === 1 &&
    Array.from(organizationTerms).some((term) => term.includes(tokens[0]) && term.length > tokens[0].length)
  ) {
    return true;
  }

  // If all tokens are organization-derived terms, treat as non-actionable keyword.
  return tokens.every((token) => organizationTerms.has(token) || ORGANIZATION_SUFFIXES.has(token));
}

function keywordAliasPatterns(keyword: string): RegExp[] {
  const normalized = normalizeKeywordText(keyword);

  const aliasMap: Array<{ keys: string[]; patterns: RegExp[] }> = [
    {
      keys: ['agile', 'agile methodology', 'agile methodologies'],
      patterns: [/\bagile\b/i, /\bscrum\b/i, /\bkanban\b/i, /\bsprint\b/i],
    },
    {
      keys: ['ci cd', 'cicd', 'ci/cd', 'continuous integration', 'continuous delivery'],
      patterns: [
        /\bci\s*\/\s*cd\b/i,
        /\bcicd\b/i,
        /\bgithub actions\b/i,
        /\bgitlab ci\b/i,
        /\bjenkins\b/i,
        /\bcircleci\b/i,
        /\bazure devops\b/i,
      ],
    },
    {
      keys: ['testing', 'test', 'software testing'],
      patterns: [
        /\btesting\b/i,
        /\btest\b/i,
        /\bjest\b/i,
        /\bcypress\b/i,
        /\bplaywright\b/i,
        /\breact testing library\b/i,
        /\bunit test/i,
        /\bintegration test/i,
      ],
    },
    {
      keys: ['cloud', 'cloud platform', 'cloud computing'],
      patterns: [
        /\bcloud\b/i,
        /\baws\b/i,
        /\bazure\b/i,
        /\bgcp\b/i,
        /\bgoogle cloud\b/i,
        /\bcloudflare\b/i,
      ],
    },
  ];

  for (const entry of aliasMap) {
    if (entry.keys.includes(normalized)) {
      return entry.patterns;
    }
  }

  return [];
}

function hasKeywordEvidence(keyword: string, ctx: KeywordMatchContext): boolean {
  const raw = keyword.trim();
  if (!raw) return false;

  const rawLower = raw.toLowerCase();
  const normalized = normalizeKeywordText(raw);
  if (!normalized) return false;

  if (ctx.resumeNormalized.includes(normalized)) return true;

  const collapsedKeyword = normalized.replace(/\s+/g, '');
  if (collapsedKeyword && ctx.resumeCollapsed.includes(collapsedKeyword)) return true;

  if (/c\+\+|\bcpp\b/i.test(raw) && /(c\+\+|\bcpp\b|c plus plus)/i.test(ctx.resumeRawLower)) return true;
  if (/c#|\bcsharp\b/i.test(raw) && /(c#|\bcsharp\b|c sharp)/i.test(ctx.resumeRawLower)) return true;
  if (/node\.?js|nodejs/i.test(raw) && /(node\.?js|nodejs|node js)/i.test(ctx.resumeRawLower)) return true;
  if (/react\.?js|reactjs/i.test(raw) && /(react\.?js|reactjs|react js)/i.test(ctx.resumeRawLower)) return true;

  const aliasPatterns = keywordAliasPatterns(raw);
  if (aliasPatterns.length > 0) {
    for (const pattern of aliasPatterns) {
      if (pattern.test(ctx.resumeRawLower)) {
        return true;
      }
    }
  }

  const words = tokenizeKeyword(normalized);
  const coreWords = getCoreKeywordTokens(words);

  if (coreWords.length === 1) {
    const token = coreWords[0];
    if (ctx.resumeTokens.has(token)) return true;
    if (ctx.resumeStems.has(simpleStem(token))) return true;
    return false;
  }

  let matched = 0;
  for (const word of coreWords) {
    if (ctx.resumeTokens.has(word) || ctx.resumeStems.has(simpleStem(word))) {
      matched++;
    }
  }

  const coverage = matched / coreWords.length;

  // Accept partial semantic overlap for verbose phrases like
  // "experience with agile methodologies" when resume contains "agile".
  if (coreWords.length >= 3) {
    return matched >= 2 && coverage >= 0.6;
  }

  return matched >= 1 && coverage >= 0.5;
}

function mergeAndNormalizeKeywords(
  modelKeywordsFound: unknown,
  modelKeywordsMissing: unknown,
  resumeText: string,
  jobTitle?: string,
  jobDescription?: string
): { keywordsFound: string[]; keywordsMissing: string[] } {
  const ctx = createKeywordMatchContext(resumeText);
  const jobContextNormalized = normalizeKeywordText(`${jobTitle || ''} ${jobDescription || ''}`);
  const organizationTerms = extractLikelyOrganizationTerms(jobTitle, jobDescription);

  const found: string[] = [];
  const missing: string[] = [];
  const foundKeys = new Set<string>();
  const missingKeys = new Set<string>();

  const pushFound = (keyword: string) => {
    const display = cleanKeywordCandidate(keyword);
    if (isLikelyNoiseKeyword(display, jobContextNormalized)) return;
    if (isOrganizationLikeKeyword(display, organizationTerms)) return;
    const key = normalizeKeywordText(display);
    if (!display || !key || foundKeys.has(key)) return;
    found.push(display);
    foundKeys.add(key);
    missingKeys.delete(key);
  };

  const pushMissing = (keyword: string) => {
    const display = cleanKeywordCandidate(keyword);
    if (isLikelyNoiseKeyword(display, jobContextNormalized)) return;
    if (isOrganizationLikeKeyword(display, organizationTerms)) return;
    const key = normalizeKeywordText(display);
    if (!display || !key || foundKeys.has(key) || missingKeys.has(key)) return;
    missing.push(display);
    missingKeys.add(key);
  };

  if (Array.isArray(modelKeywordsFound)) {
    for (const keyword of modelKeywordsFound) {
      if (typeof keyword !== 'string') continue;
      for (const candidate of expandKeywordCandidates(keyword)) {
        // Trust-but-verify model "found" keywords with deterministic evidence.
        if (hasKeywordEvidence(candidate, ctx)) {
          pushFound(candidate);
        }
      }
    }
  }

  if (Array.isArray(modelKeywordsMissing)) {
    for (const keyword of modelKeywordsMissing) {
      if (typeof keyword !== 'string') continue;
      for (const candidate of expandKeywordCandidates(keyword)) {
        if (hasKeywordEvidence(candidate, ctx)) {
          pushFound(candidate);
        } else {
          pushMissing(candidate);
        }
      }
    }
  }

  return {
    keywordsFound: found,
    keywordsMissing: missing,
  };
}

function extractJobDescriptionKeywords(jobTitle?: string, jobDescription?: string): string[] {
  const source = `${jobTitle || ''}\n${sanitizeJobDescriptionForAnalysis(jobDescription || '')}`.trim();
  if (!source) return [];

  const normalized = normalizeKeywordText(source);
  const tokens = normalized.split(' ').filter(Boolean);

  const unigramFreq = new Map<string, number>();
  const bigramFreq = new Map<string, number>();

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.length >= 3 && !NLP_STOPWORDS.has(token) && !/^\d+$/.test(token)) {
      unigramFreq.set(token, (unigramFreq.get(token) || 0) + 1);
    }

    if (i < tokens.length - 1) {
      const a = tokens[i];
      const b = tokens[i + 1];
      if (
        a.length >= 3 &&
        b.length >= 3 &&
        !NLP_STOPWORDS.has(a) &&
        !NLP_STOPWORDS.has(b)
      ) {
        const phrase = `${a} ${b}`;
        bigramFreq.set(phrase, (bigramFreq.get(phrase) || 0) + 1);
      }
    }
  }

  const rankedBigrams = Array.from(bigramFreq.entries())
    .filter(([, freq]) => freq >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([phrase]) => phrase);

  const rankedUnigrams = Array.from(unigramFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 16)
    .map(([word]) => word);

  return Array.from(new Set([...rankedBigrams, ...rankedUnigrams]));
}

function sanitizeJobDescriptionForAnalysis(jobDescription: string): string {
  const text = String(jobDescription || '');
  if (!text.trim()) return '';

  const lines = text.split(/\r?\n/);
  const filtered: string[] = [];

  for (const line of lines) {
    const lower = line.toLowerCase().trim();
    if (!lower) continue;

    // Exclude common compensation, legal, and recruiting boilerplate.
    if (
      /salary|annualized|pay range|compensation|bonus|benefits/.test(lower) ||
      /equal opportunity|affirmative action|reasonable accommodation|legally authorized|without regard/.test(lower) ||
      /we are proud|great place to work|about the job|apply now|hiring/.test(lower)
    ) {
      continue;
    }

    filtered.push(line);
  }

  return filtered.join('\n').trim();
}

function generateHeuristicAnalysis(
  resumeText: string,
  jobTitle?: string,
  jobDescription?: string
): ResumeAnalysisResult {
  const jdKeywords = extractJobDescriptionKeywords(jobTitle, jobDescription);
  const keywordAssessment = mergeAndNormalizeKeywords([], jdKeywords, resumeText);
  const sectionAssessment = mergeAndNormalizeSections([], [], resumeText);

  const keywordCoverage = jdKeywords.length
    ? Math.round((keywordAssessment.keywordsFound.length / jdKeywords.length) * 100)
    : 75;
  const structureScore = Math.max(55, 100 - sectionAssessment.sectionsMissing.length * 8);
  const baseScore = Math.round((keywordCoverage + structureScore + 72 + 74 + 73) / 5);

  return {
    overallScore: baseScore,
    atsScore: Math.max(55, Math.min(95, keywordCoverage)),
    atsTips: [
      {
        type: 'good',
        tip: 'Heuristic fallback analysis was used to keep feedback available when AI was unavailable.',
      },
      {
        type: 'bad',
        tip: 'For richer contextual feedback, rerun analysis when AI service is available.',
      },
    ],
    toneStyleScore: 72,
    toneStyleTips: [
      {
        type: 'improve',
        tip: 'Strengthen impact language',
        explanation: 'Use concise action-oriented statements with measurable outcomes where possible.',
      },
    ],
    contentScore: 74,
    contentTips: [
      {
        type: 'improve',
        tip: 'Add more quantified outcomes',
        explanation: 'Include numbers such as percentages, volumes, or timelines to show impact.',
      },
    ],
    structureScore,
    structureTips: [
      {
        type: 'improve',
        tip: 'Keep section structure explicit',
        explanation: 'Use clear headings so ATS systems can parse experience, skills, and education reliably.',
      },
    ],
    skillsScore: 73,
    skillsTips: [
      {
        type: 'improve',
        tip: 'Align skill terms to target role',
        explanation: 'Mirror job-description terminology where it truthfully matches your background.',
      },
    ],
    keywordsFound: keywordAssessment.keywordsFound,
    keywordsMissing: keywordAssessment.keywordsMissing,
    sectionsFound: sectionAssessment.sectionsFound,
    sectionsMissing: sectionAssessment.sectionsMissing,
    modelUsed: 'fallback-heuristic',
  };
}

function applySectionPostProcessing(
  analysis: Record<string, any>,
  resumeText: string,
  jobTitle?: string,
  jobDescription?: string
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

  const { keywordsFound, keywordsMissing } = mergeAndNormalizeKeywords(
    analysis.keywordsFound,
    analysis.keywordsMissing,
    resumeText,
    jobTitle,
    jobDescription
  );

  return {
    overallScore,
    ...analysis,
    atsScore: toSafeScore(analysis.atsScore),
    toneStyleScore: toSafeScore(analysis.toneStyleScore),
    contentScore: toSafeScore(analysis.contentScore),
    structureScore: toSafeScore(analysis.structureScore),
    skillsScore: toSafeScore(analysis.skillsScore),
    keywordsFound,
    keywordsMissing,
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
    safeConsole.log('📄 Starting PDF text extraction...', {
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(2)} KB`,
      fileType: file.type
    });

    // Dynamic import to avoid SSR issues
    const pdfjsLib = await import('pdfjs-dist');
    
    // Disable worker to avoid version mismatch issues - use main thread
    pdfjsLib.GlobalWorkerOptions.workerSrc = '';
    
    safeConsole.log('🔧 PDF.js configured (no worker, main thread mode)');
    safeConsole.log('🔧 PDF.js version:', pdfjsLib.version);

    const arrayBuffer = await file.arrayBuffer();
    
    // Use disableWorker option
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    });
    
    const pdf = await loadingTask.promise;
    
    safeConsole.log(`📖 PDF loaded: ${pdf.numPages} pages`);
    
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
      safeConsole.log(`✓ Extracted page ${i}/${pdf.numPages}`);
    }
    
    safeConsole.log(`✅ PDF extraction complete: ${fullText.length} characters`);
    return fullText;
  } catch (error) {
    safeConsole.error('❌ Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  if (name.endsWith('.pdf') || type.includes('pdf')) {
    return extractTextFromPDF(file);
  }

  if (
    name.endsWith('.docx') ||
    type.includes('wordprocessingml') ||
    type.includes('msword')
  ) {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await mammoth.extractRawText({ buffer });
    return String(result.value || '').trim();
  }

  if (
    name.endsWith('.txt') ||
    type.startsWith('text/') ||
    type.includes('json') ||
    type.includes('xml')
  ) {
    return (await file.text()).trim();
  }

  // Last resort: attempt plain text extraction.
  return (await file.text()).trim();
}

/**
 * Generate embeddings for semantic matching using text-embedding-004
 */
export async function generateEmbedding(
  text: string,
  options?: { apiKey?: string }
): Promise<number[] | null> {
  let apiKey: string;

  try {
    apiKey = resolveGoogleAiStudioApiKey(options?.apiKey);
  } catch (error) {
    safeConsole.error('Google AI Studio API key not configured:', error);
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
      safeConsole.error('Embedding API error:', redactErrorMessage(error));
      return null;
    }

    const data = await response.json();
    return data.embedding?.values || null;
  } catch (error) {
    safeConsole.error('Error generating embedding:', error);
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
  jobDescription?: string,
  overrides?: { temperature?: number; maxOutputTokens?: number; apiKey?: string }
): Promise<ResumeAnalysisResult> {
  const apiKey = resolveGoogleAiStudioApiKey(overrides?.apiKey);

  const sanitizedJobDescription = sanitizeJobDescriptionForAnalysis(jobDescription || '');

  const resumeForPrompt = truncateForPrompt(resumeText, 20000);
  const jdForPrompt = truncateForPrompt(sanitizedJobDescription, 12000);

  const prompt = `You are an expert ATS (Applicant Tracking System) resume analyzer. Analyze the following resume quickly and provide concise, actionable feedback.

${jobTitle ? `Target Job Title: ${jobTitle}` : ''}
${jdForPrompt.value ? `Job Description: ${jdForPrompt.value}` : ''}

Resume Content:
${resumeForPrompt.value}

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

Keyword quality rules:
- Include only actionable, role-relevant capability keywords (skills, tools, methods, domain competencies).
- Exclude company names, product/brand names, URLs/domains, compensation terms, legal text, and generic filler terms.
- Do NOT output recruiting or compensation phrases such as: hiring, salary range, full time, annualized, reasonable accommodation.
- Keep keywords concise (1-3 words), professional, and ATS-relevant.

Important for section detection:
- Treat singular/plural as equivalent (e.g., "Certification" == "Certifications", "Project" == "Projects")
- Recognize common heading variants (e.g., "Professional Experience", "Work Experience")
- Do not mark a section as missing if a clear heading variant exists in the resume text

Provide 3-5 actionable tips per category.`;

  try {
    safeConsole.log(`🚀 Calling Gemini Flash API: ${GEMINI_MODELS.FLASH}`);
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
            temperature: overrides?.temperature ?? 0.2,
            maxOutputTokens: overrides?.maxOutputTokens ?? 3500,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini Flash API error: ${response.statusText} - ${redactErrorMessage(errorText)}`
      );
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string' || !text.trim()) {
      throw new Error('Gemini Flash returned empty response text');
    }
    
    const jsonText = extractJsonObject(text);
    const analysis = JSON.parse(jsonText);
    const postProcessed = applySectionPostProcessing(analysis, resumeText, jobTitle, sanitizedJobDescription);

    safeConsole.log('✅ AI analysis source:', {
      modelUsed: GEMINI_MODELS.FLASH,
      keywordCounts: {
        found: postProcessed.keywordsFound?.length || 0,
        missing: postProcessed.keywordsMissing?.length || 0,
      },
    });

    return {
      ...postProcessed,
      modelUsed: GEMINI_MODELS.FLASH,
    };
  } catch (error) {
    safeConsole.error('Error analyzing with Gemini Flash:', error);
    throw error;
  }
}

/**
 * Analyze resume using Gemini Pro (Deep analysis with premium features)
 */
async function analyzeWithGeminiPro(
  resumeText: string,
  jobTitle?: string,
  jobDescription?: string,
  overrides?: { temperature?: number; maxOutputTokens?: number; apiKey?: string }
): Promise<ResumeAnalysisResult> {
  const apiKey = resolveGoogleAiStudioApiKey(overrides?.apiKey);

  const sanitizedJobDescription = sanitizeJobDescriptionForAnalysis(jobDescription || '');

  const resumeForPrompt = truncateForPrompt(resumeText, 22000);
  const jdForPrompt = truncateForPrompt(sanitizedJobDescription, 14000);

  const prompt = `You are an expert ATS (Applicant Tracking System) resume analyzer performing DEEP, PREMIUM analysis. Provide comprehensive, detailed feedback with advanced insights.

${jobTitle ? `Target Job Title: ${jobTitle}` : ''}
${jdForPrompt.value ? `Job Description: ${jdForPrompt.value}` : ''}

Resume Content:
${resumeForPrompt.value}

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

Keyword quality rules:
- Include only actionable, role-relevant capability keywords (skills, tools, methods, domain competencies).
- Exclude company names, product/brand names, URLs/domains, compensation terms, legal text, and generic filler terms.
- Do NOT output recruiting or compensation phrases such as: hiring, salary range, full time, annualized, reasonable accommodation.
- Keep keywords concise (1-3 words), professional, and ATS-relevant.

Important for section detection:
- Treat singular/plural as equivalent (e.g., "Certification" == "Certifications", "Project" == "Projects")
- Recognize common heading variants (e.g., "Professional Experience", "Work Experience")
- Do not mark a section as missing if a clear heading variant exists in the resume text

Provide 5-8 highly actionable, specific tips per category with examples.`;

  try {
    safeConsole.log(`🚀 Calling Gemini Pro API: ${GEMINI_MODELS.PRO}`);
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
            temperature: overrides?.temperature ?? 0.3,
            maxOutputTokens: overrides?.maxOutputTokens ?? 6000,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Gemini Pro API error: ${response.statusText} - ${redactErrorMessage(errorText)}`
      );
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string' || !text.trim()) {
      throw new Error('Gemini Pro returned empty response text');
    }
    
    const jsonText = extractJsonObject(text);
    const analysis = JSON.parse(jsonText);
    const postProcessed = applySectionPostProcessing(analysis, resumeText, jobTitle, sanitizedJobDescription);

    safeConsole.log('✅ AI analysis source:', {
      modelUsed: GEMINI_MODELS.PRO,
      keywordCounts: {
        found: postProcessed.keywordsFound?.length || 0,
        missing: postProcessed.keywordsMissing?.length || 0,
      },
    });

    return {
      ...postProcessed,
      modelUsed: GEMINI_MODELS.PRO,
    };
  } catch (error) {
    safeConsole.error('Error analyzing with Gemini Pro:', error);
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
  jobDescription?: string,
  options?: { apiKey?: string }
): Promise<ResumeAnalysisResult> {
  const apiKey = resolveGoogleAiStudioApiKey(options?.apiKey);

  try {
    const resumeText = await extractTextFromFile(file);
    
    if (!resumeText || resumeText.trim().length < 100) {
      throw new Error('Could not extract sufficient text from resume');
    }

    // Try Gemini Flash first
    try {
      return await analyzeWithGeminiFlash(resumeText, jobTitle, jobDescription, { apiKey });
    } catch (flashError: any) {
      // If Flash fails due to rate limit or quota, throw to allow fallback
      safeConsole.warn('Gemini Flash failed:', flashError?.message);
      throw flashError;
    }
  } catch (error) {
    safeConsole.error('Error in analyzeResumeFast:', error);
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
  jobDescription?: string,
  options?: { apiKey?: string }
): Promise<ResumeAnalysisResult> {
  const apiKey = resolveGoogleAiStudioApiKey(options?.apiKey);

  try {
    const resumeText = await extractTextFromFile(file);
    
    if (!resumeText || resumeText.trim().length < 100) {
      throw new Error('Could not extract sufficient text from resume');
    }

    return await analyzeWithGeminiPro(resumeText, jobTitle, jobDescription, { apiKey });
  } catch (error) {
    safeConsole.error('Error in analyzeResumePremium:', error);
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
  usePremium: boolean = false,
  options?: { apiKey?: string }
): Promise<ResumeAnalysisResult> {
  const apiKey = resolveGoogleAiStudioApiKey(options?.apiKey);

  try {
    const resumeText = await extractTextFromFile(file);
    
    if (!resumeText || resumeText.trim().length < 100) {
      throw new Error('Could not extract sufficient text from resume');
    }

    // If premium requested, use Pro model directly
    if (usePremium) {
      safeConsole.log('Using Gemini Pro for premium analysis...');
      return await analyzeWithGeminiPro(resumeText, jobTitle, jobDescription, { apiKey });
    }

    // Otherwise, try Flash first for fast analysis
    try {
      safeConsole.log('Using Gemini Flash for fast analysis...');
      return await analyzeWithGeminiFlash(resumeText, jobTitle, jobDescription, { apiKey });
    } catch (flashError: any) {
      // If Flash fails (quota/rate limit), fallback to Pro
      safeConsole.warn('Gemini Flash failed, falling back to Pro:', flashError?.message);
      safeConsole.log('Retrying with Gemini Pro...');
      return await analyzeWithGeminiPro(resumeText, jobTitle, jobDescription, { apiKey });
    }
  } catch (error) {
    safeConsole.error('Error in analyzeResume:', error);
    throw error;
  }
}

/**
 * Analyze resume from text (for re-analysis after editing)
 */
export async function analyzeResumeText(
  resumeText: string,
  jobTitle?: string,
  jobDescription?: string,
  options?: { aiOnly?: boolean; apiKey?: string }
): Promise<ResumeAnalysisResult> {
  const apiKey = resolveGoogleAiStudioApiKey(options?.apiKey);

  if (!resumeText || resumeText.trim().length < 100) {
    throw new Error('Resume text is too short or empty');
  }

  try {
    safeConsole.log('🔄 Analyzing resume text...');
    // Use Flash for fast re-analysis
    try {
      safeConsole.log('Trying Gemini Flash...');
      return await analyzeWithGeminiFlash(resumeText, jobTitle, jobDescription, { apiKey });
    } catch (flashError: any) {
      const flashErrorMessage = formatAiError(flashError);

      // If Flash fails because output is malformed/truncated JSON, retry once with stricter settings.
      if (looksLikeModelOutputOrParseError(flashErrorMessage)) {
        try {
          safeConsole.warn('Gemini Flash returned invalid JSON; retrying with stricter settings...');
          return await analyzeWithGeminiFlash(resumeText, jobTitle, jobDescription, {
            apiKey,
            temperature: 0.2,
            maxOutputTokens: 4500,
          });
        } catch (flashRetryError: any) {
          safeConsole.warn('Gemini Flash retry failed:', formatAiError(flashRetryError));
        }
      }

      // Otherwise fallback to Pro
      safeConsole.warn('Gemini Flash failed, falling back to Pro:', flashErrorMessage);
      safeConsole.log('Retrying with Gemini Pro...');
      try {
        return await analyzeWithGeminiPro(resumeText, jobTitle, jobDescription, { apiKey });
      } catch (proError: any) {
        let proErrorMessage = formatAiError(proError);

        if (looksLikeModelOutputOrParseError(proErrorMessage)) {
          try {
            safeConsole.warn('Gemini Pro returned invalid JSON; retrying with stricter settings...');
            return await analyzeWithGeminiPro(resumeText, jobTitle, jobDescription, {
              apiKey,
              temperature: 0.2,
              maxOutputTokens: 8000,
            });
          } catch (proRetryError: any) {
            proErrorMessage = `${proErrorMessage} | retry: ${formatAiError(proRetryError)}`;
          }
        }

        safeConsole.error('Both Gemini Flash and Pro failed:', proErrorMessage);
        const aiFailureReason = `Flash: ${flashErrorMessage} | Pro: ${proErrorMessage}`;

        if (options?.aiOnly) {
          throw new Error(aiFailureReason);
        }

        safeConsole.warn('Using heuristic analysis fallback...');
        const fallback = generateHeuristicAnalysis(resumeText, jobTitle, jobDescription);
        safeConsole.warn('⚠️ Analysis source:', {
          modelUsed: fallback.modelUsed,
          reason: 'AI models unavailable during re-analysis',
        });
        return {
          ...fallback,
          aiFailureReason,
        };
      }
    }
  } catch (error) {
    safeConsole.error('Error in analyzeResumeText:', error);
    throw error;
  }
}

export async function analyzeResumeWithFallback(
  file: File,
  jobTitle?: string,
  jobDescription?: string,
  usePremium: boolean = false,
  options?: { apiKey?: string }
): Promise<ResumeAnalysisResult> {
  try {
    const aiResult = await analyzeResume(file, jobTitle, jobDescription, usePremium, options);
    safeConsole.log('✅ Analysis source:', {
      modelUsed: aiResult.modelUsed,
      fileName: file.name,
      fallbackUsed: false,
    });
    return aiResult;
  } catch (error) {
    safeConsole.warn('Primary analysis failed, running heuristic fallback:', error);
    try {
      const resumeText = await extractTextFromFile(file);
      if (resumeText && resumeText.trim().length >= 100) {
        const fallback = generateHeuristicAnalysis(resumeText, jobTitle, jobDescription);
        safeConsole.warn('⚠️ Analysis source:', {
          modelUsed: fallback.modelUsed,
          fileName: file.name,
          fallbackUsed: true,
        });
        return {
          ...fallback,
          aiFailureReason: formatAiError(error),
        };
      }
    } catch (extractError) {
      safeConsole.error('Fallback extraction failed:', extractError);
    }

    const fallback = generateHeuristicAnalysis(
      `Resume content unavailable for deep analysis. File: ${file.name}`,
      jobTitle,
      jobDescription
    );
    safeConsole.warn('⚠️ Analysis source:', {
      modelUsed: fallback.modelUsed,
      fileName: file.name,
      fallbackUsed: true,
      reason: 'Resume extraction unavailable',
    });
    return {
      ...fallback,
      aiFailureReason: formatAiError(error),
    };
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
  jobDescription: string,
  options?: { apiKey?: string }
): Promise<string> {
  const apiKey = resolveGoogleAiStudioApiKey(options?.apiKey);

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
      throw new Error(`Gemini API error: ${response.statusText} - ${redactErrorMessage(errorText)}`);
    }

    const data = await response.json();
    const optimizedResume = data.candidates[0].content.parts[0].text.trim();
    
    return optimizedResume;
  } catch (error) {
    safeConsole.error('Error generating optimized resume:', error);
    throw error;
  }
}

/**
 * Re-analyze resume after changes to update scores
 */
export async function reAnalyzeResume(
  resumeText: string,
  jobTitle?: string,
  jobDescription?: string,
  options?: { apiKey?: string }
): Promise<ResumeAnalysisResult> {
  const apiKey = resolveGoogleAiStudioApiKey(options?.apiKey);

  // Use the same analysis function but mark it as re-analysis
  safeConsole.log('Re-analyzing resume with updated content...');
  return await analyzeWithGeminiFlash(resumeText, jobTitle, jobDescription, { apiKey });
}
