import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import { Navigate } from "react-router";

// This route handles the OAuth callback after Google sign-in
export default function SSOCallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[url('/images/bg-auth.svg')] bg-cover">
      <div className="bg-white rounded-2xl p-8 shadow-xl">
        <div className="text-center">
          <div className="text-2xl text-gradient font-semibold mb-4">
            Completing sign in...
          </div>
          <div className="animate-pulse text-dark-200">Please wait</div>
        </div>
      </div>
      <AuthenticateWithRedirectCallback
        afterSignInUrl="/"
        afterSignUpUrl="/"
      />
    </div>
  );
}
