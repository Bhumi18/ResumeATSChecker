import type { Route } from "./+types/landing";
import { useAuth } from "../lib/auth-context";
import { Navigate, Link } from "react-router";
import { useState, useEffect } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ATSEngine - Engineering Your Resume for ATS Success" },
    { name: "description", content: "AI-powered resume analysis that helps you beat Applicant Tracking Systems. Get instant feedback and optimize your resume for better job matches." },
  ];
}

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Redirect authenticated users to dashboard
  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%, #f9fafb 100%)",
        backgroundSize: "400% 400%",
        animation: "gradient-shift 20s ease infinite",
        fontFamily: '"Mona Sans", ui-sans-serif, system-ui, sans-serif',
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background orbs */}
      <div
        style={{
          position: "fixed",
          top: "-15%",
          right: "-10%",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(60px)",
          animation: "float 12s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "-20%",
          left: "-15%",
          width: "700px",
          height: "700px",
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(70px)",
          animation: "float 15s ease-in-out infinite reverse",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "30%",
          left: "60%",
          width: "400px",
          height: "400px",
          background: "radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(50px)",
          animation: "float 10s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      {/* Navigation */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: scrollY > 50 ? "rgba(255, 255, 255, 0.95)" : "transparent",
          backdropFilter: scrollY > 50 ? "blur(20px)" : "none",
          transition: "all 0.3s ease",
          borderBottom: scrollY > 50 ? "1px solid rgba(229, 231, 235, 0.5)" : "none",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link to="/" style={{ textDecoration: "none" }} className="group">
            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "#111827",
                letterSpacing: "-1px",
                transition: "all 0.3s ease",
              }}
              className="group-hover:scale-105 group-hover:tracking-wide"
            >
              ATSEngine
            </div>
          </Link>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <Link
              to="/sign-in"
              style={{
                padding: "10px 20px",
                color: "#374151",
                fontWeight: 500,
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
              className="hover:text-gray-900"
            >
              Sign In
            </Link>
            <Link
              to="/sign-up"
              className="group relative overflow-hidden"
              style={{
                padding: "10px 24px",
                background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
                color: "#fff",
                fontWeight: 600,
                borderRadius: "10px",
                textDecoration: "none",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(17, 24, 39, 0.4)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.1) 50%, transparent 55%)",
                  transform: "translateX(-100%)",
                  transition: "transform 0.6s ease",
                }}
                className="group-hover:translate-x-[200%]"
              />
              <span style={{ position: "relative", zIndex: 10 }}>Get Started</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "80px 24px 100px",
          textAlign: "center",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
          {/* Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              borderRadius: "50px",
              marginBottom: "32px",
              border: "1px solid #e5e7eb",
              fontSize: "14px",
              color: "#374151",
              fontWeight: 500,
            }}
            className="animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981", animation: "pulse-subtle 2s infinite" }} />
            AI-Powered Resume Analysis
          </div>

          {/* Main Heading */}
          <h1
            style={{
              fontSize: "clamp(40px, 8vw, 72px)",
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "-2px",
              lineHeight: 1.1,
              marginBottom: "24px",
            }}
            className="animate-in fade-in slide-in-from-bottom-6 duration-700"
          >
            Engineering Your Resume
            <br />
            <span className="text-gradient-animated">for ATS Success</span>
          </h1>

          {/* Subheading */}
          <p
            style={{
              fontSize: "20px",
              color: "#6b7280",
              maxWidth: "600px",
              margin: "0 auto 40px",
              lineHeight: 1.6,
            }}
            className="animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            Stop getting filtered out by Applicant Tracking Systems. Our AI analyzes your resume and provides actionable insights to help you land more interviews.
          </p>

          {/* CTA Buttons */}
          <div
            style={{
              display: "flex",
              gap: "16px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
            className="animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            <Link
              to="/sign-up"
              className="group relative overflow-hidden pulse-cta"
              style={{
                padding: "18px 40px",
                background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "18px",
                borderRadius: "14px",
                textDecoration: "none",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-4px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 20px 40px -10px rgba(17, 24, 39, 0.5)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.1) 50%, transparent 55%)",
                  transform: "translateX(-100%)",
                  transition: "transform 0.6s ease",
                }}
                className="group-hover:translate-x-[200%]"
              />
              <span style={{ position: "relative", zIndex: 10 }}>Analyze Your Resume</span>
              <svg style={{ position: "relative", zIndex: 10 }} width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              to="/sign-in"
              style={{
                padding: "18px 40px",
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                color: "#374151",
                fontWeight: 600,
                fontSize: "18px",
                borderRadius: "14px",
                border: "1px solid #e5e7eb",
                textDecoration: "none",
                transition: "all 0.3s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#fff";
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.1)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              I have an account
            </Link>
          </div>
        </div>

        {/* Hero Image/Mockup */}
        <div
          style={{
            marginTop: "80px",
            perspective: "1000px",
          }}
          className="animate-in fade-in slide-in-from-bottom-8 duration-1000"
        >
          <div
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: "20px",
              padding: "24px",
              boxShadow: "0 40px 80px -20px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.5)",
              maxWidth: "900px",
              margin: "0 auto",
              transition: "all 0.5s ease",
              transform: "rotateX(5deg)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "rotateX(0deg) translateY(-10px)";
              e.currentTarget.style.boxShadow = "0 50px 100px -20px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "rotateX(5deg)";
              e.currentTarget.style.boxShadow = "0 40px 80px -20px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.5)";
            }}
          >
            {/* Mock dashboard preview */}
            <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", justifyContent: "center" }}>
              {/* Score Circle Preview */}
              <div
                style={{
                  flex: "1 1 200px",
                  maxWidth: "200px",
                  background: "#f9fafb",
                  borderRadius: "16px",
                  padding: "24px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    margin: "0 auto 16px",
                    position: "relative",
                  }}
                >
                  <svg viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="8"
                      strokeDasharray="283"
                      strokeDashoffset="70"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "28px",
                      fontWeight: 700,
                      color: "#10b981",
                    }}
                  >
                    85
                  </div>
                </div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#374151" }}>ATS Score</div>
              </div>

              {/* Categories Preview */}
              <div style={{ flex: "2 1 400px", display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { name: "Keywords Match", score: 92, color: "#10b981" },
                  { name: "Format & Structure", score: 78, color: "#f59e0b" },
                  { name: "Content Quality", score: 85, color: "#10b981" },
                  { name: "Skills Alignment", score: 70, color: "#f59e0b" },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      background: "#f9fafb",
                      borderRadius: "10px",
                      padding: "12px 16px",
                    }}
                  >
                    <span style={{ flex: 1, fontSize: "14px", color: "#374151", fontWeight: 500 }}>{item.name}</span>
                    <div style={{ width: "120px", height: "8px", background: "#e5e7eb", borderRadius: "4px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${item.score}%`,
                          height: "100%",
                          background: item.color,
                          borderRadius: "4px",
                          transition: "width 1s ease",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: item.color, minWidth: "40px" }}>{item.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "100px 24px",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "-1px",
              marginBottom: "16px",
            }}
          >
            How ATSEngine Works
          </h2>
          <p style={{ fontSize: "18px", color: "#6b7280", maxWidth: "600px", margin: "0 auto" }}>
            Our AI-powered engine analyzes every aspect of your resume to help you pass through ATS filters.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
          }}
        >
          {[
            {
              icon: (
                <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              ),
              title: "Upload Your Resume",
              description: "Simply upload your resume in PDF format. Our system supports all standard resume formats and layouts.",
              color: "#3b82f6",
            },
            {
              icon: (
                <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              ),
              title: "AI Analysis",
              description: "Our advanced AI scans your resume for ATS compatibility, keyword optimization, and content quality.",
              color: "#10b981",
            },
            {
              icon: (
                <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
              title: "Get Your Score",
              description: "Receive a comprehensive ATS score with detailed breakdowns across multiple categories.",
              color: "#8b5cf6",
            },
            {
              icon: (
                <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
              title: "Actionable Tips",
              description: "Get specific, actionable recommendations to improve your resume and increase your interview chances.",
              color: "#f59e0b",
            },
            {
              icon: (
                <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              ),
              title: "Job-Specific Analysis",
              description: "Paste the job description to get tailored feedback on how well your resume matches the role.",
              color: "#ec4899",
            },
            {
              icon: (
                <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ),
              title: "Track Progress",
              description: "Monitor your improvements over time and track multiple resume versions for different applications.",
              color: "#06b6d4",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="group"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderRadius: "20px",
                padding: "32px",
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                border: "1px solid rgba(229, 231, 235, 0.5)",
                cursor: "default",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-8px)";
                e.currentTarget.style.boxShadow = "0 25px 50px -12px rgba(0, 0, 0, 0.15)";
                e.currentTarget.style.backgroundColor = "#fff";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "14px",
                  backgroundColor: `${feature.color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: feature.color,
                  marginBottom: "20px",
                  transition: "all 0.3s ease",
                }}
                className="group-hover:scale-110"
              >
                {feature.icon}
              </div>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: "12px",
                }}
              >
                {feature.title}
              </h3>
              <p style={{ fontSize: "15px", color: "#6b7280", lineHeight: 1.6 }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section
        style={{
          background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
          padding: "80px 24px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decoration */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            position: "relative",
            zIndex: 10,
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 40px)",
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "-1px",
                marginBottom: "16px",
              }}
            >
              Trusted by Job Seekers
            </h2>
            <p style={{ fontSize: "16px", color: "rgba(255, 255, 255, 0.7)" }}>
              Join thousands who have improved their resumes with ATSEngine
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "32px",
            }}
          >
            {[
              { value: "85%", label: "Average Score Improvement" },
              { value: "2.5x", label: "More Interview Callbacks" },
              { value: "10K+", label: "Resumes Analyzed" },
              { value: "< 30s", label: "Analysis Time" },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  textAlign: "center",
                  padding: "24px",
                  borderRadius: "16px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  transition: "all 0.3s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(36px, 5vw, 48px)",
                    fontWeight: 700,
                    color: "#fff",
                    marginBottom: "8px",
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ fontSize: "14px", color: "rgba(255, 255, 255, 0.6)" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "100px 24px",
          textAlign: "center",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            borderRadius: "24px",
            padding: "64px 48px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
            border: "1px solid rgba(229, 231, 235, 0.5)",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "-1px",
              marginBottom: "16px",
            }}
          >
            Ready to Beat the ATS?
          </h2>
          <p style={{ fontSize: "18px", color: "#6b7280", marginBottom: "32px", maxWidth: "500px", margin: "0 auto 32px" }}>
            Start analyzing your resume today and take the first step towards landing your dream job.
          </p>
          <Link
            to="/sign-up"
            className="group relative overflow-hidden"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "18px 48px",
              background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
              color: "#fff",
              fontWeight: 600,
              fontSize: "18px",
              borderRadius: "14px",
              textDecoration: "none",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-4px) scale(1.02)";
              e.currentTarget.style.boxShadow = "0 20px 40px -10px rgba(17, 24, 39, 0.5)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <span
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.1) 50%, transparent 55%)",
                transform: "translateX(-100%)",
                transition: "transform 0.6s ease",
              }}
              className="group-hover:translate-x-[200%]"
            />
            <span style={{ position: "relative", zIndex: 10 }}>Get Started for Free</span>
            <svg style={{ position: "relative", zIndex: 10 }} width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p style={{ fontSize: "14px", color: "#9ca3af", marginTop: "16px" }}>
            No credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid #e5e7eb",
          padding: "40px 24px",
          textAlign: "center",
          backgroundColor: "rgba(255, 255, 255, 0.5)",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "-1px",
              marginBottom: "16px",
            }}
          >
            ATSEngine
          </div>
          <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "24px" }}>
            Engineering Your Resume for ATS Success
          </p>
          <div style={{ display: "flex", gap: "24px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/sign-in" style={{ color: "#6b7280", fontSize: "14px", textDecoration: "none" }} className="hover:text-gray-900 transition-colors">
              Sign In
            </Link>
            <Link to="/sign-up" style={{ color: "#6b7280", fontSize: "14px", textDecoration: "none" }} className="hover:text-gray-900 transition-colors">
              Sign Up
            </Link>
          </div>
          <p style={{ fontSize: "13px", color: "#9ca3af", marginTop: "32px" }}>
            © {new Date().getFullYear()} ATSEngine. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
