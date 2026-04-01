import type { Route } from "./+types/contact";
import { Link } from "react-router";
import { useState, type FormEvent } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Contact Us - ATSEngine" },
    { name: "description", content: "Get in touch with the ATSEngine team" },
  ];
}

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubmitted(true);
    setIsSubmitting(false);
  };

  const inputStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: "14px 16px",
    fontSize: "15px",
    color: "#111827",
    backgroundColor: "#f9fafb",
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    outline: "none",
    boxSizing: "border-box",
    transition: "all 0.2s ease",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "14px",
    fontWeight: 500,
    color: "#374151",
    marginBottom: "8px",
  };

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

      {/* Main Content */}
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "80px 24px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <h1
            style={{
              fontSize: "clamp(36px, 5vw, 48px)",
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "-2px",
              marginBottom: "16px",
            }}
          >
            Contact Us
          </h1>
          <p style={{ fontSize: "18px", color: "#6b7280", maxWidth: "500px", margin: "0 auto" }}>
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "48px",
            alignItems: "start",
          }}
        >
          {/* Contact Info */}
          <div>
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderRadius: "20px",
                padding: "32px",
                boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.1)",
                marginBottom: "24px",
              }}
            >
              <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#111827", marginBottom: "24px" }}>
                Get in Touch
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {[
                  {
                    icon: (
                      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    ),
                    label: "Email",
                    value: "support@atsengine.com",
                  },
                  {
                    icon: (
                      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    ),
                    label: "Location",
                    value: "San Francisco, CA",
                  },
                  {
                    icon: (
                      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ),
                    label: "Response Time",
                    value: "Within 24 hours",
                  },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        backgroundColor: "#f3f4f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#6b7280",
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "4px" }}>{item.label}</div>
                      <div style={{ fontSize: "15px", color: "#111827", fontWeight: 500 }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ Link */}
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderRadius: "20px",
                padding: "24px",
                boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.1)",
              }}
            >
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111827", marginBottom: "8px" }}>
                Looking for quick answers?
              </h3>
              <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "16px" }}>
                Check out our FAQ section for common questions about ATSEngine.
              </p>
              <Link
                to="/#resources"
                style={{
                  color: "#111827",
                  fontSize: "14px",
                  fontWeight: 500,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                View Resources
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Contact Form */}
          <div
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              borderRadius: "24px",
              padding: "40px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
            }}
          >
            {submitted ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    backgroundColor: "#d1fae5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 24px",
                  }}
                >
                  <svg width="32" height="32" fill="none" stroke="#059669" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 style={{ fontSize: "24px", fontWeight: 600, color: "#111827", marginBottom: "12px" }}>
                  Message Sent!
                </h3>
                <p style={{ fontSize: "15px", color: "#6b7280", marginBottom: "24px" }}>
                  Thank you for reaching out. We'll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: "", email: "", subject: "", message: "" });
                  }}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: "#f3f4f6",
                    color: "#374151",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "14px",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div>
                  <label htmlFor="name" style={labelStyle}>Full Name</label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="John Doe"
                    style={inputStyle}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#6b7280";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(107,114,128,0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#d1d5db";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="email" style={labelStyle}>Email Address</label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="john@example.com"
                    style={inputStyle}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#6b7280";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(107,114,128,0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#d1d5db";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="subject" style={labelStyle}>Subject</label>
                  <input
                    id="subject"
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    placeholder="How can we help?"
                    style={inputStyle}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#6b7280";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(107,114,128,0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#d1d5db";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="message" style={labelStyle}>Message</label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    placeholder="Tell us more about your inquiry..."
                    rows={5}
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                      minHeight: "120px",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "#6b7280";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(107,114,128,0.1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "#d1d5db";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: "16px",
                    background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "12px",
                    fontSize: "16px",
                    fontWeight: 600,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    opacity: isSubmitting ? 0.6 : 1,
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                  onMouseOver={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 10px 30px -5px rgba(17, 24, 39, 0.3)";
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send Message
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
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
