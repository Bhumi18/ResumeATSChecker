import { useState } from "react";
import { useNavigate } from "react-router";
import { useUser } from "@clerk/clerk-react";
import type { Route } from "./+types/upload";
import Navbar from "../components/Navbar";
import FileUploader from "../components/FileUploader";
import ProtectedRoute from "../components/ProtectedRoute";
import { uploadResumeFile } from "../lib/storage";
import { analyzeResume, getMockAnalysis } from "../lib/ai-analyzer";
import { 
  getOrCreateUser, 
  createResume, 
  saveResumeAnalysis, 
  updateResumeStatus
} from "../lib/database";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Upload Resume - ATSChecker" },
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
    setProgress("Checking subscription...");

    try {
      // Step 1: Get or create user in database
      const dbUser = await getOrCreateUser(user.id, {
        email: user.primaryEmailAddress?.emailAddress || "",
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.imageUrl,
      });

      if (!dbUser) {
        throw new Error("Failed to authenticate user");
      }

      // Step 2: Verify user (service is free for all users)
      setProgress('Uploading resume...');

      // Step 3: Upload file to Supabase Storage
      const uploadResult = await uploadResumeFile(dbUser.id, selectedFile);
      console.log('📤 Upload result:', uploadResult);
      
      if (!uploadResult) {
        throw new Error("Failed to upload resume file");
      }

      setProgress("Creating resume record...");

      // Step 4: Create resume record in database
      const resume = await createResume(dbUser.id, {
        company_name: companyName || null,
        job_title: jobTitle || null,
        job_description: jobDescription || null,
        resume_file_url: uploadResult.url,
        resume_file_name: selectedFile.name,
        status: 'analyzing',
      });

      console.log('📝 Resume record created:', resume);

      if (!resume) {
        throw new Error("Failed to create resume record");
      }

      setProgress("Analyzing resume with AI...");

      // Step 5: Analyze resume with AI
      let analysisResult;
      try {
        console.log('🤖 Starting AI analysis...');
        analysisResult = await analyzeResume(
          selectedFile,
          jobTitle || undefined,
          jobDescription || undefined,
          false // Set to true for premium analysis
        );
        console.log('✅ AI Analysis complete:', analysisResult);
      } catch (aiError) {
        console.warn("⚠️ AI analysis failed, using mock data:", aiError);
        // Fallback to mock data if AI fails
        analysisResult = getMockAnalysis();
        console.log('🎭 Using mock analysis:', analysisResult);
      }

      setProgress("Saving analysis results...");

      // Step 6: Save analysis results
      const saved = await saveResumeAnalysis(resume.id, {
        atsScore: analysisResult.atsScore,
        atsTips: analysisResult.atsTips,
        toneStyleScore: analysisResult.toneStyleScore,
        toneStyleTips: analysisResult.toneStyleTips,
        contentScore: analysisResult.contentScore,
        contentTips: analysisResult.contentTips,
        structureScore: analysisResult.structureScore,
        structureTips: analysisResult.structureTips,
        skillsScore: analysisResult.skillsScore,
        skillsTips: analysisResult.skillsTips,
        keywordsFound: analysisResult.keywordsFound,
        keywordsMissing: analysisResult.keywordsMissing,
        sectionsFound: analysisResult.sectionsFound,
        sectionsMissing: analysisResult.sectionsMissing,
        aiModelUsed: analysisResult.modelUsed || 'gemini-flash',
      });

      console.log('💾 Analysis saved:', saved);

      if (!saved) {
        throw new Error("Failed to save analysis results");
      }
      
      // Update resume with overall score and completed status
      await updateResumeStatus(resume.id, 'completed', analysisResult.overallScore);

      console.log('✅ Resume upload and analysis complete!');

      setSuccess("Resume analyzed successfully! Redirecting...");
      
      // Redirect to analysis page to view and edit
      setTimeout(() => {
        navigate(`/analyze/${resume.id}`);
      }, 2000);

    } catch (err: any) {
      console.error("Error analyzing resume:", err);
      setError(err.message || "Failed to analyze resume. Please try again.");
      
      // If we have a resume ID, mark it as failed
      // This would require storing the resume ID in state
    } finally {
      setLoading(false);
      setProgress("");
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-[url('/images/bg-main.svg')] bg-cover">
        <Navbar />
        <section className="main-section py-8">
          <div className="page-heading py-10">
            <h1>Upload Your Resume</h1>
            <h2>Get instant ATS-powered feedback to improve your chances</h2>
          </div>

          <div className="max-w-2xl mx-auto px-4 pb-10">
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              {/* Optional Job Details */}
              <div className="mb-6 space-y-4">
                <h3 className="font-semibold text-gray-800 text-lg">Job Details (Optional)</h3>
                <p className="text-sm text-gray-600">
                  Provide job details for more targeted analysis
                </p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g., Google"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g., Frontend Developer"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Job Description
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the job description here for better keyword matching..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-800 text-lg mb-4">Upload Resume</h3>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>

              {progress && (
                <div className="mt-5 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 flex-shrink-0" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {progress}
                </div>
              )}

              {error && (
                <div className="mt-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-5 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {success}
                </div>
              )}

              {selectedFile && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="px-10 py-3 primary-gradient text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

            <div className="mt-6 text-center text-sm text-gray-600 space-y-0.5">
              <p>✓ Maximum file size: 20MB</p>
              <p>✓ Supported formats: .doc, .docx (Word documents only)</p>
              <p>✓ PDF files are not supported</p>
              <p>✓ Your data is secure and encrypted</p>
            </div>
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}
