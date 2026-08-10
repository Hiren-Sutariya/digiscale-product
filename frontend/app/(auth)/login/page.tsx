"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Mail, Lock } from "lucide-react";
import { login, getUserProfile } from "@/services/api";

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    welcomeBack: "Welcome back",
    signInPrompt: "Sign in to your account to continue.",
    emailAddress: "Email Address",
    password: "Password",
    forgotPassword: "Forgot Password?",
    signIn: "Sign In",
    dontHaveAccount: "Don't have an account?",
    createAccount: "Create an account",
    invalidCredentials: "Invalid email or password.",
    passwordPlaceholder: "Enter your password",
  },
  gu: {
    welcomeBack: "સ્વાગત છે",
    signInPrompt: "ચાલુ રાખવા માટે તમારા ખાતામાં સાઇન ઇન કરો.",
    emailAddress: "ઈમેલ સરનામું",
    password: "પાસવર્ડ",
    forgotPassword: "પાસવર્ડ ભૂલી ગયા છો?",
    signIn: "સાઇન ઇન કરો",
    dontHaveAccount: "ખાતું નથી?",
    createAccount: "નવું ખાતું બનાવો",
    invalidCredentials: "અમાન્ય ઇમેઇલ અથવા પાસવર્ડ.",
    passwordPlaceholder: "તમારો પાસવર્ડ દાખલ કરો",
  },
  hi: {
    welcomeBack: "स्वागत हे",
    signInPrompt: "जारी रखने के लिए अपने खाते में साइन इन करें।",
    emailAddress: "ईमेल पता",
    password: "पासवर्ड",
    forgotPassword: "पासवर्ड भूल गए?",
    signIn: "साइन इन करें",
    dontHaveAccount: "खाता नहीं है?",
    createAccount: "खाता बनाएं",
    invalidCredentials: "अमान्य ईमेल या पासवर्ड।",
    passwordPlaceholder: "अपना पासवर्ड दर्ज करें",
  },
  es: {
    welcomeBack: "Bienvenido de nuevo",
    signInPrompt: "Inicie sesión en su cuenta para continuar.",
    emailAddress: "Dirección de correo electrónico",
    password: "Contraseña",
    forgotPassword: "¿Olvidó su contraseña?",
    signIn: "Iniciar sesión",
    dontHaveAccount: "¿No tiene una cuenta?",
    createAccount: "Crear una cuenta",
    invalidCredentials: "Correo electrónico o contraseña inválidos.",
    passwordPlaceholder: "Ingrese su contraseña",
  }
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lang, setLang] = useState("en");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLang(localStorage.getItem("digiscale_language") || "en");
    }
  }, []);

  const t = (key: string) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS["en"]?.[key] || key;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email, password);
      // Pre-fetch profile and cache permissions so dashboard renders instantly with no blink
      try {
        const profile = await getUserProfile();
        if (profile && typeof window !== "undefined") {
          const uId = (profile.role === "Staff" && profile.admin_id) ? profile.admin_id.toString() : profile.id.toString();
          localStorage.setItem("digiscale_cached_user_id", uId);
          localStorage.setItem("user_role", profile.role || "Admin");
          localStorage.setItem("user_name", profile.name || "");
          localStorage.setItem("user_email", profile.email || "");
          localStorage.setItem("user_plan", profile.plan || "Starter");
          localStorage.setItem("perm_collections", profile.perm_collections || "edit");
          localStorage.setItem("perm_warehouse", profile.perm_warehouse || "edit");
          localStorage.setItem("perm_stockbook", profile.perm_stockbook || "edit");
          localStorage.setItem("perm_clients", profile.perm_clients || "edit");
          localStorage.setItem("perm_quotations", profile.perm_quotations || "edit");
        }
      } catch (_) {}
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || t("invalidCredentials"));
      setLoading(false);
    }
  };

  return (
    <>
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {t("welcomeBack")}
        </h2>

        <p className="mt-3 text-slate-600">
          {t("signInPrompt")}
        </p>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">

        {/* Email */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            {t("emailAddress")}
          </label>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700">
              {t("password")}
            </label>

            <Link
              href="/forgot-password"
              className="text-sm font-bold text-blue-600 transition hover:text-blue-700"
            >
              {t("forgotPassword")}
            </Link>
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("passwordPlaceholder")}
              required
              className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-12 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-bold text-white transition hover:bg-blue-700 disabled:opacity-50 cursor-pointer shadow-sm active:scale-95"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              {t("signIn")}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

      </form>

      <p className="mt-8 text-center text-sm text-slate-600 font-medium">
        {t("dontHaveAccount")}{" "}
        <Link
          href="/signup"
          className="font-bold text-blue-600 transition hover:text-blue-700"
        >
          {t("createAccount")}
        </Link>
      </p>
    </>
  );
}
