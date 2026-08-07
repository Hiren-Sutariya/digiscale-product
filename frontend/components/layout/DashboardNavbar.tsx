"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import Logo from "@/components/ui/logo";
import { getUserProfile, getUserSettings, logout } from "@/services/api";

import {
  Bell,
  Settings,
  ChevronDown,
  LayoutDashboard,
  Paintbrush,
  FolderOpen,
  User,
  Users,
  CreditCard,
  LogOut,
  Zap,
  Warehouse,
  FileText,
  HardDrive,
  ClipboardList,
  Camera,
} from "lucide-react";

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    workspace: "Workspace",
    collections: "Collections",
    warehouse: "Warehouse",
    "stock book": "Stock Book",
    clients: "Clients",
    quotation: "Quotation",
    myProfile: "My Profile",
    dataBackup: "Data & Backup",
    settings: "Settings",
    signOut: "Sign Out",
    signIn: "Sign In",
    trialDaysRemaining: "trial days remaining",
    freePlan: "Free Plan",
    starterPlan: "Starter Plan",
    proPlan: "Pro Plan",
    currentPlanSuffix: "Plan",
  },
  gu: {
    workspace: "વર્કસ્પેસ",
    collections: "કલેક્શન",
    warehouse: "વેરહાઉસ",
    "stock book": "સ્ટોક બુક",
    clients: "ગ્રાહકો",
    quotation: "કોટેશન",
    myProfile: "મારી પ્રોફાઇલ",
    dataBackup: "ડેટા અને બેકઅપ",
    settings: "સેટિંગ્સ",
    signOut: "સાઇન આઉટ",
    signIn: "સાઇન ઇન",
    trialDaysRemaining: "દિવસો ટ્રાયલ બાકી છે",
    freePlan: "મફત પ્લાન",
    starterPlan: "સ્ટાર્ટર પ્લાન",
    proPlan: "પ્રો પ્લાન",
    currentPlanSuffix: "પ્લાન",
  },
  hi: {
    workspace: "कार्यक्षेत्र",
    collections: "कलेक्शन",
    warehouse: "गोदाम",
    "stock book": "स्टॉक बुक",
    clients: "ग्राहक",
    quotation: "कोटेशन",
    myProfile: "मेरी प्रोफाइल",
    dataBackup: "डेटा और बैकअप",
    settings: "सेट्स",
    signOut: "साइन आउट",
    signIn: "साइन इन",
    trialDaysRemaining: "दिनों का परीक्षण शेष",
    freePlan: "मुफ्त प्लान",
    starterPlan: "स्टार्टर प्लान",
    proPlan: "प्रो प्लान",
    currentPlanSuffix: "प्लान",
  },
  es: {
    workspace: "Espacio",
    collections: "Colecciones",
    warehouse: "Almacén",
    "stock book": "Libro de Stock",
    clients: "Clientes",
    quotation: "Cotización",
    myProfile: "Mi Perfil",
    dataBackup: "Datos y Respaldo",
    settings: "Ajustes",
    signOut: "Cerrar Sesión",
    signIn: "Iniciar Sesión",
    trialDaysRemaining: "días de prueba restantes",
    freePlan: "Plan Gratuito",
    starterPlan: "Plan Starter",
    proPlan: "Plan Pro",
    currentPlanSuffix: "Plan",
  }
};

const navLinks = [
  { href: "/projects", label: "Collections", icon: FolderOpen },
  { href: "/warehouse", label: "Warehouse", icon: Warehouse },
  { href: "/stock-book", label: "stock book", icon: ClipboardList },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/quotation", label: "Quotation", icon: FileText },
];

