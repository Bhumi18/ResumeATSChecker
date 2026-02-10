import { useState, useRef } from "react";
import { useUser, useAuth } from "../lib/auth-context";
import { useNavigate } from "react-router";

export default function AccountPage() {
  const { user } = useUser();
  const { updateProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "accounts">("profile");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Profile form state
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [username, setUsername] = useState(user?.username || "");

  // Password form state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await updateProfile({
        firstName,
        lastName,
      });
      
      if (result.success) {
        setMessage("Name updated successfully!");
        setIsEditingName(false);
        setTimeout(() => setMessage(""), 3000);
      } else {
        setError(result.error || "Failed to update name");
      }
    } catch (err: any) {
      setError("Failed to update name");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await updateProfile({ username });
      
      if (result.success) {
        setMessage("Username updated successfully!");
        setIsEditingUsername(false);
        setTimeout(() => setMessage(""), 3000);
      } else {
        setError(result.error || "Failed to update username");
      }
    } catch (err: any) {
      setError("Failed to update username");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      // For now, image upload is not implemented in custom auth
      // You would need to add an upload endpoint
      setError("Profile picture upload is not yet implemented");
    } catch (err: any) {
      setError("Failed to update profile picture");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!user) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      // For now, not implemented
      setError("Profile picture removal is not yet implemented");
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to remove profile picture");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      // Password update would need a new API endpoint
      setError("Password change is not yet implemented. Please contact support.");
      setShowPasswordModal(false);
    } catch (err: any) {
      console.error("Password change error:", err);
      
      // Provide clear error messages
      if (err.errors?.[0]?.code === "form_password_incorrect") {
        setError("Current password is incorrect. Please try again.");
      } else if (err.errors?.[0]?.message?.includes("Reverification") || err.errors?.[0]?.code === "reverification_required") {
        setError("For security reasons, please sign out and sign back in before changing your password.");
      } else if (err.errors?.[0]?.code === "form_password_pwned") {
        setError("This password has been found in a data breach. Please choose a different password.");
      } else if (err.errors?.[0]?.code === "form_password_size_in_bytes") {
        setError("Password must be at least 8 characters long.");
      } else {
        setError(err.errors?.[0]?.message || err.message || "Failed to change password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };



  const handleConnectGoogle = async () => {
    setError("OAuth connections are not yet implemented in the custom authentication system");
  };

  const handleDisconnectAccount = async (accountId: string) => {
    setError("Disconnecting OAuth accounts is not yet implemented in the custom authentication system");
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    { id: "security", label: "Security", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
    { id: "accounts", label: "Connected Accounts", icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" },
  ];

  return (
    <div className="min-h-screen bg-[url('/images/bg-main.svg')] bg-cover py-10 overflow-x-hidden">
      <div className="flex flex-col items-center justify-center px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gradient mb-2">Account Settings</h1>
          <p className="text-dark-200">Manage your profile and account preferences</p>
        </div>

        {/* Main Container */}
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setError("");
                  setMessage("");
                }}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? "text-[#606beb] border-b-2 border-[#606beb] bg-gradient-to-b from-[#606beb]/5 to-transparent"
                    : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Messages */}
            {message && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {message}
              </div>
            )}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-8">
                {/* Profile Picture Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile picture</h3>
                  <div className="flex items-center gap-6">
                    {user?.imageUrl ? (
                      <img
                        src={user.imageUrl}
                        alt={(user.firstName && user.lastName) ? `${user.firstName} ${user.lastName}` : "User"}
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full primary-gradient flex items-center justify-center text-white text-2xl font-bold border-2 border-gray-200">
                        {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="flex gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all disabled:opacity-50"
                      >
                        Upload
                      </button>
                      {user?.imageUrl && (
                        <button
                          onClick={handleRemoveImage}
                          disabled={loading}
                          className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium transition-all disabled:opacity-50"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <hr className="border-gray-200" />

                {/* Name Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Name</h3>
                    {!isEditingName && (
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="text-sm text-[#606beb] hover:text-[#4957eb] font-medium"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {isEditingName ? (
                    <form onSubmit={handleUpdateName} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            First name
                          </label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#606beb]/20 focus:border-[#606beb]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Last name
                          </label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#606beb]/20 focus:border-[#606beb]"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-4 py-2 text-sm primary-gradient text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingName(false);
                            setFirstName(user?.firstName || "");
                            setLastName(user?.lastName || "");
                          }}
                          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="text-gray-700">{user?.fullName || "—"}</p>
                  )}
                </div>

                <hr className="border-gray-200" />

                {/* Username Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Username</h3>
                    {!isEditingUsername && (
                      <button
                        onClick={() => setIsEditingUsername(true)}
                        className="text-sm text-[#606beb] hover:text-[#4957eb] font-medium"
                      >
                        {user?.username ? "Edit" : "Add"}
                      </button>
                    )}
                  </div>
                  {isEditingUsername ? (
                    <form onSubmit={handleUpdateUsername} className="space-y-4">
                      <div>
                        <input
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Enter username"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#606beb]/20 focus:border-[#606beb]"
                          required
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-4 py-2 text-sm primary-gradient text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingUsername(false);
                            setUsername(user?.username || "");
                          }}
                          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="text-gray-700">{user?.username || "—"}</p>
                  )}
                </div>

                <hr className="border-gray-200" />

                {/* Email Address Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Email address</h3>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{user?.primaryEmailAddress?.emailAddress}</p>
                      {user?.primaryEmailAddress?.verification?.status === "verified" && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded font-medium mt-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-8">
                {/* Password Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Password</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Change your password to keep your account secure.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(true)}
                    className="px-4 py-2 text-sm primary-gradient text-white rounded-lg font-medium hover:shadow-lg transition-all"
                  >
                    Update password
                  </button>
                </div>

                <hr className="border-gray-200" />

                {/* Delete Account Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete account</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Permanently delete your account and all associated data.
                  </p>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                        user?.delete().then(() => {
                          navigate("/sign-in");
                        }).catch((err: any) => {
                          setError(err.errors?.[0]?.message || "Failed to delete account");
                        });
                      }
                    }}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all"
                  >
                    Delete account
                  </button>
                </div>
              </div>
            )}

            {/* Connected Accounts Tab */}
            {activeTab === "accounts" && (
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-6">Connected Accounts</h3>
                
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl text-center">
                  <div className="w-16 h-16 bg-white border border-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">OAuth Connections Coming Soon</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    The ability to connect external accounts like Google is not yet available in the custom authentication system.
                  </p>
                  <p className="text-xs text-gray-500">
                    This feature will be added in a future update.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPasswordModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Update Password</h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setError("");
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Current password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#606beb]/20 focus:border-[#606beb]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    New password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#606beb]/20 focus:border-[#606beb]"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#606beb]/20 focus:border-[#606beb]"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 text-sm primary-gradient text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? "Updating..." : "Update password"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setError("");
                    }}
                    disabled={loading}
                    className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="mt-6">
          <button 
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-[#606beb] hover:text-[#4957eb] font-semibold transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
