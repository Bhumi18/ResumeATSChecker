import type { JSX } from "react";
import { Link } from "react-router";
import { useAuth } from "../lib/auth-context";
import ProfileMenu from "./ProfileMenu";

const Navbar: () => JSX.Element = () => {
  const { isSignedIn } = useAuth();

  return (
    <nav className="navbar backdrop-blur-lg bg-white/80 shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <Link to="/" className="hover:scale-105 transition-transform duration-200">
        <p className="text-2xl font-bold text-gradient">ATSEngine</p>
      </Link>
      <div className="flex items-center gap-3">
        {isSignedIn && (
          <Link to="/upload" className="primary-button w-fit shadow-md hover:shadow-lg transition-all duration-200">
            <span className="mr-2">📤</span> Upload Resume
          </Link>
        )}
        {isSignedIn ? (
          <ProfileMenu />
        ) : (
          <Link to="/sign-in" className="primary-button w-fit shadow-md hover:shadow-lg transition-all duration-200">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;