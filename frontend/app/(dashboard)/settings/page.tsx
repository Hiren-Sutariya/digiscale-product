"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  CreditCard,
  Shield,
  Bell,
  LogOut,
  ChevronRight,
  Gem,
  HardDrive,
  Image,
  Check,
  Phone,
  Building,
  MapPin,
  Globe,
  Landmark,
  FileText,
  ChevronDown,
  Users,
  Trash2,
  QrCode,
} from "lucide-react";

import PageTitle from "@/components/ui/pageTitle";
import { getUserProfile, updateUserProfile, deleteAccount, getUserSettings, updateUserSettings } from "@/services/api";
import { getCache } from "@/lib/cache";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "company", label: "Company Profile", icon: Building },
    { id: "billing", label: "Plan & Billing", icon: CreditCard },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="p-8">

      <PageTitle
        title="Settings"
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">

        {/* Sidebar Tabs */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 space-y-1.5 shadow-sm h-fit shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-blue-50 text-blue-700 font-extrabold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
                <ChevronRight className="ml-auto h-4 w-4 opacity-50" />
              </button>
            );
          })}

          <hr className="my-3 border-slate-100" />

          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-650 transition hover:bg-red-55">
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>

        {/* Content */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8">
          {activeTab === "profile" && <ProfileSection />}
          {activeTab === "company" && <CompanySection />}
          {activeTab === "billing" && <BillingSection />}
          {activeTab === "notifications" && <NotificationsSection />}
          {activeTab === "security" && <SecuritySection />}
        </div>

      </div>
    </div>
  );
}

