"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
  FileText, 
  Printer, 
  Plus, 
  Trash2, 
  Building, 
  User, 
  Check,
  FileImage,
  Search,
  ChevronDown,
  ChevronUp,
  Settings,
  X,
  Eye,
  Edit,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Phone,
  AlignLeft,
  Download
} from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { QRCodeSVG } from 'qrcode.react';
import { getUserProfile, getUserSettings } from "@/services/api";
import { supabase } from "@/lib/supabase";
import { getCache, setCache } from "@/lib/cache";

// Global cache to prevent re-fetching the same empty photoUrl across components
const photoUrlCache = new Map<string, string | null>();

// --- Sub-components for optimizations ---
function AsyncProductImage({ productId, initialUrl, className, fallbackClassName, iconClassName }: { productId: string, initialUrl?: string, className: string, fallbackClassName: string, iconClassName: string }) {
  const [url, setUrl] = useState<string | null>(initialUrl || null);
  
  useEffect(() => {
    if (url) return;
    if (photoUrlCache.has(productId)) {
      const cached = photoUrlCache.get(productId);
      if (cached) setUrl(cached);
      return;
    }
    let mounted = true;
    const fetchPhoto = async () => {
      try {
        const { data } = await supabase.from('products').select('photoUrl').eq('id', productId).single();
        photoUrlCache.set(productId, data?.photoUrl || null);
        if (mounted && data?.photoUrl) setUrl(data.photoUrl);
      } catch (e) {
        photoUrlCache.set(productId, null);
      }
    };
    fetchPhoto();
    return () => { mounted = false; };
  }, [productId, url]);

  if (url) {
    return (
      <img
        src={url}
        alt=""
        className={className}
      />
    );
  }
  
  return (
    <div className={fallbackClassName}>
      <FileImage className={iconClassName} />
    </div>
  );
}
// ----------------------------------------

interface Collection {
  id: string;
  name: string;
  createdAt?: string;
  created_at?: string;
  collection_type?: "code" | "named";
}

interface Product {
  id: string;
  name: string;
  stock?: number;
  cartonQty?: number;
  rate?: string;
  color?: string;
  length?: string;
  photoUrl?: string; // photoUrl base64 string
  collectionName?: string;
  collectionId?: string;
  description?: string;
  location?: string;
}

interface QuotationItem {
  id: string;
  name: string;
  cartons: number;      // CTNS
  quantity: number;     // calculated as cartons * cartonQty
  cartonQty: number;    // how many units in a carton
  rate: string;         // price code / rate per unit
  color?: string;
  length?: string;
  photoUrl?: string;    // base64 product image
  collectionName?: string;
  description?: string;
  location?: string;
  stock?: number;
}

interface CompanyInfo {
  logo: string | null;
  name: string;
  email: string;
  primaryPhone: string;
  secondaryPhone: string;
  address: string;
  website: string;
  gst: string;
  bankName: string;
  accountNumber: string;
  ifsc?: string;
  upiId?: string;
  qrCode?: string;
  termsAndConditions?: string;
}

const getStatusStyles = (status: string) => {
  switch (status) {
    case "dispatch":
      return {
        bg: "bg-purple-50 hover:bg-purple-100/80 border-purple-250 text-purple-700",
        dot: "bg-purple-500",
        label: "Dispatch",
      };
    case "done":
      return {
        bg: "bg-emerald-50 hover:bg-emerald-100/80 border-emerald-250 text-emerald-700",
        dot: "bg-emerald-500",
        label: "Done",
      };
    default: // follow_up
      return {
        bg: "bg-amber-50 hover:bg-amber-100/80 border-amber-250 text-amber-700",
        dot: "bg-amber-500",
        label: "Follow Up",
      };
  }
};

