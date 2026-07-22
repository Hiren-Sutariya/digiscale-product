"use client";

import { useState, useEffect } from "react";
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
  Edit
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Collection {
  id: string;
  name: string;
  createdAt?: string;
  created_at?: string;
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
  ifsc: string;
  termsAndConditions?: string;
}

export default function QuotationView() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Accordion Toggles
  const [settingsOpen, setSettingsOpen] = useState(true); // Open by default
  const [clientOpen, setClientOpen] = useState(false);

  // Loaded Company Info from Profile
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [showBankDetails, setShowBankDetails] = useState<boolean>(true);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);

  // Authorized Sign option (Optional)
  const [showAuthSign, setShowAuthSign] = useState<boolean>(true);

  // Terms and conditions loaded from settings
  const [termsList, setTermsList] = useState<string[]>([]);

  // Client Info (Optional)
  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  
  // Quotation Metadata (Clean empty strings by default on mount as requested!)
  const [quoteDate, setQuoteDate] = useState("");
  const [quoteNumber, setQuoteNumber] = useState("");

  // Selected Quotation Items
  const [selectedItems, setSelectedItems] = useState<QuotationItem[]>([]);
  const [taxPercent, setTaxPercent] = useState<number | "">("");
  const [discountAmount, setDiscountAmount] = useState<string>("");

  // Saved Quotations & Subview History
  const [savedQuotes, setSavedQuotes] = useState<any[]>([]);
  const [activeSubView, setActiveSubView] = useState<"create" | "history">("create");
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [selectedQuoteForPreview, setSelectedQuoteForPreview] = useState<any | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomMode, setZoomMode] = useState<"fit" | "full">("fit");

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

  // Load configuration and aggregates on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedCols = localStorage.getItem("digiscale_collections");
      if (storedCols) {
        const cols: Collection[] = JSON.parse(storedCols);
        setCollections(cols);
        
        // Aggregate all products from all collections
        let allProds: Product[] = [];
        cols.forEach(col => {
          const storedProds = localStorage.getItem(`digiscale_products_${col.id}`);
          if (storedProds) {
            try {
              const parsed: Product[] = JSON.parse(storedProds);
              const tagged = parsed.map(p => ({
                ...p,
                collectionName: col.name,
                collectionId: col.id
              }));
              allProds = [...allProds, ...tagged];
            } catch (e) {
              console.error(e);
            }
          }
        });

        // Filter duplicates by product ID
        const uniqueProds: Product[] = [];
        const seenIds = new Set<string>();
        allProds.forEach(p => {
          if (!seenIds.has(p.id)) {
            seenIds.add(p.id);
            uniqueProds.push(p);
          }
        });
        setProducts(uniqueProds);
      }
    }

    // Fetch company info from profile settings
    setLoadingProfile(true);
    async function fetchCompanyInfo() {
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email || localStorage.getItem("user_email") || "";
      
      if (email) {
        const storedStr = localStorage.getItem(`digiscale_company_${email}`);
        if (storedStr) {
          const data = JSON.parse(storedStr);
          setCompanyInfo(data);
          setShowBankDetails(!!(data.bankName || data.accountNumber));
          setTermsList(parseTerms(data.termsAndConditions));
        } else {
          setTermsList(parseTerms(""));
        }
      } else {
        setTermsList(parseTerms(""));
      }
      setLoadingProfile(false);
    }
    fetchCompanyInfo();

    // Fetch saved quotations history
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("digiscale_quotations");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSavedQuotes(parsed);
          const nextNum = getNextQuoteNumber(parsed);
          setQuoteNumber(nextNum);
        } catch (e) {
          console.error("Failed to parse saved quotations:", e);
        }
      } else {
        setQuoteNumber("Q-1");
      }
    }
  }, []);

  const handleSaveQuotation = () => {
    if (selectedItems.length === 0) return;
    
    const defaultQuoteNum = getNextQuoteNumber(savedQuotes);
    const finalQuoteNumber = quoteNumber.trim() || defaultQuoteNum;

    const newQuote = {
      id: Date.now().toString(),
      quoteNumber: finalQuoteNumber,
      clientName,
      clientCompany,
      clientAddress,
      quoteDate,
      items: selectedItems,
      taxPercent,
      discountAmount,
      total,
      createdAt: new Date().toISOString()
    };

    let updatedQuotes = [];
    const existingIndex = savedQuotes.findIndex(q => q.quoteNumber === newQuote.quoteNumber);
    if (existingIndex > -1) {
      updatedQuotes = [...savedQuotes];
      updatedQuotes[existingIndex] = { ...savedQuotes[existingIndex], ...newQuote, id: savedQuotes[existingIndex].id };
      setSaveSuccessMessage("Quotation updated successfully!");
    } else {
      updatedQuotes = [newQuote, ...savedQuotes];
      setSaveSuccessMessage("Quotation saved successfully!");
      // Update state to next sequence number
      const nextNum = getNextQuoteNumber(updatedQuotes);
      setQuoteNumber(nextNum);
    }

    setSavedQuotes(updatedQuotes);
    localStorage.setItem("digiscale_quotations", JSON.stringify(updatedQuotes));

    setTimeout(() => {
      setSaveSuccessMessage(null);
    }, 3000);
  };

  const handleLoadQuote = (quote: any) => {
    setQuoteNumber(quote.quoteNumber || "");
    setClientName(quote.clientName || "");
    setClientCompany(quote.clientCompany || "");
    setClientAddress(quote.clientAddress || "");
    setQuoteDate(quote.quoteDate || "");
    setSelectedItems(quote.items || []);
    setTaxPercent(quote.taxPercent ?? "");
    setDiscountAmount(quote.discountAmount || "");
    setActiveSubView("create");
  };

  const handleDeleteQuote = (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this quotation?");
    if (!confirmDelete) return;

    const updated = savedQuotes.filter(q => q.id !== id);
    setSavedQuotes(updated);
    localStorage.setItem("digiscale_quotations", JSON.stringify(updated));
  };

  const handlePrintQuoteDirect = (quote: any) => {
    setQuoteNumber(quote.quoteNumber || "");
    setClientName(quote.clientName || "");
    setClientCompany(quote.clientCompany || "");
    setClientAddress(quote.clientAddress || "");
    setQuoteDate(quote.quoteDate || "");
    setSelectedItems(quote.items || []);
    setTaxPercent(quote.taxPercent ?? "");
    setDiscountAmount(quote.discountAmount || "");
    setActiveSubView("create");
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Toggle item selection
  const handleToggleProduct = (product: Product) => {
    const exists = selectedItems.find(item => item.id === product.id);
    if (exists) {
      setSelectedItems(selectedItems.filter(item => item.id !== product.id));
    } else {
      const cQty = product.cartonQty || 1;
      setSelectedItems([
        ...selectedItems,
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
          description: product.description
        }
      ]);
    }
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

  // Filter products by global search query
  const filteredProducts = products.filter(p => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return false; // Show nothing if query is empty
    return (
      p.name?.toLowerCase().includes(q) ||
      p.color?.toLowerCase().includes(q) ||
      p.length?.toLowerCase().includes(q) ||
      p.collectionName?.toLowerCase().includes(q)
    );
  });

  // Calculations
  const subtotal = selectedItems.reduce((sum, item) => sum + (item.quantity * (parseFloat(item.rate) || 0)), 0);
  
  const taxRate = typeof taxPercent === "number" ? taxPercent : 0;
  
  // Calculate discount based on value or percentage (e.g. "10%")
  let discountVal = 0;
  const rawDiscount = discountAmount.trim();
  if (rawDiscount) {
    if (rawDiscount.endsWith("%")) {
      const pct = parseFloat(rawDiscount.slice(0, -1)) || 0;
      discountVal = (subtotal * pct) / 100;
    } else {
      discountVal = parseFloat(rawDiscount) || 0;
    }
  }
  
  const taxAmount = (subtotal * taxRate) / 100;
  const total = Math.max(0, subtotal + taxAmount - discountVal);

  // Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-6 md:px-8">
      {/* CSS @media print overrides: Removes URL, date/time header, page numbers, Safari bg colors, and extra blank pages */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 0 !important; /* Suppresses default browser header and footer */
          }
          html, body {
            background-color: white !important;
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Hide everything except the print area */
          body * {
            visibility: hidden !important;
          }
          #print-area, #print-area * {
            visibility: visible !important;
          }
          #print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 1.2cm !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: white !important;
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

      {/* Header */}
      <div className="no-print flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Quotation Generator
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          {activeSubView === "create" && (
            <button
              onClick={handleSaveQuotation}
              disabled={selectedItems.length === 0}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white transition disabled:opacity-50 active:scale-95 shadow-sm"
            >
              <Check className="h-4 w-4" />
              Save Quotation
            </button>
          )}

          <button
            onClick={handlePrint}
            disabled={selectedItems.length === 0}
            className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white transition disabled:opacity-50 active:scale-95 shadow-sm"
          >
            <Printer className="h-4 w-4" />
            Print / Export PDF
          </button>
        </div>
      </div>

      {/* Subview switcher tabs */}
      <div className="no-print flex gap-2 mb-6">
        <button
          onClick={() => setActiveSubView("create")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeSubView === "create"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          📝 Create Quotation
        </button>
        <button
          onClick={() => setActiveSubView("history")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
            activeSubView === "history"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          📜 Saved History ({savedQuotes.length})
        </button>
      </div>

      {/* Save Success Message */}
      {saveSuccessMessage && (
        <div className="no-print bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-semibold mb-6 flex items-center justify-between animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            {saveSuccessMessage}
          </div>
          <button onClick={() => setSaveSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-850">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {activeSubView === "history" ? (
        <div className="no-print bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
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
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3.5 px-4">Ref No.</th>
                    <th className="py-3.5 px-4">Client / Company</th>
                    <th className="py-3.5 px-4">Quote Date</th>
                    <th className="py-3.5 px-4 text-center">Items</th>
                    <th className="py-3.5 px-4 text-right">Grand Total</th>
                    <th className="py-3.5 px-4 text-center w-40">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {savedQuotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-slate-50/40">
                      <td className="py-4 px-4 font-black text-slate-900">{quote.quoteNumber}</td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-800">{quote.clientName || "—"}</p>
                        {quote.clientCompany && <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{quote.clientCompany}</p>}
                      </td>
                      <td className="py-4 px-4">{quote.quoteDate ? formatDate(quote.quoteDate) : "—"}</td>
                      <td className="py-4 px-4 text-center">{quote.items?.length || 0}</td>
                      <td className="py-4 px-4 text-right font-black text-slate-900">
                        ₹{(quote.total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedQuoteForPreview(quote)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 rounded-lg border border-blue-100 transition active:scale-95 cursor-pointer"
                            title="Preview PDF"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handlePrintQuoteDirect(quote)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-600 rounded-lg border border-emerald-100 transition active:scale-95 cursor-pointer"
                            title="Direct Print PDF"
                          >
                            <Printer className="h-4 w-4" />
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
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Inputs Panels (no-print) — Unified Scroll */}
        <div className="no-print lg:col-span-4 space-y-4 pr-1 select-none">
          
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
              className="w-full flex items-center justify-between bg-slate-55/40 hover:bg-slate-100/60 px-5 py-4 transition text-left border-b border-slate-250/30"
            >
              <span className="text-[10px] font-black tracking-widest text-slate-500 flex items-center gap-2 uppercase">
                <Settings className="h-4 w-4 text-slate-400" />
                1. Quotation Settings
              </span>
              {settingsOpen ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>
            
            {settingsOpen && (
              <div className="p-5 space-y-4 animate-in slide-in-from-top-2 duration-150">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Quote Ref No
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
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-700 font-extrabold text-xs"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Quote Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={quoteDate}
                        onChange={(e) => setQuoteDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-205 bg-white pl-3.5 pr-8 py-2 text-xs font-semibold outline-none transition focus:border-blue-500"
                      />
                      {quoteDate && (
                        <button
                          type="button"
                          onClick={() => setQuoteDate("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-455 hover:text-slate-700 font-extrabold text-xs"
                        >
                          ×
                        </button>
                      )}
                    </div>
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
                        className="rounded border-slate-350 text-blue-600 focus:ring-blue-500/10 h-4 w-4"
                      />
                      <label htmlFor="showBank" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                        Include Bank Details on PDF
                      </label>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showAuthSignCheckbox"
                      checked={showAuthSign}
                      onChange={(e) => setShowAuthSign(e.target.checked)}
                      className="rounded border-slate-350 text-blue-600 focus:ring-blue-500/10 h-4 w-4"
                    />
                    <label htmlFor="showAuthSignCheckbox" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                      Include Authorized Sign Line
                    </label>
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
              className="w-full flex items-center justify-between bg-slate-55/40 hover:bg-slate-100/60 px-5 py-4 transition text-left border-b border-slate-250/30"
            >
              <span className="text-[10px] font-black tracking-widest text-slate-500 flex items-center gap-2 uppercase">
                <User className="h-4 w-4 text-slate-400" />
                2. Client Details (Optional)
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
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Customer Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Rajesh Kumar"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs font-semibold outline-none transition focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Company Name
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Kumar Textile Industries"
                        value={clientCompany}
                        onChange={(e) => setClientCompany(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs font-semibold outline-none transition focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Address & Contact Details
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. 104, Ring Road, Surat, Gujarat"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold outline-none transition focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Global Search and Select Products (Rounded Search Bar) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-450 block mb-2">
                3. Search & Add Products
              </h3>
              
              {/* Standardized Global Finder Search bar matching Collections/Warehouse */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="🌐 Global Finder (Search all products)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-10 py-2.5 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-550 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-650 rounded-lg hover:bg-slate-100 transition"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <p className="text-[10px] font-bold text-slate-455 uppercase tracking-wider mb-2.5">
                Search Results
              </p>

              {searchQuery.trim() === "" ? (
                <p className="text-xs text-slate-400 italic py-5 text-center font-medium">
                  Type product name, color, or code to search...
                </p>
              ) : filteredProducts.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-5 text-center font-medium">
                  No products found matching your search.
                </p>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-2 pr-1 animate-in fade-in duration-100">
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

                        {p.photoUrl ? (
                          <img src={p.photoUrl} alt="" className="h-8 w-8 rounded object-cover border border-slate-200 shrink-0" />
                        ) : (
                          <div className="h-8 w-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                            <FileImage className="h-4 w-4" />
                          </div>
                        )}

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
                          <p className="text-[10px] text-slate-455 font-semibold mt-1">
                            Price Code: {p.rate || "—"} · Carton Qty: {p.cartonQty || 1}
                          </p>
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
        </div>

        {/* Right Side: Print Preview Container */}
        <div className="lg:col-span-8">
          
          <div className="no-print mb-4 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Document Preview
            </p>
            <p className="text-[10px] text-slate-400 font-semibold italic">
              * Renders final printed document dimensions below
            </p>
          </div>

          {/* The quotation design template */}
          <div id="print-area" className="print-container w-full rounded-3xl border border-slate-200 bg-white p-8 md:p-10 shadow-md">
            
            {/* Invoice Header */}
            <div className="flex flex-col sm:flex-row gap-4 border-2 border-slate-900 overflow-hidden">
              {/* Left Side: Logo Block (Snug zero margins, fixed width logo fit) */}
              <div className="sm:w-28 bg-white text-slate-900 flex items-center justify-center text-center border-b-2 sm:border-b-0 sm:border-r-2 border-slate-900 min-h-[100px] shrink-0 overflow-hidden relative">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-slate-655 uppercase pt-0.5">
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
            <div className="flex flex-col sm:flex-row justify-between gap-4 mt-2 mb-5 text-xs font-semibold text-slate-700">
              {/* Left Side: Customer Billing Details */}
              {(clientCompany || clientAddress) ? (
                <div className="sm:w-1/2">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Billing Details:</p>
                  {clientCompany && <p className="text-slate-900 font-extrabold">{clientCompany}</p>}
                  {clientAddress && <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">{clientAddress}</p>}
                </div>
              ) : (
                <div className="sm:w-1/2"></div>
              )}

              {/* Right Side: Quotation Info Metadata */}
              {(quoteNumber || quoteDate) && (
                <div className="text-left sm:text-right space-y-1 min-w-[220px] ml-auto">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Quotation Info:</p>
                  {quoteNumber && <p className="text-[10px] text-slate-505 font-extrabold uppercase">Quote Ref: <span className="text-slate-900 font-black">{quoteNumber}</span></p>}
                  {quoteDate && <p className="text-[10px] text-slate-505 font-extrabold uppercase">Date: <span className="text-slate-900 font-black">{formatDate(quoteDate)}</span></p>}
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="border border-slate-900 overflow-hidden rounded-lg">
              {selectedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <FileText className="h-10 w-10 text-slate-200 mb-2" />
                  <p className="text-xs italic font-medium">No items selected.</p>
                  <p className="text-[10px] mt-1 text-slate-400">Search and check boxes in the left list to add items.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b-2 border-slate-900 text-[10px] font-black text-slate-955 uppercase tracking-wider">
                      <th className="py-2.5 px-3 border-r border-slate-900 text-center w-10">SR.</th>
                      <th className="py-2.5 px-3 border-r border-slate-900 text-center w-28">PRODUCT PHOTO</th>
                      <th className="py-2.5 px-3 border-r border-slate-900 text-left min-w-[200px]">PRODUCT NAME</th>
                      <th className="py-2.5 px-3 border-r border-slate-900 text-center w-20">CTNS</th>
                      <th className="py-2.5 px-3 border-r border-slate-900 text-center w-16">QTY</th>
                      <th className="py-2.5 px-3 border-r border-slate-900 text-right w-24">PRICE CODE</th>
                      <th className="py-2.5 px-3 text-right w-28">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 text-xs font-semibold text-slate-900">
                    {selectedItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        {/* SR */}
                        <td className="py-3 px-3 border-r border-slate-300 text-center text-slate-500 font-bold">
                          {idx + 1}
                        </td>

                        {/* PRODUCT PHOTO */}
                        <td className="p-1 border-r border-slate-300 align-middle">
                          <div className="h-20 w-24 bg-white overflow-hidden flex items-center justify-center relative mx-auto shrink-0">
                            {item.photoUrl ? (
                              <img src={item.photoUrl} alt="" className="h-full w-full object-contain p-0.5" />
                            ) : (
                              <FileImage className="h-5 w-5 text-slate-300" />
                            )}
                          </div>
                        </td>

                        {/* PRODUCT NAME */}
                        <td className="py-3 px-3 border-r border-slate-300 align-middle">
                          <p className="font-extrabold text-slate-955 leading-tight">{item.name}</p>
                        </td>

                        {/* CTNS */}
                        <td className="py-2 px-2 border-r border-slate-300 align-middle text-center">
                          <div className="no-print flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateCartons(item.id, item.cartons - 1)}
                              className="h-7 w-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center font-extrabold text-slate-655 hover:bg-slate-50 hover:border-slate-300 active:scale-90 transition shadow-sm"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-extrabold text-slate-900 text-xs select-none">
                              {item.cartons}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateCartons(item.id, item.cartons + 1)}
                              className="h-7 w-7 rounded-lg border border-slate-200 bg-white flex items-center justify-center font-extrabold text-slate-655 hover:bg-slate-50 hover:border-slate-300 active:scale-90 transition shadow-sm"
                            >
                              +
                            </button>
                          </div>
                          <span className="hidden print:inline font-bold">
                            {item.cartons}
                          </span>
                        </td>

                        {/* QTY */}
                        <td className="py-3 px-3 border-r border-slate-300 align-middle text-center font-bold text-slate-700">
                          {item.quantity}
                        </td>

                        {/* PRICE CODE */}
                        <td className="py-3 px-3 border-r border-slate-300 align-middle text-right font-bold text-slate-800">
                          {item.rate}
                        </td>

                        {/* TOTAL */}
                        <td className="py-3 px-3 align-middle text-right font-black text-slate-950">
                          ₹{(item.quantity * (parseFloat(item.rate) || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Calculations and Bank Info footer row */}
            {selectedItems.length > 0 && (
              <div className="mt-6 flex flex-col md:flex-row justify-between gap-6 items-start">
                
                {/* Stacked Vertical Bank Details & Terms & Conditions */}
                <div className="w-full md:w-3/5 space-y-3">
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

                  {/* Customizable Terms and Conditions */}
                  {termsList.length > 0 && (
                    <div className="text-[9px] text-slate-400 font-semibold space-y-1 pt-2 leading-relaxed">
                      <p className="uppercase text-slate-500 font-black mb-1">Terms & Conditions:</p>
                      {termsList.map((term, i) => (
                        <p key={i}>{term}</p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reordered Totals Summary */}
                <div className="w-full md:w-72 space-y-3 text-xs">
                  {/* 1. Amount */}
                  <div className="flex justify-between font-bold text-slate-655">
                    <span>Amount</span>
                    <span>₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  {/* 2. GST */}
                  <div className={`flex justify-between font-bold text-slate-500 items-center ${taxRate > 0 ? "" : "print:hidden"}`}>
                    <span className="flex items-center gap-1.5">
                      <span>GST %</span>
                      <span className="no-print flex items-center gap-0.5">
                        (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0"
                          value={taxPercent}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTaxPercent(val === "" ? "" : Number(val));
                          }}
                          className="w-10 text-center font-bold text-slate-800 bg-slate-100 border border-slate-200 rounded py-0.5 outline-none text-[10px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        %)
                      </span>
                      <span className="hidden print:inline">({taxPercent || 0}%)</span>
                    </span>
                    <span>
                      ₹{taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* 3. Discount */}
                  <div className={`flex justify-between font-bold text-red-655 items-center ${discountVal > 0 ? "" : "print:hidden"}`}>
                    <span className="flex items-center gap-1.5">
                      <span>Discount</span>
                      <span className="no-print flex items-center gap-0.5">
                        (
                        <input
                          type="text"
                          placeholder="e.g. 10% or 500"
                          value={discountAmount}
                          onChange={(e) => {
                            setDiscountAmount(e.target.value);
                          }}
                          className="w-24 text-right font-bold text-slate-800 bg-slate-100 border border-slate-200 rounded py-0.5 px-1.5 outline-none text-[10px]"
                        />
                        )
                      </span>
                      {discountAmount && (
                        <span className="hidden print:inline">({discountAmount})</span>
                      )}
                    </span>
                    <span>
                      - ₹{discountVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <hr className="border-slate-200" />

                  {/* 4. Grand Total */}
                  <div className="flex justify-between text-base font-black text-slate-950 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span>Grand Total</span>
                    <span>₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  
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
              onClick={() => {
                setTimeout(() => {
                  window.print();
                }, 100);
              }}
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
              <div className="flex flex-col sm:flex-row gap-4 border-2 border-slate-900 overflow-hidden">
                <div className="sm:w-28 bg-white text-slate-900 flex items-center justify-center text-center border-b-2 sm:border-b-0 sm:border-r-2 border-slate-900 min-h-[100px] shrink-0 overflow-hidden relative">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] text-slate-655 uppercase pt-0.5">
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
              <div className="flex flex-col sm:flex-row justify-between gap-4 mt-2 mb-5 text-xs font-semibold text-slate-700">
                {(selectedQuoteForPreview.clientCompany || selectedQuoteForPreview.clientAddress) ? (
                  <div className="sm:w-1/2">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Billing Details:</p>
                    {selectedQuoteForPreview.clientCompany && <p className="text-slate-900 font-extrabold">{selectedQuoteForPreview.clientCompany}</p>}
                    {selectedQuoteForPreview.clientAddress && <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">{selectedQuoteForPreview.clientAddress}</p>}
                  </div>
                ) : (
                  <div className="sm:w-1/2"></div>
                )}

                {(selectedQuoteForPreview.quoteNumber || selectedQuoteForPreview.quoteDate) && (
                  <div className="text-left sm:text-right space-y-1 min-w-[220px] ml-auto">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Quotation Info:</p>
                    {selectedQuoteForPreview.quoteNumber && <p className="text-[10px] text-slate-550 font-extrabold uppercase">Quote Ref: <span className="text-slate-900 font-black">{selectedQuoteForPreview.quoteNumber}</span></p>}
                    {selectedQuoteForPreview.quoteDate && <p className="text-[10px] text-slate-550 font-extrabold uppercase">Date: <span className="text-slate-900 font-black">{formatDate(selectedQuoteForPreview.quoteDate)}</span></p>}
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
                      <th className="py-2.5 px-3 border-r border-slate-900 text-left min-w-[200px]">PRODUCT NAME</th>
                      <th className="py-2.5 px-3 border-r border-slate-900 text-center w-20">CTNS</th>
                      <th className="py-2.5 px-3 border-r border-slate-900 text-center w-16">QTY</th>
                      <th className="py-2.5 px-3 border-r border-slate-900 text-right w-24">PRICE CODE</th>
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
                            {item.photoUrl ? (
                              <img src={item.photoUrl} alt="" className="h-full w-full object-contain p-0.5" />
                            ) : (
                              <FileImage className="h-5 w-5 text-slate-300" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 border-r border-slate-300 align-middle">
                          <p className="font-extrabold text-slate-955 leading-tight">{item.name}</p>
                        </td>
                        <td className="py-2 px-2 border-r border-slate-300 align-middle text-center font-bold">
                          {item.cartons}
                        </td>
                        <td className="py-3 px-3 border-r border-slate-300 align-middle text-center font-bold text-slate-700">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-3 border-r border-slate-300 align-middle text-right font-bold text-slate-800">
                          {item.rate}
                        </td>
                        <td className="py-3 px-3 align-middle text-right font-black text-slate-955">
                          ₹{(item.quantity * (parseFloat(item.rate) || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations and Bank Info footer row */}
            <div className="mt-8 flex flex-col md:flex-row justify-between gap-6 items-end border-t border-slate-100 pt-6">
              <div className="w-full md:w-3/5 space-y-3">
                {showBankDetails && companyInfo && (companyInfo.bankName || companyInfo.accountNumber) && (
                  <div>
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

                {termsList.length > 0 && (
                  <div className="text-[9px] text-slate-400 font-semibold space-y-1 pt-2 leading-relaxed">
                    <p className="uppercase text-slate-500 font-black mb-1">Terms & Conditions:</p>
                    {termsList.map((term, i) => (
                      <p key={i}>{term}</p>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-full md:w-72 space-y-3 text-xs">
                <div className="flex justify-between font-bold text-slate-655">
                  <span>Amount</span>
                  <span>₹{selectedQuoteForPreview.items?.reduce((sum: number, item: any) => sum + (item.quantity * (parseFloat(item.rate) || 0)), 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {typeof selectedQuoteForPreview.taxPercent === "number" && selectedQuoteForPreview.taxPercent > 0 && (
                  <div className="flex justify-between font-bold text-slate-500">
                    <span>GST ({selectedQuoteForPreview.taxPercent}%)</span>
                    <span>₹{((selectedQuoteForPreview.items?.reduce((sum: number, item: any) => sum + (item.quantity * (parseFloat(item.rate) || 0)), 0) * selectedQuoteForPreview.taxPercent) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}

                {selectedQuoteForPreview.discountAmount && (
                  <div className="flex justify-between font-bold text-red-655">
                    <span>Discount ({selectedQuoteForPreview.discountAmount})</span>
                    <span>
                      - ₹{(
                        selectedQuoteForPreview.discountAmount.endsWith("%")
                          ? (selectedQuoteForPreview.items?.reduce((sum: number, item: any) => sum + (item.quantity * (parseFloat(item.rate) || 0)), 0) * parseFloat(selectedQuoteForPreview.discountAmount.slice(0, -1))) / 100
                          : parseFloat(selectedQuoteForPreview.discountAmount) || 0
                      ).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                <hr className="border-slate-200" />

                <div className="flex justify-between text-base font-black text-slate-950 bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <span>Grand Total</span>
                  <span>₹{(selectedQuoteForPreview.total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                
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
);
}
