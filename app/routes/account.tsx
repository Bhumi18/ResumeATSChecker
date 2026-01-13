import { useState, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router";

export default function AccountPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "accounts">("profile");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [isAddingPhone, setIsAddingPhone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Profile form state
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [username, setUsername] = useState(user?.username || "");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingEmailId, setPendingEmailId] = useState<string | null>(null);
  const [pendingPhoneId, setPendingPhoneId] = useState<string | null>(null);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 2FA state
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await user.update({
        firstName,
        lastName,
      });
      setMessage("Name updated successfully!");
      setIsEditingName(false);
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to update name");
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
      await user.update({
        username,
      });
      setMessage("Username updated successfully!");
      setIsEditingUsername(false);
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to update username");
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
      await user.setProfileImage({ file });
      setMessage("Profile picture updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to update profile picture");
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
      await user.setProfileImage({ file: null });
      setMessage("Profile picture removed successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to remove profile picture");
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const emailAddress = await user.createEmailAddress({ email: newEmail });
      await emailAddress.prepareVerification({ strategy: "email_code" });
      setPendingEmailId(emailAddress.id);
      setMessage("Verification code sent to your email!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to add email");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pendingEmailId) return;

    setLoading(true);
    setError("");

    try {
      const emailAddress = user.emailAddresses.find(e => e.id === pendingEmailId);
      await emailAddress?.attemptVerification({ code: verificationCode });
      setMessage("Email verified successfully!");
      setIsAddingEmail(false);
      setPendingEmailId(null);
      setNewEmail("");
      setVerificationCode("");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to verify email");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveEmail = async (emailId: string) => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const emailAddress = user.emailAddresses.find(e => e.id === emailId);
      await emailAddress?.destroy();
      setMessage("Email removed successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to remove email");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimaryEmail = async (emailId: string) => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      await user.update({
        primaryEmailAddressId: emailId,
      });
      setMessage("Primary email updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to set primary email");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const phoneNumber = await user.createPhoneNumber({ phoneNumber: newPhone });
      await phoneNumber.prepareVerification();
      setPendingPhoneId(phoneNumber.id);
      setMessage("Verification code sent to your phone!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to add phone number");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pendingPhoneId) return;

    setLoading(true);
    setError("");

    try {
      const phoneNumber = user.phoneNumbers.find(p => p.id === pendingPhoneId);
      await phoneNumber?.attemptVerification({ code: verificationCode });
      setMessage("Phone number verified successfully!");
      setIsAddingPhone(false);
      setPendingPhoneId(null);
      setNewPhone("");
      setVerificationCode("");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to verify phone number");
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhone = async (phoneId: string) => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const phoneNumber = user.phoneNumbers.find(p => p.id === phoneId);
      await phoneNumber?.destroy();
      setMessage("Phone number removed successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to remove phone number");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimaryPhone = async (phoneId: string) => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      await user.update({
        primaryPhoneNumberId: phoneId,
      });
      setMessage("Primary phone updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to set primary phone");
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
      await user.updatePassword({
        currentPassword,
        newPassword,
      });
      setMessage("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      const response = await user.createTOTP();
      // Generate QR code URL from the URI
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(response.uri || "")}`;
      setQrCode(qrCodeUrl);
      setBackupCodes(response.backupCodes || []);
      setIsEnabling2FA(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to enable 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      await user.verifyTOTP({ code: twoFactorCode });
      setMessage("Two-factor authentication enabled successfully!");
      setIsEnabling2FA(false);
      setTwoFactorCode("");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to verify 2FA code");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      await user.disableTOTP();
      setMessage("Two-factor authentication disabled successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to disable 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    if (!user) return;
    
    setLoading(true);
    setError("");
    
    try {
      await user.createExternalAccount({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
      });
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to connect Google account");
      setLoading(false);
    }
  };

  const handleDisconnectAccount = async (accountId: string) => {
    if (!user) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await user.externalAccounts.find(acc => acc.id === accountId)?.destroy();
      setMessage("Account disconnected successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Failed to disconnect account");
    } finally {
      setLoading(false);
    }
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
                        alt={user.fullName || "User"}
                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full primary-gradient flex items-center justify-center text-white text-2xl font-bold border-2 border-gray-200">
                        {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0]?.toUpperCase()}
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

                {/* Email Addresses Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Email addresses</h3>
                    {!isAddingEmail && !pendingEmailId && (
                      <button
                        onClick={() => setIsAddingEmail(true)}
                        className="text-sm text-[#606beb] hover:text-[#4957eb] font-medium"
                      >
                        + Add email address
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {user?.emailAddresses.map((email) => (
                      <div key={email.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3 flex-1">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{email.emailAddress}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {email.id === user.primaryEmailAddressId && (
                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                                  Primary
                                </span>
                              )}
                              {email.verification?.status === "verified" ? (
                                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded font-medium flex items-center gap-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Verified
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded font-medium">
                                  Unverified
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {email.id !== user.primaryEmailAddressId && email.verification?.status === "verified" && (
                            <button
                              onClick={() => handleSetPrimaryEmail(email.id)}
                              disabled={loading}
                              className="text-xs text-[#606beb] hover:text-[#4957eb] font-medium disabled:opacity-50"
                            >
                              Set as primary
                            </button>
                          )}
                          {user.emailAddresses.length > 1 && (
                            <button
                              onClick={() => handleRemoveEmail(email.id)}
                              disabled={loading || email.id === user.primaryEmailAddressId}
                              className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {isAddingEmail && !pendingEmailId && (
                    <form onSubmit={handleAddEmail} className="mt-4 space-y-4">
                      <div>
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="Enter email address"
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
                          Continue
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingEmail(false);
                            setNewEmail("");
                          }}
                          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {pendingEmailId && (
                    <form onSubmit={handleVerifyEmail} className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Enter verification code
                        </label>
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="Enter 6-digit code"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#606beb]/20 focus:border-[#606beb]"
                          required
                          maxLength={6}
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-4 py-2 text-sm primary-gradient text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                        >
                          Verify
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPendingEmailId(null);
                            setVerificationCode("");
                            setIsAddingEmail(false);
                            setNewEmail("");
                          }}
                          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                <hr className="border-gray-200" />

                {/* Phone Numbers Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Phone numbers</h3>
                    {!isAddingPhone && !pendingPhoneId && (
                      <button
                        onClick={() => setIsAddingPhone(true)}
                        className="text-sm text-[#606beb] hover:text-[#4957eb] font-medium"
                      >
                        + Add phone number
                      </button>
                    )}
                  </div>
                  {user?.phoneNumbers && user.phoneNumbers.length > 0 ? (
                    <div className="space-y-3">
                      {user.phoneNumbers.map((phone) => (
                        <div key={phone.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3 flex-1">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">{phone.phoneNumber}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {phone.id === user.primaryPhoneNumberId && (
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                                    Primary
                                  </span>
                                )}
                                {phone.verification?.status === "verified" ? (
                                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded font-medium flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Verified
                                  </span>
                                ) : (
                                  <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded font-medium">
                                    Unverified
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {phone.id !== user.primaryPhoneNumberId && phone.verification?.status === "verified" && (
                              <button
                                onClick={() => handleSetPrimaryPhone(phone.id)}
                                disabled={loading}
                                className="text-xs text-[#606beb] hover:text-[#4957eb] font-medium disabled:opacity-50"
                              >
                                Set as primary
                              </button>
                            )}
                            <button
                              onClick={() => handleRemovePhone(phone.id)}
                              disabled={loading}
                              className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No phone numbers added</p>
                  )}
                  
                  {isAddingPhone && !pendingPhoneId && (
                    <form onSubmit={handleAddPhone} className="mt-4 space-y-4">
                      <div>
                        <input
                          type="tel"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          placeholder="Enter phone number"
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
                          Continue
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingPhone(false);
                            setNewPhone("");
                          }}
                          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {pendingPhoneId && (
                    <form onSubmit={handleVerifyPhone} className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Enter verification code
                        </label>
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="Enter 6-digit code"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#606beb]/20 focus:border-[#606beb]"
                          required
                          maxLength={6}
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-4 py-2 text-sm primary-gradient text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                        >
                          Verify
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPendingPhoneId(null);
                            setVerificationCode("");
                            setIsAddingPhone(false);
                            setNewPhone("");
                          }}
                          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-8">
                {/* Password Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Password</h3>
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

                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 text-sm primary-gradient text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {loading ? "Updating..." : "Update password"}
                    </button>
                  </form>
                </div>

                <hr className="border-gray-200" />

                {/* Two-Factor Authentication Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Two-factor authentication</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Add an additional layer of security to your account during sign in.
                  </p>
                  
                  {user?.twoFactorEnabled ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="text-sm font-medium text-green-700">Two-factor authentication is enabled</span>
                      </div>
                      <button
                        onClick={handleDisable2FA}
                        disabled={loading}
                        className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-all disabled:opacity-50"
                      >
                        Disable two-factor authentication
                      </button>
                    </div>
                  ) : isEnabling2FA ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-800 mb-3">
                          Scan this QR code with your authenticator app
                        </h4>
                        {qrCode && (
                          <div className="flex justify-center mb-4">
                            <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                          </div>
                        )}
                        
                        {backupCodes.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-800 mb-2">Backup codes</h4>
                            <p className="text-xs text-gray-600 mb-2">
                              Save these codes in a safe place. Each code can only be used once.
                            </p>
                            <div className="grid grid-cols-2 gap-2 p-3 bg-white rounded border border-gray-200 font-mono text-xs">
                              {backupCodes.map((code, index) => (
                                <div key={index} className="text-gray-800">{code}</div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <form onSubmit={handleVerify2FA} className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              Enter code from authenticator app
                            </label>
                            <input
                              type="text"
                              value={twoFactorCode}
                              onChange={(e) => setTwoFactorCode(e.target.value)}
                              placeholder="Enter 6-digit code"
                              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#606beb]/20 focus:border-[#606beb]"
                              required
                              maxLength={6}
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              type="submit"
                              disabled={loading}
                              className="px-4 py-2 text-sm primary-gradient text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                            >
                              {loading ? "Verifying..." : "Enable"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsEnabling2FA(false);
                                setTwoFactorCode("");
                                setQrCode("");
                                setBackupCodes([]);
                              }}
                              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleEnable2FA}
                      disabled={loading}
                      className="px-4 py-2 text-sm primary-gradient text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      Enable two-factor authentication
                    </button>
                  )}
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
                
                <div className="space-y-4">
                  {/* Google Account */}
                  {user?.externalAccounts?.some(acc => acc.provider === "google") ? (
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">Google</p>
                          <p className="text-sm text-gray-600">
                            {user.externalAccounts.find(acc => acc.provider === "google")?.emailAddress}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const googleAccount = user.externalAccounts.find(acc => acc.provider === "google");
                          if (googleAccount) handleDisconnectAccount(googleAccount.id);
                        }}
                        disabled={loading}
                        className="px-6 py-2 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-all disabled:opacity-50"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">Google</p>
                          <p className="text-sm text-gray-600">Not connected</p>
                        </div>
                      </div>
                      <button
                        onClick={handleConnectGoogle}
                        disabled={loading}
                        className="px-6 py-2 primary-gradient text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        Connect
                      </button>
                    </div>
                  )}

                  <p className="text-sm text-gray-500 mt-4">
                    Connect your accounts to sign in with one click
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

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
