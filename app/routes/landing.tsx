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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Redirect authenticated users to dashboard
  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Resources", href: "#resources" },
  ];

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
          className="flex items-center justify-between max-w-[1200px] mx-auto px-4 sm:px-6 py-4"
        >
          {/* Logo */}
          <Link to="/" style={{ textDecoration: "none" }} className="group">
            <div
              className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight transition-all group-hover:scale-105"
            >
              ATSEngine
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div
            className="hidden md:flex items-center gap-2"
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                style={{
                  padding: "8px 16px",
                  color: "#4b5563",
                  fontWeight: 500,
                  fontSize: "15px",
                  textDecoration: "none",
                  borderRadius: "8px",
                  transition: "all 0.2s ease",
                }}
                className="hover:text-gray-900 hover:bg-gray-100"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="flex gap-2 sm:gap-3 items-center">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#374151",
              }}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            <Link
              to="/sign-in"
              className="hidden sm:block hover:text-gray-900"
              style={{
                padding: "10px 20px",
                color: "#374151",
                fontWeight: 500,
                textDecoration: "none",
                transition: "all 0.2s ease",
              }}
            >
              Sign In
            </Link>
            <Link
              to="/sign-up"
              className="hidden sm:inline-flex group relative overflow-hidden"
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden px-4 py-4 bg-white/98 border-t border-gray-200 animate-in slide-in-from-top-2 duration-200"
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <hr className="my-2 border-gray-200" />
              <Link
                to="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/sign-up"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 px-4 py-3 bg-gray-900 text-white font-semibold rounded-lg text-center hover:bg-gray-800 transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section
        className="section-padding"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
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
            className="hero-buttons animate-in fade-in slide-in-from-bottom-4 duration-700"
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
        id="features"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "100px 24px",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "64px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              backgroundColor: "rgba(99, 102, 241, 0.1)",
              borderRadius: "50px",
              marginBottom: "16px",
              fontSize: "13px",
              color: "#6366f1",
              fontWeight: 600,
            }}
          >
            Powerful Features
          </div>
          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "-1px",
              marginBottom: "16px",
            }}
          >
            Everything You Need to Succeed
          </h2>
          <p style={{ fontSize: "18px", color: "#6b7280", maxWidth: "600px", margin: "0 auto" }}>
            Comprehensive tools and insights to optimize your resume for any job application.
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              ),
              title: "Comprehensive ATS Score",
              description: "Get a detailed score breakdown across 5 key categories: ATS compatibility, content quality, structure, tone, and skills alignment.",
              color: "#3b82f6",
            },
            {
              icon: (
                <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              ),
              title: "Job-Specific Matching",
              description: "Paste any job description and instantly see how well your resume matches the specific requirements and keywords.",
              color: "#10b981",
            },
            {
              icon: (
                <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              ),
              title: "AI-Powered Suggestions",
              description: "Receive intelligent, actionable recommendations powered by advanced AI to improve each section of your resume.",
              color: "#8b5cf6",
            },
            {
              icon: (
                <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              ),
              title: "Keyword Optimization",
              description: "Identify missing keywords and phrases that ATS systems look for, ensuring your resume gets past the filters.",
              color: "#f59e0b",
            },
            {
              icon: (
                <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ),
              title: "Progress Tracking",
              description: "Track all your resume versions and applications in one place. Monitor improvements over time with historical data.",
              color: "#ec4899",
            },
            {
              icon: (
                <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
              title: "Export Reports",
              description: "Download detailed analysis reports in PDF format to share with career coaches or keep for your records.",
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

      {/* How It Works Section */}
      <section
        id="how-it-works"
        style={{
          background: "linear-gradient(180deg, #f9fafb 0%, #fff 100%)",
          padding: "100px 24px",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                borderRadius: "50px",
                marginBottom: "16px",
                fontSize: "13px",
                color: "#059669",
                fontWeight: 600,
              }}
            >
              Simple Process
            </div>
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
              Get your resume analyzed in three simple steps. No complicated setup required.
            </p>
          </div>

          {/* Steps */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "32px",
              position: "relative",
            }}
          >
            {/* Connecting Line (visible on larger screens) */}
            <div
              className="hidden lg:block"
              style={{
                position: "absolute",
                top: "80px",
                left: "20%",
                right: "20%",
                height: "2px",
                background: "linear-gradient(90deg, #e5e7eb 0%, #d1d5db 50%, #e5e7eb 100%)",
                zIndex: 0,
              }}
            />

            {[
              {
                step: "01",
                title: "Upload Your Resume",
                description: "Simply drag and drop your resume in PDF format. Our system securely processes your document in seconds.",
                icon: (
                  <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                ),
                color: "#3b82f6",
              },
              {
                step: "02",
                title: "Add Job Description",
                description: "Optionally paste the job description you're targeting. This enables job-specific analysis and keyword matching.",
                icon: (
                  <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                color: "#8b5cf6",
              },
              {
                step: "03",
                title: "Get Instant Results",
                description: "Receive your comprehensive ATS score with detailed breakdowns and actionable improvement suggestions.",
                icon: (
                  <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                ),
                color: "#10b981",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="group"
                style={{
                  textAlign: "center",
                  position: "relative",
                  zIndex: 10,
                }}
              >
                {/* Step Number Circle */}
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    background: "#fff",
                    border: `3px solid ${item.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 24px",
                    position: "relative",
                    transition: "all 0.4s ease",
                    boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.1)",
                  }}
                  className="group-hover:scale-110"
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = item.color;
                    e.currentTarget.style.boxShadow = `0 20px 40px -10px ${item.color}50`;
                    const icon = e.currentTarget.querySelector('svg');
                    if (icon) (icon as SVGElement).style.color = '#fff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.boxShadow = "0 10px 40px -10px rgba(0, 0, 0, 0.1)";
                    const icon = e.currentTarget.querySelector('svg');
                    if (icon) (icon as SVGElement).style.color = item.color;
                  }}
                >
                  <div style={{ color: item.color, transition: "color 0.3s ease" }}>
                    {item.icon}
                  </div>
                </div>

                {/* Step Number Badge */}
                <div
                  style={{
                    position: "absolute",
                    top: "0",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: item.color,
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {item.step}
                </div>

                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "#111827",
                    marginBottom: "12px",
                  }}
                >
                  {item.title}
                </h3>
                <p style={{ fontSize: "15px", color: "#6b7280", lineHeight: 1.6, maxWidth: "280px", margin: "0 auto" }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA under steps */}
          <div style={{ textAlign: "center", marginTop: "64px" }}>
            <Link
              to="/sign-up"
              className="group relative overflow-hidden"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                padding: "16px 36px",
                background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "16px",
                borderRadius: "12px",
                textDecoration: "none",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 15px 30px -10px rgba(17, 24, 39, 0.4)";
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
              <span style={{ position: "relative", zIndex: 10 }}>Try It Now — It's Free</span>
              <svg style={{ position: "relative", zIndex: 10 }} width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
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

      {/* Pricing Section */}
      <section
        id="pricing"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "100px 24px",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              borderRadius: "50px",
              marginBottom: "16px",
              fontSize: "14px",
              color: "#059669",
              fontWeight: 600,
            }}
          >
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981", animation: "pulse-subtle 2s infinite" }} />
            Currently in Beta
          </div>
          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "-1px",
              marginBottom: "16px",
            }}
          >
            Free During Beta
          </h2>
          <p style={{ fontSize: "18px", color: "#6b7280", maxWidth: "600px", margin: "0 auto" }}>
            Enjoy full access to all features completely free while we're in beta. Subscription plans coming soon!
          </p>
        </div>

        {/* Single Pricing Card */}
        <div
          style={{
            maxWidth: "500px",
            margin: "0 auto",
          }}
        >
          <div
            className="group"
            style={{
              backgroundColor: "#111827",
              borderRadius: "24px",
              padding: "40px",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              border: "2px solid #111827",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-8px)";
              e.currentTarget.style.boxShadow = "0 25px 50px -12px rgba(17, 24, 39, 0.4)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Beta Badge */}
            <div
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                padding: "6px 14px",
                backgroundColor: "#10b981",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 600,
                borderRadius: "50px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
              Beta Access
            </div>

            <div style={{ marginBottom: "32px", textAlign: "center" }}>
              <h3
                style={{
                  fontSize: "24px",
                  fontWeight: 600,
                  color: "#fff",
                  marginBottom: "12px",
                }}
              >
                Full Access
              </h3>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "64px",
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  $0
                </span>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "18px" }}>
                  forever during beta
                </span>
              </div>
              <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.7)", marginTop: "12px" }}>
                No credit card required. No hidden fees.
              </p>
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 32px 0" }}>
              {[
                "Unlimited resume analyses",
                "Detailed ATS score breakdown",
                "Job-specific matching",
                "AI-powered improvement tips",
                "Export analysis reports",
                "Priority email support",
              ].map((feature, j) => (
                <li
                  key={j}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 0",
                    fontSize: "15px",
                    color: "rgba(255,255,255,0.9)",
                    borderBottom: j < 5 ? "1px solid rgba(255,255,255,0.1)" : "none",
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="#10b981"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              to="/sign-up"
              className="group/btn relative overflow-hidden"
              style={{
                display: "block",
                width: "100%",
                padding: "16px",
                textAlign: "center",
                background: "linear-gradient(135deg, #fff 0%, #f3f4f6 100%)",
                color: "#111827",
                fontWeight: 600,
                fontSize: "16px",
                borderRadius: "12px",
                textDecoration: "none",
                transition: "all 0.3s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 10px 20px rgba(255, 255, 255, 0.2)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Get Started Free
            </Link>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div
          style={{
            maxWidth: "700px",
            margin: "48px auto 0",
            padding: "24px 32px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            borderRadius: "16px",
            border: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "rgba(99, 102, 241, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6366f1",
              flexShrink: 0,
            }}
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: "200px" }}>
            <h4 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", marginBottom: "4px" }}>
              Pro & Enterprise Plans Coming Soon
            </h4>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>
              We're working on premium features including team collaboration, API access, and more. Stay tuned!
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        id="resources"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "80px 24px",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "-1px",
              marginBottom: "16px",
            }}
          >
            What Our Users Say
          </h2>
          <p style={{ fontSize: "16px", color: "#6b7280" }}>
            Real results from real job seekers
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
              quote: "ATSEngine helped me understand why I wasn't getting callbacks. After optimizing my resume, I landed 3 interviews in the first week!",
              author: "Sarah M.",
              role: "Software Engineer",
              avatar: "S",
            },
            {
              quote: "The job-specific analysis is a game-changer. I can now tailor my resume for each application with confidence.",
              author: "James K.",
              role: "Product Manager",
              avatar: "J",
            },
            {
              quote: "Finally, a tool that gives actionable feedback. Not just 'improve your resume' but exactly what to change and why.",
              author: "Emily R.",
              role: "Marketing Director",
              avatar: "E",
            },
          ].map((testimonial, i) => (
            <div
              key={i}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderRadius: "20px",
                padding: "32px",
                border: "1px solid rgba(229, 231, 235, 0.5)",
                transition: "all 0.3s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 20px 40px -10px rgba(0, 0, 0, 0.1)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
                {[...Array(5)].map((_, j) => (
                  <svg key={j} width="20" height="20" fill="#f59e0b" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <p style={{ fontSize: "15px", color: "#374151", lineHeight: 1.7, marginBottom: "24px" }}>
                "{testimonial.quote}"
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #111827 0%, #374151 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: "16px",
                  }}
                >
                  {testimonial.avatar}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "#111827" }}>{testimonial.author}</div>
                  <div style={{ fontSize: "13px", color: "#6b7280" }}>{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
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
          backgroundColor: "#111827",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle gradient overlay */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
          }}
        />

        {/* Main Footer Content */}
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "80px 24px 40px",
          }}
        >
          {/* Top Section - Brand + Links */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "48px",
              marginBottom: "64px",
            }}
            className="md:grid-cols-2"
          >
            {/* Left - Brand Section */}
            <div style={{ maxWidth: "400px" }}>
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: 700,
                  letterSpacing: "-1px",
                  marginBottom: "16px",
                  background: "linear-gradient(135deg, #fff 0%, #9ca3af 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                ATSEngine
              </div>
              <p style={{ fontSize: "15px", color: "rgba(255, 255, 255, 0.6)", lineHeight: 1.7, marginBottom: "28px" }}>
                Engineering your resume for ATS success. Our AI-powered platform helps job seekers optimize their resumes and land more interviews.
              </p>

              {/* CTA Button */}
              <Link
                to="/sign-up"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  backgroundColor: "#fff",
                  color: "#111827",
                  fontWeight: 600,
                  fontSize: "14px",
                  borderRadius: "10px",
                  textDecoration: "none",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#fff";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Get Started Free
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>

            {/* Right - Links Grid */}
            <div
              className="footer-links-grid"
            >
              {/* Navigate Column */}
              <div>
                <h4 style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: "20px",
                  color: "rgba(255, 255, 255, 0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}>
                  Navigate
                </h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {[
                    { name: "Features", href: "#features" },
                    { name: "How It Works", href: "#how-it-works" },
                    { name: "Pricing", href: "#pricing" },
                  ].map((item) => (
                    <li key={item.name} style={{ marginBottom: "14px" }}>
                      <a
                        href={item.href}
                        style={{
                          color: "rgba(255, 255, 255, 0.7)",
                          textDecoration: "none",
                          fontSize: "14px",
                          transition: "all 0.2s ease",
                          display: "inline-block",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.color = "#fff";
                          e.currentTarget.style.transform = "translateX(4px)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                          e.currentTarget.style.transform = "translateX(0)";
                        }}
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company Column */}
              <div>
                <h4 style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: "20px",
                  color: "rgba(255, 255, 255, 0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}>
                  Company
                </h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {[
                    { name: "About Us", href: "/about" },
                    { name: "Contact", href: "/contact" },
                    { name: "Help Center", href: "/contact" },
                  ].map((item) => (
                    <li key={item.name} style={{ marginBottom: "14px" }}>
                      <a
                        href={item.href}
                        style={{
                          color: "rgba(255, 255, 255, 0.7)",
                          textDecoration: "none",
                          fontSize: "14px",
                          transition: "all 0.2s ease",
                          display: "inline-block",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.color = "#fff";
                          e.currentTarget.style.transform = "translateX(4px)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                          e.currentTarget.style.transform = "translateX(0)";
                        }}
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Legal Column */}
              <div>
                <h4 style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  marginBottom: "20px",
                  color: "rgba(255, 255, 255, 0.4)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}>
                  Legal
                </h4>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {[
                    { name: "Privacy Policy", href: "/privacy" },
                    { name: "Terms of Service", href: "/terms" },
                  ].map((item) => (
                    <li key={item.name} style={{ marginBottom: "14px" }}>
                      <a
                        href={item.href}
                        style={{
                          color: "rgba(255, 255, 255, 0.7)",
                          textDecoration: "none",
                          fontSize: "14px",
                          transition: "all 0.2s ease",
                          display: "inline-block",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.color = "#fff";
                          e.currentTarget.style.transform = "translateX(4px)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                          e.currentTarget.style.transform = "translateX(0)";
                        }}
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              paddingTop: "32px",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.4)" }}>
              © {new Date().getFullYear()} ATSEngine. All rights reserved.
            </p>
            <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.4)" }}>
              Made with care for job seekers everywhere
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
