import type { JSX } from "react";
import { Link } from "react-router";
import { useAuth } from "../lib/auth-context";
import ProfileMenu from "./ProfileMenu";

const Navbar: () => JSX.Element = () => {
  const { isSignedIn } = useAuth();

  return (
    <nav className="navbar bg-white border-b border-gray-200 sticky top-0 z-50">
      <Link to="/" className="hover:opacity-80 transition-opacity duration-200">
        <p className="text-2xl font-bold text-ink-900">ATSEngine</p>
      </Link>
      <div className="flex items-center gap-3">
        {isSignedIn && (
          <Link to="/upload" className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
            Upload Resume
          </Link>
        )}
        {isSignedIn ? (
          <ProfileMenu />
        ) : (
          <Link to="/sign-in" className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;