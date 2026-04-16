import type { JSX } from "react";
import { Link } from "react-router";
import { useAuth } from "../lib/auth-context";
import ProfileMenu from "./ProfileMenu";
import BrandLogo from "./BrandLogo";

const Navbar: () => JSX.Element = () => {
  const { isSignedIn } = useAuth();

  return (
    <nav className="navbar bg-white/95 border-b border-gray-200 sticky top-0 z-50 backdrop-blur-md transition-all duration-300">
      <Link
        to="/dashboard"
        className="group flex items-center gap-2 transition-all duration-300"
      >
        <BrandLogo size="md" className="transition-transform duration-300 group-hover:scale-105" />
      </Link>
      <div className="flex items-center gap-2 sm:gap-3">
        {isSignedIn && (
          <Link
            to="/upload"
            aria-label="Upload Resume"
            className="btn-interactive group px-3 sm:px-5 py-2 sm:py-2.5 bg-gray-900 text-white text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl hover:bg-gray-800 flex items-center gap-1.5 sm:gap-2 relative overflow-hidden"
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-300 group-hover:rotate-180 relative z-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="relative z-10 hidden sm:inline">Upload Resume</span>
            <span className="relative z-10 sm:hidden">Upload</span>
          </Link>
        )}
        {isSignedIn ? (
          <ProfileMenu />
        ) : (
          <Link
            to="/sign-in"
            className="btn-interactive px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative z-10">Sign In</span>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
