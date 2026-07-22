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
} from "lucide-react";

import PageTitle from "@/components/ui/pageTitle";
import { supabase } from "@/lib/supabase";

async function getUserProfile() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No session found");
  const user = session.user;
  
  // Count how many products are created by this user
  const { count, error } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });
  
  return {
    name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
    email: user.email || "",
    plan: "Starter",
    credits_limit: 30,
    credits_used: error ? 0 : (count || 0),
    created_at: user.created_at
  };
}

async function updateUserProfile(name: string, email: string) {
  const { data, error } = await supabase.auth.updateUser({
    email: email,
    data: { full_name: name }
  });
  if (error) throw error;
  return data;
}

async function deleteAccount() {
  // Mock account deletion by signing out
  await supabase.auth.signOut();
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "company", label: "Company Profile", icon: Building },
    { id: "team", label: "Team Sharing", icon: Users },
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
          {activeTab === "team" && <TeamSharingSection />}
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
    getUserProfile()
      .then((data) => {
        setName(data.name);
        setEmail(data.email);
        setOriginalEmail(data.email);
        
        // Load other custom fields from localStorage
        const storedPhone = localStorage.getItem(`digiscale_phone_${data.email}`) || "";
        const storedGender = localStorage.getItem(`digiscale_gender_${data.email}`) || "Male";
        const storedAvatar = localStorage.getItem(`digiscale_avatar_${data.email}`) || null;
        
        setPhone(storedPhone);
        setOriginalPhone(storedPhone);
        setGender(storedGender);
        setAvatarUrl(storedAvatar);
        setLoading(false);
      })
      .catch((err) => {
        // Fallback to localStorage cached values
        const cachedName = localStorage.getItem("user_name") || "";
        const cachedEmail = localStorage.getItem("user_email") || "";
        setName(cachedName);
        setEmail(cachedEmail);
        setOriginalEmail(cachedEmail);
        
        const storedPhone = localStorage.getItem(`digiscale_phone_${cachedEmail}`) || "";
        const storedGender = localStorage.getItem(`digiscale_gender_${cachedEmail}`) || "Male";
        const storedAvatar = localStorage.getItem(`digiscale_avatar_${cachedEmail}`) || null;
        
        setPhone(storedPhone);
        setOriginalPhone(storedPhone);
        setGender(storedGender);
        setAvatarUrl(storedAvatar);

        setStatusMsg({ 
          type: "error", 
          text: "Failed to connect to server. Showing local profile. You can edit and save details locally below." 
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
    if (files && files[0] && email) {
      const file = files[0];
      if (file.size > 2 * 1024 * 1024) {
        setStatusMsg({ type: "error", text: "Image size exceeds 2MB." });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setAvatarUrl(base64);
        localStorage.setItem(`digiscale_avatar_${email}`, base64);
        setStatusMsg({ type: "success", text: "Avatar updated successfully!" });
      };
      reader.readAsDataURL(file);
    }
  };

  const executeProfileSave = async () => {
    setSaving(true);
    setStatusMsg(null);
    try {
      await updateUserProfile(name, email);
      
      // If email has changed, we should migrate the localStorage keys to the new email address scope!
      if (email !== originalEmail) {
        // Move avatar
        const av = localStorage.getItem(`digiscale_avatar_${originalEmail}`);
        if (av) localStorage.setItem(`digiscale_avatar_${email}`, av);
        
        // Move phone
        localStorage.setItem(`digiscale_phone_${email}`, phone);
        // Move gender
        localStorage.setItem(`digiscale_gender_${email}`, gender);
        
        // Clear old keys
        localStorage.removeItem(`digiscale_avatar_${originalEmail}`);
        localStorage.removeItem(`digiscale_phone_${originalEmail}`);
        localStorage.removeItem(`digiscale_gender_${originalEmail}`);
      } else {
        // Save normally
        localStorage.setItem(`digiscale_phone_${email}`, phone);
        localStorage.setItem(`digiscale_gender_${email}`, gender);
      }
      
      // Update global context for navbar sync
      localStorage.setItem("user_name", name);
      localStorage.setItem("user_email", email);
      
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
  const [loading, setLoading] = useState(true);

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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch profile first to get the user email for local storage key scoping
    getUserProfile()
      .then((profile) => {
        const emailKey = profile.email;
        const storedStr = localStorage.getItem(`digiscale_company_${emailKey}`);
        if (storedStr) {
          try {
            const data = JSON.parse(storedStr);
            setLogo(data.logo || null);
            setName(data.name || "");
            setEmail(data.email || "");
            setPrimaryPhone(data.primaryPhone || "");
            setSecondaryPhone(data.secondaryPhone || "");
            setAddress(data.address || "");
            setWebsite(data.website || "");
            setGst(data.gst || "");
            setBankName(data.bankName || "");
            setAccountNumber(data.accountNumber || "");
            setIfsc(data.ifsc || "");
          } catch (e) {
            console.error("Error parsing company data", e);
          }
        } else {
          // Default company email to user's registration email if blank
          setEmail(profile.email);
        }
        setLoading(false);
      })
      .catch(() => {
        // Fallback: get the cached email from localStorage
        const cachedEmail = localStorage.getItem("user_email") || "";
        setEmail(cachedEmail);
        
        const storedStr = localStorage.getItem(`digiscale_company_${cachedEmail}`);
        if (storedStr) {
          try {
            const data = JSON.parse(storedStr);
            setLogo(data.logo || null);
            setName(data.name || "");
            setEmail(data.email || cachedEmail || "");
            setPrimaryPhone(data.primaryPhone || "");
            setSecondaryPhone(data.secondaryPhone || "");
            setAddress(data.address || "");
            setWebsite(data.website || "");
            setGst(data.gst || "");
            setBankName(data.bankName || "");
            setAccountNumber(data.accountNumber || "");
            setIfsc(data.ifsc || "");
            setTermsAndConditions(data.termsAndConditions || "");
          } catch (e) {}
        }
        
        setStatusMsg({ 
          type: "error", 
          text: "Failed to connect to server. Showing local company context. You can edit and save details locally below." 
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
      const profile = await getUserProfile();
      const emailKey = profile.email;

      const payload = {
        logo,
        name,
        email,
        primaryPhone,
        secondaryPhone,
        address,
        website,
        gst,
        bankName,
        accountNumber,
        ifsc,
        termsAndConditions,
      };

      localStorage.setItem(`digiscale_company_${emailKey}`, JSON.stringify(payload));
      
      // Update global context for company branding if any
      localStorage.setItem(`digiscale_company_name_${emailKey}`, name);
      localStorage.setItem(`digiscale_company_logo_${emailKey}`, logo || "");

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

/* ============ Team Sharing Section ============ */
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Editor" | "Viewer";
  status: "Active" | "Pending";
}

function TeamSharingSection() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamMember["role"]>("Editor");
  const [inviteSuccess, setInviteSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("digiscale_team_members");
      if (stored) {
        setMembers(JSON.parse(stored));
      } else {
        const defaultMembers: TeamMember[] = [
          {
            id: "1",
            name: localStorage.getItem("user_name") || "Owner",
            email: localStorage.getItem("user_email") || "owner@digiscale.com",
            role: "Owner",
            status: "Active",
          },
          {
            id: "2",
            name: "Paresh Patel",
            email: "paresh.patel@gmail.com",
            role: "Editor",
            status: "Active",
          },
          {
            id: "3",
            name: "Sneha Shah",
            email: "sneha.shah@digiscale.com",
            role: "Viewer",
            status: "Pending",
          }
        ];
        localStorage.setItem("digiscale_team_members", JSON.stringify(defaultMembers));
        setMembers(defaultMembers);
      }
    }
  }, []);

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteName.trim(),
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
      status: "Pending",
    };

    const updated = [...members, newMember];
    setMembers(updated);
    localStorage.setItem("digiscale_team_members", JSON.stringify(updated));

    setInviteName("");
    setInviteEmail("");
    setInviteRole("Editor");
    setInviteSuccess(true);
    setTimeout(() => setInviteSuccess(false), 3000);
  };

  const handleRemoveMember = (id: string) => {
    const updated = members.filter(m => m.id !== id);
    setMembers(updated);
    localStorage.setItem("digiscale_team_members", JSON.stringify(updated));
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Team Collaboration
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Manage your workspace members, assign role permissions, and collaborate in real-time.
          </p>
        </div>
        <span className="rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-bold text-blue-700 shadow-sm">
          {members.length} Members
        </span>
      </div>

      <hr className="border-slate-100" />

      <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
        
        {/* Left Column: Invite Member Form Card */}
        <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-5 space-y-4 h-fit">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800">Invite Member</h4>
            <p className="text-[10px] text-slate-500">Send an invitation to join this workspace.</p>
          </div>

          {inviteSuccess && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-[10px] font-semibold text-green-700 leading-normal animate-in fade-in duration-150">
              ✓ Invitation sent successfully!
            </div>
          )}

          <form onSubmit={handleSendInvite} className="space-y-3.5">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-xs font-semibold outline-none transition focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="ramesh@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 py-2.5 text-xs font-semibold outline-none transition focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Role Permission</label>
              <div className="relative">
                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-8 py-2.5 text-xs font-semibold outline-none transition focus:border-blue-500 cursor-pointer appearance-none"
                >
                  <option value="Admin">Admin (Full Access)</option>
                  <option value="Editor">Editor (Can edit & save)</option>
                  <option value="Viewer">Viewer (Can view only)</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-650 hover:bg-blue-700 py-3 text-xs font-bold text-white transition active:scale-[0.97] shadow-sm shadow-blue-500/10"
            >
              Send Invitation
            </button>
          </form>
        </div>

        {/* Right Column: Active Team Members List */}
        <div className="space-y-3.5">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800">Active Members</h4>
            <p className="text-[10px] text-slate-455">Currently active and pending members in this workspace.</p>
          </div>

          <div className="space-y-2.5">
            {members.map(member => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 rounded-2xl border border-slate-150/70 bg-white hover:shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-200"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm shadow-blue-500/10">
                    {getInitials(member.name)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-extrabold text-slate-900 text-sm truncate leading-none">{member.name}</p>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-slate-50 border-slate-200 text-slate-500 leading-none">
                        {member.role}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-450 mt-1 font-semibold truncate">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* Status badge with green/amber pulse dot */}
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      {member.status === "Active" ? (
                        <>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </>
                      ) : (
                        <>
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </>
                      )}
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-wider ${
                      member.status === "Active" ? "text-green-700" : "text-amber-700"
                    }`}>
                      {member.status}
                    </span>
                  </div>

                  {member.role !== "Owner" ? (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-2 rounded-xl border border-red-150/40 text-red-500 hover:bg-red-50 hover:border-red-200 transition"
                      title="Remove member access"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-bold italic pr-2 select-none">Owner</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
