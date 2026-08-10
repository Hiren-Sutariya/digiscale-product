"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { getUserProfile } from "@/services/api";
import {
  Search,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  AlertTriangle,
  History,
  Layers,
  Inbox,
  CheckCircle2,
  X,
  RefreshCw,
  HelpCircle,
  FileSpreadsheet,
  ImageIcon,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import PageTitle from "@/components/ui/pageTitle";

const photoUrlCache = new Map<string, string | null>();

// Async image helper deleted as we now map photoUrl directly from component state updates.

interface Product {
  id: string;
  name: string;
  photoUrl?: string;
  stock: number;
  cartonQty: number;
  rate: string;
  unit_type?: string;
  color?: string;
  length?: string;
  description?: string;
  warehouse?: string;
  collectionName?: string;
  collectionId?: string;
}

interface StockEntry {
  id: number;
  created_at: string;
  product_id: string;
  product_name: string;
  quantity_changed: number;
  transaction_type: "sale" | "adjustment" | "initial" | "return";
  reference_id: string | null;
  reference_type: string | null;
  description: string;
}

export default function StockBookPage() {
  const [lang, setLang] = useState("en");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // States
  const [products, setProducts] = useState<Product[]>([]);
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Inline adjustments state: map of product ID -> input value
  const [adjustQty, setAdjustQty] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.collectionName?.toLowerCase().includes(q) ||
      p.color?.toLowerCase().includes(q) ||
      p.warehouse?.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (statusFilter === "in_stock") return p.stock > 5;
    if (statusFilter === "low_stock") return p.stock > 0 && p.stock <= 5;
    if (statusFilter === "out_of_stock") return p.stock <= 0;

    return true;
  });

  // Paginated Products
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  // Scroll to top of table body when page changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage]);

  // 1. Initial Cache Load & Fresh Data Fetch on Mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setLang(localStorage.getItem("digiscale_language") || "en");

      // Warm up state instantly using stale-while-revalidate from localStorage cache
      const cachedProds = localStorage.getItem("digiscale_cached_all_products");
      const cachedCols = localStorage.getItem("digiscale_cached_collections");
      const cachedAssigns = localStorage.getItem("digiscale_cached_warehouse_assignments");

      if (cachedProds) {
        try {
          const parsedProds = JSON.parse(cachedProds);
          const parsedCols = cachedCols ? JSON.parse(cachedCols) : [];
          const collectionsMap = new Map<string, string>();
          parsedCols.forEach((c: any) => collectionsMap.set(c.id, c.name));

          const locationsMap = new Map<string, string>();
          if (cachedAssigns) {
            try {
              const parsedAssigns = JSON.parse(cachedAssigns);
              if (Array.isArray(parsedAssigns)) {
                parsedAssigns.forEach((a: any) => {
                  if (a.product_id) locationsMap.set(a.product_id, a.location_key);
                });
              } else if (parsedAssigns && typeof parsedAssigns === "object") {
                Object.entries(parsedAssigns).forEach(([locationKey, list]) => {
                  if (Array.isArray(list)) {
                    list.forEach((item: any) => {
                      if (item.productId) {
                        locationsMap.set(item.productId, locationKey);
                      }
                    });
                  }
                });
              }
            } catch (err) {
              console.error("Failed to parse warehouse assignments cache:", err);
            }
          }

          const formatted: Product[] = parsedProds.map((p: any) => ({
            id: p.id,
            name: p.name || "",
            photoUrl: p.photoUrl || undefined,
            stock: p.stock ?? 0,
            cartonQty: p.cartonQty ?? 1,
            rate: p.rate || "0",
            unit_type: p.unit_type || "pcs",
            color: p.color || undefined,
            length: p.length || undefined,
            description: p.description || undefined,
            warehouse: locationsMap.get(p.id) || p.warehouse || undefined,
            collectionName: p.collectionId ? collectionsMap.get(p.collectionId) : p.collectionName,
            collectionId: p.collectionId || undefined
          }));

          if (formatted.length > 0) {
            setProducts(formatted);
            setLoading(false); // Disable spinner instantly!
          }
        } catch (e) {
          console.error("Failed to parse stock book cache:", e);
        }
      }
    }

    const init = async () => {
      try {
        const profile = await getUserProfile();
        if (profile?.id) {
          const uIdStr = String(profile.id);
          setCurrentUserId(uIdStr);
          await fetchData(uIdStr);
        }
      } catch (err) {
        console.error("Initialization failed:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // 2. Optimized Bulk Photo Fetcher for Paginated Products
  useEffect(() => {
    if (paginatedProducts.length === 0) return;

    // Filter IDs that have not been loaded or cached
    const idsToFetch = paginatedProducts
      .map(p => p.id)
      .filter(id => !photoUrlCache.has(id));

    if (idsToFetch.length === 0) {
      // Sync in-memory cache to products list state if cached but state has it as undefined
      const cachedMatches = paginatedProducts.filter(p => !p.photoUrl && photoUrlCache.get(p.id));
      if (cachedMatches.length > 0) {
        setProducts(prev => prev.map(prod => {
          const cachedUrl = photoUrlCache.get(prod.id);
          if (cachedUrl && !prod.photoUrl) {
            return { ...prod, photoUrl: cachedUrl };
          }
          return prod;
        }));
      }
      return;
    }

    let mounted = true;
    const fetchPhotos = async () => {
      try {
        // Initialize cache with null for these IDs to block duplicate requests
        idsToFetch.forEach(id => photoUrlCache.set(id, null));

        const { data, error } = await supabase
          .from("products")
          .select("id, photoUrl")
          .in("id", idsToFetch);

        if (error) throw error;

        if (data && data.length > 0) {
          data.forEach(p => {
            if (p.photoUrl) {
              photoUrlCache.set(p.id, p.photoUrl);
            }
          });

          if (mounted) {
            setProducts(prev => prev.map(prod => {
              const match = data.find(item => item.id === prod.id);
              if (match && match.photoUrl) {
                return { ...prod, photoUrl: match.photoUrl };
              }
              return prod;
            }));
          }
        }
      } catch (e) {
        console.error("Bulk fetch photos failed:", e);
      }
    };

    fetchPhotos();
    return () => { mounted = false; };
  }, [paginatedProducts]);

  const fetchData = async (userId: string) => {
    try {
      // 1. Fetch products (without querying large base64 photoUrl column in bulk)
      const { data: prodsData, error: prodsErr } = await supabase
        .from("products")
        .select(`
          id,
          name,
          stock,
          cartonQty,
          rate,
          unit_type,
          color,
          length,
          collection_id,
          description
        `)
        .eq("user_id", userId);

      if (prodsErr) throw prodsErr;

      // 2. Fetch collections to resolve names
      const { data: colsData } = await supabase
        .from("collections")
        .select("id, name")
        .eq("user_id", userId);

      const collectionsMap = new Map<string, string>();
      colsData?.forEach(c => collectionsMap.set(c.id, c.name));

      // 3. Fetch warehouse assignments to resolve location
      const { data: assignsData } = await supabase
        .from("warehouse_assignments")
        .select("location_key, product_id, collection_id")
        .eq("user_id", userId);

      // Create a map of product_id -> warehouse location key
      const locationsMap = new Map<string, string>();
      assignsData?.forEach(a => {
        if (a.product_id) {
          locationsMap.set(a.product_id, a.location_key);
        }
      });

      const formattedProducts: Product[] = (prodsData || []).map(p => ({
        id: p.id,
        name: p.name || "",
        photoUrl: undefined, // Lazy loaded separately
        stock: p.stock ?? 0,
        cartonQty: p.cartonQty ?? 1,
        rate: p.rate || "0",
        unit_type: p.unit_type || "pcs",
        color: p.color || undefined,
        length: p.length || undefined,
        description: p.description || undefined,
        warehouse: locationsMap.get(p.id) || undefined,
        collectionName: p.collection_id ? collectionsMap.get(p.collection_id) : undefined,
        collectionId: p.collection_id || undefined
      }));

      setProducts(formattedProducts);

      // Re-populate localStorage to keep fully in sync with fresh data
      try {
        const cachedFormat = formattedProducts.map(p => ({
          id: p.id,
          name: p.name,
          stock: p.stock,
          cartonQty: p.cartonQty,
          rate: p.rate,
          length: p.length,
          color: p.color,
          description: p.description,
          unit_type: p.unit_type,
          photoUrl: "",
          collectionId: p.collectionId || "",
          collectionName: p.collectionName,
          warehouse: p.warehouse
        }));
        localStorage.setItem("digiscale_cached_all_products", JSON.stringify(cachedFormat));
      } catch (e) {
        console.error("Failed to write to cache:", e);
      }

      // 4. Fetch Stock Ledger history
      const { data: entriesData, error: entriesErr } = await supabase
        .from("stock_entries")
        .select("*")
        .eq("user_id", parseInt(userId) || 0)
        .order("created_at", { ascending: false });

      if (entriesErr) throw entriesErr;
      setStockEntries(entriesData || []);

    } catch (err) {
      console.error("Failed to fetch stock book data:", err);
      // Throw the actual error so it can be seen clearly if it still fails
      throw err;
    }
  };

  const handleAdjustStock = async (product: Product, type: "add" | "remove") => {
    const rawVal = adjustQty[product.id] || "";
    const qty = parseFloat(rawVal);
    if (isNaN(qty) || qty <= 0) return;

    setActionLoading(prev => ({ ...prev, [product.id]: true }));
    try {
      // Calculate cartons to add/subtract based on pieces input (supporting decimals)
      const cartonsChange = Number((qty / (product.cartonQty || 1)).toFixed(4));
      const change = type === "add" ? cartonsChange : -cartonsChange;

      // 1. Fetch current stock to avoid concurrency overrides
      const { data: currentData } = await supabase
        .from("products")
        .select("stock, name")
        .eq("id", product.id)
        .single();
      
      const currentStock = currentData ? currentData.stock : product.stock;
      const productName = currentData ? currentData.name : product.name;
      const newStock = currentStock + change;

      // 2. Update stock in DB
      const { error: updateErr } = await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", product.id);

      if (updateErr) throw updateErr;

      // 3. Log stock entry
      const description = type === "add"
        ? `Quick adjustment (+${qty} pieces, added as ${cartonsChange} cartons)`
        : `Quick adjustment (-${qty} pieces, deducted as ${cartonsChange} cartons)`;

      const { data: insertedLog } = await supabase
        .from("stock_entries")
        .insert([{
          user_id: parseInt(currentUserId || "0") || 0,
          product_id: product.id,
          product_name: productName,
          quantity_changed: change,
          transaction_type: "adjustment",
          description: description
        }])
        .select()
        .single();

      // 4. Update local state and sync cache
      setProducts(prev => {
        const next = prev.map(p => p.id === product.id ? { ...p, stock: newStock } : p);
        try {
          const cachedFormat = next.map(p => ({
            id: p.id,
            name: p.name,
            stock: p.stock,
            cartonQty: p.cartonQty,
            rate: p.rate,
            length: p.length,
            color: p.color,
            description: p.description,
            unit_type: p.unit_type,
            photoUrl: "",
            collectionId: p.collectionId || "",
            collectionName: p.collectionName,
            warehouse: p.warehouse
          }));
          localStorage.setItem("digiscale_cached_all_products", JSON.stringify(cachedFormat));
        } catch (e) {}
        return next;
      });

      if (insertedLog) {
        setStockEntries(prev => [insertedLog as any, ...prev]);
      } else {
        // Fallback fetch
        const { data: newLogs } = await supabase
          .from("stock_entries")
          .select("*")
          .eq("user_id", parseInt(currentUserId || "0") || 0)
          .order("created_at", { ascending: false });
        if (newLogs) setStockEntries(newLogs);
      }

      // Clear input
      setAdjustQty(prev => ({ ...prev, [product.id]: "" }));
    } catch (err) {
      console.error("Stock adjustment failed:", err);
      alert("Failed to update stock. Please try again.");
    } finally {
      setActionLoading(prev => ({ ...prev, [product.id]: false }));
    }
  };

  const refreshData = async () => {
    if (currentUserId) {
      setLoading(true);
      await fetchData(currentUserId);
      setLoading(false);
    }
  };

  // Translations Object
  const TRANSLATIONS: Record<string, Record<string, string>> = {
    en: {
      stockBook: "Stock Book / Ledger",
      searchPlaceholder: "Search products...",
      allProducts: "All Products",
      inStock: "In Stock (>5)",
      lowStock: "Low Stock (1-5)",
      outOfStock: "Out of Stock (<=0)",
      totalStockVal: "Total Stock Value",
      lowStockCount: "Low Stock Items",
      outOfStockCount: "Out of Stock Items",
      productDetails: "Product Details",
      location: "Location",
      stockAvailable: "Stock Available",
      priceCode: "Price Code",
      adjustStock: "Adjust Stock",
      historyLog: "Stock Ledger / Movement History",
      action: "Actions",
      transaction: "Transaction",
      description: "Description",
      dateTime: "Date & Time",
      qtyChanged: "Qty Changed",
      noProducts: "No products matching current filters.",
      noHistory: "No stock transactions recorded yet.",
      restock: "Restock",
      deduct: "Deduct",
      apply: "Apply",
      cartons: "Cartons",
      box: "box",
      pcs: "pcs",
      dzn: "dzn",
      kg: "kg"
    },
    gu: {
      stockBook: "સ્ટોક બુક (સ્ટોક રજિસ્ટર)",
      searchPlaceholder: "પ્રોડક્ટ શોધો...",
      allProducts: "બધી પ્રોડક્ટ્સ",
      inStock: "સ્ટોકમાં છે (>૫)",
      lowStock: "ઓછો સ્ટોક (૧ થી ૫)",
      outOfStock: "સ્ટોક નથી (<=૦)",
      totalStockVal: "કુલ સ્ટોક કિંમત",
      lowStockCount: "ઓછો સ્ટોક આઈટમ્સ",
      outOfStockCount: "આઉટ ઓફ સ્ટોક આઈટમ્સ",
      productDetails: "પ્રોડક્ટ વિગતો",
      location: "વેરહાઉસ જગ્યા",
      stockAvailable: "હાજર સ્ટોક",
      priceCode: "ભાવ કોડ",
      adjustStock: "સ્ટોક એડજસ્ટમેન્ટ",
      historyLog: "સ્ટોક રજિસ્ટર હિસ્ટ્રી / લેજર લોગ",
      action: "એક્શન",
      transaction: "પ્રક્રિયા",
      description: "વિગત",
      dateTime: "તારીખ અને સમય",
      qtyChanged: "ફેરફાર થયેલ જથ્થો",
      noProducts: "ફિલ્ટર્સ સાથે મેળ ખાતી કોઈ પ્રોડક્ટ મળી નથી.",
      noHistory: "હજુ સુધી કોઈ સ્ટોક વ્યવહારો નોંધાયા નથી.",
      restock: "નવો સ્ટોક ઉમેરો (+)",
      deduct: "જથ્થો બાદ કરો (-)",
      apply: "લાગુ કરો",
      cartons: "કાર્ટન",
      box: "બોક્સ",
      pcs: "નંગ",
      dzn: "ડઝન",
      kg: "કિલો"
    },
    hi: {
      stockBook: "स्टॉक बुक / लेजर",
      searchPlaceholder: "उत्पाद खोजें...",
      allProducts: "सभी उत्पाद",
      inStock: "स्टॉक में है (>५)",
      lowStock: "कम स्टॉक (१-५)",
      outOfStock: "आउट ऑफ स्टॉक (<=०)",
      totalStockVal: "कुल स्टॉक मूल्य",
      lowStockCount: "कम स्टॉक वाले आइटम",
      outOfStockCount: "आउट ऑफ स्टॉक वाले आइटम",
      productDetails: "उत्पाद विवरण",
      location: "गोदाम स्थान",
      stockAvailable: "उपलब्ध स्टॉक",
      priceCode: "मूल्य कोड",
      adjustStock: "स्टॉक एडजस्ट करें",
      historyLog: "स्टॉक खाता / गतिविधि इतिहास",
      action: "कार्रवाई",
      transaction: "लेनदेन",
      description: "विवरण",
      dateTime: "दिनांक और समय",
      qtyChanged: "बदला हुआ जत्था",
      noProducts: "फ़िल्टर के साथ कोई उत्पाद उत्पाद उपलब्ध नहीं है।",
      noHistory: "अभी तक कोई स्टॉक लेनदेन दर्ज नहीं किया गया है।",
      restock: "स्टॉक जोड़ें",
      deduct: "स्टॉक घटाएं",
      apply: "लागू करें",
      cartons: "कार्टन",
      box: "बॉक्स",
      pcs: "पीस",
      dzn: "दर्जन",
      kg: "किलो"
    }
  };

  const t = (key: string) => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS["en"]?.[key] || key;
  };

  // Stats Calculations
  const totalProducts = products.length;
  const totalStockCartons = products.reduce((sum, p) => sum + p.stock, 0);
  const totalStockVal = products.reduce((sum, p) => sum + (p.stock * p.cartonQty * (parseFloat(p.rate) || 0)), 0);
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-xs font-bold text-slate-500">Loading Stock Ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2.5 sm:px-8 pt-1.5 sm:pt-4 pb-6 flex-1 flex flex-col overflow-hidden bg-slate-50/50 min-h-0 w-full">
      {/* Static Toolbar Header (Warehouse style) */}
      <div className="shrink-0 flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between mb-1.5 sm:mb-3 w-full">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center w-full">
          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-3xl">
            {/* Search Input */}
            <div className="relative w-full sm:w-[35%] shrink-0">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm"
              />
            </div>

            {/* Filters toggle */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner w-full sm:w-auto">
              <button
                onClick={() => setStatusFilter("all")}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer text-center ${
                  statusFilter === "all"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/40"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {lang === "gu" ? "બધા" : "All"}
              </button>
              <button
                onClick={() => setStatusFilter("in_stock")}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer text-center ${
                  statusFilter === "in_stock"
                    ? "bg-white text-emerald-700 shadow-sm border border-slate-200/40"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {lang === "gu" ? "સ્ટોક" : "In Stock"}
              </button>
              <button
                onClick={() => setStatusFilter("low_stock")}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer text-center ${
                  statusFilter === "low_stock"
                    ? "bg-white text-amber-700 shadow-sm border border-slate-200/40"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {lang === "gu" ? "ઓછો" : "Low"}
              </button>
              <button
                onClick={() => setStatusFilter("out_of_stock")}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer text-center ${
                  statusFilter === "out_of_stock"
                    ? "bg-white text-red-700 shadow-sm border border-slate-200/40"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {lang === "gu" ? "ખાલી" : "Out"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary Cards - Stationary at the top */}
      <div className="shrink-0 mb-3 sm:mb-5 mt-1.5">
        <div className="grid grid-cols-4 gap-1.5 sm:gap-6">
          {/* Total Stock cartons */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-5 min-w-0">
            <div className="hidden sm:flex h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 items-center justify-center text-blue-600 shrink-0">
              <Layers className="h-6 w-6" />
            </div>
            <div className="min-w-0 w-full text-center sm:text-left">
              <p className="sm:hidden text-[8px] font-black text-slate-400 uppercase tracking-tight truncate">
                {lang === "gu" ? "સ્ટોક" : "Stock"}
              </p>
              <p className="hidden sm:block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {t("stockAvailable")}
              </p>
              
              <p className="sm:hidden text-xs font-black text-slate-800 mt-0.5 truncate">
                {totalStockCartons} <span className="text-[8px] font-bold text-slate-400">Ctn</span>
              </p>
              <p className="hidden sm:block text-xl font-black text-slate-800 mt-1">
                {totalStockCartons.toLocaleString()} <span className="text-xs font-bold text-slate-400">Cartons</span>
              </p>
              
              <p className="hidden sm:block text-[10px] text-slate-400 font-bold mt-0.5">
                {totalProducts} active products
              </p>
            </div>
          </div>

          {/* Total Stock Value */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-5 min-w-0">
            <div className="hidden sm:flex h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 items-center justify-center text-emerald-600 shrink-0">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="min-w-0 w-full text-center sm:text-left">
              <p className="sm:hidden text-[8px] font-black text-slate-400 uppercase tracking-tight truncate">
                {lang === "gu" ? "કિંમત" : "Value"}
              </p>
              <p className="hidden sm:block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {t("totalStockVal")}
              </p>
              
              <p className="sm:hidden text-xs font-black text-slate-800 mt-0.5 truncate">
                ₹{totalStockVal >= 100000 ? (totalStockVal / 1000).toFixed(0) + 'k' : totalStockVal.toLocaleString()}
              </p>
              <p className="hidden sm:block text-xl font-black text-slate-800 mt-1">
                ₹{totalStockVal.toLocaleString("en-IN")}
              </p>
              
              <p className="hidden sm:block text-[10px] text-slate-400 font-bold mt-0.5">
                estimated valuation
              </p>
            </div>
          </div>

          {/* Low Stock count */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-5 min-w-0">
            <div className="hidden sm:flex h-12 w-12 rounded-xl bg-amber-50 border border-amber-100 items-center justify-center text-amber-600 shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="min-w-0 w-full text-center sm:text-left">
              <p className="sm:hidden text-[8px] font-black text-slate-400 uppercase tracking-tight truncate">
                {lang === "gu" ? "ઓછો" : "Low"}
              </p>
              <p className="hidden sm:block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {t("lowStockCount")}
              </p>
              
              <p className="sm:hidden text-xs font-black text-amber-600 mt-0.5 truncate">
                {lowStockCount}
              </p>
              <p className="hidden sm:block text-xl font-black text-amber-650 mt-1">
                {lowStockCount}
              </p>
              
              <p className="hidden sm:block text-[10px] text-slate-400 font-bold mt-0.5">
                need replenishment
              </p>
            </div>
          </div>

          {/* Out of stock count */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-2 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-5 min-w-0">
            <div className="hidden sm:flex h-12 w-12 rounded-xl bg-red-50 border border-red-100 items-center justify-center text-red-600 shrink-0">
              <Inbox className="h-6 w-6" />
            </div>
            <div className="min-w-0 w-full text-center sm:text-left">
              <p className="sm:hidden text-[8px] font-black text-slate-400 uppercase tracking-tight truncate">
                {lang === "gu" ? "ખાલી" : "Out"}
              </p>
              <p className="hidden sm:block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                {t("outOfStockCount")}
              </p>
              
              <p className="sm:hidden text-xs font-black text-red-600 mt-0.5 truncate">
                {outOfStockCount}
              </p>
              <p className="hidden sm:block text-xl font-black text-red-650 mt-1">
                {outOfStockCount}
              </p>
              
              <p className="hidden sm:block text-[10px] text-slate-400 font-bold mt-0.5">
                zero inventory
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Body */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0 pt-1 sm:pt-6 pb-20 sm:pb-8">
        <div className="space-y-6">

          {/* Main Stock Management Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            {/* Products Stock Table */}
            <div className="overflow-x-auto">
              {paginatedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Inbox className="h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-xs font-bold">{t("noProducts")}</p>
                </div>
              ) : (
                <>
                  <table className="hidden sm:table w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-100">
                        <th className="py-3 px-6 text-center w-16">Photo</th>
                        <th className="py-3 px-6">Product Details</th>
                        <th className="py-3 px-6 text-center">Location</th>
                        <th className="py-3 px-6 text-center w-40">Current Stock</th>
                        <th className="py-3 px-6 text-center w-40">Packing / Rate</th>
                        <th className="py-3 px-6 text-center w-80">Quick Stock Adjustment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {paginatedProducts.map(p => {
                        const isAdjustLoading = actionLoading[p.id] || false;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/40 transition">
                            {/* Photo */}
                            <td className="py-4 px-6 text-center">
                              <div className="h-11 w-11 rounded-lg bg-slate-50 border border-slate-150 overflow-hidden flex items-center justify-center p-1 relative mx-auto shadow-sm">
                                {p.photoUrl ? (
                                  <img
                                    src={p.photoUrl}
                                    alt=""
                                    className="h-full w-full object-contain"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center bg-slate-50">
                                    <ImageIcon className="h-5 w-5 text-slate-300" />
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Product details */}
                            <td className="py-4 px-6">
                              <p className="font-extrabold text-slate-900 text-sm leading-tight">{p.name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 font-bold">Code: {p.id}</p>
                              
                              {/* Extra Details (Size, Color, Specs) */}
                              <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-500 font-semibold leading-tight">
                                {p.length && (
                                  <p><span className="text-slate-400">Size:</span> {p.length} cm</p>
                                )}
                                {p.color && (
                                  <p><span className="text-slate-400">Color:</span> {p.color}</p>
                                )}
                                {p.description && (
                                  <p><span className="text-slate-400">Specs:</span> {p.description}</p>
                                )}
                              </div>

                              {p.collectionName && (
                                <span className="inline-block mt-2 px-1.5 py-0.5 rounded-md bg-slate-150 text-slate-655 text-[9px] font-bold border border-slate-200">
                                  {p.collectionName}
                                </span>
                              )}
                            </td>

                            {/* Location */}
                            <td className="py-4 px-6 text-center font-bold text-slate-600">
                              {p.warehouse ? (
                                <span className="px-2 py-1 rounded bg-blue-50/50 text-blue-755 border border-blue-100 text-[10px] font-bold">
                                  {p.warehouse.replace(/-upper/g, " (U)").replace(/-lower/g, " (L)")}
                                </span>
                              ) : (
                                <span className="text-slate-350 text-[10px] italic">Not located</span>
                              )}
                            </td>

                            {/* Current Stock */}
                            <td className="py-4 px-6 text-center">
                              <p className="font-black text-slate-800 text-sm">{p.stock} Cartons</p>
                              <div className="mt-1 flex justify-center">
                                {p.stock <= 0 ? (
                                  <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-red-50 text-red-700 border border-red-200">
                                    Out of Stock
                                  </span>
                                ) : p.stock <= 5 ? (
                                  <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                    Low Stock
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-[9px] text-slate-400 font-bold mt-1">{(p.stock * p.cartonQty).toLocaleString()} {p.unit_type || "pcs"} total</p>
                            </td>

                            {/* Packing / Rate */}
                            <td className="py-4 px-6 text-center font-bold text-slate-600">
                              <p className="text-slate-800">{p.cartonQty} pcs / box</p>
                              <p className="text-[10px] text-slate-400 font-bold mt-0.5">Rate: ₹{p.rate}</p>
                            </td>

                            {/* Quick adjustment */}
                            <td className="py-4 px-6">
                              <div className="flex flex-col items-center gap-2 max-w-[160px] mx-auto">
                                {/* Qty Input on top */}
                                <div className="relative w-full">
                                  <input
                                    type="number"
                                    min="1"
                                    placeholder="Qty"
                                    value={adjustQty[p.id] || ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setAdjustQty(prev => ({ ...prev, [p.id]: val }));
                                    }}
                                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-center text-slate-800 focus:outline-none focus:border-blue-500 bg-white shadow-sm"
                                  />
                                </div>

                                {/* Warehouse styled buttons below */}
                                <div className="flex gap-2 w-full">
                                  <button
                                    onClick={() => handleAdjustStock(p, "add")}
                                    disabled={isAdjustLoading || !adjustQty[p.id]}
                                    className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-0.5 active:scale-95 transition shadow-sm cursor-pointer select-none"
                                  >
                                    + Add
                                  </button>

                                  <button
                                    onClick={() => handleAdjustStock(p, "remove")}
                                    disabled={isAdjustLoading || !adjustQty[p.id]}
                                    className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-0.5 active:scale-95 transition shadow-sm cursor-pointer select-none"
                                  >
                                    - Deduct
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Mobile Cards List */}
                  <div className="block sm:hidden divide-y divide-slate-100">
                    {paginatedProducts.map(p => {
                      const isAdjustLoading = actionLoading[p.id] || false;
                      return (
                        <div key={p.id} className="p-4 flex flex-col gap-3 hover:bg-slate-50/40 transition">
                          {/* Top row: Photo + Product Info */}
                          <div className="flex gap-3">
                            {/* Photo */}
                            <div className="h-16 w-16 rounded-xl bg-slate-50 border border-slate-150 overflow-hidden flex items-center justify-center p-1.5 relative shrink-0 shadow-sm">
                              {p.photoUrl ? (
                                <img
                                  src={p.photoUrl}
                                  alt=""
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <ImageIcon className="h-6 w-6 text-slate-355" />
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-extrabold text-slate-900 text-sm leading-tight truncate">{p.name}</p>
                              <p className="text-[10px] text-slate-405 mt-0.5 font-bold">Code: {p.id}</p>
                              
                              <div className="flex flex-wrap gap-x-2.5 gap-y-1 mt-1 text-[10px] text-slate-500 font-semibold">
                                {p.length && (
                                  <span><span className="text-slate-400">Size:</span> {p.length} cm</span>
                                )}
                                {p.color && (
                                  <span><span className="text-slate-400">Color:</span> {p.color}</span>
                                )}
                              </div>

                              {p.collectionName && (
                                <span className="inline-block mt-1.5 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-bold border border-slate-200">
                                  {p.collectionName}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Middle row: Stats / Info Grid */}
                          <div className="grid grid-cols-2 gap-3.5 bg-slate-50/50 rounded-xl p-3 border border-slate-100">
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Current Stock</p>
                              <p className="font-black text-slate-800 text-xs mt-0.5">{p.stock} Cartons</p>
                              <p className="text-[9px] text-slate-400 font-bold">{(p.stock * p.cartonQty).toLocaleString()} {p.unit_type || "pcs"} total</p>
                              
                              <div className="mt-1">
                                {p.stock <= 0 ? (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-red-50 text-red-700 border border-red-200">
                                    Out of Stock
                                  </span>
                                ) : p.stock <= 5 ? (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                    Low Stock
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Packing / Rate</p>
                              <p className="font-extrabold text-slate-700 text-xs mt-0.5">{p.cartonQty} pcs / box</p>
                              <p className="text-[9px] text-slate-400 font-bold mt-0.5">Rate: ₹{p.rate}</p>
                              
                              <div className="mt-1.5">
                                {p.warehouse ? (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-50/50 text-blue-755 border border-blue-100 text-[9px] font-bold">
                                    {p.warehouse.replace(/-upper/g, " (U)").replace(/-lower/g, " (L)")}
                                  </span>
                                ) : (
                                  <span className="text-slate-350 text-[9px] italic">Not located</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Bottom row: Quick Adjustment */}
                          <div className="flex items-center gap-3 mt-1 pb-1">
                            <div className="w-24 shrink-0">
                              <input
                                type="number"
                                min="1"
                                placeholder="Qty"
                                value={adjustQty[p.id] || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setAdjustQty(prev => ({ ...prev, [p.id]: val }));
                                }}
                                className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-center text-slate-800 focus:outline-none focus:border-blue-500 bg-white shadow-sm"
                              />
                            </div>

                            <div className="flex-1 flex gap-2">
                              <button
                                onClick={() => handleAdjustStock(p, "add")}
                                disabled={isAdjustLoading || !adjustQty[p.id]}
                                className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-0.5 active:scale-95 transition shadow-sm cursor-pointer select-none"
                              >
                                + Add
                              </button>

                              <button
                                onClick={() => handleAdjustStock(p, "remove")}
                                disabled={isAdjustLoading || !adjustQty[p.id]}
                                className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-[11px] flex items-center justify-center gap-0.5 active:scale-95 transition shadow-sm cursor-pointer select-none"
                              >
                                - Deduct
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination Footer Controls */}
                  {filteredProducts.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center gap-3 justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4 backdrop-blur-sm">
                      <p className="text-xs text-slate-500 font-semibold select-none text-center sm:text-left">
                        Showing <span className="text-slate-800 font-extrabold">{((currentPage - 1) * itemsPerPage) + 1}</span> to{" "}
                        <span className="text-slate-800 font-extrabold">
                          {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
                        </span>{" "}
                        of <span className="text-slate-800 font-extrabold">{filteredProducts.length}</span> products
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <button
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          className="flex items-center justify-center h-8 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 text-xs font-bold text-slate-700 shadow-sm cursor-pointer select-none gap-1"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                          Previous
                        </button>
                        <span className="flex items-center justify-center h-8 px-4 text-xs font-extrabold text-slate-800 bg-slate-100 rounded-xl border border-slate-200/50 select-none">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          className="flex items-center justify-center h-8 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 text-xs font-bold text-slate-700 shadow-sm cursor-pointer select-none gap-1"
                        >
                          Next
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
