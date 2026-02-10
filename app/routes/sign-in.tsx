import type { Route } from "./+types/sign-in";
import { useAuth } from "../lib/auth-context";
import { Navigate, useNavigate, Link } from "react-router";
import { useState, type FormEvent } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign In - ATSChecker" },
    { name: "description", content: "Sign in to your ATSChecker account" },
  ];
}

export default function SignInPage() {
  const { isSignedIn, signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already signed in
  if (isSignedIn) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await signIn(email, password);
    
    if (result.success) {
      navigate("/");
    } else {
      setError(result.error || "Sign in failed");
    }
    
    setIsLoading(false);
  };

  return (
    <main className="bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen overflow-x-hidden">
      <section className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
        {/* Logo/Brand Section */}
        <div className="text-center mb-5 max-w-2xl animate-in fade-in duration-500">
          <div className="mb-2">
            <Link to="/" className="inline-block">
              <h1 className="text-5xl font-bold text-gradient mb-2">ATSChecker</h1>
            </Link>
          </div>
          <p className="text-gray-400 text-lg">
            Smart feedback for your dream job
          </p>
        </div>

        {/* Sign In Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-gray-300 mb-6">Sign in to continue your journey</p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#606beb] focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#606beb] focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#8e98ff] to-[#606beb] text-white font-semibold rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-300">
              Don't have an account?{" "}
              <Link to="/sign-up" className="text-[#8e98ff] hover:text-[#606beb] font-semibold">
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <Link
          to="/"
          className="mt-6 text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2"
        >
          <span>←</span> Back to Home
        </Link>
      </section>
    </main>
  );
}
