import { useState, useEffect } from "react";
import { useUser } from "../lib/auth-context";
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'analyzing' | 'pending'>('all');

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
        console.log('📋 Loaded resumes:', data.resumes);
        setResumes(data.resumes);
      } catch (err) {
        console.error("Error loading resumes:", err);
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

  return (
    <ProtectedRoute>
      <main className="bg-gray-50 min-h-screen">
        <Navbar />
        <section className="main-section">
          {/* Hero Section */}
          <div className="py-12 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-ink-900 mb-4">
                Welcome back, {user?.firstName || 'there'}
              </h1>
              <p className="text-lg text-ink-500 mb-8">
                Track your job applications, analyze resume performance, and land your dream role
              </p>
            </div>

            {/* Stats Cards */}
            {!loading && resumes.length > 0 && (
              <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="text-3xl font-bold text-ink-900 mb-2">{stats.total}</div>
                  <div className="text-sm text-ink-500">Total Applications</div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="text-3xl font-bold text-ink-900 mb-2">{stats.avgScore}</div>
                  <div className="text-sm text-ink-500">Avg. ATS Score</div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="text-3xl font-bold text-ink-900 mb-2">{stats.highScoring}</div>
                  <div className="text-sm text-ink-500">High Performers (80+)</div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="text-3xl font-bold text-ink-900 mb-2">{stats.completed}</div>
                  <div className="text-sm text-ink-500">Completed Analysis</div>
                </div>
              </div>
            )}

            {/* Search and Filter Bar */}
            {!loading && resumes.length > 0 && (
              <div className="max-w-6xl mx-auto mb-8">
                <div className="bg-white rounded-xl p-4 border border-gray-200 flex flex-col md:flex-row gap-4">
                  {/* Search Input */}
                  <div className="flex-1 relative">
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search by company or role..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none"
                    />
                  </div>

                  {/* Filter Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {(['all', 'completed', 'analyzing', 'pending'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                          filterStatus === status
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-ink-500 hover:bg-gray-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>

                  {/* Upload Button */}
                  <a
                    href="/upload"
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    <svg
                      className="w-5 h-5"
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
              <div className="flex flex-col items-center gap-4">
                <svg className="animate-spin h-8 w-8 text-ink-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-ink-500">Loading your resumes...</p>
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
                  {filteredResumes.map(({ resume, analysis }) => (
                    <ResumeCard 
                      key={resume.id} 
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
            <div className="max-w-6xl mx-auto px-4">
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <div className="mb-6">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-ink-700 mb-1">Upload Resume</h4>
                      <p className="text-sm text-ink-500">Simply upload your resume</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-ink-700 mb-1">AI Analysis</h4>
                      <p className="text-sm text-ink-500">Get instant AI-powered insights</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  className="inline-block px-8 py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors"
                >
                  Upload Your First Resume
                </a>
              </div>
            </div>
          )}
        </section>
      </main>
    </ProtectedRoute>
  );
}
