"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Search,
  Grid3X3,
  List,
  MoreHorizontal,
  Folder,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ChevronLeft,
  Image as ImageIcon,
  ExternalLink,
  Download,
  Trash2,
  Edit,
  Box,
  Layers,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Tag,
  ArrowUp,
  ArrowDown,
  Eye,
  Minus,
} from "lucide-react";
import Link from "next/link";
import PageTitle from "@/components/ui/pageTitle";
import { useSearchParams } from "next/navigation";
import QuotationView from "@/components/layout/QuotationView";

const statusConfig = {
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    color: "text-green-700 bg-green-50 border-green-200",
  },
  processing: {
    label: "Processing",
    icon: Clock,
    color: "text-amber-700 bg-amber-50 border-amber-200",
  },
  failed: {
    label: "Failed",
    icon: AlertCircle,
    color: "text-red-700 bg-red-50 border-red-200",
  },
};

type ProjectStatus = keyof typeof statusConfig;

interface CollectionImage {
  id: number;
  project_id: number;
  original_path: string;
  processed_path?: string | null;
  status: string;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  photoUrl: string;
  stock: number;
  cartonQty: number; // quantity per carton/box
  rate: string;      // rate/price code per unit
  length: string;
  color: string;
  description?: string;
  createdAt: string;
}

interface Collection {
  id: string;
  name: string;
  images?: number | CollectionImage[];
  status?: ProjectStatus;
  createdAt?: string;
  created_at?: string; // from backend
}

