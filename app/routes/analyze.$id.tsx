import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { useUser } from "../lib/auth-context";
import type { Route } from "./+types/analyze.$id";
import Navbar from "../components/Navbar";
import ScoreCircle from "../components/ScoreCircle";
import ProtectedRoute from "../components/ProtectedRoute";
import type { Database } from "../../types/database";

type DatabaseResume = Database['public']['Tables']['resumes']['Row'];
type DatabaseAnalysis = Database['public']['Tables']['resume_analysis']['Row'];

type BannerKind = 'success' | 'error' | 'info' | 'warning';
type Banner = {
  kind: BannerKind;
  title: string;
  message?: string;
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resume Analysis - ATSEngine" },
    { name: "description", content: "Review and edit your resume with AI suggestions" },
  ];
}

export default function AnalyzeResume() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [resume, setResume] = useState<DatabaseResume | null>(null);
  const [analysis, setAnalysis] = useState<DatabaseAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<'ats' | 'tone' | 'content' | 'structure' | 'skills'>('ats');
  const [saving, setSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [resumeText, setResumeText] = useState<string>("");
  const [resumeHtml, setResumeHtml] = useState<string>("");
  const [originalHtml, setOriginalHtml] = useState<string>("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [modifiedResumeUrl, setModifiedResumeUrl] = useState<string>("");
  const [hasModifications, setHasModifications] = useState(false);
  const [isSavingToSystem, setIsSavingToSystem] = useState(false);
  const [savedToSystem, setSavedToSystem] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [completedSuggestions, setCompletedSuggestions] = useState<Set<string>>(new Set());
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [showScoreImprovement, setShowScoreImprovement] = useState(false);
  const [banner, setBanner] = useState<Banner | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const bannerTimerRef = useRef<number | null>(null);

  const pushBanner = (next: Banner, options?: { autoDismissMs?: number }) => {
    if (bannerTimerRef.current) {
      window.clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = null;
    }

    setBanner(next);

    if (options?.autoDismissMs) {
      bannerTimerRef.current = window.setTimeout(() => {
        setBanner(null);
        bannerTimerRef.current = null;
      }, options.autoDismissMs);
    }
  };

  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) {
        window.clearTimeout(bannerTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    async function loadResumeAnalysis() {
      if (!id) return;

      try {
        setLoading(true);
        
        const response = await fetch(`/api/analyze?id=${id}`);
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to load resume');
        }
        
        const data = await response.json();
        
        console.log('Resume analysis loaded:', data);
        
        if (!data.resume) {
          setError("Resume not found");
          return;
        }

        setResume(data.resume);
        setAnalysis(data.analysis);
        
        if (data.resumeUrl) {
          setResumeUrl(data.resumeUrl);
          
          // Auto-extract Word documents to HTML for viewing
          if (data.resume.resume_file_name?.endsWith('.docx') || data.resume.resume_file_name?.endsWith('.doc')) {
            await autoExtractWordDocument(data.resumeUrl);
          }
        }
      } catch (err) {
        console.error("Error loading resume:", err);
        setError("Failed to load resume analysis");
      } finally {
        setLoading(false);
      }
    }

    loadResumeAnalysis();
  }, [id]);

  // Auto-extract Word document content when page loads
  const autoExtractWordDocument = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      const mammoth = await import('mammoth');
      const arrayBuffer = await blob.arrayBuffer();
      
      const htmlResult = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Title'] => h1.title:fresh",
            "p[style-name='Subtitle'] => h2.subtitle:fresh",
            "r[style-name='Strong'] => strong:fresh",
            "r[style-name='Emphasis'] => em:fresh",
            "p[style-name='List Paragraph'] => li:fresh"
          ],
          ignoreEmptyParagraphs: false
        }
      );
      
      setOriginalHtml(htmlResult.value);
      setResumeHtml(htmlResult.value);
    } catch (err) {
      console.error('Error auto-extracting Word document:', err);
      // Silently fail, user can still click Edit button to try again
    }
  };



  const extractTextFromWord = async () => {
    if (!resumeUrl) return;
    
    try {
      setIsExtracting(true);
      // Fetch the Word document
      const response = await fetch(resumeUrl);
      const blob = await response.blob();
      
      // Use mammoth.js to extract HTML from Word document with full styling
      const mammoth = await import('mammoth');
      const arrayBuffer = await blob.arrayBuffer();
      
      // Extract HTML with comprehensive style preservation
      const htmlResult = await mammoth.convertToHtml(
        { arrayBuffer },
        {
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Title'] => h1.title:fresh",
            "p[style-name='Subtitle'] => h2.subtitle:fresh",
            "r[style-name='Strong'] => strong:fresh",
            "r[style-name='Emphasis'] => em:fresh",
            "p[style-name='List Paragraph'] => li:fresh"
          ],
          ignoreEmptyParagraphs: false
        }
      );
      
      // Store original HTML for reference and set editable HTML
      setOriginalHtml(htmlResult.value);
      setResumeHtml(htmlResult.value);
      
      setIsEditMode(true);
    } catch (err) {
      console.error('Error extracting text:', err);
      pushBanner(
        {
          kind: 'error',
          title: 'Could not open for editing',
          message: 'This document could not be extracted. You can still view it in the viewer.',
        },
        { autoDismissMs: 6000 }
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      
      // Get the edited HTML content from the contentEditable div
      const editedHtml = editorRef.current?.innerHTML || resumeHtml;
      
      // Update the stored HTML with edits
      setResumeHtml(editedHtml);
      
      // Store the edited HTML - will convert to Word on download
      setHasModifications(true);
      setIsEditMode(false);
      
      // Save the edited resume to the system
      console.log('Saving changes to system...');
      try {
        const saveResponse = await fetch('/api/save-resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            resumeId: id,
            editedHtml: editedHtml,
          }),
        });
        const saveData = await saveResponse.json();
        if (saveResponse.ok && saveData.success) {
          setResume(prev => prev ? {
            ...prev,
            resume_file_url: saveData.resumeFileUrl,
            resume_file_name: saveData.resumeFileName,
          } : null);
          setResumeUrl(saveData.resumeFileUrl);
          setSavedToSystem(true);
          console.log('Resume saved to system');
        } else {
          console.error('Failed to save to system:', saveData.error);
        }
      } catch (saveErr) {
        console.error('Error saving to system:', saveErr);
      }
      
      // Re-analyze the resume with the new content
      console.log('Starting re-analysis...');
      await reAnalyzeEditedResume(editedHtml);
      
      console.log('Save + re-analysis completed.');
    } catch (err) {
      console.error('Error saving changes:', err);
      pushBanner({
        kind: 'error',
        title: 'Save failed',
        message: 'Could not save your edits. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Re-analyze resume after user edits
  const reAnalyzeEditedResume = async (editedHtml: string) => {
    if (!resume || !id) {
      console.warn('Cannot re-analyze: missing resume or id');
      return;
    }

    try {
      setIsReanalyzing(true);
      
      // Extract plain text from HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = editedHtml;
      const extractedText = tempDiv.textContent || tempDiv.innerText || '';

      console.log('Re-analyzing edited resume...');
      console.log('Resume ID:', id);
      console.log('Extracted text length:', extractedText.length);
      console.log('Job title:', resume.job_title);
      console.log('Job description:', resume.job_description?.substring(0, 100) + '...');
      
      // Store previous score for comparison
      const prevScore = resume.overall_score ?? analysis?.ats_score ?? 0;
      console.log('Previous score:', prevScore);
      setPreviousScore(prevScore);

      // Call the re-analysis API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId: id,
          resumeText: extractedText,
          jobDescription: resume.job_description || '',
          jobTitle: resume.job_title || '',
          reanalyze: true,
        }),
      });

      console.log('Re-analysis response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Re-analysis failed:', errorData);
        throw new Error(errorData.error || 'Re-analysis failed');
      }

      const result = await response.json();
      console.log('Re-analysis result:', result);

      if (result.success && result.analysis) {
        console.log('New ATS score:', result.analysis.ats_score);
        console.log('New overall score:', result.resume?.overall_score);
        
        // Compare with previous analysis to find completed suggestions
        const newCompleted = new Set<string>();
        
        // Check which keywords were added
        if (analysis?.keywords_missing && result.analysis.keywords_missing) {
          const previousMissing = analysis.keywords_missing;
          const currentMissing = result.analysis.keywords_missing;
          previousMissing.forEach((keyword: string) => {
            if (!currentMissing.includes(keyword)) {
              newCompleted.add(`keyword:${keyword}`);
              console.log('Added keyword:', keyword);
            }
          });
        }

        // Check which sections were added
        if (analysis?.sections_missing && result.analysis.sections_missing) {
          const previousMissing = analysis.sections_missing;
          const currentMissing = result.analysis.sections_missing;
          previousMissing.forEach((section: string) => {
            if (!currentMissing.includes(section)) {
              newCompleted.add(`section:${section}`);
              console.log('Added section:', section);
            }
          });
        }

        console.log('Completed suggestions:', newCompleted.size);
        setCompletedSuggestions(newCompleted);
        setAnalysis(result.analysis);
        
        // Update resume with new score
        if (result.resume) {
          console.log('Updating resume state with new score:', result.resume.overall_score);
          setResume(result.resume);
        }
        
        // Show score improvement animation
        const newScore = result.resume?.overall_score ?? result.analysis.ats_score ?? 0;
        console.log(`Score comparison: ${prevScore} -> ${newScore}`);
        
        if (newScore > prevScore) {
          console.log('Score improved; showing animation');
          setShowScoreImprovement(true);
          setTimeout(() => setShowScoreImprovement(false), 3000);

          pushBanner(
            {
              kind: 'success',
              title: 'Score improved',
              message: `Your ATS score increased from ${prevScore} to ${newScore}.`,
            },
            { autoDismissMs: 6000 }
          );
        } else if (newScore === prevScore) {
          pushBanner(
            {
              kind: 'info',
              title: 'Changes saved',
              message: 'Your score stayed the same after re-analysis.',
            },
            { autoDismissMs: 5000 }
          );
        } else {
          pushBanner(
            {
              kind: 'success',
              title: 'Changes saved',
              message: 'Your resume was re-analyzed successfully.',
            },
            { autoDismissMs: 5000 }
          );
        }

        console.log('Re-analysis complete');
      } else {
        console.error('No analysis data in result:', result);
      }
    } catch (err) {
      console.error('Error re-analyzing resume:', err);
      pushBanner({
        kind: 'error',
        title: 'Re-analysis failed',
        message: 'Could not re-analyze your resume. Please try again.',
      });
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleMatchResume = async () => {
    if (!resume || !resumeUrl) return;
    
    if (!resume.job_description || !resume.job_title) {
      pushBanner({
        kind: 'warning',
        title: 'Add job details first',
        message: 'Job title and job description are required to match your resume to the role.',
      });
      return;
    }

    try {
      setIsMatching(true);
      let currentResumeText = '';

      if (isEditMode && editorRef.current) {
        currentResumeText = editorRef.current.innerText || '';
      } else if (resumeHtml) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = resumeHtml;
        currentResumeText = tempDiv.textContent || tempDiv.innerText || '';
      }

      if (!currentResumeText.trim()) {
        const response = await fetch(resumeUrl);
        const blob = await response.blob();
        const mammoth = await import('mammoth');
        const arrayBuffer = await blob.arrayBuffer();
        const textResult = await mammoth.extractRawText({ arrayBuffer });
        currentResumeText = textResult.value || '';
      }

      if (!currentResumeText.trim()) {
        throw new Error('Could not extract resume text for matching.');
      }

      const prevScore = resume.overall_score ?? analysis?.ats_score ?? 0;
      setPreviousScore(prevScore);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId: id,
          resumeText: currentResumeText,
          jobDescription: resume.job_description || '',
          jobTitle: resume.job_title || '',
          reanalyze: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update match suggestions');
      }

      const result = await response.json();

      if (!result.success || !result.analysis) {
        throw new Error('No analysis returned from matching');
      }

      setAnalysis(result.analysis);
      if (result.resume) {
        setResume(result.resume);
      }

      setCompletedSuggestions(new Set());

      const newScore = result.resume?.overall_score ?? result.analysis.ats_score ?? 0;
      if (newScore > prevScore) {
        setShowScoreImprovement(true);
        setTimeout(() => setShowScoreImprovement(false), 3000);
      }

      pushBanner(
        {
          kind: 'success',
          title: 'Match suggestions updated',
          message: 'Recommendations were refreshed for this job. Your current resume content was not changed.',
        },
        { autoDismissMs: 7000 }
      );
    } catch (err) {
      console.error('Error matching resume:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      pushBanner({
        kind: 'error',
        title: 'Match analysis failed',
        message: errorMessage,
      });
    } finally {
      setIsMatching(false);
    }
  };

  const handleSaveToSystem = async () => {
    if (!resume || !hasModifications || !resumeHtml) return;

    try {
      setIsSavingToSystem(true);

      const response = await fetch('/api/save-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          resumeId: id,
          editedHtml: resumeHtml,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save resume');
      }

      // Update local state with new file info
      setResume(prev => prev ? {
        ...prev,
        resume_file_url: data.resumeFileUrl,
        resume_file_name: data.resumeFileName,
      } : null);
      setResumeUrl(data.resumeFileUrl);
      setSavedToSystem(true);

      pushBanner(
        {
          kind: 'success',
          title: 'Resume saved',
          message: 'The updated version has been stored in your account.',
        },
        { autoDismissMs: 5000 }
      );
    } catch (err) {
      console.error('Error saving resume to system:', err);
      pushBanner({
        kind: 'error',
        title: 'Save failed',
        message: 'Could not save the resume to your account. Please try again.',
      });
    } finally {
      setIsSavingToSystem(false);
    }
  };

  const handleDownload = async () => {
    if (!resume) return;

    try {
      setIsDownloading(true);
      const { saveAs } = await import('file-saver');
      
      // Always use the professional format endpoint
      const response = await fetch('/api/update-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId: id,
          editedHtml: hasModifications ? resumeHtml : null,
          originalFileName: resume.resume_file_name,
          useOriginal: !hasModifications,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate resume');
      }
      
      const blob = await response.blob();
      const fileName = hasModifications 
        ? resume.resume_file_name.replace(/\.(docx|doc)$/i, '_modified.docx')
        : resume.resume_file_name;
      
      saveAs(blob, fileName);
      
      if (hasModifications) {
        pushBanner(
          {
            kind: 'success',
            title: 'Download started',
            message: 'Your modified resume is downloading.',
          },
          { autoDismissMs: 4000 }
        );
      } else {
        pushBanner(
          {
            kind: 'success',
            title: 'Download started',
            message: 'Your resume is downloading.',
          },
          { autoDismissMs: 4000 }
        );
      }
    } catch (err) {
      console.error("Error downloading:", err);
      pushBanner({
        kind: 'error',
        title: 'Download failed',
        message: 'Could not generate the resume file. Please try again.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-gray-50 relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[url('/images/bg-main.svg')] bg-cover bg-top opacity-40"
          />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-white/70" />

          <div className="relative">
            <Navbar />
            <div className="max-w-3xl mx-auto px-6 py-16">
              <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-2xl p-10 shadow-sm flex flex-col items-center gap-4 text-center">
                <svg className="animate-spin h-10 w-10 text-ink-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <div>
                  <p className="text-lg font-semibold text-ink-900">Loading analysis</p>
                  <p className="text-sm text-ink-500 mt-1">This usually takes a moment.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  if (error || !resume) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-gray-50 relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[url('/images/bg-main.svg')] bg-cover bg-top opacity-40"
          />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-white/70" />

          <div className="relative">
            <Navbar />
            <div className="max-w-3xl mx-auto px-6 py-16">
              <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-2xl p-10 shadow-sm">
                <div className="flex items-start gap-4">
                  <img src="/icons/warning.svg" alt="" aria-hidden className="w-6 h-6 mt-0.5" />
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-ink-900">Couldn’t load this analysis</h2>
                    <p className="text-ink-500 mt-1">{error || "Resume not found"}</p>
                    <div className="mt-6 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition"
                      >
                        Back to dashboard
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const tabs = [
    { id: 'ats' as const, label: 'ATS', score: analysis?.ats_score ?? 0 },
    { id: 'tone' as const, label: 'Tone', score: analysis?.tone_style_score ?? 0 },
    { id: 'content' as const, label: 'Content', score: analysis?.content_score ?? 0 },
    { id: 'structure' as const, label: 'Structure', score: analysis?.structure_score ?? 0 },
    { id: 'skills' as const, label: 'Skills', score: analysis?.skills_score ?? 0 },
  ];

  const getTipsForTab = (): any[] => {
    if (!analysis) return [];
    
    const getTips = (tips: any): any[] => {
      if (!tips) return [];
      if (Array.isArray(tips)) return tips;
      if (typeof tips === 'string') return [{ tip: tips, type: 'improve' }];
      return [];
    };
    
    switch (activeTab) {
      case 'ats':
        return getTips(analysis.ats_tips);
      case 'tone':
        return getTips(analysis.tone_style_tips);
      case 'content':
        return getTips(analysis.content_tips);
      case 'structure':
        return getTips(analysis.structure_tips);
      case 'skills':
        return getTips(analysis.skills_tips);
      default:
        return [];
    }
  };

  const overallScore = resume.overall_score ?? analysis?.ats_score ?? 0;
  const isWordDocument =
    resume.resume_file_name?.toLowerCase().endsWith('.doc') ||
    resume.resume_file_name?.toLowerCase().endsWith('.docx');
  const canEditResume = Boolean(isWordDocument && resumeUrl);

  const scoreMeta =
    overallScore >= 80
      ? { label: 'Strong', iconSrc: '/icons/ats-good.svg' }
      : overallScore >= 60
        ? { label: 'Moderate', iconSrc: '/icons/ats-warning.svg' }
        : { label: 'Needs work', iconSrc: '/icons/ats-bad.svg' };

  const bannerUi =
    banner?.kind === 'success'
      ? {
          containerClass: 'bg-green-50 border-green-200 text-green-900',
          iconSrc: '/icons/check.svg',
        }
      : banner?.kind === 'error'
        ? {
            containerClass: 'bg-red-50 border-red-200 text-red-900',
            iconSrc: '/icons/warning.svg',
          }
        : banner?.kind === 'warning'
          ? {
              containerClass: 'bg-yellow-50 border-yellow-200 text-yellow-900',
              iconSrc: '/icons/warning.svg',
            }
          : banner?.kind === 'info'
            ? {
                containerClass: 'bg-blue-50 border-blue-200 text-blue-900',
                iconSrc: '/icons/info.svg',
              }
            : null;

  const tipsForActiveTab = getTipsForTab();

  const resumeRenderStyles = `
    .resume-content h1 {
      font-size: 1.5em;
      font-weight: 700;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      color: var(--color-ink-900);
    }
    .resume-content h2 {
      font-size: 1.25em;
      font-weight: 700;
      margin-top: 1.2em;
      margin-bottom: 0.4em;
      color: var(--color-ink-700);
    }
    .resume-content h3 {
      font-size: 1.1em;
      font-weight: 600;
      margin-top: 1em;
      margin-bottom: 0.3em;
      color: var(--color-ink-700);
    }
    .resume-content p {
      margin-bottom: 0.75em;
      line-height: 1.6;
      color: var(--color-ink-900);
    }
    .resume-content strong,
    .resume-content b {
      font-weight: 600;
      color: var(--color-ink-900);
    }
    .resume-content em,
    .resume-content i {
      font-style: italic;
    }
    .resume-content ul,
    .resume-content ol {
      margin-left: 1.5em;
      margin-bottom: 0.75em;
    }
    .resume-content li {
      margin-bottom: 0.25em;
      line-height: 1.6;
    }
    .resume-content a {
      color: var(--color-ink-700);
      text-decoration: underline;
    }
  `;

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-50 relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[url('/images/bg-main.svg')] bg-cover bg-top opacity-40"
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-white/70" />

        <div className="relative">
          <Navbar />

          <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-8 lg:py-10 space-y-6">
          {/* Page header */}
          <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="back-button bg-white hover:bg-gray-50 text-ink-700"
                >
                  <img src="/icons/back.svg" alt="" aria-hidden className="w-4 h-4" />
                  <span className="text-sm font-medium">Back</span>
                </button>

                <div className="mt-4 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h1 className="text-2xl font-bold text-ink-900">Resume analysis</h1>
                      <p className="text-sm text-ink-500 mt-1">
                        Turn recommendations into a stronger, job-matched resume.
                      </p>
                    </div>

                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-xs font-semibold text-ink-700">
                      <img src="/icons/pin.svg" alt="" aria-hidden className="w-4 h-4 opacity-80" />
                      <span>Review</span>
                      <span className="text-ink-400">→</span>
                      <span>Edit</span>
                      <span className="text-ink-400">→</span>
                      <span>Re-analyze</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {resume.job_title ? (
                      <span className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-semibold text-ink-700">
                        {resume.job_title}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-semibold text-ink-500">
                        No job title
                      </span>
                    )}
                    {resume.company_name && (
                      <span className="px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-semibold text-ink-700">
                        {resume.company_name}
                      </span>
                    )}
                    <span className="px-3 py-1 rounded-full bg-white/70 border border-gray-200 text-xs font-semibold text-ink-500 truncate max-w-full">
                      {resume.resume_file_name}
                    </span>
                  </div>
                </div>
              </div>

              <div
                className={`rounded-2xl border px-5 py-4 ${getScoreBgColor(overallScore)} ${
                  showScoreImprovement ? 'ring-2 ring-green-200' : ''
                } shadow-sm`}
              >
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex p-2 bg-white/70 border border-gray-200 rounded-2xl">
                    <ScoreCircle score={overallScore} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wider text-ink-500">Overall score</p>
                    <div className="flex flex-wrap items-end gap-2 mt-2">
                      <span className={`text-4xl font-bold leading-none ${getScoreColor(overallScore)}`}>{overallScore}</span>
                      <span className="text-sm text-ink-500 mb-1">/100</span>
                      <span className="mb-1 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/70 border border-gray-200 text-[11px] font-semibold text-ink-700">
                        <img src={scoreMeta.iconSrc} alt="" aria-hidden className="w-4 h-4" />
                        {scoreMeta.label}
                      </span>
                      {isReanalyzing && (
                        <svg className="w-4 h-4 text-ink-400 animate-spin mb-1" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      )}
                    </div>

                    {previousScore !== null && (
                      <p className="text-xs text-ink-500 mt-2">
                        Previous: <span className="font-semibold text-ink-700">{previousScore}</span>
                        {overallScore !== previousScore && (
                          <span
                            className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold ${
                              overallScore > previousScore
                                ? 'bg-green-50 border-green-200 text-green-700'
                                : 'bg-red-50 border-red-200 text-red-700'
                            }`}
                          >
                            {overallScore > previousScore ? `+${overallScore - previousScore}` : `${overallScore - previousScore}`}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between gap-4 mb-3">
                <h3 className="text-sm font-semibold text-ink-700">Score breakdown</h3>
                <p className="text-xs text-ink-500">0–100</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {tabs.map((tab) => {
                  const percent = Math.max(0, Math.min(100, tab.score));

                  return (
                    <div key={tab.id} className="rounded-xl border border-gray-200 bg-white/70 px-4 py-3 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-ink-500">{tab.label}</p>
                        <p className={`text-sm font-bold ${getScoreColor(tab.score)}`}>{tab.score}</p>
                      </div>
                      <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            tab.score >= 80 ? 'bg-green-600' : tab.score >= 60 ? 'bg-yellow-500' : 'bg-red-600'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Banner */}
          {banner && bannerUi && (
            <div
              className={`border rounded-2xl p-4 flex items-start gap-3 shadow-sm animate-slide-in ${bannerUi.containerClass}`}
              role="status"
              aria-live="polite"
            >
              <img src={bannerUi.iconSrc} alt="" aria-hidden className="w-5 h-5 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{banner.title}</p>
                {banner.message && <p className="text-sm mt-0.5 opacity-90">{banner.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => setBanner(null)}
                className="p-1 rounded-lg hover:opacity-70 transition-opacity"
                aria-label="Dismiss notification"
              >
                <img src="/icons/cross.svg" alt="" aria-hidden className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Progress */}
          {completedSuggestions.size > 0 && (
            <div className="bg-green-50 border border-green-200 text-green-900 px-6 py-4 rounded-2xl flex items-start gap-3 shadow-sm animate-fade-in">
              <img src="/icons/check.svg" alt="" aria-hidden className="w-6 h-6 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Nice progress</p>
                <p className="text-sm text-green-700 mt-0.5">
                  You addressed {completedSuggestions.size} suggestion{completedSuggestions.size > 1 ? 's' : ''} since the last analysis.
                </p>
              </div>
            </div>
          )}

          {/* Main content */}
          <div className="grid grid-cols-1 xl:grid-cols-[520px_1fr] gap-6 lg:gap-8">
            {/* Left Side - Recommendations */}
            <aside className="xl:sticky xl:top-24 self-start">
              <div className="bg-white/80 backdrop-blur rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                <div className="px-6 py-5 border-b border-gray-200 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <img src="/icons/pin.svg" alt="" aria-hidden className="w-5 h-5 opacity-80" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-ink-900">Recommendations</h2>
                      <p className="text-sm text-ink-500 mt-1">Pick a category and apply the suggestions.</p>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-xs font-semibold text-ink-700">
                    <span>{tipsForActiveTab.length}</span>
                    <span className="text-ink-400">tips</span>
                  </div>
                </div>

                {/* Category Pills */}
                <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id;

                      return (
                        <button
                          type="button"
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`px-4 py-2 rounded-xl border text-sm font-semibold whitespace-nowrap flex items-center gap-2 transition-colors ${
                            isActive
                              ? 'bg-gray-900 border-gray-900 text-white'
                              : 'bg-white border-gray-200 text-ink-700 hover:bg-gray-50'
                          }`}
                        >
                          <span>{tab.label}</span>
                          <span className={`text-xs font-bold ${isActive ? 'text-white' : getScoreColor(tab.score)}`}>{tab.score}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tips Content */}
                <div className="p-6">
                  {tipsForActiveTab.length > 0 ? (
                    <div className="space-y-4">
                      {tipsForActiveTab.map((tip: any, index: number) => (
                        <div
                          key={index}
                          className={`p-5 rounded-xl border bg-white/70 backdrop-blur transition-colors ${
                            tip.type === 'good' ? 'border-gray-200 border-l-4 border-l-green-500' : 'border-gray-200 border-l-4 border-l-amber-500'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`flex-shrink-0 mt-0.5 p-2 rounded-lg ${
                                tip.type === 'good' ? 'bg-green-100' : 'bg-yellow-100'
                              }`}
                            >
                              {tip.type === 'good' ? (
                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>

                            <div className="flex-1">
                              <p className="font-semibold text-ink-900 leading-relaxed">{typeof tip === 'string' ? tip : tip.tip}</p>
                              {tip.explanation && (
                                <p className="text-sm text-ink-500 mt-2 leading-relaxed">{tip.explanation}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <img src="/icons/info.svg" alt="" aria-hidden className="mx-auto w-10 h-10 opacity-70" />
                      <p className="mt-4 text-ink-500">No suggestions available for this category.</p>
                    </div>
                  )}

                  {/* Keywords Section */}
                  {activeTab === 'ats' && analysis && (
                    <div className="mt-6 space-y-4">
                      {analysis.keywords_found && analysis.keywords_found.length > 0 && (
                        <div className="p-5 bg-green-50 border border-green-200 rounded-xl">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-green-100 rounded-lg">
                              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <h3 className="font-bold text-green-900">Keywords Found</h3>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {analysis.keywords_found.map((keyword: string, idx: number) => (
                              <span key={idx} className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-semibold shadow-sm hover:bg-green-200 transition-colors">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {analysis.keywords_missing && analysis.keywords_missing.length > 0 && (
                        <div className="p-5 bg-red-50 border border-red-200 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-red-100 rounded-lg">
                              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <h3 className="font-bold text-red-900">Missing Keywords</h3>
                          </div>
                          <p className="text-sm text-red-700 mb-3">Add these terms to improve ATS matching.</p>
                          <div className="flex flex-wrap gap-2">
                            {analysis.keywords_missing.map((keyword: string, idx: number) => {
                              const isCompleted = completedSuggestions.has(`keyword:${keyword}`);
                              return (
                                <span
                                  key={idx}
                                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${
                                    isCompleted 
                                      ? 'bg-green-100 text-green-800 border-2 border-green-300 line-through' 
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {isCompleted && (
                                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                  {keyword}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sections Section */}
                  {activeTab === 'structure' && analysis && (
                    <div className="mt-6 space-y-4">
                      {analysis.sections_found && analysis.sections_found.length > 0 && (
                        <div className="p-5 bg-green-50 border border-green-200 rounded-xl">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-green-100 rounded-lg">
                              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <h3 className="font-bold text-green-900">Sections Found</h3>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {analysis.sections_found.map((section: string, idx: number) => (
                              <span key={idx} className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-semibold shadow-sm hover:bg-green-200 transition-colors">
                                {section}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {analysis.sections_missing && analysis.sections_missing.length > 0 && (
                        <div className="p-5 bg-red-50 border border-red-200 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-red-100 rounded-lg">
                              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <h3 className="font-bold text-red-900">Missing Sections</h3>
                          </div>
                          <p className="text-sm text-red-700 mb-3">Add these sections to strengthen structure and readability.</p>
                          <div className="flex flex-wrap gap-2">
                            {analysis.sections_missing.map((section: string, idx: number) => {
                              const isCompleted = completedSuggestions.has(`section:${section}`);
                              return (
                                <span
                                  key={idx}
                                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${
                                    isCompleted
                                      ? 'bg-green-100 text-green-800 border-2 border-green-300 line-through'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {isCompleted && (
                                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                  {section}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </aside>

            {/* Right Side - Resume Viewer */}
            <section className="bg-white/80 backdrop-blur rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
              <div className="px-6 py-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-ink-900">Resume</h2>
                  <div className="flex items-center gap-2 mt-1 min-w-0">
                    <p className="text-sm text-ink-500 truncate">{resume.resume_file_name}</p>
                    {isEditMode ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700 text-[11px] font-semibold">
                        Editing
                      </span>
                    ) : hasModifications ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-green-200 bg-green-50 text-green-700 text-[11px] font-semibold">
                        {savedToSystem ? 'Saved' : 'Edited'}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {!isEditMode ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (!canEditResume) {
                          pushBanner(
                            {
                              kind: 'info',
                              title: 'Editing is limited to Word documents',
                              message: 'Upload a .doc/.docx resume to enable in-browser editing.',
                            },
                            { autoDismissMs: 6000 }
                          );
                          return;
                        }
                        extractTextFromWord();
                      }}
                      disabled={isExtracting}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm flex items-center gap-2 border ${
                        canEditResume
                          ? 'bg-gray-900 text-white border-gray-900 hover:bg-gray-800'
                          : 'bg-gray-100 text-ink-500 border-gray-200'
                      } ${isExtracting ? 'opacity-50' : ''}`}
                      title={!canEditResume ? 'Editing is available for Word documents (.doc/.docx) only' : ''}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      {isExtracting ? 'Loading...' : 'Edit'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditMode(false)}
                      className="px-4 py-2 bg-gray-100 text-ink-700 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200 text-sm flex items-center gap-2 border border-gray-200"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      View
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleMatchResume}
                    disabled={isMatching || !resume.job_description || !resume.job_title}
                    className="px-4 py-2 bg-white text-ink-900 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm border border-gray-200"
                    title={!resume.job_description || !resume.job_title ? 'Job title and description are required' : ''}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {isMatching ? 'Matching...' : 'Match to job'}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 flex items-center gap-2 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    {isDownloading ? 'Downloading...' : 'Download'}
                  </button>
                </div>
              </div>

              <div className="p-6">
                {resumeUrl ? (
                  <div className="relative">
                    <style>{resumeRenderStyles}</style>

                    {/* Loading Overlay for Auto-Match */}
                    {isMatching && (
                      <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-2xl">
                        <div className="text-center space-y-4">
                          <div className="relative">
                            <svg className="animate-spin h-16 w-16 text-green-600 mx-auto" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-ink-900 mb-2">Analyzing job match</h3>
                            <p className="text-ink-500">Refreshing recommendations for this role…</p>
                            <p className="text-sm text-ink-400 mt-2">This usually takes 10–15 seconds</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {isEditMode ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            <span className="text-sm font-semibold text-amber-900">Edit mode (formatting preserved)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setIsEditMode(false)}
                              className="px-4 py-2 bg-gray-200 text-ink-700 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200 text-sm"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveChanges}
                              disabled={saving || isReanalyzing}
                              className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-all duration-200 disabled:opacity-50 text-sm flex items-center gap-2"
                            >
                              {isReanalyzing ? (
                                <>
                                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                  </svg>
                                  Re-analyzing...
                                </>
                              ) : saving ? (
                                <>
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Save & Re-analyze
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        <div
                          ref={editorRef}
                          contentEditable
                          suppressContentEditableWarning
                          className="w-full h-[70vh] min-h-[600px] overflow-y-auto p-8 border-2 border-amber-200 rounded-2xl shadow-inner focus:border-amber-400 focus:ring-2 focus:ring-amber-200 focus:outline-none bg-white custom-scrollbar"
                          style={{
                            fontFamily: 'Calibri, Arial, sans-serif',
                            fontSize: '11pt',
                            lineHeight: '1.5',
                            color: 'var(--color-ink-900)',
                          }}
                          dangerouslySetInnerHTML={{ __html: resumeHtml }}
                        />
                      </div>
                    ) : (
                      <>
                        {hasModifications && resumeHtml ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span className="text-sm font-medium text-green-900">
                                  {savedToSystem ? 'Saved to your account' : 'Viewing modified resume'}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setHasModifications(false);
                                  setSavedToSystem(false);
                                  if (modifiedResumeUrl) {
                                    URL.revokeObjectURL(modifiedResumeUrl);
                                    setModifiedResumeUrl('');
                                  }
                                }}
                                className="text-xs text-green-700 hover:text-green-900 font-medium underline"
                              >
                                View original
                              </button>
                            </div>

                            <div className="w-full h-[70vh] min-h-[600px] overflow-y-auto bg-gray-50 border border-gray-200 rounded-2xl custom-scrollbar">
                              <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm my-6 p-6 sm:p-12">
                                <div className="resume-content" dangerouslySetInnerHTML={{ __html: resumeHtml }} />
                              </div>
                            </div>
                          </div>
                        ) : isWordDocument ? (
                          resumeHtml ? (
                            <div className="w-full h-[70vh] min-h-[600px] overflow-y-auto bg-gray-50 border border-gray-200 rounded-2xl custom-scrollbar">
                              <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm my-6 p-6 sm:p-12">
                                <div className="resume-content" dangerouslySetInnerHTML={{ __html: resumeHtml }} />
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-[70vh] min-h-[600px] border-2 border-gray-200 rounded-2xl flex items-center justify-center bg-gray-50">
                              <div className="text-center space-y-4">
                                <svg className="mx-auto h-12 w-12 text-ink-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-ink-500">Loading document…</p>
                              </div>
                            </div>
                          )
                        ) : (
                          <iframe
                            src={resumeUrl}
                            className="w-full h-[70vh] min-h-[600px] bg-white border border-gray-200 rounded-2xl shadow-sm"
                            title="Resume Viewer"
                          />
                        )}
                      </>
                    )}

                    <div className="mt-5 p-5 bg-white/70 backdrop-blur border border-gray-200 rounded-xl shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                          <img src="/icons/info.svg" alt="" aria-hidden className="w-5 h-5 opacity-70" />
                        </div>
                        <div>
                          <p className="font-semibold text-ink-700 mb-1">Pro Tip</p>
                          <p className="text-sm text-ink-500 leading-relaxed">
                            {isEditMode
                              ? 'Make your changes in the editor above and click "Save & Re-analyze" when done.'
                              : hasModifications
                                ? 'You\'re viewing an edited version. Download to get the latest file, or click “Edit” to keep refining.'
                                : 'Click “Edit” to adjust your resume, or review the recommendations on the left.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-[70vh] min-h-[600px] border-2 border-gray-200 rounded-2xl flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="mt-2 text-ink-500">Loading resume…</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
