import type { Route } from "./+types/forgot-password";
import { useAuth } from "../lib/auth-context";
import { Navigate, Link } from "react-router";
import { useState, type FormEvent } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Forgot Password - ATSEngine" },
    { name: "description", content: "Reset your ATSEngine password" },
  ];
}

export default function ForgotPasswordPage() {
  const { isSignedIn } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (isSignedIn) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setEmail("");
      } else {
        setError(data.error || "Failed to process request");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    display: "block",
    width: "100%",
    padding: "12px 16px",
    fontSize: "15px",
    color: "#111827",
    backgroundColor: "#f9fafb",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    outline: "none",
    boxSizing: "border-box",
    margin: 0,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "14px",
    fontWeight: 500,
    color: "#374151",
    marginBottom: "6px",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f3f4f6",
        padding: "20px",
        fontFamily: '"Mona Sans", ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <div
              style={{
                fontSize: "36px",
                fontWeight: 700,
                color: "#111827",
                letterSpacing: "-1px",
              }}
            >
              ATSEngine
            </div>
          </Link>
          <p style={{ color: "#6b7280", fontSize: "16px", marginTop: "8px" }}>
            Engineering Your Resume for ATS Success
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "16px",
            padding: "40px 32px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "4px",
            }}
          >
            Forgot password?
          </div>
          <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 24px 0" }}>
            Enter your email and we'll send you a reset link
          </p>

          {error && (
            <div
              style={{
                padding: "12px 16px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                color: "#dc2626",
                fontSize: "14px",
                marginBottom: "20px",
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                padding: "12px 16px",
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "8px",
                color: "#15803d",
                fontSize: "14px",
                marginBottom: "20px",
              }}
            >
              Password reset link sent! Check your email (or console in dev mode).
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "20px", alignItems: "stretch" }}
          >
            <div>
              <label htmlFor="forgot-email" style={labelStyle}>
                Email address
              </label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                display: "block",
                width: "100%",
                padding: "14px",
                fontSize: "16px",
                fontWeight: 600,
                color: "#fff",
                background: "#111827",
                border: "none",
                borderRadius: "10px",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1,
                marginTop: "4px",
                boxSizing: "border-box",
              }}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "#6b7280" }}>
            Remember your password?{" "}
            <Link to="/sign-in" style={{ color: "#111827", fontWeight: 600, textDecoration: "none" }}>
              Sign in
            </Link>
          </div>
        </div>

        {/* Back link */}
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <Link to="/" style={{ color: "#6b7280", textDecoration: "none", fontSize: "14px" }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
