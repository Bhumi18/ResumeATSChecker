import { useState } from "react";
import { useNavigate } from "react-router";
import { useUser } from "../lib/auth-context";
import { safeConsole } from "../lib/logging";
import type { Route } from "./+types/upload";
import Navbar from "../components/Navbar";
import FileUploader from "../components/FileUploader";
import ProtectedRoute from "../components/ProtectedRoute";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Upload Resume - ATSEngine" },
    { name: "description", content: "Upload your resume for ATS analysis" },
  ];
}

export default function Upload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [progress, setProgress] = useState("");

  const { user } = useUser();
  const navigate = useNavigate();

  const handleFileSelect = (file: File | null) => {
    if (file && file.name.toLowerCase().endsWith('.pdf')) {
      setError("PDF files are not supported. Please upload your resume in Word format (.doc or .docx)");
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setError("");
    setSuccess("");
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError("Please select a Word document first");
      return;
    }

    if (selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError("PDF files are not supported. Please upload your resume in Word format (.doc or .docx)");
      return;
    }

    if (!user) {
      setError("You must be logged in to analyze resumes");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");
    setProgress("Uploading and analyzing resume...");

    try {
      // Create FormData for API request
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('userId', user.id);
      formData.append('companyName', companyName);
      formData.append('jobTitle', jobTitle);
      formData.append('jobDescription', jobDescription);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Upload failed');
      }

      const data = await response.json();

      setSuccess("Resume analyzed successfully!");
      setProgress("");

      // Navigate to analysis page after a brief delay
      setTimeout(() => {
        navigate(`/analyze/${data.resumeId}`);
      }, 1500);
    } catch (err) {
      safeConsole.error("Error analyzing resume:", err);
      setError(err instanceof Error ? err.message : "Failed to analyze resume. Please try again.");
      setProgress("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-50 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-56 h-56 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full filter blur-3xl opacity-30 animate-pulse" style={{ animationDuration: '5s' }} />
        <div className="absolute bottom-0 left-0 w-52 h-52 sm:w-72 sm:h-72 lg:w-80 lg:h-80 bg-gradient-to-br from-green-100 to-blue-100 rounded-full filter blur-3xl opacity-30 animate-pulse" style={{ animationDuration: '7s' }} />

        <Navbar />
        <section className="main-section py-8 relative z-10">
          <div className="page-heading py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="hover:scale-[1.02] transition-transform duration-300 cursor-default">Upload Your Resume</h1>
            <h2 className="hover:text-ink-700 transition-colors duration-300">Get instant ATS-powered feedback to improve your chances</h2>
          </div>

          <div className="max-w-2xl mx-auto px-4 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: '0.2s' }}>
            <div
              className="bg-white rounded-2xl border border-gray-200 p-8 transition-all duration-500 hover:border-gray-300 group"
              style={{
                boxShadow: '0 4px 20px -5px rgba(0, 0, 0, 0.1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.15)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 20px -5px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Optional Job Details */}
              <div className="mb-6 space-y-4">
                <h3 className="font-semibold text-ink-700 text-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Job Details (Optional)
                </h3>
                <p className="text-sm text-ink-500">
                  Provide job details for more targeted analysis
                </p>

                <div className="group relative">
                  <label className="block text-sm font-medium text-ink-500 mb-1 transition-all duration-300 group-focus-within:text-ink-700 group-focus-within:font-semibold">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g., Google"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-gray-100 focus:border-gray-400 outline-none transition-all duration-300 hover:border-gray-300 hover:shadow-sm"
                    disabled={loading}
                  />
                </div>

                <div className="group relative">
                  <label className="block text-sm font-medium text-ink-500 mb-1 transition-all duration-300 group-focus-within:text-ink-700 group-focus-within:font-semibold">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g., Frontend Developer"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-gray-100 focus:border-gray-400 outline-none transition-all duration-300 hover:border-gray-300 hover:shadow-sm"
                    disabled={loading}
                  />
                </div>

                <div className="group relative">
                  <label className="block text-sm font-medium text-ink-500 mb-1 transition-all duration-300 group-focus-within:text-ink-700 group-focus-within:font-semibold">
                    Job Description
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here for better keyword matching..."
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-4 focus:ring-gray-100 focus:border-gray-400 outline-none transition-all duration-300 hover:border-gray-300 hover:shadow-sm resize-none"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-ink-700 text-lg mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Resume
                </h3>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>

              {progress && (
                <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="relative">
                    <svg className="animate-spin h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                  <span className="font-medium">{progress}</span>
                </div>
              )}

              {error && (
                <div className="mt-5 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {success && (
                <div className="mt-5 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">{success}</span>
                </div>
              )}

              {selectedFile && (
                <div className="mt-6 flex justify-center animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-500">
                  <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="btn-interactive group px-10 py-3.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden"
                  >
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                    {loading ? (
                      <span className="flex items-center gap-3 relative z-10">
                        <div className="relative">
                          <div className="w-5 h-5 border-2 border-white/30 rounded-full" />
                          <div className="absolute inset-0 w-5 h-5 border-2 border-transparent border-t-white rounded-full animate-spin" />
                        </div>
                        <span>Analyzing...</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 relative z-10">
                        <svg
                          className="w-5 h-5 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span>Analyze Resume</span>
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 text-center text-sm text-ink-500 space-y-1 animate-in fade-in duration-700 delay-500">
              <div className="flex flex-wrap justify-center gap-4">
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-gray-200">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Max 20MB
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-gray-200">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  .doc, .docx
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full border border-gray-200">
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Secure & Encrypted
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}
