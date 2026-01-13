import type { JSX } from "react";
import { Link } from "react-router";
import { useAuth } from "@clerk/clerk-react";
import ProfileMenu from "./ProfileMenu";

const Navbar: () => JSX.Element = () => {
  const { isSignedIn } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/">
        <p className="text-2xl font-bold text-gradient">ATSChecker</p>
      </Link>
      <div className="flex items-center gap-4">
        {isSignedIn && (
          <Link to="/upload" className="primary-button w-fit">
            Upload Resume
          </Link>
        )}
        {isSignedIn ? (
          <ProfileMenu />
        ) : (
          <Link to="/sign-in" className="primary-button w-fit">
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;