/* ============ Profile Section ============ */
function ProfileSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("Male");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isEmailEditable, setIsEmailEditable] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verification states
  const [originalEmail, setOriginalEmail] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");
  const [verificationType, setVerificationType] = useState<"old_email" | "new_email" | "phone" | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [userInputCode, setUserInputCode] = useState("");
  const [verificationError, setVerificationError] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedProfile = localStorage.getItem("digiscale_profile");
      const cachedSettings = localStorage.getItem("digiscale_settings");
      if (cachedProfile && cachedSettings) {
        try {
          const profileData = JSON.parse(cachedProfile);
          const settingsData = JSON.parse(cachedSettings);
          setName(profileData.name);
          setEmail(profileData.email);
          setOriginalEmail(profileData.email);
          setPhone(settingsData.phone || "");
          setOriginalPhone(settingsData.phone || "");
          setGender(settingsData.gender || "Male");
          setAvatarUrl(settingsData.avatar_url || null);
          setLoading(false);
        } catch(e) {}
      }
    }

    Promise.all([getUserProfile(), getUserSettings()])
      .then(([profileData, settingsData]) => {
        setName(profileData.name);
        setEmail(profileData.email);
        setOriginalEmail(profileData.email);
        
        setPhone(settingsData.phone || "");
        setOriginalPhone(settingsData.phone || "");
        setGender(settingsData.gender || "Male");
        setAvatarUrl(settingsData.avatar_url || null);
        setLoading(false);
      })
      .catch((err) => {
        setStatusMsg({ 
          type: "error", 
          text: "Failed to connect to server." 
        });
        setLoading(false);
      });
  }, []);

  const getInitials = (n: string) => {
    if (!n) return "U";
    const parts = n.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.size > 2 * 1024 * 1024) {
        setStatusMsg({ type: "error", text: "Image size exceeds 2MB." });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setAvatarUrl(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const executeProfileSave = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      await updateUserProfile(name, email);
      
      await updateUserSettings({
        phone,
        gender,
        avatar_url: avatarUrl
      });
      
      // Update global context for navbar sync
      localStorage.setItem("user_name", name);
      localStorage.setItem("user_email", email);
      if (avatarUrl) localStorage.setItem(`digiscale_avatar_${email}`, avatarUrl);
      
      setOriginalEmail(email);
      setOriginalPhone(phone);
      
      setStatusMsg({ type: "success", text: "Changes saved successfully!" });
      setSaving(false);
      
      // Force page reload after short delay to sync navbar
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to update profile." });
      setSaving(false);
    }
  };

  const handleSave = async () => {
    // 1. Email verification trigger
    if (email !== originalEmail) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setVerificationCode(code);
      setVerificationType("old_email");
      setUserInputCode("");
      setVerificationError("");
      return;
    }

    // 2. Phone verification trigger
    if (phone !== originalPhone) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setVerificationCode(code);
      setVerificationType("phone");
      setUserInputCode("");
      setVerificationError("");
      return;
    }

    // 3. Normal save
    executeProfileSave();
  };

  const handleVerifyCode = () => {
    if (userInputCode !== verificationCode) {
      setVerificationError("Invalid verification code. Please check and try again.");
      return;
    }

    setVerificationError("");

    if (verificationType === "old_email") {
      // Stage 1 verified! Now send code to new email address
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setVerificationCode(code);
      setVerificationType("new_email");
      setUserInputCode("");
    } else if (verificationType === "new_email") {
      // Stage 2 verified! Check if phone also changed
      if (phone !== originalPhone) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setVerificationCode(code);
        setVerificationType("phone");
        setUserInputCode("");
      } else {
        setVerificationType(null);
        executeProfileSave();
      }
    } else if (verificationType === "phone") {
      // Phone verification verified! Save profile changes
      setVerificationType(null);
      executeProfileSave();
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Profile</h2>
        <p className="mt-1 text-sm text-slate-500">
          Update your personal information.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`rounded-xl p-4 text-sm font-semibold border ${
            statusMsg.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Avatar */}
      <div className="flex items-center gap-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAvatarChange}
          accept="image/*"
          className="hidden"
        />

        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white overflow-hidden shadow-inner">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            getInitials(name)
          )}
        </div>

        <div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 shadow-sm active:scale-95"
          >
            Change Avatar
          </button>
          <p className="mt-2 text-xs text-slate-400">
            JPG, PNG. Max 2MB
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm text-slate-800 font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-bold text-slate-700">
              Email
            </label>
            {!isEmailEditable ? (
              <button
                type="button"
                onClick={() => setIsEmailEditable(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 transition active:scale-95"
              >
                Edit Email
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsEmailEditable(false);
                  setEmail(originalEmail);
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-600 transition active:scale-95"
              >
                Cancel
              </button>
            )}
          </div>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={email}
              disabled={!isEmailEditable}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full rounded-xl border py-3 pl-12 pr-4 text-sm font-medium outline-none transition ${
                !isEmailEditable
                  ? "bg-slate-50 border-slate-200 text-slate-450 cursor-not-allowed"
                  : "bg-white border-slate-300 text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              }`}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Mobile Number
          </label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="tel"
              placeholder="Enter mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm text-slate-800 font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Gender
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-10 text-sm text-slate-800 font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 cursor-pointer appearance-none"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 shadow-md shadow-blue-600/10 active:scale-95 disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Changes"}
      </button>

      {/* Verification Modal Dialog */}
      {verificationType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Verification Required
                </h3>
                <p className="text-xs text-slate-500">
                  Step-by-step verification process
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {verificationType === "old_email" && (
                <div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    To update your email, we must first verify your ownership of the current email address. A 6-digit verification code has been sent to:
                  </p>
                  <p className="mt-1 font-semibold text-slate-900 text-sm">{originalEmail}</p>
                </div>
              )}

              {verificationType === "new_email" && (
                <div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Now we must verify your new email address. A 6-digit verification code has been sent to:
                  </p>
                  <p className="mt-1 font-semibold text-slate-900 text-sm">{email}</p>
                </div>
              )}

              {verificationType === "phone" && (
                <div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    To verify your mobile number, a 6-digit verification code has been sent to:
                  </p>
                  <p className="mt-1 font-semibold text-slate-900 text-sm">{phone}</p>
                </div>
              )}

              {/* Testing code display to allow user verification */}
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-center">
                <p className="text-xs font-semibold text-amber-800">
                  [DEMO TESTING ONLY] Verification Code:
                </p>
                <p className="mt-1 text-xl font-mono font-bold tracking-widest text-amber-900">
                  {verificationCode}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter code"
                  value={userInputCode}
                  onChange={(e) => setUserInputCode(e.target.value.trim())}
                  className="w-full text-center rounded-xl border border-slate-300 bg-white py-3 font-mono text-lg font-bold tracking-widest outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {verificationError && (
                <p className="text-xs font-bold text-red-650 text-center">
                  {verificationError}
                </p>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setVerificationType(null)}
                className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyCode}
                className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 transition active:scale-95 shadow-md shadow-blue-500/15"
              >
                Verify Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============ Billing Section ============ */