export default function DashboardNavbar() {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lang, setLang] = useState<string>("en");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLang(localStorage.getItem("digiscale_language") || "en");
    }
  }, []);



  const t = (key: string) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS["en"]?.[key] || key;

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("token");
    }
    return true; // Assume logged in on server to prevent navbar link mismatch
  });
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [user, setUser] = useState<{ name: string; email: string; plan: string; created_at?: string } | null>(() => {
    if (typeof window !== "undefined") {
      const name = localStorage.getItem("user_name");
      const email = localStorage.getItem("user_email");
      const plan = localStorage.getItem("user_plan");
      const created_at = localStorage.getItem("user_created_at");
      if (name) {
        return { name, email: email || "", plan: plan || "Starter", created_at: created_at || undefined };
      }
    }
    return null;
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getInitials = (name: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);

      if (token) {
        Promise.all([getUserProfile(), getUserSettings()])
          .then(([data, settingsData]) => {
            setUser(data);
            if (typeof window !== "undefined") {
              localStorage.setItem("user_name", data.name || "");
              localStorage.setItem("user_email", data.email || "");
              localStorage.setItem("user_plan", data.plan || "Starter");
              if (data.created_at) localStorage.setItem("user_created_at", data.created_at);
            }
            if (settingsData?.avatar_url) setAvatarUrl(settingsData.avatar_url);

            if (data.plan === "Starter" && data.created_at) {
              const created = new Date(data.created_at);
              const expiry = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
              const diffMs = expiry.getTime() - Date.now();
              const days = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
              setDaysLeft(days);
            }
          })
          .catch(() => {
            const name = localStorage.getItem("user_name") || "User";
            const email = localStorage.getItem("user_email") || "";
            setUser({ name, email, plan: "Starter" });
          });
      }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 shrink-0 ${
        scrolled
          ? "h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)]"
          : "h-20 bg-white/95 border-b border-slate-200"
      }`}
    >
      <div className="mx-auto max-w-[1400px] w-full h-full flex items-center justify-between px-4 lg:px-8">

        {/* Left — Clickable Logo */}
        <div className="flex items-center w-auto lg:w-44 flex-shrink-0">
          <Logo />
        </div>

        {/* Center — Navigation Links (Desktop Only) */}
        <nav className="hidden lg:flex flex-1 items-center justify-center gap-1">
          {navLinks
            .filter((link) => isLoggedIn)
            .map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "text-blue-600"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t(link.label.toLowerCase())}
                </Link>
              );
            })}
        </nav>

        {/* Right — Bell + Profile (Responsive widths) */}
        <div className="flex items-center gap-2.5 w-auto lg:w-64 flex-shrink-0 justify-end">
          {isLoggedIn ? (
            <>


              {/* Camera Scanner button next to Profile on all pages */}
              <button 
                onClick={() => {
                  if (pathname !== "/quotation") {
                    window.location.href = "/quotation?openScanner=true";
                  } else {
                    window.dispatchEvent(new CustomEvent("open-mobile-camera-scanner"));
                  }
                }}
                className="flex items-center justify-center h-10 w-10 rounded-xl border border-indigo-200 bg-indigo-50/70 text-indigo-600 transition active:scale-95 cursor-pointer shadow-sm shrink-0"
                title="Open Camera Scanner"
              >
                <Camera className="h-[18px] w-[18px]" />
              </button>

              {/* Profile button — tall pill */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-3 h-10 rounded-xl border border-slate-200 bg-white pl-2 pr-3 transition hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] cursor-pointer shadow-sm"
                >
                  {/* Avatar */}
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-[11px] font-black text-white overflow-hidden shrink-0">
                    {mounted ? (
                      avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        getInitials(user?.name || "User")
                      )
                    ) : (
                      <div className="h-full w-full bg-blue-400/50 animate-pulse"></div>
                    )}
                  </div>

                  {mounted ? (
                    <div className="hidden text-left md:block">
                      <p className="text-[12px] font-bold text-slate-800 leading-none whitespace-nowrap">
                        {user?.name || "User"}
                      </p>
                      <p className="text-[10px] mt-0.5 leading-none">
                        <span className="text-blue-600 font-semibold">
                          {user?.plan === "Starter" ? t("starterPlan") : user?.plan === "Pro" ? t("proPlan") : t("freePlan")}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <div className="hidden text-left md:block space-y-1.5 w-20">
                      <div className="h-3 w-16 bg-slate-200 rounded animate-pulse"></div>
                      <div className="h-2 w-10 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                  )}

                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* ── Dropdown Menu ── */}
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-slate-200/80 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-50 overflow-hidden origin-top-right animate-in fade-in slide-in-from-top-2 duration-150">

                    {/* User header block */}
                    <div className="px-4 pt-4 pb-3 bg-slate-50/50 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white overflow-hidden shrink-0 shadow-inner">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                          ) : (
                            getInitials(user?.name || "User")
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-slate-900 leading-tight truncate">{user?.name || "User"}</p>
                          <p className="text-[10px] text-slate-400 font-semibold leading-tight mt-0.5 truncate">{user?.email || ""}</p>
                        </div>
                      </div>

                      {/* Plan badge */}
                      <div className="mt-3">
                        <div className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/70 px-3 py-2">
                          <Zap className="h-3.5 w-3.5 text-blue-600 fill-blue-500/10 animate-pulse" />
                          <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider">
                            {user?.plan === "Starter" ? t("starterPlan") : user?.plan === "Pro" ? t("proPlan") : t("freePlan")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2 space-y-0.5">
                      <Link
                        href="/settings?tab=profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition duration-150 group"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 text-slate-500 transition duration-150 shrink-0">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <span>{t("myProfile")}</span>
                      </Link>

                      <Link
                        href="/settings?tab=backup"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition duration-150 group"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 text-slate-500 transition duration-150 shrink-0">
                          <HardDrive className="h-3.5 w-3.5" />
                        </div>
                        <span>{t("dataBackup")}</span>
                      </Link>

                      <Link
                        href="/settings?tab=company"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition duration-150 group"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 text-slate-500 transition duration-150 shrink-0">
                          <Settings className="h-3.5 w-3.5" />
                        </div>
                        <span>{t("settings")}</span>
                      </Link>
                    </div>

                    {/* Sign Out */}
                    <div className="px-2 pb-2 border-t border-slate-100 mt-1 pt-2">
                      <button
                        onClick={() => {
                          logout();
                          setIsLoggedIn(false);
                          setProfileOpen(false);
                          window.location.href = "/login";
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition cursor-pointer group"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 group-hover:bg-red-100 transition shrink-0">
                          <LogOut className="h-3.5 w-3.5 text-red-500" />
                        </div>
                        <span>{t("signOut")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="h-10 flex items-center rounded-xl bg-blue-600 hover:bg-blue-700 px-5 text-sm font-semibold text-white transition shadow-sm active:scale-95 cursor-pointer"
            >
              {t("signIn")}
            </Link>
          )}
        </div>

      </div>



      {/* Mobile Bottom Navigation Bar */}
      {isLoggedIn && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-2px_15px_rgba(0,0,0,0.06)] px-4 py-2 flex justify-around items-center select-none pb-[env(safe-area-inset-bottom,12px)]">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex flex-col items-center gap-0.5 px-1.5 sm:px-3 py-1 rounded-xl transition-all duration-200 active:scale-90 cursor-pointer ${
                  isActive ? "text-blue-600 scale-105" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
                <span className="text-[9px] font-bold tracking-tight uppercase">{t(link.label.toLowerCase())}</span>
                {isActive && (
                  <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-blue-600 animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>
      )}

    </header>
  );
}