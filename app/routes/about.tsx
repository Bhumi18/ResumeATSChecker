import type { Route } from "./+types/about";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "About Us - ATSEngine" },
    { name: "description", content: "Learn about ATSEngine - Engineering Your Resume for ATS Success" },
  ];
}

export default function AboutPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)",
        fontFamily: '"Mona Sans", ui-sans-serif, system-ui, sans-serif',
      }}
    >
      {/* Navigation */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #e5e7eb",
          padding: "16px 24px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Link to="/" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: "24px", fontWeight: 700, color: "#111827" }}>ATSEngine</span>
          </Link>
          <Link
            to="/"
            style={{
              color: "#6b7280",
              textDecoration: "none",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>←</span> Back to Home
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "80px 24px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(36px, 5vw, 56px)",
            fontWeight: 700,
            color: "#111827",
            letterSpacing: "-2px",
            marginBottom: "24px",
          }}
        >
          About ATSEngine
        </h1>
        <p
          style={{
            fontSize: "18px",
            color: "#6b7280",
            lineHeight: 1.7,
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          We're on a mission to help job seekers navigate the modern hiring landscape
          by making their resumes ATS-friendly and interview-ready.
        </p>
      </section>

      {/* Our Story */}
      <section
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "0 24px 80px",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            borderRadius: "24px",
            padding: "48px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h2
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "24px",
            }}
          >
            Our Story
          </h2>
          <div style={{ color: "#4b5563", fontSize: "16px", lineHeight: 1.8 }}>
            <p style={{ marginBottom: "20px" }}>
              ATSEngine was born out of frustration. As job seekers ourselves, we experienced
              firsthand the disconnect between submitting dozens of applications and hearing
              crickets in return. We discovered that over 75% of resumes never reach human eyes
              — they're filtered out by Applicant Tracking Systems before recruiters even see them.
            </p>
            <p style={{ marginBottom: "20px" }}>
              We built ATSEngine to level the playing field. Using advanced AI technology,
              we analyze resumes the same way ATS software does, but we go further — we provide
              actionable insights to help you optimize your resume for both machines and humans.
            </p>
            <p>
              Today, ATSEngine has helped thousands of job seekers improve their resumes and
              land interviews at companies they never thought possible. And we're just getting started.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "0 24px 80px",
        }}
      >
        <h2
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "#111827",
            textAlign: "center",
            marginBottom: "48px",
          }}
        >
          Our Values
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {[
            {
              title: "Transparency",
              description: "We believe in showing you exactly how ATS systems work and why certain changes matter. No black boxes here.",
              icon: "👁️",
            },
            {
              title: "Accessibility",
              description: "Everyone deserves a fair shot at their dream job. That's why we offer our core features completely free during beta.",
              icon: "🌍",
            },
            {
              title: "Privacy First",
              description: "Your resume contains sensitive information. We never sell your data and you can delete it anytime.",
              icon: "🔒",
            },
            {
              title: "Continuous Improvement",
              description: "The job market evolves, and so do we. We constantly update our algorithms based on the latest ATS trends.",
              icon: "📈",
            },
          ].map((value, i) => (
            <div
              key={i}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderRadius: "20px",
                padding: "32px",
                boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.08)",
                transition: "all 0.3s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 20px 40px -10px rgba(0, 0, 0, 0.15)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 10px 40px -10px rgba(0, 0, 0, 0.08)";
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>{value.icon}</div>
              <h3 style={{ fontSize: "20px", fontWeight: 600, color: "#111827", marginBottom: "12px" }}>
                {value.title}
              </h3>
              <p style={{ fontSize: "15px", color: "#6b7280", lineHeight: 1.6 }}>
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "0 24px 80px",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "#111827",
            marginBottom: "16px",
          }}
        >
          Built with Care
        </h2>
        <p
          style={{
            fontSize: "16px",
            color: "#6b7280",
            maxWidth: "500px",
            margin: "0 auto 40px",
            lineHeight: 1.7,
          }}
        >
          ATSEngine is built by a small team passionate about helping people find meaningful work.
        </p>
        <Link
          to="/contact"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "14px 28px",
            background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
            color: "#fff",
            fontWeight: 600,
            fontSize: "15px",
            borderRadius: "12px",
            textDecoration: "none",
            transition: "all 0.3s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 10px 30px -5px rgba(17, 24, 39, 0.3)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Get in Touch
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid #e5e7eb",
          padding: "32px 24px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#9ca3af", fontSize: "14px" }}>
          © {new Date().getFullYear()} ATSEngine. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
