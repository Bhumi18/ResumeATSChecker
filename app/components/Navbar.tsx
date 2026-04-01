import type { JSX } from "react";
import { Link } from "react-router";
import { useState } from "react";
import { useAuth } from "../lib/auth-context";
import ProfileMenu from "./ProfileMenu";

const Navbar: () => JSX.Element = () => {
  const { isSignedIn } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <nav className="navbar bg-white/95 border-b border-gray-200 sticky top-0 z-50 backdrop-blur-md transition-all duration-300">
      <Link
        to="/dashboard"
        className="group flex items-center gap-2 transition-all duration-300"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <p
          className="text-2xl font-bold text-ink-900 transition-all duration-300"
          style={{
            letterSpacing: isHovered ? '2px' : 'normal',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          ATS<span
            className="transition-all duration-300"
            style={{
              color: '#111827',
            }}
          >Engine</span>
        </p>
      </Link>
      <div className="flex items-center gap-3">
        {isSignedIn && (
          <Link
            to="/upload"
            className="btn-interactive group px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 flex items-center gap-2 relative overflow-hidden"
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <svg
              className="w-4 h-4 transition-all duration-300 group-hover:rotate-180 relative z-10"
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
            <span className="relative z-10">Upload Resume</span>
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
