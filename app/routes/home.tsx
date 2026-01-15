import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import type { Route } from "./+types/home";
import Navbar from "../components/Navbar";
import ResumeCard from "../components/ResumeCard";
import ProtectedRoute from "../components/ProtectedRoute";
import { getOrCreateUser, getUserResumes } from "../lib/database";
import type { Database } from "../../types/database";

type DatabaseResume = Database['public']['Tables']['resumes']['Row'];

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ATSChecker" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

export default function Home() {
  const { user } = useUser();
  const [resumes, setResumes] = useState<DatabaseResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadResumes() {
      if (!user) return;

      try {
        setLoading(true);
        
        // Check if Supabase is configured
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          setError("Database not configured. Please set up Supabase environment variables (see README.md)");
          return;
        }
        
        // Get or create user in database
        const dbUser = await getOrCreateUser(user.id, {
          email: user.primaryEmailAddress?.emailAddress || "",
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.imageUrl,
        });

        if (!dbUser) {
          setError("Failed to connect to database. Please ensure Supabase is properly configured and the database schema is set up.");
          return;
        }

        // Fetch user's resumes
        const userResumes = await getUserResumes(dbUser.id);
        setResumes(userResumes);
      } catch (err) {
        console.error("Error loading resumes:", err);
        setError("Failed to load resumes. Please check your database configuration.");
      } finally {
        setLoading(false);
      }
    }

    loadResumes();
  }, [user]);

  return (
    <ProtectedRoute>
      <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
        <Navbar />
        <section className="main-section">
          <div className="page-heading py-16">
            <h1>Track Your Applications & Resume Ratings</h1>
            <h2>Review your submissions and check AI-powered feedback.</h2>
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
                      <li>Create a Supabase account at <a href="https://supabase.com" target="_blank" rel="noopener" className="underline">supabase.com</a></li>
                      <li>Run the database migration from <code className="bg-yellow-100 px-1 rounded">database/schema.sql</code></li>
                      <li>Add your Supabase credentials to <code className="bg-yellow-100 px-1 rounded">.env</code> file</li>
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
                <svg className="animate-spin h-12 w-12 text-blue-600" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-gray-600">Loading your resumes...</p>
              </div>
            </div>
          ) : resumes.length > 0 ? (
            <div className="resumes-section">
              {resumes.map((resume) => (
                <ResumeCard 
                  key={resume.id} 
                  resume={{
                    id: resume.id,
                    companyName: resume.company_name || undefined,
                    jobTitle: resume.job_title || undefined,
                    imagePath: resume.resume_thumbnail_url || "/images/resume_placeholder.png",
                    resumePath: resume.resume_file_url,
                    feedback: {
                      overallScore: resume.overall_score || 0,
                      ATS: { score: 0, tips: [] },
                      toneAndStyle: { score: 0, tips: [] },
                      content: { score: 0, tips: [] },
                      structure: { score: 0, tips: [] },
                      skills: { score: 0, tips: [] },
                    },
                  }} 
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md text-center">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400 mb-4"
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
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Resumes Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Upload your first resume to get AI-powered ATS feedback
                </p>
                <a
                  href="/upload"
                  className="inline-block px-6 py-3 primary-gradient text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Upload Resume
                </a>
              </div>
            </div>
          )}
        </section>
      </main>
    </ProtectedRoute>
  );
}
