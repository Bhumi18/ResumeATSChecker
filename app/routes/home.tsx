import { useState, useEffect } from "react";
import { useUser } from "../lib/auth-context";
import { safeConsole } from "../lib/logging";
import type { Route } from "./+types/home";
import Navbar from "../components/Navbar";
import ResumeCard from "../components/ResumeCard";
import ProtectedRoute from "../components/ProtectedRoute";
import type { Database } from "../../types/database";

type DatabaseResume = Database['public']['Tables']['resumes']['Row'];
type DatabaseAnalysis = Database['public']['Tables']['resume_analysis']['Row'];

interface ResumeWithAnalysis {
  resume: DatabaseResume;
  analysis: DatabaseAnalysis | null;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ATSEngine - Engineering Your Resume for ATS Success" },
    { name: "description", content: "Engineering Your Resume for ATS Success" },
  ];
}

export default function Home() {
  const { user } = useUser();
  const [resumes, setResumes] = useState<ResumeWithAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'failed'>('all');
  const [deletingResumeId, setDeletingResumeId] = useState<string | null>(null);
  const [pendingDeleteResume, setPendingDeleteResume] = useState<{ id: string; name: string } | null>(null);

  // Calculate stats
  const stats = {
    total: resumes.length,
    avgScore: resumes.length > 0 
      ? Math.round(resumes.reduce((sum, { resume }) => sum + (resume.overall_score || 0), 0) / resumes.length)
      : 0,
    completed: resumes.filter(({ resume }) => resume.status === 'completed').length,
    analyzing: resumes.filter(({ resume }) => resume.status === 'analyzing').length,
    highScoring: resumes.filter(({ resume }) => (resume.overall_score || 0) >= 80).length,
  };

  useEffect(() => {
    async function loadResumes() {
      if (!user) return;

      try {
        setLoading(true);
        setError("");
        
        // Call API route to get resumes (server-side)
        const params = new URLSearchParams({
          userId: user.id,

        });

        const response = await fetch(`/api/resumes?${params}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Failed to load resumes');
        }

        const data = await response.json();
        safeConsole.log('Loaded resumes', { count: Array.isArray(data?.resumes) ? data.resumes.length : 0 });
        setResumes(data.resumes);
      } catch (err) {
        safeConsole.error("Error loading resumes:", err);
        setError(err instanceof Error ? err.message : "Failed to load resumes. Please check your database configuration.");
      } finally {
        setLoading(false);
      }
    }

    loadResumes();
  }, [user]);

  // Filter resumes based on search and status
  const filteredResumes = resumes.filter(({ resume }) => {
    const matchesSearch = searchTerm === "" || 
      resume.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resume.job_title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || resume.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleDeleteResume = async (resumeId: string) => {
    if (!user || deletingResumeId) return;

    try {
      setDeletingResumeId(resumeId);

      const response = await fetch('/api/resumes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || 'Failed to delete application');
      }

      setResumes((prev) => prev.filter(({ resume }) => resume.id !== resumeId));
      setPendingDeleteResume(null);
    } catch (err) {
      safeConsole.error('Error deleting resume:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete application');
    } finally {
      setDeletingResumeId(null);
    }
  };

  return (
    <ProtectedRoute>
      <main className="bg-gray-50 min-h-screen relative overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 animated-bg opacity-50 pointer-events-none" />

        {/* Floating decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full filter blur-3xl opacity-30 animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-green-100 to-blue-100 rounded-full filter blur-3xl opacity-30 animate-pulse" style={{ animationDuration: '6s' }} />

        <Navbar />
        <section className="main-section relative z-10">
          {/* Hero Section */}
          <div className="py-12 px-4">
            <div className="max-w-4xl mx-auto text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h1 className="text-4xl md:text-5xl font-bold text-ink-900 mb-4 hover:scale-[1.02] transition-transform duration-300 cursor-default">
                Welcome back, <span className="text-gradient-animated">{user?.firstName || 'there'}</span>
              </h1>
              <p className="text-lg text-ink-500 mb-8 hover:text-ink-700 transition-colors duration-300">
                Track your job applications, analyze resume performance, and land your dream role
              </p>
            </div>

            {/* Stats Cards */}
            {!loading && resumes.length > 0 && (
              <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="stat-card bg-white rounded-xl p-6 border border-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-500 cursor-default group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-blue-100 rounded-lg stat-icon transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-ink-900 mb-1 stat-number transition-all duration-300 group-hover:scale-110 group-hover:text-blue-600">{stats.total}</div>
                    <div className="text-sm text-ink-500 group-hover:text-ink-700 transition-colors">Total Applications</div>
                  </div>
                </div>
                <div className="stat-card bg-white rounded-xl p-6 border border-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-500 cursor-default group relative overflow-hidden" style={{ animationDelay: '0.1s' }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-green-100 rounded-lg stat-icon transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-ink-900 mb-1 stat-number transition-all duration-300 group-hover:scale-110 group-hover:text-green-600">{stats.avgScore}%</div>
                    <div className="text-sm text-ink-500 group-hover:text-ink-700 transition-colors">Avg. ATS Score</div>
                  </div>
                </div>
                <div className="stat-card bg-white rounded-xl p-6 border border-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-500 cursor-default group relative overflow-hidden" style={{ animationDelay: '0.2s' }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-yellow-100 rounded-lg stat-icon transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-ink-900 mb-1 stat-number transition-all duration-300 group-hover:scale-110 group-hover:text-yellow-600">{stats.highScoring}</div>
                    <div className="text-sm text-ink-500 group-hover:text-ink-700 transition-colors">High Performers (80+)</div>
                  </div>
                </div>
                <div className="stat-card bg-white rounded-xl p-6 border border-gray-200 animate-in fade-in slide-in-from-bottom-2 duration-500 cursor-default group relative overflow-hidden" style={{ animationDelay: '0.3s' }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-purple-100 rounded-lg stat-icon transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-ink-900 mb-1 stat-number transition-all duration-300 group-hover:scale-110 group-hover:text-purple-600">{stats.completed}</div>
                    <div className="text-sm text-ink-500 group-hover:text-ink-700 transition-colors">Completed Analysis</div>
                  </div>
                </div>
              </div>
            )}

            {/* Search and Filter Bar */}
            {!loading && resumes.length > 0 && (
              <div className="max-w-6xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-400">
                <div className="bg-white rounded-xl p-4 border border-gray-200 flex flex-col md:flex-row gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                  {/* Search Input */}
                  <div className="flex-1 relative group">
                    <input
                      type="text"
                      placeholder="Search by company or role..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-400 outline-none transition-all duration-200 hover:border-gray-300"
                    />
                  </div>

                  {/* Filter Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {(['all', 'completed', 'failed'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`filter-btn px-4 py-2 rounded-lg font-medium capitalize ${
                          filterStatus === status
                            ? 'filter-btn-active bg-gray-900 text-white shadow-md'
                            : 'bg-gray-100 text-ink-500 hover:bg-gray-200 hover:text-ink-700'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>

                  {/* Upload Button */}
                  <a
                    href="/upload"
                    className="btn-interactive px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 flex items-center gap-2 whitespace-nowrap justify-center"
                  >
                    <svg
                      className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    New Analysis
                  </a>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="max-w-4xl mx-auto mb-6 p-6 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-1">Setup Required</h3>
                  <p className="text-yellow-700 mb-3">{error}</p>
                  <div className="text-sm text-yellow-600">
                    <p className="font-medium mb-1">Quick setup steps:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Create a Neon account at <a href="https://neon.tech" target="_blank" rel="noopener" className="underline">neon.tech</a></li>
                      <li>Run the database migration from <code className="bg-yellow-100 px-1 rounded">database/schema.sql</code></li>
                      <li>Add your Neon database URL to <code className="bg-yellow-100 px-1 rounded">.env</code> file</li>
                      <li>Restart the dev server</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
                <div className="relative">
                  {/* Outer rotating ring */}
                  <div className="w-16 h-16 border-4 border-gray-200 rounded-full animate-pulse" />
                  {/* Spinning gradient ring */}
                  <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-gray-600 border-r-gray-400 rounded-full animate-spin" />
                  {/* Inner pulsing dot */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 bg-gray-600 rounded-full animate-ping opacity-75" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-ink-700 font-medium">Loading your resumes</p>
                  <p className="text-ink-400 text-sm mt-1">Just a moment...</p>
                </div>
              </div>
            </div>
          ) : resumes.length > 0 ? (
            <>
              {/* Results Header */}
              <div className="max-w-6xl mx-auto px-4 mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-ink-900">
                    Your Applications
                    <span className="ml-3 text-lg font-normal text-ink-500">
                      ({filteredResumes.length} {filteredResumes.length === 1 ? 'result' : 'results'})
                    </span>
                  </h2>
                </div>
              </div>

              {/* Resumes Grid */}
              {filteredResumes.length > 0 ? (
                <div className="resumes-section">
                  {filteredResumes.map(({ resume, analysis }, index) => (
                    <ResumeCard
                      key={resume.id}
                      index={index}
                      resume={{
                        id: resume.id,
                        companyName: resume.company_name || undefined,
                        jobTitle: resume.job_title || undefined,
                        jobDescription: resume.job_description || undefined,
                        status: resume.status,
                        createdAt: resume.created_at,
                        imagePath: resume.resume_thumbnail_url || "/images/pdf.png",
                        resumePath: resume.resume_file_url,
                        feedback: {
                          overallScore: resume.overall_score || 0,
                          ATS: {
                            score: analysis?.ats_score || 0,
                            tips: Array.isArray(analysis?.ats_tips) ? analysis.ats_tips as any : []
                          },
                          toneAndStyle: {
                            score: analysis?.tone_style_score || 0,
                            tips: Array.isArray(analysis?.tone_style_tips) ? analysis.tone_style_tips as any : []
                          },
                          content: {
                            score: analysis?.content_score || 0,
                            tips: Array.isArray(analysis?.content_tips) ? analysis.content_tips as any : []
                          },
                          structure: {
                            score: analysis?.structure_score || 0,
                            tips: Array.isArray(analysis?.structure_tips) ? analysis.structure_tips as any : []
                          },
                          skills: {
                            score: analysis?.skills_score || 0,
                            tips: Array.isArray(analysis?.skills_tips) ? analysis.skills_tips as any : []
                          },
                        },
                      }}
                      footerActions={
                        <button
                          type="button"
                          onClick={() =>
                            setPendingDeleteResume({
                              id: resume.id,
                              name: resume.company_name || resume.job_title || 'this application',
                            })
                          }
                          disabled={deletingResumeId === resume.id}
                          className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:bg-red-50 hover:text-red-600 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
                          aria-label={`Delete ${resume.company_name || 'application'}`}
                        >
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors duration-200 group-hover:bg-red-100 group-hover:text-red-600">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h8" />
                            </svg>
                          </span>
                          {deletingResumeId === resume.id ? 'Deleting...' : 'Delete Application'}
                        </button>
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="max-w-6xl mx-auto px-4">
                  <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                    <svg
                      className="mx-auto h-16 w-16 text-gray-300 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <h3 className="text-xl font-semibold text-ink-700 mb-2">
                      No matches found
                    </h3>
                    <p className="text-ink-500 mb-4">
                      Try adjusting your search or filters
                    </p>
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setFilterStatus("all");
                      }}
                      className="text-ink-700 hover:text-ink-900 font-medium"
                    >
                      Clear all filters
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="max-w-6xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center hover:shadow-2xl transition-shadow duration-500">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 float-animation">
                    <svg
                      className="w-10 h-10 text-ink-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-ink-900 mb-3">
                  Start Your Journey to Success
                </h3>
                <p className="text-lg text-ink-500 mb-8 max-w-2xl mx-auto">
                  Upload your first resume and get instant AI-powered analysis.
                  Discover how your resume performs against ATS systems and get
                  actionable feedback to land more interviews.
                </p>

                <div className="grid md:grid-cols-3 gap-6 mb-8 max-w-3xl mx-auto text-left">
                  <div className="flex items-start gap-3 p-4 rounded-xl transition-all duration-300 hover:bg-gray-50 hover:shadow-sm">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center transition-transform duration-300 hover:scale-110">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-ink-700 mb-1">Upload Resume</h4>
                      <p className="text-sm text-ink-500">Simply upload your resume</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-xl transition-all duration-300 hover:bg-gray-50 hover:shadow-sm">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center transition-transform duration-300 hover:scale-110">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-ink-700 mb-1">AI Analysis</h4>
                      <p className="text-sm text-ink-500">Get instant AI-powered insights</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 rounded-xl transition-all duration-300 hover:bg-gray-50 hover:shadow-sm">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center transition-transform duration-300 hover:scale-110">
                      <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-ink-700 mb-1">Improve & Apply</h4>
                      <p className="text-sm text-ink-500">Optimize and land interviews</p>
                    </div>
                  </div>
                </div>

                <a
                  href="/upload"
                  className="btn-interactive inline-block px-8 py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-gray-800 pulse-cta"
                >
                  Upload Your First Resume
                </a>
              </div>
            </div>
          )}

          {pendingDeleteResume && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
                onClick={() => (deletingResumeId ? null : setPendingDeleteResume(null))}
                aria-hidden
              />
              <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-gradient-to-r from-red-50 via-white to-red-50 p-6 pb-4">
                  <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600">
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h8" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Delete application?</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    This will permanently remove <span className="font-semibold text-slate-800">{pendingDeleteResume.name}</span> and its analysis.
                    This action cannot be undone.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 p-6 pt-4">
                  <button
                    type="button"
                    onClick={() => setPendingDeleteResume(null)}
                    disabled={Boolean(deletingResumeId)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteResume(pendingDeleteResume.id)}
                    disabled={Boolean(deletingResumeId)}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {deletingResumeId ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                          <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-90" />
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      'Delete application'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </ProtectedRoute>
  );
}
