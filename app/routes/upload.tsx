import { useState } from "react";
import type { Route } from "./+types/upload";
import Navbar from "../components/Navbar";
import FileUploader from "../components/FileUploader";
import ProtectedRoute from "../components/ProtectedRoute";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Upload Resume - ATSChecker" },
    { name: "description", content: "Upload your resume for ATS analysis" },
  ];
}

export default function Upload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    setError("");
    setSuccess("");
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError("Please select a PDF file first");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // TODO: Implement API call to analyze resume
      // For now, just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess("Resume uploaded successfully! Analysis in progress...");
      
      // TODO: Navigate to results or home page after successful upload
    } catch (err: any) {
      setError(err.message || "Failed to upload resume. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[url('/images/bg-main.svg')] bg-cover">
        <Navbar />
        <section className="main-section">
          <div className="page-heading py-16">
            <h1>Upload Your Resume</h1>
            <h2>Get instant ATS-powered feedback to improve your chances</h2>
          </div>

          <div className="max-w-2xl mx-auto px-4 pb-16">
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <FileUploader onFileSelect={handleFileSelect} />

              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {success}
                </div>
              )}

              {selectedFile && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="px-8 py-3 primary-gradient text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Analyzing...
                      </span>
                    ) : (
                      "Analyze Resume"
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-8 text-center text-sm text-gray-600">
              <p>✓ Maximum file size: 20MB</p>
              <p>✓ Supported format: PDF only</p>
              <p>✓ Your data is secure and encrypted</p>
            </div>
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}
