import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useUser } from "@clerk/clerk-react";
import type { Route } from "./+types/analyze.$id";
import Navbar from "../components/Navbar";
import ProtectedRoute from "../components/ProtectedRoute";
import { getResumeWithAnalysis, updateResumeStatus } from "../lib/database";
import { getSignedResumeUrl } from "../lib/storage";
import { extractTextFromPDF } from "../lib/ai-analyzer";
import type { Database } from "../../types/database";
import { jsPDF } from "jspdf";

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
  const [editedContent, setEditedContent] = useState("");
  const [activeTab, setActiveTab] = useState<'ats' | 'tone' | 'content' | 'structure' | 'skills'>('ats');
  const [saving, setSaving] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string>("");
  const [extracting, setExtracting] = useState(false);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [extractionError, setExtractionError] = useState<string>("");

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
              // Download and extract text from PDF
              await extractPDFText(signedUrl);
            } else {
              console.warn('⚠️ Failed to generate signed URL, trying with original URL');
              setResumeUrl(data.resume.resume_file_url);
              await extractPDFText(data.resume.resume_file_url);
            }
          } else {
            console.warn('⚠️ Could not extract file path, trying with original URL');
            setResumeUrl(data.resume.resume_file_url);
            await extractPDFText(data.resume.resume_file_url);
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

  const extractPDFText = async (url: string) => {
    try {
      setExtracting(true);
      setExtractionError("");
      console.log('📄 Fetching PDF from URL:', url);
      
      // Fetch the PDF file with no-cors mode
      const response = await fetch(url, { 
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('📦 Blob created:', blob.size, 'bytes');
      
      const file = new File([blob], resume?.resume_file_name || 'resume.pdf', { type: 'application/pdf' });
      setOriginalFile(file);
      
      // Extract text
      console.log('📝 Extracting text from PDF...');
      const text = await extractTextFromPDF(file);
      
      if (text && text.trim()) {
        setEditedContent(text);
        console.log('✅ PDF text extracted successfully:', text.length, 'characters');
      } else {
        console.warn('⚠️ Extracted text is empty');
        setEditedContent('');
        setExtractionError('PDF text extraction returned empty content. Please upload your PDF again or paste content manually.');
      }
    } catch (err) {
      console.error('❌ Error extracting PDF text:', err);
      setExtractionError('Failed to extract text from PDF. Please upload your resume again or paste the content manually.');
      // Start with empty content instead of error message
      setEditedContent('');
    } finally {
      setExtracting(false);
    }
  };

  const handleManualFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file');
      return;
    }

    try {
      setExtracting(true);
      setExtractionError("");
      setOriginalFile(file);
      
      const text = await extractTextFromPDF(file);
      if (text && text.trim()) {
        setEditedContent(text);
        setExtractionError("");
      } else {
        setExtractionError('Could not extract text from PDF. Please try copying and pasting your resume content.');
      }
    } catch (err) {
      console.error('Error extracting PDF:', err);
      setExtractionError('Failed to extract text. Please paste your resume content manually.');
    } finally {
      setExtracting(false);
    }
  };

  const applySuggestion = (suggestion: string) => {
    setEditedContent(prev => {
      // If content is empty or just whitespace, start fresh
      if (!prev || prev.trim() === '') {
        return suggestion;
      }
      
      // Check if it's a keyword suggestion
      if (suggestion.toLowerCase().includes('add keyword:') || suggestion.toLowerCase().includes('missing keyword:')) {
        const keyword = suggestion.split(':')[1]?.trim() || suggestion;
        
        // Look for skills section
        const skillsMatch = prev.match(/(skills|technical skills|core competencies)[:\s]*[\n\r]+/i);
        if (skillsMatch && skillsMatch.index !== undefined) {
          const insertPos = skillsMatch.index + skillsMatch[0].length;
          return prev.slice(0, insertPos) + `• ${keyword}\n` + prev.slice(insertPos);
        }
        
        // If no skills section, add to the end
        return prev + `\n\nAdditional Skill: ${keyword}`;
      }
      
      // For section suggestions
      if (suggestion.toLowerCase().includes('add section:') || suggestion.toLowerCase().includes('missing section:')) {
        return prev + `\n\n--- ${suggestion} ---\n[Add content here]\n`;
      }
      
      // For tone/grammar suggestions, add as a note at the top
      if (suggestion.toLowerCase().includes('tone') || suggestion.toLowerCase().includes('grammar') || 
          suggestion.toLowerCase().includes('passive voice') || suggestion.toLowerCase().includes('special characters')) {
        return `[NOTE: ${suggestion}]\n\n${prev}`;
      }
      
      // Default: append at the end
      return prev + `\n\n${suggestion}`;
    });
    
    // Show visual feedback
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.focus();
      // Flash the textarea border
      textarea.classList.add('ring-2', 'ring-green-500');
      setTimeout(() => {
        textarea.classList.remove('ring-2', 'ring-green-500');
      }, 1000);
    }
  };

  const handleSaveAndDownload = async () => {
    if (!resume) return;

    try {
      setSaving(true);
      
      // Create PDF from edited content using jsPDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margins = { top: 20, bottom: 20, left: 15, right: 15 };
      const maxWidth = pageWidth - margins.left - margins.right;
      
      // Set font
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      
      // Split content into lines that fit the page width
      const lines = doc.splitTextToSize(editedContent, maxWidth);
      
      let y = margins.top;
      const lineHeight = 6;
      
      for (let i = 0; i < lines.length; i++) {
        // Check if we need a new page
        if (y + lineHeight > pageHeight - margins.bottom) {
          doc.addPage();
          y = margins.top;
        }
        
        doc.text(lines[i], margins.left, y);
        y += lineHeight;
      }
      
      // Download the PDF
      const fileName = resume.resume_file_name.endsWith('.pdf') 
        ? resume.resume_file_name.replace('.pdf', '_edited.pdf')
        : `${resume.resume_file_name}_edited.pdf`;
      
      doc.save(fileName);

      // Update resume status
      await updateResumeStatus(resume.id, 'completed', resume.overall_score || 0);

      alert('✅ Resume downloaded successfully as PDF!');

      // Redirect to home after delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err) {
      console.error("Error saving:", err);
      alert("Failed to save changes. Please try again.");
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
      <main className="bg-gray-50 min-h-screen">
        <Navbar />
        
        {/* Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Resume Analysis</h1>
                <p className="text-gray-600 mt-1">
                  {resume.job_title && <span className="font-medium">{resume.job_title}</span>}
                  {resume.company_name && <span> at {resume.company_name}</span>}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Overall Score</p>
                  <p className={`text-3xl font-bold ${getScoreColor(resume.overall_score || 0)}`}>
                    {resume.overall_score || 0}
                  </p>
                </div>
                <button
                  onClick={handleSaveAndDownload}
                  disabled={saving}
                  className="px-6 py-3 primary-gradient text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save & Download'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Side - AI Suggestions */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-8">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">AI Suggestions</h2>
                  <p className="text-purple-100 text-sm mt-1">Click "Apply" to add suggestions to your resume</p>
                </div>
                
                {/* Score Tabs */}
                <div className="border-b border-gray-200">
                  <div className="flex overflow-x-auto">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 px-4 py-4 text-sm font-medium whitespace-nowrap transition ${
                          activeTab === tab.id
                            ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <span>{tab.label}</span>
                          <span className={`text-lg font-bold mt-1 ${getScoreColor(tab.score || 0)}`}>
                            {tab.score || 0}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tips Content */}
                <div className="p-6 max-h-[600px] overflow-y-auto">
                  {getTipsForTab().length > 0 ? (
                    <div className="space-y-4">
                      {getTipsForTab().map((tip: any, index: number) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border-2 ${
                            tip.type === 'good'
                              ? 'bg-green-50 border-green-200'
                              : 'bg-yellow-50 border-yellow-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-1">
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
                              <p className="font-medium text-gray-900">
                                {typeof tip === 'string' ? tip : tip.tip}
                              </p>
                              {tip.explanation && (
                                <p className="text-sm text-gray-600 mt-1">{tip.explanation}</p>
                              )}
                              {tip.type !== 'good' && (
                                <button
                                  onClick={() => applySuggestion(typeof tip === 'string' ? tip : `${tip.tip}\n${tip.explanation || ''}`)}
                                  className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                                >
                                  Apply to Resume
                                </button>
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
                        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                          <h3 className="font-semibold text-green-900 mb-2">✓ Keywords Found</h3>
                          <div className="flex flex-wrap gap-2">
                            {analysis.keywords_found.map((keyword: string, idx: number) => (
                              <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {analysis.keywords_missing && analysis.keywords_missing.length > 0 && (
                        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                          <h3 className="font-semibold text-red-900 mb-2">✗ Missing Keywords</h3>
                          <p className="text-sm text-red-700 mb-3">Consider adding these keywords to improve ATS compatibility</p>
                          <div className="flex flex-wrap gap-2">
                            {analysis.keywords_missing.map((keyword: string, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => applySuggestion(`Add keyword: ${keyword}`)}
                                className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium hover:bg-red-200 transition cursor-pointer"
                              >
                                + {keyword}
                              </button>
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
                        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                          <h3 className="font-semibold text-green-900 mb-2">✓ Sections Found</h3>
                          <div className="flex flex-wrap gap-2">
                            {analysis.sections_found.map((section: string, idx: number) => (
                              <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                {section}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {analysis.sections_missing && analysis.sections_missing.length > 0 && (
                        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                          <h3 className="font-semibold text-red-900 mb-2">✗ Missing Sections</h3>
                          <p className="text-sm text-red-700 mb-3">Add these sections to strengthen your resume</p>
                          <div className="flex flex-wrap gap-2">
                            {analysis.sections_missing.map((section: string, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => applySuggestion(`Add section: ${section}\n\n[Write your ${section} content here]`)}
                                className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium hover:bg-red-200 transition cursor-pointer"
                              >
                                + {section}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Side - Resume Editor & Preview */}
            <div className="space-y-6">
              {/* Resume Editor */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">Your Resume</h2>
                  <p className="text-blue-100 text-sm mt-1">Edit your resume content below</p>
                </div>
                <div className="p-6">
                  {extracting ? (
                    <div className="flex items-center justify-center h-[400px]">
                      <div className="text-center">
                        <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <p className="text-gray-600 mt-4">Extracting text from PDF...</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {extractionError && (
                        <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div className="flex-1">
                              <p className="text-yellow-800 font-semibold mb-2">{extractionError}</p>
                              <label className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg cursor-pointer hover:bg-yellow-700 transition">
                                <input
                                  type="file"
                                  accept=".pdf"
                                  onChange={handleManualFileUpload}
                                  className="hidden"
                                />
                                📤 Upload PDF Again
                              </label>
                            </div>
                          </div>
                        </div>
                      )}
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        placeholder="Loading resume content... If text doesn't appear, use the upload button above or paste your content here."
                        className="w-full h-[600px] px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                      />
                    </>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {editedContent.length} characters • {editedContent.split(/\s+/).filter(Boolean).length} words
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(editedContent);
                        alert('Resume content copied to clipboard!');
                      }}
                      className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition text-sm font-medium"
                    >
                      📋 Copy Text
                    </button>
                  </div>
                </div>
              </div>

              {/* PDF Preview */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-gray-700 to-gray-900 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">Original PDF</h2>
                  <p className="text-gray-300 text-sm mt-1">Reference your original resume</p>
                </div>
                <div className="p-6">
                  {resumeUrl ? (
                    <iframe
                      src={resumeUrl}
                      className="w-full h-[500px] border-2 border-gray-200 rounded-lg"
                      title="Resume Preview"
                    />
                  ) : (
                    <div className="w-full h-[500px] border-2 border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="mt-2 text-gray-600">Loading resume preview...</p>
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