export default function QuotationView({ permission = "edit" }: { permission?: string }) {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLang(localStorage.getItem("digiscale_language") || "en");
    }
  }, []);

  const TRANSLATIONS: Record<string, Record<string, string>> = {
    en: {
      followUp: "Follow Up",
      done: "Done",
      savedQuotesHistory: "Saved Quotations History",
      manageQuotesDesc: "Manage and load previously generated quotation bills.",
      noQuotesFound: "No saved quotations found",
      startCreatingDesc: "Start by creating and saving your first quotation bill.",
      refNo: "Ref No.",
      clientCompany: "Client / Company",
      quoteDateLabel: "Quote Date",
      items: "Items",
      grandTotal: "Grand Total",
      status: "Status",
      actions: "Actions",
      searchSavedQuotes: "Search saved quotes (Client, ID)...",
      createQuotation: "Create Quotation",
      savedHistory: "Saved History",
      saveQuotation: "Save Quotation",
      printExportPdf: "Print / Export PDF",
      quotationSettings: "1. QUOTATION SETTINGS",
      quoteRefNo: "QUOTE REF NO",
      quoteDate: "QUOTE DATE",
      includeBankDetails: "Include Bank Details on PDF",
      includeAuthorizedSign: "Include Authorized Sign Line",
      applyEventPriceMarkup: "APPLY EVENT PRICE MARKUP",
      clientDetailsOptional: "2. CLIENT DETAILS (OPTIONAL)",
      searchAddProducts: "3. SEARCH & ADD PRODUCTS",
      searchProductsPlaceholder: "Search products to add...",
      searchResults: "SEARCH RESULTS",
      searchHint: "Type product name, color, or code to search...",
      documentPreview: "DOCUMENT PREVIEW",
      previewHint: "* Renders final printed document dimensions below",
      billingDetails: "BILLING DETAILS:",
      noItemsSelected: "No items selected. Search and check boxes in the left list to add items.",
      selectPreSavedClient: "SELECT PRE-SAVED CLIENT...",
      clientName: "CLIENT NAME",
      companyName: "COMPANY NAME",
      contactDetails: "CONTACT DETAILS",
      address: "ADDRESS",
      additionalRemarks: "ADDITIONAL REMARKS / NOTE",
      enterRemarks: "Enter remarks...",
      phoneOrEmail: "Phone or Email",
      fullBusinessAddress: "Full business address",
      loadingQuotes: "Loading quotes...",
      savingQuotation: "Saving quotation...",
    },
    gu: {
      followUp: "ફોલો અપ",
      done: "પૂર્ણ",
      savedQuotesHistory: "સાચવેલા કોટેશનનો ઇતિહાસ",
      manageQuotesDesc: "અગાઉ જનરેટ કરેલા કોટેશન બિલનું સંચાલન અને લોડ કરો.",
      noQuotesFound: "કોઈ સાચવેલા કોટેશનો મળ્યા નથી",
      startCreatingDesc: "તમારું પ્રથમ કોટેશન બિલ બનાવીને અને સાચવીને પ્રારંભ કરો.",
      refNo: "સંદર્ભ નંબર",
      clientCompany: "ગ્રાહક / કંપની",
      quoteDateLabel: "કોટેશન તારીખ",
      items: "વસ્તુઓ",
      grandTotal: "કુલ સરવાળો",
      status: "સ્થિતિ",
      actions: "ક્રિયાઓ",
      searchSavedQuotes: "સાચવેલા કોટેશન શોધો (ગ્રાહક, આઈડી)...",
      createQuotation: "કોટેશન બનાવો",
      savedHistory: "સાચવેલો ઇતિહાસ",
      saveQuotation: "કોટેશન સાચવો",
      printExportPdf: "પીડીએફ પ્રિન્ટ / એક્સપોર્ટ",
      quotationSettings: "૧. કોટેશન સેટિંગ્સ",
      quoteRefNo: "કોટેશન સંદર્ભ નંબર",
      quoteDate: "કોટેશન તારીખ",
      includeBankDetails: "પીડીએફ પર બેંક વિગતો શામેલ કરો",
      includeAuthorizedSign: "અધિકૃત સહી લાઇન શામેલ કરો",
      applyEventPriceMarkup: "ઇવેન્ટ ભાવ માર્કઅપ લાગુ કરો",
      clientDetailsOptional: "૨. ગ્રાહક વિગતો (વૈકલ્પિક)",
      searchAddProducts: "૩. ઉત્પાદનો શોધો અને ઉમેરો",
      searchProductsPlaceholder: "ઉમેરવા માટે ઉત્પાદનો શોધો...",
      searchResults: "શોધ પરિણામો",
      searchHint: "શોધવા માટે ઉત્પાદનનું નામ, રંગ અથવા કોડ લખો...",
      documentPreview: "દસ્તાવેજ પૂર્વાવલોકન",
      previewHint: "* અંતિમ મુદ્રિત દસ્તાવેજના પરિમાણો નીચે દર્શાવે છે",
      billingDetails: "બિલિંગ વિગતો:",
      noItemsSelected: "કોઈ વસ્તુ પસંદ કરેલ નથી. આઇટમ્સ ઉમેરવા માટે ડાબી બાજુની સૂચિમાં સર્ચ કરો અને બોક્સ ચેક કરો.",
      selectPreSavedClient: "પહેલાથી સાચવેલ ગ્રાહક પસંદ કરો...",
      clientName: "ગ્રાહકનું નામ",
      companyName: "કંપનીનું નામ",
      contactDetails: "સંપર્ક વિગતો",
      address: "સરનામું",
      additionalRemarks: "વધારાની નોંધો",
      enterRemarks: "નોંધો દાખલ કરો...",
      phoneOrEmail: "ફોન અથવા ઈમેલ",
      fullBusinessAddress: "સંપૂર્ણ ધંધાકીય સરનામું",
      loadingQuotes: "કોટેશન લોડ થઈ રહ્યા છે...",
      savingQuotation: "કોટેશન સાચવવામાં આવી રહ્યું છે...",
    },
    hi: {
      followUp: "फॉलो अप",
      done: "पूरा",
      savedQuotesHistory: "सहेजे गए कोटेशन का इतिहास",
      manageQuotesDesc: "पहले जेनरेट किए गए कोटेशन बिल का प्रबंधन और लोड करें।",
      noQuotesFound: "कोई सहेजा गया कोटेशन नहीं मिला",
      startCreatingDesc: "अपना पहला कोटेशन बिल बनाकर और सहेजकर शुरुआत करें।",
      refNo: "संदर्भ संख्या",
      clientCompany: "ग्राहक / कंपनी",
      quoteDateLabel: "कोटेशन तिथि",
      items: "आइटम",
      grandTotal: "कुल योग",
      status: "स्थिति",
      actions: "कार्रवाई",
      searchSavedQuotes: "सहेजे गए कोटेशन खोजें (ग्राहक, आईडी)...",
      createQuotation: "कोटेशन बनाएं",
      savedHistory: "सहेजा गया इतिहास",
      saveQuotation: "कोटेशन सहेजें",
      printExportPdf: "पीडीएफ प्रिंट / निर्यात",
      quotationSettings: "1. कोटेशन सेटिंग्स",
      quoteRefNo: "कोटेशन संदर्भ संख्या",
      quoteDate: "कोटेशन दिनांक",
      includeBankDetails: "पीडीएफ पर बैंक विवरण शामिल करें",
      includeAuthorizedSign: "अधिकृत हस्ताक्षर लाइन शामिल करें",
      applyEventPriceMarkup: "इवेंट मूल्य मार्कअप लागू करें",
      clientDetailsOptional: "2. ग्राहक विवरण (वैकल्पिक)",
      searchAddProducts: "3. उत्पाद खोजें और जोड़ें",
      searchProductsPlaceholder: "जोड़ने के लिए उत्पाद खोजें...",
      searchResults: "खोज परिणाम",
      searchHint: "खोजने के लिए उत्पाद का नाम, रंग या कोड लिखें...",
      documentPreview: "दस्तावेज़ पूर्वावलोकन",
      previewHint: "* अंतिम मुद्रित दस्तावेज़ आयाम नीचे प्रदर्शित करता है",
      billingDetails: "बिलिंग विवरण:",
      noItemsSelected: "कोई आइटम चयनित नहीं है। आइटम जोड़ने के लिए बाईं सूची में खोजें और बक्से जांचें।",
      selectPreSavedClient: "पहले से सहेजे गए ग्राहक का चयन करें...",
      clientName: "ग्राहक का नाम",
      companyName: "कंपनी का नाम",
      contactDetails: "संपर्क विवरण",
      address: "पता",
      additionalRemarks: "अतिरिक्त टिप्पणी / नोट",
      enterRemarks: "अतिरिक्त टिप्पणी दर्ज करें...",
      phoneOrEmail: "फोन या ईमेल",
      fullBusinessAddress: "व्यवसाय का पूरा पता",
      loadingQuotes: "कोटेशन लोड हो रहे हैं...",
      savingQuotation: "कोटेशन सहेजा जा रहा है...",
    },
    es: {
      searchSavedQuotes: "Buscar cotizaciones guardadas (Cliente, ID)...",
      createQuotation: "Crear Cotización",
      savedHistory: "Historial Guardado",
      saveQuotation: "Guardar Cotización",
      printExportPdf: "Imprimir / Exportar PDF",
      quotationSettings: "1. CONFIGURACIÓN DE COTIZACIÓN",
      quoteRefNo: "Nº REF COTIZACIÓN",
      quoteDate: "FECHA COTIZACIÓN",
      includeBankDetails: "Incluir Datos Bancarios en PDF",
      includeAuthorizedSign: "Incluir Línea de Firma Autorizada",
      applyEventPriceMarkup: "APLICAR RECARGO DE EVENTO",
      clientDetailsOptional: "2. DETALLES DEL CLIENTE (OPCIONAL)",
      searchAddProducts: "3. BUSCAR Y AGREGAR PRODUCTOS",
      searchProductsPlaceholder: "Buscar productos para agregar...",
      searchResults: "RESULTADOS DE BÚSQUEDA",
      searchHint: "Escriba nombre, color o código del producto para buscar...",
      documentPreview: "VISTA PREVIA DEL DOCUMENTO",
      previewHint: "* Muestra las dimensiones finales del documento impreso abajo",
      billingDetails: "DATOS DE FACTURACIÓN:",
      noItemsSelected: "No hay artículos seleccionados. Busque y marque las casillas en la lista izquierda para agregar.",
      selectPreSavedClient: "SELECCIONAR CLIENTE PREVIO...",
      clientName: "NOMBRE DEL CLIENTE",
      companyName: "NOMBRE DE LA EMPRESA",
      contactDetails: "DETALLES DE CONTACTO",
      address: "DIRECCIÓN",
      additionalRemarks: "OBSERVACIONES / NOTA ADICIONAL",
      enterRemarks: "Introducir observaciones...",
      phoneOrEmail: "Teléfono o Correo",
      fullBusinessAddress: "Dirección comercial completa",
      loadingQuotes: "Cargando cotizaciones...",
      savingQuotation: "Guardando cotización...",
    }
  };

  const t = (key: string) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS["en"]?.[key] || key;

  const formatStockDisplay = (stock: number, cartonQty: number) => {
    const totalPcs = Math.round(stock * (cartonQty || 1));
    const ctn = Math.floor(totalPcs / (cartonQty || 1));
    const pcs = totalPcs % (cartonQty || 1);

    const ctnText = lang === "gu" ? "કાર્ટન" : lang === "hi" ? "कार्टन" : "Cartons";
    const connector = lang === "gu" ? " અને " : lang === "hi" ? " और " : " & ";
    const pcsText = lang === "gu" ? "છૂટક નંગ" : lang === "hi" ? "खुले पीस" : "Loose Pcs";

    if (totalPcs <= 0) {
      return `0 ${ctnText}`;
    }

    if (ctn > 0 && pcs > 0) {
      return `${ctn} ${ctnText}${connector}${pcs} ${pcsText}`;
    } else if (ctn > 0) {
      return `${ctn} ${ctnText}`;
    } else {
      return `${pcs} ${pcsText}`;
    }
  };

  const isCodeCollection = (nameOrCol: string | Collection) => {
    if (typeof nameOrCol === 'object') {
      if (nameOrCol.collection_type) return nameOrCol.collection_type === 'code';
      const name = nameOrCol.name;
      if (!name) return false;
      return /^[A-Z]{3}-\d+-\d+/.test(name) || name.startsWith("PJD");
    }
    if (!nameOrCol) return false;
    return /^[A-Z]{3}-\d+-\d+/.test(nameOrCol) || nameOrCol.startsWith("PJD");
  };

  const fetchAllProducts = async (userId: string) => {
    let allLoadedProducts: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, stock, cartonQty, rate, color, length, collection_id, description')
        .eq('user_id', userId)
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (error) throw error;
      if (data) {
        allLoadedProducts = [...allLoadedProducts, ...data];
        if (data.length < pageSize) {
          hasMore = false;
        } else {
          page++;
        }
      } else {
        hasMore = false;
      }
    }
    return allLoadedProducts;
  };

  const [currentUserId, setCurrentUserId] = useState<string>("");
  const showLeaveModalRef = useRef(false); // Can be used or keep state
  const isLeavingRef = useRef(false);
  const redirectAfterSaveRef = useRef<string | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingNavigationUrl, setPendingNavigationUrl] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"navigate" | "reset" | "go_history" | null>(null);
  const [currentQuoteId, setCurrentQuoteId] = useState<string | null>(null);
  const [showPrintSaveModal, setShowPrintSaveModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfFeedback, setPdfFeedback] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  
  // Accordion Toggles (settings collapsed by default on mobile screens to save scroll space)
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [clientOpen, setClientOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSettingsOpen(false);
      setClientOpen(false);
    }
  }, []);

  // Loaded Company Info from Profile
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [showBankDetails, setShowBankDetails] = useState<boolean>(true);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);

  // Authorized Sign option (Optional)
  const [showAuthSign, setShowAuthSign] = useState<boolean>(true);

  // Terms and conditions loaded from settings
  const [termsList, setTermsList] = useState<string[]>([]);

  // Client Info & Notes (Optional)
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [showSavePopup, setShowSavePopup] = useState(false);
  
  // Quotation Metadata (Clean empty strings by default on mount as requested!)
  const getLocalDateString = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };
  const [quoteDate, setQuoteDate] = useState<string>(() => getLocalDateString());
  const [quoteNumber, setQuoteNumber] = useState("");
  const [validUntil, setValidUntil] = useState<string>("");

  // Selected Quotation Items
  const [selectedItems, setSelectedItems] = useState<QuotationItem[]>([]);
  const [taxInput, setTaxInput] = useState<string>("");
  const [otherLabel, setOtherLabel] = useState<string>("");
  const [otherAmount, setOtherAmount] = useState<string>("");
  const [cashAmount, setCashAmount] = useState<string>("");
  const [bankAmount, setBankAmount] = useState<string>("");

  // Event Price Markup states
  const [applyEventMarkup, setApplyEventMarkup] = useState<boolean>(false);
  const [eventMarkupPercent, setEventMarkupPercent] = useState<number>(25);

  // Saved Quotations & Subview History
  const [savedQuotes, setSavedQuotes] = useState<any[]>([]);
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [showClientSearch, setShowClientSearch] = useState(false);
  const [activeSubView, setActiveSubView] = useState<"create" | "history">("create");
  const [historyTab, setHistoryTab] = useState<"follow_up" | "done" | "dispatch">("follow_up");
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState<string | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".status-dropdown-container")) {
        setOpenStatusDropdownId(null);
      }
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [selectedQuoteForPreview, setSelectedQuoteForPreview] = useState<any | null>(null);
  const [printQuoteData, setPrintQuoteData] = useState<any | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomMode, setZoomMode] = useState<"fit" | "full">("fit");

  // Barcode Scanner states
  const [barcodeQuery, setBarcodeQuery] = useState("");
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);
  const [barcodeFeedback, setBarcodeFeedback] = useState<{ text: string; isError: boolean; photoUrl?: string } | null>(null);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [cameras, setCameras] = useState<any[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number } | null>(null);
  const scannerRef = useRef<any>(null);
  const lastScannedRef = useRef<{ code: string; time: number } | null>(null);
  const lastNoQrTimeRef = useRef<number | null>(null);
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");
  const [mobileScale, setMobileScale] = useState(1);
  const [scaleMarginLeft, setScaleMarginLeft] = useState(0);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", confirmText: "", onConfirm: () => {} });

  // Derived unique clients for suggestions (Only from Client Directory)
  const uniqueClients = useMemo(() => {
    const clientsMap = new Map();
    clientsList.forEach(c => {
      if (c.name && !clientsMap.has(c.name.toLowerCase())) {
        clientsMap.set(c.name.toLowerCase(), {
          name: c.name,
          company: c.company || "",
          address: c.address || "",
          contact: c.contact || ""
        });
      }
    });
    return Array.from(clientsMap.values());
  }, [clientsList]);

  const filteredClientSuggestions = useMemo(() => {
    if (!clientSearchQuery) return [];
    const searchLower = clientSearchQuery.toLowerCase();
    return uniqueClients.filter(c => 
      (c.name?.toLowerCase() || "").includes(searchLower) || 
      (c.company?.toLowerCase() || "").includes(searchLower)
    );
  }, [clientSearchQuery, uniqueClients]);

  useEffect(() => {
    if (printQuoteData) {
      document.body.classList.add('is-printing-portal');
    } else {
      document.body.classList.remove('is-printing-portal');
    }
    return () => document.body.classList.remove('is-printing-portal');
  }, [printQuoteData]);

  // Listen to mobile camera scanner trigger event from DashboardNavbar
  useEffect(() => {
    const handleOpenScanner = () => {
      setMobileTab("form");
      setShowCameraScanner(true);
    };
    window.addEventListener("open-mobile-camera-scanner", handleOpenScanner);

    // If loaded via redirect with ?openScanner=true parameter
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("openScanner") === "true") {
        handleOpenScanner();
        // Clean URL parameter
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }

    return () => window.removeEventListener("open-mobile-camera-scanner", handleOpenScanner);
  }, []);

  useEffect(() => {
    if (selectedQuoteForPreview && zoomMode === "fit") {
      const updateScale = () => {
        const viewportHeight = window.innerHeight;
        const availableHeight = viewportHeight - 160;
        const sheetHeight = 1060;
        const newScale = Math.min(1, Math.max(0.4, availableHeight / sheetHeight));
        setZoomScale(newScale);
      };
      updateScale();
      window.addEventListener("resize", updateScale);
      return () => window.removeEventListener("resize", updateScale);
    } else {
      setZoomScale(1);
    }
  }, [selectedQuoteForPreview, zoomMode]);

  // Handle responsive scaling of the A4 print preview on mobile viewports
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const handleResize = () => {
      const parent = document.getElementById("mobile-preview-parent");
      if (parent) {
        const parentWidth = parent.getBoundingClientRect().width || 360;
        const targetWidth = 800; // Target width of the print preview page
        const isMobile = window.innerWidth < 1024;
        const availableWidth = isMobile ? parentWidth : parentWidth - 32;
        const scale = Math.min(1, Math.max(0.35, availableWidth / targetWidth));
        setMobileScale(scale);
        
        const scaledWidth = targetWidth * scale;
        const marginLeft = Math.max(0, (parentWidth - scaledWidth) / 2);
        setScaleMarginLeft(marginLeft);
      }
    };

    window.addEventListener("resize", handleResize);
    // Delay to let DOM elements render and resolve width
    const timer = setTimeout(handleResize, 150);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, [mobileTab]);

  const getNextQuoteNumber = (quotesList: any[]) => {
    let maxNum = 0;
    quotesList.forEach(q => {
      if (q.quoteNumber && typeof q.quoteNumber === "string") {
        const match = q.quoteNumber.match(/^Q-(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) {
            maxNum = num;
          }
        }
      }
    });
    return `Q-${maxNum + 1}`;
  };

  // Parse terms helper (Return empty list if user terms are empty, no dummy fallback!)
  const parseTerms = (termsStr: string) => {
    if (termsStr && termsStr.trim()) {
      return termsStr.split("\n").filter(line => line.trim().length > 0);
    }
    return [];
  };

  // Format date helper: YYYY-MM-DD -> DD/MM/YYYY
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const getItemRate = (rate: string) => {
    const numericRate = parseFloat(rate) || 0;
    if (applyEventMarkup) {
      const markupMultiplier = 1 + (eventMarkupPercent / 100);
      const markedUpPrice = numericRate * markupMultiplier;
      return Math.round(markedUpPrice).toString();
    }
    return rate;
  };

  const getSavedItemRate = (rate: string, applyMarkup?: boolean, markupPercent?: number) => {
    const numericRate = parseFloat(rate) || 0;
    if (applyMarkup) {
      const markupMultiplier = 1 + ((markupPercent ?? 25) / 100);
      const markedUpPrice = numericRate * markupMultiplier;
      return Math.round(markedUpPrice).toString();
    }
    return rate;
  };

  // HTML5 Barcode/QR Camera Scanner Effect
  useEffect(() => {
    let activeScanner: any = null;
    let isMounted = true;
    
    if (showCameraScanner && typeof window !== "undefined") {
      lastScannedRef.current = null;
      const startScanner = async () => {
        try {
          const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
          await new Promise(resolve => setTimeout(resolve, 300));
          if (!isMounted) return;
          
          const scannerContainer = document.getElementById("camera-scanner-reader");
          if (!scannerContainer) return;

          // If there is an existing scanner instance running, stop and clear it first
          if (scannerRef.current) {
            try {
              if (scannerRef.current.isScanning) {
                await scannerRef.current.stop();
              }
              scannerRef.current.clear();
            } catch (err) {
              console.warn("Failed to stop previous scanner instance:", err);
            }
          }

          const scannerInstance = new Html5Qrcode("camera-scanner-reader");
          activeScanner = scannerInstance;
          scannerRef.current = scannerInstance;
          
          // 1. Trigger camera permission to populate labels
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            stream.getTracks().forEach(track => track.stop());
          } catch (e) {
            console.warn("Camera permission prompt failed:", e);
          }

           // 2. Resolve camera list by identifying front cameras and pushing them to the end of the list
          let deviceList: any[] = [];
          try {
            const available = await Html5Qrcode.getCameras();
            if (available && available.length > 0) {
              const frontCameras = available.filter(c => {
                const label = c.label.toLowerCase();
                return label.includes("front") || 
                       label.includes("user") || 
                       label.includes("selfie") || 
                       label.includes("facetime") ||
                       label.includes("inner");
              });
              
              const nonFrontCameras = available.filter(c => !frontCameras.some(f => f.id === c.id));
              
              const mainBack = nonFrontCameras.filter(c => {
                const label = c.label.toLowerCase();
                return !label.includes("tele") && 
                       !label.includes("zoom") && 
                       !label.includes("ultra") && 
                       !label.includes("macro") &&
                       !label.includes("0.5") &&
                       !label.includes("0.6") &&
                       !label.includes("2x") &&
                       !label.includes("3x") &&
                       !label.includes("5x");
              });
              
              // Ordered list: mainBack first, then remaining non-front, and front cameras at the very bottom
              const orderedList: any[] = [];
              mainBack.forEach(c => orderedList.push(c));
              nonFrontCameras.forEach(c => {
                if (!orderedList.some(item => item.id === c.id)) {
                  orderedList.push(c);
                }
              });
              frontCameras.forEach(c => {
                if (!orderedList.some(item => item.id === c.id)) {
                  orderedList.push(c);
                }
              });
              
              deviceList = orderedList;
              setCameras(orderedList);
            }
          } catch (e) {
            console.warn("Failed to get cameras:", e);
          }

          // 3. Select camera based on current index (falls back to environment constraint only if list is empty)
          let activeCamera: any = { facingMode: "environment" };
          if (deviceList.length > 0) {
            const index = Math.min(currentCameraIndex, deviceList.length - 1);
            activeCamera = deviceList[index].id;
          }

          if (!isMounted) return;

          await scannerInstance.start(
            activeCamera,
            {
              fps: 30, // Max frame rate for speed
              aspectRatio: 1.777778, // Restore HD 16:9 aspect ratio for accurate coordinate mapping and scan success
              experimentalFeatures: {
                useBarCodeDetectorIfSupported: false // Disable to prevent silent failures on iOS Safari / iPhone devices
              },
              qrbox: (width: number, height: number) => {
                const size = Math.min(width, height) * 0.75;
                return { width: size, height: size };
              },
              videoConstraints: typeof activeCamera === "string" ? {
                deviceId: { exact: activeCamera },
                width: { ideal: 1280 },
                height: { ideal: 720 }
              } : {
                facingMode: { ideal: "environment" },
                width: { ideal: 1280 },
                height: { ideal: 720 }
              },
              formatsToSupport: [
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.QR_CODE,
                Html5QrcodeSupportedFormats.DATA_MATRIX
              ]
            } as any,
            (decodedText: string) => {
              const now = Date.now();
              lastNoQrTimeRef.current = null; // Reset error/no-QR timer on success
              if (lastScannedRef.current && lastScannedRef.current.code === decodedText) {
                return; // Ignore duplicate scans of the same code until it has left the frame
              }
              lastScannedRef.current = { code: decodedText, time: now };
              handleBarcodeSubmit(decodedText);
            },
            () => {
              // This is called on every frame where no barcode/QR is detected
              if (lastScannedRef.current) {
                if (!lastNoQrTimeRef.current) {
                  lastNoQrTimeRef.current = Date.now();
                } else if (Date.now() - lastNoQrTimeRef.current > 1200) {
                  // If no QR was found for 1.2 seconds, assume the user moved the camera away
                  lastScannedRef.current = null;
                  lastNoQrTimeRef.current = null;
                }
              }
            }
          );

          // Get capabilities and set zoom limits
          try {
            const capabilities = scannerInstance.getRunningTrackCapabilities() as any;
            if (capabilities && capabilities.zoom) {
              // Set default zoom to 1.0x to keep it normal and not zoomed in
              const defaultZoom = 1.0;
              setZoomLevel(defaultZoom);
              await scannerInstance.applyVideoConstraints({
                advanced: [{ zoom: defaultZoom } as any]
              });
            }
          } catch (e) {
            console.warn("Zoom capabilities not supported on this device:", e);
          }
        } catch (err) {
          console.error("Failed to start Html5Qrcode:", err);
        }
      };

      startScanner();
    }

    return () => {
      isMounted = false;
      // Stop and clear the camera scanner instance immediately on clean up
      if (activeScanner) {
        try {
          if (activeScanner.isScanning) {
            activeScanner.stop().then(() => {
              activeScanner.clear();
            }).catch((err: any) => console.warn("Failed to stop scanner on cleanup async:", err));
          } else {
            activeScanner.clear();
          }
        } catch (e) {
          console.warn("Cleanup stop error:", e);
        }
      } else if (scannerRef.current) {
        const refInstance = scannerRef.current;
        try {
          if (refInstance.isScanning) {
            refInstance.stop().then(() => {
              refInstance.clear();
            }).catch((err: any) => console.warn("Failed to stop scanner ref on cleanup:", err));
          } else {
            refInstance.clear();
          }
        } catch (e) {
          console.warn("Cleanup ref stop error:", e);
        }
      }
    };
  }, [showCameraScanner, currentCameraIndex]);

  // Load configuration and aggregates on mount
  useEffect(() => {
    async function loadData(userId: string) {
      try {
        const cacheKey = `quotation_data_${userId}`;
        const cachedData = getCache(cacheKey);
        
        if (cachedData) {
          setCollections(cachedData.collections);
          setProducts(cachedData.products);
          setSavedQuotes(cachedData.savedQuotes);
          if (cachedData.clientsList) setClientsList(cachedData.clientsList);
          setQuoteNumber(cachedData.quoteNumber);
        }

        // Fetch all data from Supabase concurrently for faster loading
        const [
          { data: colsData, error: colsErr },
          prodsData,
          { data: assignsData, error: assignsErr },
          { data: quotesData, error: quotesErr },
          { data: clientsData, error: clientsErr }
        ] = await Promise.all([
          supabase.from('collections').select('*').eq('user_id', userId),
          fetchAllProducts(userId),
          supabase.from('warehouse_assignments').select('*').eq('user_id', userId),
          supabase.from('quotations').select('id, quote_number, client_name, client_company, client_address, quote_date, tax_input, cash_amount, bank_amount, total_amount, apply_event_markup, event_markup_percent, created_at, is_order_done, staff_name, items').eq('user_id', userId).order('created_at', { ascending: false }),
          supabase.from('clients').select('*').eq('user_id', userId)
        ]);

        if (colsErr) throw colsErr;
        if (assignsErr) throw assignsErr;
        if (quotesErr) throw quotesErr;
        if (clientsErr) throw clientsErr;
        setClientsList(clientsData || []);

        setCollections(colsData || []);

        // Group and format assignments by product_id
        const assignsMap: Record<string, string[]> = {};
        if (assignsData) {
          assignsData.forEach((a: any) => {
            if (!a.product_id) return;
            if (!assignsMap[a.product_id]) {
              assignsMap[a.product_id] = [];
            }
            
            // Format location_key (e.g. "A-1-upper" -> "A-1 (U)")
            const parts = a.location_key.split('-');
            if (parts.length >= 3) {
              const row = parts[0];
              const slot = parts[1];
              const zone = parts[2];
              const zoneShort = zone.toLowerCase() === 'upper' ? 'U' : zone.toLowerCase() === 'lower' ? 'L' : zone;
              assignsMap[a.product_id].push(`${row}-${slot} (${zoneShort})`);
            } else {
              assignsMap[a.product_id].push(a.location_key);
            }
          });
        }

        const colsMap: Record<string, string> = {};
        if (colsData) {
          colsData.forEach((c: any) => {
            colsMap[c.id] = c.name;
          });
        }

        const mappedProds = (prodsData || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          stock: p.stock,
          cartonQty: p.cartonQty,
          rate: p.rate?.toString(),
          color: p.color,
          length: p.length?.toString(),
          photoUrl: p.photoUrl,
          collectionName: colsMap[p.collection_id] || '',
          collectionId: p.collection_id,
          description: p.description,
          location: assignsMap[p.id] ? assignsMap[p.id].join(', ') : ''
        }));
        setProducts(mappedProds);

        if (quotesData && quotesData.length > 0) {
          const parsedQuotes = quotesData.map((q: any) => {
            let addr = q.client_address || "";
            let validDate = "";
            let orderStatus = q.is_order_done ? "done" : "follow_up";
            let parsedOtherLabel = "";
            let parsedOtherAmount = "";
            
            if (addr.includes(" ||status:")) {
              const parts = addr.split(" ||status:");
              addr = parts[0];
              orderStatus = parts[1];
            }
            if (addr.includes(" ||validUntil:")) {
              const parts = addr.split(" ||validUntil:");
              addr = parts[0];
              validDate = parts[1];
            }
            if (addr.includes(" ||otherLabel:")) {
              const parts = addr.split(" ||otherLabel:");
              addr = parts[0];
              parsedOtherLabel = parts[1];
            }
            if (addr.includes(" ||otherAmount:")) {
              const parts = addr.split(" ||otherAmount:");
              addr = parts[0];
              parsedOtherAmount = parts[1];
            }
            return {
              id: q.id,
              quoteNumber: q.quote_number,
              clientName: q.client_name,
              clientCompany: q.client_company,
              clientAddress: addr,
              validUntil: validDate,
              orderStatus: orderStatus,
              quoteDate: q.quote_date,
              taxInput: q.tax_input || "",
              otherLabel: parsedOtherLabel,
              otherAmount: parsedOtherAmount,
              cashAmount: q.cash_amount?.toString() || "",
              bankAmount: q.bank_amount?.toString() || "",
              total: q.total_amount,
              applyEventMarkup: q.apply_event_markup,
              eventMarkupPercent: q.event_markup_percent,
              createdAt: q.created_at,
              isOrderDone: q.is_order_done || false,
              items: q.items ? (typeof q.items === 'string' ? JSON.parse(q.items) : q.items) : undefined,
              staffName: q.staff_name || ""
            };
          });
          setSavedQuotes(parsedQuotes);
          const nextNum = getNextQuoteNumber(parsedQuotes);
          setQuoteNumber(nextNum);
          
          const payload = {
            collections: colsData || [],
            products: mappedProds,
            savedQuotes: parsedQuotes,
            quoteNumber: nextNum,
            clientsList: clientsData || []
          };
          setCache(cacheKey, payload);
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(cacheKey, JSON.stringify(payload));
            } catch (e) {
              console.warn("Could not save to localStorage, quota exceeded.");
            }
          }
        } else {
          setQuoteNumber("Q-1");
          const payload = {
            collections: colsData || [],
            products: mappedProds,
            savedQuotes: [],
            quoteNumber: "Q-1",
            clientsList: clientsData || []
          };
          setCache(cacheKey, payload);
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(cacheKey, JSON.stringify(payload));
            } catch (e) {
              console.warn("Could not save to localStorage, quota exceeded.");
            }
          }
        }

      } catch (e: any) {
        console.error("Failed to load data from Supabase:", e?.message || e);
      }
    }

    // Fetch company info from profile settings
    if (typeof window !== "undefined") {
      const cachedUserId = localStorage.getItem("digiscale_cached_user_id");
      if (cachedUserId) {
        setCurrentUserId(cachedUserId);
        const cachedQuotes = localStorage.getItem(`quotation_data_${cachedUserId}`);
        if (cachedQuotes) {
          try {
            const parsed = JSON.parse(cachedQuotes);
            setCollections(parsed.collections);
            setProducts(parsed.products);
            setSavedQuotes(parsed.savedQuotes);
            setQuoteNumber(parsed.quoteNumber);
          } catch(e) {}
        }
      }

      const cachedProfile = localStorage.getItem("digiscale_profile");
      const cachedSettings = localStorage.getItem("digiscale_settings");
      if (cachedProfile && cachedSettings) {
        try {
          const profileData = JSON.parse(cachedProfile);
          const settingsData = JSON.parse(cachedSettings);
          
          const data = {
            logo: settingsData.company_logo,
            name: settingsData.company_name,
            email: settingsData.company_email,
            primaryPhone: settingsData.company_primary_phone,
            secondaryPhone: settingsData.company_secondary_phone,
            address: settingsData.company_address,
            website: settingsData.company_website,
            gst: settingsData.company_gst,
            bankName: settingsData.company_bank_name,
            accountNumber: settingsData.company_account_number,
            ifsc: settingsData.company_ifsc,
            termsAndConditions: settingsData.company_terms,
          };
          
          setCompanyInfo(data);
          setShowBankDetails(!!(data.bankName || data.accountNumber));
          setTermsList(parseTerms(data.termsAndConditions || ""));
          setLoadingProfile(false);
        } catch(e) {}
      }
    }

    Promise.all([getUserProfile(), getUserSettings()])
        .then(([profile, settingsData]) => {
          if (profile && profile.id) {
            const uId = (profile.role === "Staff" && profile.admin_id) ? profile.admin_id.toString() : profile.id.toString();
            setCurrentUserId(uId);
            loadData(uId);

          const data = {
            logo: settingsData.company_logo,
            name: settingsData.company_name,
            email: settingsData.company_email,
            primaryPhone: settingsData.company_primary_phone,
            secondaryPhone: settingsData.company_secondary_phone,
            address: settingsData.company_address,
            website: settingsData.company_website,
            gst: settingsData.company_gst,
            bankName: settingsData.company_bank_name,
            accountNumber: settingsData.company_account_number,
            ifsc: settingsData.company_ifsc,
            upiId: settingsData.company_upi_id,
            qrCode: settingsData.company_qr_code,
            termsAndConditions: settingsData.company_terms,
          };
          
          setCompanyInfo(data);
          setShowBankDetails(!!(data.bankName || data.accountNumber));
          setTermsList(parseTerms(data.termsAndConditions || ""));
        }
        setLoadingProfile(false);
      })
      .catch(() => {
        setTermsList(parseTerms(""));
        setLoadingProfile(false);
      });

    // Fetch saved quotations history
    if (typeof window !== "undefined") {
      const storedApplyEvent = localStorage.getItem("digiscale_apply_event_markup");
      if (storedApplyEvent) {
        setApplyEventMarkup(storedApplyEvent === "true");
      }
      const storedEventPercent = localStorage.getItem("digiscale_event_markup_percent");
      if (storedEventPercent) {
        setEventMarkupPercent(parseFloat(storedEventPercent) || 25);
      }
    }
  }, []);

  // Warning prompt before leaving or reloading the page with unsaved items
  useEffect(() => {
    // 1. Handle browser tab close or reload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isLeavingRef.current) return;
      if (activeSubView === "create" && selectedItems.length > 0) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    // 2. Handle routing inside SPA by intercepting clicks on nav links
    const handleAnchorClick = (e: MouseEvent) => {
      if (activeSubView !== "create" || selectedItems.length === 0) return;

      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (anchor && anchor.href) {
        try {
          const targetUrl = new URL(anchor.href, window.location.href);
          // Check if navigating to a different path inside our app
          if (
            targetUrl.origin === window.location.origin && 
            targetUrl.pathname !== window.location.pathname
          ) {
            e.preventDefault();
            e.stopPropagation();
            setPendingNavigationUrl(anchor.href);
            setPendingAction("navigate");
            setShowLeaveModal(true);
          }
        } catch (err) {
          console.warn("Error parsing anchor URL:", err);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleAnchorClick, true); // Intercept during capture phase

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleAnchorClick, true);
    };
  }, [selectedItems, lang, activeSubView]);

  // Realtime sync: auto-refresh quotation data when changes happen from another device/user
  useEffect(() => {
    if (!currentUserId) return;

    const refreshQuotationData = async () => {
      try {
        const userId = currentUserId;
        const [
          { data: colsData },
          prodsData,
          { data: assignsData },
          { data: quotesData },
          { data: clientsData }
        ] = await Promise.all([
          supabase.from('collections').select('*').eq('user_id', userId),
          fetchAllProducts(userId),
          supabase.from('warehouse_assignments').select('*').eq('user_id', userId),
          supabase.from('quotations').select('id, quote_number, client_name, client_company, client_address, quote_date, tax_input, cash_amount, bank_amount, total_amount, apply_event_markup, event_markup_percent, created_at, is_order_done, staff_name, items').eq('user_id', userId).order('created_at', { ascending: false }),
          supabase.from('clients').select('*').eq('user_id', userId)
        ]);

        setClientsList(clientsData || []);
        setCollections(colsData || []);

        const assignsMap: Record<string, string[]> = {};
        if (assignsData) {
          assignsData.forEach((a: any) => {
            if (!a.product_id) return;
            if (!assignsMap[a.product_id]) assignsMap[a.product_id] = [];
            const parts = a.location_key.split('-');
            if (parts.length >= 3) {
              const zoneShort = parts[2].toLowerCase() === 'upper' ? 'U' : parts[2].toLowerCase() === 'lower' ? 'L' : parts[2];
              assignsMap[a.product_id].push(`${parts[0]}-${parts[1]} (${zoneShort})`);
            } else {
              assignsMap[a.product_id].push(a.location_key);
            }
          });
        }

        const colsMap: Record<string, string> = {};
        if (colsData) colsData.forEach((c: any) => { colsMap[c.id] = c.name; });

        const mappedProds = (prodsData || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          stock: p.stock,
          cartonQty: p.cartonQty,
          rate: p.rate?.toString(),
          color: p.color,
          length: p.length?.toString(),
          photoUrl: p.photoUrl,
          collectionName: colsMap[p.collection_id] || '',
          collectionId: p.collection_id,
          description: p.description,
          location: assignsMap[p.id] ? assignsMap[p.id].join(', ') : ''
        }));
        setProducts(mappedProds);

        if (quotesData && quotesData.length > 0) {
          const parsedQuotes = quotesData.map((q: any) => {
            let addr = q.client_address || "";
            let validDate = "";
            let orderStatus = q.is_order_done ? "done" : "follow_up";
            let parsedOtherLabel2 = "";
            let parsedOtherAmount2 = "";
            if (addr.includes(" ||status:")) { const parts = addr.split(" ||status:"); addr = parts[0]; orderStatus = parts[1]; }
            if (addr.includes(" ||validUntil:")) { const parts = addr.split(" ||validUntil:"); addr = parts[0]; validDate = parts[1]; }
            if (addr.includes(" ||otherLabel:")) { const parts = addr.split(" ||otherLabel:"); addr = parts[0]; parsedOtherLabel2 = parts[1]; }
            if (addr.includes(" ||otherAmount:")) { const parts = addr.split(" ||otherAmount:"); addr = parts[0]; parsedOtherAmount2 = parts[1]; }
            return {
              id: q.id, quoteNumber: q.quote_number, clientName: q.client_name, clientCompany: q.client_company,
              clientAddress: addr, validUntil: validDate, orderStatus, quoteDate: q.quote_date,
              taxInput: q.tax_input || "", otherLabel: parsedOtherLabel2, otherAmount: parsedOtherAmount2, cashAmount: q.cash_amount?.toString() || "", bankAmount: q.bank_amount?.toString() || "",
              total: q.total_amount, applyEventMarkup: q.apply_event_markup, eventMarkupPercent: q.event_markup_percent,
              createdAt: q.created_at, isOrderDone: q.is_order_done || false,
              items: q.items ? (typeof q.items === 'string' ? JSON.parse(q.items) : q.items) : undefined,
              staffName: q.staff_name || ""
            };
          });
          setSavedQuotes(parsedQuotes);
        }
      } catch (e) {
        console.error("Realtime refresh failed:", e);
      }
    };

    const channel = supabase
      .channel('realtime-quotation-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotations' }, () => refreshQuotationData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clients' }, () => refreshQuotationData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => refreshQuotationData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_settings' }, async () => {
        // Refresh company info
        try {
          const settingsData = await getUserSettings(true);
          if (settingsData) {
            setCompanyInfo({
              logo: settingsData.company_logo, name: settingsData.company_name, email: settingsData.company_email,
              primaryPhone: settingsData.company_primary_phone, secondaryPhone: settingsData.company_secondary_phone,
              address: settingsData.company_address, website: settingsData.company_website, gst: settingsData.company_gst,
              bankName: settingsData.company_bank_name, accountNumber: settingsData.company_account_number,
              ifsc: settingsData.company_ifsc, upiId: settingsData.company_upi_id, qrCode: settingsData.company_qr_code,
              termsAndConditions: settingsData.company_terms,
            });
          }
        } catch (e) {}
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const handleSaveQuotation = async () => {
    if (permission !== "edit") return;
    if (selectedItems.length === 0) return;
    if (!currentUserId) {
      alert("User session not found. Please log in again.");
      return;
    }
    
    setIsSaving(true);
    const defaultQuoteNum = getNextQuoteNumber(savedQuotes);
    const finalQuoteNumber = quoteNumber.trim() || defaultQuoteNum;

    let idToUpdate = currentQuoteId;
    if (!idToUpdate) {
      const existing = savedQuotes.find(q => q.quoteNumber === finalQuoteNumber);
      idToUpdate = existing ? existing.id : Date.now().toString();
      setCurrentQuoteId(idToUpdate);
    }

    const newQuote = {
      id: idToUpdate,
      quoteNumber: finalQuoteNumber,
      clientName,
      clientCompany,
      clientAddress,
      validUntil,
      quoteDate,
      items: selectedItems,
      taxInput,
      otherLabel,
      otherAmount,
      cashAmount,
      bankAmount,
      total,
      applyEventMarkup,
      eventMarkupPercent,
      isOrderDone: false, // Default for new, will be overwritten if existing
      createdAt: new Date().toISOString()
    };

    let updatedQuotes = [];
    const existingIndex = savedQuotes.findIndex(q => q.id === idToUpdate);

    if (existingIndex > -1) {
      updatedQuotes = [...savedQuotes];
      newQuote.isOrderDone = savedQuotes[existingIndex].isOrderDone;
      updatedQuotes[existingIndex] = { ...savedQuotes[existingIndex], ...newQuote };
    } else {
      updatedQuotes = [newQuote, ...savedQuotes];
    }

    try {
      const { error } = await supabase.from('quotations').upsert({
        id: idToUpdate,
        quote_number: finalQuoteNumber,
        client_name: clientName,
        client_company: clientCompany,
        client_address: clientAddress + (validUntil ? ` ||validUntil:${validUntil}` : "") + (otherLabel ? ` ||otherLabel:${otherLabel}` : "") + (otherAmount ? ` ||otherAmount:${otherAmount}` : ""),
        quote_date: quoteDate,
        tax_input: taxInput,
        cash_amount: cashAmount ? parseFloat(cashAmount) : 0,
        bank_amount: bankAmount ? parseFloat(bankAmount) : 0,
        total_amount: total,
        apply_event_markup: applyEventMarkup,
        event_markup_percent: eventMarkupPercent,
        items: selectedItems,
        user_id: parseInt(currentUserId),
        created_at: existingIndex > -1 ? savedQuotes[existingIndex].createdAt : new Date().toISOString(),
        staff_name: existingIndex > -1
          ? (savedQuotes[existingIndex].staffName || localStorage.getItem("user_name") || "Admin")
          : (localStorage.getItem("user_name") || "Admin")
      }, { onConflict: 'id' });

      
      if (error) throw error;

      if (clientName) {
        const existingClient = clientsList.find(c => c.name.toLowerCase() === clientName.toLowerCase());
        if (!existingClient) {
          const newClient = {
            name: clientName,
            company: clientCompany || null,
            address: clientAddress || null,
            contact: clientContact || null,
            user_id: currentUserId
          };
          const { data: insertedClient, error: clientError } = await supabase
            .from('clients')
            .insert([newClient])
            .select()
            .single();
          if (!clientError && insertedClient) {
            setClientsList([...clientsList, insertedClient]);
          }
        } else {
          // If details changed, update the client
          const hasChanged = 
            existingClient.company !== (clientCompany || null) ||
            existingClient.address !== (clientAddress || null) ||
            existingClient.contact !== (clientContact || null);
          
          if (hasChanged) {
            const updatedClient = {
              ...existingClient,
              company: clientCompany || null,
              address: clientAddress || null,
              contact: clientContact || null
            };
            const { error: clientError } = await supabase
              .from('clients')
              .update({
                company: clientCompany || null,
                address: clientAddress || null,
                contact: clientContact || null
              })
              .eq('id', existingClient.id);
            if (!clientError) {
              setClientsList(clientsList.map(c => c.id === existingClient.id ? updatedClient : c));
            }
          }
        }
      }

      setSavedQuotes(updatedQuotes);
      
      if (redirectAfterSaveRef.current) {
        isLeavingRef.current = true;
        
        // Clear the form fields for next use
        setClientName("");
        setClientCompany("");
        setClientAddress("");
        setClientContact("");
        setSelectedItems([]);
        setTaxInput("");
        setAdditionalNotes("");
        setCashAmount("");
        setBankAmount("");
        
        window.location.href = redirectAfterSaveRef.current;
        redirectAfterSaveRef.current = null;
        return;
      }

      if (existingIndex > -1) {
        setSaveSuccessMessage("Quotation updated successfully in database!");
      } else {
        setSaveSuccessMessage("Quotation saved successfully to database!");
      }
      setShowSavePopup(true);
    } catch (err) {
      console.error("Failed to save quotation:", err);
      alert("Failed to save quotation to database.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveSuccessMessage(null), 3000);
    }
  };

  const fetchQuoteItems = async (quoteId: string) => {
    const { data } = await supabase.from('quotations').select('items').eq('id', quoteId).single();
    if (data?.items) {
      return typeof data.items === 'string' ? JSON.parse(data.items) : data.items;
    }
    return [];
  };

  const handleLoadQuote = async (quote: any) => {
    let itemsToLoad = quote.items;
    if (!itemsToLoad) {
      itemsToLoad = await fetchQuoteItems(quote.id);
      quote.items = itemsToLoad;
    }
    setQuoteNumber(quote.quoteNumber || "");
    setClientName(quote.clientName || "");
    setClientCompany(quote.clientCompany || "");
    setClientAddress(quote.clientAddress || "");
    setQuoteDate(quote.quoteDate || "");
    setSelectedItems(itemsToLoad || []);
    setTaxInput(quote.taxInput || "");
    setOtherLabel(quote.otherLabel || "");
    setOtherAmount(quote.otherAmount || "");
    setCashAmount(quote.cashAmount || "");
    setBankAmount(quote.bankAmount || "");
    setApplyEventMarkup(quote.applyEventMarkup || false);
    setEventMarkupPercent(quote.eventMarkupPercent ?? 25);
    setCurrentQuoteId(quote.id);
    
    // Auto lookup and sync client contact details from database
    const matchedClient = clientsList.find(c => c.name.toLowerCase() === (quote.clientName || "").toLowerCase());
    if (matchedClient) {
      setClientContact(matchedClient.contact || "");
    } else {
      setClientContact("");
    }

    setActiveSubView("create");
  };

  const executeCreateNew = () => {
    setQuoteNumber(getNextQuoteNumber(savedQuotes));
    setClientName("");
    setClientCompany("");
    setClientAddress("");
    setClientContact("");
    setQuoteDate(() => getLocalDateString());
    setSelectedItems([]);
    setTaxInput("");
    setOtherLabel("");
    setOtherAmount("");
    setCashAmount("");
    setBankAmount("");
    setApplyEventMarkup(false);
    setEventMarkupPercent(25);
    setCurrentQuoteId(null);
    setActiveSubView("create");
  };

  const handleConfirmLeave = () => {
    setShowLeaveModal(false);
    if (pendingAction === "navigate" && pendingNavigationUrl) {
      isLeavingRef.current = true;
      setSelectedItems([]);
      window.location.href = pendingNavigationUrl;
    } else if (pendingAction === "reset") {
      executeCreateNew();
    } else if (pendingAction === "go_history") {
      setActiveSubView("history");
    }
    setPendingAction(null);
    setPendingNavigationUrl(null);
  };

  const handleSaveAndExit = () => {
    setShowLeaveModal(false);
    if (pendingAction === "go_history") {
      // Save and then switch to history view
      redirectAfterSaveRef.current = null;
      handleSaveQuotation().then(() => {
        setActiveSubView("history");
      });
    } else {
      redirectAfterSaveRef.current = pendingNavigationUrl || "/projects";
      handleSaveQuotation();
    }
  };

  const handleCreateNew = () => {
    if (activeSubView === "create" && selectedItems.length > 0) {
      setPendingAction("reset");
      setShowLeaveModal(true);
    } else {
      executeCreateNew();
    }
  };

  const handleUpdateOrderStatus = async (id: string, newStatus: string) => {
    const quote = savedQuotes.find(q => q.id === id);
    if (!quote) return;

    const oldStatus = quote.orderStatus || (quote.isOrderDone ? "done" : "follow_up");
    if (oldStatus === newStatus) return;

    // Stock is deducted if status is 'done' or 'dispatch'
    const wasDeducted = (oldStatus === "done" || oldStatus === "dispatch");
    const shouldBeDeducted = (newStatus === "done" || newStatus === "dispatch");

    let actionStr = "";
    if (newStatus === "done") actionStr = "Done";
    else if (newStatus === "dispatch") actionStr = "Dispatch";
    else actionStr = "Follow Up";

    setConfirmModal({
      isOpen: true,
      title: `Change Status to ${actionStr}`,
      message: `Are you sure you want to change this order status to ${actionStr}?`,
      confirmText: "Change",
      isDanger: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          // Parse client address and inject/update status metadata
          let originalAddr = quote.clientAddress || "";
          let validPart = quote.validUntil ? ` ||validUntil:${quote.validUntil}` : "";
          let newClientAddressWithStatus = originalAddr + validPart + ` ||status:${newStatus}`;

          const { error } = await supabase
            .from('quotations')
            .update({
              is_order_done: shouldBeDeducted, // Keep is_order_done aligned for legacy and DB constraint
              client_address: newClientAddressWithStatus
            })
            .eq('id', id);

          if (error) throw error;

          // Adjust stocks if we transitioned across the deduction boundary
          let itemsForDeduction = quote.items;
          if (!itemsForDeduction || itemsForDeduction.length === 0) {
            // Items may not be loaded in local state — fetch from DB
            const { data: qData } = await supabase
              .from('quotations')
              .select('items')
              .eq('id', id)
              .single();
            if (qData?.items) {
              itemsForDeduction = typeof qData.items === 'string' ? JSON.parse(qData.items) : qData.items;
            }
          }

          if (wasDeducted !== shouldBeDeducted && itemsForDeduction && itemsForDeduction.length > 0) {
            const isRevert = wasDeducted && !shouldBeDeducted; // transitioning back to follow_up (revert stock)
            
            await Promise.all(itemsForDeduction.map(async (item: any) => {
              // 1. Fetch current stock from Supabase
              const { data: prodData } = await supabase
                .from('products')
                .select('stock, name')
                .eq('id', item.id)
                .single();
              
              const currentStock = prodData ? prodData.stock : 0;
              const productName = prodData ? prodData.name : item.name;
              
              // If it's a revert, we add back (+ cartons). If it's a new deduction, we subtract (- cartons).
              const change = isRevert ? item.cartons : -item.cartons;
              const newStock = currentStock + change;

              // 2. Update stock in DB
              await supabase
                .from('products')
                .update({ stock: newStock })
                .eq('id', item.id);

              // 3. Log stock entry
              await supabase.from('stock_entries').insert([{
                user_id: parseInt(currentUserId || "0") || 0,
                product_id: item.id,
                product_name: productName,
                quantity_changed: change,
                transaction_type: isRevert ? 'return' : 'sale',
                reference_id: id,
                reference_type: 'quotation',
                description: isRevert 
                  ? `Reverted/Returned from Bill #${quote.quoteNumber}` 
                  : `Sold via Bill #${quote.quoteNumber}`
              }]);
            }));

            // 4. Update local products state
            setProducts(prev => prev.map(p => {
              const item = itemsForDeduction.find((i: any) => i.id === p.id);
              if (item) {
                const change = isRevert ? item.cartons : -item.cartons;
                return { ...p, stock: p.stock + change };
              }
              return p;
            }));
          }

          // 5. Update local savedQuotes state
          setSavedQuotes(prev => prev.map(q => 
            q.id === id 
              ? { ...q, orderStatus: newStatus, isOrderDone: shouldBeDeducted, clientAddress: originalAddr } 
              : q
          ));
        } catch (err) {
          console.error("Failed to update order status:", err);
          alert("Failed to update order status in database.");
        }
      }
    });
  };

  const handleDeleteQuote = async (id: string) => {
    if (permission !== "edit") return;
    setConfirmModal({
      isOpen: true,
      title: "Delete Quotation",
      message: "Are you sure you want to delete this quotation from the database? This action cannot be undone.",
      confirmText: "Delete",
      isDanger: true,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const quote = savedQuotes.find(q => q.id === id);
          
          const { error } = await supabase.from('quotations').delete().eq('id', id);
          if (error) throw error;

          // If the deleted quotation was active/done, restore its stock
          if (quote && quote.isOrderDone) {
            let itemsToRevert = quote.items;
            if (!itemsToRevert || itemsToRevert.length === 0) {
              const { data: qData } = await supabase
                .from('quotations')
                .select('items')
                .eq('id', id)
                .single();
              if (qData?.items) {
                itemsToRevert = typeof qData.items === 'string' ? JSON.parse(qData.items) : qData.items;
              }
            }

            if (itemsToRevert && itemsToRevert.length > 0) {
              await Promise.all(itemsToRevert.map(async (item: any) => {
                // 1. Fetch current stock
                const { data: prodData } = await supabase
                  .from('products')
                  .select('stock, name')
                  .eq('id', item.id)
                  .single();
                
                const currentStock = prodData ? prodData.stock : 0;
                const productName = prodData ? prodData.name : item.name;
                const change = item.cartons; // Revert (+) stock
                const newStock = currentStock + change;

                // 2. Update stock in DB
                await supabase
                  .from('products')
                  .update({ stock: newStock })
                  .eq('id', item.id);

                // 3. Log stock entry
                await supabase.from('stock_entries').insert([{
                  user_id: parseInt(currentUserId || "0") || 0,
                  product_id: item.id,
                  product_name: productName,
                  quantity_changed: change,
                  transaction_type: 'return',
                  reference_id: id,
                  reference_type: 'quotation',
                  description: `Returned/Reverted due to deletion of Bill #${quote.quoteNumber}`
                }]);
              }));

              // 4. Update local products state
              setProducts(prev => prev.map(p => {
                const item = itemsToRevert.find((i: any) => i.id === p.id);
                if (item) {
                  return { ...p, stock: p.stock + item.cartons };
                }
                return p;
              }));
            }
          }

          const updated = savedQuotes.filter(q => q.id !== id);
          setSavedQuotes(updated);
        } catch (err) {
          console.error("Failed to delete quote:", err);
          alert("Failed to delete quotation from database.");
        }
      }
    });
  };

  const executePrint = async (quoteData: any) => {
    const items = [...(quoteData.items || [])];
    
    // Fetch missing photoUrls to ensure they are available synchronously when window.print() is called
    await Promise.all(items.map(async (item) => {
      if (!item.photoUrl) {
        try {
          const { data } = await supabase.from('products').select('photoUrl').eq('id', item.id).single();
          if (data?.photoUrl) {
            item.photoUrl = data.photoUrl;
          }
        } catch (e) {
          console.error("Failed to fetch photo for print:", item.id);
        }
      }
    }));
    
    setPrintQuoteData({ ...quoteData, items });
    
    // Set document title so PDF save dialog suggests this filename
    const originalTitle = document.title;
    const qName = quoteData.quoteNumber || quoteData.quote_number;
    const cName = quoteData.clientName || quoteData.client_name;
    
    if (qName) {
      document.title = cName ? `${qName} - ${cName}` : qName;
    }
    
    // Wait for the DOM to paint the images before triggering the blocking print dialog
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
      setTimeout(() => setPrintQuoteData(null), 200);
    }, 500);
  };

  const handlePrintQuoteDirect = async (quote: any) => {
    let itemsToLoad = quote.items;
    if (!itemsToLoad) {
      itemsToLoad = await fetchQuoteItems(quote.id);
      quote.items = itemsToLoad;
    }
    await executePrint({ ...quote, items: itemsToLoad });
  };

  const getQuoteDataForAction = async (quote: any) => {
    if (quote && (quote.id || quote.quote_number || quote.quoteNumber)) {
      let itemsToLoad = quote.items;
      if (!itemsToLoad) {
        itemsToLoad = await fetchQuoteItems(quote.id);
      }
      
      const productIds = (itemsToLoad || []).map((it: any) => it.id).filter(Boolean);
      if (productIds.length > 0) {
        const { data: prodsData } = await supabase
          .from("products")
          .select("id, photoUrl")
          .in("id", productIds);
        
        if (prodsData) {
          itemsToLoad = itemsToLoad.map((it: any) => {
            const match = prodsData.find((p: any) => p.id === it.id);
            return {
              ...it,
              photoUrl: match?.photoUrl || it.photoUrl
            };
          });
        }
      }

      return {
        id: quote.id,
        quoteNumber: quote.quoteNumber || quote.quote_number,
        clientName: quote.clientName || quote.client_name,
        clientCompany: quote.clientCompany || quote.client_company,
        clientAddress: quote.clientAddress || quote.client_address,
        clientContact: quote.clientContact || quote.client_contact,
        quoteDate: quote.quoteDate || quote.quote_date,
        validUntil: quote.validUntil || "",
        items: itemsToLoad,
        taxInput: quote.taxInput || quote.tax_input || "",
        otherLabel: quote.otherLabel || "",
        otherAmount: quote.otherAmount?.toString() || "",
        cashAmount: quote.cashAmount?.toString() || quote.cash_amount?.toString() || "",
        bankAmount: quote.bankAmount?.toString() || quote.bank_amount?.toString() || "",
        total: quote.total || quote.total_amount || 0,
        applyEventMarkup: quote.applyEventMarkup || quote.apply_event_markup || false,
        eventMarkupPercent: quote.eventMarkupPercent ?? quote.event_markup_percent ?? 25,
        staffName: quote.staffName || quote.staff_name || "Admin"
      };
    } else {
      return {
        id: Date.now().toString(),
        quoteNumber: quoteNumber || getNextQuoteNumber(savedQuotes),
        clientName,
        clientCompany,
        clientAddress,
        clientContact,
        quoteDate,
        validUntil,
        items: selectedItems,
        taxInput,
        otherLabel,
        otherAmount,
        cashAmount,
        bankAmount,
        total,
        applyEventMarkup,
        eventMarkupPercent,
        staffName: localStorage.getItem("user_name") || "Admin"
      };
    }
  };

  const generateInvoicePdfDoc = async (quote: any) => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 30;

    let currentY = 45;

    // 1. Draw Top Color Stripe (Premium aesthetics)
    doc.setFillColor(37, 99, 235);
    doc.rect(margin, currentY, pageWidth - 2 * margin, 6, "F");
    currentY += 6;

    // 2. Company Details box
    doc.setFillColor(250, 250, 250);
    doc.rect(margin, currentY, pageWidth - 2 * margin, 74, "F");
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(1);
    doc.rect(margin, currentY, pageWidth - 2 * margin, 74, "S");

    const compName = companyInfo?.name || "LIFO | ARTIFICIAL FLOWERS";
    const compAddress = companyInfo?.address || "SURAT, GUJARAT";
    const compPhone = companyInfo?.primaryPhone ? `${companyInfo.primaryPhone} ${companyInfo.secondaryPhone ? '/ ' + companyInfo.secondaryPhone : ''}` : "+91 90998 86609";
    const compEmail = companyInfo?.email || "hello.lifo@gmail.com";
    const compGst = companyInfo?.gst ? `GSTIN: ${companyInfo.gst}` : "";

    let logoXOffset = margin + 15;
    if (companyInfo?.logo) {
      try {
        doc.addImage(companyInfo.logo, "PNG", margin + 15, currentY + 10, 54, 54);
        logoXOffset = margin + 85;
      } catch (e) {
        console.warn("Failed company logo print in PDF:", e);
      }
    }

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(compName, logoXOffset, currentY + 24);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(compAddress, logoXOffset, currentY + 38, { maxWidth: 250 });
    
    doc.setFont("helvetica", "bold");
    doc.text(`Mobile: ${compPhone}`, 380, currentY + 24);
    doc.setFont("helvetica", "normal");
    doc.text(`Email: ${compEmail}`, 380, currentY + 38);
    if (compGst) {
      doc.setFont("helvetica", "bold");
      doc.text(compGst, 380, currentY + 52);
    }

    currentY += 90;

    // 3. Billing & Quotation Info Blocks
    const colWidth = (pageWidth - 2 * margin - 16) / 2;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, currentY, colWidth, 90, "S");

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, currentY, colWidth, 20, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(lang === "gu" ? "ગ્રાહક વિગતો" : lang === "hi" ? "ग्राहक विवरण" : "BILLING DETAILS", margin + 10, currentY + 14);

    const cName = quote.clientName || "—";
    const cCompany = quote.clientCompany || "—";
    const cAddress = quote.clientAddress || "—";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(cName, margin + 10, currentY + 36);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(cCompany, margin + 10, currentY + 50);
    doc.text(cAddress, margin + 10, currentY + 64, { maxWidth: colWidth - 20 });

    const rightColX = margin + colWidth + 16;
    doc.rect(rightColX, currentY, colWidth, 90, "S");

    doc.setFillColor(241, 245, 249);
    doc.rect(rightColX, currentY, colWidth, 20, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(lang === "gu" ? "કોટેશન માહિતી" : lang === "hi" ? "कोटेशन जानकारी" : "QUOTATION INFO", rightColX + 10, currentY + 14);

    const qNum = quote.quoteNumber || "—";
    const qDate = quote.quoteDate || "—";
    const qValid = quote.validUntil || "—";
    const qStaff = quote.staffName || "Admin";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Quote Ref: ${qNum}`, rightColX + 10, currentY + 36);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${qDate}`, rightColX + 10, currentY + 50);
    doc.text(`Valid Until: ${qValid}`, rightColX + 10, currentY + 64);
    doc.text(`Created By: ${qStaff}`, rightColX + 10, currentY + 78);

    currentY += 105;

    // 4. Table of Items
    const drawTableHeader = (y: number) => {
      doc.setFillColor(15, 23, 42);
      doc.rect(margin, y, pageWidth - 2 * margin, 22, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);

      doc.text("SR.", margin + 10, y + 14, { align: "center" });
      doc.text("PRODUCT DETAILS", margin + 35, y + 14);
      doc.text("CTNS", margin + 310, y + 14, { align: "center" });
      doc.text("QTY", margin + 360, y + 14, { align: "center" });
      doc.text("PRICE", margin + 430, y + 14, { align: "right" });
      doc.text("TOTAL", margin + 520, y + 14, { align: "right" });
    };

    drawTableHeader(currentY);
    currentY += 22;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);

    const itemsListToDraw = quote.items || [];
    for (let i = 0; i < itemsListToDraw.length; i++) {
      const item = itemsListToDraw[i];
      const rowHeight = 44;

      if (currentY + rowHeight > pageHeight - 110) {
        doc.addPage();
        currentY = 40;
        drawTableHeader(currentY);
        currentY += 22;
      }

      if (i % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, currentY, pageWidth - 2 * margin, rowHeight, "F");
      }

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, currentY + rowHeight, pageWidth - margin, currentY + rowHeight);

      doc.setFont("helvetica", "bold");
      doc.text((i + 1).toString(), margin + 10, currentY + 25, { align: "center" });

      let textXOffset = margin + 35;
      
      let photoSrc = item.photoUrl;
      if (!photoSrc) {
        const localProd = products.find(p => p.id === item.id || p.name === item.name);
        if (localProd?.photoUrl) photoSrc = localProd.photoUrl;
      }

      if (photoSrc) {
        try {
          doc.addImage(photoSrc, "JPEG", margin + 25, currentY + 5, 34, 34);
          textXOffset = margin + 68;
        } catch (e) {
          console.warn("Failed drawing Row Product Image:", e);
        }
      }

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(item.name || "—", textXOffset, currentY + 16);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(item.description || "—", textXOffset, currentY + 28, { maxWidth: 220 });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);

      const ctns = item.cartons || 0;
      const qty = item.quantity || 0;
      const rate = parseFloat(getSavedItemRate(item.rate || "0", quote.applyEventMarkup, quote.eventMarkupPercent)) || 0;
      const rowTotal = qty * rate;

      doc.text(ctns.toString(), margin + 310, currentY + 25, { align: "center" });
      doc.text(qty.toString(), margin + 360, currentY + 25, { align: "center" });
      doc.text(`Rs. ${rate.toFixed(2)}`, margin + 430, currentY + 25, { align: "right" });
      doc.text(`Rs. ${rowTotal.toLocaleString("en-IN")}`, margin + 520, currentY + 25, { align: "right" });

      currentY += rowHeight;
    }

    if (currentY + 130 > pageHeight - 50) {
      doc.addPage();
      currentY = 40;
    }

    currentY += 15;

    const subTotal = itemsListToDraw.reduce((sum: number, item: any) => {
      const itemRate = parseFloat(getSavedItemRate(item.rate || "0", quote.applyEventMarkup, quote.eventMarkupPercent)) || 0;
      const itemQty = item.quantity || 0;
      return sum + (itemQty * itemRate);
    }, 0);
    const taxPercent = parseFloat(quote.taxInput || "0");
    const taxAmount = (subTotal * taxPercent) / 100;
    const grandTotal = quote.total || (subTotal + taxAmount);

    const totalBoxWidth = 200;
    const totalBoxX = pageWidth - margin - totalBoxWidth;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    
    doc.text("Sub Total:", totalBoxX, currentY);
    doc.setFont("helvetica", "bold");
    doc.text(`Rs. ${subTotal.toLocaleString("en-IN")}`, pageWidth - margin, currentY, { align: "right" });

    currentY += 15;
    doc.setFont("helvetica", "normal");
    doc.text(`GST (${taxPercent}%):`, totalBoxX, currentY);
    doc.setFont("helvetica", "bold");
    doc.text(`Rs. ${taxAmount.toLocaleString("en-IN")}`, pageWidth - margin, currentY, { align: "right" });

    currentY += 20;
    doc.setFillColor(30, 41, 59);
    doc.rect(totalBoxX - 10, currentY - 12, totalBoxWidth + 10, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Grand Total:", totalBoxX, currentY + 2);
    doc.text(`Rs. ${grandTotal.toLocaleString("en-IN")}`, pageWidth - margin, currentY + 2, { align: "right" });

    let leftInfoY = currentY - 30;
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    if (companyInfo?.bankName && showBankDetails) {
      doc.text("BANK DETAILS:", margin, leftInfoY);
      doc.setFont("helvetica", "normal");
      doc.text(`Bank: ${companyInfo.bankName}`, margin, leftInfoY + 11);
      doc.text(`Account No: ${companyInfo.accountNumber}`, margin, leftInfoY + 21);
      doc.text(`IFSC: ${companyInfo.ifsc}`, margin, leftInfoY + 31);
      leftInfoY += 45;
    }

    if (termsList && termsList.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("TERMS & CONDITIONS:", margin, leftInfoY);
      doc.setFont("helvetica", "normal");
      termsList.forEach((term, idx) => {
        doc.text(`${idx + 1}. ${term}`, margin, leftInfoY + 11 + idx * 10, { maxWidth: 220 });
      });
    }

    return doc;
  };

  const handleDownloadPdfDirect = async (quote: any) => {
    try {
      const quoteData = await getQuoteDataForAction(quote);
      await executePrint(quoteData);
    } catch (e) {
      console.error("PDF print failed:", e);
      alert("Failed to open print dialog.");
    }
  };

  // ── Generates a PDF blob from the rendered HTML print template (no popup) ──
  const generatePdfBlobFromTemplate = async (quoteData: any): Promise<Blob> => {
    // 1. Populate the same print template
    const items = [...(quoteData.items || [])];
    await Promise.all(items.map(async (item) => {
      if (!item.photoUrl) {
        try {
          const { data } = await supabase.from("products").select("photoUrl").eq("id", item.id).single();
          if (data?.photoUrl) item.photoUrl = data.photoUrl;
        } catch (_) {}
      }
    }));
    setPrintQuoteData({ ...quoteData, items });

    // 2. Wait for React to paint the template into #print-area
    await new Promise(resolve => setTimeout(resolve, 700));

    const printArea = document.getElementById("print-area");
    if (!printArea) throw new Error("Print area not found");

    // Remove Tailwind's 'hidden' class and force visibility for capture
    printArea.classList.remove("hidden");
    printArea.style.setProperty("display", "block", "important");
    printArea.style.setProperty("position", "fixed", "important");
    printArea.style.setProperty("top", "-9999px", "important");
    printArea.style.setProperty("left", "0px", "important");
    printArea.style.setProperty("z-index", "-1", "important");
    printArea.style.setProperty("width", "794px", "important");
    printArea.style.setProperty("background", "white", "important");
    printArea.style.setProperty("visibility", "visible", "important");
    printArea.style.setProperty("opacity", "1", "important");

    // Extra wait for images to load
    await new Promise(resolve => setTimeout(resolve, 500));

    const html2canvas = (await import("html2canvas-pro")).default;
    const { jsPDF } = await import("jspdf");

    const canvas = await html2canvas(printArea, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: 794,
      windowWidth: 794,
      logging: false,
    });

    // Restore — add hidden class back and clear inline styles
    printArea.classList.add("hidden");
    printArea.removeAttribute("style");

    // Clear print data
    setTimeout(() => setPrintQuoteData(null), 200);

    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    const pdfW = 210; // A4 width in mm
    const pdfH = 297; // A4 height in mm
    const imgW = pdfW;
    const imgH = (canvas.height * imgW) / canvas.width;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    let heightLeft = imgH;
    let position = 0;

    // Add first page
    doc.addImage(imgData, "JPEG", 0, position, imgW, imgH);
    heightLeft -= pdfH;

    // Add remaining pages if the content spans beyond A4 height
    while (heightLeft > 0) {
      position = heightLeft - imgH;
      doc.addPage();
      doc.addImage(imgData, "JPEG", 0, position, imgW, imgH);
      heightLeft -= pdfH;
    }

    return doc.output("blob");
  };

  const handleShareWhatsApp = async (quote: any) => {
    try {
      setIsGeneratingPdf(true);
      setPdfFeedback(lang === "gu" ? "પીડીએફ ફાઇલ બની રહી છે..." : "Generating PDF file...");

      const quoteData = await getQuoteDataForAction(quote);
      if (quoteData.items.length === 0) {
        alert(lang === "gu" ? "કૃપા કરીને પહેલા પ્રોડક્ટ્સ ઉમેરો." : "Please add products first.");
        return;
      }

      // 1. Generate A4 PDF matching the HTML template design
      const pdfBlob = await generatePdfBlobFromTemplate(quoteData);
      const filename = `Quotation_${quoteData.quoteNumber || "bill"}.pdf`;

      // 2. Automatically download the PDF to the user's local device
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      // 3. Upload to tmpfiles to get a direct download link for WhatsApp sharing
      const formData = new FormData();
      formData.append("file", pdfBlob, filename);

      const uploadRes = await fetch("https://tmpfiles.org/api/v1/upload", {
        method: "POST",
        body: formData
      });
      const resData = await uploadRes.json();
      if (resData.status !== "success") throw new Error("PDF upload failed");

      const directPdfUrl = resData.data.url.replace("https://tmpfiles.org/", "https://tmpfiles.org/dl/");

      const cName = quoteData.clientName || "";
      const quoteNum = quoteData.quoteNumber || "—";
      const quoteDateStr = quoteData.quoteDate || "—";
      const totalAmount = quoteData.total.toLocaleString("en-IN");
      const compName = companyInfo?.name || "Our Store";

      const message = `*QUOTATION BILL*\n------------------------------\n*Store:* ${compName}\n*Quote Ref:* ${quoteNum}\n*Date:* ${quoteDateStr}\n*Client:* ${cName}\n*Total Amount:* ₹${totalAmount}\n------------------------------\n*Download PDF Link:* ${directPdfUrl}\n\nThank you for business with us!`;

      // 4. Open WhatsApp Web/App pre-filled with the message link so they can choose the chat and click send
      const encodedText = encodeURIComponent(message);
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        window.open(`whatsapp://send?text=${encodedText}`, "_blank");
      } else {
        window.open(`https://api.whatsapp.com/send?text=${encodedText}`, "_blank");
      }
    } catch (e) {
      console.error("WhatsApp share failed:", e);
      alert("Failed to share PDF.");
    } finally {
      setIsGeneratingPdf(false);
      setPdfFeedback(null);
    }
  };

  const handleDownloadQuoteExcel = async (quote: any) => {
    let itemsToLoad = quote.items;
    if (!itemsToLoad) {
      itemsToLoad = await fetchQuoteItems(quote.id);
      quote.items = itemsToLoad;
    }
    
    // Create Excel Workbook
    const wb = XLSX.utils.book_new();
    
    // Format quote details for display
    const quoteNum = quote.quoteNumber || quote.quote_number || "Q-—";
    const clientName = quote.clientName || quote.client_name || "—";
    const clientComp = quote.clientCompany || quote.client_company || "—";
    const clientAddr = quote.clientAddress || quote.client_address || "—";
    const quoteDate = quote.quoteDate || quote.quote_date || "—";
    
    // Find client contact from clientsList
    const matchedClient = clientsList.find(c => c.name.toLowerCase() === clientName.toLowerCase());
    const clientContact = matchedClient?.contact || "—";

    // Setup sheet rows
    const rows = [
      ["QUOTATION DETAILS", ""],
      ["Quotation No:", quoteNum],
      ["Date:", quoteDate],
      ["", ""],
      ["CLIENT INFORMATION", ""],
      ["Client Name:", clientName],
      ["Company Name:", clientComp],
      ["Contact No:", clientContact],
      ["Address:", clientAddr],
      ["", ""],
      ["ITEMS", ""],
      ["Sr No.", "Product Code/Name", "Quantity (Pcs)", "Rate (Price Code)", "Total Amount"]
    ];

    // Add item rows
    (itemsToLoad || []).forEach((item: any, idx: number) => {
      const rateVal = parseFloat(item.rate) || 0;
      const totalVal = item.quantity * rateVal;
      rows.push([
        (idx + 1).toString(),
        item.name || "—",
        item.quantity.toString(),
        item.rate || "0",
        totalVal.toFixed(2)
      ]);
    });

    // Add summary rows
    const subtotal = (itemsToLoad || []).reduce((sum: number, item: any) => sum + (item.quantity * (parseFloat(item.rate) || 0)), 0);
    
    rows.push(["", ""]);
    rows.push(["Subtotal:", "", "", "", subtotal.toFixed(2)]);
    
    // Calculate tax/GST if applicable
    const rawTax = (quote.taxInput || "").trim();
    let taxAmount = 0;
    if (rawTax) {
      if (rawTax.endsWith("%")) {
        const pct = parseFloat(rawTax.slice(0, -1)) || 0;
        taxAmount = (subtotal * pct) / 100;
        rows.push([`GST (${rawTax}):`, "", "", "", taxAmount.toFixed(2)]);
      } else {
        taxAmount = parseFloat(rawTax) || 0;
        rows.push([`GST Amount:`, "", "", "", taxAmount.toFixed(2)]);
      }
    }

    // Markup
    if (quote.applyEventMarkup) {
      const markupPct = quote.eventMarkupPercent ?? 25;
      const markupAmt = ((subtotal + taxAmount) * markupPct) / 100;
      rows.push([`Markup (${markupPct}%):`, "", "", "", markupAmt.toFixed(2)]);
    }

    const grandTotal = quote.totalAmount || quote.total_amount || (subtotal + taxAmount);
    rows.push(["Grand Total:", "", "", "", parseFloat(grandTotal).toFixed(2)]);

    // Convert rows to worksheet
    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Set layout columns width for readability
    ws["!cols"] = [
      { wch: 15 }, // Sr No / keys
      { wch: 35 }, // Product Name
      { wch: 18 }, // Qty
      { wch: 18 }, // Rate
      { wch: 18 }  // Total
    ];

    // Append sheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Quotation");

    // Write file
    const fileName = `${quoteNum}_${clientName.replace(/\s+/g, "_")}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const playBeepSound = (isError = false) => {
    if (typeof window === "undefined") return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (isError) {
        oscillator.type = "sawtooth"; // Buzzer-like sound for error
        oscillator.frequency.setValueAtTime(180, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.8, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.35);
      } else {
        oscillator.type = "triangle"; // Loud Honeywell scanner-like beep
        oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.9, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.16);
      }
    } catch (err) {
      console.warn("AudioContext beep failed:", err);
    }
  };

  const handleBarcodeSubmit = async (codeVal: string) => {
    const cleanCode = codeVal.trim();
    if (!cleanCode) return;

    const searchTarget = cleanCode.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
    
    // 1. Local array search
    let matchedProduct = products.find(p => {
      const sanitizedName = p.name.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
      return sanitizedName === searchTarget;
    });

    // 2. Direct Supabase fallback if local search yields no results (useful on mobile first mounts)
    if (!matchedProduct) {
      try {
        const { data } = await supabase.from("products").select("*");
        if (data) {
          matchedProduct = data.find(p => {
            const sanitizedName = p.name.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
            return sanitizedName === searchTarget;
          });
        }
      } catch (e) {
        console.error("Supabase direct lookup failed:", e);
      }
    }

    if (matchedProduct) {
      playBeepSound(false);
      handleToggleProduct(matchedProduct);
      
      // Fetch missing photoUrl from DB if not present in local object
      let photoUrl = matchedProduct.photoUrl;
      if (!photoUrl) {
        try {
          const { data } = await supabase
            .from('products')
            .select('photoUrl')
            .eq('id', matchedProduct.id)
            .single();
          if (data?.photoUrl) photoUrl = data.photoUrl;
        } catch (e) {
          console.warn("Failed to fetch photoUrl on scan success:", e);
        }
      }

      setBarcodeFeedback({ 
        text: matchedProduct.name, 
        isError: false,
        photoUrl: photoUrl
      });
    } else {
      playBeepSound(true);
      setBarcodeFeedback({ 
        text: lang === "gu" ? `પ્રોડક્ટ મળી નથી: ${cleanCode}` : `Product not found: ${cleanCode}`, 
        isError: true 
      });
    }

    setBarcodeQuery("");
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }

    setTimeout(() => {
      setBarcodeFeedback(null);
    }, 3000);
  };

  // Toggle item selection (now increments if already exists)
  const handleToggleProduct = (product: Product) => {
    setSelectedItems(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item => {
          if (item.id === product.id) {
            return {
              ...item,
              cartons: item.cartons + 1,
              quantity: (item.cartons + 1) * item.cartonQty
            };
          }
          return item;
        });
      }
      
      const cQty = product.cartonQty || 1;
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          cartons: 1,
          quantity: cQty,
          cartonQty: cQty,
          rate: product.rate || "",
          color: product.color,
          length: product.length,
          photoUrl: product.photoUrl,
          collectionName: product.collectionName,
          description: product.description,
          location: product.location,
          stock: product.stock
        }
      ];
    });
  };

  // Update cartons (CTNS)
  const handleUpdateCartons = (itemId: string, cartons: number) => {
    setSelectedItems(
      selectedItems.map(item => {
        if (item.id === itemId) {
          const validatedCartons = Math.max(0, cartons);
          return {
            ...item,
            cartons: validatedCartons,
            quantity: validatedCartons * item.cartonQty
          };
        }
        return item;
      })
    );
  };

  // Update quantity (QTY) manually
  const handleUpdateQuantity = (itemId: string, qty: number) => {
    setSelectedItems(
      selectedItems.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity: Math.max(0, qty)
          };
        }
        return item;
      })
    );
  };

  // Update rate manually
  const handleUpdateRate = (itemId: string, newRate: string) => {
    setSelectedItems(
      selectedItems.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            rate: newRate
          };
        }
        return item;
      })
    );
  };

  // Filter products by global search query
  const filteredProducts = products.filter(p => {
    // Only include products from Code Collections (exclude Named Collections)
    const col = collections.find(c => c.id === p.collectionId);
    const isCode = col ? isCodeCollection(col) : isCodeCollection(p.collectionName || "");
    if (!isCode) return false;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return false; // Show nothing if query is empty
    return (
      (p.name?.toLowerCase() || "").includes(q) ||
      (p.color?.toLowerCase() || "").includes(q) ||
      (p.length?.toString().toLowerCase() || "").includes(q) ||
      (p.collectionName?.toLowerCase() || "").includes(q)
    );
  });

  // Calculations
  const subtotal = selectedItems.reduce((sum, item) => sum + (item.quantity * (parseFloat(getItemRate(item.rate)) || 0)), 0);
  
  // Calculate GST based on value or percentage (e.g. "18%")
  let taxAmount = 0;
  const rawTax = taxInput.trim();
  if (rawTax) {
    if (rawTax.endsWith("%")) {
      const pct = parseFloat(rawTax.slice(0, -1)) || 0;
      taxAmount = (subtotal * pct) / 100;
    } else {
      taxAmount = parseFloat(rawTax) || 0;
    }
  }

  // Other deduction (e.g. advance amount)
  const otherDeduction = parseFloat(otherAmount) || 0;
  
  const total = Math.max(0, subtotal + taxAmount - otherDeduction);

  // Auto-balance cash/bank when total changes
  // Auto-balance cash/bank only when total changes
  const prevTotalRef = useRef(total);
  useEffect(() => {
    if (prevTotalRef.current !== total) {
      if (cashAmount && !isNaN(Number(cashAmount))) {
        const remaining = Math.max(0, total - Number(cashAmount));
        setBankAmount(remaining > 0 ? remaining.toString() : "");
      } else if (bankAmount && !isNaN(Number(bankAmount))) {
        const remaining = Math.max(0, total - Number(bankAmount));
        setCashAmount(remaining > 0 ? remaining.toString() : "");
      }
      prevTotalRef.current = total;
    }
  }, [total, cashAmount, bankAmount]);

  // Print
  const handlePrint = async () => {
    if (selectedItems.length === 0) return;
    setShowPrintSaveModal(true);
  };

  const handleSaveAndPrint = async () => {
    setShowPrintSaveModal(false);
    const currentQuote = {
      id: currentQuoteId || "preview",
      quoteNumber,
      clientName,
      clientCompany,
      clientAddress,
      date: quoteDate,
      items: selectedItems,
      taxInput,
      otherLabel,
      otherAmount,
      cashAmount,
      bankAmount,
      applyEventMarkup,
      eventMarkupPercent,
      total: total,
      staffName: localStorage.getItem("user_name") || "Admin"
    };
    await executePrint(currentQuote);
    
    setTimeout(() => {
      handleSaveQuotation();
    }, 150);
  };

  if (loadingProfile) {
    return (
      <div className="flex flex-col h-[calc(100vh-140px)] items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-xl bg-blue-500/20 animate-pulse"></div>
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 relative z-10" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-500 animate-pulse tracking-wide">Loading quotation...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* CSS @media print overrides: Removes URL, date/time header, page numbers, Safari bg colors, and extra blank pages */}
      <style jsx global>{`
        #qr-shaded-region {
          display: none !important;
        }
        @media print {
          @page {
            size: auto;
            margin: 0mm !important; /* Set margin to 0 to hide browser URL/Time headers */
          }
          html, body {
            background-color: white !important;
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
          }
          /* Hide everything except the print area when using Portal */
          body.is-printing-portal > *:not(.print-portal) {
            display: none !important;
          }
          body.is-printing-portal .print-portal {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 15mm !important; /* Adding padding here to compensate for 0mm page margin */
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: white !important;
          }

          /* Fallback for standard Ctrl+P (hides everything except #print-area, but keeps position absolute) */
          body:not(.is-printing-portal) * {
            visibility: hidden !important;
          }
          body:not(.is-printing-portal) #print-area, 
          body:not(.is-printing-portal) #print-area * {
            visibility: visible !important;
          }
          body:not(.is-printing-portal) #print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 15mm !important; /* Adding padding here to compensate for 0mm page margin */
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: white !important;
            min-height: auto !important;
          }

          /* Explicit rules to strip out inputs, edit controls and buttons in print mode */
          .no-print, .no-print *, button, input, textarea {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            width: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .hidden.print\:inline {
            display: inline !important;
            visibility: visible !important;
          }
          .hidden.print\:block {
            display: block !important;
            visibility: visible !important;
          }
        }
      `}</style>

      {/* Header / Toolbar */}
      <div className="no-print flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between mb-1.5 sm:mb-3">
        {/* Search Inputs Row */}
        <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-sm">
          {/* History Search */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-400" />
            <input
              type="text"
              value={historySearchQuery}
              onChange={(e) => {
                setHistorySearchQuery(e.target.value);
                if (activeSubView !== "history") {
                  setActiveSubView("history");
                }
              }}
              placeholder={t("searchSavedQuotes")}
              className="w-full rounded-xl border border-sky-200 bg-white py-2.5 pl-11 pr-10 text-xs font-bold text-slate-700 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 shadow-sm"
            />
            {historySearchQuery && (
              <button
                type="button"
                onClick={() => setHistorySearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-655 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Actions - hidden on mobile, visible on desktop */}
        <div className="hidden lg:flex items-center gap-3">
          {activeSubView === "create" && permission === "edit" && (
            <button
              onClick={handleSaveQuotation}
              disabled={selectedItems.length === 0 || isSaving}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white transition disabled:opacity-50 active:scale-95 shadow-sm shrink-0 cursor-pointer"
            >
              {isSaving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {isSaving ? t("savingQuotation") : t("saveQuotation")}
            </button>
          )}

          <button
            onClick={handlePrint}
            disabled={selectedItems.length === 0}
            className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white transition disabled:opacity-50 active:scale-95 shadow-sm shrink-0 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            {t("printExportPdf")}
          </button>
        </div>
      </div>

      {/* Subview switcher tabs */}
      <div className="no-print flex gap-2 mb-2.5 lg:mb-3">
        <button
          onClick={handleCreateNew}
          className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 md:px-5 py-2 md:py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition active:scale-95 shadow-sm cursor-pointer ${
            activeSubView === "create"
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-white hover:bg-slate-50 text-slate-655 border border-slate-200/80"
          }`}
        >
          📝 {t("createQuotation")}
        </button>
        <button
          onClick={() => {
            // If there are unsaved items and we're on the create view, warn before switching
            if (activeSubView === "create" && selectedItems.length > 0) {
              setPendingAction("go_history");
              setShowLeaveModal(true);
            } else {
              setActiveSubView("history");
            }
          }}
          className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 md:px-5 py-2 md:py-2.5 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition active:scale-95 shadow-sm cursor-pointer ${
            activeSubView === "history"
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-white hover:bg-slate-50 text-slate-655 border border-slate-200/80"
          }`}
        >
          📜 {lang === "gu" ? "ઇતિહાસ" : "History"} ({savedQuotes.length})
        </button>
      </div>

      {/* Save Success Message */}
      {saveSuccessMessage && (
        <div className="no-print bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold mb-6 flex items-center justify-between animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            {saveSuccessMessage}
          </div>
          <button onClick={() => setSaveSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-850 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto min-h-0 pb-20 sm:pb-8 pr-1 no-print">
      {activeSubView === "history" ? (
        <div className="no-print bg-white rounded-3xl border border-slate-200 p-3 sm:p-6 md:p-8 shadow-sm">
          
          <div className="flex gap-1 mb-6 bg-slate-100/80 p-1.5 rounded-xl w-fit">
            <button
              onClick={() => setHistoryTab("follow_up")}
              className={`px-6 py-2 text-xs font-bold rounded-lg transition ${
                historyTab === "follow_up"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              Follow Up
            </button>
            <button
              onClick={() => setHistoryTab("done")}
              className={`px-6 py-2 text-xs font-bold rounded-lg transition ${
                historyTab === "done"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              Done
            </button>
            <button
              onClick={() => setHistoryTab("dispatch")}
              className={`px-6 py-2 text-xs font-bold rounded-lg transition ${
                historyTab === "dispatch"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}
            >
              Dispatch
            </button>
          </div>

          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
            <div>
              <h2 className="text-base font-black text-slate-800">Saved Quotations History</h2>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">Manage and load previously generated quotation bills.</p>
            </div>
          </div>

          {savedQuotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <FileText className="h-12 w-12 text-slate-200 mb-3" />
              <p className="text-sm font-semibold">No saved quotations found</p>
              <p className="text-xs text-slate-400 mt-1 font-medium">Start by creating and saving your first quotation bill.</p>
            </div>
          ) : (
            <div>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider bg-slate-50/50">
                      <th className="py-3.5 px-4">Ref No.</th>
                      <th className="py-3.5 px-4">Client / Company</th>
                      <th className="py-3.5 px-4">Quote Date</th>
                      <th className="py-3.5 px-4 text-center">Items</th>
                      <th className="py-3.5 px-4 text-right">Grand Total</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-center w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {savedQuotes
                      .filter((q) => {
                        const status = q.orderStatus || (q.isOrderDone ? "done" : "follow_up");
                        return status === historyTab;
                      })
                      .filter((q) => {
                        const qNum = (q.quoteNumber || "").toLowerCase();
                        const client = (q.clientName || "").toLowerCase();
                        const company = (q.clientCompany || "").toLowerCase();
                        const term = historySearchQuery.trim().toLowerCase();
                        return qNum.includes(term) || client.includes(term) || company.includes(term);
                      })
                      .map((quote) => (
                      <tr key={quote.id} className="hover:bg-slate-50/40">
                        <td className="py-4 px-4">
                          <div className="font-black text-slate-900">{quote.quoteNumber}</div>
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                            {quote.applyEventMarkup ? (
                              <span className="inline-flex items-center rounded-md bg-purple-50 px-1.5 py-0.5 text-[8px] font-bold text-purple-600 ring-1 ring-inset ring-purple-500/20">EVENT</span>
                            ) : (
                              <span className="inline-flex items-center rounded-md bg-slate-50 px-1.5 py-0.5 text-[8px] font-bold text-slate-600 ring-1 ring-inset ring-slate-500/20">B2B</span>
                            )}
                            {quote.staffName && (
                              <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[8px] font-bold text-blue-600 ring-1 ring-inset ring-blue-500/20 uppercase tracking-wide">
                                👤 {quote.staffName}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-bold text-slate-800">{quote.clientName || "—"}</p>
                          {quote.clientCompany && <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{quote.clientCompany}</p>}
                        </td>
                        <td className="py-4 px-4">{quote.quoteDate ? formatDate(quote.quoteDate) : "—"}</td>
                        <td className="py-4 px-4 text-center">{quote.items?.length || 0}</td>
                        <td className="py-4 px-4 text-right font-black text-slate-900">
                          ₹{(quote.total || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-4 px-4 text-center overflow-visible">
                          <div className="relative status-dropdown-container inline-block text-left">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenStatusDropdownId(openStatusDropdownId === quote.id ? null : quote.id);
                              }}
                              className={`flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wide uppercase transition border shadow-sm cursor-pointer select-none min-w-[110px] mx-auto ${
                                getStatusStyles(quote.orderStatus || (quote.isOrderDone ? "done" : "follow_up")).bg
                              }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                getStatusStyles(quote.orderStatus || (quote.isOrderDone ? "done" : "follow_up")).dot
                              }`} />
                              <span>{getStatusStyles(quote.orderStatus || (quote.isOrderDone ? "done" : "follow_up")).label}</span>
                              <ChevronDown className="h-3 w-3 opacity-65 ml-0.5" />
                            </button>

                            {openStatusDropdownId === quote.id && (
                              <div className="absolute right-0 z-[100] mt-1.5 w-36 rounded-xl border border-slate-205 bg-white p-1.5 shadow-lg animate-in fade-in slide-in-from-top-1 duration-100">
                                {[
                                  { id: "follow_up", label: "Follow Up", color: "text-amber-700", bg: "hover:bg-amber-50/60" },
                                  { id: "done", label: "Done", color: "text-emerald-700", bg: "hover:bg-emerald-50/60" },
                                  { id: "dispatch", label: "Dispatch", color: "text-purple-700", bg: "hover:bg-purple-50/60" }
                                ].map((opt) => {
                                  const isSelected = (quote.orderStatus || (quote.isOrderDone ? "done" : "follow_up")) === opt.id;
                                  return (
                                    <button
                                      key={opt.id}
                                      onClick={() => {
                                        handleUpdateOrderStatus(quote.id, opt.id);
                                        setOpenStatusDropdownId(null);
                                      }}
                                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[10px] font-bold transition-all cursor-pointer ${opt.bg} ${
                                        isSelected ? "bg-slate-50 font-extrabold" : "text-slate-655"
                                      }`}
                                    >
                                      <span className={opt.color}>{opt.label}</span>
                                      {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 stroke-[3px]" />}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleLoadQuote(quote)}
                              className="p-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 rounded-lg border border-blue-100 transition active:scale-95 cursor-pointer"
                              title="Edit Quotation"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handlePrintQuoteDirect(quote)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-600 rounded-lg border border-emerald-100 transition active:scale-95 cursor-pointer"
                              title="Direct Print PDF"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                             <button
                              onClick={() => handleShareWhatsApp(quote)}
                              className="p-1.5 bg-green-50 hover:bg-green-600 hover:text-white text-green-600 rounded-lg border border-green-100 transition active:scale-95 cursor-pointer flex items-center justify-center"
                              title="Share on WhatsApp"
                            >
                              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.458L0 24zm6.59-4.846c1.6.95 3.197 1.451 4.811 1.452 5.518 0 10.006-4.486 10.01-10.002.002-2.673-1.03-5.185-2.905-7.062C16.688 1.666 14.184.63 11.52.63c-5.522 0-10.013 4.49-10.018 10.007-.002 1.741.464 3.441 1.348 4.954l-1.018 3.715 3.81-1 .005.003zM16.65 13.56c-.28-.14-1.65-.815-1.905-.907-.255-.093-.44-.14-.625.14-.185.28-.71.907-.87 1.092-.16.185-.32.208-.6.07-2.73-1.37-3.93-2.067-5.49-4.755-.16-.28-.16-.48-.02-.62.13-.13.28-.32.42-.48.14-.16.19-.28.28-.465.09-.19.05-.35-.02-.49-.07-.14-.625-1.505-.855-2.06-.225-.542-.455-.47-.625-.47-.16 0-.345-.02-.53-.02-.185 0-.485.07-.74.348-.255.28-.97.95-.97 2.32 0 1.37 1 2.695 1.14 2.88.14.185 1.96 3 4.75 4.2 2.79 1.2 2.79.8 3.285.75.5-.05 1.65-.675 1.88-1.33.23-.653.23-1.21.16-1.33-.08-.105-.26-.15-.54-.29z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteQuote(quote.id)}
                              className="p-1.5 bg-red-50 hover:bg-red-650 hover:text-white text-red-655 rounded-lg border border-red-100 transition active:scale-95 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile List Card View */}
              <div className="md:hidden space-y-4">
                {savedQuotes
                  .filter((q) => {
                    const status = q.orderStatus || (q.isOrderDone ? "done" : "follow_up");
                    return status === historyTab;
                  })
                  .filter((q) => {
                    const qNum = (q.quoteNumber || "").toLowerCase();
                    const client = (q.clientName || "").toLowerCase();
                    const company = (q.clientCompany || "").toLowerCase();
                    const term = historySearchQuery.trim().toLowerCase();
                    return qNum.includes(term) || client.includes(term) || company.includes(term);
                  })
                  .map((quote) => (
                    <div key={quote.id} className="bg-slate-50/50 rounded-2xl p-4 border border-slate-150 space-y-3.5">
                      {/* Card Header Info */}
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-slate-900 text-sm">{quote.quoteNumber}</span>
                            {quote.applyEventMarkup ? (
                              <span className="inline-flex items-center rounded-md bg-purple-50 px-1.5 py-0.5 text-[8px] font-bold text-purple-600 ring-1 ring-inset ring-purple-500/20">EVENT</span>
                            ) : (
                              <span className="inline-flex items-center rounded-md bg-slate-50 px-1.5 py-0.5 text-[8px] font-bold text-slate-600 ring-1 ring-inset ring-slate-500/20">B2B</span>
                            )}
                            {quote.staffName && (
                              <span className="inline-flex items-center rounded-md bg-blue-50 px-1.5 py-0.5 text-[8px] font-bold text-blue-600 ring-1 ring-inset ring-blue-500/20 uppercase tracking-wide">
                                👤 {quote.staffName}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-semibold mt-1">
                            {quote.quoteDate ? formatDate(quote.quoteDate) : "—"} · {quote.items?.length || 0} items
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="block text-sm font-black text-slate-900">
                            ₹{(quote.total || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>

                      {/* Client Details Row */}
                      <div className="border-t border-slate-200/60 pt-2.5">
                        <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Client / Company</span>
                        <p className="font-bold text-slate-800 text-xs mt-0.5">{quote.clientName || "—"}</p>
                        {quote.clientCompany && <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{quote.clientCompany}</p>}
                      </div>

                      {/* Bottom Actions Row */}
                      <div className="border-t border-slate-200/60 pt-3 flex items-center justify-between gap-3">
                        <div className="relative status-dropdown-container inline-block text-left overflow-visible">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenStatusDropdownId(openStatusDropdownId === quote.id ? null : quote.id);
                            }}
                            className={`flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wide uppercase transition border shadow-sm cursor-pointer select-none min-w-[110px] ${
                              getStatusStyles(quote.orderStatus || (quote.isOrderDone ? "done" : "follow_up")).bg
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                              getStatusStyles(quote.orderStatus || (quote.isOrderDone ? "done" : "follow_up")).dot
                            }`} />
                            <span>{getStatusStyles(quote.orderStatus || (quote.isOrderDone ? "done" : "follow_up")).label}</span>
                            <ChevronDown className="h-3 w-3 opacity-65 ml-0.5" />
                          </button>

                          {openStatusDropdownId === quote.id && (
                            <div className="absolute left-0 z-[100] mt-1.5 w-36 rounded-xl border border-slate-205 bg-white p-1.5 shadow-lg animate-in fade-in slide-in-from-top-1 duration-100">
                              {[
                                { id: "follow_up", label: "Follow Up", color: "text-amber-700", bg: "hover:bg-amber-50/60" },
                                { id: "done", label: "Done", color: "text-emerald-700", bg: "hover:bg-emerald-50/60" },
                                { id: "dispatch", label: "Dispatch", color: "text-purple-700", bg: "hover:bg-purple-50/60" }
                              ].map((opt) => {
                                const isSelected = (quote.orderStatus || (quote.isOrderDone ? "done" : "follow_up")) === opt.id;
                                return (
                                  <button
                                    key={opt.id}
                                    onClick={() => {
                                      handleUpdateOrderStatus(quote.id, opt.id);
                                      setOpenStatusDropdownId(null);
                                    }}
                                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[10px] font-bold transition-all cursor-pointer ${opt.bg} ${
                                      isSelected ? "bg-slate-50 font-extrabold" : "text-slate-655"
                                    }`}
                                  >
                                    <span className={opt.color}>{opt.label}</span>
                                    {isSelected && <Check className="h-3.5 w-3.5 text-blue-600 stroke-[3px]" />}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleLoadQuote(quote)}
                            className="p-2 bg-white hover:bg-blue-50 text-blue-600 rounded-xl border border-slate-200 transition active:scale-95 shadow-sm"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handlePrintQuoteDirect(quote)}
                            className="p-2 bg-white hover:bg-emerald-50 text-emerald-600 rounded-xl border border-slate-200 transition active:scale-95 shadow-sm"
                            title="Print"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                           <button
                            onClick={() => handleShareWhatsApp(quote)}
                            className="p-2 bg-white hover:bg-green-50 text-green-600 rounded-xl border border-slate-200 transition active:scale-95 shadow-sm flex items-center justify-center"
                            title="Share on WhatsApp"
                          >
                            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.458L0 24zm6.59-4.846c1.6.95 3.197 1.451 4.811 1.452 5.518 0 10.006-4.486 10.01-10.002.002-2.673-1.03-5.185-2.905-7.062C16.688 1.666 14.184.63 11.52.63c-5.522 0-10.013 4.49-10.018 10.007-.002 1.741.464 3.441 1.348 4.954l-1.018 3.715 3.81-1 .005.003zM16.65 13.56c-.28-.14-1.65-.815-1.905-.907-.255-.093-.44-.14-.625.14-.185.28-.71.907-.87 1.092-.16.185-.32.208-.6.07-2.73-1.37-3.93-2.067-5.49-4.755-.16-.28-.16-.48-.02-.62.13-.13.28-.32.42-.48.14-.16.19-.28.28-.465.09-.19.05-.35-.02-.49-.07-.14-.625-1.505-.855-2.06-.225-.542-.455-.47-.625-.47-.16 0-.345-.02-.53-.02-.185 0-.485.07-.74.348-.255.28-.97.95-.97 2.32 0 1.37 1 2.695 1.14 2.88.14.185 1.96 3 4.75 4.2 2.79 1.2 2.79.8 3.285.75.5-.05 1.65-.675 1.88-1.33.23-.653.23-1.21.16-1.33-.08-.105-.26-.15-.54-.29z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteQuote(quote.id)}
                            className="p-2 bg-white hover:bg-red-50 text-red-655 rounded-xl border border-slate-200 transition active:scale-95 shadow-sm"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Mobile Tabs Toggle (Form vs Preview) */}
          <div className="no-print lg:hidden flex gap-2 mb-3 p-1 bg-slate-100 border border-slate-200/60 rounded-xl w-full select-none">
            <button
              type="button"
              onClick={() => setMobileTab("form")}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition active:scale-95 cursor-pointer uppercase tracking-wider ${
                mobileTab === "form"
                  ? "bg-white text-indigo-755 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              ✏️ {lang === "gu" ? "વિગતો ભરો" : "Fill Details"}
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("preview")}
              className={`flex-1 py-2 text-xs font-black rounded-lg transition active:scale-95 cursor-pointer uppercase tracking-wider ${
                mobileTab === "preview"
                  ? "bg-white text-indigo-755 shadow-sm border border-slate-200/50"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              📄 {lang === "gu" ? "બિલ પ્રિવ્યૂ" : "Preview Bill"}
              {selectedItems.length > 0 && ` (${selectedItems.length})`}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Side: Inputs Panels (no-print) — Sticky on desktop with internal scroll */}
          <div className={`no-print lg:col-span-4 select-none lg:sticky lg:top-0 ${mobileTab === "form" ? "block" : "hidden lg:block"}`}>
            <div className="space-y-4 pr-1 lg:overflow-y-auto lg:max-h-[calc(100vh-220px)] pb-4">
          
          {/* Warn if Profile details not filled yet */}
          {!loadingProfile && !companyInfo && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-xs font-semibold text-amber-700 leading-relaxed">
              ⚠️ Your Company Profile details were not found. Please set your company name, address, logo, bank account, and terms on the <Link href="/settings" className="underline font-black text-amber-900 hover:text-amber-950">Settings Page</Link> so they load automatically in your quotation bill.
            </div>
          )}

          {/* Accordion 1: QUOTATION SETTINGS */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="w-full flex items-center justify-between bg-slate-55/40 hover:bg-slate-100/60 px-5 py-4 transition text-left border-b border-slate-250/30 cursor-pointer"
            >
              <span className="text-[10px] font-black tracking-widest text-slate-500 flex items-center gap-2 uppercase">
                <Settings className="h-4 w-4 text-slate-400" />
                {t("quotationSettings")}
              </span>
              {settingsOpen ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>
            
            {settingsOpen && (
              <div className="p-5 space-y-4 animate-in slide-in-from-top-2 duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      {t("quoteRefNo")}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. DS-20260717-3452"
                        value={quoteNumber}
                        onChange={(e) => setQuoteNumber(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-xs font-semibold outline-none transition focus:border-blue-500"
                      />
                      {quoteNumber && (
                        <button
                          type="button"
                          onClick={() => setQuoteNumber("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-700 font-extrabold text-xs cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      {t("quoteDate")}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="date"
                        value={quoteDate}
                        onChange={(e) => setQuoteDate(e.target.value)}
                        className="flex-1 rounded-xl border border-slate-205 bg-white px-3.5 py-2 text-xs font-semibold outline-none transition focus:border-blue-500"
                      />
                      {quoteDate && (
                        <button
                          type="button"
                          onClick={() => setQuoteDate("")}
                          className="px-2.5 py-2 text-xs font-extrabold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition cursor-pointer shrink-0"
                          title="Clear date"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Valid Until
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-205 bg-white px-3.5 py-2 text-xs font-semibold outline-none transition focus:border-blue-500"
                    />
                    {validUntil && (
                      <button
                        type="button"
                        onClick={() => setValidUntil("")}
                        className="px-2.5 py-2 text-xs font-extrabold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition cursor-pointer shrink-0"
                        title="Clear date"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>



                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 space-y-1">
                  {companyInfo && (companyInfo.bankName || companyInfo.accountNumber) && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="showBank"
                        checked={showBankDetails}
                        onChange={(e) => setShowBankDetails(e.target.checked)}
                        className="rounded border-slate-350 text-blue-600 focus:ring-blue-500/10 h-4 w-4 cursor-pointer"
                      />
                      <label htmlFor="showBank" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                        {t("includeBankDetails")}
                      </label>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showAuthSignCheckbox"
                      checked={showAuthSign}
                      onChange={(e) => setShowAuthSign(e.target.checked)}
                      className="rounded border-slate-350 text-blue-600 focus:ring-blue-500/10 h-4 w-4 cursor-pointer"
                    />
                    <label htmlFor="showAuthSignCheckbox" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                      {t("includeAuthorizedSign")}
                    </label>
                  </div>

                  <div className="border-t border-slate-100 pt-2.5 mt-1">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="applyEventMarkupCheckbox"
                          checked={applyEventMarkup}
                          onChange={(e) => {
                            setApplyEventMarkup(e.target.checked);
                            localStorage.setItem("digiscale_apply_event_markup", e.target.checked.toString());
                          }}
                          className="rounded border-slate-350 text-blue-600 focus:ring-blue-500/10 h-4 w-4 cursor-pointer"
                        />
                        <label htmlFor="applyEventMarkupCheckbox" className="text-xs font-black text-slate-700 cursor-pointer select-none uppercase tracking-wider">
                          {t("applyEventPriceMarkup")}
                        </label>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={eventMarkupPercent}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setEventMarkupPercent(val);
                            localStorage.setItem("digiscale_event_markup_percent", val.toString());
                          }}
                          className="w-12 rounded-lg border border-slate-200 bg-white py-1 px-1.5 text-center text-xs font-black text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-xs font-bold text-slate-500">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Accordion 2: CLIENT DETAILS (OPTIONAL) */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => setClientOpen(!clientOpen)}
              className="w-full flex items-center justify-between bg-slate-55/40 hover:bg-slate-100/60 px-5 py-4 transition text-left border-b border-slate-250/30 cursor-pointer"
            >
              <span className="text-[10px] font-black tracking-widest text-slate-500 flex items-center gap-2 uppercase">
                <User className="h-4 w-4 text-slate-400" />
                {t("clientDetailsOptional")}
              </span>
              {clientOpen ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>
            
            {clientOpen && (
              <div className="p-5 space-y-4 animate-in slide-in-from-top-2 duration-150">
                <div className="space-y-3">
                  
                  {/* Search Existing Clients */}
                  <div className="relative mb-4 pb-4 border-b border-slate-100">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      {lang === "gu" ? "સાચવેલા ગ્રાહકો શોધો" : lang === "hi" ? "सहेजे गए ग्राहक खोजें" : "Search Saved Clients"}
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-500" />
                      <input
                        type="text"
                        placeholder={lang === "gu" ? "નામ અથવા કંપની દ્વારા શોધો..." : lang === "hi" ? "नाम या कंपनी से खोजें..." : "Search by name or company..."}
                        value={clientSearchQuery}
                        onChange={(e) => {
                          setClientSearchQuery(e.target.value);
                          setShowClientSearch(true);
                        }}
                        onFocus={() => setShowClientSearch(true)}
                        onBlur={() => setTimeout(() => setShowClientSearch(false), 200)}
                        className="w-full rounded-xl border-2 border-blue-100 bg-blue-50/30 pl-9 pr-3.5 py-2 text-xs font-semibold outline-none transition focus:border-blue-500 focus:bg-white"
                      />
                      
                      {/* Search Suggestions Dropdown */}
                      {showClientSearch && filteredClientSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          {filteredClientSuggestions.map((client: any, idx) => (
                            <div 
                              key={idx}
                              className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                              onClick={() => {
                                setClientName(client.name || "");
                                setClientCompany(client.company || "");
                                setClientAddress(client.address || "");
                                setClientContact(client.contact || "");
                                setClientSearchQuery("");
                                setShowClientSearch(false);
                              }}
                            >
                              <div className="text-xs font-bold text-slate-800">{client.name}</div>
                              {(client.company || client.contact) && (
                                <div className="text-[10px] text-slate-500 flex gap-2">
                                  {client.company && <span>{client.company}</span>}
                                  {client.company && client.contact && <span>•</span>}
                                  {client.contact && <span>{client.contact}</span>}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      {lang === "gu" ? "ગ્રાહકનું નામ" : lang === "hi" ? "ग्राहक का नाम" : "Customer Name"}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder={lang === "gu" ? "દા.ત. વ્રજ સુતરીયા" : lang === "hi" ? "जैसे राहुल कुमार" : "e.g. Vraj Sutariya"}
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs font-semibold outline-none transition focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      {lang === "gu" ? "કંપનીનું નામ" : lang === "hi" ? "कंपनी का नाम" : "Company Name"}
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder={lang === "gu" ? "દા.ત. કુમાર ટેક્સટાઇલ ઇન્ડસ્ટ્રીઝ" : lang === "hi" ? "जैसे एक्मे कॉर्प" : "e.g. Kumar Textile Industries"}
                        value={clientCompany}
                        onChange={(e) => setClientCompany(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs font-semibold outline-none transition focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      {lang === "gu" ? "સરનામું" : lang === "hi" ? "पता" : "Address"}
                    </label>
                    <textarea
                      rows={2}
                      placeholder={lang === "gu" ? "દા.ત. ૧૦૪, રિંગ રોડ, સુરત, ગુજરાત" : lang === "hi" ? "जैसे १०४, रिंग रोड, सूरत, गुजरात" : "e.g. 104, Ring Road, Surat, Gujarat"}
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold outline-none transition focus:border-blue-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      {lang === "gu" ? "સંપર્ક નંબર" : lang === "hi" ? "संपर्क संख्या" : "Contact Number"}
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder={lang === "gu" ? "દા.ત. +91 90000 00000" : lang === "hi" ? "जैसे +91 90000 00000" : "e.g. +91 90000 00000"}
                        value={clientContact}
                        onChange={(e) => setClientContact(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs font-semibold outline-none transition focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      {lang === "gu" ? "વધારાની નોંધો" : lang === "hi" ? "अतिरिक्त टिप्पणी / नोट" : "Additional Notes"}
                    </label>
                    <div className="relative">
                      <AlignLeft className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                      <textarea
                        rows={2}
                        placeholder={lang === "gu" ? "દા.ત. આ કોટેશન માટે વિશિષ્ટ વિગતો શામેલ કરો..." : lang === "hi" ? "जैसे इस कोट के लिए विशिष्ट विवरण शामिल करें..." : "e.g. Include specific details for this quote..."}
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs font-semibold outline-none transition focus:border-blue-500 resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Global Search and Select Products (Rounded Search Bar) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
            <div>
              <div className="mb-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-450 block">
                  {t("searchAddProducts")}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-3">
                {/* Search Input */}
                <div className="relative col-span-1 md:col-span-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t("searchProductsPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-11 pr-10 py-2.5 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-655 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* USB Barcode Scanner Input - Hidden on mobile view */}
                <div className="relative hidden md:block">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-extrabold text-[12px] select-none">
                    █║
                  </div>
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder={lang === "gu" ? "અહીં ક્લિક કરી બારકોડ સ્કેન કરો..." : "Focus here to scan barcode..."}
                    value={barcodeQuery}
                    onChange={(e) => setBarcodeQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleBarcodeSubmit(barcodeQuery);
                      }
                    }}
                    className="w-full rounded-xl border-2 border-indigo-200 bg-indigo-50/20 pl-11 pr-10 py-2.5 text-xs font-black text-indigo-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 placeholder:text-indigo-400/80"
                  />
                  {barcodeQuery && (
                    <button
                      type="button"
                      onClick={() => setBarcodeQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-indigo-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Barcode feedback message / toast inline */}
              {barcodeFeedback && (
                <div className={`mt-2.5 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition animate-bounce ${barcodeFeedback.isError ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
                  <span>{barcodeFeedback.isError ? "⚠️" : "✅"}</span>
                  <p>{barcodeFeedback.text}</p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-3">
              <p className="text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-2.5">
                {t("searchResults")}
              </p>

              {searchQuery.trim() === "" ? (
                <p className="text-xs text-slate-400 italic py-5 text-center font-medium">
                  {t("searchHint")}
                </p>
              ) : filteredProducts.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-5 text-center font-medium">
                  {lang === "gu" ? "તમારી શોધ સાથે મેળ ખાતી કોઈ પ્રોડક્ટ્સ મળી નથી." : lang === "hi" ? "आपकी खोज से मेल खाने वाले कोई उत्पाद नहीं मिले।" : "No products found matching your search."}
                </p>
              ) : (
                <div className="space-y-2 pr-1 animate-in fade-in duration-100">
                  {filteredProducts.slice(0, 50).map(p => {
                    const isSelected = !!selectedItems.find(item => item.id === p.id);
                    return (
                      <div 
                        key={p.id}
                        onClick={() => handleToggleProduct(p)}
                        className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50/20' 
                            : 'border-slate-150 hover:border-slate-250 bg-slate-55/30'
                        }`}
                      >
                        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                          isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>

                        <AsyncProductImage 
                          productId={p.id} 
                          initialUrl={p.photoUrl} 
                          className="h-8 w-8 rounded object-cover border border-slate-200 shrink-0" 
                          fallbackClassName="h-8 w-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0" 
                          iconClassName="h-4 w-4" 
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                              {p.description && (
                                <p className="text-[9px] text-slate-400 truncate leading-none mt-0.5 font-semibold">{p.description}</p>
                              )}
                            </div>
                            {p.collectionName && (
                              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-bold text-slate-500 uppercase">
                                {p.collectionName}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 font-semibold mt-1">
                            Price Code: {p.rate || "—"} · Carton Qty: {p.cartonQty || 1}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">
                              Stock: <strong className="text-slate-800 font-extrabold">{formatStockDisplay(p.stock ?? 0, p.cartonQty ?? 1)}</strong>
                            </span>
                            {(p.stock ?? 0) <= 0 ? (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                                Out of Stock
                              </span>
                            ) : (p.stock ?? 0) <= 5 ? (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                Low Stock
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-705 border border-emerald-200">
                                In Stock
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filteredProducts.length > 50 && (
                    <p className="text-[9px] text-slate-400 text-center pt-2 italic font-semibold">
                      * Showing first 50 results. Refine search for more.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          </div>{/* end inner overflow-y-auto scroll wrapper */}
        </div>

        {/* Right Side: Print Preview Container */}
        <div id="mobile-preview-parent" className={`lg:col-span-8 ${mobileTab === "preview" ? "block" : "hidden lg:block"} w-full`}>
          
          <div className="no-print mb-4 flex items-center justify-between w-full max-w-5xl mx-auto px-2 lg:hidden">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t("documentPreview")}
            </p>
            <p className="text-[10px] text-slate-400 font-semibold italic">
              {t("previewHint")}
            </p>
          </div>

          {/* The quotation design template */}
          {(() => {
            const chunkedPages = [];
            let currentIndex = 0;
            const totalItems = selectedItems.length;

            if (totalItems === 0) {
              chunkedPages.push({ items: [], startIndex: 0, isFirst: true, isLast: true });
            } else {
              let isFirst = true;
              while (currentIndex < totalItems) {
                const itemsLeft = totalItems - currentIndex;
                let itemsForThisPage = 0;
                let isLast = false;

                if (isFirst) {
                  if (itemsLeft <= 8) {
                    itemsForThisPage = itemsLeft;
                    isLast = true;
                  } else {
                    itemsForThisPage = 11;
                  }
                } else {
                  if (itemsLeft <= 10) {
                    itemsForThisPage = itemsLeft;
                    isLast = true;
                  } else {
                    itemsForThisPage = 13;
                  }
                }

                if (itemsForThisPage > itemsLeft) itemsForThisPage = itemsLeft;

                chunkedPages.push({
                  items: selectedItems.slice(currentIndex, currentIndex + itemsForThisPage),
                  startIndex: currentIndex,
                  isFirst: isFirst,
                  isLast: isLast
                });

                currentIndex += itemsForThisPage;
                isFirst = false;
              }
              if (chunkedPages.length > 0 && !chunkedPages[chunkedPages.length - 1].isLast) {
                chunkedPages.push({ items: [], startIndex: totalItems, isFirst: false, isLast: true });
              }
            }

            return (
              <div 
                className={`w-full flex overflow-hidden no-print ${mobileScale < 1 ? 'justify-start' : 'justify-center'}`}
                style={mobileScale < 1 ? {
                  height: `${(1123 * chunkedPages.length + 32 * (chunkedPages.length - 1)) * mobileScale + 40}px`
                } : {}}
              >
                <div 
                  id="print-area" 
                  className="flex flex-col gap-8 transition-transform duration-100 shrink-0"
                  style={mobileScale < 1 ? {
                    transform: `scale(${mobileScale})`,
                    transformOrigin: "top left",
                    width: "800px",
                    marginLeft: `${scaleMarginLeft}px`
                  } : {
                    width: "100%",
                    maxWidth: "800px",
                    marginLeft: "auto",
                    marginRight: "auto"
                  }}
                >
                  {chunkedPages.map((page, pageIndex) => (
                    <div key={pageIndex} className="print-container w-[800px] min-h-[1123px] mx-auto rounded-md border border-slate-200 bg-white p-10 shadow-sm flex flex-col relative shrink-0 overflow-hidden">
                    
                    {page.isFirst && (
                      <>
                      <div className="flex flex-row gap-4 border-2 border-slate-900 overflow-hidden shrink-0">
                        {/* Left Side: Logo Block (Snug zero margins, fixed width logo fit) */}
              <div className="w-28 bg-white text-slate-900 flex items-center justify-center text-center border-r-2 border-slate-900 min-h-[100px] shrink-0 overflow-hidden relative">
                {companyInfo?.logo ? (
                  <img src={companyInfo.logo} alt="Logo" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <span className="text-lg font-black tracking-wider uppercase px-2 text-slate-850">
                    {companyInfo?.name?.substring(0, 8) || "DIGISCALE"}
                  </span>
                )}
              </div>

              {/* Right Side: Contact Info dynamically called from company profile settings */}
              <div className="flex-1 p-4 flex flex-col justify-center text-slate-800 text-xs font-semibold space-y-1">
                <h2 className="text-sm font-black text-slate-950 uppercase">{companyInfo?.name || "DIGISCALE PRODUCT STUDIO"}</h2>
                <p className="text-[10px] leading-relaxed text-slate-655 uppercase">
                  <span className="font-extrabold text-slate-955">ADDRESS:</span> {companyInfo?.address || "No company address set. Add in Settings."}
                </p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-slate-655 uppercase pt-0.5">
                  <p>
                    <span className="font-extrabold text-slate-955">MOBILE:</span> {companyInfo?.primaryPhone || "-"} {companyInfo?.secondaryPhone ? `| ${companyInfo.secondaryPhone}` : ""}
                  </p>
                  <p>
                    <span className="font-extrabold text-slate-955">EMAIL:</span> {companyInfo?.email || "-"}
                  </p>
                </div>
                {companyInfo?.gst && (
                  <p className="text-[10px] text-slate-655 uppercase font-bold">
                    <span className="font-extrabold text-slate-955">GSTIN:</span> {companyInfo.gst}
                  </p>
                )}
              </div>
            </div>

            {/* CLIENT NAME Banner */}
            {clientName ? (
              <div className="w-full bg-slate-100 text-center py-2.5 border-y-2 border-slate-900 mt-4 mb-3">
                <h3 className="text-sm font-black text-slate-955 tracking-widest uppercase">
                  {clientName}
                </h3>
              </div>
            ) : (
              <div className="h-4"></div>
            )}

            {/* Billing Details & Quotation Info Metadata Block */}
            <div className="flex flex-row justify-between gap-4 mt-2 mb-5 text-xs font-semibold text-slate-700">
              {/* Left Side: Customer Billing Details */}
              <div className="w-1/2">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">{t("billingDetails")}</p>
                <p className="text-slate-900 font-extrabold">{clientCompany || "-"}</p>
                <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">{clientAddress || "-"}</p>
                <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed font-bold">{clientContact ? `${lang === "gu" ? "સંપર્ક" : lang === "hi" ? "संपर्क" : "Contact"}: ${clientContact}` : "-"}</p>
              </div>

              {/* Right Side: Quotation Info Metadata */}
              {(quoteNumber || quoteDate || validUntil) && (
                <div className="text-right space-y-1 min-w-[220px] ml-auto">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Quotation Info:</p>
                  <div className="mb-1.5">
                    <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-widest text-slate-600 print:border-slate-300 print:text-slate-800">
                      B2B Quotation
                    </span>
                  </div>
                  {quoteNumber && <p className="text-[10px] text-slate-505 font-extrabold uppercase">Quote Ref: <span className="text-slate-900 font-black">{quoteNumber}</span></p>}
                  {quoteDate && <p className="text-[10px] text-slate-505 font-extrabold uppercase">Date: <span className="text-slate-900 font-black">{formatDate(quoteDate)}</span></p>}
                  {validUntil && <p className="text-[10px] text-slate-505 font-extrabold uppercase">Valid Till: <span className="text-slate-900 font-black">{formatDate(validUntil)}</span></p>}
                </div>
              )}
            </div>
            </>
            )}

            {/* Items Table */}
            <div className={`mb-6 ${!page.isFirst ? 'mt-8' : 'mt-6'}`}>
              {page.items.length === 0 && page.isFirst ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <FileText className="h-10 w-10 text-slate-200 mb-2" />
                  <p className="text-xs italic font-medium">{t("noItemsSelected")}</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse border-2 border-slate-900">
                  <thead>
                    <tr className="bg-slate-100 border-b-2 border-slate-900 text-[10px] font-black text-slate-955 uppercase tracking-wider">
                      <th className="py-2.5 px-3 border-r border-slate-900 text-center w-10">{lang === "gu" ? "ક્રમ" : lang === "hi" ? "क्रम" : "SR."}</th>
                      <th className="py-2.5 px-3 border-r border-slate-900 text-center w-24">{lang === "gu" ? "પ્રોડક્ટ ફોટો" : lang === "hi" ? "उत्पाद फोटो" : "PRODUCT PHOTO"}</th>
                      <th className="py-2.5 px-3 border-r border-slate-900 text-left min-w-[200px]">{lang === "gu" ? "વર્ણન" : lang === "hi" ? "विवरण" : "DESCRIPTION"}</th>
                      <th className="py-2.5 px-3 border-r border-slate-900 text-center w-20">{lang === "gu" ? "કાર્ટન્સ" : lang === "hi" ? "कार्टन" : "CTNS"}</th>
                      <th className="py-2.5 px-3 border-r border-slate-900 text-center w-16">{lang === "gu" ? "માત્રા" : lang === "hi" ? "मात्रा" : "QTY"}</th>
                      <th className="py-2.5 px-3 border-r border-slate-900 text-right w-24">{lang === "gu" ? "ભાવ" : lang === "hi" ? "मूल्य" : "PRICE"}</th>
                      <th className="py-2.5 pl-3 pr-6 text-right w-28">{lang === "gu" ? "કુલ" : lang === "hi" ? "कुल" : "TOTAL"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 text-xs font-semibold text-slate-900">
                    {page.items.map((item, idx) => {
                      const absoluteIndex = page.startIndex + idx + 1;
                      return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        {/* SR */}
                        <td className="py-3 px-3 border-r border-slate-300 text-center text-slate-500 font-bold">
                          {absoluteIndex}
                        </td>

                        {/* PRODUCT PHOTO */}
                        <td className="p-1 border-r border-slate-300 align-middle">
                          <div className="h-20 w-24 bg-white overflow-hidden flex items-center justify-center relative mx-auto shrink-0">
                              <AsyncProductImage productId={item.id} initialUrl={item.photoUrl} className="h-full w-full object-contain p-0.5" fallbackClassName="h-full w-full flex items-center justify-center bg-slate-50" iconClassName="h-5 w-5 text-slate-300" />
                          </div>
                        </td>

                        {/* PRODUCT NAME */}
                        <td className="py-3 px-3 border-r border-slate-300 align-middle">
                          <p className="font-extrabold text-slate-955 leading-tight">{item.name}</p>

                          <div className="no-print mt-2">
                            <input
                              type="text"
                              placeholder={lang === "gu" ? "કસ્ટમ વર્ણન લખો..." : lang === "hi" ? "कस्टम विवरण लिखें..." : "Add custom description..."}
                              value={item.description || ""}
                              onChange={(e) => {
                                const newDesc = e.target.value;
                                setSelectedItems(prev => prev.map(si => si.id === item.id ? { ...si, description: newDesc } : si));
                              }}
                              className="w-full px-2.5 py-1 text-[11px] font-semibold border border-slate-205 rounded-lg focus:outline-none focus:border-blue-500 bg-white shadow-inner"
                            />
                          </div>

                          <div className="no-print mt-1.5 flex items-center gap-1.5 flex-wrap">
                            {item.location && (
                              <p className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 select-none shrink-0">
                                {item.location}
                              </p>
                            )}
                            <span className="text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-150 px-1.5 py-0.5 rounded select-none shrink-0">
                              Stock: <strong className="text-slate-800 font-extrabold">{formatStockDisplay(item.stock ?? 0, item.cartonQty ?? 1)}</strong>
                            </span>
                            {(item.stock ?? 0) <= 0 ? (
                              <span className="px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 shrink-0">
                                Out
                              </span>
                            ) : (item.stock ?? 0) <= 5 ? (
                              <span className="px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-amber-50 text-amber-705 border border-amber-200 animate-pulse shrink-0">
                                Low
                              </span>
                            ) : (
                              <span className="px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-705 border border-emerald-200 shrink-0">
                                OK
                              </span>
                            )}
                          </div>

                          <div className="hidden print:block">
                            {item.description && (
                              <p className="text-[10px] text-slate-550 font-bold mt-1 whitespace-pre-wrap">
                                {item.description}
                              </p>
                            )}
                            {item.location && (
                              <p className="text-[9px] font-bold text-slate-400 mt-1 border-t border-dashed border-slate-200 pt-0.5">
                                {item.location}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* CTNS */}
                        <td className="py-2 px-2 border-r border-slate-300 align-middle text-center">
                          <div className="no-print flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateCartons(item.id, item.cartons - 1)}
                              className="h-6 w-6 rounded-lg border border-slate-200 bg-white flex items-center justify-center font-extrabold text-slate-655 hover:bg-slate-50 hover:border-slate-300 active:scale-90 transition shadow-sm"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-extrabold text-slate-900 text-xs select-none">
                              {item.cartons}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateCartons(item.id, item.cartons + 1)}
                              className="h-6 w-6 rounded-lg border border-slate-200 bg-white flex items-center justify-center font-extrabold text-slate-655 hover:bg-slate-50 hover:border-slate-300 active:scale-90 transition shadow-sm"
                            >
                              +
                            </button>
                          </div>
                          <span className="hidden print:inline font-bold">
                            {item.cartons}
                          </span>
                        </td>

                        {/* QTY */}
                        <td className="py-2 px-1 border-r border-slate-300 align-middle text-center">
                          <input
                            type="number"
                            min="0"
                            value={item.quantity === 0 ? "" : item.quantity}
                            onChange={(e) => {
                              const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                              handleUpdateQuantity(item.id, isNaN(val) ? 0 : val);
                            }}
                            placeholder="0"
                            className="no-print w-11 rounded-lg border border-slate-205 bg-white py-1 px-1 text-center text-xs font-black text-slate-800 outline-none transition focus:border-blue-550 focus:ring-2 focus:ring-blue-500/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="hidden print:inline font-bold text-slate-700">
                            {item.quantity}
                          </span>
                        </td>

                        {/* PRICE CODE */}
                        <td className="py-2 px-1 border-r border-slate-300 align-middle text-right font-bold text-slate-800">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={getItemRate(item.rate || "") || ""}
                            onChange={(e) => {
                              let val = e.target.value;
                              if (val !== "" && applyEventMarkup) {
                                const num = parseFloat(val);
                                if (!isNaN(num)) {
                                  val = (num / (1 + eventMarkupPercent / 100)).toString();
                                }
                              }
                              handleUpdateRate(item.id, val);
                            }}
                            placeholder="0"
                            className="no-print w-14 rounded-lg border border-slate-205 bg-white py-1 px-1 text-right text-xs font-black text-slate-800 outline-none transition focus:border-blue-550 focus:ring-2 focus:ring-blue-500/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ml-auto"
                          />
                          <span className="hidden print:inline">
                            {getItemRate(item.rate)}
                          </span>
                        </td>

                        {/* TOTAL */}
                        <td className="py-3 pl-3 pr-6 align-middle text-right font-black text-slate-950">
                          <div className="flex items-center justify-end gap-2">
                            <span>₹{(item.quantity * (parseFloat(getItemRate(item.rate)) || 0)).toLocaleString("en-IN")}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedItems(selectedItems.filter((_, idx) => idx !== selectedItems.indexOf(item)))}
                              className="no-print p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                              title="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Fill space */}
            <div className="flex-1" />

            {/* Calculations and Bank Info footer row */}
            {page.isLast && (
              <div className="shrink-0 mt-auto flex flex-col md:flex-row print:flex-row justify-between gap-6 items-start break-inside-avoid pt-6 border-t-2 border-slate-900">
                
                {/* Stacked Vertical Bank Details & Terms & Conditions */}
                <div className="w-full md:w-3/5 print:w-[60%] flex flex-row items-start gap-4">
                  {/* QR Code */}
                  {showBankDetails && companyInfo && (companyInfo.qrCode || companyInfo.upiId || (companyInfo.accountNumber && companyInfo.ifsc)) && (
                    <div className="flex flex-col items-center justify-center p-1 border border-slate-200 rounded h-[100px] w-[100px] shrink-0">
                      {companyInfo.qrCode ? (
                        <img src={companyInfo.qrCode} alt="QR Code" className="w-full h-full object-contain" />
                      ) : companyInfo.upiId ? (
                        <QRCodeSVG
                          value={companyInfo.upiId}
                          size={60}
                          className="w-full h-full"
                        />
                      ) : (
                        <QRCodeSVG
                          value={`upi://pay?pa=${companyInfo.accountNumber}@${companyInfo.ifsc}.ifsc.npci&pn=${companyInfo.name}`}
                          size={60}
                          className="w-full h-full"
                        />
                      )}
                      {!companyInfo.qrCode && <span className="text-[6px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Scan to Pay</span>}
                    </div>
                  )}

                  <div className="space-y-3 print:space-y-0 print:flex-1">
                    {showBankDetails && companyInfo && (companyInfo.bankName || companyInfo.accountNumber) ? (
                      <div className="py-1">
                        <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">
                          BANK ACCOUNT DETAILS (FOR PAYMENTS)
                        </p>
                        
                        <div className="space-y-1.5 mt-2 text-[10px] text-slate-700 leading-tight">
                          <p className="flex items-center">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px] inline-block w-20">Bank Name:</span> 
                            <span className="font-extrabold text-slate-900">{companyInfo.bankName || "-"}</span>
                          </p>
                          <p className="flex items-center">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px] inline-block w-20">Account No:</span> 
                            <span className="font-extrabold text-slate-900">{companyInfo.accountNumber || "-"}</span>
                          </p>
                          <p className="flex items-center">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px] inline-block w-20">IFSC Code:</span> 
                            <span className="font-extrabold text-slate-900">{companyInfo.ifsc || "-"}</span>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="h-1"></div>
                    )}

                    {/* Additional Notes */}
                    {additionalNotes && (
                      <div className="text-[9px] text-slate-600 font-medium space-y-1 mt-2 leading-relaxed whitespace-pre-wrap">
                        <p className="uppercase text-slate-700 font-black mb-1">Additional Notes:</p>
                        <p>{additionalNotes}</p>
                      </div>
                    )}

                    {/* Customizable Terms and Conditions */}
                    {termsList.length > 0 && (
                      <div className="text-[9px] text-slate-400 font-semibold space-y-1 mt-2 leading-relaxed">
                        <p className="uppercase text-slate-500 font-black mb-1">Terms & Conditions:</p>
                        {termsList.map((term, i) => (
                          <p key={i}>{term}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Reordered Totals Summary */}
                <div className="w-full md:w-72 print:w-[35%] space-y-3 print:space-y-1.5 text-xs">
                  {/* 1. Amount */}
                  <div className="flex justify-between font-bold text-slate-655">
                    <span>Amount</span>
                    <span>₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>

                  {/* 2. GST */}
                  <div className={`flex justify-between font-bold text-slate-500 items-center ${taxAmount > 0 || taxInput ? "" : "print:hidden"}`}>
                    <span className="flex items-center gap-1.5">
                      <span>GST</span>
                      <span className="no-print flex items-center gap-0.5">
                        (
                        <input
                          type="text"
                          placeholder="e.g. 18% or 500"
                          value={taxInput}
                          onChange={(e) => setTaxInput(e.target.value)}
                          className="w-24 text-center font-bold text-slate-800 bg-slate-100 border border-slate-200 rounded py-0.5 px-1.5 outline-none text-[10px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        )
                      </span>
                      <span className="hidden print:inline">({taxInput})</span>
                    </span>
                    <span>
                      ₹{taxAmount.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* 3. Other / Advance deduction */}
                  <div className={`flex justify-between font-bold text-slate-500 items-center ${otherDeduction > 0 || otherLabel || otherAmount ? "" : "print:hidden"}`}>
                    <span className="flex items-center gap-1.5">
                      <span className="no-print">Other</span>
                      <span className="hidden print:inline">{otherLabel || "Other"}</span>
                      <span className="no-print flex items-center gap-0.5">
                        (
                        <input
                          type="text"
                          placeholder="e.g. Advance"
                          value={otherLabel}
                          onChange={(e) => setOtherLabel(e.target.value)}
                          className="w-20 text-center font-bold text-slate-800 bg-slate-100 border border-slate-200 rounded py-0.5 px-1.5 outline-none text-[10px]"
                        />
                        )
                      </span>
                      <span className="hidden print:inline">({otherLabel})</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="no-print text-red-500">-</span>
                      <span className="no-print">
                        <input
                          type="number"
                          placeholder="0"
                          value={otherAmount}
                          onChange={(e) => setOtherAmount(e.target.value)}
                          className="w-20 text-right font-bold text-slate-800 bg-slate-100 border border-slate-200 rounded py-0.5 px-1.5 outline-none text-[10px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </span>
                      <span className="hidden print:inline">-₹{otherDeduction.toLocaleString("en-IN")}</span>
                    </span>
                  </div>

                  <hr className="border-slate-200" />

                  {/* 4. Grand Total */}
                  <div className="flex justify-between text-base font-black text-slate-950 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span>Grand Total</span>
                    <span>₹{total.toLocaleString("en-IN")}</span>
                  </div>

                  {/* Cash & Bank Inputs */}
                  <div className="no-print pt-2 space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-600 items-center">
                      <span>Paid via Cash</span>
                      <div className="flex items-center w-40 bg-white border border-slate-300 rounded py-0.5 px-2 focus-within:border-blue-500 transition-colors">
                        <span className="text-slate-800 shrink-0 mr-1">₹</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={cashAmount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCashAmount(val);
                            if (val && !isNaN(Number(val))) {
                              const remaining = Math.max(0, total - Number(val));
                              setBankAmount(remaining > 0 ? remaining.toString() : "");
                            } else if (val === "") {
                              setBankAmount("");
                            }
                          }}
                          className="w-full text-right font-bold text-slate-800 bg-transparent outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-600 items-center">
                      <span>Paid via Bank</span>
                      <div className="flex items-center w-40 bg-white border border-slate-300 rounded py-0.5 px-2 focus-within:border-blue-500 transition-colors">
                        <span className="text-slate-800 shrink-0 mr-1">₹</span>
                        <input
                          type="number"
                          placeholder="0"
                          value={bankAmount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBankAmount(val);
                            if (val && !isNaN(Number(val))) {
                              const remaining = Math.max(0, total - Number(val));
                              setCashAmount(remaining > 0 ? remaining.toString() : "");
                            } else if (val === "") {
                              setCashAmount("");
                            }
                          }}
                          className="w-full text-right font-bold text-slate-800 bg-transparent outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Print-only Cash / Bank box */}
                  {(cashAmount || bankAmount) && (
                    <div className="hidden print:block print:mt-2">
                      <div className="border border-slate-800 p-2 text-[10px] font-bold text-slate-900 space-y-1 w-full">
                        <div className="flex justify-between border-b border-dashed border-slate-400 pb-1">
                          <span>BANK:</span>
                          <span>{bankAmount ? `₹${parseFloat(bankAmount).toLocaleString("en-IN")}` : "-"}</span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span>CASH:</span>
                          <span>{cashAmount ? `₹${parseFloat(cashAmount).toLocaleString("en-IN")}` : "-"}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Authorized Sign Option */}
                  {showAuthSign && (
                    <div className="text-right pt-16 print:pt-36">
                      <div className="inline-block border-t border-slate-400 w-32 pt-1 text-center text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        Authorized Sign
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

                  </div>
                ))}
              </div>
            </div>
            );
          })()}
        </div>

      </div>
    </div>
    )}

    {/* ── PREMIUM PREVIEW MODAL ── */}
    {selectedQuoteForPreview && (
      <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm p-4 md:p-6 no-print flex flex-col items-center justify-center">
        {/* Modal Toolbar (Buttons to Edit, Print, Close) - OUTSIDE the scaled area */}
        <div className="w-full max-w-[800px] flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-white">
            <FileText className="h-5 w-5" />
            <div>
              <h3 className="text-sm font-black">
                Preview Quotation - {selectedQuoteForPreview.quoteNumber}
              </h3>
              <p className="text-[10px] font-semibold opacity-80 mt-0.5">
                Quotation Bill for {selectedQuoteForPreview.clientName || "Cash Customer"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Print button */}
            <button
              onClick={() => executePrint(selectedQuoteForPreview)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition active:scale-95 shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              Print / Export
            </button>

            {/* Close button */}
            <button
              onClick={() => setSelectedQuoteForPreview(null)}
              className="p-2 text-white/70 hover:bg-white/10 hover:text-white rounded-xl transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal card fits exactly the A4 width (800px) and scales dynamically to fit screen height */}
        <div 
          style={{
            transform: `scale(${zoomScale})`,
            transformOrigin: "top center",
            width: "800px",
            height: "1131px" // A4 aspect ratio
          }}
          className="bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 transition-transform"
        >
          {/* Preview Area - fits inside A4 container */}
          <div className="p-10 flex flex-col justify-between h-full bg-white">
            <div>
              {/* Invoice Header */}
              <div className="flex flex-row gap-4 border-2 border-slate-900 overflow-hidden">
                <div className="w-28 bg-white text-slate-900 flex items-center justify-center text-center border-r-2 border-slate-900 min-h-[100px] shrink-0 overflow-hidden relative">
                  {companyInfo?.logo ? (
                    <img src={companyInfo.logo} alt="Logo" className="absolute inset-0 h-full w-full object-cover" />
                  ) : (
                    <span className="text-lg font-black tracking-wider uppercase px-2 text-slate-850">
                      {companyInfo?.name?.substring(0, 8) || "DIGISCALE"}
                    </span>
                  )}
                </div>

                <div className="flex-1 p-4 flex flex-col justify-center text-slate-800 text-xs font-semibold space-y-1">
                  <h2 className="text-sm font-black text-slate-955 uppercase">{companyInfo?.name || "DIGISCALE PRODUCT STUDIO"}</h2>
                  <p className="text-[10px] leading-relaxed text-slate-655 uppercase">
                    <span className="font-extrabold text-slate-955">ADDRESS:</span> {companyInfo?.address || "No company address set. Add in Settings."}
                  </p>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-slate-655 uppercase pt-0.5">
                    <p>
                      <span className="font-extrabold text-slate-955">MOBILE:</span> {companyInfo?.primaryPhone || "-"} {companyInfo?.secondaryPhone ? `| ${companyInfo.secondaryPhone}` : ""}
                    </p>
                    <p>
                      <span className="font-extrabold text-slate-955">EMAIL:</span> {companyInfo?.email || "-"}
                    </p>
                  </div>
                  {companyInfo?.gst && (
                    <p className="text-[10px] text-slate-655 uppercase font-bold">
                      <span className="font-extrabold text-slate-955">GSTIN:</span> {companyInfo.gst}
                    </p>
                  )}
                </div>
              </div>

              {/* CLIENT NAME Banner */}
              {selectedQuoteForPreview.clientName ? (
                <div className="w-full bg-slate-100 text-center py-2.5 border-y-2 border-slate-900 mt-4 mb-3">
                  <h3 className="text-sm font-black text-slate-955 tracking-widest uppercase">
                    {selectedQuoteForPreview.clientName}
                  </h3>
                </div>
              ) : (
                <div className="h-4"></div>
              )}

              {/* Billing Details & Quotation Info Metadata Block */}
              <div className="flex flex-row justify-between gap-4 mt-2 mb-5 text-xs font-semibold text-slate-700">
                  <div className="w-1/2">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Billing Details:</p>
                    <p className="text-slate-900 font-extrabold">{selectedQuoteForPreview.clientCompany || "-"}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">{selectedQuoteForPreview.clientAddress || "-"}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed font-bold">{clientContact ? `Contact: ${clientContact}` : "-"}</p>
                  </div>

                {(selectedQuoteForPreview.quoteNumber || selectedQuoteForPreview.quoteDate || selectedQuoteForPreview.validUntil) && (
                  <div className="text-right space-y-1 min-w-[220px] ml-auto">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Quotation Info:</p>
                    <div className="mb-1.5">
                      <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-widest text-slate-600 print:border-slate-300 print:text-slate-800">
                        B2B Quotation
                      </span>
                    </div>
                    {selectedQuoteForPreview.quoteNumber && <p className="text-[10px] text-slate-550 font-extrabold uppercase">Quote Ref: <span className="text-slate-900 font-black">{selectedQuoteForPreview.quoteNumber}</span></p>}
                    {selectedQuoteForPreview.quoteDate && <p className="text-[10px] text-slate-550 font-extrabold uppercase">Date: <span className="text-slate-900 font-black">{formatDate(selectedQuoteForPreview.quoteDate)}</span></p>}
                    {selectedQuoteForPreview.validUntil && <p className="text-[10px] text-slate-550 font-extrabold uppercase">Valid Till: <span className="text-slate-900 font-black">{formatDate(selectedQuoteForPreview.validUntil)}</span></p>}
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="border border-slate-900 overflow-hidden rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b-2 border-slate-900 text-[10px] font-black text-slate-955 uppercase tracking-wider">
                      <th className="py-2.5 px-3 border-r border-slate-900 text-center w-10">SR.</th>
                      <th className="py-2.5 px-3 border-r border-slate-900 text-center w-28">PRODUCT PHOTO</th>
                      <th className="py-2.5 px-3 border-r border-slate-900 text-left min-w-[200px]">DESCRIPTION</th>
                      <th className="py-2.5 px-3 border-r border-slate-900 text-center w-20">CTNS</th>
                      <th className="py-2.5 px-3 border-r border-slate-900 text-center w-20">CTNS</th>
                      <th className="py-2.5 px-3 border-r border-slate-900 text-center w-16">QTY</th>
                      <th className="py-2.5 px-3 border-r border-slate-900 text-right w-24">PRICE</th>
                      <th className="py-2.5 px-3 text-right w-28">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 text-xs font-semibold text-slate-900">
                    {selectedQuoteForPreview.items?.map((item: any, idx: number) => (
                      <tr key={item.id}>
                        <td className="py-3 px-3 border-r border-slate-300 text-center text-slate-500 font-bold">
                          {idx + 1}
                        </td>
                        <td className="p-1 border-r border-slate-300 align-middle">
                          <div className="h-20 w-24 bg-white overflow-hidden flex items-center justify-center relative mx-auto shrink-0">
                              <AsyncProductImage productId={item.id} initialUrl={item.photoUrl} className="h-full w-full object-contain p-0.5" fallbackClassName="h-full w-full flex items-center justify-center bg-slate-50" iconClassName="h-5 w-5 text-slate-300" />
                          </div>
                        </td>
                        <td className="py-3 px-3 border-r border-slate-300 align-middle">
                          <p className="font-extrabold text-slate-955 leading-tight">{item.name}</p>
                          {item.description && (
                            <p className="text-[11px] text-slate-500 font-semibold mt-1 bg-slate-50 border border-slate-200/50 rounded px-1.5 py-1 whitespace-pre-wrap">
                              {item.description}
                            </p>
                          )}
                          {item.location && (
                            <p className="text-[9px] font-bold text-blue-650 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 mt-1 inline-block no-print select-none">
                              Loc: {item.location}
                            </p>
                          )}
                        </td>
                        <td className="py-2 px-2 border-r border-slate-300 align-middle text-center font-bold">
                          {item.cartons}
                        </td>
                        <td className="py-3 px-3 border-r border-slate-300 align-middle text-center font-bold text-slate-700">
                          {item.quantity}
                        </td>
                         <td className="py-3 px-3 border-r border-slate-300 align-middle text-right font-bold text-slate-800">
                          {getSavedItemRate(item.rate, selectedQuoteForPreview.applyEventMarkup, selectedQuoteForPreview.eventMarkupPercent)}
                        </td>
                        <td className="py-3 px-3 align-middle text-right font-black text-slate-955">
                          ₹{(item.quantity * (parseFloat(getSavedItemRate(item.rate, selectedQuoteForPreview.applyEventMarkup, selectedQuoteForPreview.eventMarkupPercent)) || 0)).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations and Bank Info footer row */}
            <div className="mt-8 flex flex-col md:flex-row print:flex-row justify-between gap-6 items-start border-t border-slate-100 pt-6 break-inside-avoid print:pt-4">
              <div className="w-full md:w-3/5 print:w-[60%]">
                <div className="flex items-start">
                  {/* QR Code */}
                  {showBankDetails && companyInfo && (companyInfo.qrCode || companyInfo.upiId || (companyInfo.accountNumber && companyInfo.ifsc)) && (
                    <div className="w-16 h-16 mr-3 shrink-0">
                      {companyInfo.qrCode ? (
                        <img src={companyInfo.qrCode} alt="QR Code" className="w-full h-full object-contain" />
                      ) : companyInfo.upiId ? (
                        <QRCodeSVG
                          value={companyInfo.upiId}
                          size={64}
                          level="M"
                          className="w-full h-full"
                        />
                      ) : (
                        <QRCodeSVG
                          value={`upi://pay?pa=${companyInfo.accountNumber}@${companyInfo.ifsc}.ifsc.npci&pn=${companyInfo.name}`}
                          size={64}
                          level="M"
                          className="w-full h-full"
                        />
                      )}
                    </div>
                  )}
                  
                  {/* Vertical Divider */}
                  {showBankDetails && companyInfo && (
                    <div className="w-px bg-slate-200 mx-3 shrink-0 self-stretch"></div>
                  )}

                  {/* Bank Details */}
                  {showBankDetails && companyInfo && (
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-[9px] font-black uppercase text-slate-500 tracking-wider">
                        BANK ACCOUNT DETAILS (FOR PAYMENTS)
                      </p>
                      <div className="space-y-1.5 mt-2 text-[10px] text-slate-700 leading-tight">
                        <p className="flex items-center">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px] inline-block w-20">Bank Name:</span> 
                          <span className="font-extrabold text-slate-900">{companyInfo.bankName || "-"}</span>
                        </p>
                        <p className="flex items-center">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px] inline-block w-20">Account No:</span> 
                          <span className="font-extrabold text-slate-900">{companyInfo.accountNumber || "-"}</span>
                        </p>
                        <p className="flex items-center">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px] inline-block w-20">IFSC Code:</span> 
                          <span className="font-extrabold text-slate-900">{companyInfo.ifsc || "-"}</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Additional Notes */}
                {additionalNotes && (
                  <div className="text-[9px] text-slate-600 font-medium space-y-1 pt-4 leading-relaxed whitespace-pre-wrap">
                    <p className="uppercase text-slate-700 font-black mb-1">Additional Notes:</p>
                    <p>{additionalNotes}</p>
                  </div>
                )}

                {termsList.length > 0 && (
                  <div className="text-[9px] text-slate-400 font-semibold space-y-1 pt-4 leading-relaxed">
                    <p className="uppercase text-slate-500 font-black mb-1">Terms & Conditions:</p>
                    {termsList.map((term, i) => (
                      <p key={i}>{term}</p>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-full md:w-72 print:w-[35%] space-y-3 print:space-y-1.5 text-xs">
                <div className="flex justify-between font-bold text-slate-655">
                  <span>Amount</span>
                  <span>₹{selectedQuoteForPreview.items?.reduce((sum: number, item: any) => sum + (item.quantity * (parseFloat(getSavedItemRate(item.rate, selectedQuoteForPreview.applyEventMarkup, selectedQuoteForPreview.eventMarkupPercent)) || 0)), 0).toLocaleString("en-IN")}</span>
                </div>

                {selectedQuoteForPreview.taxInput && (
                  <div className="flex justify-between font-bold text-slate-500">
                    <span>GST ({selectedQuoteForPreview.taxInput})</span>
                    <span>
                      ₹{(() => {
                        const sTotal = selectedQuoteForPreview.items?.reduce((sum: number, item: any) => sum + (item.quantity * (parseFloat(getSavedItemRate(item.rate, selectedQuoteForPreview.applyEventMarkup, selectedQuoteForPreview.eventMarkupPercent)) || 0)), 0);
                        let tAmt = 0;
                        const rawTax = selectedQuoteForPreview.taxInput.trim();
                        if (rawTax) {
                          if (rawTax.endsWith("%")) {
                            tAmt = (sTotal * (parseFloat(rawTax.slice(0, -1)) || 0)) / 100;
                          } else {
                            tAmt = parseFloat(rawTax) || 0;
                          }
                        }
                        return tAmt;
                      })().toLocaleString("en-IN")}
                    </span>
                  </div>
                )}

                {selectedQuoteForPreview.otherAmount && parseFloat(selectedQuoteForPreview.otherAmount) > 0 && (
                  <div className="flex justify-between font-bold text-slate-500">
                    <span>{selectedQuoteForPreview.otherLabel || "Other"} (Deduction)</span>
                    <span>-₹{parseFloat(selectedQuoteForPreview.otherAmount).toLocaleString("en-IN")}</span>
                  </div>
                )}

                <hr className="border-slate-200" />

                <div className="flex justify-between text-base font-black text-slate-950 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span>Grand Total</span>
                  <span>₹{(selectedQuoteForPreview.total || 0).toLocaleString("en-IN")}</span>
                </div>
                
                {/* Modal Cash / Bank box */}
                {(selectedQuoteForPreview.cashAmount || selectedQuoteForPreview.bankAmount) && (
                  <div className="pt-2">
                    <div className="border border-slate-300 p-2 text-xs font-bold text-slate-700 space-y-1">
                      <div className="flex justify-between border-b border-dashed border-slate-300 pb-1">
                        <span>BANK:</span>
                        <span>{selectedQuoteForPreview.bankAmount ? `₹${parseFloat(selectedQuoteForPreview.bankAmount).toLocaleString("en-IN")}` : "-"}</span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span>CASH:</span>
                        <span>{selectedQuoteForPreview.cashAmount ? `₹${parseFloat(selectedQuoteForPreview.cashAmount).toLocaleString("en-IN")}` : "-"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {showAuthSign && (
                  <div className="text-right pt-16">
                    <div className="inline-block border-t border-slate-400 w-32 pt-1 text-center text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Authorized Sign
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>

    {/* ── HIDDEN DIRECT PRINT QUOTE ── */}
    {printQuoteData && typeof document !== "undefined" && createPortal(
      <div id="print-area" className="print-portal hidden print:block w-[794px] bg-white text-black p-6">
        <div className="flex flex-row gap-4 border-2 border-slate-900 overflow-hidden w-full">
          {/* Left Side: Logo Block (Snug zero margins, fixed width logo fit) */}
          <div className="w-28 bg-white text-slate-900 flex items-center justify-center text-center border-r-2 border-slate-900 min-h-[100px] shrink-0 overflow-hidden relative">
            {companyInfo?.logo ? (
              <img src={companyInfo.logo} alt="Logo" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <span className="text-lg font-black tracking-wider uppercase px-2 text-slate-850">
                {companyInfo?.name?.substring(0, 8) || "DIGISCALE"}
              </span>
            )}
          </div>

          {/* Right Side: Contact Info dynamically called from company profile settings */}
          <div className="flex-1 p-4 flex flex-col justify-center text-slate-800 text-xs font-semibold space-y-1">
            <h2 className="text-sm font-black text-slate-955 uppercase leading-tight">{companyInfo?.name || "DIGISCALE PRODUCT STUDIO"}</h2>
            <p className="text-[10px] leading-relaxed text-slate-600 uppercase">
              <span className="font-extrabold text-slate-800">ADDRESS:</span> {companyInfo?.address || "No company address set. Add in Settings."}
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px] text-slate-600 uppercase pt-0.5">
              <p>
                <span className="font-extrabold text-slate-800">MOBILE:</span> {companyInfo?.primaryPhone || "-"} {companyInfo?.secondaryPhone ? `| ${companyInfo.secondaryPhone}` : ""}
              </p>
              <p>
                <span className="font-extrabold text-slate-800">EMAIL:</span> {companyInfo?.email || "-"}
              </p>
            </div>
            {companyInfo?.gst && (
              <p className="text-[10px] text-slate-600 uppercase font-bold">
                <span className="font-extrabold text-slate-800">GSTIN:</span> {companyInfo.gst}
              </p>
            )}
          </div>
        </div>

        {/* CLIENT NAME Banner */}
        {printQuoteData.clientName ? (
          <div className="w-full bg-slate-100 text-center py-2.5 border-y-2 border-slate-900 mt-4 mb-3">
            <h3 className="text-sm font-black text-slate-955 tracking-widest uppercase">
              {printQuoteData.clientName}
            </h3>
          </div>
        ) : (
          <div className="h-4"></div>
        )}

        {/* Billing Details & Quotation Info Metadata Block */}
        <div className="flex flex-row justify-between gap-4 mt-2 mb-5 text-xs font-semibold text-slate-700 w-full">
          {/* Left Side: Customer Billing Details */}
          <div className="w-1/2">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Billing Details:</p>
            <p className="text-slate-900 font-extrabold">{printQuoteData.clientCompany || "-"}</p>
            <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">{printQuoteData.clientAddress || "-"}</p>
            <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed font-bold">{clientContact ? `Contact: ${clientContact}` : "-"}</p>
          </div>

          {/* Right Side: Quotation Info Metadata */}
          {(printQuoteData.quoteNumber || printQuoteData.quoteDate || printQuoteData.validUntil) && (
            <div className="text-right space-y-1 min-w-[220px] ml-auto">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Quotation Info:</p>
              <div className="mb-1.5">
                <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-widest text-slate-600 print:border-slate-300 print:text-slate-800">
                  B2B Quotation
                </span>
              </div>
              {printQuoteData.quoteNumber && <p className="text-[10px] text-slate-505 font-extrabold uppercase">Quote Ref: <span className="text-slate-900 font-black">{printQuoteData.quoteNumber}</span></p>}
              {printQuoteData.quoteDate && <p className="text-[10px] text-slate-505 font-extrabold uppercase">Date: <span className="text-slate-900 font-black">{formatDate(printQuoteData.quoteDate)}</span></p>}
              {printQuoteData.validUntil && <p className="text-[10px] text-slate-505 font-extrabold uppercase">Valid Till: <span className="text-slate-900 font-black">{formatDate(printQuoteData.validUntil)}</span></p>}
              {printQuoteData.staffName && <p className="text-[10px] text-slate-505 font-extrabold uppercase">Salesperson: <span className="text-slate-900 font-black">{printQuoteData.staffName}</span></p>}
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="mb-6">
            <table className="w-full text-left border-collapse border-2 border-slate-900">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-900 text-[10px] font-black text-slate-955 uppercase tracking-wider">
                  <th className="py-2.5 px-3 border-r border-slate-900 text-center w-10">SR.</th>
                  <th className="py-2.5 px-3 border-r border-slate-900 text-center w-24">PRODUCT PHOTO</th>
                  <th className="py-2.5 px-3 border-r border-slate-900 text-left min-w-[200px]">DESCRIPTION</th>
                  <th className="py-2.5 px-3 border-r border-slate-900 text-center w-20">CTNS</th>
                  <th className="py-2.5 px-3 border-r border-slate-900 text-center w-16">QTY</th>
                  <th className="py-2.5 px-3 border-r border-slate-900 text-right w-24">PRICE</th>
                  <th className="py-2.5 pl-3 pr-6 text-right w-28">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 text-xs font-semibold text-slate-900">
                {printQuoteData.items?.map((item: any, idx: number) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 break-inside-avoid">
                    {/* SR */}
                    <td className="py-3 px-3 border-r border-slate-300 text-center text-slate-500 font-bold">
                      {idx + 1}
                    </td>

                    {/* PRODUCT PHOTO */}
                    <td className="p-1 border-r border-slate-300 align-middle">
                      <div className="h-20 w-24 bg-white overflow-hidden flex items-center justify-center relative mx-auto shrink-0">
                          <AsyncProductImage productId={item.id} initialUrl={item.photoUrl} className="h-full w-full object-contain p-0.5" fallbackClassName="h-full w-full flex items-center justify-center bg-slate-50" iconClassName="h-5 w-5 text-slate-300" />
                      </div>
                    </td>

                    {/* PRODUCT NAME */}
                    <td className="py-3 px-3 border-r border-slate-300 align-middle">
                      <p className="font-extrabold text-slate-955 leading-tight">{item.name}</p>
                      {item.description && (
                        <p className="text-[11px] text-slate-500 font-semibold mt-1 bg-slate-50 border border-slate-200/50 rounded px-1.5 py-1 whitespace-pre-wrap">
                          {item.description}
                        </p>
                      )}
                      {item.location && (
                        <p className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 mt-1.5 inline-block select-none">
                          {item.location}
                        </p>
                      )}
                    </td>

                    {/* CTNS */}
                    <td className="py-2 px-2 border-r border-slate-300 align-middle text-center">
                      <span className="w-8 text-center font-extrabold text-slate-900 text-xs select-none">
                        {item.cartons}
                      </span>
                    </td>

                    {/* QTY */}
                    <td className="py-2 px-2 border-r border-slate-300 align-middle text-center">
                      <span className="w-10 text-center font-extrabold text-slate-900 text-xs select-none">
                        {item.quantity}
                      </span>
                    </td>

                    {/* PRICE */}
                    <td className="py-3 px-3 border-r border-slate-300 text-right align-middle font-bold text-slate-900">
                      {getSavedItemRate(item.rate, printQuoteData.applyEventMarkup, printQuoteData.eventMarkupPercent)}
                    </td>

                    {/* TOTAL */}
                    <td className="py-3 pl-3 pr-6 text-right align-middle font-black text-slate-900">
                      ₹{(item.quantity * (parseFloat(getSavedItemRate(item.rate, printQuoteData.applyEventMarkup, printQuoteData.eventMarkupPercent)) || 0)).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
        <div className="flex justify-between items-start break-inside-avoid pt-4">
          <div className="w-[60%]">
            <div className="flex flex-row items-center gap-2">
              {showBankDetails && companyInfo && (companyInfo.bankName || companyInfo.accountNumber) && (
                  <>
                    {/* QR Code rendered first on the left */}
                    {showBankDetails && companyInfo && ((companyInfo.accountNumber && companyInfo.ifsc) || companyInfo.upiId) && (
                      <div className="flex flex-col items-center justify-center shrink-0 w-[90px] h-[90px]">
                        {companyInfo.qrCode ? (
                          <img src={companyInfo.qrCode} alt="QR Code" className="w-full h-full object-contain" />
                        ) : companyInfo.upiId ? (
                          <QRCodeSVG
                            value={companyInfo.upiId}
                            size={80}
                            className="w-full h-full"
                          />
                        ) : (
                          <QRCodeSVG
                            value={`upi://pay?pa=${companyInfo.accountNumber}@${companyInfo.ifsc}.ifsc.npci&pn=${companyInfo.name}`}
                            size={80}
                            className="w-full h-full"
                          />
                        )}
                        {!companyInfo.qrCode && <span className="text-[7px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Scan to Pay</span>}
                      </div>
                    )}

                    {/* Bank Details rendered after QR code */}
                    {showBankDetails && companyInfo && (
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase text-slate-900 tracking-wider mb-1 bg-slate-100 py-0.5 px-2 inline-block rounded">BANK ACCOUNT DETAILS (FOR PAYMENTS)</p>
                        <div className="mt-1 space-y-0.5 px-1">
                          <p className="text-[11px] font-extrabold text-slate-900 uppercase">{companyInfo.bankName}</p>
                          <p className="text-[10px] font-bold text-slate-700">A/C: <span className="font-extrabold text-slate-900">{companyInfo.accountNumber}</span></p>
                          {companyInfo.ifsc && <p className="text-[10px] font-bold text-slate-700">IFSC: <span className="font-extrabold text-slate-900">{companyInfo.ifsc}</span></p>}
                        </div>
                      </div>
                    )}
                  </>
              )}
            </div>

            {/* Additional Notes */}
            {additionalNotes && (
              <div className="text-[9px] text-slate-600 font-medium space-y-1 pt-4 leading-relaxed whitespace-pre-wrap">
                <p className="uppercase text-slate-700 font-black mb-1">Additional Notes:</p>
                <p>{additionalNotes}</p>
              </div>
            )}

            {termsList.length > 0 && (
              <div className="text-[9px] text-slate-400 font-semibold space-y-1 pt-4 leading-relaxed">
                <p className="uppercase text-slate-500 font-black mb-1">Terms & Conditions:</p>
                {termsList.map((term, i) => (
                  <p key={i}>{term}</p>
                ))}
              </div>
            )}
          </div>
          <div className="w-[40%] text-xs flex flex-col gap-3 pt-2">
            <div className="space-y-2">
              <div className="flex justify-between font-bold text-slate-700 px-1">
                <span className="text-[11px]">Amount</span>
                <span className="text-sm">₹{printQuoteData.items?.reduce((sum: number, item: any) => sum + (item.quantity * (parseFloat(getSavedItemRate(item.rate, printQuoteData.applyEventMarkup, printQuoteData.eventMarkupPercent)) || 0)), 0).toLocaleString("en-IN")}</span>
              </div>
              {printQuoteData.taxInput && (
                <div className="flex justify-between font-bold text-slate-500 px-1 items-center">
                  <span className="text-[11px]">GST ({printQuoteData.taxInput})</span>
                  <span className="text-sm">
                    ₹{(() => {
                      const sTotal = printQuoteData.items?.reduce((sum: number, item: any) => sum + (item.quantity * (parseFloat(getSavedItemRate(item.rate, printQuoteData.applyEventMarkup, printQuoteData.eventMarkupPercent)) || 0)), 0);
                      let tAmt = 0;
                      const rawTax = String(printQuoteData.taxInput).trim();
                      if (rawTax) {
                        if (rawTax.endsWith("%")) {
                          tAmt = (sTotal * (parseFloat(rawTax.slice(0, -1)) || 0)) / 100;
                        } else {
                          tAmt = parseFloat(rawTax) || 0;
                        }
                      }
                      return tAmt;
                    })().toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              {printQuoteData.otherAmount && parseFloat(String(printQuoteData.otherAmount)) > 0 && (
                <div className="flex justify-between font-bold text-slate-500 px-1 items-center">
                  <span className="text-[11px]">{printQuoteData.otherLabel || "Other"}</span>
                  <span className="text-sm">-₹{parseFloat(String(printQuoteData.otherAmount)).toLocaleString("en-IN")}</span>
                </div>
              )}
              
              <div className="border-t border-slate-200 my-2"></div>
              
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-950 font-black">
                <span className="text-[12px] tracking-wide">Grand Total</span>
                <span className="text-base">₹{(printQuoteData.total || 0).toLocaleString("en-IN")}</span>
              </div>
            </div>
            
            {(printQuoteData.cashAmount || printQuoteData.bankAmount) && (
              <div className="pt-2 space-y-2 font-bold text-slate-650 px-1">
                {printQuoteData.cashAmount && (
                  <div className="flex justify-between items-center">
                    <span className="text-[11px]">Paid via Cash</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      ₹{parseFloat(String(printQuoteData.cashAmount)).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
                {printQuoteData.bankAmount && (
                  <div className="flex justify-between items-center">
                    <span className="text-[11px]">Paid via Bank</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      ₹{parseFloat(String(printQuoteData.bankAmount)).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {showAuthSign && (
              <div className="text-right pt-16 mt-auto">
                <div className="inline-block border-t border-slate-400 w-32 pt-1 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Authorized Sign
                </div>
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body
    )}

    {/* CONFIRM DIALOG MODAL */}
    {confirmModal.isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xl animate-in zoom-in-95 duration-150">
          <div className="flex items-start gap-4">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
              confirmModal.isDanger
                ? "bg-red-50 border border-red-100 text-red-600"
                : "bg-blue-50 border border-blue-100 text-blue-600"
            }`}>
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <h3 className="text-sm font-black text-slate-800">{confirmModal.title}</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">{confirmModal.message}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2.5">
            <button
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              className="px-4 py-2 border border-slate-200 bg-white text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition active:scale-95 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={confirmModal.onConfirm}
              className={`px-4 py-2 text-white text-xs font-bold rounded-xl transition active:scale-95 cursor-pointer ${
                confirmModal.isDanger ? "bg-red-600 hover:bg-red-750" : "bg-blue-600 hover:bg-blue-750"
              }`}
            >
              {confirmModal.confirmText}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Save Success Popup */}
    {showSavePopup && (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
        <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-4">
            <Check className="h-6 w-6 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Quotation Saved!</h3>
          <p className="text-sm text-slate-500 mb-6">Your quotation has been successfully saved to the database.</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setShowSavePopup(false);
                isLeavingRef.current = true;
                
                // Clear the form fields for next use
                setClientName("");
                setClientCompany("");
                setClientAddress("");
                setClientContact("");
                setSelectedItems([]);
                setTaxInput("");
                setAdditionalNotes("");
                setCashAmount("");
                setBankAmount("");
                
                // Redirect/Exit back to Collections
                window.location.href = "/projects";
              }}
              className="w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition active:scale-95"
            >
              Save & Close
            </button>
            <button
              onClick={() => setShowSavePopup(false)}
              className="w-full px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition active:scale-95"
            >
              Keep Editing
            </button>
          </div>
        </div>
      </div>
    )}

    {/* GORGEOUS CUSTOM CONFIRMATION DIALOG */}
    {showLeaveModal && (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print select-none animate-in fade-in duration-200">
        <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 relative overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col items-center text-center">
          
          {/* Close button at top-right */}
          <button
            onClick={() => {
              setShowLeaveModal(false);
              setPendingAction(null);
              setPendingNavigationUrl(null);
            }}
            className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Warning Icon Banner */}
          <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mb-4 border border-amber-100 shadow-inner shrink-0">
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-base font-black text-slate-900 uppercase tracking-wider mb-2">
            {lang === "gu" ? "અસંગ્રહિત ફેરફારો!" : lang === "hi" ? "असहेजे गए बदलाव!" : "Unsaved Changes!"}
          </h3>

          {/* Message Body */}
          <p className="text-xs text-slate-500 font-bold leading-relaxed mb-6 px-2">
            {lang === "gu" ? "તમે કોટેશન બનાવી રહ્યા છો. શું તમે ખરેખર બહાર જવા માંગો છો? તમારી બધી વિગતો ભૂંસાઈ જશે." :
             lang === "hi" ? "आप कोटेशन बना रहे हैं। क्या आप वास्तव में बाहर जाना चाहते हैं? आपका विवरण मिट जाएगा।" :
             "You have unsaved quotation items. Are you sure you want to leave this page? Your draft will be lost forever."}
          </p>

          {/* Action Buttons */}
          <div className="flex w-full gap-3">
            <button
              onClick={handleConfirmLeave}
              className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 py-3 text-xs font-black text-white transition active:scale-95 shadow-md hover:shadow-red-500/10 cursor-pointer uppercase tracking-wider"
            >
              {lang === "gu" ? "ભૂંસી નાખો" : lang === "hi" ? "हटाएँ" : "Discard & Leave"}
            </button>
            <button
              onClick={handleSaveAndExit}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-3 text-xs font-black text-white transition active:scale-95 shadow-md hover:shadow-blue-500/10 cursor-pointer uppercase tracking-wider"
            >
              {lang === "gu" ? "સેવ કરો અને બહાર નીકળો" : lang === "hi" ? "सहेजें और बाहर निकलें" : "Save & Exit"}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* CAMERA BARCODE SCANNER MODAL */}
    {showCameraScanner && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
        
        {/* Global Screen-Level Scan Notification Banner (iOS style top notification) */}
        {barcodeFeedback && (
          <div className={`fixed top-4 left-4 right-4 max-w-md mx-auto z-[200] px-4 py-3 rounded-2xl border shadow-xl flex items-center gap-3 transition-all duration-300 animate-in slide-in-from-top-5 ${
            barcodeFeedback.isError 
              ? "bg-rose-50 text-rose-800 border-rose-200" 
              : "bg-white/95 backdrop-blur-md text-slate-800 border-slate-100"
          }`}>
            {/* Product Image or Icon */}
            <div className="h-10 w-10 rounded-xl overflow-hidden border border-slate-150 bg-slate-50 shrink-0 flex items-center justify-center">
              {barcodeFeedback.isError ? (
                <span className="text-lg">⚠️</span>
              ) : barcodeFeedback.photoUrl ? (
                <img 
                  src={barcodeFeedback.photoUrl} 
                  alt={barcodeFeedback.text} 
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-lg">📦</span>
              )}
            </div>

            {/* Text Details */}
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 leading-none">
                {barcodeFeedback.isError 
                  ? (lang === "gu" ? "ભૂલ" : "Scan Error")
                  : (lang === "gu" ? "પ્રોડક્ટ ઉમેરાઈ" : "Product Added")
                }
              </p>
              <p className="text-xs font-bold text-slate-800 truncate mt-0.5 leading-tight">
                {barcodeFeedback.text}
              </p>
            </div>
          </div>
        )}

        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col overflow-hidden relative">
          {/* Header (Sticky at top) */}
          <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 shrink-0">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>📷</span>
              {lang === "gu" ? "કેમેરા બારકોડ સ્કેનર" : "Camera Barcode Scanner"}
            </h3>
            <button
              onClick={() => {
                setShowCameraScanner(false);
                setCameras([]);
                setCurrentCameraIndex(0);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {/* Body Content (Pure clear camera stream, no overlays) */}
          <div className="p-5 flex-1 overflow-y-auto space-y-4 flex flex-col justify-start">
            <p className="text-[11px] text-slate-500 font-bold text-center">
              {lang === "gu" ? "તમારા મોબાઈલ કેમેરાને પ્રોડક્ટ બારકોડ સામે રાખો" : "Align the barcode inside the camera to scan"}
            </p>
            
            {/* Camera scanner container */}
            <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50 mx-auto max-w-[320px] shrink-0">
              <div 
                id="camera-scanner-reader" 
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Sticky Bottom Actions Bar on Mobile */}
    {activeSubView === "create" && selectedItems.length > 0 && (
      <div className="lg:hidden fixed bottom-[65px] left-0 right-0 z-45 bg-white/90 backdrop-blur-md border-t border-slate-200/80 p-3 shadow-lg flex gap-3 px-4 no-print select-none">
        {permission === "edit" && (
          <button
            onClick={handleSaveQuotation}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-xs font-black text-white transition active:scale-95 cursor-pointer uppercase tracking-wider"
          >
            {isSaving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {isSaving ? t("savingQuotation") : t("saveQuotation")}
          </button>
        )}
        
        <button
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-xs font-black text-white transition active:scale-95 cursor-pointer uppercase tracking-wider"
        >
          <Printer className="h-4 w-4" />
          {t("printExportPdf")}
        </button>
      </div>
    )}

    {/* PDF GENERATION AND UPLOAD OVERLAY SPINNER */}
    {isGeneratingPdf && (
      <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print select-none">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 flex flex-col items-center text-center max-w-xs animate-in fade-in zoom-in-95 duration-200">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
            {lang === "gu" ? "કૃપા કરીને રાહ જુઓ..." : "Please Wait..."}
          </h3>
          <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
            {pdfFeedback || (lang === "gu" ? "પીડીએફ પર પ્રક્રિયા થઈ રહી છે..." : "Processing PDF file...")}
          </p>
        </div>
      </div>
    )}

    {/* PRINT SAVE CONFIRMATION MODAL */}
    {showPrintSaveModal && (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print select-none">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 w-full max-w-sm text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <Printer className="h-6 w-6" />
          </div>
          
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2">
            {lang === "gu" ? "સેવ અને પ્રિન્ટ?" : lang === "hi" ? "सेव और प्रिंट?" : "Save & Print?"}
          </h3>
          <p className="text-[11px] text-slate-500 font-bold leading-relaxed mb-6">
            {lang === "gu" 
              ? "શું તમે પ્રિન્ટ કરતા પહેલા આ કોટેશન બિલને સેવ કરવા માંગો છો?" 
              : lang === "hi" 
              ? "क्या आप प्रिंट करने से पहले इस कोटेशन बिल को सहेजना चाहते हैं?" 
              : "Would you like to save this quotation to history database before printing?"}
          </p>

          <div className="space-y-2">
            <button
              onClick={handleSaveAndPrint}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase py-3 transition active:scale-95 cursor-pointer shadow-sm tracking-wider"
            >
              <Check className="h-4 w-4" />
              {lang === "gu" ? "સેવ અને પ્રિન્ટ કરો" : lang === "hi" ? "सेव और प्रिंट करें" : "Save & Print"}
            </button>

            <button
              onClick={() => setShowPrintSaveModal(false)}
              className="w-full flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black uppercase py-2.5 transition active:scale-95 cursor-pointer"
            >
              {lang === "gu" ? "રદ કરો" : lang === "hi" ? "रद्द करें" : "Cancel"}
            </button>
          </div>
        </div>
      </div>
    )}

  </div>
);
}
