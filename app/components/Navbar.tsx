import type { JSX } from "react";
import { Link } from "react-router";
import { UserButton, useAuth } from "@clerk/clerk-react";

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
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-10 h-10",
              },
            }}
          />
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