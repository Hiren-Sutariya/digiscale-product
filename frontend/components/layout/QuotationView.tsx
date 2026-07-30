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
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from 'qrcode.react';
import { getUserProfile, getUserSettings } from "@/services/api";
import { supabase } from "@/lib/supabase";
import { getCache, setCache } from "@/lib/cache";

// --- Sub-components for optimizations ---
function AsyncProductImage({ productId, initialUrl, className, fallbackClassName, iconClassName }: { productId: string, initialUrl?: string, className: string, fallbackClassName: string, iconClassName: string }) {
  const [url, setUrl] = useState<string | null>(initialUrl || null);
  
  useEffect(() => {
    if (url) return;
    let mounted = true;
    supabase.from('products').select('photoUrl').eq('id', productId).single().then(({ data }) => {
      if (mounted && data?.photoUrl) setUrl(data.photoUrl);
    });
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

export default function QuotationView() {
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  
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
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  
  // Quotation Metadata (Clean empty strings by default on mount as requested!)
  const getLocalDateString = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };
  const [quoteDate, setQuoteDate] = useState<string>(() => getLocalDateString());
  const [quoteNumber, setQuoteNumber] = useState("");

  // Selected Quotation Items
  const [selectedItems, setSelectedItems] = useState<QuotationItem[]>([]);
  const [taxInput, setTaxInput] = useState<string>("");
  const [cashAmount, setCashAmount] = useState<string>("");
  const [bankAmount, setBankAmount] = useState<string>("");

  // Event Price Markup states
  const [applyEventMarkup, setApplyEventMarkup] = useState<boolean>(false);
  const [eventMarkupPercent, setEventMarkupPercent] = useState<number>(25);

  // Saved Quotations & Subview History
  const [savedQuotes, setSavedQuotes] = useState<any[]>([]);
  const [activeSubView, setActiveSubView] = useState<"create" | "history">("create");
  const [historyTab, setHistoryTab] = useState<"follow_up" | "done">("follow_up");
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [selectedQuoteForPreview, setSelectedQuoteForPreview] = useState<any | null>(null);
  const [printQuoteData, setPrintQuoteData] = useState<any | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomMode, setZoomMode] = useState<"fit" | "full">("fit");
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", confirmText: "", onConfirm: () => {} });

  // Derived unique clients from saved quotes for suggestions
  const uniqueClients = useMemo(() => {
    const clientsMap = new Map();
    savedQuotes.forEach(q => {
      if (q.clientName && !clientsMap.has(q.clientName.toLowerCase())) {
        clientsMap.set(q.clientName.toLowerCase(), {
          name: q.clientName,
          company: q.clientCompany || "",
          address: q.clientAddress || ""
        });
      }
    });
    return Array.from(clientsMap.values());
  }, [savedQuotes]);

  const filteredClientSuggestions = useMemo(() => {
    if (!clientName) return [];
    const searchLower = clientName.toLowerCase();
    return uniqueClients.filter(c => 
      (c.name?.toLowerCase() || "").includes(searchLower) || 
      (c.company?.toLowerCase() || "").includes(searchLower)
    );
  }, [clientName, uniqueClients]);

  useEffect(() => {
    if (printQuoteData) {
      document.body.classList.add('is-printing-portal');
    } else {
      document.body.classList.remove('is-printing-portal');
    }
    return () => document.body.classList.remove('is-printing-portal');
  }, [printQuoteData]);

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
          setQuoteNumber(cachedData.quoteNumber);
        }

        // Fetch all data from Supabase concurrently for faster loading
        const [
          { data: colsData, error: colsErr },
          { data: prodsData, error: prodsErr },
          { data: assignsData, error: assignsErr },
          { data: quotesData, error: quotesErr }
        ] = await Promise.all([
          supabase.from('collections').select('*').eq('user_id', userId),
          supabase.from('products').select('id, name, stock, cartonQty, rate, color, length, collection_id, description').eq('user_id', userId),
          supabase.from('warehouse_assignments').select('*').eq('user_id', userId),
          supabase.from('quotations').select('id, quote_number, client_name, client_company, client_address, quote_date, tax_input, cash_amount, bank_amount, total_amount, apply_event_markup, event_markup_percent, created_at, is_order_done').eq('user_id', userId).order('created_at', { ascending: false })
        ]);

        if (colsErr) throw colsErr;
        if (prodsErr) throw prodsErr;
        if (assignsErr) throw assignsErr;
        if (quotesErr) throw quotesErr;

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
          const parsedQuotes = quotesData.map((q: any) => ({
            id: q.id,
            quoteNumber: q.quote_number,
            clientName: q.client_name,
            clientCompany: q.client_company,
            clientAddress: q.client_address,
            quoteDate: q.quote_date,
            taxInput: q.tax_input || "",
            cashAmount: q.cash_amount?.toString() || "",
            bankAmount: q.bank_amount?.toString() || "",
            total: q.total_amount,
            applyEventMarkup: q.apply_event_markup,
            eventMarkupPercent: q.event_markup_percent,
            createdAt: q.created_at,
            isOrderDone: q.is_order_done || false,
            items: q.items ? (typeof q.items === 'string' ? JSON.parse(q.items) : q.items) : undefined
          }));
          setSavedQuotes(parsedQuotes);
          const nextNum = getNextQuoteNumber(parsedQuotes);
          setQuoteNumber(nextNum);
          
          const payload = {
            collections: colsData || [],
            products: mappedProds,
            savedQuotes: parsedQuotes,
            quoteNumber: nextNum
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
            quoteNumber: "Q-1"
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
            const uId = profile.id.toString();
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

  const handleSaveQuotation = async () => {
    if (selectedItems.length === 0) return;
    if (!currentUserId) {
      alert("User session not found. Please log in again.");
      return;
    }
    
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
      taxInput,
      cashAmount,
      bankAmount,
      total,
      applyEventMarkup,
      eventMarkupPercent,
      isOrderDone: false, // Default for new, will be overwritten if existing
      createdAt: new Date().toISOString()
    };

    let updatedQuotes = [];
    const existingIndex = savedQuotes.findIndex(q => q.quoteNumber === newQuote.quoteNumber);
    let idToUpdate = newQuote.id;

    if (existingIndex > -1) {
      updatedQuotes = [...savedQuotes];
      idToUpdate = savedQuotes[existingIndex].id;
      newQuote.isOrderDone = savedQuotes[existingIndex].isOrderDone;
      updatedQuotes[existingIndex] = { ...savedQuotes[existingIndex], ...newQuote, id: idToUpdate };
    } else {
      updatedQuotes = [newQuote, ...savedQuotes];
    }

    try {
      const { error } = await supabase.from('quotations').upsert({
        id: idToUpdate,
        quote_number: finalQuoteNumber,
        client_name: clientName,
        client_company: clientCompany,
        client_address: clientAddress,
        quote_date: quoteDate,
        tax_input: taxInput,
        cash_amount: cashAmount ? parseFloat(cashAmount) : 0,
        bank_amount: bankAmount ? parseFloat(bankAmount) : 0,
        total_amount: total,
        apply_event_markup: applyEventMarkup,
        event_markup_percent: eventMarkupPercent,
        items: selectedItems,
        user_id: parseInt(currentUserId),
        created_at: existingIndex > -1 ? savedQuotes[existingIndex].createdAt : new Date().toISOString()
      }, { onConflict: 'id' });

      if (error) throw error;

      setSavedQuotes(updatedQuotes);
      
      if (existingIndex > -1) {
        setSaveSuccessMessage("Quotation updated successfully in database!");
      } else {
        setSaveSuccessMessage("Quotation saved successfully to database!");
        const nextNum = getNextQuoteNumber(updatedQuotes);
        setQuoteNumber(nextNum);
      }
    } catch (err) {
      console.error("Failed to save quotation:", err);
      alert("Failed to save quotation to database.");
    } finally {
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
    setCashAmount(quote.cashAmount || "");
    setBankAmount(quote.bankAmount || "");
    setApplyEventMarkup(quote.applyEventMarkup || false);
    setEventMarkupPercent(quote.eventMarkupPercent ?? 25);
    setActiveSubView("create");
  };

  const handleCreateNew = () => {
    setQuoteNumber(getNextQuoteNumber(savedQuotes));
    setClientName("");
    setClientCompany("");
    setClientAddress("");
    setQuoteDate(() => getLocalDateString());
    setSelectedItems([]);
    setTaxInput("");
    setCashAmount("");
    setBankAmount("");
    setApplyEventMarkup(false);
    setEventMarkupPercent(25);
    setActiveSubView("create");
  };

  const handleToggleOrderStatus = async (id: string, currentStatus: boolean) => {
    const actionStr = currentStatus ? "Follow Up" : "Done";
    setConfirmModal({
      isOpen: true,
      title: `Mark as ${actionStr}`,
      message: `Are you sure you want to mark this order as ${actionStr}?`,
      confirmText: actionStr,
      isDanger: false,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const { error } = await supabase
        .from('quotations')
        .update({ is_order_done: !currentStatus })
        .eq('id', id);

      if (error) throw error;

          setSavedQuotes(savedQuotes.map(q => 
            q.id === id ? { ...q, isOrderDone: !currentStatus } : q
          ));
        } catch (err) {
          console.error("Failed to update order status:", err);
          alert("Failed to update order status in database.");
        }
      }
    });
  };

  const handleDeleteQuote = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Quotation",
      message: "Are you sure you want to delete this quotation from the database? This action cannot be undone.",
      confirmText: "Delete",
      isDanger: true,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          const { error } = await supabase.from('quotations').delete().eq('id', id);
      if (error) throw error;

          const updated = savedQuotes.filter(q => q.id !== id);
          setSavedQuotes(updated);
        } catch (err) {
          console.error("Failed to delete quote:", err);
          alert("Failed to delete quotation from database.");
        }
      }
    });
  };

  const handlePrintQuoteDirect = async (quote: any) => {
    let itemsToLoad = quote.items;
    if (!itemsToLoad) {
      itemsToLoad = await fetchQuoteItems(quote.id);
      quote.items = itemsToLoad;
    }
    setPrintQuoteData({ ...quote, items: itemsToLoad });
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintQuoteData(null), 100);
    }, 300);
  };

  // Toggle item selection
  const handleToggleProduct = async (product: Product) => {
    const exists = selectedItems.find(item => item.id === product.id);
    if (exists) {
      setSelectedItems(selectedItems.filter(item => item.id !== product.id));
    } else {
      const cQty = product.cartonQty || 1;
      
      let photoUrl = product.photoUrl;
      if (!photoUrl) {
        const { data } = await supabase.from('products').select('photoUrl').eq('id', product.id).single();
        if (data?.photoUrl) photoUrl = data.photoUrl;
      }
      
      setSelectedItems(prev => [
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
          photoUrl: photoUrl,
          collectionName: product.collectionName,
          description: product.description,
          location: product.location
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
  
  const total = Math.max(0, subtotal + taxAmount);

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
  const handlePrint = () => {
    const currentQuote = {
      id: "preview",
      quoteNumber,
      clientName,
      clientCompany,
      clientAddress,
      date: quoteDate,
      items: selectedItems,
      taxInput,
      cashAmount,
      bankAmount,
      applyEventMarkup,
      eventMarkupPercent,
      total: total
    };
    setPrintQuoteData(currentQuote);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintQuoteData(null), 100);
    }, 300);
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
    <div className="w-full">
      {/* CSS @media print overrides: Removes URL, date/time header, page numbers, Safari bg colors, and extra blank pages */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 20mm !important; /* Real margins on every page */
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
            padding: 0 !important;
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
            padding: 0 !important;
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
      <div className="no-print flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
        {/* Search Inputs Row */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
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
              placeholder="Search saved quotes (Client, ID)..."
              className="w-full rounded-xl border border-sky-200 bg-white py-2.5 pl-11 pr-10 text-xs font-bold text-slate-700 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 shadow-sm"
            />
            {historySearchQuery && (
              <button
                type="button"
                onClick={() => setHistorySearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-650 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {activeSubView === "create" && (
            <button
              onClick={handleSaveQuotation}
              disabled={selectedItems.length === 0}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white transition disabled:opacity-50 active:scale-95 shadow-sm shrink-0"
            >
              <Check className="h-4 w-4" />
              Save Quotation
            </button>
          )}

          <button
            onClick={handlePrint}
            disabled={selectedItems.length === 0}
            className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white transition disabled:opacity-50 active:scale-95 shadow-sm shrink-0"
          >
            <Printer className="h-4 w-4" />
            Print / Export PDF
          </button>
        </div>
      </div>

      {/* Subview switcher tabs */}
      <div className="no-print flex gap-2 mb-6">
        <button
          onClick={handleCreateNew}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition active:scale-95 shadow-sm ${
            activeSubView === "create"
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200"
          }`}
        >
          📝 Create Quotation
        </button>
        <button
          onClick={() => setActiveSubView("history")}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition active:scale-95 shadow-sm ${
            activeSubView === "history"
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-white hover:bg-slate-50 text-slate-600 border border-slate-200"
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
            <div className="overflow-x-auto">
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
                    .filter((q) => historyTab === "done" ? q.isOrderDone : !q.isOrderDone)
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
                        <div className="mt-1">
                          {quote.applyEventMarkup ? (
                            <span className="inline-flex items-center rounded-md bg-purple-50 px-1.5 py-0.5 text-[8px] font-bold text-purple-600 ring-1 ring-inset ring-purple-500/20">EVENT</span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-slate-50 px-1.5 py-0.5 text-[8px] font-bold text-slate-600 ring-1 ring-inset ring-slate-500/20">B2B</span>
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
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleToggleOrderStatus(quote.id, quote.isOrderDone)}
                          className={`flex items-center gap-1.5 px-2 py-1 mx-auto rounded-lg text-[10px] font-black tracking-wide uppercase transition active:scale-95 ${
                            quote.isOrderDone 
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100" 
                              : "bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100"
                          }`}
                        >
                          {quote.isOrderDone ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {quote.isOrderDone ? "Done" : "Follow Up"}
                        </button>
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
                          className="rounded border-slate-350 text-blue-600 focus:ring-blue-500/10 h-4 w-4"
                        />
                        <label htmlFor="applyEventMarkupCheckbox" className="text-xs font-black text-slate-700 cursor-pointer select-none uppercase tracking-wider">
                          Apply Event Price Markup
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
                  <div className="relative">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Customer Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search by Customer or Company Name..."
                        value={clientName}
                        onChange={(e) => {
                          setClientName(e.target.value);
                          setShowClientSuggestions(true);
                        }}
                        onFocus={() => setShowClientSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowClientSuggestions(false), 200)}
                        className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs font-semibold outline-none transition focus:border-blue-500"
                      />
                      
                      {/* Suggestions Dropdown */}
                      {showClientSuggestions && filteredClientSuggestions.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          {filteredClientSuggestions.map((client: any, idx) => (
                            <div 
                              key={idx}
                              className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                              onClick={() => {
                                setClientName(client.name);
                                setClientCompany(client.company);
                                setClientAddress(client.address);
                                setShowClientSuggestions(false);
                              }}
                            >
                              <div className="text-xs font-bold text-slate-800">{client.name}</div>
                              {client.company && <div className="text-[10px] text-slate-500">{client.company}</div>}
                            </div>
                          ))}
                        </div>
                      )}
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
              
              <div className="relative mt-2">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products to add..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-11 pr-10 py-2.5 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400"
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
          
          <div className="no-print mb-4 flex items-center justify-between w-full max-w-5xl mx-auto px-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Document Preview
            </p>
            <p className="text-[10px] text-slate-400 font-semibold italic">
              * Renders final printed document dimensions below
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
              <div id="print-area" className="flex flex-col gap-8 w-full max-w-5xl mx-auto">
                {chunkedPages.map((page, pageIndex) => (
                  <div key={pageIndex} className="print-container w-full min-h-[1123px] mx-auto rounded-md border border-slate-200 bg-white p-6 sm:p-8 md:p-10 shadow-sm overflow-x-auto flex flex-col relative">
                    
                    {page.isFirst && (
                      <>
                      <div className="flex flex-col sm:flex-row gap-4 border-2 border-slate-900 overflow-hidden shrink-0">
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
              <div className="sm:w-1/2">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Billing Details:</p>
                <p className="text-slate-900 font-extrabold">{clientCompany || "-"}</p>
                <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">{clientAddress || "-"}</p>
              </div>

              {/* Right Side: Quotation Info Metadata */}
              {(quoteNumber || quoteDate) && (
                <div className="text-left sm:text-right space-y-1 min-w-[220px] ml-auto">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Quotation Info:</p>
                  <div className="mb-1.5">
                    <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-widest text-slate-600 print:border-slate-300 print:text-slate-800">
                      B2B Quotation
                    </span>
                  </div>
                  {quoteNumber && <p className="text-[10px] text-slate-505 font-extrabold uppercase">Quote Ref: <span className="text-slate-900 font-black">{quoteNumber}</span></p>}
                  {quoteDate && <p className="text-[10px] text-slate-505 font-extrabold uppercase">Date: <span className="text-slate-900 font-black">{formatDate(quoteDate)}</span></p>}
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
                  <p className="text-xs italic font-medium">No items selected.</p>
                  <p className="text-[10px] mt-1 text-slate-400">Search and check boxes in the left list to add items.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse border-2 border-slate-900">
                  <thead>
                    <tr className="bg-slate-100 border-b-2 border-slate-900 text-[10px] font-black text-slate-955 uppercase tracking-wider">
                      <th className="py-2.5 px-3 border-r border-slate-900 text-center w-10">SR.</th>
                      <th className="py-2.5 px-3 border-r border-slate-900 text-center w-28">PRODUCT PHOTO</th>
                      <th className="py-2.5 px-3 border-r border-slate-900 text-left min-w-[200px]">DESCRIPTION</th>
                      <th className="py-2.5 px-3 border-r border-slate-900 text-center w-20">CTNS</th>
                      <th className="py-2.5 px-3 border-r border-slate-900 text-center w-16">QTY</th>
                      <th className="py-2.5 px-3 border-r border-slate-900 text-right w-24">PRICE</th>
                      <th className="py-2.5 px-3 text-right w-28">TOTAL</th>
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
                          {item.location && (
                            <p className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 mt-1 inline-block select-none">
                              {item.location}
                            </p>
                          )}
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
                        <td className="py-2.5 px-2.5 border-r border-slate-300 align-middle text-center">
                          <input
                            type="number"
                            min="0"
                            value={item.quantity === 0 ? "" : item.quantity}
                            onChange={(e) => {
                              const val = e.target.value === "" ? 0 : parseInt(e.target.value);
                              handleUpdateQuantity(item.id, isNaN(val) ? 0 : val);
                            }}
                            placeholder="0"
                            className="no-print w-16 rounded-lg border border-slate-205 bg-white py-1 px-1.5 text-center text-xs font-black text-slate-800 outline-none transition focus:border-blue-550 focus:ring-2 focus:ring-blue-500/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="hidden print:inline font-bold text-slate-700">
                            {item.quantity}
                          </span>
                        </td>

                        {/* PRICE CODE */}
                        <td className="py-3 px-3 border-r border-slate-300 align-middle text-right font-bold text-slate-800">
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
                            className="no-print w-20 rounded-lg border border-slate-205 bg-white py-1 px-1.5 text-right text-xs font-black text-slate-800 outline-none transition focus:border-blue-550 focus:ring-2 focus:ring-blue-500/10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ml-auto"
                          />
                          <span className="hidden print:inline">
                            {getItemRate(item.rate)}
                          </span>
                        </td>

                        {/* TOTAL */}
                        <td className="py-3 px-3 align-middle text-right font-black text-slate-950">
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
                      <div className="flex items-center justify-end w-28 bg-white border border-slate-300 rounded py-0.5 px-2 focus-within:border-blue-500 transition-colors">
                        <span className="text-slate-800 shrink-0">₹</span>
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
                          style={{ width: `${Math.max(1, String(cashAmount || "").length) + 0.5}ch` }}
                          className="text-right font-bold text-slate-800 bg-transparent outline-none min-w-[20px]"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-600 items-center">
                      <span>Paid via Bank</span>
                      <div className="flex items-center justify-end w-28 bg-white border border-slate-300 rounded py-0.5 px-2 focus-within:border-blue-500 transition-colors">
                        <span className="text-slate-800 shrink-0">₹</span>
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
                          style={{ width: `${Math.max(1, String(bankAmount || "").length) + 0.5}ch` }}
                          className="text-right font-bold text-slate-800 bg-transparent outline-none min-w-[20px]"
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
            );
          })()}
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
                setPrintQuoteData(selectedQuoteForPreview);
                setTimeout(() => {
                  window.print();
                  setTimeout(() => setPrintQuoteData(null), 100);
                }, 300);
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
                    <div className="mb-1.5">
                      <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-widest text-slate-600 print:border-slate-300 print:text-slate-800">
                        B2B Quotation
                      </span>
                    </div>
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

    {/* ── HIDDEN DIRECT PRINT QUOTE ── */}
    {printQuoteData && typeof document !== "undefined" && createPortal(
      <div id="print-area" className="print-portal hidden print:block w-full bg-white text-black p-0">
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
        <div className="flex flex-col sm:flex-row justify-between gap-4 mt-2 mb-5 text-xs font-semibold text-slate-700">
          {/* Left Side: Customer Billing Details */}
          <div className="sm:w-1/2">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Billing Details:</p>
            <p className="text-slate-900 font-extrabold">{printQuoteData.clientCompany || "-"}</p>
            <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">{printQuoteData.clientAddress || "-"}</p>
          </div>

          {/* Right Side: Quotation Info Metadata */}
          {(printQuoteData.quoteNumber || printQuoteData.quoteDate) && (
            <div className="text-left sm:text-right space-y-1 min-w-[220px] ml-auto">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Quotation Info:</p>
              <div className="mb-1.5">
                <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-widest text-slate-600 print:border-slate-300 print:text-slate-800">
                  B2B Quotation
                </span>
              </div>
              {printQuoteData.quoteNumber && <p className="text-[10px] text-slate-505 font-extrabold uppercase">Quote Ref: <span className="text-slate-900 font-black">{printQuoteData.quoteNumber}</span></p>}
              {printQuoteData.quoteDate && <p className="text-[10px] text-slate-505 font-extrabold uppercase">Date: <span className="text-slate-900 font-black">{formatDate(printQuoteData.quoteDate)}</span></p>}
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="mb-6">
            <table className="w-full text-left border-collapse border-2 border-slate-900">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-900 text-[10px] font-black text-slate-955 uppercase tracking-wider">
                  <th className="py-2.5 px-3 border-r border-slate-900 text-center w-10">SR.</th>
                  <th className="py-2.5 px-3 border-r border-slate-900 text-center w-28">PRODUCT PHOTO</th>
                  <th className="py-2.5 px-3 border-r border-slate-900 text-left min-w-[200px]">DESCRIPTION</th>
                  <th className="py-2.5 px-3 border-r border-slate-900 text-center w-20">CTNS</th>
                  <th className="py-2.5 px-3 border-r border-slate-900 text-center w-16">QTY</th>
                  <th className="py-2.5 px-3 border-r border-slate-900 text-right w-24">PRICE</th>
                  <th className="py-2.5 px-3 text-right w-28">TOTAL</th>
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
                      {item.location && (
                        <p className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 mt-1 inline-block select-none">
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
                    <td className="py-3 px-3 text-right align-middle font-black text-slate-900">
                      ₹{(item.quantity * (parseFloat(getSavedItemRate(item.rate, printQuoteData.applyEventMarkup, printQuoteData.eventMarkupPercent)) || 0)).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
        <div className="flex justify-between items-start break-inside-avoid pt-4">
          <div className="w-[60%] flex flex-row items-start gap-4">
            {showBankDetails && companyInfo && (companyInfo.bankName || companyInfo.accountNumber) && (
                <>
                  {/* QR Code rendered first on the left */}
                  {showBankDetails && companyInfo && ((companyInfo.accountNumber && companyInfo.ifsc) || companyInfo.upiId) && (
                    <div className="flex flex-col items-center justify-center p-2 border-2 border-slate-900 rounded-lg shrink-0 w-[80px] h-[80px]">
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
          <div className="w-[40%] text-xs flex flex-col gap-3 pt-2">
            <div className="space-y-2">
              <div className="flex justify-between font-bold text-slate-700 px-1">
                <span className="text-[11px]">Amount</span>
                <span className="text-sm">₹{printQuoteData.items?.reduce((sum: number, item: any) => sum + (item.quantity * (parseFloat(getSavedItemRate(item.rate, printQuoteData.applyEventMarkup, printQuoteData.eventMarkupPercent)) || 0)), 0).toLocaleString("en-IN")}</span>
              </div>
              {printQuoteData.taxInput && (
                <div className="flex justify-between font-bold text-slate-500 px-1 items-center">
                  <span className="flex items-center gap-1 text-[11px]">
                    <span>GST</span>
                    <span className="flex items-center gap-0.5">
                      (
                      <div className="min-w-[60px] text-center font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded py-0.5 px-1.5">
                        {printQuoteData.taxInput}
                      </div>
                      )
                    </span>
                  </span>
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
              
              <div className="border-t border-slate-200 my-2"></div>
              
              <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-950 font-black">
                <span className="text-[12px] tracking-wide">Grand Total</span>
                <span className="text-base">₹{(printQuoteData.total || 0).toLocaleString("en-IN")}</span>
              </div>
            </div>
            
            {(printQuoteData.cashAmount || printQuoteData.bankAmount) && (
              <div className="pt-2 space-y-2 font-bold text-slate-600 px-1">
                {printQuoteData.cashAmount && (
                  <div className="flex justify-between items-center">
                    <span className="text-[11px]">Paid via Cash</span>
                    <div className="flex items-center justify-end w-28 bg-white border border-slate-300 rounded py-0.5 px-2 text-xs">
                      <span className="text-slate-800">₹</span>
                      <span className="font-bold text-slate-800">
                        {parseFloat(String(printQuoteData.cashAmount)).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                )}
                {printQuoteData.bankAmount && (
                  <div className="flex justify-between items-center">
                    <span className="text-[11px]">Paid via Bank</span>
                    <div className="flex items-center justify-end w-28 bg-white border border-slate-300 rounded py-0.5 px-2 text-xs">
                      <span className="text-slate-800">₹</span>
                      <span className="font-bold text-slate-800">
                        {parseFloat(String(printQuoteData.bankAmount)).toLocaleString("en-IN")}
                      </span>
                    </div>
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

  </div>
);
}
