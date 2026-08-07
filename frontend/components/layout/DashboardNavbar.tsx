"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import Logo from "@/components/ui/logo";
import { getUserProfile, getUserSettings, logout } from "@/services/api";
import { supabase } from "@/lib/supabase";

import {
  Bell,
  ScanBarcode,
  X,
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

  // Camera scanner states for global navbar
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<any | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const playBeepSound = (isError = false) => {
    if (typeof window === "undefined") return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = "sine";
      if (isError) {
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
      } else {
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.1);
      }
    } catch (e) {}
  };

  const handleBarcodeScan = async (codeVal: string) => {
    const cleanCode = codeVal.trim();
    if (!cleanCode) return;

    setLoadingProduct(true);
    setScanError(null);

    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("name", cleanCode)
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        playBeepSound(false);
        
        // Fetch warehouse location details
        const { data: assigns } = await supabase
          .from("warehouse_assignments")
          .select("location_key")
          .eq("product_id", data[0].id);

        let locationStr = "";
        if (assigns && assigns.length > 0) {
          locationStr = assigns
            .map((a: any) => {
              const parts = a.location_key.split("-");
              if (parts.length >= 3) {
                const row = parts[0];
                const slot = parts[1];
                const zone = parts[2];
                const zoneShort = zone.toLowerCase() === "upper" ? "U" : zone.toLowerCase() === "lower" ? "L" : zone;
                return `${row}-${slot} (${zoneShort})`;
              }
              return a.location_key;
            })
            .join(", ");
        }

        setScannedProduct({
          ...data[0],
          location: locationStr
        });
        setShowCameraScanner(false);
      } else {
        playBeepSound(true);
        setScanError(lang === "gu" ? `પ્રોડક્ટ મળી નથી: ${cleanCode}` : `Product not found: ${cleanCode}`);
        setTimeout(() => setScanError(null), 3000);
      }
    } catch (err: any) {
      console.error("Lookup error:", err);
      playBeepSound(true);
      setScanError("Failed to lookup product.");
      setTimeout(() => setScanError(null), 3000);
    } finally {
      setLoadingProduct(false);
    }
  };

  useEffect(() => {
    let scannerInstance: any = null;
    if (showCameraScanner && typeof window !== "undefined") {
      const startScanner = async () => {
        try {
          const { Html5Qrcode } = await import("html5-qrcode");
          await new Promise(resolve => setTimeout(resolve, 300));
          const scannerContainer = document.getElementById("navbar-scanner-reader");
          if (!scannerContainer) return;

          scannerInstance = new Html5Qrcode("navbar-scanner-reader");
          await scannerInstance.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 260, height: 160 }
            },
            (decodedText: string) => {
              handleBarcodeScan(decodedText);
            },
            () => {
              // Ignore standard scanning noise
            }
          );
        } catch (err) {
          console.error("Navbar camera scanner failed to start:", err);
        }
      };
      startScanner();
    }
    return () => {
      if (scannerInstance && scannerInstance.isScanning) {
        scannerInstance.stop()
          .then(() => console.log("Navbar scanner stopped."))
          .catch((err: any) => console.error("Error stopping navbar scanner:", err));
      }
    };
  }, [showCameraScanner]);

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
              {/* Camera Scanner Button */}
              <button 
                onClick={() => setShowCameraScanner(true)}
                title={lang === "gu" ? "મોબાઈલથી બારકોડ સ્કેન કરો" : "Scan Barcode"}
                className="flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 bg-indigo-50/50 text-indigo-600 transition hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 cursor-pointer shadow-sm relative group"
              >
                <ScanBarcode className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                </span>
              </button>

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
                        <div className="flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
                          <Zap className="h-3.5 w-3.5 text-blue-500 fill-blue-500" />
                          <span className="text-xs font-bold text-blue-700">
                            {user?.plan === "Starter" ? t("starterPlan") : user?.plan === "Pro" ? t("proPlan") : t("freePlan")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <Link
                        href="/settings?tab=profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition group"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-slate-200 transition">
                          <User className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                        {t("myProfile")}
                      </Link>

                      <Link
                        href="/settings?tab=backup"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition group"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-slate-200 transition">
                          <HardDrive className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                        {t("dataBackup")}
                      </Link>

                      <Link
                        href="/settings?tab=company"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition group"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-slate-200 transition">
                          <Settings className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                        {t("settings")}
                      </Link>
                    </div>

                    {/* Sign Out */}
                    <div className="px-2 pb-2 border-t border-slate-100 mt-0 pt-2">
                      <button
                        onClick={() => {
                          logout();
                          setIsLoggedIn(false);
                          setProfileOpen(false);
                          window.location.href = "/login";
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition cursor-pointer group"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 group-hover:bg-red-100 transition">
                          <LogOut className="h-3.5 w-3.5 text-red-500" />
                        </div>
                        {t("signOut")}
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

      {/* NAVBAR CAMERA SCANNER OVERLAY */}
      {showCameraScanner && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 text-slate-800">
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>📷</span>
                {lang === "gu" ? "કેમેરા બારકોડ સ્કેનર" : "Camera Barcode Scanner"}
              </h3>
              <button
                onClick={() => setShowCameraScanner(false)}
                className="p-1 text-slate-400 hover:text-slate-655 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 flex flex-col items-center justify-center space-y-4">
              <p className="text-[11px] text-slate-500 font-bold text-center">
                {lang === "gu" ? "તમારા મોબાઈલ કેમેરાને પ્રોડક્ટ બારકોડ સામે રાખો" : "Align the barcode inside the box to lookup product"}
              </p>
              
              <div 
                id="navbar-scanner-reader" 
                className="w-full bg-slate-50 rounded-xl overflow-hidden border border-slate-200"
                style={{ minHeight: "260px" }}
              />

              {scanError && (
                <div className="w-full p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl text-center animate-bounce">
                  ⚠️ {scanError}
                </div>
              )}
              
              <button
                onClick={() => setShowCameraScanner(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition w-full active:scale-95 cursor-pointer"
              >
                {lang === "gu" ? "બંધ કરો" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCANNED PRODUCT DETAILS MODAL */}
      {scannedProduct && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 text-slate-800">
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <span>📦</span>
                {lang === "gu" ? "ઉત્પાદન વિગતો" : "Product Details"}
              </h3>
              <button
                onClick={() => setScannedProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-655 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="h-40 w-full rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center p-2 relative">
                {scannedProduct.photoUrl ? (
                  <img 
                    src={scannedProduct.photoUrl} 
                    alt={scannedProduct.name}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="text-center space-y-1">
                    <span className="text-2xl block">📦</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No Photo Available</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-black text-slate-900 uppercase tracking-tight truncate border-b border-slate-100 pb-1">
                  {scannedProduct.name}
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Rate / Price</span>
                    <span className="text-sm font-black text-indigo-750">₹{scannedProduct.rate || "-"}</span>
                  </div>
                  
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Carton Qty</span>
                    <span className="text-sm font-black text-slate-800">{scannedProduct.cartonQty || 1} pcs/ctn</span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Stock</span>
                    <span className={`text-sm font-black ${scannedProduct.stock > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {scannedProduct.stock || 0}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Location</span>
                    <span className="text-xs font-black text-slate-800 truncate block">
                      {scannedProduct.location || "-"}
                    </span>
                  </div>
                </div>

                {scannedProduct.description && (
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Description / Note</span>
                    <p className="font-semibold text-slate-600 mt-0.5 leading-relaxed">{scannedProduct.description}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setScannedProduct(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition active:scale-95 cursor-pointer uppercase tracking-wider shadow-sm mt-2"
              >
                {lang === "gu" ? "સમજી ગયા" : "Done"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      {isLoggedIn && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-2px_15px_rgba(0,0,0,0.06)] px-4 py-2.5 flex justify-around items-center select-none pb-safe">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition duration-150 cursor-pointer ${
                  isActive ? "text-blue-600 font-black" : "text-slate-500 font-semibold hover:text-slate-900"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[9px] font-bold tracking-tight uppercase">{t(link.label.toLowerCase())}</span>
              </Link>
            );
          })}
        </nav>
      )}

    </header>
  );
}