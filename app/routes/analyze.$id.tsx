import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { useUser } from "@clerk/clerk-react";
import type { Route } from "./+types/analyze.$id";
import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import { getResumeWithAnalysis, updateResumeStatus } from "../lib/database";
import { getSignedResumeUrl } from "../lib/storage";
import type { Database } from "../../types/database";

type DatabaseResume = Database['public']['Tables']['resumes']['Row'];
type DatabaseAnalysis = Database['public']['Tables']['resume_analysis']['Row'];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Resume Analysis - ATSChecker" },
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
  const [resumeUrl, setResumeUrl] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [resumeText, setResumeText] = useState<string>("");
  const [resumeHtml, setResumeHtml] = useState<string>("");
  const [originalHtml, setOriginalHtml] = useState<string>("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [modifiedResumeUrl, setModifiedResumeUrl] = useState<string>("");
  const [hasModifications, setHasModifications] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadResumeAnalysis() {
      if (!id) return;

      try {
        setLoading(true);
        const data = await getResumeWithAnalysis(id);
        
        console.log('📄 Resume analysis loaded:', data);
        
        if (!data.resume) {
          setError("Resume not found");
          return;
        }

        setResume(data.resume);
        setAnalysis(data.analysis);
        
        // Get signed URL for private bucket access
        if (data.resume.resume_file_url) {
          // Try to extract the storage path from various URL formats
          let filePath = '';
          
          // Format 1: Full URL with /storage/v1/object/public/resumes/
          if (data.resume.resume_file_url.includes('/storage/v1/object/public/resumes/')) {
            filePath = data.resume.resume_file_url.split('/storage/v1/object/public/resumes/')[1];
          }
          // Format 2: Full URL with /resumes/
          else if (data.resume.resume_file_url.includes('/resumes/')) {
            filePath = data.resume.resume_file_url.split('/resumes/')[1];
          }
          // Format 3: Just the path (userId/filename)
          else {
            filePath = data.resume.resume_file_url;
          }
          
          console.log('📁 Extracted file path:', filePath);
          console.log('🔗 Original URL:', data.resume.resume_file_url);
          
          if (filePath) {
            const signedUrl = await getSignedResumeUrl(filePath, 3600); // 1 hour expiry
            console.log('🔐 Generated signed URL:', signedUrl);
            
            if (signedUrl) {
              setResumeUrl(signedUrl);
            } else {
              console.warn('⚠️ Failed to generate signed URL, using original URL');
              setResumeUrl(data.resume.resume_file_url);
            }
          } else {
            console.warn('⚠️ Could not extract file path, using original URL');
            setResumeUrl(data.resume.resume_file_url);
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
      alert('Failed to extract text from document. You can still view it in the viewer.');
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
      
      // Create a complete HTML document for conversion to Word
      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Calibri, Arial, sans-serif;
              font-size: 11pt;
              line-height: 1.5;
              color: #000000;
              margin: 1in;
            }
            h1 {
              font-size: 16pt;
              font-weight: bold;
              margin-top: 12pt;
              margin-bottom: 6pt;
            }
            h2 {
              font-size: 14pt;
              font-weight: bold;
              margin-top: 12pt;
              margin-bottom: 6pt;
            }
            h3 {
              font-size: 12pt;
              font-weight: bold;
              margin-top: 10pt;
              margin-bottom: 4pt;
            }
            p {
              margin-top: 0;
              margin-bottom: 8pt;
            }
            ul, ol {
              margin-left: 0.5in;
              margin-bottom: 8pt;
            }
            li {
              margin-bottom: 4pt;
            }
            strong, b {
              font-weight: bold;
            }
            em, i {
              font-style: italic;
            }
          </style>
        </head>
        <body>
          ${editedHtml}
        </body>
        </html>
      `;
      
      // Convert HTML to Word document using html-docx-js
      const htmlDocx = await import('html-docx-js-typescript');
      const docBlob = await htmlDocx.asBlob(fullHtml);
      
      // Create URL for the modified document
      const url = URL.createObjectURL(docBlob);
      
      // Clean up old modified URL if it exists
      if (modifiedResumeUrl) {
        URL.revokeObjectURL(modifiedResumeUrl);
      }
      
      setModifiedResumeUrl(url);
      setHasModifications(true);
      setIsEditMode(false);
      
      alert('✅ Changes saved! The viewer now shows your updated resume.');
    } catch (err) {
      console.error('Error saving changes:', err);
      alert('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!resume) return;

    try {
      setSaving(true);
      
      // If there are modifications, download the modified version
      if (hasModifications && modifiedResumeUrl) {
        const { saveAs } = await import('file-saver');
        const response = await fetch(modifiedResumeUrl);
        const blob = await response.blob();
        
        // Use original filename or create a new one
        const fileName = resume.resume_file_name.replace('.docx', '_edited.docx').replace('.doc', '_edited.doc');
        saveAs(blob, fileName);
        
        alert('✅ Modified resume downloaded successfully!');
      } else {
        // Download the original file
        if (!resumeUrl) return;
        
        const link = document.createElement('a');
        link.href = resumeUrl;
        link.download = resume.resume_file_name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert('✅ Resume download started!');
      }
    } catch (err) {
      console.error("Error downloading:", err);
      alert("Failed to download resume. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
          <Navbar />
          <div className="flex justify-center items-center h-[80vh]">
            <div className="flex flex-col items-center gap-4">
              <svg className="animate-spin h-12 w-12 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-600">Loading analysis...</p>
            </div>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  if (error || !resume) {
    return (
      <ProtectedRoute>
        <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
          <Navbar />
          <div className="main-section py-20">
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-red-800 mb-2">Error</h2>
                <p className="text-red-600 mb-6">{error || "Resume not found"}</p>
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
                >
                  Go Back Home
                </button>
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
    { id: 'ats' as const, label: 'ATS Score', score: analysis?.ats_score },
    { id: 'tone' as const, label: 'Tone & Style', score: analysis?.tone_style_score },
    { id: 'content' as const, label: 'Content', score: analysis?.content_score },
    { id: 'structure' as const, label: 'Structure', score: analysis?.structure_score },
    { id: 'skills' as const, label: 'Skills', score: analysis?.skills_score },
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

  return (
    <ProtectedRoute>
      <main className="bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 min-h-screen">
        <Navbar />
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-sm mt-6">
          <div className="max-w-[1800px] mx-auto px-6 py-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white">Resume Analysis</h1>
                  {resume.job_title && (
                    <>
                      <span className="text-white/60 mx-1">•</span>
                      <span className="text-white/90 text-sm font-medium">{resume.job_title}</span>
                    </>
                  )}
                  {resume.company_name && (
                    <>
                      <span className="text-white/60 mx-1">•</span>
                      <span className="text-white/90 text-sm font-medium">{resume.company_name}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/30">
                  <span className="text-sm text-white/80 font-medium">Score:</span>
                  <span className="text-2xl font-bold text-white">{resume.overall_score || 0}</span>
                </div>
                <button
                  onClick={handleDownload}
                  disabled={saving}
                  className="px-5 py-2 bg-white text-purple-600 rounded-xl font-semibold hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex items-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {saving ? 'Downloading...' : 'Download'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1800px] mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-[520px_1fr] gap-10">
            
            {/* Left Side - AI Suggestions */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden sticky top-24 border border-gray-100 hover:shadow-3xl transition-shadow duration-300">
                <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-rose-500 px-7 py-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">AI Suggestions</h2>
                      <p className="text-purple-100 text-sm mt-0.5">Review and apply improvements</p>
                    </div>
                  </div>
                </div>
                
                {/* Score Tabs */}
                <div className="border-b border-gray-100 bg-gray-50/50">
                  <div className="flex overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 px-4 py-5 text-sm font-semibold whitespace-nowrap transition-all duration-200 relative group ${
                          activeTab === tab.id
                            ? 'text-purple-600 bg-white'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-xs uppercase tracking-wider">{tab.label}</span>
                          <span className={`text-2xl font-bold ${getScoreColor(tab.score || 0)}`}>
                            {tab.score || 0}
                          </span>
                        </div>
                        {activeTab === tab.id && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-pink-500 rounded-t-full" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tips Content */}
                <div className="p-7 max-h-[650px] overflow-y-auto custom-scrollbar">
                  {getTipsForTab().length > 0 ? (
                    <div className="space-y-4">
                      {getTipsForTab().map((tip: any, index: number) => (
                        <div
                          key={index}
                          className={`p-5 rounded-xl border-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg group ${
                            tip.type === 'good'
                              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:border-green-300'
                              : 'bg-gradient-to-br from-amber-50 to-yellow-50 border-yellow-200 hover:border-yellow-300'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`flex-shrink-0 mt-0.5 p-2 rounded-lg ${
                              tip.type === 'good' ? 'bg-green-100' : 'bg-yellow-100'
                            }`}>
                              {tip.type === 'good' ? (
                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 leading-relaxed">
                                {typeof tip === 'string' ? tip : tip.tip}
                              </p>
                              {tip.explanation && (
                                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{tip.explanation}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="mt-4 text-gray-600">No suggestions available for this category</p>
                    </div>
                  )}

                  {/* Keywords Section */}
                  {activeTab === 'ats' && analysis && (
                    <div className="mt-6 space-y-4">
                      {analysis.keywords_found && analysis.keywords_found.length > 0 && (
                        <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-sm">
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
                        <div className="p-5 bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-xl shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-red-100 rounded-lg">
                              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <h3 className="font-bold text-red-900">Missing Keywords</h3>
                          </div>
                          <p className="text-sm text-red-700 mb-3">💡 Consider adding these to improve ATS score</p>
                          <div className="flex flex-wrap gap-2">
                            {analysis.keywords_missing.map((keyword: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sections Section */}
                  {activeTab === 'structure' && analysis && (
                    <div className="mt-6 space-y-4">
                      {analysis.sections_found && analysis.sections_found.length > 0 && (
                        <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-sm">
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
                        <div className="p-5 bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-xl shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-red-100 rounded-lg">
                              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <h3 className="font-bold text-red-900">Missing Sections</h3>
                          </div>
                          <p className="text-sm text-red-700 mb-3">📝 Add these to strengthen your resume</p>
                          <div className="flex flex-wrap gap-2">
                            {analysis.sections_missing.map((section: string, idx: number) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
                              >
                                {section}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - Resume Viewer */}
            <div className="space-y-6">
              {/* Document Viewer */}
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 px-7 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Your Resume</h2>
                        <p className="text-blue-100 text-sm mt-0.5 truncate max-w-md">{resume?.resume_file_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isEditMode ? (
                        <button
                          onClick={extractTextFromWord}
                          disabled={isExtracting}
                          className="px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-all duration-200 disabled:opacity-50 text-sm flex items-center gap-2 border border-white/30"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          {isExtracting ? 'Loading...' : 'Edit'}
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsEditMode(false)}
                          className="px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-all duration-200 text-sm flex items-center gap-2 border border-white/30"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </button>
                      )}
                      <button
                        onClick={handleDownload}
                        disabled={saving}
                        className="px-5 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 text-sm flex items-center gap-2 group"
                      >
                        <svg className="w-4 h-4 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {saving ? 'Downloading...' : 'Download'}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-7">
                  {resumeUrl ? (
                    <div className="relative">
                      {isEditMode ? (
                        // Edit Mode - Editable textarea
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span className="text-sm font-semibold text-amber-900">Edit Mode - Click on text to edit (formatting preserved)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setIsEditMode(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200 text-sm"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveChanges}
                                disabled={saving}
                                className="px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-all duration-200 disabled:opacity-50 text-sm flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {saving ? 'Saving...' : 'Save Changes'}
                              </button>
                            </div>
                          </div>
                          <div 
                            ref={editorRef}
                            contentEditable
                            suppressContentEditableWarning
                            className="w-full h-[850px] overflow-y-auto p-8 border-2 border-amber-200 rounded-2xl shadow-inner focus:border-amber-400 focus:ring-2 focus:ring-amber-200 focus:outline-none bg-white custom-scrollbar"
                            style={{
                              fontFamily: 'Calibri, Arial, sans-serif',
                              fontSize: '11pt',
                              lineHeight: '1.5',
                              color: '#1f2937'
                            }}
                            dangerouslySetInnerHTML={{ __html: resumeHtml }}
                          />
                        </div>
                      ) : (
                        // View Mode - Show modified or original document
                        <>
                          {hasModifications && resumeHtml ? (
                            // Show modified document as formatted HTML
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-sm font-medium text-green-900">Viewing modified resume</span>
                                </div>
                                <button
                                  onClick={() => {
                                    setHasModifications(false);
                                    if (modifiedResumeUrl) {
                                      URL.revokeObjectURL(modifiedResumeUrl);
                                      setModifiedResumeUrl("");
                                    }
                                  }}
                                  className="text-xs text-green-700 hover:text-green-900 font-medium underline"
                                >
                                  View Original
                                </button>
                              </div>
                              <div className="w-full h-[870px] overflow-y-auto bg-white border-2 border-gray-100 rounded-2xl shadow-inner custom-scrollbar">
                                <div className="max-w-4xl mx-auto bg-white p-12">
                                  <style>{`
                                    .resume-content h1 {
                                      font-size: 1.5em;
                                      font-weight: bold;
                                      margin-top: 1.5em;
                                      margin-bottom: 0.5em;
                                      color: #1f2937;
                                    }
                                    .resume-content h2 {
                                      font-size: 1.25em;
                                      font-weight: bold;
                                      margin-top: 1.2em;
                                      margin-bottom: 0.4em;
                                      color: #374151;
                                    }
                                    .resume-content h3 {
                                      font-size: 1.1em;
                                      font-weight: 600;
                                      margin-top: 1em;
                                      margin-bottom: 0.3em;
                                      color: #4b5563;
                                    }
                                    .resume-content p {
                                      margin-bottom: 0.75em;
                                      line-height: 1.6;
                                      color: #1f2937;
                                    }
                                    .resume-content strong, .resume-content b {
                                      font-weight: 600;
                                      color: #111827;
                                    }
                                    .resume-content em, .resume-content i {
                                      font-style: italic;
                                    }
                                    .resume-content ul, .resume-content ol {
                                      margin-left: 1.5em;
                                      margin-bottom: 0.75em;
                                    }
                                    .resume-content li {
                                      margin-bottom: 0.25em;
                                      line-height: 1.6;
                                    }
                                    .resume-content a {
                                      color: #2563eb;
                                      text-decoration: underline;
                                    }
                                  `}</style>
                                  <div 
                                    className="resume-content"
                                    dangerouslySetInnerHTML={{ __html: resumeHtml }}
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            // Show original document
                            (resume?.resume_file_name?.endsWith('.doc') || resume?.resume_file_name?.endsWith('.docx')) ? (
                              <iframe
                                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(resumeUrl)}`}
                                className="w-full h-[900px] border-2 border-gray-100 rounded-2xl shadow-inner"
                                title="Resume Viewer"
                              />
                            ) : (
                              <iframe
                                src={resumeUrl}
                                className="w-full h-[900px] border-2 border-gray-100 rounded-2xl shadow-inner"
                                title="Resume Viewer"
                              />
                            )
                          )}
                        </>
                      )}
                      <div className="mt-5 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-blue-900 mb-1">Pro Tip</p>
                            <p className="text-sm text-blue-800 leading-relaxed">
                              {isEditMode 
                                ? 'Make your changes in the editor above and click "Save Changes" when done. Your edits will be shown in the viewer and included in downloads.'
                                : hasModifications
                                ? 'Your modifications are saved! You\'re now viewing the edited resume. Download to get the modified version, or click "Edit" to make more changes.'
                                : 'Click the "Edit" button above to make changes directly, or review the AI suggestions on the left panel.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-[900px] border-2 border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="mt-2 text-gray-600">Loading resume...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