function BillingSection() {
  const [user, setUser] = useState<{ plan: string; credits_limit: number; credits_used: number; created_at?: string } | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(!getCache("profile"));

  useEffect(() => {
    getUserProfile()
      .then((data) => {
        setUser(data);
        if (data.plan === "Starter" && data.created_at) {
          const created = new Date(data.created_at);
          const expiry = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
          const diffMs = expiry.getTime() - Date.now();
          const days = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
          setDaysLeft(days);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const creditsUsed = user?.credits_used ?? 0;
  const creditsLimit = user?.credits_limit ?? 30;
  const progressPercent = Math.min(100, Math.round((creditsUsed / creditsLimit) * 100));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Plan & Billing</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage your subscription and usage.
        </p>
      </div>

      {/* Current Plan */}
      <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/50 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Gem className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-bold text-slate-900">
                {user?.plan === "Starter" ? "7-Day Free Trial" : `${user?.plan} Plan`}
              </span>
              <span className="rounded-full bg-blue-100 px-3 py-0.5 text-xs font-semibold text-blue-700">
                CURRENT
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600 font-medium">
              {user?.plan === "Starter"
                ? `Starter free trial. ${daysLeft !== null ? `${daysLeft} trial days remaining.` : "7 trial days remaining."}`
                : `Active subscriber plan with ${creditsLimit} image credits.`}
            </p>
          </div>
          {user?.plan === "Starter" && (
            <Link
              href="/pricing"
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-500/10"
            >
              Upgrade to Pro
            </Link>
          )}
        </div>
      </div>

      {/* Usage */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <Image className="h-5 w-5 text-slate-400" />
          <p className="mt-3 text-2xl font-bold text-slate-900">{creditsUsed} / {creditsLimit}</p>
          <p className="mt-1 text-sm text-slate-550 font-bold">Credits Used</p>
          <div className="mt-3 h-2 rounded-full bg-slate-250">
            <div className="h-2 rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <HardDrive className="h-5 w-5 text-slate-400" />
          <p className="mt-3 text-2xl font-bold text-slate-900">{(creditsUsed * 1.8).toFixed(1)} MB</p>
          <p className="mt-1 text-sm text-slate-550 font-bold">Storage Used</p>
          <div className="mt-3 h-2 rounded-full bg-slate-250">
            <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, progressPercent * 0.8)}%` }} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <Image className="h-5 w-5 text-slate-400" />
          <p className="mt-3 text-2xl font-bold text-slate-900">{creditsUsed}</p>
          <p className="mt-1 text-sm text-slate-550 font-bold">Total Exports</p>
        </div>
      </div>
    </div>
  );
}

/* ============ Notifications Section ============ */
function NotificationsSection() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [projectNotifs, setProjectNotifs] = useState(true);
  const [marketingNotifs, setMarketingNotifs] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Notifications</h2>
        <p className="mt-1 text-sm text-slate-500">
          Choose what notifications you want to receive.
        </p>
      </div>

      <div className="space-y-4">
        {[
          {
            title: "Email Notifications",
            desc: "Receive processing results via email.",
            value: emailNotifs,
            setter: setEmailNotifs,
          },
          {
            title: "Project Updates",
            desc: "Get notified when processing completes.",
            value: projectNotifs,
            setter: setProjectNotifs,
          },
          {
            title: "Marketing Emails",
            desc: "Tips, new features and product updates.",
            value: marketingNotifs,
            setter: setMarketingNotifs,
          },
        ].map((item) => (
          <div
            key={item.title}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-5"
          >
            <div>
              <p className="font-medium text-slate-900">{item.title}</p>
              <p className="mt-1 text-sm text-slate-500">{item.desc}</p>
            </div>

            <button
              onClick={() => item.setter(!item.value)}
              className={`relative h-7 w-12 rounded-full transition ${
                item.value ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <div
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition ${
                  item.value ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ Security Section ============ */
function SecuritySection() {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [confirmInput, setConfirmInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDeleteTrigger = () => {
    setShowConfirmModal(true);
    setDeleteStep(1);
    setConfirmInput("");
    setErrorMsg("");
  };

  const handleNextStep = () => {
    setDeleteStep(2);
    setConfirmInput("");
    setErrorMsg("");
  };

  const handleFinalDelete = async () => {
    if (confirmInput !== "DELETE MY ACCOUNT") {
      setErrorMsg("Please type the exact phrase to confirm.");
      return;
    }

    setDeleting(true);
    setErrorMsg("");
    try {
      await deleteAccount();
      
      // Clear user login credentials
      localStorage.removeItem("token");
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_email");
      
      setShowConfirmModal(false);
      
      // Redirect to login page with a query parameter
      window.location.href = "/login?msg=scheduled_deletion";
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to schedule account deletion.");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Security</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage your password and account security.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h3 className="font-semibold text-slate-900">Change Password</h3>
        <p className="mt-1 text-sm text-slate-500">
          Update your password to keep your account secure.
        </p>

        <div className="mt-6 space-y-4">
          <input
            type="password"
            placeholder="Current Password"
            className="w-full rounded-xl border border-slate-300 bg-white py-3 px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
          <input
            type="password"
            placeholder="New Password"
            className="w-full rounded-xl border border-slate-300 bg-white py-3 px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            className="w-full rounded-xl border border-slate-300 bg-white py-3 px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>

        <button className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700">
          Update Password
        </button>
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h3 className="font-semibold text-red-700">Danger Zone</h3>
        <p className="mt-1 text-sm text-red-650 font-medium">
          Scheduling account deletion initiates a 7-day grace period. Logging back in resets deletion, otherwise your account is permanently deleted.
        </p>
        <button
          onClick={handleDeleteTrigger}
          className="mt-4 rounded-xl border border-red-300 bg-white px-5 py-2.5 text-sm font-bold text-red-650 hover:bg-red-100/55 transition active:scale-95 shadow-sm"
        >
          Delete Account
        </button>
      </div>

      {/* Delete Confirmation Modal Overlay */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            {deleteStep === 1 && (
              <div>
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Step 1: Confirm Deletion
                    </h3>
                    <p className="text-xs text-slate-500">
                      Grace period check
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  <p className="text-sm text-slate-605 leading-relaxed font-medium">
                    Are you sure you want to schedule your account for deletion?
                  </p>
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs font-semibold text-amber-800 leading-relaxed">
                    ⚠️ IMPORTANT: Your data will remain intact for 7 days. You can cancel this request at any time by logging back in before the grace period ends.
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-750 transition active:scale-95 shadow-md shadow-red-500/15"
                  >
                    Next Step
                  </button>
                </div>
              </div>
            )}

            {deleteStep === 2 && (
              <div>
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Step 2: Confirm Phrase
                    </h3>
                    <p className="text-xs text-slate-500">
                      Type phrase to delete
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    To confirm scheduling account deletion, please type the exact phrase <strong className="text-red-700">DELETE MY ACCOUNT</strong> below:
                  </p>
                  
                  <input
                    type="text"
                    placeholder="DELETE MY ACCOUNT"
                    value={confirmInput}
                    onChange={(e) => setConfirmInput(e.target.value)}
                    className="w-full text-center rounded-xl border border-slate-300 bg-white py-3 font-semibold text-sm outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-550/10"
                  />

                  {errorMsg && (
                    <p className="text-xs font-bold text-red-650 text-center">
                      {errorMsg}
                    </p>
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFinalDelete}
                    disabled={deleting}
                    className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-750 transition active:scale-95 shadow-md shadow-red-550/15 disabled:opacity-60"
                  >
                    {deleting ? "Scheduling..." : "Confirm Delete"}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

/* ============ Company Section ============ */
function CompanySection() {
  const [logo, setLogo] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [primaryPhone, setPrimaryPhone] = useState("");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [gst, setGst] = useState("");

  // Bank details
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");

  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(!(getCache("profile") && getCache("settings")));
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([getUserProfile(), getUserSettings()])
      .then(([profile, settingsData]) => {
        setLogo(settingsData.company_logo || null);
        setName(settingsData.company_name || "");
        setEmail(settingsData.company_email || profile.email);
        setPrimaryPhone(settingsData.company_primary_phone || "");
        setSecondaryPhone(settingsData.company_secondary_phone || "");
        setAddress(settingsData.company_address || "");
        setWebsite(settingsData.company_website || "");
        setGst(settingsData.company_gst || "");
        setBankName(settingsData.company_bank_name || "");
        setAccountNumber(settingsData.company_account_number || "");
        setIfsc(settingsData.company_ifsc || "");
        setTermsAndConditions(settingsData.company_terms || "");
        setUpiId(settingsData.company_upi_id || "");
        setLoading(false);
      })
      .catch(() => {
        setStatusMsg({ 
          type: "error", 
          text: "Failed to connect to server. Cannot load company profile." 
        });
        setLoading(false);
      });
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.size > 2 * 1024 * 1024) {
        setStatusMsg({ type: "error", text: "Logo size exceeds 2MB." });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setLogo(base64);
        setStatusMsg({ type: "success", text: "Logo selected! Click Save Changes to store." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      await updateUserSettings({
        company_logo: logo,
        company_name: name,
        company_email: email,
        company_primary_phone: primaryPhone,
        company_secondary_phone: secondaryPhone,
        company_address: address,
        company_website: website,
        company_gst: gst,
        company_bank_name: bankName,
        company_account_number: accountNumber,
        company_ifsc: ifsc,
        company_terms: termsAndConditions,
        company_upi_id: upiId,
      });

      setStatusMsg({ type: "success", text: "Company profile updated successfully!" });
      setSaving(false);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: "Failed to save company profile." });
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-900">Company Profile</h2>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
            Business Pro
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Create and manage your professional business details for outputs, invoices, and cards.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`rounded-xl p-4 text-sm font-semibold border ${
            statusMsg.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Company Logo Uploader */}
      <div className="flex items-center gap-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleLogoChange}
          accept="image/*"
          className="hidden"
        />

        <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shadow-inner text-slate-400">
          {logo ? (
            <img src={logo} alt="Company Logo" className="h-full w-full object-cover" />
          ) : (
            <Building className="h-10 w-10 text-slate-400" />
          )}
        </div>

        <div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 shadow-sm active:scale-95"
          >
            Upload Company Logo
          </button>
          <p className="mt-2 text-xs text-slate-400">
            Square PNG or JPG. Max 2MB
          </p>
        </div>
      </div>

      {/* General Business Info */}
      <div className="space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-450">
          General Information
        </h3>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Company Name
            </label>
            <div className="relative">
              <Building className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Enter company name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm text-slate-800 font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Company Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                placeholder="Enter company email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm text-slate-800 font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Primary Mobile Number
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                placeholder="Enter primary contact number"
                value={primaryPhone}
                onChange={(e) => setPrimaryPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm text-slate-800 font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Secondary Mobile Number
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                placeholder="Enter backup contact number"
                value={secondaryPhone}
                onChange={(e) => setSecondaryPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm text-slate-800 font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              GST Number (GSTIN)
            </label>
            <div className="relative">
              <FileText className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="24AAAAA0000A1Z5"
                value={gst}
                onChange={(e) => setGst(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm text-slate-800 font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Website URL
            </label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="url"
                placeholder="https://company.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm text-slate-800 font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Company Address
          </label>
          <div className="relative">
            <MapPin className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
            <textarea
              rows={3}
              placeholder="Enter full physical address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm text-slate-800 font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 resize-none"
            />
          </div>
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* Bank details info */}
      <div className="space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-450">
          Bank & Payout Details
        </h3>

        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Bank Name
            </label>
            <div className="relative">
              <Landmark className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="HDFC Bank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm text-slate-800 font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Account Number
            </label>
            <div className="relative">
              <CreditCard className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="50100234567890"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm text-slate-800 font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              IFSC Code
            </label>
            <div className="relative">
              <FileText className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="HDFC0000123"
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm text-slate-800 font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              UPI ID (For QR Code)
            </label>
            <div className="relative">
              <QrCode className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="company@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-sm text-slate-800 font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>
        </div>
      </div>

      <hr className="border-slate-200" />

      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-450">
          Terms & Conditions
        </h3>
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Invoice/Quotation Terms (Printed at bottom of quotation)
          </label>
          <textarea
            rows={4}
            placeholder="e.g. 1. Quotation valid for 30 days.&#10;2. Goods once sold will not be returned."
            value={termsAndConditions}
            onChange={(e) => setTermsAndConditions(e.target.value)}
            className="w-full rounded-xl border border-slate-350 bg-white py-3 px-4 text-sm text-slate-800 font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 shadow-md shadow-blue-600/10 active:scale-95 disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Company Profile"}
      </button>
    </div>
  );
}
