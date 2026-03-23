import type { Route } from "./+types/sign-up";
import { useAuth } from "../lib/auth-context";
import { Navigate, useNavigate, Link } from "react-router";
import { useState, type FormEvent } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign Up - ATSEngine" },
    { name: "description", content: "Create your ATSEngine account - Engineering Your Resume for ATS Success" },
  ];
}

export default function SignUpPage() {
  const { isSignedIn, signUp } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (isSignedIn) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    const result = await signUp(email, password, firstName, lastName);

    if (result.success) {
      navigate("/");
    } else {
      setError(result.error || "Sign up failed");
    }

    setIsLoading(false);
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
    transition: "all 0.2s ease",
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
        background: "linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)",
        backgroundSize: "400% 400%",
        animation: "gradient-shift 15s ease infinite",
        padding: "20px",
        fontFamily: '"Mona Sans", ui-sans-serif, system-ui, sans-serif',
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background orbs */}
      <div
        style={{
          position: "absolute",
          top: "-15%",
          left: "-10%",
          width: "450px",
          height: "450px",
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(50px)",
          animation: "float 9s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          right: "-10%",
          width: "500px",
          height: "500px",
          background: "radial-gradient(circle, rgba(34, 197, 94, 0.1) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(60px)",
          animation: "float 11s ease-in-out infinite reverse",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          right: "20%",
          width: "250px",
          height: "250px",
          background: "radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(40px)",
          animation: "float 7s ease-in-out infinite",
        }}
      />

      <div style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 10 }}>
        {/* Logo */}
        <div
          style={{ textAlign: "center", marginBottom: "32px" }}
          className="animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          <Link to="/" style={{ textDecoration: "none" }} className="group inline-block">
            <div
              style={{
                fontSize: "36px",
                fontWeight: 700,
                color: "#111827",
                letterSpacing: "-1px",
                transition: "all 0.3s ease",
              }}
              className="hover:scale-105 hover:tracking-wider"
            >
              ATSEngine
            </div>
          </Link>
          <p style={{ color: "#6b7280", fontSize: "16px", marginTop: "8px" }} className="hover:text-gray-700 transition-colors duration-300">
            Engineering Your Resume for ATS Success
          </p>
        </div>

        {/* Card */}
        <div
          className="animate-in fade-in slide-in-from-bottom-6 duration-700 relative overflow-hidden group"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(20px)",
            borderRadius: "20px",
            padding: "40px 32px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5)",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            animationDelay: "0.1s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.boxShadow = "0 30px 60px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.8)";
            e.currentTarget.style.transform = "translateY(-4px)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.boxShadow = "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          {/* Subtle gradient overlay on card */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, rgba(139, 92, 246, 0.03) 0%, transparent 50%, rgba(34, 197, 94, 0.03) 100%)",
              pointerEvents: "none",
              opacity: 0,
              transition: "opacity 0.5s ease",
            }}
            className="group-hover:opacity-100"
          />

          <div
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "4px",
              position: "relative",
            }}
          >
            Create account
          </div>
          <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 24px 0", position: "relative" }}>
            Start optimizing your resume today
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

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "stretch" }}
          >
            {/* Name row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label htmlFor="signup-first" style={labelStyle}>
                  First name
                </label>
                <input
                  id="signup-first"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  placeholder="John"
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="signup-last" style={labelStyle}>
                  Last name
                </label>
                <input
                  id="signup-last"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name"
                  placeholder="Doe"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="signup-email" style={labelStyle}>
                Email address
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                style={inputStyle}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="signup-password" style={labelStyle}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  style={{ ...inputStyle, paddingRight: "48px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  style={toggleBtnStyle}
                >
                  {showPassword ? <EyeOff /> : <EyeOn />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="signup-confirm" style={labelStyle}>
                Confirm password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="signup-confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  style={{ ...inputStyle, paddingRight: "48px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  style={toggleBtnStyle}
                >
                  {showConfirmPassword ? <EyeOff /> : <EyeOn />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative overflow-hidden"
              style={{
                display: "block",
                width: "100%",
                padding: "14px",
                fontSize: "16px",
                fontWeight: 600,
                color: "#fff",
                background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
                border: "none",
                borderRadius: "12px",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1,
                marginTop: "4px",
                boxSizing: "border-box",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: "translateY(0)",
                position: "relative",
              }}
              onMouseOver={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = "translateY(-3px) scale(1.01)";
                  e.currentTarget.style.boxShadow = "0 10px 30px -5px rgba(17, 24, 39, 0.4)";
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
              onMouseDown={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = "translateY(-1px) scale(0.99)";
                }
              }}
            >
              {/* Shine sweep effect */}
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
              <span style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating account...
                  </>
                ) : "Create Account"}
              </span>
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", margin: "24px 0", gap: "12px" }}>
            <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }} />
            <span style={{ color: "#9ca3af", fontSize: "13px" }}>OR</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "#e5e7eb" }} />
          </div>

          {/* Google Sign In */}
          <a
            href="/api/auth/google"
            className="group relative overflow-hidden"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              width: "100%",
              padding: "14px",
              fontSize: "15px",
              fontWeight: 600,
              color: "#374151",
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              cursor: "pointer",
              textDecoration: "none",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              boxSizing: "border-box",
              transform: "translateY(0)",
              position: "relative",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#f9fafb";
              e.currentTarget.style.borderColor = "#d1d5db";
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#fff";
              e.currentTarget.style.borderColor = "#e5e7eb";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Shine effect */}
            <span
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.8) 45%, rgba(255,255,255,0.4) 50%, transparent 55%)",
                transform: "translateX(-100%)",
                transition: "transform 0.6s ease",
              }}
              className="group-hover:translate-x-[200%]"
            />
            <svg width="20" height="20" viewBox="0 0 24 24" style={{ position: "relative", zIndex: 10 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span style={{ position: "relative", zIndex: 10 }}>Continue with Google</span>
          </a>

          <div style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "#6b7280", position: "relative" }}>
            Already have an account?{" "}
            <Link
              to="/sign-in"
              className="group inline-block"
              style={{
                color: "#111827",
                fontWeight: 600,
                textDecoration: "none",
                transition: "all 0.2s ease",
                position: "relative",
              }}
            >
              <span className="group-hover:text-gray-600 transition-colors">Sign in</span>
              <span
                style={{
                  position: "absolute",
                  bottom: "-2px",
                  left: 0,
                  width: "0%",
                  height: "2px",
                  background: "#111827",
                  transition: "width 0.3s ease",
                }}
                className="group-hover:w-full"
              />
            </Link>
          </div>
        </div>

        {/* Back link */}
        <div
          style={{ textAlign: "center", marginTop: "24px" }}
          className="animate-in fade-in duration-700"
        >
          <Link
            to="/"
            className="group inline-flex items-center gap-1"
            style={{
              color: "#6b7280",
              textDecoration: "none",
              fontSize: "14px",
              transition: "all 0.2s ease",
            }}
          >
            <span
              style={{ transition: "transform 0.3s ease" }}
              className="group-hover:-translate-x-1"
            >
              ←
            </span>
            <span className="group-hover:text-gray-800 transition-colors">Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
