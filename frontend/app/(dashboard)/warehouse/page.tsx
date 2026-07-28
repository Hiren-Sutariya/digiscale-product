"use client";

import { useState, useEffect, useRef } from "react";
import {
  getUserProfile,
} from "@/services/api";
import { supabase } from "@/lib/supabase";
import { getCache, setCache } from "@/lib/cache";
import {
  Plus,
  Search,
  AlertCircle,
  X,
  ChevronRight,
  Box,
  Layers,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Trash2,
  Package,
  Layers2,
  PieChart,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import PageTitle from "@/components/ui/pageTitle";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
  photoUrl?: string;
  stock: number;
  rate: string;
  color: string;
  unit_type?: "pcs" | "dzn";
  collectionName?: string;
  collectionId?: string;
}

interface Collection {
  id: string;
  name: string;
}

export default function WarehousePage() {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  
  // Warehouse States
  const [warehouseRows, setWarehouseRows] = useState<string[]>([]);
  const [warehouseSlots, setWarehouseSlots] = useState<Record<string, number[]>>({});
  const [warehouseAssignments, setWarehouseAssignments] = useState<
    Record<string, { productId: string; collectionId: string }[]>
  >({});

  // UI States
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedShelfZone, setSelectedShelfZone] = useState<"upper" | "lower">("upper");
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>("");
  const [rowSearchQuery, setRowSearchQuery] = useState<string>("");
  const [productSearchQuery, setProductSearchQuery] = useState<string>("");

  // Modals
  const [addRowModal, setAddRowModal] = useState<boolean>(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState<any | null>(null);
  const [addRowName, setAddRowName] = useState<string>("");
  const [addSlotModal, setAddSlotModal] = useState<{ open: boolean; row: string; defaultName: string }>({
    open: false,
    row: "",
    defaultName: "",
  });
  const [addSlotName, setAddSlotName] = useState<string>("");
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    onConfirm: () => {},
  });

  const defaultSlots: number[] = [];

  // Fetch Collections & Products
  const fetchCollectionsAndProducts = async (userId: string) => {
    try {
      const [colsRes, prodsRes] = await Promise.all([
        supabase.from("collections").select("*").eq("user_id", userId),
        supabase.from("products").select("*, collection:collections(name)").eq("user_id", userId),
      ]);

      let colsData: any[] = [];
      let prodsData: any[] = [];

      if (colsRes.data) {
        colsData = colsRes.data;
        setCollections(colsData);
      }

      if (prodsRes.data) {
        prodsData = prodsRes.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          photoUrl: p.photoUrl,
          stock: p.stock || 0,
          rate: p.rate || "",
          color: p.color || "",
          unit_type: p.unit_type || "pcs",
          collectionName: p.collection?.name || "Unknown Collection",
          collectionId: p.collection_id,
        }));
        setAllProducts(prodsData);
      }
      return { collections: colsData, allProducts: prodsData };
    } catch (e) {
      console.error("Failed to load catalog:", e);
      return { collections: [], allProducts: [] };
    }
  };

  // Fetch Warehouse Configuration
  const fetchWarehouseData = async (userId: string) => {
    try {
      const [rowsRes, slotsRes, assignsRes] = await Promise.all([
        supabase.from("warehouse_rows").select("*").eq("user_id", userId),
        supabase.from("warehouse_slots").select("*").eq("user_id", userId),
        supabase.from("warehouse_assignments").select("*").eq("user_id", userId),
      ]);

      let rowsData: string[] = [];
      let slotsMap: Record<string, number[]> = {};
      let assignsMap: Record<string, { productId: string; collectionId: string }[]> = {};

      if (rowsRes.data) {
        rowsData = rowsRes.data.map((r) => r.id).sort();
        setWarehouseRows(rowsData);
      }

      if (slotsRes.data) {
        slotsRes.data.forEach((s) => {
          if (!slotsMap[s.row_id]) slotsMap[s.row_id] = [];
          slotsMap[s.row_id].push(s.slot_number);
        });
        Object.keys(slotsMap).forEach((row) => {
          slotsMap[row].sort((a, b) => a - b);
        });
        setWarehouseSlots(slotsMap);
      }

      if (assignsRes.data) {
        assignsRes.data.forEach((a) => {
          if (!assignsMap[a.location_key]) assignsMap[a.location_key] = [];
          assignsMap[a.location_key].push({
            productId: a.product_id,
            collectionId: a.collection_id,
          });
        });
        setWarehouseAssignments(assignsMap);
      }
      return { warehouseRows: rowsData, warehouseSlots: slotsMap, warehouseAssignments: assignsMap };
    } catch (err) {
      console.error("Failed to fetch warehouse details:", err);
      return { warehouseRows: [], warehouseSlots: {}, warehouseAssignments: {} };
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedUserId = localStorage.getItem("digiscale_cached_user_id");
      if (cachedUserId) setCurrentUserId(cachedUserId);

      const cachedCols = localStorage.getItem("digiscale_cached_collections");
      if (cachedCols) {
        try { 
          setCollections(JSON.parse(cachedCols)); 
          setLoading(false);
        } catch(e) {}
      }
      const cachedProds = localStorage.getItem("digiscale_cached_all_products");
      if (cachedProds) {
        try { setAllProducts(JSON.parse(cachedProds)); } catch(e) {}
      }
      const cachedRows = localStorage.getItem("digiscale_cached_warehouse_rows");
      if (cachedRows) {
        try { setWarehouseRows(JSON.parse(cachedRows)); } catch(e) {}
      }
      const cachedSlots = localStorage.getItem("digiscale_cached_warehouse_slots");
      if (cachedSlots) {
        try { setWarehouseSlots(JSON.parse(cachedSlots)); } catch(e) {}
      }
      const cachedAssigns = localStorage.getItem("digiscale_cached_warehouse_assignments");
      if (cachedAssigns) {
        try { setWarehouseAssignments(JSON.parse(cachedAssigns)); } catch(e) {}
      }
    }

    getUserProfile()
      .then((profile) => {
        if (profile && profile.id) {
          const uId = profile.id.toString();
          setCurrentUserId(uId);

          const cacheKey = `warehouse_data_${uId}`;

          Promise.all([
            fetchCollectionsAndProducts(uId),
            fetchWarehouseData(uId)
          ]).then(([catalogData, warehouseData]) => {
            setCache(cacheKey, {
              ...catalogData,
              ...warehouseData
            });
          }).finally(() => {
            setLoading(false);
          });
        }
      })
      .catch((err) => {
        console.error("Auth mount failed:", err);
        setLoading(false);
      });
  }, []);

  const getSlotsForRow = (row: string): number[] => {
    return warehouseSlots[row] || defaultSlots;
  };

  // Add Row
  const handleAddRow = async () => {
    const name = addRowName.trim().toUpperCase() || String.fromCharCode(65 + warehouseRows.length);
    if (warehouseRows.includes(name)) {
      alert("Row already exists");
      return;
    }

    try {
      const { error } = await supabase.from("warehouse_rows").insert([{ id: name, user_id: currentUserId }]);
      if (error) throw error;

      setWarehouseRows([...warehouseRows, name].sort());
    } catch (err) {
      console.error("Row add failed:", err);
      alert("Failed to add row.");
    } finally {
      setAddRowModal(false);
      setAddRowName("");
    }
  };

  // Remove Row
  const handleRemoveRow = (row: string) => {
    const hasProducts = Object.keys(warehouseAssignments).some(
      (k) => k.startsWith(`${row}-`) && warehouseAssignments[k].length > 0
    );

    if (hasProducts) {
      setConfirmModal({
        isOpen: true,
        title: "Cannot Remove Row",
        message: `Row ${row} contains assigned products. Please empty the row before deleting.`,
        confirmText: "OK",
        onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
        isDanger: false,
      });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Remove Row",
      message: `Are you sure you want to remove Row ${row} and all its slot definitions?`,
      confirmText: "Remove",
      isDanger: true,
      onConfirm: async () => {
        try {
          const { error } = await supabase.from("warehouse_rows").delete().eq("id", row);
          if (error) throw error;

          setWarehouseRows(warehouseRows.filter((r) => r !== row));
          if (expandedRow === row) setExpandedRow(null);
          if (selectedLocation?.startsWith(`${row}-`)) setSelectedLocation(null);
        } catch (err) {
          console.error("Row deletion failed:", err);
          alert("Failed to remove row.");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Add Slot
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

    if (name.toUpperCase().startsWith(`${row.toUpperCase()}-`)) {
      name = name.substring(row.length + 1);
    }

    const slotVal = isNaN(Number(name)) ? name : Number(name);

    if (isNaN(Number(slotVal))) {
      alert("Slot number must be a valid integer.");
      return;
    }

    const current = getSlotsForRow(row);
    if (current.includes(slotVal as number)) {
      setAddSlotModal({ open: false, row: "", defaultName: "" });
      return;
    }

    try {
      const { error } = await supabase.from("warehouse_slots").insert([
        {
          id: `${row}-${slotVal}`,
          row_id: row,
          slot_number: slotVal as number,
          user_id: currentUserId,
        },
      ]);
      if (error) throw error;

      const updated = { ...warehouseSlots, [row]: [...current, slotVal as number].sort((a, b) => a - b) };
      setWarehouseSlots(updated);
    } catch (err) {
      console.error("Slot addition failed:", err);
      alert("Failed to add slot.");
    } finally {
      setAddSlotModal({ open: false, row: "", defaultName: "" });
      setAddSlotName("");
    }
  };

  // Remove Slot
  const handleRemoveSlot = (row: string, slot: number) => {
    const locationUpper = `${row}-${slot}-upper`;
    const locationLower = `${row}-${slot}-lower`;
    const hasProducts =
      (warehouseAssignments[locationUpper]?.length || 0) > 0 ||
      (warehouseAssignments[locationLower]?.length || 0) > 0;

    if (hasProducts) {
      setConfirmModal({
        isOpen: true,
        title: "Cannot Delete Slot",
        message: `Slot ${row}-${slot} is not empty. Please clear its items first.`,
        confirmText: "OK",
        onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
        isDanger: false,
      });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Delete Slot",
      message: `Are you sure you want to delete Slot ${row}-${slot}?`,
      confirmText: "Delete",
      isDanger: true,
      onConfirm: async () => {
        try {
          const { error } = await supabase.from("warehouse_slots").delete().eq("id", `${row}-${slot}`);
          if (error) throw error;

          const current = getSlotsForRow(row);
          const updated = { ...warehouseSlots, [row]: current.filter((s) => s !== slot) };
          setWarehouseSlots(updated);
          if (selectedLocation === `${row}-${slot}`) setSelectedLocation(null);
        } catch (err) {
          console.error("Slot deletion failed:", err);
          alert("Failed to remove slot.");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Assign Product to Location
  const handleAssignProductToLocation = async (locId: string, productId: string, collectionId: string) => {
    const list = warehouseAssignments[locId] || [];
    if (list.some((item) => item.productId === productId)) return;

    try {
      const { error } = await supabase.from("warehouse_assignments").insert([
        {
          location_key: locId,
          product_id: productId,
          collection_id: collectionId,
          user_id: currentUserId,
        },
      ]);
      if (error) throw error;

      const updated = [...list, { productId, collectionId }];
      setWarehouseAssignments({
        ...warehouseAssignments,
        [locId]: updated,
      });
    } catch (err) {
      console.error("Assignment insertion failed:", err);
      alert("Failed to assign product.");
    }
  };

  // Remove Product from Location
  const handleRemoveProductFromLocation = async (locId: string, productId: string) => {
    try {
      const { error } = await supabase
        .from("warehouse_assignments")
        .delete()
        .eq("location_key", locId)
        .eq("product_id", productId);

      if (error) throw error;

      const list = warehouseAssignments[locId] || [];
      const updated = list.filter((item) => item.productId !== productId);
      const newAssignments = { ...warehouseAssignments, [locId]: updated };
      
      if (updated.length === 0) {
        delete newAssignments[locId];
      }
      setWarehouseAssignments(newAssignments);
    } catch (err) {
      console.error("Assignment deletion failed:", err);
      alert("Failed to remove product.");
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
          collectionId: assignment.collectionId,
        });
      }
    });
    return results;
  };

  const findWarehouseLocation = (productId: string) => {
    const locations: { row: string; slot: string; zone: string }[] = [];
    Object.keys(warehouseAssignments).forEach((key) => {
      const list = warehouseAssignments[key] || [];
      if (list.some((item) => item.productId === productId)) {
        const parts = key.split("-");
        if (parts.length >= 3) {
          locations.push({ row: parts[0], slot: parts[1], zone: parts[2] });
        }
      }
    });
    return locations;
  };

  // Stats Calculations
  const totalRows = warehouseRows.length;
  const totalSlots = warehouseRows.reduce((sum, row) => sum + getSlotsForRow(row).length, 0);
  const occupiedSlots = warehouseRows.reduce((sum, row) => {
    return sum + getSlotsForRow(row).filter((slot) => {
      const locId = `${row}-${slot}`;
      return (warehouseAssignments[locId] || []).length > 0;
    }).length;
  }, 0);

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-140px)] items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-xl bg-blue-500/20 animate-pulse"></div>
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 relative z-10" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-500 animate-pulse tracking-wide">Loading workspace...</p>
      </div>
    );
  }

  const totalAssignmentsCount = Object.values(warehouseAssignments).reduce((sum, list) => sum + list.length, 0);
  const occupancyPercentage = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

  // Global Search Filter
  const query = globalSearchQuery.trim().toLowerCase();
  const filteredGlobalProducts = query
    ? allProducts.filter((product) => {
        return (
          product.name.toLowerCase().includes(query) ||
          (product.rate && String(product.rate).toLowerCase().includes(query)) ||
          (product.color && String(product.color).toLowerCase().includes(query)) ||
          (product.collectionName && product.collectionName.toLowerCase().includes(query))
        );
      })
    : [];

  return (
    <div className="px-8 pt-4 pb-12 min-h-screen bg-slate-50/50">
      <div className="space-y-6">
        
        {/* Toolbar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
          {/* Search Inputs Row */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-3xl">
            {/* Shelf Rows Search */}
            <div className="relative w-full sm:w-[35%]">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={rowSearchQuery}
                onChange={(e) => setRowSearchQuery(e.target.value)}
                placeholder="Search shelf rows..."
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

          {/* Action Button */}
          <button
            onClick={() => setAddRowModal(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white transition shadow-sm active:scale-95 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Create Shelf Row
          </button>
        </div>

        {/* Stats Section */}
        {globalSearchQuery.trim() === "" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center gap-5">
              <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Rows & Slots</p>
                <h3 className="text-xl font-black text-slate-800 mt-0.5">
                  {totalRows} Rows / {totalSlots} Slots
                </h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center gap-5">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <PieChart className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Space Occupancy</p>
                <div className="flex items-center justify-between mt-0.5">
                  <h3 className="text-xl font-black text-slate-800">{occupancyPercentage}%</h3>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {occupiedSlots} of {totalSlots} occupied
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${occupancyPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center gap-5">
              <div className="h-12 w-12 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Products Assigned</p>
                <h3 className="text-xl font-black text-slate-800 mt-0.5">
                  {totalAssignmentsCount} items stocked
                </h3>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center gap-5">
              <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available Slots</p>
                <h3 className="text-xl font-black text-slate-800 mt-0.5">
                  {totalSlots - occupiedSlots} Empty Slots
                </h3>
              </div>
            </div>
          </div>
        )}

        {/* Global Finder / Shelf Map Grid */}
        {globalSearchQuery.trim() !== "" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800">Global Finder Results</h3>
              <p className="text-[11px] text-slate-400 font-medium">Search across all products to locate their shelf.</p>
            </div>

            {/* Search Results */}
            <div className="divide-y divide-slate-100 animate-in fade-in duration-200">
              {filteredGlobalProducts.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <AlertCircle className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold">No items match this query.</p>
                </div>
              ) : (
                filteredGlobalProducts.map((product) => {
                  const locations = findWarehouseLocation(product.id);
                  return (
                    <div key={product.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 last:border-b-0">
                      <div className="flex items-center gap-3">
                        {product.photoUrl ? (
                          <img
                            src={product.photoUrl}
                            alt=""
                            className="h-12 w-12 rounded-xl object-contain bg-slate-50 border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200 shrink-0 text-slate-350">
                            <Box className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-800">{product.name}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            Code: {product.rate} {product.unit_type || "pcs"} {product.color ? `| Color: ${product.color}` : ""} | Stock: {product.stock}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button 
                          onClick={() => router.push(`/projects?colId=${product.collectionId}`)}
                          className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 font-bold text-[10px] px-2.5 py-1.5 rounded-lg tracking-wider uppercase hover:bg-blue-100 transition cursor-pointer"
                        >
                          <Layers className="h-3 w-3" />
                          {product.collectionName || "Uncategorized"}
                        </button>

                        {locations.length > 0 ? (
                          locations.map((loc, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setExpandedRow(loc.row);
                                setSelectedLocation(`${loc.row}-${loc.slot}`);
                                setSelectedShelfZone(loc.zone as any);
                                setGlobalSearchQuery("");
                              }}
                              className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100 font-bold text-[10px] px-2.5 py-1.5 rounded-lg transition active:scale-95 cursor-pointer"
                            >
                              Row {loc.row} Slot {loc.slot} ({loc.zone === "upper" ? "Upper" : "Lower"})
                            </button>
                          ))
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
                            Not Stocked
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Rows and Inspector Layout */}
        {globalSearchQuery.trim() === "" && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            
            {/* Shelf rows selection list */}
            <div className="flex-1 w-full space-y-3">
              {warehouseRows
                .filter((row) => row.toLowerCase().includes(rowSearchQuery.toLowerCase()))
                .map((row) => {
                const isExpanded = expandedRow === row;
                const assignedCount = getAssignedCountForRow(row);
                const rowSlots = getSlotsForRow(row);
                const hasItems = assignedCount > 0;

                return (
                  <div
                    key={row}
                    className={`rounded-2xl border bg-white overflow-hidden transition-all duration-200 ${
                      isExpanded
                        ? "border-blue-200 shadow-md shadow-blue-50/50"
                        : "border-slate-200 shadow-sm hover:border-slate-300"
                    }`}
                  >
                    {/* Row Item Header */}
                    <div
                      onClick={() => setExpandedRow(isExpanded ? null : row)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/30 transition text-left cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 transition ${
                            isExpanded
                              ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                              : "bg-blue-50 border border-blue-100 text-blue-600"
                          }`}
                        >
                          {row}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-tight">Row {row} Shelf</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-semibold">{rowSlots.length} slots</span>
                            {hasItems && (
                              <>
                                <span className="text-slate-250 font-bold">·</span>
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                                  {assignedCount} units stocked
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider transition ${
                          isExpanded ? "text-blue-500" : "text-slate-400"
                        }`}>
                          {isExpanded ? "Collapse" : "Open Layout"}
                        </span>
                        <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${
                          isExpanded ? "rotate-90 text-blue-500" : "text-slate-350"
                        }`} />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveRow(row);
                          }}
                          className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition shrink-0 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Row Content Expansion */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/20 p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
                        {/* Shelf Grid Map Visualizer */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                          {rowSlots.map((slot) => {
                            const locationId = `${row}-${slot}`;
                            const itemCount = getSlotItemCount(row, slot);
                            const isSelected = selectedLocation === locationId;
                            
                            return (
                              <div
                                key={slot}
                                onClick={() => setSelectedLocation(locationId)}
                                className={`rounded-2xl border p-3.5 flex flex-col justify-between h-28 transition-all cursor-pointer select-none relative overflow-hidden group shadow-sm hover:shadow-md ${
                                  isSelected
                                    ? "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-600 text-white shadow-blue-500/30 scale-[1.02]"
                                    : itemCount > 0
                                    ? "bg-gradient-to-br from-emerald-50 to-teal-50/30 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-100/50"
                                    : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <span className={`text-[11px] font-extrabold uppercase tracking-wider ${
                                    isSelected ? "text-blue-100" : (itemCount > 0 ? "text-emerald-700" : "text-slate-500")
                                  }`}>
                                    Slot {slot}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveSlot(row, slot);
                                    }}
                                    className={`p-1 rounded opacity-0 group-hover:opacity-100 transition shrink-0 ${
                                      isSelected
                                        ? "hover:bg-blue-700 text-blue-200 hover:text-white"
                                        : "hover:bg-red-50 text-slate-300 hover:text-red-500"
                                    }`}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>

                                <div className="mt-auto pt-2">
                                  <div className="flex items-center gap-1.5">
                                    <div className={`flex-1 flex flex-col items-center justify-center py-1 rounded-md border ${
                                      isSelected ? "bg-white/10 border-white/20 text-white" : (itemCount > 0 ? "bg-white border-emerald-100 text-emerald-700" : "bg-slate-50 border-slate-100 text-slate-400")
                                    }`}>
                                      <span className="text-[8px] font-bold uppercase opacity-80">Upper</span>
                                      <span className="text-xs font-black">{warehouseAssignments[`${locationId}-upper`]?.length || 0}</span>
                                    </div>
                                    <div className={`flex-1 flex flex-col items-center justify-center py-1 rounded-md border ${
                                      isSelected ? "bg-white/10 border-white/20 text-white" : (itemCount > 0 ? "bg-white border-emerald-100 text-emerald-700" : "bg-slate-50 border-slate-100 text-slate-400")
                                    }`}>
                                      <span className="text-[8px] font-bold uppercase opacity-80">Lower</span>
                                      <span className="text-xs font-black">{warehouseAssignments[`${locationId}-lower`]?.length || 0}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {/* Add New Slot Box */}
                          <button
                            onClick={() => handleAddSlot(row)}
                            className="rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 text-slate-400 hover:text-blue-600 flex flex-col items-center justify-center h-28 transition-all active:scale-[0.98] cursor-pointer select-none group"
                          >
                            <div className="bg-white p-2 rounded-full shadow-sm group-hover:bg-blue-100 group-hover:shadow transition-colors mb-2">
                              <Plus className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider">Add Slot</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Shelf Row Inspector Sidepanel */}
            {selectedLocation && (
              <div className="w-full lg:w-96 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-24 shrink-0 animate-in slide-in-from-right-4 duration-250">
                {/* Header */}
                <div className="bg-sky-50 border-b border-sky-100 px-5 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      <span>Shelf Inspector</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      Configuring Slot {selectedLocation}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedLocation(null)}
                    className="p-1 hover:bg-slate-200/50 rounded-lg text-slate-400 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Shelf Zones tab selector (Upper vs Lower) */}
                <div className="grid grid-cols-2 border-b border-slate-100 bg-slate-50/30 p-1.5 gap-1 select-none">
                  <button
                    onClick={() => setSelectedShelfZone("upper")}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                      selectedShelfZone === "upper"
                        ? "bg-white border border-slate-100 shadow-sm text-blue-600"
                        : "text-slate-500 hover:bg-slate-100/50"
                    }`}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                    <span>Upper Shelf</span>
                  </button>
                  <button
                    onClick={() => setSelectedShelfZone("lower")}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                      selectedShelfZone === "lower"
                        ? "bg-white border border-slate-100 shadow-sm text-blue-600"
                        : "text-slate-500 hover:bg-slate-100/50"
                    }`}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                    <span>Lower Shelf</span>
                  </button>
                </div>

                {/* Stock List */}
                <div className="p-5 space-y-4">
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2.5">
                      Assigned Products ({getLocationProducts(`${selectedLocation}-${selectedShelfZone}`).length})
                    </h4>

                    {getLocationProducts(`${selectedLocation}-${selectedShelfZone}`).length === 0 ? (
                      <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                        <Package className="mx-auto h-7 w-7 text-slate-300 mb-1.5" />
                        <p className="text-[10px] font-semibold">Zone Empty</p>
                        <p className="text-[9px] text-slate-400 leading-normal max-w-[180px] mx-auto mt-0.5 font-medium">
                          Assign products to this shelf zone below.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {getLocationProducts(`${selectedLocation}-${selectedShelfZone}`).map((p) => (
                          <div
                            key={p.id}
                            onClick={() => setSelectedProductDetails(p)}
                            className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-150 rounded-xl p-2.5 cursor-pointer hover:bg-slate-100 hover:border-slate-200 transition group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {p.photoUrl ? (
                                <img
                                  src={p.photoUrl}
                                  alt=""
                                  className="h-9 w-9 rounded-lg object-contain bg-white border border-slate-200 shrink-0"
                                />
                              ) : (
                                <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center border border-slate-200 shrink-0 text-slate-350">
                                  <Box className="h-4 w-4" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <h5 className="text-xs font-extrabold text-slate-800 truncate leading-snug">
                                  {p.name}
                                </h5>
                                <p className="text-[9px] text-slate-400 font-semibold truncate">
                                  {p.color ? `Color: ${p.color}` : "No Color"} | Code: {p.rate || p.id.substring(0, 8)}
                                </p>
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveProductFromLocation(`${selectedLocation}-${selectedShelfZone}`, p.id);
                              }}
                              className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Assign Product Selector */}
                  <div className="border-t border-slate-100 pt-4">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2.5">
                      Assign Product to this Zone
                    </h4>

                    {allProducts.length === 0 ? (
                      <p className="text-[10px] text-slate-400 font-semibold">No products in your catalog yet.</p>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search catalog products..."
                            value={productSearchQuery}
                            onChange={(e) => setProductSearchQuery(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 shadow-sm"
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-2 space-y-1 mt-2">
                          {allProducts
                            .filter((prod) => prod.name.toLowerCase().includes(productSearchQuery.toLowerCase()))
                            .map((p) => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  handleAssignProductToLocation(
                                    `${selectedLocation}-${selectedShelfZone}`,
                                    p.id,
                                    p.collectionId || ""
                                  );
                                  setProductSearchQuery("");
                                }}
                                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white hover:shadow-sm transition border border-transparent hover:border-slate-200 flex items-center justify-between"
                              >
                                <span>{p.name}</span>
                                <span className="text-[9px] text-slate-400 font-bold px-2 py-0.5 bg-slate-200/50 rounded uppercase tracking-wider">{p.color ? `${p.color} | ` : ""}{p.rate || p.id.substring(0, 8)}</span>
                              </button>
                            ))}
                          {allProducts.filter(prod => prod.name.toLowerCase().includes(productSearchQuery.toLowerCase())).length === 0 && (
                            <div className="text-center py-4 text-[10px] font-semibold text-slate-400">
                              No matching products found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

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
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
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

      {/* ADD ROW DIALOG MODAL */}
      {addRowModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xl animate-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-sm font-black text-slate-800">Create Shelf Row</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                Add a new alphabet code row (e.g. L, M, N) to the shelf list.
              </p>
            </div>
            <input
              type="text"
              value={addRowName}
              onChange={(e) => setAddRowName(e.target.value.toUpperCase())}
              placeholder="e.g. L"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 shadow-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddRow();
                if (e.key === "Escape") setAddRowModal(false);
              }}
            />
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setAddRowModal(false)}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRow}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition active:scale-95 cursor-pointer"
              >
                Add Row
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD SLOT DIALOG MODAL */}
      {addSlotModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xl animate-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-sm font-black text-slate-800">Add Slot to Row {addSlotModal.row}</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                Enter an integer number for the new slot.
              </p>
            </div>
            <input
              type="text"
              value={addSlotName}
              onChange={(e) => setAddSlotName(e.target.value)}
              placeholder={`e.g. ${addSlotModal.defaultName.split("-")[1]}`}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500 shadow-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmAddSlot();
                if (e.key === "Escape") setAddSlotModal({ open: false, row: "", defaultName: "" });
              }}
            />
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setAddSlotModal({ open: false, row: "", defaultName: "" })}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAddSlot}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition active:scale-95 cursor-pointer"
              >
                Add Slot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT DETAILS MODAL */}
      {selectedProductDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                {selectedProductDetails.photoUrl ? (
                  <img
                    src={selectedProductDetails.photoUrl}
                    alt=""
                    className="h-16 w-16 rounded-xl object-contain bg-slate-50 border border-slate-200 shrink-0"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200 shrink-0 text-slate-300">
                    <Package className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-black text-slate-800">{selectedProductDetails.name}</h3>
                  <p className="text-xs text-slate-500 font-semibold">{selectedProductDetails.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProductDetails(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Color</p>
                <p className="text-sm font-bold text-slate-700">{selectedProductDetails.color || "N/A"}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Price Code</p>
                <p className="text-sm font-bold text-slate-700">{selectedProductDetails.rate || "N/A"}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Length</p>
                <p className="text-sm font-bold text-slate-700">{selectedProductDetails.length ? `${selectedProductDetails.length} cm` : "N/A"}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Per Carton</p>
                <p className="text-sm font-bold text-slate-700">{selectedProductDetails.perCarton ? `${selectedProductDetails.perCarton} PCS CTN` : "N/A"}</p>
              </div>
              <div className="col-span-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Description</p>
                <p className="text-sm font-semibold text-slate-600">{selectedProductDetails.description || "No description provided."}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
