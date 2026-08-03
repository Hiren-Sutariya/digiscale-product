"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { createPortal } from "react-dom";
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
  Paintbrush,
  Languages,
  Keyboard,
} from "lucide-react";

import PageTitle from "@/components/ui/pageTitle";
import { getUserProfile, updateUserProfile, deleteAccount, getUserSettings, updateUserSettings, changePassword, logout } from "@/services/api";
import { getCache } from "@/lib/cache";
import { useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "profile");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const tabs = [
    { id: "profile",      label: "Profile",            icon: User },
    { id: "company",      label: "Company Details",    icon: Building },
    { id: "theme",        label: "Theme",              icon: Paintbrush },
    { id: "language",     label: "Language",           icon: Languages },
    { id: "shortcuts",    label: "Keyboard Shortcuts", icon: Keyboard },
    { id: "notifications", label: "Notifications",      icon: Bell },
    { id: "storage",      label: "Storage",            icon: HardDrive },
    { id: "billing",      label: "Billing",            icon: CreditCard },
    { id: "security",     label: "Security",           icon: Shield },
    { id: "backup",       label: "Data & Backup",      icon: HardDrive },
  ];

  return (
    <div className="p-8 h-[calc(100vh-80px)] flex flex-col overflow-hidden">

      <PageTitle
        title="Settings"
      />

      <div className="mt-8 flex-1 grid gap-8 lg:grid-cols-[280px_1fr] overflow-hidden min-h-0">

        {/* Sidebar Tabs */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 space-y-1.5 shadow-sm h-fit shrink-0 overflow-y-auto max-h-[70vh]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-blue-50 text-blue-700 font-extrabold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-50" />
              </button>
            );
          })}

          <hr className="my-3 border-slate-100" />

          <button 
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
            className="flex w-full items-center gap-4 rounded-xl px-4 py-2.5 text-xs font-bold text-red-650 transition hover:bg-red-50 cursor-pointer"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <LogOut className="h-4 w-4" />
            </div>
            Sign Out
          </button>
        </div>

        {/* Content */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 overflow-y-auto h-full shadow-sm">
          {activeTab === "profile"       && <ProfileSection />}
          {activeTab === "company"       && <CompanySection />}
          {activeTab === "theme"         && <ThemeSection />}
          {activeTab === "language"      && <LanguageSection />}
          {activeTab === "shortcuts"     && <KeyboardShortcutsSection />}
          {activeTab === "notifications" && <NotificationsSection />}
          {activeTab === "storage"       && <StorageSection />}
          {activeTab === "billing"       && <BillingSection />}
          {activeTab === "security"      && <SecuritySection />}
          {activeTab === "backup"        && <BackupSection />}
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
  const [autoRemoveBg, setAutoRemoveBg] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isEmailEditable, setIsEmailEditable] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verification states
  const [originalEmail, setOriginalEmail] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");
  const [verificationType, setVerificationType] = useState<"new_email" | "phone" | null>(null);
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
          setAutoRemoveBg(settingsData.auto_remove_background || false);
          setAvatarUrl(settingsData.avatar_url || null);
          setLoading(false);
        } catch(e) {}
      }
    }

    Promise.all([getUserProfile(), getUserSettings()])
      .then(([profileData, settingsData]) => {
        if (profileData) {
          setName(profileData.name || "");
          setEmail(profileData.email || "");
          setOriginalEmail(profileData.email || "");
        }
        
        if (settingsData) {
          setPhone(settingsData.phone || "");
          setOriginalPhone(settingsData.phone || "");
          setGender(settingsData.gender || "Male");
          setAutoRemoveBg(settingsData.auto_remove_background || false);
          setAvatarUrl(settingsData.avatar_url || null);
        }
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
      await updateUserSettings({
        phone,
        gender,
        avatar_url: avatarUrl,
        auto_remove_background: autoRemoveBg
      });
      
      await updateUserProfile(name, email);
      
      // Update global context for navbar sync
      localStorage.setItem("user_name", name);
      localStorage.setItem("user_email", email);
      if (avatarUrl) localStorage.setItem(`digiscale_avatar_${email}`, avatarUrl);
      
      setOriginalEmail(email);
      setOriginalPhone(phone);
      
      setStatusMsg({ type: "success", text: "Changes saved successfully!" });
      setSaving(false);
      
      // Dispatch event for components to sync if they want
      window.dispatchEvent(new Event("profileUpdated"));
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
      setVerificationType("new_email");
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

    if (verificationType === "new_email") {
      // Stage 1 verified! Check if phone also changed
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

        <div className="sm:col-span-2 mt-4 p-4 rounded-xl border border-blue-100 bg-blue-50/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 text-sm">Auto Remove Background</p>
              <p className="mt-1 text-xs text-slate-500">Automatically remove image backgrounds when uploading in Collections.</p>
            </div>
            <button
              type="button"
              onClick={() => setAutoRemoveBg(!autoRemoveBg)}
              className={`relative h-7 w-12 rounded-full transition ${autoRemoveBg ? "bg-blue-600" : "bg-slate-300"}`}
            >
              <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition ${autoRemoveBg ? "left-[22px]" : "left-0.5"}`} />
            </button>
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
              {verificationType === "new_email" && (
                <div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    To update your email, we must verify your new email address. A 6-digit verification code has been sent to:
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
        if (data) {
          setUser(data);
          if (data.plan === "Starter" && data.created_at) {
            const created = new Date(data.created_at);
            const expiry = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
            const diffMs = expiry.getTime() - Date.now();
            const days = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
            setDaysLeft(days);
          }
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

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  const handlePasswordChange = async () => {
    setPwdError("");
    setPwdSuccess(false);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPwdError("All fields are required.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwdError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPwdError("New password must be at least 8 characters long.");
      return;
    }

    setPwdLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPwdSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      setPwdError(err.message || "Failed to update password.");
    } finally {
      setPwdLoading(false);
    }
  };

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
      logout();
      
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

        {pwdError && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            {pwdError}
          </div>
        )}
        {pwdSuccess && (
          <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600 border border-emerald-200">
            Password updated successfully.
          </div>
        )}

        <div className="mt-6 space-y-4">
          <input
            type="password"
            placeholder="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white py-3 px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white py-3 px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white py-3 px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
          />
        </div>

        <button
          onClick={handlePasswordChange}
          disabled={pwdLoading}
          className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {pwdLoading ? "Updating..." : "Update Password"}
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
  const [qrCode, setQrCode] = useState<string | null>(null);
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
  const qrInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([getUserProfile(), getUserSettings()])
      .then(([profileData, settingsData]) => {
        if (profileData) {
          setName(profileData.name || "");
          setEmail(profileData.email || "");
        }
        if (settingsData) {
          setLogo(settingsData.company_logo || null);
          setName(settingsData.company_name || "");
          setEmail(settingsData.company_email || "");
          setPrimaryPhone(settingsData.company_primary_phone || "");
          setSecondaryPhone(settingsData.company_secondary_phone || "");
          setAddress(settingsData.company_address || "");
          setWebsite(settingsData.company_website || "");
          setGst(settingsData.company_gst || "");
          setBankName(settingsData.company_bank_name || "");
          setAccountNumber(settingsData.company_account_number || "");
          setIfsc(settingsData.company_ifsc || "");
          setUpiId(settingsData.company_upi_id || "");
          setQrCode(settingsData.company_qr_code || null);
          setTermsAndConditions(settingsData.company_terms || "");
        }
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

  const handleQrCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.size > 2 * 1024 * 1024) {
        setStatusMsg({ type: "error", text: "QR Code size exceeds 2MB." });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setQrCode(base64);
        setStatusMsg({ type: "success", text: "QR Code selected! Click Save Changes to store." });
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
        company_qr_code: qrCode,
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

        <input
          type="file"
          ref={qrInputRef}
          onChange={handleQrCodeChange}
          accept="image/*"
          className="hidden"
        />

        <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shadow-inner text-slate-400 ml-6">
          {qrCode ? (
            <img src={qrCode} alt="Custom QR Code" className="h-full w-full object-cover" />
          ) : (
            <QrCode className="h-10 w-10 text-slate-400" />
          )}
        </div>

        <div>
          <button
            onClick={() => qrInputRef.current?.click()}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 shadow-sm active:scale-95"
          >
            Upload Custom QR
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

/* ============ Backup Section ============ */

/* ============ Backup Section ============ */
import { 
  createBackupPayload, 
  downloadExcelFromBackupPayload, 
  restoreBackupFromExcel, 
  restoreBackupPayload, 
  formatBackupDate,
  deleteAllWorkspaceData
} from "@/lib/backup";
import { 
  getBackupsFromIndexedDB, 
  deleteBackupFromIndexedDB,
  saveBackupToIndexedDB
} from "@/lib/db";
import { 
  Download, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  X, 
  Database
} from "lucide-react";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function BackupSection() {
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [lastBackupTime, setLastBackupTime] = useState<string>("Never");
  const [autoBackupFrequency, setAutoBackupFrequency] = useState<string>("7");
  const [localBackups, setLocalBackups] = useState<any[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom modal state
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    message: string;
    type: "success" | "error" | "confirm";
    onConfirm?: () => void;
  } | null>(null);

  // Load user profile and IndexedDB backups on mount
  useEffect(() => {
    getUserProfile().then((profile) => {
      if (profile && profile.id) {
        setCurrentUserId(profile.id.toString());
      }
    });

    if (typeof window !== "undefined") {
      const storedLast = localStorage.getItem("digiscale_last_backup_time");
      if (storedLast) setLastBackupTime(storedLast);

      const storedFreq = localStorage.getItem("digiscale_auto_backup_frequency") || "7";
      setAutoBackupFrequency(storedFreq);
    }

    refreshBackupHistory();
  }, []);

  const refreshBackupHistory = async () => {
    try {
      const backups = await getBackupsFromIndexedDB();
      setLocalBackups(backups);
    } catch (e) {
      console.error("Failed to load local backups from IndexedDB:", e);
    }
  };

  const getBackupSize = (bak: any): number => {
    try {
      return JSON.stringify(bak).length;
    } catch {
      return 0;
    }
  };

  const totalBackupSize = localBackups.reduce((sum, bak) => sum + getBackupSize(bak), 0);

  const handleCreateLocalSnapshot = async () => {
    if (!currentUserId) {
      setModalConfig({
        title: "Error",
        message: "User profile not loaded yet. Please try again in a moment.",
        type: "error"
      });
      return;
    }
    setLoading(true);
    try {
      const payload = await createBackupPayload(currentUserId);
      const timestamp = new Date().toISOString();
      await saveBackupToIndexedDB(timestamp, {
        fileName: `Backup_${timestamp.split("T")[0]}.xlsx`,
        ...payload
      });
      localStorage.setItem("digiscale_last_backup_time", timestamp);
      setLastBackupTime(timestamp);
      setModalConfig({
        title: "Snapshot Created",
        message: "Your live database snapshot has been successfully saved to history without file download.",
        type: "success"
      });
      await refreshBackupHistory();
    } catch (err: any) {
      setModalConfig({
        title: "Error",
        message: "Failed to create local snapshot: " + (err.message || err),
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualExport = async () => {
    if (!currentUserId) {
      setModalConfig({
        title: "Error",
        message: "User profile not loaded yet. Please try again in a moment.",
        type: "error"
      });
      return;
    }
    setLoading(true);
    try {
      const payload = await createBackupPayload(currentUserId);
      
      // Download Excel
      downloadExcelFromBackupPayload(payload);

      // Save a local auto-backup copy in IndexedDB
      const timestamp = new Date().toISOString();
      await saveBackupToIndexedDB(timestamp, {
        fileName: `Backup_${timestamp.split("T")[0]}.xlsx`,
        ...payload
      });

      // Update state
      localStorage.setItem("digiscale_last_backup_time", timestamp);
      setLastBackupTime(timestamp);
      
      setModalConfig({
        title: "Success",
        message: "Your live database has been successfully downloaded as an Excel workbook and saved to history.",
        type: "success"
      });
      await refreshBackupHistory();
    } catch (err: any) {
      setModalConfig({
        title: "Error",
        message: "Failed to generate Excel backup: " + (err.message || err),
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!currentUserId) {
      setModalConfig({
        title: "Error",
        message: "User profile not loaded yet. Please try again.",
        type: "error"
      });
      return;
    }

    setLoading(true);

    try {
      const count = await restoreBackupFromExcel(file, currentUserId);
      setModalConfig({
        title: "Database Restored",
        message: `Your live database has been perfectly restored with ${count} items. Workspace will reload to apply changes.`,
        type: "success",
        onConfirm: () => {
          window.location.reload();
        }
      });
    } catch (err: any) {
      setModalConfig({
        title: "Error Restoring",
        message: err.message || "Failed to restore backup. Invalid Excel spreadsheet format.",
        type: "error"
      });
      setLoading(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerRestoreLocal = (timestamp: string, backup: any) => {
    if (!currentUserId) return;
    setModalConfig({
      title: "Confirm Restore",
      message: "Are you sure you want to restore this local snapshot? This will overwrite all collections, products, warehouse slots, and quotations currently on Supabase.",
      type: "confirm",
      onConfirm: async () => {
        setLoading(true);
        try {
          await restoreBackupPayload(backup, currentUserId);
          setModalConfig({
            title: "Database Restored",
            message: "Your database has been successfully restored from local snapshot. Reloading workspace...",
            type: "success",
            onConfirm: () => {
              window.location.reload();
            }
          });
        } catch (err: any) {
          setModalConfig({
            title: "Restore Failed",
            message: "Failed to restore from local snapshot: " + (err.message || err),
            type: "error"
          });
          setLoading(false);
        }
      }
    });
  };

  const handleDownloadLocal = (backup: any) => {
    try {
      downloadExcelFromBackupPayload(backup);
    } catch (err: any) {
      setModalConfig({
        title: "Download Failed",
        message: "Failed to generate Excel download: " + (err.message || err),
        type: "error"
      });
    }
  };

  const triggerDeleteLocal = async (timestamp: string) => {
    if (window.confirm("Are you sure you want to delete this backup snapshot? This action is permanent and cannot be undone.")) {
      try {
        await deleteBackupFromIndexedDB(timestamp);
        await refreshBackupHistory();
      } catch (err: any) {
        setModalConfig({
          title: "Delete Failed",
          message: "Failed to delete backup snapshot: " + (err.message || err),
          type: "error"
        });
      }
    }
  };

  const handleFrequencyChange = (val: string) => {
    setAutoBackupFrequency(val);
    localStorage.setItem("digiscale_auto_backup_frequency", val);
  };

  const getFrequencyLabel = (freq: string): string => {
    switch (freq) {
      case "off": return "Off (Disable Auto-Backups)";
      case "1": return "Every Day (Daily)";
      case "7": return "Every 7 Days (Weekly)";
      case "30": return "Every 30 Days (Monthly)";
      default: return "Every 7 Days (Weekly)";
    }
  };

  const handleEraseAllData = async () => {
    if (!currentUserId) return;
    
    setModalConfig({
      title: "Confirm Erase All Data",
      message: "WARNING: This will permanently erase ALL your workspace data (Products, Collections, Clients, etc.). Your user profile and settings will be preserved. Are you absolutely sure you want to proceed?",
      type: "confirm",
      onConfirm: async () => {
        setLoading(true);
        try {
          await deleteAllWorkspaceData(currentUserId);
          setModalConfig({
            title: "Workspace Erased",
            message: "All workspace data has been permanently deleted.",
            type: "success"
          });
          setTimeout(() => window.location.reload(), 2000);
        } catch (err: any) {
          console.error(err);
          setModalConfig({
            title: "Erase Failed",
            message: "Failed to erase workspace data: " + (err.message || err),
            type: "error"
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Custom Alert/Confirm Modal Popup */}
      {modalConfig && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => {
              if (modalConfig.type !== "confirm") setModalConfig(null);
            }}
          />
          <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-2xl transition-all duration-300 scale-100 border border-slate-100 z-10">
            <div className="flex items-start gap-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                modalConfig.type === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                modalConfig.type === "error" ? "bg-red-50 text-red-600 border border-red-100" :
                "bg-amber-50 text-amber-600 border border-amber-100"
              }`}>
                {modalConfig.type === "success" && <CheckCircle className="h-5 w-5" />}
                {modalConfig.type === "error" && <AlertCircle className="h-5 w-5" />}
                {modalConfig.type === "confirm" && <AlertTriangle className="h-5 w-5" />}
              </div>
              
              <div className="flex-1 mt-0.5">
                <h3 className={`text-base font-bold leading-6 ${
                  modalConfig.type === 'error' ? 'text-red-600' :
                  modalConfig.type === 'success' ? 'text-emerald-700' :
                  modalConfig.type === 'confirm' ? 'text-amber-700' : 'text-slate-900'
                }`}>
                  {modalConfig.title}
                </h3>
                <div className="mt-2">
                  <p className="text-[13px] text-slate-500 font-semibold leading-relaxed">
                    {modalConfig.message}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              {modalConfig.type === "confirm" && (
                <button
                  type="button"
                  className="inline-flex justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors focus:outline-none"
                  onClick={() => setModalConfig(null)}
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                className={`inline-flex justify-center rounded-lg border border-transparent px-5 py-2 text-xs font-bold text-white transition-colors focus:outline-none shadow-sm ${
                  modalConfig.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                  modalConfig.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  modalConfig.type === 'confirm' ? 'bg-amber-600 hover:bg-amber-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
                onClick={() => {
                  if (modalConfig.onConfirm) {
                    modalConfig.onConfirm();
                  } else {
                    setModalConfig(null);
                  }
                }}
              >
                {modalConfig.type === "confirm" ? "Proceed" : "OK"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">Data & Backup</h2>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Manage your live Supabase database backups, exports, and automatic background snapshots.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
            <Clock className="h-3.5 w-3.5" />
            Last Backup: {lastBackupTime === "Never" ? "Never" : formatBackupDate(lastBackupTime)}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-100">
            <HardDrive className="h-3.5 w-3.5" />
            Backup Storage: {formatBytes(totalBackupSize)}
          </span>
        </div>
      </div>

      {/* Top Controls Grid: Auto-Backup, Manual Actions, Danger Zone */}
      <div className="grid gap-5 md:grid-cols-3 relative z-20">
        {/* 1. Auto Backup Configuration */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col h-full">
          <div>
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Auto-Backup
            </h3>
            <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed font-semibold">
              Automatically take background snapshots stored securely in your browser's IndexedDB.
            </p>
          </div>
          <div className="mt-auto pt-4">
            <label className="mb-1.5 block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Frequency</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 transition hover:bg-slate-50 outline-none shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  {getFrequencyLabel(autoBackupFrequency)}
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute left-0 right-0 mt-2 z-50 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl transition-all">
                    {[
                      { value: "off", label: "Off (Disable)" },
                      { value: "1", label: "Every Day" },
                      { value: "7", label: "Every 7 Days" },
                      { value: "30", label: "Every 30 Days" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { handleFrequencyChange(opt.value); setDropdownOpen(false); }}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-[11px] font-bold transition ${autoBackupFrequency === opt.value ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"}`}
                      >
                        <span>{opt.label}</span>
                        {autoBackupFrequency === opt.value && <Check className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 2. Manual Backup Actions */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm flex flex-col h-full">
          <div>
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Manual Actions
            </h3>
            <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed font-semibold">
              Create, download, or restore backups manually from Excel files.
            </p>
          </div>
          <div className="mt-auto pt-4 space-y-2">
            <div className="flex gap-2">
              <button onClick={handleCreateLocalSnapshot} disabled={loading} className="flex-1 rounded-xl border border-blue-600 bg-white text-blue-600 py-2 text-[11px] font-bold transition hover:bg-blue-50 active:scale-98">
                Local Backup
              </button>
              <button onClick={handleManualExport} disabled={loading} className="flex-1 rounded-xl bg-blue-600 text-white py-2 text-[11px] font-bold transition hover:bg-blue-700 active:scale-98">
                Export Excel
              </button>
            </div>
            <div>
              <input type="file" accept=".xlsx" className="hidden" ref={fileInputRef} onChange={handleUploadBackup} />
              <button onClick={() => fileInputRef.current?.click()} disabled={loading} className="w-full rounded-xl border border-slate-300 bg-white py-2 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50">
                {loading ? "Restoring..." : "Import Excel Backup"}
              </button>
            </div>
          </div>
        </div>

        {/* 3. Danger Zone */}
        <div className="rounded-xl border border-red-200 bg-red-50/80 p-5 flex flex-col h-full shadow-sm">
          <div>
            <h3 className="font-bold text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </h3>
            <p className="mt-1.5 text-[11px] text-red-600/80 leading-relaxed font-bold">
              Permanently erase all workspace data (Products, Collections, etc.). Irrecoverable without backup.
            </p>
          </div>
          <div className="mt-auto pt-4">
            <button onClick={handleEraseAllData} disabled={loading} className="w-full rounded-xl bg-red-600 py-2 text-[11px] font-bold text-white transition hover:bg-red-700 flex items-center justify-center gap-2 active:scale-98 shadow-sm">
              <Trash2 className="h-3.5 w-3.5" />
              {loading ? "Erasing Data..." : "Erase All Data"}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Local Backup Snapshots History Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Local Backup Snapshots</h3>
            <p className="text-[11px] text-slate-500 font-semibold">Restore or download any local snapshot directly from IndexedDB.</p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
            Total: {localBackups.length}
          </span>
        </div>
        {localBackups.length === 0 ? (
          <div className="p-8 text-center text-xs font-bold text-slate-400 bg-slate-50/50">
            No local snapshots stored yet.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[35vh] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-50 shadow-sm z-10">
                <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 shadow-sm">
                  <th className="py-2.5 px-5">Date & Time</th>
                  <th className="py-2.5 px-5">Name</th>
                  <th className="py-2.5 px-5">Size</th>
                  <th className="py-2.5 px-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700 bg-white">
                {localBackups.map((bak) => (
                  <tr key={bak.timestamp} className="hover:bg-slate-50/50 transition">
                    <td className="py-2.5 px-5 font-bold text-slate-900">{formatBackupDate(bak.timestamp)}</td>
                    <td className="py-2.5 px-5 text-slate-500">{bak.fileName || "Auto-saved snapshot"}</td>
                    <td className="py-2.5 px-5 text-slate-600 font-bold">{formatBytes(getBackupSize(bak))}</td>
                    <td className="py-2.5 px-5">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => triggerRestoreLocal(bak.timestamp, bak)} disabled={loading} className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition font-bold flex items-center gap-1.5" title="Restore">
                          <RefreshCw className="h-3 w-3" /> Restore
                        </button>
                        <button onClick={() => handleDownloadLocal(bak)} className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition font-bold flex items-center gap-1.5" title="Download">
                          <Download className="h-3 w-3" /> Save
                        </button>
                        <button onClick={() => triggerDeleteLocal(bak.timestamp)} className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


/* ============ Theme Section ============ */
function ThemeSection() {
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">("light");
  const [accentColor, setAccentColor] = useState<string>("blue");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const mode = localStorage.getItem("digiscale_theme_mode") as any || "light";
      const color = localStorage.getItem("digiscale_theme_accent") || "blue";
      setThemeMode(mode);
      setAccentColor(color);
    }
  }, []);

  const handleSaveTheme = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("digiscale_theme_mode", themeMode);
      localStorage.setItem("digiscale_theme_accent", accentColor);
      alert("Theme settings saved successfully!");
    }
  };

  const ACCENTS = [
    { id: "blue", label: "Blue", bg: "bg-blue-600" },
    { id: "indigo", label: "Indigo", bg: "bg-indigo-600" },
    { id: "emerald", label: "Emerald", bg: "bg-emerald-600" },
    { id: "violet", label: "Violet", bg: "bg-violet-600" },
    { id: "rose", label: "Rose", bg: "bg-rose-600" },
    { id: "amber", label: "Amber", bg: "bg-amber-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Theme</h2>
        <p className="mt-1 text-sm text-slate-500">
          Customize the appearance and accent color of the workspace.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="mb-3 block text-sm font-bold text-slate-700">Theme Mode</label>
          <div className="grid grid-cols-3 gap-3">
            {([
              { id: "light", label: "Light Mode", desc: "Classic bright appearance" },
              { id: "dark", label: "Dark Mode", desc: "Easy on eyes in dark rooms" },
              { id: "system", label: "System Sync", desc: "Follow system preference" },
            ] as const).map(t => (
              <button
                key={t.id}
                onClick={() => setThemeMode(t.id)}
                className={`p-4 rounded-xl border text-left transition ${
                  themeMode === t.id
                    ? "border-blue-600 bg-blue-50/40 text-blue-900 shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="text-xs font-black">{t.label}</div>
                <div className="text-[10px] text-slate-400 font-semibold mt-1">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-3 block text-sm font-bold text-slate-700">Accent Color</label>
          <div className="flex flex-wrap gap-3">
            {ACCENTS.map(acc => (
              <button
                key={acc.id}
                onClick={() => setAccentColor(acc.id)}
                className={`w-10 h-10 rounded-full border-2 transition relative flex items-center justify-center cursor-pointer ${
                  accentColor === acc.id ? "border-slate-800 scale-105" : "border-transparent hover:scale-105"
                }`}
              >
                <div className={`w-7.5 h-7.5 rounded-full ${acc.bg} shadow-sm`} />
                {accentColor === acc.id && (
                  <Check className="absolute w-4.5 h-4.5 text-white stroke-[3.5px]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleSaveTheme}
        className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 shadow-md shadow-blue-600/10 active:scale-95"
      >
        Save Theme Settings
      </button>
    </div>
  );
}

/* ============ Language Section ============ */
function LanguageSection() {
  const [selectedLang, setSelectedLang] = useState<string>("en");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSelectedLang(localStorage.getItem("digiscale_language") || "en");
    }
  }, []);

  const handleSaveLanguage = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("digiscale_language", selectedLang);
      alert("Language setting saved! The app will reload to apply translation.");
      window.location.reload();
    }
  };

  const LANGUAGES = [
    { id: "en", name: "English", sub: "United States & Global" },
    { id: "gu", name: "Gujarati (ગુજરાતી)", sub: "India (Gujarat)" },
    { id: "hi", name: "Hindi (हिन्दी)", sub: "India (National)" },
    { id: "es", name: "Spanish (Español)", sub: "Spain & Latin America" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Language</h2>
        <p className="mt-1 text-sm text-slate-500">
          Choose your default system display language.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {LANGUAGES.map(lang => (
          <button
            key={lang.id}
            onClick={() => setSelectedLang(lang.id)}
            className={`p-4 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
              selectedLang === lang.id
                ? "border-blue-600 bg-blue-50/40"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <div>
              <span className={`text-xs font-bold block ${selectedLang === lang.id ? "text-blue-900" : "text-slate-800"}`}>
                {lang.name}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{lang.sub}</span>
            </div>
            {selectedLang === lang.id && (
              <Check className="w-4 h-4 text-blue-600" />
            )}
          </button>
        ))}
      </div>

      <button
        onClick={handleSaveLanguage}
        className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 shadow-md shadow-blue-600/10 active:scale-95"
      >
        Save Language Settings
      </button>
    </div>
  );
}

/* ============ Keyboard Shortcuts Section ============ */
function KeyboardShortcutsSection() {
  const SHORTCUTS = [
    { keys: ["Ctrl", "Z"], action: "Undo", desc: "Revert the last change made to the design." },
    { keys: ["Ctrl", "Shift", "Z"], action: "Redo", desc: "Restore the last undone action." },
    { keys: ["Ctrl", "D"], action: "Duplicate", desc: "Copy and paste the selected canvas object." },
    { keys: ["Delete", "Backspace"], action: "Delete selection", desc: "Remove selected text/image from canvas." },
    { keys: ["Ctrl", "L"], action: "Lock / Unlock", desc: "Lock the selected element position or unlock it." },
    { keys: ["Arrow Keys"], action: "Move element", desc: "Move active object on canvas pixel by pixel." },
    { keys: ["Ctrl", "Plus"], action: "Zoom In", desc: "Increase canvas scale visibility." },
    { keys: ["Ctrl", "Minus"], action: "Zoom Out", desc: "Decrease canvas scale visibility." },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Keyboard Shortcuts</h2>
        <p className="mt-1 text-sm text-slate-500">
          Boost your design efficiency with editor keyboard hotkeys.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black tracking-wider text-slate-500 uppercase">
              <th className="py-3 px-5">Shortcut Hotkeys</th>
              <th className="py-3 px-5">Action</th>
              <th className="py-3 px-5">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {SHORTCUTS.map((s, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition">
                <td className="py-3 px-5">
                  <div className="flex items-center gap-1">
                    {s.keys.map((k, kid) => (
                      <kbd key={kid} className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-md font-mono text-[10px] text-slate-800 shadow-sm">
                        {k}
                      </kbd>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-5 font-bold text-slate-900">{s.action}</td>
                <td className="py-3 px-5 text-slate-500 font-medium">{s.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============ Storage Section ============ */
function StorageSection() {
  const [cachedHistoryCount, setCachedHistoryCount] = useState(0);
  const [cachedSnapshotsCount, setCachedSnapshotsCount] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hist = localStorage.getItem("digiscale_export_history");
      if (hist) {
        try {
          setCachedHistoryCount(JSON.parse(hist).length);
        } catch (e) {}
      }
      
      getBackupsFromIndexedDB().then(bak => {
        setCachedSnapshotsCount(bak.length);
      }).catch(() => {});
    }
  }, []);

  const handleClearCache = () => {
    if (window.confirm("Are you sure you want to clear export history logs? This will reset your Export History list.")) {
      localStorage.removeItem("digiscale_export_history");
      setCachedHistoryCount(0);
      alert("Cache cleared successfully!");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Storage</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage local caching, snapshots, and file storage sizes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Export Log Items</div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{cachedHistoryCount} items</p>
          <p className="mt-1 text-xs text-slate-500 font-semibold">Cached locally in browser storage.</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">IndexedDB Snapshots</div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{cachedSnapshotsCount} snapshots</p>
          <p className="mt-1 text-xs text-slate-500 font-semibold">Local backup points available to restore.</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 p-5 bg-white space-y-3 shadow-sm">
        <div>
          <span className="text-xs font-bold text-slate-900 block">Clear Temporary Files</span>
          <span className="text-[11px] text-slate-500 font-semibold block mt-1 leading-relaxed">
            Free up browser local storage space by clearing export log queues and histories.
          </span>
        </div>
        <button
          onClick={handleClearCache}
          className="px-4 py-2 border border-slate-350 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-bold rounded-lg transition active:scale-95"
        >
          Clear Export Logs Cache
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading settings...</div>}>
      <SettingsPageContent />
    </Suspense>
  );
}
