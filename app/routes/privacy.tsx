import type { Route } from "./+types/privacy";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Privacy Policy - ATSEngine" },
    { name: "description", content: "ATSEngine Privacy Policy - How we collect, use, and protect your data" },
  ];
}

export default function PrivacyPage() {
  const sections = [
    {
      title: "Information We Collect",
      content: [
        "Account Information: When you create an account, we collect your email address and password (encrypted).",
        "Resume Data: When you upload a resume for analysis, we temporarily process its content to provide our ATS scoring and recommendations.",
        "Usage Data: We collect anonymous usage statistics to improve our service, including pages visited and features used.",
        "Device Information: Basic device and browser information for security and optimization purposes.",
      ],
    },
    {
      title: "How We Use Your Information",
      content: [
        "To provide and maintain our ATS analysis service",
        "To improve and personalize your experience",
        "To communicate with you about updates and new features",
        "To detect and prevent fraud or abuse",
        "To comply with legal obligations",
      ],
    },
    {
      title: "Data Storage & Security",
      content: [
        "All data is encrypted in transit (TLS 1.3) and at rest (AES-256)",
        "Resume content is processed in memory and not permanently stored unless you explicitly save it to your account",
        "We use industry-standard security measures to protect your information",
        "Access to user data is strictly limited to authorized personnel",
      ],
    },
    {
      title: "Data Sharing",
      content: [
        "We do NOT sell your personal data to third parties",
        "We do NOT share your resume content with employers or recruiters",
        "We may share anonymized, aggregated data for research purposes",
        "We may disclose information if required by law or to protect our rights",
      ],
    },
    {
      title: "Your Rights",
      content: [
        "Access: You can request a copy of all data we have about you",
        "Deletion: You can delete your account and all associated data at any time",
        "Correction: You can update your personal information in your account settings",
        "Portability: You can export your data in a standard format",
        "Opt-out: You can unsubscribe from marketing communications at any time",
      ],
    },
    {
      title: "Cookies",
      content: [
        "Essential cookies: Required for the service to function (authentication, security)",
        "Analytics cookies: Help us understand how users interact with our service",
        "You can control cookie preferences through your browser settings",
      ],
    },
    {
      title: "Third-Party Services",
      content: [
        "We use trusted third-party services for authentication (Google OAuth)",
        "Analytics services help us improve user experience",
        "All third-party providers are vetted for security and privacy compliance",
      ],
    },
    {
      title: "Children's Privacy",
      content: [
        "ATSEngine is not intended for users under 16 years of age",
        "We do not knowingly collect information from children",
        "If we learn we have collected data from a child, we will delete it promptly",
      ],
    },
    {
      title: "Changes to This Policy",
      content: [
        "We may update this policy from time to time",
        "Significant changes will be notified via email or in-app notification",
        "Continued use after changes constitutes acceptance of the new policy",
      ],
    },
    {
      title: "Contact Us",
      content: [
        "For privacy-related questions or requests, contact us at:",
        "Email: privacy@atsengine.com",
        "You can also use our Contact page to reach us",
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
          Privacy Policy
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
            At ATSEngine, we take your privacy seriously. This Privacy Policy explains how we collect,
            use, disclose, and safeguard your information when you use our ATS resume analysis service.
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
            to="/terms"
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
            Terms of Service
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