function CollectionsPageContent() {
  const searchParams = useSearchParams();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Detail View State
  const [selectedCol, setSelectedCol] = useState<Collection | null>(null);
  const [detailImages, setDetailImages] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "assets">("products");

  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Warehouse & Quotation States
  const [currentTopTab, setCurrentTopTab] = useState<"collections" | "warehouse" | "quotation">("collections");
  const [isTabReady, setIsTabReady] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedShelfZone, setSelectedShelfZone] = useState<"upper" | "lower">("upper");
  const [warehouseAssignments, setWarehouseAssignments] = useState<Record<string, { productId: string; collectionId: string }[]>>({});
  const [warehouseSlots, setWarehouseSlots] = useState<Record<string, number[]>>({});
  const [warehouseRows, setWarehouseRows] = useState<string[]>(["A","B","C","D","E","F","G","H","I","J","K"]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignSearchQuery, setAssignSearchQuery] = useState("");
  // Add Slot / Row modals
  const [addSlotModal, setAddSlotModal] = useState<{ open: boolean; row: string; defaultName: string }>({ open: false, row: "", defaultName: "" });
  const [addSlotName, setAddSlotName] = useState("");
  const [addRowModal, setAddRowModal] = useState(false);
  const [addRowName, setAddRowName] = useState("");

  // Product Overview State
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  // Reusable Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Collection Actions State
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [renamingCol, setRenamingCol] = useState<Collection | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  
  const [allProducts, setAllProducts] = useState<(Product & { collectionName?: string; collectionId?: string })[]>([]);

  // Product Form State
  const [prodName, setProdName] = useState("");
  const [prodStock, setProdStock] = useState("");
  const [prodCartonQty, setProdCartonQty] = useState("");
  const [prodRate, setProdRate] = useState("");
  const [prodLength, setProdLength] = useState("");
  const [prodColor, setProdColor] = useState(""); // kept for backward compat (comma-joined)
  const [prodColors, setProdColors] = useState<string[]>([]); // multi-color chips
  const [colorInput, setColorInput] = useState(""); // current chip text input
  const [prodDescription, setProdDescription] = useState("");
  const [prodPhotoUrl, setProdPhotoUrl] = useState("");
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);

  const productFileInputRef = useRef<HTMLInputElement>(null);
  const excelImportRef = useRef<HTMLInputElement>(null);
  const [excelImportStatus, setExcelImportStatus] = useState<{ count: number; errors: number } | null>(null);
  const [showImportResult, setShowImportResult] = useState(false);

  // Post-import photo assignment modal state
  const [photoAssignProducts, setPhotoAssignProducts] = useState<Product[]>([]);
  const [showPhotoAssignModal, setShowPhotoAssignModal] = useState(false);
  const photoAssignInputRef = useRef<HTMLInputElement>(null);
  const [photoAssignTargetId, setPhotoAssignTargetId] = useState<string>("");

  const refreshAllProducts = async () => {
    try {
      const { data } = await supabase.from('products').select(`*, collection:collections(name)`);
      if (data) {
         setAllProducts(data.map(p => ({
           id: p.id,
           name: p.name,
           stock: p.stock,
           cartonQty: p.cartonQty,
           rate: p.rate,
           length: p.length,
           color: p.color,
           description: p.description,
           photoUrl: p.photoUrl,
           collectionId: p.collection_id,
           collectionName: p.collection?.name || "Unknown Collection",
           createdAt: p.created_at
         })));
      }
    } catch (err) {
      console.error("Failed to refresh products:", err);
    }
  };

  const fetchWarehouseData = async () => {
    try {
      const [rowsRes, slotsRes, assignsRes] = await Promise.all([
        supabase.from('warehouse_rows').select('*'),
        supabase.from('warehouse_slots').select('*'),
        supabase.from('warehouse_assignments').select('*')
      ]);

      if (rowsRes.data) {
        setWarehouseRows(rowsRes.data.map(r => r.id));
      }
      
      if (slotsRes.data) {
        const slotsMap: Record<string, number[]> = {};
        slotsRes.data.forEach(s => {
          if (!slotsMap[s.row_id]) slotsMap[s.row_id] = [];
          slotsMap[s.row_id].push(s.slot_number);
        });
        setWarehouseSlots(slotsMap);
      }
      
      if (assignsRes.data) {
        const assignsMap: Record<string, { productId: string; collectionId: string }[]> = {};
        assignsRes.data.forEach(a => {
          if (!assignsMap[a.location_key]) assignsMap[a.location_key] = [];
          assignsMap[a.location_key].push({
            productId: a.product_id,
            collectionId: a.collection_id
          });
        });
        setWarehouseAssignments(assignsMap);
      }
      
      await refreshAllProducts();
    } catch (err) {
      console.error("Failed to fetch warehouse data from Supabase:", err);
    }
  };

  useEffect(() => {
    fetchCollections();
    fetchWarehouseData();
    
    // Close card dropdowns on click outside
    const handleOutsideClick = () => setActiveDropdownId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    const colParam = searchParams?.get("colId");
    const locParam = searchParams?.get("locId");

    if (tabParam === "quotation") {
      setCurrentTopTab("quotation");
    } else if (tabParam === "warehouse") {
      setCurrentTopTab("warehouse");
      if (locParam) {
        setSelectedLocation(locParam);
      } else {
        setSelectedLocation(null);
      }
    } else {
      setCurrentTopTab("collections");
      if (colParam) {
        supabase.from('collections').select('*').eq('id', colParam).single().then(({ data }) => {
          if (data && (!selectedCol || selectedCol.id !== colParam)) {
             handleOpenCollectionDetail(data, true);
          }
        });
      } else {
        setSelectedCol(null);
      }
    }
    
    setTimeout(() => {
      setIsTabReady(true);
    }, 200);
  }, [searchParams]);



  const findWarehouseLocation = (productId: string, collectionId: string) => {
    const locations: { row: string; slot: string; zone: "upper" | "lower" }[] = [];
    Object.keys(warehouseAssignments).forEach((key) => {
      const list = warehouseAssignments[key] || [];
      const isAssigned = list.some((item) => item.productId === productId && item.collectionId === collectionId);
      if (isAssigned) {
        const parts = key.split("-");
        if (parts.length >= 3) {
          locations.push({
            row: parts[0],
            slot: parts[1],
            zone: parts[2] as "upper" | "lower",
          });
        }
      }
    });
    return locations;
  };

  const handleLocateInWarehouse = (row: string, slot: string) => {
    setCurrentTopTab("warehouse");
    const locId = `${row}-${slot}`;
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `?tab=warehouse&locId=${locId}`);
    }
    setExpandedRow(row);
    setSelectedLocation(locId);
    setSelectedShelfZone("upper");
    setGlobalSearchQuery("");
  };

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      if (data) {
        // Map created_at to createdAt for frontend UI
        const formattedData = data.map(col => ({
          ...col,
          createdAt: new Date(col.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        }));
        setCollections(formattedData);
      }
    } catch (err) {
      console.error("Failed to fetch collections from Supabase:", err);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    try {
      setIsCreating(true);
      const newId = Date.now().toString();
      
      const { error } = await supabase
        .from('collections')
        .insert([{ id: newId, name: newCollectionName.trim() }]);
        
      if (error) throw error;
      
      const newCol: Collection = {
        id: newId,
        name: newCollectionName.trim(),
        images: [],
        status: "completed",
        createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      };

      setCollections((prev) => [newCol, ...prev]);
      setNewCollectionName("");
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to create collection in Supabase:", err);
      alert("Failed to create collection.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCollection = async (colId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setConfirmModal({
      isOpen: true,
      title: "Delete Collection",
      message: "Are you sure you want to delete this collection and all its products? This action cannot be undone.",
      confirmText: "Delete",
      isDanger: true,
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('collections').delete().eq('id', colId);
          if (error) throw error;
          
          setCollections((prev) => prev.filter((c) => c.id !== colId));
        } catch (err) {
          console.error("Failed to delete project on Supabase:", err);
          alert("Failed to delete collection.");
        }

        setActiveDropdownId(null);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleRenameCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingCol || !renameValue.trim()) return;

    const colId = renamingCol.id;
    const newName = renameValue.trim();

    try {
      setIsRenaming(true);
      const { error } = await supabase.from('collections').update({ name: newName }).eq('id', colId);
      if (error) throw error;
      
      setCollections((prev) => prev.map((c) => (c.id === colId ? { ...c, name: newName } : c)));
    } catch (err) {
      console.error("Failed to rename project on Supabase:", err);
      alert("Failed to rename collection.");
    } finally {
      setRenamingCol(null);
      setRenameValue("");
      setIsRenaming(false);
      setActiveDropdownId(null);
    }
  };

  const handleOpenCollectionDetail = async (col: Collection, skipPushState = false) => {
    setSelectedCol(col);
    setDetailImages([]);
    setActiveTab("products");
    
    if (!skipPushState && typeof window !== "undefined") {
      window.history.pushState(null, "", "?tab=collections&colId=" + col.id);
    }
    await fetchProductsForCollection(col.id);
  };
  
  const fetchProductsForCollection = async (collectionId: string) => {
    try {
      setLoadingDetail(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('collection_id', collectionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        const catalogProducts = data.filter(p => !p.id.startsWith('AST-'));
        const assetProducts = data.filter(p => p.id.startsWith('AST-')).map(p => ({
            id: p.id,
            processed_path: p.photoUrl,
            name: p.name,
            created_at: p.created_at
        }));
        
        const mappedProducts: Product[] = catalogProducts.map(p => ({
          id: p.id,
          name: p.name,
          stock: p.stock || 0,
          cartonQty: p.cartonQty || 1,
          rate: p.rate || "",
          length: p.length || "",
          color: p.color || "",
          description: p.description || "",
          photoUrl: p.photoUrl || "",
          collection_id: p.collection_id,
          createdAt: new Date(p.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        }));
        setProducts(mappedProducts);
        setDetailImages(assetProducts);
      } else {
        setProducts([]);
        setDetailImages([]);
      }
    } catch (err) {
      console.error("Failed to fetch products from Supabase:", err);
      setProducts([]);
      setDetailImages([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Product Photo Upload with canvas downscaling to prevent QuotaExceededError
  const handleProductPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 250;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7); // 70% quality jpeg
            setProdPhotoUrl(compressedBase64);
          } else {
            setProdPhotoUrl(reader.result as string);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Add or Edit Product Submit
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = prodName.trim() || `Product #${products.length + 1}`;

    const targetCollectionId = selectedCol?.id;
    if (!targetCollectionId) return;

    const productPayload = {
      name: finalName,
      stock: parseInt(prodStock) || 0,
      cartonQty: parseInt(prodCartonQty) || 1,
      rate: prodRate.trim(),
      length: prodLength.trim(),
      color: prodColors.length > 0 ? prodColors.join(", ") : prodColor.trim(),
      description: prodDescription.trim(),
      photoUrl: prodPhotoUrl,
      collection_id: targetCollectionId
    };

    if (editingProduct) {
      try {
        const { error } = await supabase
          .from('products')
          .update(productPayload)
          .eq('id', editingProduct.id);
          
        if (error) throw error;

        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id
              ? { ...p, ...productPayload, photoUrl: productPayload.photoUrl || "" }
              : p
          )
        );
      } catch (err) {
        console.error("Failed to update product:", err);
        alert("Failed to update product.");
      }
    } else {
      const newId = 'PRD-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      try {
        const { error } = await supabase
          .from('products')
          .insert([{ id: newId, ...productPayload }]);
          
        if (error) throw error;
        
        const newProd: Product = {
          id: newId,
          ...productPayload,
          photoUrl: productPayload.photoUrl || "",
          createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        };
        
        setProducts([newProd, ...products]);

        // Remove the image from Workspace detailImages list if it was created from it
        if (prodPhotoUrl) {
          const assetToRemove = detailImages.find((img) => img.processed_path === prodPhotoUrl);
          if (assetToRemove && assetToRemove.id?.startsWith('AST-')) {
            await supabase.from('products').delete().eq('id', assetToRemove.id);
          }
          
          setDetailImages((prev) => prev.filter(img => img.processed_path !== prodPhotoUrl));
        }
      } catch (err) {
        console.error("Failed to create product:", err);
        alert("Failed to create product.");
      }
    }

    // Refresh all products to keep warehouse assignments/global search updated
    await refreshAllProducts();

    // Reset Form & Close
    resetProductForm();
  };

  const resetProductForm = () => {
    setProdName("");
    setProdStock("");
    setProdCartonQty("");
    setProdRate("");
    setProdLength("");
    setProdColor("");
    setProdColors([]);
    setColorInput("");
    setProdDescription("");
    setProdPhotoUrl("");
    setIsDraggingPhoto(false);
    setEditingProduct(null);
    setIsProductModalOpen(false);
  };

  // ── Real .xlsx Template Generator (using JSZip) ────────────────────
  const downloadExcelTemplate = async () => {
    const JSZip = (await import("jszip")).default;

    // ── Data — columns match the Add Product form (no Photo — photos added after import) ─
    const headers = [
      "Product Name",                     // col A
      "Image URL",                        // col B
      "Carton Pack Qty",                  // col C
      "Colors (e.g. Red, Blue, Green)",   // col D
      "Length / Dimensions",              // col E
      "Description",                      // col F
      "Price Code",                       // col G
      "Stock Quantity",                   // col H
    ];

    const sampleRows = [
      ["Silk Saree Premium",  "https://example.com/saree.jpg", "24", "Royal Blue, Navy",    "5.5 meters", "12dzn", "950",  "120"],
      ["Cotton Dupatta",      "",                              "12", "Red, Green, Yellow",  "2.5 meters", "",      "A1",   "200"],
      ["Embroidered Kurti",   "https://example.com/kurti.jpg", "6",  "Green",               "3.0 meters", "",      "PC-12","50"],
    ];

    // ── XML Escape helper ─────────────────────────────────────────────
    const esc = (v: string) =>
      String(v ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    // ── Build Shared Strings table ────────────────────────────────────
    const allStrings: string[] = [];
    const strIndex = (s: string): number => {
      const idx = allStrings.indexOf(s);
      if (idx >= 0) return idx;
      allStrings.push(s);
      return allStrings.length - 1;
    };

    // Pre-register strings
    headers.forEach(strIndex);
    sampleRows.forEach((row) => row.forEach(strIndex));

    const sharedStringsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${allStrings.length}" uniqueCount="${allStrings.length}">
${allStrings.map((s) => `  <si><t xml:space="preserve">${esc(s)}</t></si>`).join("\n")}
</sst>`;

    // ── Column letter helper ──────────────────────────────────────────
    const colLetter = (i: number) => String.fromCharCode(65 + i);

    // ── Build sheet rows ──────────────────────────────────────────────
    const buildRow = (rowIndex: number, cells: string[], styleId: number) => {
      const cellsXml = cells
        .map((val, ci) => {
          const si = strIndex(val);
          const ref = `${colLetter(ci)}${rowIndex}`;
          return `<c r="${ref}" t="s" s="${styleId}"><v>${si}</v></c>`;
        })
        .join("");
      return `<row r="${rowIndex}">${cellsXml}</row>`;
    };

    const rows = [
      buildRow(1, headers, 1), // header row style=1
      ...sampleRows.map((r, i) => buildRow(i + 2, r, 0)), // data rows style=0
    ].join("\n");

    // Column widths — 7 columns (no photo)
    const colWidths = [30, 16, 26, 18, 26, 14, 15];
    const colsXml = colWidths
      .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
      .join("");

    const worksheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
           xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetViews>
    <sheetView tabSelected="1" workbookViewId="0">
      <selection activeCell="A2" sqref="A2"/>
    </sheetView>
  </sheetViews>
  <sheetFormatPr defaultRowHeight="18" customHeight="1"/>
  <cols>${colsXml}</cols>
  <sheetData>
${rows}
  </sheetData>
  <sheetProtection sheet="0"/>
</worksheet>`;

    // ── Styles ────────────────────────────────────────────────────────
    // style 0 = normal, style 1 = bold blue header
    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/><color rgb="FFFFFFFF"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF1E40AF"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFD1D5DB"/></left>
      <right style="thin"><color rgb="FFD1D5DB"/></right>
      <top style="thin"><color rgb="FFD1D5DB"/></top>
      <bottom style="thin"><color rgb="FFD1D5DB"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">
      <alignment horizontal="center" vertical="center" wrapText="0"/>
    </xf>
  </cellXfs>
</styleSheet>`;

    // ── [Content_Types].xml ───────────────────────────────────────────
    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

    // ── _rels/.rels ───────────────────────────────────────────────────
    const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

    // ── xl/_rels/workbook.xml.rels ────────────────────────────────────
    const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

    // ── xl/workbook.xml ───────────────────────────────────────────────
    const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <bookViews><workbookView xWindow="0" yWindow="0" windowWidth="20000" windowHeight="12000"/></bookViews>
  <sheets>
    <sheet name="Products Import" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

    // ── Assemble ZIP ──────────────────────────────────────────────────
    const zip = new JSZip();
    zip.file("[Content_Types].xml", contentTypes);
    zip.file("_rels/.rels", rootRels);
    zip.file("xl/workbook.xml", workbookXml);
    zip.file("xl/_rels/workbook.xml.rels", workbookRels);
    zip.file("xl/worksheets/sheet1.xml", worksheetXml);
    zip.file("xl/sharedStrings.xml", sharedStringsXml);
    zip.file("xl/styles.xml", stylesXml);

    const blob = await zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Digiscale_Product_Import_Template.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Excel / CSV Upload & Parse (supports .xlsx and .csv) ───────────
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCol) return;

    // ── CSV line parser ───────────────────────────────────────────────
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
          else inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ""; }
        else current += ch;
      }
      result.push(current.trim());
      return result;
    };

    // ── processRows — imageByRow maps 0-based data-row index → base64 dataURL ──
    const processRows = (
      headerRow: string[],
      dataRows: string[][],
      imageByRow: Record<number, string> = {}
    ): { count: number; errors: number; importedProducts: Product[] } => {
      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
      const colIdx = (keys: string[]) => headerRow.findIndex(h => keys.some(k => normalize(h).includes(normalize(k))));

      const nameIdx   = colIdx(["name", "product"]);
      const cartonIdx = colIdx(["carton", "ctn", "pack"]);
      const colorIdx  = colIdx(["color", "colour"]);
      const lengthIdx = colIdx(["length", "dimension", "len", "dim"]);
      const descIdx   = colIdx(["desc", "description", "note"]);
      const rateIdx   = colIdx(["price", "rate", "code"]);
      const stockIdx  = colIdx(["stock", "quantity", "unit", "qty"]);
      const imageIdx  = colIdx(["image", "photo", "url", "picture"]);

      let imported = 0; let errors = 0;
      const newProducts: Product[] = [];

      dataRows.forEach((cols, i) => {
        const name = nameIdx >= 0 ? cols[nameIdx]?.trim() : "";
        if (!name) { errors++; return; }
        const excelImageUrl = imageIdx >= 0 ? cols[imageIdx]?.trim() : "";
        newProducts.push({
          id: `excel_${Date.now()}_${i}`,
          name,
          stock:       stockIdx  >= 0 ? (parseInt(cols[stockIdx])  || 0) : 0,
          cartonQty:   cartonIdx >= 0 ? (parseInt(cols[cartonIdx]) || 1) : 1,
          rate:        rateIdx   >= 0 ? (cols[rateIdx]?.trim()   || "") : "",
          length:      lengthIdx >= 0 ? (cols[lengthIdx]?.trim() || "") : "",
          color:       colorIdx  >= 0 ? (cols[colorIdx]?.trim()  || "") : "",
          description: descIdx   >= 0 ? (cols[descIdx]?.trim()   || "") : "",
          photoUrl:    imageByRow[i] || excelImageUrl || "",
          createdAt:   new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        });
        imported++;
      });

      if (newProducts.length > 0) {
        // We defer Supabase insertion to the finish() handler since processRows is sync
      }
      return { count: imported, errors, importedProducts: newProducts };
    };

    const finish = async (result: { count: number; errors: number; importedProducts: Product[] }) => {
      if (result.importedProducts.length > 0 && selectedCol) {
        // Map products for Supabase schema
        const productPayloads = result.importedProducts.map(p => ({
          id: p.id,
          name: p.name,
          stock: p.stock,
          cartonQty: p.cartonQty,
          rate: p.rate,
          length: p.length,
          color: p.color,
          description: p.description,
          photoUrl: p.photoUrl,
          collection_id: selectedCol.id
        }));

        try {
          const { error } = await supabase.from('products').insert(productPayloads);
          if (error) throw error;
          
          setProducts(prev => [...result.importedProducts, ...prev]);
          await refreshAllProducts();
        } catch (err) {
          console.error("Failed to batch insert products into Supabase:", err);
          alert("Failed to import products to database.");
        }
      }

      setExcelImportStatus({ count: result.count, errors: result.errors });
      setShowImportResult(true);
      setTimeout(() => setShowImportResult(false), 6000);
      e.target.value = "";
      // Show photo assignment modal so user can add photos to imported products
      if (result.importedProducts.length > 0) {
        setPhotoAssignProducts(result.importedProducts);
        setShowPhotoAssignModal(true);
      }
    };

    const ext = file.name.split(".").pop()?.toLowerCase();

    // ── .xlsx parser (JSZip + XML + embedded images) ──────────────────
    if (ext === "xlsx" || ext === "xls") {
      const JSZip = (await import("jszip")).default;
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);

      // 1. Shared strings
      const sharedStrings: string[] = [];
      const ssFile = zip.file("xl/sharedStrings.xml");
      if (ssFile) {
        const ssXml = await ssFile.async("string");
        const doc = new DOMParser().parseFromString(ssXml, "application/xml");
        doc.querySelectorAll("si").forEach(si => {
          sharedStrings.push(Array.from(si.querySelectorAll("t")).map(t => t.textContent || "").join(""));
        });
      }

      // 2. Sheet data → string[][]
      const sheetFile = zip.file("xl/worksheets/sheet1.xml");
      if (!sheetFile) { finish({ count: 0, errors: 0, importedProducts: [] }); return; }
      const sheetXml = await sheetFile.async("string");
      const sheetDoc = new DOMParser().parseFromString(sheetXml, "application/xml");
      const rowEls = Array.from(sheetDoc.querySelectorAll("sheetData > row"));
      const table: string[][] = rowEls.map(row => {
        const parsed = Array.from(row.querySelectorAll("c")).map(cell => {
          const rAttr = cell.getAttribute("r") || "A1";
          const colLetters = rAttr.replace(/[0-9]/g, "");
          let colNum = 0;
          for (let i = 0; i < colLetters.length; i++) colNum = colNum * 26 + (colLetters.charCodeAt(i) - 64);
          const t = cell.getAttribute("t");
          const vEl = cell.querySelector("v");
          let val = vEl?.textContent || "";
          if (t === "s") val = sharedStrings[parseInt(val)] ?? "";
          return { colNum, val };
        });
        if (!parsed.length) return [];
        const maxCol = Math.max(...parsed.map(p => p.colNum));
        const arr = Array(maxCol).fill("");
        parsed.forEach(p => { arr[p.colNum - 1] = p.val; });
        return arr;
      }).filter(r => r.length > 0);

      if (table.length < 2) { finish({ count: 0, errors: 0, importedProducts: [] }); return; }

      // 3. ── Extract embedded images from xl/drawings/drawing1.xml ─────
      //    Images inserted via Excel "Insert → Picture" land in xl/media/
      //    and are anchored to rows in the drawing XML.
      const imageByRow: Record<number, string> = {}; // 0-based DATA row → base64 dataURL

      const drawingFile = zip.file("xl/drawings/drawing1.xml");
      if (drawingFile) {
        const drawingXml = await drawingFile.async("string");

        // a) Parse drawing rels: rId → media file path
        const rIdToMedia: Record<string, string> = {};
        const drelsFile = zip.file("xl/drawings/_rels/drawing1.xml.rels");
        if (drelsFile) {
          const drelsXml = await drelsFile.async("string");
          // Match Id="rId1" ... Target="../media/image1.png"
          const relRe = /Id="([^"]+)"[^>]+Target="([^"]+)"/g;
          let rm;
          while ((rm = relRe.exec(drelsXml)) !== null) {
            // Target like "../media/image1.png" → "xl/media/image1.png"
            rIdToMedia[rm[1]] = rm[2].replace(/^\.\.\//, "xl/");
          }
        }

        // b) Parse each anchor block for row position + rId
        //    Handles both twoCellAnchor and oneCellAnchor
        const anchorRe = /<xdr:(?:two|one)CellAnchor[^>]*>([\s\S]*?)<\/xdr:(?:two|one)CellAnchor>/g;
        let am;
        while ((am = anchorRe.exec(drawingXml)) !== null) {
          const block = am[1];
          // <xdr:from><xdr:row>N</xdr:row> — N is 0-indexed xlsx row (0 = header row)
          const rowMatch = block.match(/<xdr:from>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/);
          // r:embed="rId1"
          const rIdMatch = block.match(/r:embed="([^"]+)"/);
          if (!rowMatch || !rIdMatch) continue;

          const xlsxRow = parseInt(rowMatch[1]); // 0=header, 1=first data row, …
          if (xlsxRow < 1) continue;             // skip header row
          const dataRowIdx = xlsxRow - 1;        // 0-based data row index

          const mediaPath = rIdToMedia[rIdMatch[1]];
          if (!mediaPath) continue;

          const mediaFile = zip.file(mediaPath);
          if (!mediaFile) continue;

          // c) Read binary and convert to base64 data URL
          const bytes = await mediaFile.async("uint8array");
          const ext2 = (mediaPath.split(".").pop() || "jpg").toLowerCase();
          const mime = ({ jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp" } as Record<string, string>)[ext2] || "image/jpeg";
          let b64 = "";
          const chunk = 8192;
          for (let ci = 0; ci < bytes.length; ci += chunk) {
            b64 += String.fromCharCode(...Array.from(bytes.subarray(ci, ci + chunk)));
          }
          imageByRow[dataRowIdx] = `data:${mime};base64,${btoa(b64)}`;
        }
      }

      // 4. Process rows with extracted images
      finish(processRows(table[0], table.slice(1), imageByRow));
      return;
    }

    // ── .csv / .txt fallback ──────────────────────────────────────────
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length < 2) return;
      finish(processRows(parseCSVLine(lines[0]), lines.slice(1).map(parseCSVLine)));
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  // ── Post-import photo assignment handlers ──────────────────────────
  const handlePhotoAssignClick = (productId: string) => {
    setPhotoAssignTargetId(productId);
    photoAssignInputRef.current?.click();
  };

  const handlePhotoAssignFileChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file || !photoAssignTargetId || !selectedCol) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 800;
        let { width, height } = img;
        if (width > height) { if (width > maxDim) { height = Math.round(height * maxDim / width); width = maxDim; } }
        else { if (height > maxDim) { width = Math.round(width * maxDim / height); height = maxDim; } }
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

        // Update in the photo assign modal list
        setPhotoAssignProducts(prev => prev.map(p =>
          p.id === photoAssignTargetId ? { ...p, photoUrl: dataUrl } : p
        ));

        // Update in main products state + localStorage
        setProducts(prev => {
          const updated = prev.map(p => p.id === photoAssignTargetId ? { ...p, photoUrl: dataUrl } : p);
          localStorage.setItem(`digiscale_products_${selectedCol.id}`, JSON.stringify(updated));
          return updated;
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    ev.target.value = "";
  };

  const handlePhotoAssignDone = () => {
    setShowPhotoAssignModal(false);
    setPhotoAssignProducts([]);
    setPhotoAssignTargetId("");
  };

  const handleEditProductClick = (product: Product) => {
    setEditingProduct(product);
    setProdName(product.name);
    setProdStock(product.stock.toString());
    setProdCartonQty(product.cartonQty.toString());
    setProdRate(product.rate);
    setProdLength(product.length);
    // Parse existing comma-separated colors into chips
    const existingColors = product.color
      ? product.color.split(",").map(c => c.trim()).filter(Boolean)
      : [];
    setProdColors(existingColors);
    setProdColor(product.color);
    setColorInput("");
    setProdDescription(product.description || "");
    setProdPhotoUrl(product.photoUrl);
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    if (!selectedCol) return;

    setConfirmModal({
      isOpen: true,
      title: "Delete Product",
      message: "Are you sure you want to delete this product from the catalog? This action cannot be undone.",
      confirmText: "Delete",
      isDanger: true,
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('products').delete().eq('id', productId);
          if (error) throw error;
          
          setProducts((prev) => prev.filter((p) => p.id !== productId));
          await refreshAllProducts();
        } catch (err) {
          console.error("Failed to delete product from Supabase:", err);
          alert("Failed to delete product.");
        }
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleCreateProductFromAsset = (assetPath: string) => {
    setProdPhotoUrl(assetPath);
    setProdName("");
    setProdStock("");
    setProdCartonQty("");
    setProdRate("");
    setProdLength("");
    setProdColor("");
    setProdDescription("");
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  // Warehouse definitions — rows from state (user can add/remove)
  const rows = warehouseRows;
  const defaultSlots = Array.from({ length: 10 }, (_, i) => i + 1);

  const getSlotsForRow = (row: string): number[] => {
    return warehouseSlots[row] || defaultSlots;
  };

  const handleSaveSlots = (newSlots: Record<string, number[]>) => {
    setWarehouseSlots(newSlots);
    if (typeof window !== "undefined") {
      localStorage.setItem("digiscale_warehouse_slots", JSON.stringify(newSlots));
    }
  };

  const handleAddSlot = (row: string) => {
    const current = getSlotsForRow(row);
    const nextNum = current.length > 0 ? Math.max(...current) + 1 : 1;
    const defaultName = `${row}-${nextNum}`;
    setAddSlotName("");
    setAddSlotModal({ open: true, row, defaultName });
  };

  const handleConfirmAddSlot = async () => {
    const { row, defaultName } = addSlotModal;
    let name = addSlotName.trim() ? addSlotName.trim() : defaultName.split("-")[1];
    
    // If user typed e.g., "A-11", strip the "A-" part so it's just "11"
    if (name.toUpperCase().startsWith(`${row.toUpperCase()}-`)) {
      name = name.substring(row.length + 1);
    }
    
    const slotVal = isNaN(Number(name)) ? name : Number(name);
    
    // Validate slotVal is a valid number, since Supabase expects an integer for slot_number
    if (isNaN(Number(slotVal))) {
      alert("Slot must be a valid number.");
      return;
    }
    
    const current = getSlotsForRow(row);
    // Avoid duplicates
    if (current.includes(slotVal as any)) {
      setAddSlotModal({ open: false, row: "", defaultName: "" });
      setAddSlotName("");
      return;
    }

    try {
      const { error } = await supabase.from('warehouse_slots').insert([{
        id: `${row}-${slotVal}`,
        row_id: row,
        slot_number: slotVal as number
      }]);
      if (error) throw error;

      const updated = { ...warehouseSlots, [row]: [...current, slotVal as any] };
      setWarehouseSlots(updated);
    } catch (err) {
      console.error("Failed to add slot to Supabase:", err);
      alert("Failed to add slot.");
    } finally {
      setAddSlotModal({ open: false, row: "", defaultName: "" });
      setAddSlotName("");
    }
  };

  const handleSaveRows = (newRows: string[]) => {
    setWarehouseRows(newRows);
    if (typeof window !== "undefined") {
      localStorage.setItem("digiscale_warehouse_rows", JSON.stringify(newRows));
    }
  };

  const handleAddRow = async () => {
    const name = addRowName.trim().toUpperCase() || String.fromCharCode(65 + warehouseRows.length);
    if (warehouseRows.includes(name)) return;
    
    try {
      const { error } = await supabase.from('warehouse_rows').insert([{ id: name }]);
      if (error) throw error;
      
      const updated = [...warehouseRows, name];
      setWarehouseRows(updated);
    } catch (err) {
      console.error("Failed to add row to Supabase:", err);
      alert("Failed to add row.");
    } finally {
      setAddRowModal(false);
      setAddRowName("");
    }
  };

  const handleRemoveRow = (row: string) => {
    const hasProducts = Object.keys(warehouseAssignments).some(
      k => k.startsWith(`${row}-`) && warehouseAssignments[k].length > 0
    );
    if (hasProducts) {
      setConfirmModal({
        isOpen: true,
        title: "Cannot Remove Row",
        message: `Row ${row} has products assigned. Remove all products first.`,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        confirmText: "OK",
        isDanger: false,
      });
      return;
    }
    
    setConfirmModal({
      isOpen: true,
      title: "Remove Row",
      message: `Are you sure you want to remove row ${row}?`,
      confirmText: "Remove",
      isDanger: true,
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('warehouse_rows').delete().eq('id', row);
          if (error) throw error;
          
          const updated = warehouseRows.filter(r => r !== row);
          setWarehouseRows(updated);
          if (expandedRow === row) setExpandedRow(null);
          if (selectedLocation?.startsWith(`${row}-`)) setSelectedLocation(null);
        } catch (err) {
          console.error("Failed to remove row from Supabase:", err);
          alert("Failed to remove row.");
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleRemoveSlot = (row: string, slot: number) => {
    const locationUpper = `${row}-${slot}-upper`;
    const locationLower = `${row}-${slot}-lower`;
    const hasProducts = (warehouseAssignments[locationUpper]?.length || 0) > 0 ||
                        (warehouseAssignments[locationLower]?.length || 0) > 0;
    if (hasProducts) {
      setConfirmModal({
        isOpen: true,
        title: "Cannot Remove Slot",
        message: `Slot ${row}-${slot} has assigned products. Remove all products first before deleting this slot.`,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
        confirmText: "OK",
        isDanger: false,
      });
      return;
    }
    
    setConfirmModal({
      isOpen: true,
      title: "Remove Slot",
      message: `Are you sure you want to remove slot ${row}-${slot}?`,
      confirmText: "Remove",
      isDanger: true,
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('warehouse_slots').delete().eq('id', `${row}-${slot}`);
          if (error) throw error;
          
          const current = getSlotsForRow(row);
          const updated = { ...warehouseSlots, [row]: current.filter(s => s !== slot) };
          setWarehouseSlots(updated);
          if (selectedLocation === `${row}-${slot}`) {
            setSelectedLocation(null);
          }
        } catch (err) {
          console.error("Failed to remove slot from Supabase:", err);
          alert("Failed to remove slot.");
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleSaveAssignments = (newAssignments: Record<string, { productId: string; collectionId: string }[]>) => {
    setWarehouseAssignments(newAssignments);
    if (typeof window !== "undefined") {
      localStorage.setItem("digiscale_warehouse_assignments", JSON.stringify(newAssignments));
    }
  };

  const getAssignedCountForRow = (row: string) => {
    let count = 0;
    Object.keys(warehouseAssignments).forEach((locId) => {
      if (locId.startsWith(`${row}-`)) {
        count += warehouseAssignments[locId].length;
      }
    });
    return count;
  };

  const getSlotItemCount = (row: string, slot: number) => {
    const upper = warehouseAssignments[`${row}-${slot}-upper`] || [];
    const lower = warehouseAssignments[`${row}-${slot}-lower`] || [];
    return upper.length + lower.length;
  };

  const getLocationProducts = (locId: string) => {
    const assignments = warehouseAssignments[locId] || [];
    const results: (Product & { collectionName: string; collectionId: string })[] = [];

    assignments.forEach((assignment) => {
      const matched = allProducts.find((p) => p.id === assignment.productId);
      if (matched) {
        results.push({
          ...matched,
          collectionName: matched.collectionName || "Unknown Collection",
          collectionId: assignment.collectionId
        });
      }
    });

    return results;
  };

  const handleRemoveProductFromLocation = async (locId: string, productId: string) => {
    try {
      const { error } = await supabase
        .from('warehouse_assignments')
        .delete()
        .eq('location_key', locId)
        .eq('product_id', productId);
        
      if (error) throw error;
      
      const list = warehouseAssignments[locId] || [];
      const updated = list.filter((item) => item.productId !== productId);
      
      const newAssignments = {
        ...warehouseAssignments,
        [locId]: updated
      };
      
      if (updated.length === 0) {
        delete newAssignments[locId];
      }
      
      setWarehouseAssignments(newAssignments);
    } catch (err) {
      console.error("Failed to remove product from location:", err);
      alert("Failed to remove product from location.");
    }
  };

  const getAllProducts = () => {
    return allProducts as (Product & { collectionName: string; collectionId: string })[];
  };

  const handleAssignProductToLocation = async (locId: string, productId: string, collectionId: string) => {
    const list = warehouseAssignments[locId] || [];
    if (list.some((item) => item.productId === productId)) {
      return;
    }
    
    try {
      const { error } = await supabase.from('warehouse_assignments').insert([{
        location_key: locId,
        product_id: productId,
        collection_id: collectionId
      }]);
      if (error) throw error;
      
      const updated = [...list, { productId, collectionId }];
      const newAssignments = {
        ...warehouseAssignments,
        [locId]: updated
      };
      
      setWarehouseAssignments(newAssignments);
    } catch (err) {
      console.error("Failed to assign product to location:", err);
      alert("Failed to assign product to location.");
    }
  };

  // Get the full zone location ID for current selected shelf
  const getActiveZoneLocationId = () => {
    if (!selectedLocation) return null;
    return `${selectedLocation}-${selectedShelfZone}`;
  };

  const filteredCollections = collections.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.color.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Statistics
  const totalStockItems = products.reduce((sum, p) => sum + p.stock, 0);
  const totalStockVal = products.reduce((sum, p) => sum + (p.stock * (parseFloat(p.rate) || 0)), 0);
  const totalCartons = products.reduce((sum, p) => {
    if (p.cartonQty <= 0) return sum;
    return sum + Math.ceil(p.stock / p.cartonQty);
  }, 0);

  // Global search filtering
  const globalProducts = getAllProducts();
  const query = globalSearchQuery.trim().toLowerCase();
  const filteredGlobalProducts = query
    ? globalProducts.filter((product) => {
        return (
          product.name.toLowerCase().includes(query) ||
          (product.rate && String(product.rate).toLowerCase().includes(query)) ||
          (product.color && String(product.color).toLowerCase().includes(query)) ||
          product.collectionName.toLowerCase().includes(query)
        );
      })
    : [];

  // Render search results UI
  const renderGlobalSearchResults = () => {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 animate-in fade-in duration-150 mb-6">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-black text-slate-800">
              Search Results ({filteredGlobalProducts.length} items found)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Showing matching products across all your collections and warehouse shelves.
            </p>
          </div>
          <button
            onClick={() => setGlobalSearchQuery("")}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-2 transition active:scale-95 cursor-pointer"
          >
            Clear Search
          </button>
        </div>

        {filteredGlobalProducts.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <p className="text-sm font-semibold">No products match your search query</p>
            <p className="text-xs mt-1 font-medium">Try searching by product name, price code, color, or collection name.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 pr-1">
            {filteredGlobalProducts.map((product) => {
              const locations = findWarehouseLocation(product.id, product.collectionId);
              return (
                <div key={`${product.collectionId}-${product.id}`} className="py-5 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 last:border-b-0">
                  {/* Left Side: Product Image & Details */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {product.photoUrl ? (
                      <img
                        src={product.photoUrl}
                        alt={product.name}
                        className="h-16 w-16 rounded-xl object-contain bg-slate-50 border border-slate-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200 flex-shrink-0">
                        <Box className="h-7 w-7 text-slate-350" />
                      </div>
                    )}
                    <div className="min-w-0 space-y-1">
                      <h3 className="text-base font-black text-slate-800 truncate">{product.name}</h3>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                          📁 {product.collectionName}
                        </span>
                        {product.rate && (
                          <span className="bg-slate-100 text-slate-650 px-2.5 py-1 rounded-xl text-[10px] font-bold">
                            Rate: {product.rate}
                          </span>
                        )}
                        {product.color && (
                          <span className="bg-slate-100 text-slate-650 px-2.5 py-1 rounded-xl text-[10px] font-bold">
                            Color: {product.color}
                          </span>
                        )}
                        <span className="bg-slate-100 text-slate-650 px-2.5 py-1 rounded-xl text-[10px] font-bold">
                          Stock: {product.stock} units
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Locations & Actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0 w-full md:w-auto justify-end">
                    {/* Warehouse locations list with individual locate buttons */}
                    <div className="space-y-1.5 w-full sm:w-auto">
                      <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1 sm:text-right">
                        Warehouse Storage Location(s)
                      </span>
                      {locations.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                          {locations.map((loc, i) => (
                            <div key={i} className="flex items-center gap-4 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-1.5 justify-between min-w-[240px]">
                              <span className="text-xs font-bold text-emerald-800">
                                Row {loc.row} Slot {loc.slot} ({loc.zone === "upper" ? "Upper Shelf" : "Lower Shelf"})
                              </span>
                              <button
                                onClick={() => handleLocateInWarehouse(loc.row, loc.slot)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition active:scale-95 cursor-pointer"
                              >
                                Locate
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[10px] font-bold text-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 sm:text-right">
                          Not Stocked in Warehouse
                        </div>
                      )}
                    </div>

                    {/* General actions */}
                    <div className="border-t sm:border-t-0 sm:border-l border-slate-150 pt-4 sm:pt-0 sm:pl-4 flex flex-row sm:flex-col gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => {
                          const targetCol = collections.find((col) => col.id.toString() === product.collectionId.toString());
                          if (targetCol) {
                            setSelectedCol(targetCol);
                            handleOpenCollectionDetail(targetCol);
                          }
                          setGlobalSearchQuery("");
                        }}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 w-full sm:w-auto"
                      >
                        <span>Go to Collection</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="px-8 pt-4 pb-12 min-h-screen bg-slate-50/50">

      {/* DETAIL VIEW MODE */}
      {selectedCol ? (
        <div className="space-y-6">


          <button
            onClick={() => {
              setSelectedCol(null);
              if (typeof window !== "undefined") {
                window.history.pushState(null, "", "?tab=collections");
              }
            }}
            className="group inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-650 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 active:scale-95 mb-4"
          >
            <ChevronLeft className="h-4 w-4 text-slate-400 group-hover:text-slate-650 transition-transform group-hover:-translate-x-0.5" />
            Back to Collections
          </button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 pb-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Folder className="h-6 w-6 text-blue-650 fill-blue-50/20" />
                {selectedCol.name}
              </h2>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProdPhotoUrl("");
                  setProdName("");
                  setProdStock("");
                  setProdCartonQty("");
                  setProdRate("");
                  setProdLength("");
                  setProdColor("");
                  setProdDescription("");
                  setIsProductModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-3 text-xs font-bold text-white transition shadow-sm active:scale-95"
              >
                <Plus className="h-4 w-4" /> Add Product
              </button>

              {/* Excel Import */}
              <button
                onClick={() => excelImportRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-5 py-3 text-xs font-bold text-emerald-700 transition shadow-sm active:scale-95"
                title="Import products from Excel/CSV file"
              >
                <Download className="h-4 w-4 rotate-180" /> Import from Excel
              </button>
              <input
                ref={excelImportRef}
                type="file"
                accept=".csv,.xlsx,.xls,.txt"
                className="hidden"
                onChange={handleExcelImport}
              />

              {/* Excel Template Download */}
              <button
                onClick={downloadExcelTemplate}
                className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-5 py-3 text-xs font-bold text-slate-700 transition shadow-sm active:scale-95"
                title="Download blank Excel template"
              >
                <Download className="h-4 w-4" /> Get Template
              </button>

              <Link
                href="/workspace"
                className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-5 py-3 text-xs font-bold text-slate-700 transition shadow-sm active:scale-95"
              >
                <Sparkles className="h-4 w-4 text-blue-500" /> Go to Workspace
              </Link>
            </div>
          </div>

          {/* Excel Import Result Banner */}
          {showImportResult && excelImportStatus && (
            <div className={`flex items-center justify-between gap-3 px-5 py-3 rounded-2xl text-xs font-semibold border animate-in fade-in slide-in-from-top-1 ${
              excelImportStatus.errors > 0
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}>
              <span>
                ✅ Successfully imported <strong>{excelImportStatus.count}</strong> product{excelImportStatus.count !== 1 ? "s" : ""}
                {excelImportStatus.errors > 0 && ` · ⚠️ ${excelImportStatus.errors} row(s) skipped (missing Product Name)`}
              </span>
              <button onClick={() => setShowImportResult(false)} className="text-slate-500 hover:text-slate-800">✕</button>
            </div>
          )}

          {/* Tabs header */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab("products")}
              className={`px-6 py-3 text-xs font-bold border-b-2 transition ${
                activeTab === "products"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-405 hover:text-slate-700"
              }`}
            >
              Products Catalog ({filteredProducts.length})
            </button>
            <button
              onClick={() => setActiveTab("assets")}
              className={`px-6 py-3 text-xs font-bold border-b-2 transition ${
                activeTab === "assets"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-405 hover:text-slate-700"
              }`}
            >
              Workspace Images ({detailImages.length})
            </button>
          </div>

          {/* TAB CONTENT: PRODUCTS LISTING */}
          {activeTab === "products" && (
            <div className="space-y-4">
              {/* Product search bar */}
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-405" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products by name or color..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-xs font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                />
              </div>

              {filteredProducts.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 bg-white">
                  <Box className="h-10 w-10 text-slate-300 mb-3" />
                  <h4 className="font-bold text-slate-800 text-sm">No Products Added Yet</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-[320px] leading-relaxed">
                    Add product item cards with specs (photo, stock, carton size, length, color & rate) inside this collection catalog.
                  </p>
                  <button
                    onClick={() => setIsProductModalOpen(true)}
                    className="mt-4 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white transition active:scale-95 shadow-sm"
                  >
                    Add Product Now
                  </button>
                </div>
              ) : (
                <div className="overflow-hidden border border-slate-200 rounded-2xl bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black uppercase tracking-wider text-slate-450">
                          <th className="py-4 px-6">Photo</th>
                          <th className="py-4 px-6">Product Details</th>
                          <th className="py-4 px-6">Color</th>
                          <th className="py-4 px-6">Length</th>
                          <th className="py-4 px-6">Stock Status</th>
                          <th className="py-4 px-6">Box Packing</th>
                          <th className="py-4 px-6 text-right">Price Code</th>
                          <th className="py-4 px-6 text-right">Value</th>
                          <th className="py-4 px-6 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredProducts.map((prod) => {
                          const cartonCount = prod.cartonQty > 0 ? Math.ceil(prod.stock / prod.cartonQty) : 0;
                          return (
                            <tr key={prod.id} className="text-xs text-slate-800 hover:bg-slate-50/40 transition">
                              <td className="py-4 px-6">
                                <div className="h-12 w-12 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center p-1.5">
                                  {prod.photoUrl ? (
                                    <img src={prod.photoUrl} alt={prod.name} className="h-full w-full object-contain" />
                                  ) : (
                                    <ImageIcon className="h-5 w-5 text-slate-300" />
                                  )}
                                </div>
                              </td>
                              <td className="py-4 px-6 font-bold">
                                <p className="text-slate-900 font-extrabold text-sm">{prod.name}</p>
                                {prod.description && (
                                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{prod.description}</p>
                                )}
                              </td>
                              <td className="py-4 px-6">
                                {prod.color ? (
                                  <div className="flex flex-wrap gap-1">
                                    {prod.color.split(",").map((c, i) => (
                                      <span key={i} className="inline-block px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100 whitespace-nowrap">
                                        {c.trim()}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-350 text-xs">—</span>
                                )}
                              </td>
                              <td className="py-4 px-6 font-semibold text-slate-600">
                                {prod.length || "—"}
                              </td>
                              <td className="py-4 px-6">
                                <p className="font-extrabold text-slate-800">{prod.stock} units</p>
                                <p className="text-[10px] text-slate-400 font-medium">Available</p>
                              </td>
                              <td className="py-4 px-6">
                                <p className="font-bold text-slate-700">{prod.cartonQty} / Carton</p>
                                <p className="text-[10px] text-slate-400 font-medium">{cartonCount} boxes total</p>
                              </td>
                              <td className="py-4 px-6 text-right font-extrabold text-slate-800">
                                {prod.rate}
                              </td>
                              <td className="py-4 px-6 text-right font-black text-slate-900">
                                ₹{(prod.stock * (parseFloat(prod.rate) || 0)).toLocaleString()}
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleEditProductClick(prod)}
                                    className="p-2 rounded-lg border border-slate-200 text-slate-655 hover:bg-slate-50 transition"
                                    title="Edit Product"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(prod.id)}
                                    className="p-2 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition"
                                    title="Delete Product"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: WORKSPACE ASSETS */}
          {activeTab === "assets" && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 font-medium">
                These are transparent backdrop images processed in the studio. You can click "Create Product" to easily convert them into catalog listings.
              </p>

              {loadingDetail ? (
                <div className="py-16 flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 text-blue-655 animate-spin" />
                  <p className="mt-2 text-xs text-slate-405 font-semibold animate-pulse">Loading gallery assets...</p>
                </div>
              ) : detailImages.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-400 bg-white">
                  <ImageIcon className="h-10 w-10 text-slate-300 mb-3" />
                  <h4 className="font-bold text-slate-800 text-sm">No Canvas Assets</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                    Work on backgrounds inside the studio editor and save your exports here.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                  {detailImages.map((img, idx) => {
                    const imgPath = img.processed_path?.startsWith("data:") || img.processed_path?.startsWith("http")
                      ? img.processed_path
                      : `http://localhost:8000/${img.processed_path || img.original_path}`;

                    return (
                      <div
                        key={img.id || idx}
                        className="group relative rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:border-blue-200 hover:shadow-md transition duration-205 flex flex-col"
                      >
                        <div className="relative h-48 bg-slate-50 border-b border-slate-100 flex items-center justify-center p-3 select-none">
                          <img
                            src={imgPath}
                            alt={`Asset ${idx + 1}`}
                            className="max-h-full max-w-full object-contain pointer-events-none transition group-hover:scale-105 duration-300"
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2.5">
                            <a
                              href={imgPath}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-full bg-white hover:bg-slate-100 text-slate-805 transition"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                            <a
                              href={imgPath}
                              download={`asset_${idx}.png`}
                              className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </div>
                        </div>

                        <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Asset ID</p>
                              <p className="text-xs font-bold text-slate-800">Asset #{img.id || idx + 1}</p>
                            </div>
                            <span className="text-[9px] font-bold text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full uppercase tracking-widest">
                              Ready
                            </span>
                          </div>

                          <button
                            onClick={() => handleCreateProductFromAsset(imgPath)}
                            className="w-full py-2 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-xl text-center text-xs font-bold text-slate-700 transition"
                          >
                            Create Product
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* MAIN LIST/GRID VIEW */
        <>
          {!isTabReady ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {/* Top Tabs */}
              <div className="flex items-center justify-between border-b border-slate-200 mb-4">
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setCurrentTopTab("collections");
                      if (typeof window !== "undefined") {
                        window.history.pushState(null, "", "?tab=collections");
                      }
                    }}
                    className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold border-b-[3px] transition ${
                      currentTopTab === "collections"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    📁 Collections
                  </button>
                  <button
                    onClick={() => {
                      setCurrentTopTab("warehouse");
                      if (typeof window !== "undefined") {
                        window.history.pushState(null, "", "?tab=warehouse");
                      }
                    }}
                    className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold border-b-[3px] transition ${
                      currentTopTab === "warehouse"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    🏢 Warehouse
                  </button>
                  <button
                    onClick={() => {
                      setCurrentTopTab("quotation");
                      if (typeof window !== "undefined") {
                        window.history.pushState(null, "", "?tab=quotation");
                      }
                    }}
                    className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold border-b-[3px] transition ${
                      currentTopTab === "quotation"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    📄 Quotation
                  </button>
                </div>
              </div>

              {currentTopTab === "collections" ? (
                <>
              {/* Toolbar */}
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
                {/* Search Inputs Row */}
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-3xl">
                  {/* Collections Search */}
                  <div className="relative w-full sm:w-[35%]">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search collections..."
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-xs font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                  {/* Global Finder */}
                  <div className="relative w-full sm:w-[65%]">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-400" />
                    <input
                      type="text"
                      value={globalSearchQuery}
                      onChange={(e) => setGlobalSearchQuery(e.target.value)}
                      placeholder="Global Finder (Search all products)..."
                      className="w-full rounded-xl border border-sky-200 bg-white py-2.5 pl-11 pr-10 text-xs font-bold text-slate-700 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 shadow-sm"
                    />
                    {globalSearchQuery && (
                      <button
                        onClick={() => setGlobalSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-650 rounded-lg hover:bg-slate-100 transition"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* View Toggle and Action Button */}
                <div className="flex items-center gap-3">
                  <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`rounded-lg p-2.5 transition ${
                        viewMode === "grid"
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => setViewMode("list")}
                      className={`rounded-lg p-2.5 transition ${
                        viewMode === "list"
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white transition shadow-sm active:scale-95 shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                    New Collection
                  </button>
                </div>
              </div>

              {globalSearchQuery.trim() !== "" ? (
                renderGlobalSearchResults()
              ) : (
                <>
                {loading ? (
                  <div className="mt-16 flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                    <p className="mt-2 text-sm text-slate-500">Loading your collections...</p>
                  </div>
                ) : filteredCollections.length === 0 ? (
                  <div className="mt-16 flex flex-col items-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                      <Folder className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900">
                      No collections found
                    </h3>
                    <p className="mt-2 text-slate-550">
                      {search
                        ? "Try a different search term."
                        : "Create your first collection to catalog multiple items."}
                    </p>
                  </div>
                ) : (
                  <div
                    className={`mt-6 ${
                      viewMode === "grid"
                        ? "grid gap-5 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]"
                        : "space-y-3"
                    }`}
                  >
                    {filteredCollections.map((col) => {
                      // Format creation date
                      const dateStr = col.createdAt || (col.created_at ? new Date(col.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Today");

                      // Get local products count for this collection
                      let productCount = 0;
                      if (typeof window !== "undefined") {
                        const cachedProds = localStorage.getItem(`digiscale_products_${col.id}`);
                        if (cachedProds) {
                          try {
                            const parsedProds = JSON.parse(cachedProds);
                            productCount = parsedProds.length;
                          } catch(e) {}
                        }
                      }

                      return viewMode === "grid" ? (
                        /* Grid Card */
                        <div
                          key={col.id}
                          onClick={() => handleOpenCollectionDetail(col)}
                          className="group relative flex flex-col rounded-[22px] border border-slate-200/70 bg-white p-3 transition-all duration-300 hover:border-blue-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] cursor-pointer aspect-square h-auto"
                        >
                          {/* Folder Icon / Preview Area */}
                          <div className="relative flex flex-1 min-h-0 w-full items-center justify-center rounded-[16px] bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-100/80 group-hover:bg-blue-50/40 transition-colors duration-500 overflow-visible z-10">
                            {/* Decorative background blur */}
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-100/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[16px]" />
                            
                            <div className="relative transform transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-1 z-10">
                                <div className="absolute inset-0 bg-blue-200/50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <Folder className="relative h-14 w-14 text-blue-500/70 fill-blue-50 group-hover:text-blue-600 transition-colors duration-300" strokeWidth={1.5} />
                            </div>
                            
                            {/* Options Button */}
                            <div className="absolute top-2.5 right-2.5 z-50">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdownId(activeDropdownId === col.id ? null : col.id);
                                  }}
                                  className="rounded-[10px] p-2 bg-white/80 backdrop-blur-md border border-slate-200/60 text-slate-400 opacity-0 transition-all duration-300 hover:bg-white hover:text-slate-700 hover:shadow-sm group-hover:opacity-100 focus:opacity-100"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                                
                                {activeDropdownId === col.id && (
                                  <div className="absolute right-0 top-full mt-2 w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-200/50">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setRenamingCol(col);
                                        setRenameValue(col.name);
                                        setActiveDropdownId(null);
                                      }}
                                      className="w-full text-left rounded-lg px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                                    >
                                      Rename
                                    </button>
                                    <button
                                      onClick={(e) => handleDeleteCollection(col.id, e)}
                                      className="w-full text-left rounded-lg px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition mt-0.5"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                            </div>
                          </div>

                          {/* Info Area */}
                          <div className="mt-4 px-2.5 flex flex-col justify-end shrink-0 pb-1 z-20">
                            <div>
                              <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-[15px] truncate pr-2">
                                {col.name}
                              </h3>
                              <div className="mt-1 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                                  <span className="flex items-center gap-1.5">
                                    <div className="h-[4.5px] w-[4.5px] rounded-full bg-slate-300 group-hover:bg-blue-300 transition-colors" />
                                    {productCount} {productCount === 1 ? 'product' : 'products'}
                                  </span>
                                  <span className="text-slate-300 font-normal">·</span>
                                  <span>{dateStr}</span>
                                </div>
                                <div className="h-7 w-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all duration-300 border border-transparent group-hover:border-blue-100 shrink-0">
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* List Row */
                        <div
                          key={col.id}
                          onClick={() => handleOpenCollectionDetail(col)}
                          className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-6 py-4 transition hover:border-blue-200 hover:shadow-sm cursor-pointer"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
                              <Folder className="h-6 w-6 text-blue-550/80 fill-blue-50/50" />
                            </div>

                            <div>
                              <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {col.name}
                              </h3>

                              <p className="text-xs text-slate-400 font-semibold">
                                {productCount} products · {dateStr}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdownId(activeDropdownId === col.id ? null : col.id);
                                }}
                                className="rounded-lg p-2 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </button>

                              {activeDropdownId === col.id && (
                                <div className="absolute right-0 top-full mt-1 z-10 w-32 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRenamingCol(col);
                                      setRenameValue(col.name);
                                      setActiveDropdownId(null);
                                    }}
                                    className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                                  >
                                    Rename
                                  </button>
                                  <button
                                    onClick={(e) => handleDeleteCollection(col.id, e)}
                                    className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-bold text-red-655 hover:bg-red-50 transition"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
          ) : currentTopTab === "warehouse" ? (
            /* WAREHOUSE — REDESIGNED */
            <>
              {/* Warehouse Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 mt-2">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-400" />
                  <input
                    type="text"
                    value={globalSearchQuery}
                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                    placeholder="Global Finder (Search all products)..."
                    className="w-full rounded-xl border border-sky-200 bg-white py-2.5 pl-11 pr-10 text-xs font-bold text-slate-700 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 shadow-sm"
                  />
                  {globalSearchQuery && (
                    <button
                      onClick={() => setGlobalSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-650 rounded-lg hover:bg-slate-100 transition"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Hidable warehouse content */}
              {globalSearchQuery.trim() !== "" ? (
                renderGlobalSearchResults()
              ) : (
                <div className="flex gap-6 items-start">

              {/* ── LEFT: Shelf row list ── */}
              <div className="flex-1 min-w-0 space-y-2">
                {rows.map((row) => {
                  const isExpanded = expandedRow === row;
                  const assignedCount = getAssignedCountForRow(row);
                  const rowSlots = getSlotsForRow(row);
                  const hasItems = assignedCount > 0;

                  return (
                    <div
                      key={row}
                      className={`rounded-2xl border bg-white overflow-hidden transition-all duration-200 ${
                        isExpanded
                          ? "border-blue-200 shadow-md shadow-blue-50"
                          : "border-slate-200 shadow-sm hover:border-slate-300"
                      }`}
                    >
                      {/* Row Header */}
                      <div
                        onClick={() => setExpandedRow(isExpanded ? null : row)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/40 transition text-left cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition ${
                            isExpanded
                              ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                              : "bg-blue-50 border border-blue-100 text-blue-600"
                          }`}>
                            {row}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm leading-tight">Row {row} Shelf</h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-400 font-medium">{rowSlots.length} slots</span>
                              {hasItems && (
                                <>
                                  <span className="text-slate-300">·</span>
                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                                    {assignedCount} stocked
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider transition ${
                            isExpanded ? "text-blue-500" : "text-slate-400"
                          }`}>
                            {isExpanded ? "Collapse" : "Expand"}
                          </span>
                          <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${
                            isExpanded ? "rotate-90 text-blue-500" : "text-slate-300"
                          }`} />
                          
                          {/* Row Delete Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveRow(row);
                            }}
                            className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition shrink-0 cursor-pointer"
                            title={`Delete Row ${row}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Slot Grid */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-gradient-to-b from-slate-50/60 to-white px-5 pt-4 pb-5">
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                            {rowSlots.map((slot) => {
                              const locationId = `${row}-${slot}`;
                              const isSelected = selectedLocation === locationId;
                              const itemCount = getSlotItemCount(row, slot);
                              const isFilled = itemCount > 0;

                              return (
                                <div key={locationId} className="relative group/slot">
                                  <button
                                    onClick={() => {
                                      setSelectedLocation(locationId);
                                      setSelectedShelfZone("upper");
                                      if (typeof window !== "undefined") {
                                        window.history.pushState(null, "", `?tab=warehouse&locId=${locationId}`);
                                      }
                                    }}
                                    className={`w-full flex flex-col items-center justify-center py-4 px-1 rounded-xl border-2 text-center transition-all duration-150 active:scale-95 cursor-pointer ${
                                      isSelected
                                        ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200"
                                        : isFilled
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-800 hover:border-emerald-400"
                                        : "bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50/30"
                                    }`}
                                  >
                                    <span className="text-[11px] font-black tracking-wide leading-none">{locationId}</span>
                                    <span className={`text-[8px] font-bold mt-2 px-1.5 py-0.5 rounded-full leading-none ${
                                      isSelected
                                        ? "bg-white/20 text-white"
                                        : isFilled
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-slate-100 text-slate-400"
                                    }`}>
                                      {isFilled ? `${itemCount} item${itemCount > 1 ? "s" : ""}` : "empty"}
                                    </span>
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleRemoveSlot(row, slot); }}
                                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition shadow-sm hover:bg-red-600 cursor-pointer z-10"
                                    title={`Remove slot ${locationId}`}
                                  >
                                    <Minus className="h-2.5 w-2.5" />
                                  </button>
                                </div>
                              );
                            })}

                            {/* Add Slot */}
                            <button
                              onClick={() => handleAddSlot(row)}
                              className="flex flex-col items-center justify-center py-4 px-1 rounded-xl border-2 border-dashed border-slate-200 text-slate-300 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/20 transition cursor-pointer active:scale-95"
                            >
                              <Plus className="h-4 w-4" />
                              <span className="text-[8px] font-bold mt-1.5 uppercase tracking-widest">Add</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add New Row */}
                <button
                  onClick={() => { setAddRowName(""); setAddRowModal(true); }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/10 py-4 transition cursor-pointer active:scale-95"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Add New Row</span>
                </button>
              </div>

              {/* ── RIGHT: Slot Detail Panel (40% proportional width) ── */}
              <div className="w-[380px] shrink-0">
                <div className="border border-slate-200 rounded-2xl bg-white shadow-sm sticky top-20 overflow-hidden">
                  {selectedLocation ? (() => {
                    const zoneLocId = getActiveZoneLocationId();
                    const zoneProducts = zoneLocId ? getLocationProducts(zoneLocId) : [];
                    return (
                      <>
                        {/* Panel Header gradient */}
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-5 py-4">
                          <span className="text-[9px] font-black uppercase text-blue-200 tracking-widest">Active Slot</span>
                          <h3 className="text-lg font-black text-white mt-0.5">Shelf {selectedLocation}</h3>
                        </div>

                        <div className="p-4 space-y-3">
                          {/* Upper / Lower Toggle */}
                          <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
                            <button
                              onClick={() => setSelectedShelfZone("upper")}
                              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                                selectedShelfZone === "upper"
                                  ? "bg-white text-blue-600 shadow-sm"
                                  : "text-slate-400 hover:text-slate-600"
                              }`}
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                              Upper
                              <span className={`text-[9px] min-w-[18px] text-center px-1.5 py-0.5 rounded-full font-black ${
                                selectedShelfZone === "upper" ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-500"
                              }`}>
                                {(warehouseAssignments[`${selectedLocation}-upper`] || []).length}
                              </span>
                            </button>
                            <button
                              onClick={() => setSelectedShelfZone("lower")}
                              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                                selectedShelfZone === "lower"
                                  ? "bg-white text-blue-600 shadow-sm"
                                  : "text-slate-400 hover:text-slate-600"
                              }`}
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                              Lower
                              <span className={`text-[9px] min-w-[18px] text-center px-1.5 py-0.5 rounded-full font-black ${
                                selectedShelfZone === "lower" ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-500"
                              }`}>
                                {(warehouseAssignments[`${selectedLocation}-lower`] || []).length}
                              </span>
                            </button>
                          </div>

                          {/* Assign Button */}
                          <button
                            onClick={() => { setAssignSearchQuery(""); setIsAssignModalOpen(true); }}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-sm font-bold text-white transition active:scale-95 shadow-sm cursor-pointer"
                          >
                            <Plus className="h-4 w-4" />
                            Assign to {selectedShelfZone === "upper" ? "Upper" : "Lower"} Shelf
                          </button>

                          {/* Product Cards */}
                          <div className="space-y-2 max-h-[420px] overflow-y-auto">
                            {zoneProducts.length === 0 ? (
                              <div className="flex flex-col items-center justify-center text-center py-10">
                                <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                                  <Box className="h-6 w-6 text-slate-300" />
                                </div>
                                <p className="text-xs font-bold text-slate-700">{selectedShelfZone === "upper" ? "Upper" : "Lower"} shelf is empty</p>
                                <p className="text-[10px] text-slate-400 mt-1">Assign products using the button above.</p>
                              </div>
                            ) : (
                              zoneProducts.map((prod) => (
                                <div
                                  key={prod.id}
                                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 hover:shadow-sm transition cursor-pointer group/card"
                                  onClick={() => setViewingProduct(prod)}
                                >
                                  <div className="h-14 w-14 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                                    {prod.photoUrl ? (
                                      <img src={prod.photoUrl} alt={prod.name} className="h-full w-full object-contain" />
                                    ) : (
                                      <ImageIcon className="h-6 w-6 text-slate-300" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-bold text-slate-900 text-xs leading-tight truncate">{prod.name}</h5>
                                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                                        {prod.stock} units
                                      </span>
                                      {prod.rate && (
                                        <span className="text-[9px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full">
                                          ₹{prod.rate}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); zoneLocId && handleRemoveProductFromLocation(zoneLocId, prod.id); }}
                                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition opacity-0 group-hover/card:opacity-100 shrink-0 cursor-pointer"
                                    title="Remove"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })() : (
                    <div className="flex flex-col items-center justify-center text-center p-10 min-h-[300px]">
                      <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                        <Box className="h-7 w-7 text-slate-300" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">Select a shelf slot</h4>
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed max-w-[200px]">
                        Expand any row and click a slot to view and manage assigned products.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
          ) : (
            <div className="mt-6">
              <QuotationView />
            </div>
          )}
        </>
      )}
    </>
  )}

      {/* SEARCHABLE ASSIGN PRODUCT MODAL */}
      {isAssignModalOpen && selectedLocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Assign to {selectedLocation} — {selectedShelfZone === "upper" ? "Upper" : "Lower"} Shelf</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Search and select items from any collection.</p>
              </div>
              <button
                onClick={() => {
                  setIsAssignModalOpen(false);
                  setAssignSearchQuery("");
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative mt-4 mb-4">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={assignSearchQuery}
                onChange={(e) => setAssignSearchQuery(e.target.value)}
                placeholder="Search by Product Name or Product Code..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-xs font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              />
            </div>

            {/* Product list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[300px]">
              {(() => {
                const allProducts = getAllProducts();
                const filteredAssignProducts = allProducts.filter((p) => {
                  const q = assignSearchQuery.trim().toLowerCase();
                  return p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
                });

                if (filteredAssignProducts.length === 0) {
                  return (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-center">
                      <Box className="h-8 w-8 text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-800">No products found</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Try searching for another product name or code.</p>
                    </div>
                  );
                }

                return filteredAssignProducts.map((prod) => {
                  const zoneId = `${selectedLocation}-${selectedShelfZone}`;
                  const isAssigned = (warehouseAssignments[zoneId] || []).some(
                    (item) => item.productId === prod.id
                  );

                  return (
                    <div
                      key={prod.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 overflow-hidden flex items-center justify-center p-1.5">
                          {prod.photoUrl ? (
                            <img src={prod.photoUrl} alt={prod.name} className="h-full w-full object-contain" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-slate-300" />
                          )}
                        </div>
                        <div>
                          <h5 className="font-extrabold text-slate-900 text-xs leading-none">{prod.name}</h5>
                          <p className="text-[9px] text-slate-400 font-semibold mt-1">Code: {prod.id}</p>
                          <p className="text-[8px] text-blue-600 bg-blue-50/50 px-1.5 py-0.5 rounded border border-blue-100/30 font-bold inline-block mt-1 uppercase tracking-wider">
                            {prod.collectionName}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const zId = `${selectedLocation}-${selectedShelfZone}`;
                          if (isAssigned) {
                            handleRemoveProductFromLocation(zId, prod.id);
                          } else {
                            handleAssignProductToLocation(zId, prod.id, prod.collectionId);
                          }
                        }}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition active:scale-95 duration-100 ${
                          isAssigned
                            ? "bg-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {isAssigned ? "Assigned (Remove)" : "Assign"}
                      </button>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="flex items-center justify-end border-t border-slate-100 pt-4 mt-4">
              <button
                onClick={() => {
                  setIsAssignModalOpen(false);
                  setAssignSearchQuery("");
                }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-655 hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE COLLECTION DIALOG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Create New Collection</h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setNewCollectionName("");
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="mt-4 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Collection Name
                </label>
                <input
                  type="text"
                  required
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="e.g. Textiles Summer 2026"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewCollectionName("");
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-55 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !newCollectionName.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white transition disabled:opacity-50"
                >
                  {isCreating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Create Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENAME COLLECTION DIALOG MODAL */}
      {renamingCol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Rename Collection</h3>
              <button
                onClick={() => {
                  setRenamingCol(null);
                  setRenameValue("");
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRenameCollectionSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  New Collection Name
                </label>
                <input
                  type="text"
                  required
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  placeholder="e.g. Summer Outfits"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setRenamingCol(null);
                    setRenameValue("");
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRenaming || !renameValue.trim() || renameValue.trim() === renamingCol.name}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white transition disabled:opacity-50"
                >
                  {isRenaming && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Rename
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── POST-IMPORT PHOTO ASSIGNMENT MODAL ── */}
      {showPhotoAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="my-6 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-blue-500" />
                  Add Photos to Imported Products
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">Click on each product to select its photo from your computer</p>
              </div>
              <button
                onClick={handlePhotoAssignDone}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photoAssignProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="group rounded-xl border border-slate-200 bg-slate-50/50 p-3 hover:border-blue-200 hover:bg-blue-50/30 transition cursor-pointer"
                    onClick={() => handlePhotoAssignClick(prod.id)}
                    onDragOver={(ev) => { ev.preventDefault(); ev.currentTarget.classList.add("border-blue-400", "bg-blue-50"); }}
                    onDragLeave={(ev) => { ev.currentTarget.classList.remove("border-blue-400", "bg-blue-50"); }}
                    onDrop={(ev) => {
                      ev.preventDefault();
                      ev.currentTarget.classList.remove("border-blue-400", "bg-blue-50");
                      const file = ev.dataTransfer.files?.[0];
                      if (!file || !file.type.startsWith("image/") || !selectedCol) return;
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        const src = e.target?.result as string;
                        const img = new window.Image();
                        img.onload = () => {
                          const canvas = document.createElement("canvas");
                          const maxDim = 800;
                          let { width, height } = img;
                          if (width > height) { if (width > maxDim) { height = Math.round(height * maxDim / width); width = maxDim; } }
                          else { if (height > maxDim) { width = Math.round(width * maxDim / height); height = maxDim; } }
                          canvas.width = width; canvas.height = height;
                          canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
                          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
                          setPhotoAssignProducts(prev => prev.map(p => p.id === prod.id ? { ...p, photoUrl: dataUrl } : p));
                          setProducts(prev => {
                            const updated = prev.map(p => p.id === prod.id ? { ...p, photoUrl: dataUrl } : p);
                            localStorage.setItem(`digiscale_products_${selectedCol.id}`, JSON.stringify(updated));
                            return updated;
                          });
                        };
                        img.src = src;
                      };
                      reader.readAsDataURL(file);
                    }}
                  >
                    {/* Photo area */}
                    <div className="h-24 w-full rounded-lg border-2 border-dashed border-slate-200 bg-white flex items-center justify-center overflow-hidden mb-2 group-hover:border-blue-300 transition">
                      {prod.photoUrl ? (
                        <img src={prod.photoUrl} alt={prod.name} className="h-full w-full object-contain p-1" />
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="h-5 w-5 text-slate-300 mx-auto mb-0.5" />
                          <span className="text-[9px] font-bold text-slate-400 uppercase">Click to add</span>
                        </div>
                      )}
                    </div>
                    {/* Product info */}
                    <p className="text-[11px] font-bold text-slate-800 truncate">{prod.name}</p>
                    {prod.color && (
                      <div className="flex flex-wrap gap-0.5 mt-1">
                        {prod.color.split(",").slice(0, 3).map((c, i) => (
                          <span key={i} className="px-1.5 py-0 rounded bg-blue-50 text-blue-600 text-[8px] font-bold border border-blue-100">
                            {c.trim()}
                          </span>
                        ))}
                        {prod.color.split(",").length > 3 && (
                          <span className="text-[8px] text-slate-400">+{prod.color.split(",").length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
              <p className="text-[11px] text-slate-400">
                {photoAssignProducts.filter(p => p.photoUrl).length} / {photoAssignProducts.length} photos added
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handlePhotoAssignDone}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Skip
                </button>
                <button
                  onClick={handlePhotoAssignDone}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
          {/* Hidden file input for photo assignment */}
          <input
            type="file"
            ref={photoAssignInputRef}
            accept="image/*"
            onChange={handlePhotoAssignFileChange}
            className="hidden"
          />
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="my-8 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? "Edit Product Details" : "Add Product to Collection"}
              </h3>
              <button
                onClick={resetProductForm}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-4">
              
              {/* ── Photo drag-drop zone + Name/Carton row ── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                {/* Drag & Drop Photo Zone */}
                <div className="sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Photo</label>
                  <div
                    className={`h-36 w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden relative transition-colors cursor-pointer
                      ${isDraggingPhoto ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40"}`}
                    onClick={() => !prodPhotoUrl && productFileInputRef.current?.click()}
                    onDragOver={(ev) => { ev.preventDefault(); setIsDraggingPhoto(true); }}
                    onDragLeave={() => setIsDraggingPhoto(false)}
                    onDrop={(ev) => {
                      ev.preventDefault();
                      setIsDraggingPhoto(false);
                      const file = ev.dataTransfer.files?.[0];
                      if (!file || !file.type.startsWith("image/")) return;
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        const src = e.target?.result as string;
                        const img = new window.Image();
                        img.onload = () => {
                          const canvas = document.createElement("canvas");
                          const maxDim = 800;
                          let { width, height } = img;
                          if (width > height) { if (width > maxDim) { height = Math.round(height * maxDim / width); width = maxDim; } }
                          else { if (height > maxDim) { width = Math.round(width * maxDim / height); height = maxDim; } }
                          canvas.width = width; canvas.height = height;
                          canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
                          setProdPhotoUrl(canvas.toDataURL("image/jpeg", 0.7));
                        };
                        img.src = src;
                      };
                      reader.readAsDataURL(file);
                    }}
                  >
                    {prodPhotoUrl ? (
                      <>
                        <img src={prodPhotoUrl} alt="Preview" className="h-full w-full object-contain p-2" />
                        <button
                          type="button"
                          onClick={(ev) => { ev.stopPropagation(); setProdPhotoUrl(""); }}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white transition"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <div className="text-center px-3 select-none">
                        <ImageIcon className={`h-7 w-7 mx-auto mb-1.5 transition ${isDraggingPhoto ? "text-blue-400" : "text-slate-300"}`} />
                        <span className="text-[10px] font-bold text-slate-450 uppercase block">
                          {isDraggingPhoto ? "Drop to upload" : "Drag & Drop"}
                        </span>
                        <span className="text-[9px] text-slate-350 mt-0.5 block">or click to browse</span>
                      </div>
                    )}
                  </div>
                  <input type="file" ref={productFileInputRef} accept="image/*" onChange={handleProductPhotoChange} className="hidden" />
                </div>

                <div className="sm:col-span-2 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      placeholder="e.g. Silk Saree Premium"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 font-extrabold text-blue-650">
                      Carton Pack Qty
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={prodCartonQty}
                      onChange={(e) => setProdCartonQty(e.target.value)}
                      placeholder="e.g. 24 units/box"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>
              </div>

              {/* ── Multi-Color Chips & Length Row ── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Colors <span className="text-slate-350 font-normal normal-case">(press Enter or comma to add)</span>
                  </label>
                  {/* Chips container */}
                  <div
                    className="min-h-[42px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 flex flex-wrap gap-1.5 items-center focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition cursor-text"
                    onClick={() => document.getElementById("colorChipInput")?.focus()}
                  >
                    {prodColors.map((c, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-100 text-blue-700 text-[10px] font-bold"
                      >
                        {c}
                        <button
                          type="button"
                          onClick={() => setProdColors(prodColors.filter((_, j) => j !== i))}
                          className="hover:text-red-500 transition ml-0.5"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                    <input
                      id="colorChipInput"
                      type="text"
                      value={colorInput}
                      onChange={(e) => setColorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.key === "Enter" || e.key === ",") && colorInput.trim()) {
                          e.preventDefault();
                          const newColor = colorInput.trim().replace(/,+$/, "");
                          if (newColor && !prodColors.includes(newColor)) {
                            setProdColors([...prodColors, newColor]);
                          }
                          setColorInput("");
                        } else if (e.key === "Backspace" && !colorInput && prodColors.length > 0) {
                          setProdColors(prodColors.slice(0, -1));
                        }
                      }}
                      onBlur={() => {
                        if (colorInput.trim()) {
                          const newColor = colorInput.trim().replace(/,+$/, "");
                          if (newColor && !prodColors.includes(newColor)) {
                            setProdColors([...prodColors, newColor]);
                          }
                          setColorInput("");
                        }
                      }}
                      placeholder={prodColors.length === 0 ? "e.g. Royal Blue" : ""}
                      className="flex-1 min-w-[80px] outline-none bg-transparent text-xs font-semibold text-slate-800 placeholder:text-slate-350"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Length / Dimensions
                  </label>
                  <input
                    type="text"
                    value={prodLength}
                    onChange={(e) => setProdLength(e.target.value)}
                    placeholder="e.g. 5.5 meters"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold outline-none transition focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Description, Price Code & Stock Row */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={prodDescription}
                    onChange={(e) => setProdDescription(e.target.value)}
                    placeholder="e.g. 12dzn"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 font-extrabold text-blue-650">
                    Price Code
                  </label>
                  <input
                    type="text"
                    value={prodRate}
                    onChange={(e) => setProdRate(e.target.value)}
                    placeholder="e.g. 950 or PC-12"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 font-extrabold text-green-600">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    placeholder="e.g. 120"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />
                </div>
              </div>

              {/* Modal footer action buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                <button
                  type="button"
                  onClick={resetProductForm}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white transition active:scale-95"
                >
                  {editingProduct ? "Save Changes" : "Add Product"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 backdrop-blur-[3px] animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className={`rounded-full p-3.5 ${confirmModal.isDanger ? 'bg-red-50 text-red-600 border border-red-100/50' : 'bg-blue-50 text-blue-600 border border-blue-100/50'}`}>
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mt-4">
                {confirmModal.title}
              </h3>
              <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed max-w-[280px]">
                {confirmModal.message}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition active:scale-95"
              >
                {confirmModal.cancelText || "Cancel"}
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`flex-1 rounded-xl py-2.5 text-xs font-bold text-white transition active:scale-95 shadow-sm ${
                  confirmModal.isDanger
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {confirmModal.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT OVERVIEW MODAL — COMPACT & NO SCROLL REDESIGN */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 tracking-wider">
                  Product Details
                </span>
                <h3 className="text-base font-black text-slate-950 mt-1">{viewingProduct.name}</h3>
              </div>
              <button
                onClick={() => setViewingProduct(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Split Grid Body (Left: Image, Right: Details) — Compact height layout */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 p-6">
              {/* Left Column: Image (2/5 size) */}
              <div className="md:col-span-2 flex items-center justify-center bg-slate-50 border border-slate-100 rounded-2xl p-4 min-h-[220px] max-h-[300px]">
                {viewingProduct.photoUrl ? (
                  <img
                    src={viewingProduct.photoUrl}
                    alt={viewingProduct.name}
                    className="max-h-[260px] max-w-full object-contain rounded-xl shadow-sm"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-350">
                    <ImageIcon className="h-12 w-12 mb-2" />
                    <p className="text-xs font-bold">No Image Provided</p>
                  </div>
                )}
              </div>

              {/* Right Column: Details (3/5 size) */}
              <div className="md:col-span-3 flex flex-col justify-between space-y-4">
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-2.5">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Product Code</p>
                    <p className="text-xs font-black text-slate-800 mt-0.5 truncate">{viewingProduct.id}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-2.5">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Color</p>
                    <p className="text-xs font-black text-slate-800 mt-0.5">{viewingProduct.color || "—"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-2.5">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Stock Available</p>
                    <p className="text-xs font-black text-slate-800 mt-0.5">
                      {viewingProduct.stock} <span className="text-slate-400 text-[10px] font-bold">units</span>
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-2.5">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Color Length</p>
                    <p className="text-xs font-black text-slate-800 mt-0.5">{viewingProduct.length || "—"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-2.5">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Price per Unit</p>
                    <p className="text-xs font-black text-slate-800 mt-0.5">{viewingProduct.rate || "—"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl border border-slate-100 px-4 py-2.5">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Carton Packing</p>
                    <p className="text-xs font-black text-slate-800 mt-0.5">
                      {viewingProduct.cartonQty} <span className="text-slate-400 text-[10px] font-bold">/ box</span>
                    </p>
                  </div>
                </div>

                {/* Compact Description Panel */}
                {viewingProduct.description && (
                  <div className="bg-slate-50/40 rounded-xl border border-slate-100 px-4 py-2.5">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Remarks / Details</p>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed line-clamp-2">
                      {viewingProduct.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50/30">
              <button
                onClick={() => {
                  handleEditProductClick(viewingProduct);
                  setViewingProduct(null);
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-bold text-white transition active:scale-95 shadow-sm cursor-pointer"
              >
                <Edit className="h-3.5 w-3.5" /> Edit Product Info
              </button>
              <button
                onClick={() => setViewingProduct(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition active:scale-95 cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD SLOT MODAL */}
      {addSlotModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-black text-slate-900">Add Slot to Row {addSlotModal.row}</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Enter a custom slot name or press Add to use the default ({addSlotModal.defaultName}).
            </p>
            <input
              autoFocus
              type="text"
              value={addSlotName}
              onChange={(e) => setAddSlotName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleConfirmAddSlot(); if (e.key === "Escape") setAddSlotModal({ open: false, row: "", defaultName: "" }); }}
              placeholder={addSlotModal.defaultName}
              className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setAddSlotModal({ open: false, row: "", defaultName: "" })}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAddSlot}
                className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-bold text-white transition shadow-sm active:scale-95"
              >
                Add Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD ROW MODAL */}
      {addRowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-black text-slate-900">Add New Shelf Row</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Enter a label for the new row (e.g. L, M, AA). Leave blank for auto-label.
            </p>
            <input
              autoFocus
              type="text"
              value={addRowName}
              onChange={(e) => setAddRowName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddRow(); if (e.key === "Escape") setAddRowModal(false); }}
              placeholder={String.fromCharCode(65 + warehouseRows.length)}
              className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setAddRowModal(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRow}
                className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-bold text-white transition shadow-sm active:scale-95"
              >
                Add Row
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function CollectionsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <CollectionsPageContent />
    </Suspense>
  );
}
