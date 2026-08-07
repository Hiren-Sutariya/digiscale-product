"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail, CheckCircle } from "lucide-react";

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    forgotPasswordTitle: "Forgot your password?",
    forgotPasswordSubtitle: "Enter your email address and we'll send you a link to reset your password.",
    checkEmail: "Check your email",
    checkEmailSubtitle: "We've sent a password reset link to",
    checkEmailInstructions: "Check your inbox and follow the instructions.",
    backToLogin: "Back to Login",
    didNotReceiveEmail: "Didn't receive the email? Try again",
    sendResetLink: "Send Reset Link",
    rememberPassword: "Remember your password?",
    emailAddress: "Email Address",
  },
  gu: {
    forgotPasswordTitle: "પાસવર્ડ ભૂલી ગયા છો?",
    forgotPasswordSubtitle: "તમારું ઇમેઇલ સરનામું દાખલ કરો અને અમે તમને તમારો પાસવર્ડ રીસેટ કરવા માટે એક લિંક મોકલીશું.",
    checkEmail: "તમારો ઇમેઇલ તપાસો",
    checkEmailSubtitle: "અમે પાસવર્ડ રીસેટ લિંક મોકલી છે",
    checkEmailInstructions: "તમારું ઇનબૉક્સ તપાસો અને સૂચનાઓનું પાલન કરો.",
    backToLogin: "લૉગિન પર પાછા જાઓ",
    didNotReceiveEmail: "ઇમેઇલ મળ્યો નથી? ફરીથી પ્રયાસ કરો",
    sendResetLink: "રીસેટ લિંક મોકલો",
    rememberPassword: "પાસવર્ડ યાદ છે?",
    emailAddress: "ઈમેલ સરનામું",
  },
  hi: {
    forgotPasswordTitle: "पासवर्ड भूल गए?",
    forgotPasswordSubtitle: "अपना ईमेल पता दर्ज करें और हम आपको अपना पासवर्ड रीसेट करने के लिए एक लिंक भेजेंगे।",
    checkEmail: "अपना ईमेल जांचें",
    checkEmailSubtitle: "हमने एक पासवर्ड रीसेट लिंक भेजा है",
    checkEmailInstructions: "अपना इनबॉक्स जांचें और निर्देशों का पालन करें।",
    backToLogin: "लॉगिन पर वापस जाएं",
    didNotReceiveEmail: "ईमेल नहीं मिला? दोबारा प्रयास करें",
    sendResetLink: "रीसेट लिंक भेजें",
    rememberPassword: "पासवर्ड याद है?",
    emailAddress: "ईमेल पता",
  },
  es: {
    forgotPasswordTitle: "¿Olvidó su contraseña?",
    forgotPasswordSubtitle: "Ingrese su dirección de correo electrónico y le enviaremos un enlace para restablecer su contraseña.",
    checkEmail: "Revisa tu correo electrónico",
    checkEmailSubtitle: "Hemos enviado un enlace de restablecimiento de contraseña a",
    checkEmailInstructions: "Revise su bandeja de entrada y siga las instrucciones.",
    backToLogin: "Volver al inicio de sesión",
    didNotReceiveEmail: "¿No recibió el correo electrónico? Inténtelo de nuevo",
    sendResetLink: "Enviar enlace",
    rememberPassword: "¿Recuerda su contraseña?",
    emailAddress: "Dirección de correo electrónico",
  }
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
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

    // TODO: Connect to backend forgot-password API
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1000);
  };

  if (sent) {
    return (
      <>
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>

          <h2 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {t("checkEmail")}
          </h2>

          <p className="mt-3 max-w-sm text-slate-600 font-medium">
            {t("checkEmailSubtitle")}{" "}
            <span className="font-bold text-slate-900">{email}</span>.{" "}
            {t("checkEmailInstructions")}
          </p>

          <Link
            href="/login"
            className="mt-8 flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 font-bold text-white transition hover:bg-blue-700 cursor-pointer shadow-sm active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToLogin")}
          </Link>

          <button
            onClick={() => setSent(false)}
            className="mt-4 text-sm font-bold text-blue-600 transition hover:text-blue-700 cursor-pointer"
          >
            {t("didNotReceiveEmail")}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {t("forgotPasswordTitle")}
        </h2>

        <p className="mt-3 text-slate-600">
          {t("forgotPasswordSubtitle")}
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
              {t("sendResetLink")}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

      </form>

      <p className="mt-8 text-center text-sm text-slate-600 font-medium">
        {t("rememberPassword")}{" "}
        <Link
          href="/login"
          className="font-bold text-blue-600 transition hover:text-blue-700"
        >
          {t("backToLogin")}
        </Link>
      </p>
    </>
  );
}
