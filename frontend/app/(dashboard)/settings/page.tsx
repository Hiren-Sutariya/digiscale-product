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
  Loader2,
  FolderOpen,
  Warehouse,
  TrendingUp,
  UserCheck,
  X,
  Pencil
} from "lucide-react";

import PageTitle from "@/components/ui/pageTitle";
import { getUserProfile, updateUserProfile, deleteAccount, getUserSettings, updateUserSettings, changePassword, logout, listUsers, createUser, updateUser, deleteUser } from "@/services/api";
import { getCache } from "@/lib/cache";
import { useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    // Tabs & Title
    settings: "Settings",
    profile: "Profile",
    company: "Company Details",
    theme: "Theme",
    language: "Language",
    shortcuts: "Keyboard Shortcuts",
    storage: "Storage",
    users: "User Management",
    security: "Security",
    backup: "Data & Backup",
    signOut: "Sign Out",
    // Profile
    profileHeading: "Profile",
    profileDesc: "Update your personal information.",
    changeAvatar: "Change Avatar",
    fullName: "Full Name",
    emailAddress: "Email",
    editEmail: "Edit Email",
    cancel: "Cancel",
    mobileNumber: "Mobile Number",
    gender: "Gender",
    male: "Male",
    female: "Female",
    other: "Other",
    preferNotToSay: "Prefer not to say",
    autoRemoveBg: "Auto Remove Background",
    autoRemoveBgDesc: "Automatically remove image backgrounds when uploading in Collections.",
    saveChanges: "Save Changes",
    saving: "Saving...",
    saveSuccess: "Changes saved successfully!",
    // Company details
    companyHeading: "Company Profile",
    companyDesc: "Create and manage your professional business details for outputs, invoices, and cards.",
    uploadLogo: "Upload Company Logo",
    uploadQR: "Upload Custom QR",
    generalInfo: "General Information",
    companyName: "Company Name",
    companyEmail: "Company Email",
    primaryPhone: "Primary Mobile Number",
    secondaryPhone: "Secondary Mobile Number",
    gstin: "GST Number (GSTIN)",
    website: "Website URL",
    address: "Company Address",
    bankDetails: "Bank & Payout Details",
    bankName: "Bank Name",
    accountNumber: "Account Number",
    ifscCode: "IFSC Code",
    upiId: "UPI ID (For QR Code)",
    termsHeading: "Terms & Conditions",
    termsDesc: "Invoice/Quotation Terms (Printed at bottom of quotation)",
    saveCompany: "Save Company Profile",
    // Theme
    themeHeading: "Theme",
    themeDesc: "Customize the appearance and accent color of the workspace.",
    themeMode: "Theme Mode",
    lightMode: "Light Mode",
    darkMode: "Dark Mode",
    systemSync: "System Sync",
    accentColor: "Accent Color",
    saveTheme: "Save Theme Settings",
    themeSuccess: "Theme settings saved & applied successfully!",
    // Language
    langHeading: "Language",
    langDesc: "Choose your default system display language.",
    saveLanguage: "Save Language Settings",
    langSuccess: "Language setting saved! Reloading application...",
    // Keyboard
    kbdHeading: "Keyboard Shortcuts",
    kbdDesc: "Boost your design efficiency with editor keyboard hotkeys.",
    testPad: "Interactive Hotkey Test Pad",
    testPadDesc: "Press any combination of keys on your keyboard to test:",
    testPadPress: "Press keys to detect...",
    shortcutHeader: "Shortcut Hotkeys",
    actionHeader: "Action",
    descHeader: "Description",
    // Storage
    storageHeading: "Storage",
    storageDesc: "Manage local caching, snapshots, and file storage sizes.",
    exportLogs: "Export Log Items",
    cachedBrowser: "Cached locally in browser.",
    snapshotsTitle: "IndexedDB Snapshots",
    snapshotsDesc: "Live database snapshots.",
    localSize: "LocalStorage Size",
    localSizeDesc: "Total metadata quota used.",
    clearFiles: "Clear Temporary Files",
    clearFilesDesc: "Free up browser local storage space by clearing export log queues and histories.",
    clearCacheBtn: "Clear Export Logs Cache",
  },
  gu: {
    // Tabs & Title
    settings: "સેટિંગ્સ",
    profile: "પ્રોફાઇલ",
    company: "કંપનીની વિગતો",
    theme: "થીમ",
    language: "ભાષા",
    shortcuts: "કીબોર્ડ શૉર્ટકટ્સ",
    storage: "સ્ટોરેજ",
    users: "વપરાશકર્તા સંચાલન",
    security: "સુરક્ષા",
    backup: "ડેટા અને બેકઅપ",
    signOut: "સાઇન આઉટ",
    // Profile
    profileHeading: "પ્રોફાઇલ",
    profileDesc: "તમારી વ્યક્તિગત માહિતી અપડેટ કરો.",
    changeAvatar: "અવતાર બદલો",
    fullName: "પૂરું નામ",
    emailAddress: "ઈમેલ",
    editEmail: "ઈમેલ સંપાદિત કરો",
    cancel: "રદ કરો",
    mobileNumber: "મોબાઇલ નંબર",
    gender: "લિંગ (જેન્ડર)",
    male: "પુરુષ",
    female: "સ્ત્રી",
    other: "અન્ય",
    preferNotToSay: "કહેવા માંગતા નથી",
    autoRemoveBg: "ઓટો બેકગ્રાઉન્ડ રીમુવર",
    autoRemoveBgDesc: "કલેક્શનમાં અપલોડ કરતી વખતે આપમેળે ઇમેજ બેકગ્રાઉન્ડ દૂર કરો.",
    saveChanges: "ફેરફારો સાચવો",
    saving: "સાચવી રહ્યું છે...",
    saveSuccess: "ફેરફારો સફળતાપૂર્વક સાચવવામાં આવ્યા!",
    // Company details
    companyHeading: "કંપની પ્રોફાઇલ",
    companyDesc: "આઉટપુટ, ઇન્વૉઇસેસ અને કાર્ડ્સ માટે તમારા વ્યાવસાયિક વ્યવસાયની વિગતો મેનેજ કરો.",
    uploadLogo: "કંપનીનો લોગો અપલોડ કરો",
    uploadQR: "કસ્ટમ QR કોડ અપલોડ કરો",
    generalInfo: "સામાન્ય માહિતી",
    companyName: "કંપનીનું નામ",
    companyEmail: "કંપની ઈમેલ",
    primaryPhone: "પ્રાથમિક મોબાઇલ નંબર",
    secondaryPhone: "ગૌણ મોબાઇલ નંબર",
    gstin: "GST નંબર (GSTIN)",
    website: "વેબસાઇટ URL",
    address: "કંપનીનું સરનામું",
    bankDetails: "બેંક અને ચૂકવણીની વિગતો",
    bankName: "બેંકનું નામ",
    accountNumber: "એકાઉન્ટ નંબર",
    ifscCode: "IFSC કોડ",
    upiId: "UPI ID (QR કોડ માટે)",
    termsHeading: "નિયમો અને શરતો",
    termsDesc: "ઇન્વોઇસ/ક્વોટેશનની શરતો (ક્વોટેશનની નીચે પ્રિન્ટ થશે)",
    saveCompany: "કંપની પ્રોફાઇલ સાચવો",
    // Theme
    themeHeading: "થીમ",
    themeDesc: "વર્કસ્પેસનો દેખાવ અને મુખ્ય રંગ કસ્ટમાઇઝ કરો.",
    themeMode: "થીમ મોડ",
    lightMode: "લાઈટ મોડ",
    darkMode: "ડાર્ક મોડ",
    systemSync: "સિસ્ટમ સિંક",
    accentColor: "એક્સેન્ટ કલર",
    saveTheme: "થીમ સેટિંગ્સ સાચવો",
    themeSuccess: "થીમ સેટિંગ્સ સફળતાપૂર્વક સાચવવામાં આવી!",
    // Language
    langHeading: "ભાષા",
    langDesc: "તમારી ડિફોલ્ટ સિસ્ટમ પ્રદર્શન ભાષા પસંદ કરો.",
    saveLanguage: "ભાષા સેટિંગ્સ સાચવો",
    langSuccess: "ભાષા સફળતાપૂર્વક સેટ થઈ! એપ્લિકેશન ફરીથી લોડ થઈ રહી છે...",
    // Keyboard
    kbdHeading: "કીબોર્ડ શૉર્ટકટ્સ",
    kbdDesc: "કીબોર્ડ શૉર્ટકટ્સનો ઉપયોગ કરીને વધુ ઝડપથી ડિઝાઇન કરો.",
    testPad: "ઇન્ટરેક્ટિવ શૉર્ટકટ ટેસ્ટ પેડ",
    testPadDesc: "પરીક્ષણ કરવા માટે તમારા કીબોર્ડ પર કોઈપણ કી દબાવો:",
    testPadPress: "કી દબાવો...",
    shortcutHeader: "કીબોર્ડ શૉર્ટકટ",
    actionHeader: "ક્રિયા",
    descHeader: "વર્ણન",
    // Storage
    storageHeading: "સ્ટોરેજ",
    storageDesc: "બ્રાઉઝર કૅશ અને ડેટાબેઝ સ્નેપશોટ કદ મેનેજ કરો.",
    exportLogs: "નિકાસ લોગ વસ્તુઓ",
    cachedBrowser: "બ્રાઉઝરમાં સ્થાનિક રીતે સંગ્રહિત.",
    snapshotsTitle: "સ્થાનિક સ્નેપશોટ",
    snapshotsDesc: "ડેટાબેઝ બેકઅપ સ્નેપશોટ્સ.",
    localSize: "લોકલ સ્ટોરેજ કદ",
    localSizeDesc: "વપરાયેલ કુલ મેટાડેટા ક્વોટા.",
    clearFiles: "કામચલાઉ ફાઇલો સાફ કરો",
    clearFilesDesc: "બ્રાઉઝર લોકલ સ્ટોરેજ ખાલી કરવા માટે નિકાસ ઇતિહાસ સાફ કરો.",
    clearCacheBtn: "કૅશ સાફ કરો",
  },
  hi: {
    // Tabs & Title
    settings: "सेटिंग्स",
    profile: "प्रोफाइल",
    company: "कंपनी का विवरण",
    theme: "थीम",
    language: "भाषा",
    shortcuts: "कीबोर्ड शॉर्टकट",
    storage: "स्टोरेज",
    users: "उपयोगकर्ता प्रबंधन",
    security: "सुरक्षा",
    backup: "डेटा और बैकअप",
    signOut: "साइन आउट",
    // Profile
    profileHeading: "प्रोफाइल",
    profileDesc: "अपनी व्यक्तिगत जानकारी अपडेट करें।",
    changeAvatar: "अवतार बदलें",
    fullName: "पूरा नाम",
    emailAddress: "ईमेल",
    editEmail: "ईमेल बदलें",
    cancel: "रद्द करें",
    mobileNumber: "मोबाइल नंबर",
    gender: "लिंग",
    male: "पुरुष",
    female: "महिला",
    other: "अन्य",
    preferNotToSay: "बताना नहीं चाहते",
    autoRemoveBg: "ऑटो बैकग्राउंड रिमूवर",
    autoRemoveBgDesc: "कलेक्शन में अपलोड करते समय इमेज बैकग्राउंड अपने आप हटा दें।",
    saveChanges: "बदलाव सहेजें",
    saving: "सहेज रहा है...",
    saveSuccess: "बदलाव सफलतापूर्वक सहेज लिए गए!",
    // Company details
    companyHeading: "कंपनी प्रोफाइल",
    companyDesc: "आउटपुट, चालान और कार्ड के लिए व्यावसायिक विवरण प्रबंधित करें।",
    uploadLogo: "कंपनी लोगो अपलोड करें",
    uploadQR: "कस्टम QR कोड अपलोड करें",
    generalInfo: "सामान्य जानकारी",
    companyName: "कंपनी का नाम",
    companyEmail: "कंपनी ईमेल",
    primaryPhone: "प्राथमिक मोबाइल नंबर",
    secondaryPhone: "माध्यमिक मोबाइल नंबर",
    gstin: "GST नंबर (GSTIN)",
    website: "वेबसाइट URL",
    address: "कंपनी का पता",
    bankDetails: "बैंक और भुगतान विवरण",
    bankName: "बैंक का नाम",
    accountNumber: "खाता संख्या",
    ifscCode: "IFSC कोड",
    upiId: "UPI ID (QR कोड के लिए)",
    termsHeading: "नियम और शर्तें",
    termsDesc: "चालान/कोटेशन शर्तें (कोटेशन के नीचे दिखाई देगा)",
    saveCompany: "कंपनी प्रोफाइल सहेजें",
    // Theme
    themeHeading: "थीम",
    themeDesc: "कार्यक्षेत्र का रंग और प्रकटन अनुकूलित करें।",
    themeMode: "थीम मोड",
    lightMode: "लाइट मोड",
    darkMode: "डार्क मोड",
    systemSync: "सिस्टम सिंक",
    accentColor: "एक्सेन्ट रंग",
    saveTheme: "थीम सेटिंग्स सहेजें",
    themeSuccess: "थीम सेटिंग्स सफलतापूर्वक सहेजी गईं!",
    // Language
    langHeading: "भाषा",
    langDesc: "अपनी डिफ़ॉल्ट सिस्टम भाषा चुनें।",
    saveLanguage: "भाषा सेटिंग्स सहेजें",
    langSuccess: "भाषा सफलतापूर्वक सहेजी गई! एप्लिकेशन पुनः लोड हो रहा है...",
    // Keyboard
    kbdHeading: "कीबोर्ड शॉर्टकट",
    kbdDesc: "कीबोर्ड शॉर्टकट का उपयोग करके तेजी से डिज़ाइन करें।",
    testPad: "इंटरैक्टिव शॉर्टकट टेस्ट पैड",
    testPadDesc: "परीक्षण करने के लिए अपने कीबोर्ड पर कोई भी कुंजी दबाएं:",
    testPadPress: "कुंजी दबाएं...",
    shortcutHeader: "कीबोर्ड शॉर्टकट",
    actionHeader: "क्रिया",
    descHeader: "विवरण",
    // Storage
    storageHeading: "स्टोरेज",
    storageDesc: "ब्राउज़र कैश और डेटाबेस स्नैपशॉट का आकार प्रबंधित करें।",
    exportLogs: "निर्यात लॉग आइटम",
    cachedBrowser: "ब्राउज़र में स्थानीय रूप से संग्रहीत।",
    snapshotsTitle: "स्थानीय स्नैपशॉट",
    snapshotsDesc: "डेटाबेस बैकअप स्नैपशॉट।",
    localSize: "लोकल स्टोरेज आकार",
    localSizeDesc: "उपयोग किया गया कुल डेटा कोटा।",
    clearFiles: "अस्थायी फ़ाइलें साफ़ करें",
    clearFilesDesc: "ब्राउज़र लोकल स्टोरेज खाली करने के लिए निर्यात इतिहास साफ़ करें।",
    clearCacheBtn: "कैश साफ़ करें",
  },
  es: {
    // Tabs & Title
    settings: "Ajustes",
    profile: "Perfil",
    company: "Detalles de Empresa",
    theme: "Tema",
    language: "Idioma",
    shortcuts: "Atajos de Teclado",
    storage: "Almacenamiento",
    users: "Gestión de Usuarios",
    security: "Seguridad",
    backup: "Datos y Respaldo",
    signOut: "Cerrar Sesión",
    // Profile
    profileHeading: "Perfil",
    profileDesc: "Actualice su información personal.",
    changeAvatar: "Cambiar Avatar",
    fullName: "Nombre Completo",
    emailAddress: "Correo Electrónico",
    editEmail: "Editar Correo",
    cancel: "Cancelar",
    mobileNumber: "Número de Teléfono",
    gender: "Género",
    male: "Masculino",
    female: "Femenino",
    other: "Otro",
    preferNotToSay: "Prefiero no decirlo",
    autoRemoveBg: "Quitar Fondo Automáticamente",
    autoRemoveBgDesc: "Elimina automáticamente los fondos de las imágenes al subirlas en Colecciones.",
    saveChanges: "Guardar Cambios",
    saving: "Guardando...",
    saveSuccess: "¡Cambios guardados con éxito!",
    // Company details
    companyHeading: "Perfil de Empresa",
    companyDesc: "Administre los detalles profesionales de su negocio para salidas, facturas y tarjetas.",
    uploadLogo: "Subir Logo de Empresa",
    uploadQR: "Subir QR Personalizado",
    generalInfo: "Información General",
    companyName: "Nombre de Empresa",
    companyEmail: "Correo de Empresa",
    primaryPhone: "Teléfono Principal",
    secondaryPhone: "Teléfono Secundario",
    gstin: "Número de Identificación (GSTIN)",
    website: "URL del Sitio Web",
    address: "Dirección de Empresa",
    bankDetails: "Detalles Bancarios y Pagos",
    bankName: "Nombre del Banco",
    accountNumber: "Número de Cuenta",
    ifscCode: "Código IFSC",
    upiId: "ID de UPI (Para código QR)",
    termsHeading: "Términos y Condiciones",
    termsDesc: "Términos de Factura/Cotización (Impresos al final del documento)",
    saveCompany: "Guardar Perfil de Empresa",
    // Theme
    themeHeading: "Tema",
    themeDesc: "Personalice la apariencia y el color de acento del espacio de trabajo.",
    themeMode: "Modo del Tema",
    lightMode: "Modo Claro",
    darkMode: "Modo Oscuro",
    systemSync: "Sincronizar Sistema",
    accentColor: "Color de Acento",
    saveTheme: "Guardar Ajustes de Tema",
    themeSuccess: "¡Ajustes de tema guardados y aplicados con éxito!",
    // Language
    langHeading: "Idioma",
    langDesc: "Elija el idioma de visualización predeterminado del sistema.",
    saveLanguage: "Guardar Ajustes de Idioma",
    langSuccess: "¡Idioma guardado! Recargando aplicación...",
    // Keyboard
    kbdHeading: "Atajos de Teclado",
    kbdDesc: "Aumente su eficiencia de diseño con los atajos del editor.",
    testPad: "Panel de Prueba de Atajos",
    testPadDesc: "Presione cualquier combinación de teclas en su teclado para probar:",
    testPadPress: "Presione teclas para detectar...",
    shortcutHeader: "Atajos",
    actionHeader: "Acción",
    descHeader: "Descripción",
    // Storage
    storageHeading: "Almacenamiento",
    storageDesc: "Administre el almacenamiento local, copias de seguridad e historial.",
    exportLogs: "Registros de Exportación",
    cachedBrowser: "Almacenado localmente en el navegador.",
    snapshotsTitle: "Copias de Seguridad local",
    snapshotsDesc: "Copias de seguridad de la base de datos.",
    localSize: "Tamaño LocalStorage",
    localSizeDesc: "Total de cuota de metadatos utilizada.",
    clearFiles: "Limpiar Archivos Temporales",
    clearFilesDesc: "Libere espacio en el navegador limpiando el historial de descargas.",
    clearCacheBtn: "Limpiar Caché",
  }
};

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "profile");
  const [lang, setLang] = useState<string>("en");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLang(localStorage.getItem("digiscale_language") || "en");
    }
  }, []);

  const t = (key: string) => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS["en"]?.[key] || key;
  };

  const [userRole, setUserRole] = useState<string>("Admin");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserRole(localStorage.getItem("user_role") || "Admin");
    }
  }, []);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      if (userRole !== "Admin" && ["company", "users", "storage", "backup"].includes(tab)) {
        setActiveTab("profile");
      } else {
        setActiveTab(tab);
      }
    }
  }, [searchParams, userRole]);

  const tabs = [
    { id: "profile", label: t("profile"), icon: User },
    ...(userRole === "Admin" ? [{ id: "company", label: t("company"), icon: Building }] : []),
    { id: "security", label: t("security"), icon: Shield },
    { id: "language", label: t("language"), icon: Languages },
    ...(userRole === "Admin" ? [
      { id: "users", label: t("users"), icon: Users },
      { id: "storage", label: t("storage"), icon: HardDrive },
      { id: "backup", label: t("backup"), icon: HardDrive }
    ] : []),
  ];

  return (
    <div className="px-2.5 sm:px-8 pt-1.5 sm:pt-4 pb-6 flex-1 flex flex-col overflow-hidden bg-slate-50/50 min-h-0 w-full">

      <div className="flex items-center justify-between w-full no-print mb-1 sm:mb-0">
        <PageTitle
          title={t("settings")}
        />
        <button
          onClick={() => {
            logout();
            window.location.href = "/login";
          }}
          className="lg:hidden flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-red-655 hover:text-red-700 bg-rose-50/75 border border-rose-200 rounded-xl px-3 py-1.5 transition active:scale-95 shadow-sm shrink-0 cursor-pointer"
        >
          <LogOut className="h-3 w-3" />
          {t("signOut")}
        </button>
      </div>

      <div className="mt-2 sm:mt-8 flex-1 flex flex-col lg:grid gap-2.5 lg:gap-8 lg:grid-cols-[280px_1fr] lg:overflow-hidden min-h-0">

        {/* Sidebar Tabs */}
        <div className="flex overflow-x-auto lg:overflow-y-auto whitespace-nowrap lg:whitespace-normal scrollbar-none lg:flex-col gap-2 lg:gap-1.5 pb-2 lg:pb-0 rounded-2xl border border-slate-200/80 bg-white p-3 lg:p-4.5 shadow-sm h-fit shrink-0 w-full lg:w-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 lg:gap-3 rounded-xl px-3 lg:px-4 py-2.5 text-xs font-bold transition cursor-pointer shrink-0 ${activeTab === tab.id
                    ? "bg-blue-50 text-blue-700 font-extrabold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-50 hidden lg:block" />
              </button>
            );
          })}

          <hr className="hidden lg:block my-3 border-slate-100" />

          <button
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
            className="hidden lg:flex items-center gap-2 lg:gap-4 rounded-xl px-3 lg:px-4 py-2.5 text-xs font-bold text-red-655 transition hover:bg-rose-50 hover:text-red-700 cursor-pointer shrink-0"
          >
            <div className="hidden lg:flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <LogOut className="h-4 w-4" />
            </div>
            {t("signOut")}
          </button>
        </div>

        {/* Content */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-8 pb-20 sm:pb-8 overflow-y-auto lg:h-full shadow-sm min-h-[400px]">
          {activeTab === "profile" && <ProfileSection />}
          {activeTab === "company" && <CompanySection />}
          {activeTab === "language" && <LanguageSection />}
          {activeTab === "storage" && <StorageSection />}
          {activeTab === "users" && <UsersSection />}
          {activeTab === "security" && <SecuritySection />}
          {activeTab === "backup" && <BackupSection />}
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
        } catch (e) { }
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

  // Realtime sync: auto-refresh profile and settings when changed from another device/user
  useEffect(() => {
    const channel = supabase
      .channel('realtime-settings-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_settings' }, async () => {
        try {
          const settingsData = await getUserSettings(true);
          if (settingsData) {
            setPhone(settingsData.phone || "");
            setOriginalPhone(settingsData.phone || "");
            setGender(settingsData.gender || "Male");
            setAutoRemoveBg(settingsData.auto_remove_background || false);
            setAvatarUrl(settingsData.avatar_url || null);
          }
        } catch (e) {}
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, async () => {
        try {
          const profileData = await getUserProfile(true);
          if (profileData) {
            setName(profileData.name || "");
            setEmail(profileData.email || "");
            setOriginalEmail(profileData.email || "");
          }
        } catch (e) {}
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
    <div className="space-y-4 sm:space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Profile</h2>
        <p className="mt-1 text-sm text-slate-500">
          Update your personal information.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`rounded-xl p-4 text-sm font-semibold border ${statusMsg.type === "success"
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
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
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
              className={`w-full rounded-xl border py-3 pl-12 pr-4 text-sm font-medium outline-none transition ${!isEmailEditable
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

        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 shadow-md shadow-blue-600/10 active:scale-95 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

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
                <p className="text-xs font-bold text-red-655 text-center">
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

/* ============ Users Section ============ */
function UsersSection() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentEmail, setCurrentEmail] = useState("");
  
  // Add User Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("Staff"); // Admin, Staff
  
  // Permissions (none, view, edit)
  const [permCollections, setPermCollections] = useState("edit");
  const [permWarehouse, setPermWarehouse] = useState("edit");
  const [permStockbook, setPermStockbook] = useState("edit");
  const [permClients, setPermClients] = useState("edit");
  const [permQuotations, setPermQuotations] = useState("edit");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Edit User States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState("Staff");
  const [editPermCollections, setEditPermCollections] = useState("edit");
  const [editPermWarehouse, setEditPermWarehouse] = useState("edit");
  const [editPermStockbook, setEditPermStockbook] = useState("edit");
  const [editPermClients, setEditPermClients] = useState("edit");
  const [editPermQuotations, setEditPermQuotations] = useState("edit");
  const [editErrorMsg, setEditErrorMsg] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete Confirmation States
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentEmail(localStorage.getItem("user_email") || "");
    }
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await listUsers();
      setUsers(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      setErrorMsg("All fields are required.");
      return;
    }
    try {
      setSubmitting(true);
      setErrorMsg("");
      setSuccessMsg("");
      await createUser({
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        role: newRole,
        perm_collections: newRole === "Admin" ? "edit" : permCollections,
        perm_warehouse: newRole === "Admin" ? "edit" : permWarehouse,
        perm_stockbook: newRole === "Admin" ? "edit" : permStockbook,
        perm_clients: newRole === "Admin" ? "edit" : permClients,
        perm_quotations: newRole === "Admin" ? "edit" : permQuotations
      });
      setSuccessMsg("User created successfully!");
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("Staff");
      setPermCollections("edit");
      setPermWarehouse("edit");
      setPermStockbook("edit");
      setPermClients("edit");
      setPermQuotations("edit");
      setShowAddModal(false);
      loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (u: any) => {
    setEditingUser(u);
    setEditName(u.name || "");
    setEditEmail(u.email || "");
    setEditPassword("");
    setEditRole(u.role || "Staff");
    setEditPermCollections(u.perm_collections || "edit");
    setEditPermWarehouse(u.perm_warehouse || "edit");
    setEditPermStockbook(u.perm_stockbook || "edit");
    setEditPermClients(u.perm_clients || "edit");
    setEditPermQuotations(u.perm_quotations || "edit");
    setEditErrorMsg("");
    setShowEditModal(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim()) {
      setEditErrorMsg("Name and email are required.");
      return;
    }
    try {
      setEditSubmitting(true);
      setEditErrorMsg("");
      await updateUser(editingUser.id, {
        name: editName.trim(),
        email: editEmail.trim().toLowerCase(),
        password: editPassword || "",
        role: editRole,
        perm_collections: editRole === "Admin" ? "edit" : editPermCollections,
        perm_warehouse: editRole === "Admin" ? "edit" : editPermWarehouse,
        perm_stockbook: editRole === "Admin" ? "edit" : editPermStockbook,
        perm_clients: editRole === "Admin" ? "edit" : editPermClients,
        perm_quotations: editRole === "Admin" ? "edit" : editPermQuotations,
      });
      setShowEditModal(false);
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      setEditErrorMsg(err.message || "Failed to update user.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirmId) return;
    try {
      setDeleting(true);
      await deleteUser(deleteConfirmId);
      setDeleteConfirmId(null);
      setDeleteConfirmName("");
      loadUsers();
    } catch (err: any) {
      alert(err.message || "Failed to delete user.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const renderModulePermission = (moduleName: string, permission: string, IconComponent: any) => {
    let colorClass = "";
    let label = "";
    if (permission === "edit") {
      colorClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
      label = "Edit";
    } else if (permission === "view") {
      colorClass = "bg-amber-50 text-amber-700 border-amber-100";
      label = "View";
    } else {
      colorClass = "bg-slate-50 text-slate-400 border-slate-150";
      label = "None";
    }

    return (
      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[9px] font-bold uppercase tracking-wider shadow-sm ${colorClass}`}>
        <IconComponent className="h-3.5 w-3.5 shrink-0" />
        <span>{moduleName}</span>
        <span className="opacity-40">:</span>
        <span className="font-extrabold">{label}</span>
      </div>
    );
  };

  const renderPermissionToggle = (label: string, value: string, onChange: (val: string) => void) => {
    return (
      <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-150 shadow-sm">
        <span className="text-xs font-bold text-slate-700">{label}</span>
        <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 select-none">
          {["none", "view", "edit"].map((opt) => {
            const isActive = value === opt;
            const activeColor = 
              opt === "edit" ? "bg-emerald-500 text-white shadow-sm font-black" :
              opt === "view" ? "bg-amber-500 text-white shadow-sm font-black" :
              "bg-slate-400 text-white shadow-sm font-black";
            return (
              <button
                type="button"
                key={opt}
                onClick={() => onChange(opt)}
                className={`px-3 py-1 text-[9px] uppercase tracking-wider rounded-md transition-all duration-100 cursor-pointer ${
                  isActive ? activeColor : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-sans">User & Staff Management</h2>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            Create, view, and manage custom staff access privileges.
          </p>
        </div>
        <button
          onClick={() => {
            setErrorMsg("");
            setSuccessMsg("");
            setShowAddModal(true);
          }}
          className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 active:scale-95 shadow-md shadow-blue-500/10 flex items-center justify-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <Users className="h-4 w-4" /> Create New Account
        </button>
      </div>

      {/* Users List — mobile-friendly card layout, no horizontal scroll */}
      <div className="space-y-3">
        {users.map((u) => {
          const isSelf = u.email?.toLowerCase() === currentEmail.toLowerCase();
          const isAdmin = u.role === "Admin";
          return (
            <div
              key={u.id}
              className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              {/* Avatar + Name/Email */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/10 overflow-hidden">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    u.name ? u.name.charAt(0).toUpperCase() : "U"
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 text-sm leading-tight truncate">{u.name}</p>
                  <p className="text-[11px] text-slate-400 font-semibold mt-0.5 truncate">{u.email}</p>
                  <p className="text-[10px] text-slate-300 font-medium mt-0.5">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                  </p>
                </div>
              </div>

              {/* Role Badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider border shadow-sm ${
                  isAdmin
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-purple-50 text-purple-700 border-purple-200"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isAdmin ? "bg-blue-600" : "bg-purple-600"}`} />
                  {u.role || "Staff"}
                </span>
              </div>

              {/* Access Permissions */}
              <div className="flex-1">
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider shadow-sm">
                    <Shield className="h-3.5 w-3.5" /> Full Control
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {renderModulePermission("Collections", u.perm_collections || "edit", FolderOpen)}
                    {renderModulePermission("Warehouse", u.perm_warehouse || "edit", Warehouse)}
                    {renderModulePermission("Stock", u.perm_stockbook || "edit", TrendingUp)}
                    {renderModulePermission("Clients", u.perm_clients || "edit", UserCheck)}
                    {renderModulePermission("Quotations", u.perm_quotations || "edit", FileText)}
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="shrink-0 flex items-center gap-2">
                {isSelf ? (
                  <span className="text-[10px] text-blue-500 font-bold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">YOU</span>
                ) : (
                  <>
                    <button
                      onClick={() => openEditModal(u)}
                      className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition cursor-pointer"
                      title="Edit User"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteConfirmId(u.id);
                        setDeleteConfirmName(u.name);
                      }}
                      className="p-2 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 transition cursor-pointer"
                      title="Delete User"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE USER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0">
              <h3 className="text-base font-bold text-slate-900">Create System User</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleAddUser} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {errorMsg && (
                  <div className="text-xs font-bold text-red-655 bg-rose-50 border border-rose-100 p-2.5 rounded-xl">
                    {errorMsg}
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      placeholder="e.g. Keval Vaghani"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email / Username</label>
                    <input
                      type="email"
                      required
                      autoComplete="off"
                      placeholder="e.g. user@gmail.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Password</label>
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 shadow-sm"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Account Role</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewRole("Staff")}
                        className={`flex items-start gap-2.5 rounded-xl border-2 p-3 text-left transition cursor-pointer ${
                          newRole === "Staff"
                            ? "border-purple-500 bg-purple-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <span className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center ${
                          newRole === "Staff" ? "border-purple-500" : "border-slate-300"
                        }`}>
                          {newRole === "Staff" && <span className="h-2 w-2 rounded-full bg-purple-500" />}
                        </span>
                        <div>
                          <p className={`text-xs font-bold ${newRole === "Staff" ? "text-purple-700" : "text-slate-700"}`}>Staff</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Custom permissions</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewRole("Admin")}
                        className={`flex items-start gap-2.5 rounded-xl border-2 p-3 text-left transition cursor-pointer ${
                          newRole === "Admin"
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <span className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center ${
                          newRole === "Admin" ? "border-blue-500" : "border-slate-300"
                        }`}>
                          {newRole === "Admin" && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                        </span>
                        <div>
                          <p className={`text-xs font-bold ${newRole === "Admin" ? "text-blue-700" : "text-slate-700"}`}>Admin</p>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Full control</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* PERMISSIONS CUSTOMIZATION FOR STAFF */}
                {newRole === "Staff" && (
                  <div className="rounded-2xl border border-slate-150 bg-slate-50/50 p-4 space-y-3.5">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Customize Access Permissions</h4>
                    
                    <div className="grid grid-cols-1 gap-2.5">
                      {renderPermissionToggle("Collections (Projects)", permCollections, setPermCollections)}
                      {renderPermissionToggle("Warehouse Layout", permWarehouse, setPermWarehouse)}
                      {renderPermissionToggle("Stock Book Stats", permStockbook, setPermStockbook)}
                      {renderPermissionToggle("Clients Profile", permClients, setPermClients)}
                      {renderPermissionToggle("Quotations History", permQuotations, setPermQuotations)}
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky Footer */}
              <div className="border-t border-slate-100 px-5 py-4 shrink-0 bg-slate-50/50 rounded-b-2xl flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/10 cursor-pointer"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0">
              <h3 className="text-base font-bold text-slate-900">Edit User</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleEditUser} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {editErrorMsg && (
                  <div className="text-xs font-bold text-red-600 bg-rose-50 border border-rose-100 p-2.5 rounded-xl">{editErrorMsg}</div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      autoComplete="off"
                      placeholder="e.g. Keval Vaghani"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email / Username</label>
                    <input
                      type="email"
                      required
                      autoComplete="off"
                      placeholder="e.g. user@gmail.com"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 shadow-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">New Password <span className="text-slate-300 normal-case font-medium">(leave blank to keep current)</span></label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Account Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditRole("Staff")}
                      className={`flex items-start gap-2.5 rounded-xl border-2 p-3 text-left transition cursor-pointer ${
                        editRole === "Staff"
                          ? "border-purple-500 bg-purple-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center ${
                        editRole === "Staff" ? "border-purple-500" : "border-slate-300"
                      }`}>
                        {editRole === "Staff" && <span className="h-2 w-2 rounded-full bg-purple-500" />}
                      </span>
                      <div>
                        <p className={`text-xs font-bold ${editRole === "Staff" ? "text-purple-700" : "text-slate-700"}`}>Staff</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Custom permissions</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditRole("Admin")}
                      className={`flex items-start gap-2.5 rounded-xl border-2 p-3 text-left transition cursor-pointer ${
                        editRole === "Admin"
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center ${
                        editRole === "Admin" ? "border-blue-500" : "border-slate-300"
                      }`}>
                        {editRole === "Admin" && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                      </span>
                      <div>
                        <p className={`text-xs font-bold ${editRole === "Admin" ? "text-blue-700" : "text-slate-700"}`}>Admin</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Full control</p>
                      </div>
                    </button>
                  </div>
                </div>

                {editRole === "Staff" && (
                  <div className="rounded-2xl border border-slate-150 bg-slate-50/50 p-4 space-y-3.5">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Customize Access Permissions</h4>
                    <div className="grid grid-cols-1 gap-2.5">
                      {renderPermissionToggle("Collections (Projects)", editPermCollections, setEditPermCollections)}
                      {renderPermissionToggle("Warehouse Layout", editPermWarehouse, setEditPermWarehouse)}
                      {renderPermissionToggle("Stock Book Stats", editPermStockbook, setEditPermStockbook)}
                      {renderPermissionToggle("Clients Profile", editPermClients, setEditPermClients)}
                      {renderPermissionToggle("Quotations History", editPermQuotations, setEditPermQuotations)}
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky Footer */}
              <div className="border-t border-slate-100 px-5 py-4 shrink-0 bg-slate-50/50 rounded-b-2xl flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/10 cursor-pointer"
                >
                  {editSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-sm font-bold text-slate-900">Delete User Account?</h3>
            <p className="mt-2 text-xs text-slate-500 font-medium">
              Are you sure you want to permanently delete <strong className="text-slate-800">{deleteConfirmName}</strong> and all their associated data (collections, products, quotations, warehouse layouts)? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-5">
              <button
                disabled={deleting}
                onClick={() => {
                  setDeleteConfirmId(null);
                  setDeleteConfirmName("");
                }}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={handleDeleteUser}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm shadow-red-500/10 cursor-pointer"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
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
              className={`relative h-7 w-12 rounded-full transition ${item.value ? "bg-blue-600" : "bg-slate-300"
                }`}
            >
              <div
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition ${item.value ? "left-[22px]" : "left-0.5"
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

      if (typeof window !== "undefined") {
        if (logo) {
          localStorage.setItem("digiscale_company_logo", logo);
        } else {
          localStorage.removeItem("digiscale_company_logo");
        }
        if (name) {
          localStorage.setItem("digiscale_company_name", name);
        } else {
          localStorage.removeItem("digiscale_company_name");
        }
        window.dispatchEvent(new Event("digiscale-settings-updated"));
      }

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
          className={`rounded-xl p-4 text-sm font-semibold border ${statusMsg.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
            }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Company Logo & QR Code Uploader */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Logo block */}
        <div className="flex items-center gap-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleLogoChange}
            accept="image/*"
            className="hidden"
          />
          <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shadow-inner text-slate-400 shrink-0">
            {logo ? (
              <img src={logo} alt="Company Logo" className="h-full w-full object-cover" />
            ) : (
              <Building className="h-10 w-10 text-slate-400" />
            )}
          </div>
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 shadow-sm active:scale-95 whitespace-nowrap"
            >
              Upload Company Logo
            </button>
            <p className="mt-1 text-[10px] text-slate-400 font-semibold">
              Square PNG or JPG. Max 2MB
            </p>
          </div>
        </div>

        {/* QR block */}
        <div className="flex items-center gap-4">
          <input
            type="file"
            ref={qrInputRef}
            onChange={handleQrCodeChange}
            accept="image/*"
            className="hidden"
          />
          <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shadow-inner text-slate-400 shrink-0">
            {qrCode ? (
              <img src={qrCode} alt="Custom QR Code" className="h-full w-full object-cover" />
            ) : (
              <QrCode className="h-10 w-10 text-slate-400" />
            )}
          </div>
          <div>
            <button
              onClick={() => qrInputRef.current?.click()}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 shadow-sm active:scale-95 whitespace-nowrap"
            >
              Upload Custom QR
            </button>
            <p className="mt-1 text-[10px] text-slate-400 font-semibold">
              Square PNG or JPG. Max 2MB
            </p>
          </div>
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

  const triggerDeleteLocal = (timestamp: any) => {
    setModalConfig({
      title: "Delete Backup Snapshot",
      message: "Are you sure you want to delete this backup snapshot? This action is permanent and cannot be undone.",
      type: "confirm",
      onConfirm: async () => {
        try {
          await deleteBackupFromIndexedDB(timestamp);
          await refreshBackupHistory();
          setModalConfig({
            title: "Snapshot Deleted",
            message: "The backup snapshot has been successfully deleted from local history.",
            type: "success"
          });
        } catch (err: any) {
          setModalConfig({
            title: "Delete Failed",
            message: "Failed to delete backup snapshot: " + (err.message || err),
            type: "error"
          });
        }
      }
    });
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
    <div className="space-y-4 sm:space-y-8">
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
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${modalConfig.type === "success" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                  modalConfig.type === "error" ? "bg-red-50 text-red-600 border border-red-100" :
                    "bg-amber-50 text-amber-600 border border-amber-100"
                }`}>
                {modalConfig.type === "success" && <CheckCircle className="h-5 w-5" />}
                {modalConfig.type === "error" && <AlertCircle className="h-5 w-5" />}
                {modalConfig.type === "confirm" && <AlertTriangle className="h-5 w-5" />}
              </div>

              <div className="flex-1 mt-0.5">
                <h3 className={`text-base font-bold leading-6 ${modalConfig.type === 'error' ? 'text-red-600' :
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
                className={`inline-flex justify-center rounded-lg border border-transparent px-5 py-2 text-xs font-bold text-white transition-colors focus:outline-none shadow-sm ${modalConfig.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-4 border-b border-slate-100 pb-3 sm:pb-5">
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
      <div className="grid gap-3 sm:gap-5 md:grid-cols-3 relative z-20">
        {/* 1. Auto Backup Configuration */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm flex flex-col h-full">
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
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5 shadow-sm flex flex-col h-full">
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
        <div className="rounded-xl border border-red-200 bg-red-50/80 p-4 sm:p-5 flex flex-col h-full shadow-sm">
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
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lang, setLang] = useState<string>("en");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLang(localStorage.getItem("digiscale_language") || "en");
      const mode = localStorage.getItem("digiscale_theme_mode") as any || "light";
      const color = localStorage.getItem("digiscale_theme_accent") || "blue";
      setThemeMode(mode);
      setAccentColor(color);
    }
  }, []);

  const t = (key: string) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS["en"]?.[key] || key;

  const handleSaveTheme = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("digiscale_theme_mode", themeMode);
      localStorage.setItem("digiscale_theme_accent", accentColor);

      // Update DOM immediately
      const isDark = themeMode === 'dark' || (themeMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      document.documentElement.setAttribute('data-theme-accent', accentColor);

      setStatusMsg({ type: "success", text: t("themeSuccess") });
      setTimeout(() => setStatusMsg(null), 3000);
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
        <h2 className="text-xl font-bold text-slate-900">{t("themeHeading")}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {t("themeDesc")}
        </p>
      </div>

      {statusMsg && (
        <div className="rounded-xl p-4 text-sm font-semibold border bg-green-50 border-green-200 text-green-700">
          {statusMsg.text}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="mb-3 block text-sm font-bold text-slate-700">{t("themeMode")}</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: "light", label: t("lightMode"), desc: lang === "gu" ? "પ્રકાશિત શૈલી" : lang === "hi" ? "प्रकाशित शैली" : "Classic bright appearance" },
              { id: "dark", label: t("darkMode"), desc: lang === "gu" ? "આંખો માટે અનુકૂળ" : lang === "hi" ? "आंखों के लिए अनुकूल" : "Easy on eyes in dark rooms" },
              { id: "system", label: t("systemSync"), desc: lang === "gu" ? "સિસ્ટમ અનુસાર" : lang === "hi" ? "सिस्टम अनुसार" : "Follow system preference" },
            ].map(tObj => (
              <button
                key={tObj.id}
                onClick={() => setThemeMode(tObj.id as any)}
                className={`p-4 rounded-xl border text-left transition cursor-pointer ${themeMode === tObj.id
                    ? "border-blue-600 bg-blue-50/40 text-blue-900 shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
              >
                <div className="text-xs font-black">{tObj.label}</div>
                <div className="text-[10px] text-slate-400 font-semibold mt-1">{tObj.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-3 block text-sm font-bold text-slate-700">{t("accentColor")}</label>
          <div className="flex flex-wrap gap-3">
            {ACCENTS.map(acc => (
              <button
                key={acc.id}
                onClick={() => setAccentColor(acc.id)}
                className={`w-10 h-10 rounded-full border-2 transition relative flex items-center justify-center cursor-pointer ${accentColor === acc.id ? "border-slate-800 scale-105" : "border-transparent hover:scale-105"
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
        className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 shadow-md shadow-blue-600/10 active:scale-95 cursor-pointer"
      >
        {t("saveTheme")}
      </button>
    </div>
  );
}

/* ============ Language Section ============ */
function LanguageSection() {
  const [selectedLang, setSelectedLang] = useState<string>("en");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lang, setLang] = useState<string>("en");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const activeL = localStorage.getItem("digiscale_language") || "en";
      setSelectedLang(activeL);
      setLang(activeL);
    }
  }, []);

  const t = (key: string) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS["en"]?.[key] || key;

  const handleSaveLanguage = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("digiscale_language", selectedLang);
      setStatusMsg({ type: "success", text: t("langSuccess") });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const LANGUAGES = [
    { id: "en", name: "English", sub: "United States & Global" },
    { id: "gu", name: "Gujarati (ગુજરાતી)", sub: "India (Gujarat)" },
    { id: "hi", name: "Hindi (हिन्दी)", sub: "India (National)" },
    { id: "es", name: "Spanish (Español)", sub: "Spain & Latin America" },
  ];

  return (
    <div className="space-y-4 sm:space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{t("langHeading")}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {t("langDesc")}
        </p>
      </div>

      {statusMsg && (
        <div className="rounded-xl p-4 text-sm font-semibold border bg-green-50 border-green-200 text-green-700 animate-pulse">
          {statusMsg.text}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {LANGUAGES.map(langObj => (
          <button
            key={langObj.id}
            onClick={() => setSelectedLang(langObj.id)}
            className={`p-3.5 sm:p-4 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${selectedLang === langObj.id
                ? "border-blue-600 bg-blue-50/40"
                : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
          >
            <div>
              <span className={`text-xs font-bold block ${selectedLang === langObj.id ? "text-blue-900" : "text-slate-800"}`}>
                {langObj.name}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{langObj.sub}</span>
            </div>
            {selectedLang === langObj.id && (
              <Check className="w-4 h-4 text-blue-600" />
            )}
          </button>
        ))}
      </div>

      <button
        onClick={handleSaveLanguage}
        className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700 shadow-md shadow-blue-600/10 active:scale-95 cursor-pointer"
      >
        {t("saveLanguage")}
      </button>
    </div>
  );
}

/* ============ Keyboard Shortcuts Section ============ */
function KeyboardShortcutsSection() {
  const [activeTestKey, setActiveTestKey] = useState<string>("");
  const [lang, setLang] = useState<string>("en");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLang(localStorage.getItem("digiscale_language") || "en");
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const keysPressed = [];
      if (e.ctrlKey || e.metaKey) keysPressed.push("Ctrl");
      if (e.shiftKey) keysPressed.push("Shift");
      if (e.altKey) keysPressed.push("Alt");
      if (e.key !== "Control" && e.key !== "Shift" && e.key !== "Alt" && e.key !== "Meta") {
        keysPressed.push(e.key.toUpperCase());
      }
      setActiveTestKey(keysPressed.join(" + "));
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const t = (key: string) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS["en"]?.[key] || key;

  const SHORTCUTS = [
    { keys: ["Ctrl", "Z"], action: lang === "gu" ? "પૂર્વવત્ કરો (Undo)" : lang === "hi" ? "पूर्ववत करें (Undo)" : "Undo", desc: lang === "gu" ? "ડિઝાઇનમાં કરેલા છેલ્લો ફેરફાર પાછો ખેંચો." : "Revert the last change made to the design." },
    { keys: ["Ctrl", "Shift", "Z"], action: lang === "gu" ? "ફરીથી કરો (Redo)" : lang === "hi" ? "फिर से करें (Redo)" : "Redo", desc: lang === "gu" ? "છેલ્લા પૂર્વવત્ કરેલા ફેરફારને ફરીથી લાગુ કરો." : "Restore the last undone action." },
    { keys: ["Ctrl", "D"], action: lang === "gu" ? "ડુપ્લિકેટ કરો" : lang === "hi" ? "डुप्लिकेट करें" : "Duplicate", desc: lang === "gu" ? "પસંદ કરેલા ઓબ્જેક્ટની બે નકલ બનાવો." : "Copy and paste the selected canvas object." },
    { keys: ["Delete", "Backspace"], action: lang === "gu" ? "પસંદ કરેલું કાઢી નાખો" : lang === "hi" ? "चयनित हटाएं" : "Delete selection", desc: lang === "gu" ? "કેનવાસમાંથી પસંદ કરેલું કાઢી નાખો." : "Remove selected text/image from canvas." },
    { keys: ["Ctrl", "L"], action: lang === "gu" ? "લોક / અનલોક" : lang === "hi" ? "लॉक / अनलॉक" : "Lock / Unlock", desc: lang === "gu" ? "ઓબ્જેક્ટની સ્થિતિ લોક અથવા અનલોક કરો." : "Lock the selected element position or unlock it." },
    { keys: ["Arrow Keys"], action: lang === "gu" ? "ઓબ્જેક્ટ ખસેડો" : lang === "hi" ? "ऑब्जेक्ट खिसकाएं" : "Move element", desc: lang === "gu" ? "કેનવાસ પર ઓબ્જેક્ટને પિક્સેલ બાય પિક્સેલ ખસેડો." : "Move active object on canvas pixel by pixel." },
    { keys: ["Ctrl", "Plus"], action: lang === "gu" ? "ઝૂમ ઇન" : lang === "hi" ? "ज़ूम इन" : "Zoom In", desc: lang === "gu" ? "કેનવાસનું કદ મોટું કરીને જુઓ." : "Increase canvas scale visibility." },
    { keys: ["Ctrl", "Minus"], action: lang === "gu" ? "ઝૂમ આઉટ" : lang === "hi" ? "ज़ूम आउट" : "Zoom Out", desc: lang === "gu" ? "કેનવાસનું કદ નાનું કરીને જુઓ." : "Decrease canvas scale visibility." },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{t("kbdHeading")}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {t("kbdDesc")}
        </p>
      </div>

      {/* Interactive testing field */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 text-center flex flex-col items-center justify-center space-y-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("testPad")}</span>
        <p className="text-xs text-slate-550 font-medium">{t("testPadDesc")}</p>
        <div className="h-12 flex items-center justify-center px-6 py-2 rounded-xl bg-white border border-slate-200 min-w-[200px]">
          {activeTestKey ? (
            <span className="font-mono text-sm font-bold text-blue-700 tracking-wide animate-pulse">
              {activeTestKey}
            </span>
          ) : (
            <span className="text-xs text-slate-400 font-bold italic">{t("testPadPress")}</span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto shadow-sm">
        <table className="w-full min-w-[500px] sm:min-w-0 text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black tracking-wider text-slate-500 uppercase">
              <th className="py-3 px-5">{t("shortcutHeader")}</th>
              <th className="py-3 px-5">{t("actionHeader")}</th>
              <th className="py-3 px-5">{t("descHeader")}</th>
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
                <td className="py-3 px-5 text-slate-550 font-medium">{s.desc}</td>
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
  const [localStorageKB, setLocalStorageKB] = useState(0);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [lang, setLang] = useState<string>("en");

  const calculateStorage = () => {
    if (typeof window !== "undefined") {
      const hist = localStorage.getItem("digiscale_export_history");
      if (hist) {
        try {
          setCachedHistoryCount(JSON.parse(hist).length);
        } catch (e) { }
      } else {
        setCachedHistoryCount(0);
      }

      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          total += key.length + (localStorage.getItem(key)?.length || 0);
        }
      }
      setLocalStorageKB(Math.round((total / 1024) * 100) / 100);

      getBackupsFromIndexedDB().then(bak => {
        setCachedSnapshotsCount(bak.length);
      }).catch(() => {
        setCachedSnapshotsCount(0);
      });
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLang(localStorage.getItem("digiscale_language") || "en");
    }
    calculateStorage();
  }, []);

  const t = (key: string) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS["en"]?.[key] || key;

  const handleClearCache = () => {
    const confirmText = lang === "gu"
      ? "શું તમે ખરેખર નિકાસ ઇતિહાસ સાફ કરવા માંગો છો? આનાથી તમારું લિસ્ટ શૂન્ય થઈ જશે."
      : lang === "hi"
        ? "क्या आप वाकई निर्यात इतिहास साफ करना चाहते हैं? इससे आपकी सूची शून्य हो जाएगी।"
        : "Are you sure you want to clear export history logs? This will reset your Export History list.";

    if (window.confirm(confirmText)) {
      localStorage.removeItem("digiscale_export_history");
      calculateStorage();
      setStatusMsg({ type: "success", text: lang === "gu" ? "નિકાસ ઇતિહાસ કૅશ સાફ થઈ ગયો છે!" : lang === "hi" ? "निर्यात इतिहास कैश साफ कर दिया गया है!" : "Export history logs cleared successfully!" });
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{t("storageHeading")}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {t("storageDesc")}
        </p>
      </div>

      {statusMsg && (
        <div className="rounded-xl p-4 text-sm font-semibold border bg-green-50 border-green-200 text-green-700">
          {statusMsg.text}
        </div>
      )}

      <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5 shadow-sm">
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{t("exportLogs")}</div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{cachedHistoryCount} {lang === "gu" ? "વસ્તુઓ" : lang === "hi" ? "आइटम" : "items"}</p>
          <p className="mt-1 text-xs text-slate-500 font-semibold">{t("cachedBrowser")}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5 shadow-sm">
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{t("snapshotsTitle")}</div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{cachedSnapshotsCount} {lang === "gu" ? "સ્નેપશોટ" : lang === "hi" ? "स्नैपशॉट" : "snapshots"}</p>
          <p className="mt-1 text-xs text-slate-500 font-semibold">{t("snapshotsDesc")}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5 shadow-sm">
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{t("localSize")}</div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{localStorageKB} KB</p>
          <p className="mt-1 text-xs text-slate-500 font-semibold">{t("localSizeDesc")}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 p-5 bg-white space-y-3 shadow-sm">
        <div>
          <span className="text-xs font-bold text-slate-900 block">{t("clearFiles")}</span>
          <span className="text-[11px] text-slate-500 font-semibold block mt-1 leading-relaxed">
            {t("clearFilesDesc")}
          </span>
        </div>
        <button
          onClick={handleClearCache}
          className="px-4 py-2 border border-slate-350 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-bold rounded-lg transition active:scale-95 cursor-pointer"
        >
          {t("clearCacheBtn")}
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
