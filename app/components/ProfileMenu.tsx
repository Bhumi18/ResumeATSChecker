import { useState, useRef, useEffect } from "react";
import { useUser, useAuth } from "../lib/auth-context";
import { useNavigate } from "react-router";

export default function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useUser();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/sign-in");
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName[0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-900 text-white font-semibold text-sm transition-all duration-300 focus:outline-none"
        style={{
          transform: isHovered ? 'scale(1.15) rotate(5deg)' : 'scale(1) rotate(0)',
          boxShadow: isHovered ? '0 10px 25px -5px rgba(17, 24, 39, 0.4)' : 'none',
        }}
        aria-label="User menu"
      >
        {user?.imageUrl ? (
          <img
            src={user.imageUrl}
            alt={user.firstName || "User"}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span className="transition-transform duration-300" style={{ transform: isHovered ? 'scale(1.1)' : 'scale(1)' }}>
            {getInitials()}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-4 zoom-in-95 duration-300"
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-900 text-white font-semibold transition-all duration-300 hover:scale-110 hover:rotate-6"
                style={{
                  boxShadow: '0 0 20px rgba(17, 24, 39, 0.2)',
                }}
              >
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={user.firstName || "User"}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-lg">{getInitials()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink-900 truncate">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.firstName || "User"}
                </p>
                <p className="text-xs text-ink-400 truncate">
                  {user?.email || ""}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {/* Manage Account */}
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/account");
              }}
              className="menu-item-hover w-full px-4 py-2.5 text-left text-sm text-ink-700 flex items-center gap-3 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <svg
                className="w-4 h-4 text-ink-400 transition-all duration-300 group-hover:text-ink-700 group-hover:scale-125 relative z-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="transition-all duration-300 group-hover:text-ink-900 group-hover:font-medium relative z-10">
                Manage Account
              </span>
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 my-1"></div>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2.5 text-left text-sm text-red-600 flex items-center gap-3 group relative overflow-hidden transition-all duration-300 hover:bg-red-50"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <svg
              className="w-4 h-4 transition-all duration-300 group-hover:translate-x-2 group-hover:scale-110 relative z-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="transition-all duration-300 group-hover:font-medium relative z-10">Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
