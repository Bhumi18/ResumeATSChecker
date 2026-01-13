import type { Route } from "./+types/sign-up";
import { useSignUp, useAuth } from "@clerk/clerk-react";
import { Navigate, useNavigate } from "react-router";
import { useState, type FormEvent } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sign Up - ATSChecker" },
    { name: "description", content: "Create your ATSChecker account" },
  ];
}

export default function SignUpPage() {
  const { isSignedIn } = useAuth();
  const { signUp, setActive } = useSignUp();
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already signed in
  if (isSignedIn) {
    return <Navigate to="/" replace />;
  }

  // Handle email/password sign up
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Create a sign-up attempt using email and password
      await signUp?.create({
        emailAddress: email,
        password,
      });

      // Send email verification code
      await signUp?.prepareEmailAddressVerification({ strategy: "email_code" });

      // Show verification UI
      setPendingVerification(true);
    } catch (err: any) {
      // Handle Clerk errors
      setError(err.errors?.[0]?.message || "Sign up failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verification code submission
  const handleVerification = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Verify the email with the code provided
      const completeSignUp = await signUp?.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp?.status === "complete") {
        // Set the active session and redirect
        await setActive?.({ session: completeSignUp.createdSessionId });
        navigate("/");
      }
    } catch (err: any) {
      // Handle Clerk errors
      setError(err.errors?.[0]?.message || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google OAuth sign up
  const handleGoogleSignUp = async () => {
    try {
      await signUp?.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "OAuth sign-up failed");
    }
  };

  return (
    <main className="bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen overflow-x-hidden">
      <section className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
        {/* Logo/Brand Section */}
        <div className="text-center mb-5 max-w-2xl animate-in fade-in duration-500">
          <div className="mb-2">
            <h1 className="text-3xl md:text-4xl text-gradient leading-tight tracking-[-2px] font-bold mb-1">ATSChecker</h1>
          </div>
          <h2 className="text-lg md:text-xl font-semibold mb-1">Create Your Account</h2>
          <p className="text-xs md:text-sm text-dark-200">Start tracking your applications</p>
        </div>

        <div className="flex flex-col items-center justify-center w-full max-w-[480px] animate-in slide-in-from-bottom-4 duration-700">
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl w-full border border-gray-100">
            {!pendingVerification ? (
              <>  
                {/* Sign Up Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {/* Email Input */}
                  <div className="flex flex-col gap-1.5 w-full">
                    <label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        disabled={isLoading}
                        className="w-full pl-9 pr-4 py-2.5 inset-shadow rounded-xl focus:outline-none focus:ring-2 focus:ring-[#606beb] bg-white text-sm border border-gray-200 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="flex flex-col gap-1.5 w-full">
                    <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        required
                        disabled={isLoading}
                        minLength={8}
                        className="w-full pl-9 pr-4 py-2.5 inset-shadow rounded-xl focus:outline-none focus:ring-2 focus:ring-[#606beb] bg-white text-sm border border-gray-200 transition-all"
                      />
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-start gap-2 text-red-600 text-xs bg-red-50 p-3 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="primary-gradient rounded-xl py-2.5 px-6 cursor-pointer w-full text-sm font-semibold text-white hover:primary-gradient-hover hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1 flex items-center justify-center gap-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-4 my-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                  <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">Or</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                </div>

                {/* OAuth Button */}
                <button
                  onClick={handleGoogleSignUp}
                  className="w-full bg-white border-2 border-gray-200 hover:border-[#606beb] hover:bg-gray-50 rounded-xl px-4 py-2.5 cursor-pointer transition-all flex items-center justify-center gap-2 text-xs font-medium text-gray-700 hover:text-[#606beb] shadow-sm hover:shadow-md"
                  type="button"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>

                {/* Sign In Link */}
                <div className="text-center mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-600">
                    Already have an account?{" "}
                    <a href="/sign-in" className="text-[#606beb] hover:text-[#4957eb] font-semibold hover:underline transition-all">
                      Sign in here
                    </a>
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Verification Form */}
                <div className="text-center mb-4 animate-in fade-in slide-in-from-top-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#8e98ff] to-[#606beb] rounded-full mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gradient mb-1">Check Your Email</h3>
                  <p className="text-xs text-gray-600">
                    We sent a code to<br />
                    <strong className="text-gray-800">{email}</strong>
                  </p>
                </div>

                <form onSubmit={handleVerification} className="flex flex-col gap-4">
                  {/* Verification Code Input */}
                  <div className="flex flex-col gap-1.5 w-full">
                    <label htmlFor="code" className="text-sm font-medium text-gray-700 text-center">Enter Verification Code</label>
                    <input
                      type="text"
                      id="code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="000000"
                      required
                      disabled={isLoading}
                      maxLength={6}
                      className="w-full px-4 py-2.5 inset-shadow rounded-xl focus:outline-none focus:ring-2 focus:ring-[#606beb] bg-white text-center text-xl font-mono tracking-widest border border-gray-200 transition-all"
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="flex items-start gap-2 text-red-600 text-xs bg-red-50 p-3 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Verify Button */}
                  <button
                    type="submit"
                    className="primary-gradient rounded-xl py-2.5 px-6 cursor-pointer w-full text-sm font-semibold text-white hover:primary-gradient-hover hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1 flex items-center justify-center gap-2"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Verify & Continue</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Resend Link */}
                <div className="text-center mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-600">
                    Didn't receive the code?{" "}
                    <button
                      onClick={() => signUp?.prepareEmailAddressVerification({ strategy: "email_code" })}
                      className="text-[#606beb] hover:text-[#4957eb] font-semibold hover:underline transition-all"
                    >
                      Resend code
                    </button>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
