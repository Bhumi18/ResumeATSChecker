import { useAuth } from "../lib/auth-context";
import { Navigate } from "react-router";
import { useState, useEffect } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoaded) {
      const timer = setTimeout(() => setTimedOut(true), 8000);
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  if (!isLoaded) {
    if (timedOut) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
          <div className="text-2xl font-semibold text-red-500">Authentication Failed to Load</div>
          <p className="text-gray-400 text-center max-w-md">
            Clerk authentication service could not be reached. This usually means your
            <code className="bg-gray-800 px-1 rounded"> VITE_CLERK_PUBLISHABLE_KEY </code>
            in <code className="bg-gray-800 px-1 rounded">.env</code> is invalid or the Clerk instance was deleted.
          </p>
          <p className="text-gray-500 text-sm">Get a valid key from <a href="https://dashboard.clerk.com" target="_blank" className="text-blue-400 underline">dashboard.clerk.com</a></p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Retry</button>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl text-gradient">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
}
