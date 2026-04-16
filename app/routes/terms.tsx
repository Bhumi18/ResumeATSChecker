import type { Route } from "./+types/terms";
import { Link } from "react-router";
import BrandLogo from "../components/BrandLogo";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Terms of Service - ATSEngine" },
    { name: "description", content: "ATSEngine Terms of Service - Rules and guidelines for using our service" },
  ];
}

export default function TermsPage() {
  const sections = [
    {
      title: "Acceptance of Terms",
      content: [
        "By accessing or using ATSEngine, you agree to be bound by these Terms of Service.",
        "If you disagree with any part of these terms, you may not access the service.",
        "We reserve the right to update these terms at any time. Continued use constitutes acceptance.",
      ],
    },
    {
      title: "Description of Service",
      content: [
        "ATSEngine provides AI-powered resume analysis to help job seekers optimize their resumes for Applicant Tracking Systems.",
        "Our service analyzes resume content, structure, and formatting to provide ATS compatibility scores and recommendations.",
        "Features and availability may change without notice as we continue to improve the service.",
      ],
    },
    {
      title: "User Accounts",
      content: [
        "You must provide accurate and complete information when creating an account.",
        "You are responsible for maintaining the security of your account credentials.",
        "You must notify us immediately of any unauthorized access to your account.",
        "One person or entity may not maintain more than one free account.",
      ],
    },
    {
      title: "Acceptable Use",
      content: [
        "Use the service only for its intended purpose (resume analysis and optimization).",
        "Do not upload malicious files, viruses, or harmful content.",
        "Do not attempt to reverse engineer, decompile, or extract our algorithms.",
        "Do not use automated systems to access the service excessively.",
        "Do not upload content that infringes on others' intellectual property rights.",
      ],
    },
    {
      title: "User Content",
      content: [
        "You retain ownership of all content you upload to ATSEngine.",
        "By uploading content, you grant us a limited license to process it for analysis purposes.",
        "We do not claim ownership of your resume content or personal information.",
        "You represent that you have the right to upload any content you submit.",
      ],
    },
    {
      title: "Intellectual Property",
      content: [
        "ATSEngine's service, including its algorithms, design, and content, is protected by intellectual property laws.",
        "You may not copy, modify, or distribute our service or any part thereof.",
        "Our trademarks, logos, and service marks may not be used without written permission.",
      ],
    },
    {
      title: "Free Beta Service",
      content: [
        "ATSEngine is currently offered as a free beta service.",
        "We reserve the right to introduce paid features or subscription plans in the future.",
        "Free users will be notified in advance of any changes to pricing or feature availability.",
        "Beta features may be experimental and subject to change or removal.",
      ],
    },
    {
      title: "Disclaimers",
      content: [
        "ATSEngine is provided \"as is\" without warranties of any kind.",
        "We do not guarantee that our analysis will result in job interviews or employment.",
        "ATS systems vary widely; our recommendations are based on common patterns but may not apply to all systems.",
        "We are not responsible for hiring decisions made by employers or their ATS software.",
      ],
    },
    {
      title: "Limitation of Liability",
      content: [
        "ATSEngine shall not be liable for any indirect, incidental, or consequential damages.",
        "Our total liability shall not exceed the amount you paid for the service (if any).",
        "We are not liable for any loss of data, employment opportunities, or business interruption.",
      ],
    },
    {
      title: "Termination",
      content: [
        "You may terminate your account at any time by deleting it from your account settings.",
        "We may suspend or terminate accounts that violate these terms.",
        "Upon termination, your right to use the service ceases immediately.",
        "We may retain certain data as required by law or for legitimate business purposes.",
      ],
    },
    {
      title: "Dispute Resolution",
      content: [
        "These terms are governed by the laws of the State of California, USA.",
        "Any disputes shall be resolved through binding arbitration in San Francisco, CA.",
        "You waive any right to participate in class action lawsuits against ATSEngine.",
      ],
    },
    {
      title: "Contact Information",
      content: [
        "For questions about these Terms of Service, please contact us at:",
        "Email: legal@atsengine.com",
        "You can also reach us through our Contact page.",
      ],
    },
  ];

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
            <BrandLogo size="sm" />
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

      {/* Header */}
      <section
        className="section-padding"
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(36px, 5vw, 48px)",
            fontWeight: 700,
            color: "#111827",
            letterSpacing: "-2px",
            marginBottom: "16px",
          }}
        >
          Terms of Service
        </h1>
        <p style={{ fontSize: "16px", color: "#6b7280" }}>
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </section>

      {/* Content */}
      <section
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "0 24px 80px",
        }}
      >
        <div
          className="legal-content"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderRadius: "24px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.1)",
          }}
        >
          <p style={{ fontSize: "16px", color: "#4b5563", lineHeight: 1.8, marginBottom: "32px" }}>
            Welcome to ATSEngine. Please read these Terms of Service carefully before using our
            resume analysis service. These terms outline your rights and responsibilities when
            using ATSEngine.
          </p>

          {sections.map((section, i) => (
            <div key={i} style={{ marginBottom: i === sections.length - 1 ? 0 : "40px" }}>
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: "16px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                {i + 1}. {section.title}
              </h2>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {section.content.map((item, j) => (
                  <li
                    key={j}
                    style={{
                      fontSize: "15px",
                      color: "#4b5563",
                      lineHeight: 1.7,
                      marginBottom: "12px",
                      paddingLeft: "24px",
                      position: "relative",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: "8px",
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: "#9ca3af",
                      }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div
          style={{
            marginTop: "32px",
            display: "flex",
            flexWrap: "wrap",
            gap: "16px",
            justifyContent: "center",
          }}
        >
          <Link
            to="/privacy"
            style={{
              padding: "12px 24px",
              backgroundColor: "#fff",
              color: "#374151",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 500,
              textDecoration: "none",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "#9ca3af";
              e.currentTarget.style.backgroundColor = "#f9fafb";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.backgroundColor = "#fff";
            }}
          >
            Privacy Policy
          </Link>
          <Link
            to="/contact"
            style={{
              padding: "12px 24px",
              backgroundColor: "#fff",
              color: "#374151",
              border: "1px solid #e5e7eb",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 500,
              textDecoration: "none",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "#9ca3af";
              e.currentTarget.style.backgroundColor = "#f9fafb";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.backgroundColor = "#fff";
            }}
          >
            Contact Us
          </Link>
        </div>
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
