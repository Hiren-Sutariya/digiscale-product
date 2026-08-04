"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Mail, Lock, User, Info } from "lucide-react";
import { signup } from "@/services/api";

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    createYourAccount: "Create your account",
    signupSubtitle: "Start processing product images with AI.",
    invitedTitle: "You've been invited!",
    invitedSubtitle: "Create your account below to accept the invitation and join the team.",
    fullName: "Full Name",
    fullNamePlaceholder: "Your full name",
    emailAddress: "Email Address",
    password: "Password",
    confirmPassword: "Confirm Password",
    confirmPasswordPlaceholder: "Confirm your password",
    signupTerms: "By signing up, you agree to our",
    termsOfService: "Terms of Service",
    andText: "and",
    privacyPolicy: "Privacy Policy",
    createAccountBtn: "Create Account",
    alreadyHaveAccount: "Already have an account?",
    signIn: "Sign in",
    passwordsDoNotMatch: "Passwords do not match.",
    passwordTooShort: "Password must be at least 8 characters.",
  },
  gu: {
    createYourAccount: "તમારું ખાતું બનાવો",
    signupSubtitle: "AI સાથે પ્રોડક્ટ ઇમેજ પ્રોસેસિંગ શરૂ કરો.",
    invitedTitle: "તમને આમંત્રિત કર્યા છે!",
    invitedSubtitle: "આમંત્રણ સ્વીકારવા અને ટીમમાં જોડાવા માટે નીચે તમારું ખાતું બનાવો.",
    fullName: "પૂરું નામ",
    fullNamePlaceholder: "તમારું પૂરું નામ",
    emailAddress: "ઈમેલ સરનામું",
    password: "પાસવર્ડ",
    confirmPassword: "પાસવર્ડની ખાતરી કરો",
    confirmPasswordPlaceholder: "પાસવર્ડની ખાતરી કરો",
    signupTerms: "સાઇન અપ કરીને, તમે સંમત થાઓ છો અમારા",
    termsOfService: "સેવાની શરતો",
    andText: "અને",
    privacyPolicy: "ગોપનીયતા નીતિ",
    createAccountBtn: "ખાતું બનાવો",
    alreadyHaveAccount: "પહેલેથી જ ખાતું છે?",
    signIn: "સાઇન ઇન કરો",
    passwordsDoNotMatch: "પાસવર્ડ મેળ ખાતા નથી.",
    passwordTooShort: "પાસવર્ડ ઓછામાં ઓછો 8 અક્ષરોનો હોવો જોઈએ.",
  },
  hi: {
    createYourAccount: "अपना खाता बनाएं",
    signupSubtitle: "एआई के साथ उत्पाद छवियों को संसाधित करना शुरू करें।",
    invitedTitle: "आपको आमंत्रित किया गया है!",
    invitedSubtitle: "आमंत्रण स्वीकार करने और टीम में शामिल होने के लिए नीचे अपना खाता बनाएं।",
    fullName: "पूरा नाम",
    fullNamePlaceholder: "आपका पूरा नाम",
    emailAddress: "ईमेल पता",
    password: "पासवर्ड",
    confirmPassword: "पासवर्ड की पुष्टि करें",
    confirmPasswordPlaceholder: "अपना पासवर्ड दोहराएं",
    signupTerms: "साइन अप करके, आप सहमत होते हैं हमारे",
    termsOfService: "सेवा की शर्तें",
    andText: "और",
    privacyPolicy: "गोपनीयता नीति",
    createAccountBtn: "खाता बनाएं",
    alreadyHaveAccount: "पहले से ही एक खाता है?",
    signIn: "साइन इन करें",
    passwordsDoNotMatch: "पासवर्ड मेल नहीं खाते।",
    passwordTooShort: "पासवर्ड कम से कम 8 वर्णों का होना चाहिए।",
  },
  es: {
    createYourAccount: "Crea tu cuenta",
    signupSubtitle: "Comience a procesar imágenes de productos con IA.",
    invitedTitle: "¡Has sido invitado!",
    invitedSubtitle: "Cree su cuenta a continuación para aceptar la invitación y unirse al equipo.",
    fullName: "Nombre completo",
    fullNamePlaceholder: "Su nombre completo",
    emailAddress: "Dirección de correo electrónico",
    password: "Contraseña",
    confirmPassword: "Confirmar contraseña",
    confirmPasswordPlaceholder: "Confirme su contraseña",
    signupTerms: "Al registrarse, acepta nuestros",
    termsOfService: "Términos de servicio",
    andText: "y",
    privacyPolicy: "Política de privacidad",
    createAccountBtn: "Crear cuenta",
    alreadyHaveAccount: "¿Ya tiene una cuenta?",
    signIn: "Iniciar sesión",
    passwordsDoNotMatch: "Las contraseñas no coinciden.",
    passwordTooShort: "La contraseña debe tener al menos 8 caracteres.",
  }
};

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteEmail = searchParams.get("email");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  useEffect(() => {
    if (inviteEmail) {
      setEmail(inviteEmail);
    }
  }, [inviteEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError(t("passwordsDoNotMatch"));
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError(t("passwordTooShort"));
      setLoading(false);
      return;
    }

    try {
      await signup(name, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">
          {t("createYourAccount")}
        </h2>

        <p className="mt-3 text-slate-600">
          {t("signupSubtitle")}
        </p>
      </div>
      
      {inviteEmail && (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-blue-900">{t("invitedTitle")}</h4>
            <p className="text-xs text-blue-700 mt-0.5">{t("invitedSubtitle")}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">

        {/* Name */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            {t("fullName")}
          </label>

          <div className="relative">
            <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("fullNamePlaceholder")}
              required
              className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium"
            />
          </div>
        </div>

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
              readOnly={!!inviteEmail}
              className={`w-full rounded-xl border border-slate-300 py-3.5 pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium ${inviteEmail ? 'bg-slate-100 cursor-not-allowed text-slate-500' : 'bg-white'}`}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            {t("password")}
          </label>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
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

        {/* Confirm Password */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            {t("confirmPassword")}
          </label>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("confirmPasswordPlaceholder")}
              required
              className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium"
            />
          </div>
        </div>

        {/* Terms */}
        <p className="text-xs text-slate-500 font-semibold">
          {t("signupTerms")}{" "}
          <Link href="#" className="text-blue-600 hover:underline">{t("termsOfService")}</Link>
          {" "}{t("andText")}{" "}
          <Link href="#" className="text-blue-600 hover:underline">{t("privacyPolicy")}</Link>.
        </p>

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
              {t("createAccountBtn")}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

      </form>

      <p className="mt-8 text-center text-sm text-slate-600 font-medium">
        {t("alreadyHaveAccount")}{" "}
        <Link
          href="/login"
          className="font-bold text-blue-600 transition hover:text-blue-700"
        >
          {t("signIn")}
        </Link>
      </p>
    </>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="animate-pulse flex space-x-4"><div className="h-4 bg-slate-200 rounded w-3/4"></div></div>}>
      <SignupForm />
    </Suspense>
  );
}
