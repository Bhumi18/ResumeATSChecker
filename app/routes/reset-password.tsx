import type { Route } from "./+types/reset-password";
import { useAuth } from "../lib/auth-context";
import { Navigate, useNavigate, Link, useSearchParams } from "react-router";
import { useState, type FormEvent } from "react";
import BrandLogo from "../components/BrandLogo";
import { getPasswordPolicyError } from "../lib/password-policy";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Reset Password - ATSEngine" },
    { name: "description", content: "Set your new ATSEngine password" },
  ];
}

export default function ResetPasswordPage() {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!token) {
    return <Navigate to="/sign-in" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const passwordError = getPasswordPolicyError(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Redirect to sign in after 2 seconds
        setTimeout(() => {
          navigate("/sign-in");
        }, 2000);
      } else {
        setError(data.error || "Failed to reset password");
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

  const EyeOff = () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

  const EyeOn = () => (
    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const toggleBtnStyle: React.CSSProperties = {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#9ca3af",
    padding: "4px",
    display: "flex",
    alignItems: "center",
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
            <BrandLogo size="lg" style={{ margin: "0 auto" }} />
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
            padding: "clamp(24px, 4vw, 40px) clamp(20px, 4vw, 32px)",
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
            Reset password
          </div>
          <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 24px 0" }}>
            Enter your new password below
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
              Password reset successful! Redirecting to sign in...
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "stretch" }}
          >
            {/* Password */}
            <div>
              <label htmlFor="reset-password" style={labelStyle}>
                New Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="reset-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  style={{ ...inputStyle, paddingRight: "48px" }}
                  disabled={success}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  style={toggleBtnStyle}
                  disabled={success}
                >
                  {showPassword ? <EyeOff /> : <EyeOn />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="reset-confirm" style={labelStyle}>
                Confirm New Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="reset-confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  style={{ ...inputStyle, paddingRight: "48px" }}
                  disabled={success}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  style={toggleBtnStyle}
                  disabled={success}
                >
                  {showConfirmPassword ? <EyeOff /> : <EyeOn />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || success}
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
                cursor: isLoading || success ? "not-allowed" : "pointer",
                opacity: isLoading || success ? 0.6 : 1,
                marginTop: "4px",
                boxSizing: "border-box",
              }}
            >
              {isLoading ? "Resetting..." : success ? "Success!" : "Reset Password"}
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
