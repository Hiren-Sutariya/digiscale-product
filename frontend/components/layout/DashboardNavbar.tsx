"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import Logo from "@/components/ui/logo";
import { getUserProfile } from "@/services/api";

import {
  Bell,
  Settings,
  ChevronDown,
  LayoutDashboard,
  Paintbrush,
  FolderOpen,
  User,
  CreditCard,
  LogOut,
  Zap,
} from "lucide-react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/workspace", label: "Workspace", icon: Paintbrush },
  { href: "/projects", label: "Collections", icon: FolderOpen },
];

export default function DashboardNavbar() {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; plan: string; created_at?: string } | null>(null);
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
        getUserProfile()
          .then((data) => {
            setUser(data);
            const storedAvatar = localStorage.getItem(`digiscale_avatar_${data.email}`);
            if (storedAvatar) setAvatarUrl(storedAvatar);

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
      <div className="mx-auto max-w-[1400px] w-full h-full flex items-center justify-between px-8">

        {/* Left — Logo only (no badge) */}
        <div className="flex items-center w-44 flex-shrink-0">
          <Logo />
        </div>

        {/* Center — Navigation Links */}
        <nav className="flex-1 flex items-center justify-center gap-1">
          {navLinks
            .filter((link) => isLoggedIn || link.href === "/workspace")
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
                  {link.label}
                </Link>
              );
            })}
        </nav>

        {/* Right — Bell + Profile */}
        <div className="flex items-center gap-2.5 w-64 flex-shrink-0 justify-end">
          {isLoggedIn ? (
            <>
              {/* Bell — full navbar height pill */}
              <button className="flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 bg-white transition hover:bg-slate-50 hover:border-slate-300 cursor-pointer shadow-sm">
                <Bell className="h-[18px] w-[18px] text-slate-500" />
              </button>

              {/* Profile button — tall pill */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-3 h-10 rounded-xl border border-slate-200 bg-white pl-2 pr-3 transition hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] cursor-pointer shadow-sm"
                >
                  {/* Avatar */}
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-[11px] font-black text-white overflow-hidden shrink-0">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      getInitials(user?.name || "User")
                    )}
                  </div>

                  <div className="hidden text-left md:block">
                    <p className="text-[12px] font-bold text-slate-800 leading-none whitespace-nowrap">
                      {user?.name || "User"}
                    </p>
                    <p className="text-[10px] mt-0.5 leading-none">
                      {user?.plan === "Starter" ? (
                        <span className="text-amber-500 font-semibold">
                          Trial{daysLeft !== null ? ` · ${daysLeft}d left` : ""}
                        </span>
                      ) : (
                        <span className="text-blue-600 font-semibold">{user?.plan || "Free"}</span>
                      )}
                    </p>
                  </div>

                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* ── Dropdown Menu ── */}
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-3 w-64 rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.12)] z-50 overflow-hidden">

                    {/* User header block */}
                    <div className="px-4 pt-4 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-black text-white overflow-hidden shrink-0">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                          ) : (
                            getInitials(user?.name || "User")
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-tight">{user?.name || "User"}</p>
                          <p className="text-xs text-slate-400 leading-tight mt-0.5">{user?.email || ""}</p>
                        </div>
                      </div>

                      {/* Plan badge */}
                      <div className="mt-3">
                        {user?.plan === "Starter" ? (
                          <div className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                              <span className="text-xs font-bold text-amber-700">
                                Trial{daysLeft !== null ? ` · ${daysLeft} days left` : ""}
                              </span>
                            </div>
                            <Link
                              href="/settings"
                              onClick={() => setProfileOpen(false)}
                              className="text-[10px] font-bold text-amber-600 hover:text-amber-700 transition"
                            >
                              Upgrade →
                            </Link>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
                            <Zap className="h-3.5 w-3.5 text-blue-500 fill-blue-500" />
                            <span className="text-xs font-bold text-blue-700">{user?.plan || "Free"} Plan</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <Link
                        href="/settings"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition group"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-slate-200 transition">
                          <User className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                        My Profile
                      </Link>

                      <Link
                        href="/settings"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition group"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-slate-200 transition">
                          <CreditCard className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                        Plan &amp; Billing
                      </Link>

                      <Link
                        href="/settings"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition group"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-slate-200 transition">
                          <Settings className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                        Settings
                      </Link>
                    </div>

                    {/* Sign Out */}
                    <div className="px-2 pb-2 border-t border-slate-100 mt-0 pt-2">
                      <button
                        onClick={() => {
                          localStorage.removeItem("token");
                          setIsLoggedIn(false);
                          setProfileOpen(false);
                          window.location.href = "/";
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition cursor-pointer group"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 group-hover:bg-red-100 transition">
                          <LogOut className="h-3.5 w-3.5 text-red-500" />
                        </div>
                        Sign Out
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
              Sign In
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}