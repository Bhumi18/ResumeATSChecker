import type { Route } from "./+types/sign-in";
import { useSignIn, useAuth } from "@clerk/clerk-react";
import { Navigate, useNavigate } from "react-router";
import { useState, type FormEvent } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign In - ATSChecker" },
    { name: "description", content: "Sign in to your ATSChecker account" },
  ];
}

export default function SignInPage() {
  const { isSignedIn } = useAuth();
  const { signIn, setActive } = useSignIn();
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already signed in
  if (isSignedIn) {
    return <Navigate to="/" replace />;
  }

  // Handle email/password sign in
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Create a sign-in attempt using email and password
      const result = await signIn?.create({
        identifier: email,
        password,
      });

      if (result?.status === "complete") {
        // Set the active session and redirect
        await setActive?.({ session: result.createdSessionId });
        navigate("/");
      }
    } catch (err: any) {
      // Handle Clerk errors
      setError(err.errors?.[0]?.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google OAuth sign in
  const handleGoogleSignIn = async () => {
    try {
      await signIn?.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "OAuth sign-in failed");
    }
  };

  return (
    <main className="bg-[url('/images/bg-auth.svg')] bg-cover h-screen overflow-hidden">
      <section className="flex flex-col items-center justify-center h-full px-4">
        <div className="text-center mb-4 max-w-2xl">
          <h1 className="text-3xl md:text-4xl text-gradient leading-tight tracking-[-2px] font-semibold mb-2">Welcome Back</h1>
          <h2 className="text-lg md:text-xl text-dark-200">Sign in to track your resume submissions</h2>
        </div>

        <div className="flex flex-col items-center justify-center w-full max-w-[550px]">
          <div className="bg-white rounded-2xl p-5 md:p-6 shadow-xl w-full">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {/* Email Input */}
              <div className="flex flex-col gap-1 w-full items-start">
                <label htmlFor="email" className="text-xs md:text-sm">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                  className="w-full p-2.5 inset-shadow rounded-2xl focus:outline-none bg-white text-sm"
                />
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-1 w-full items-start">
                <label htmlFor="password" className="text-xs md:text-sm">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                  className="w-full p-2.5 inset-shadow rounded-2xl focus:outline-none bg-white text-sm"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="text-red-500 text-xs bg-red-50 p-2 rounded-lg">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="primary-gradient rounded-full py-2.5 px-5 cursor-pointer w-full text-base font-semibold text-white hover:primary-gradient-hover transition-all disabled:opacity-50 mt-1"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-dark-200 text-xs">or continue with</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* OAuth Button */}
            <button
              onClick={handleGoogleSignIn}
              className="primary-gradient text-white rounded-full px-5 py-2 cursor-pointer w-full hover:primary-gradient-hover transition-all flex items-center justify-center gap-2 text-sm font-medium"
              type="button"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="white"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="white"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="white"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="white"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>

            {/* Sign Up Link */}
            <p className="text-center mt-3 text-dark-200 text-xs">
              Don't have an account?{" "}
              <a href="/sign-up" className="text-[#606beb] hover:text-[#4957eb] font-semibold">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
