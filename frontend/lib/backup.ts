import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
import { getUserProfile, getUserSettings, updateUserSettings, updateUserProfile } from "@/services/api";
import { saveBackupToIndexedDB } from "@/lib/db";

/** Format timestamp to readable local string */
export function formatBackupDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "Never";
    const pad = (num: number) => num.toString().padStart(2, "0");
    return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "Never";
  }
}

/** Fetches all application data from Supabase and user profile / settings from the backend. */
export async function createBackupPayload(userId: string): Promise<any> {
  const [
    colsRes,
    prodsRes,
    rowsRes,
    slotsRes,
    assignsRes,
    quotesRes,
    clientsRes,
    userSettings,
    userProfile
  ] = await Promise.all([
    supabase.from("collections").select("*").eq("user_id", userId),
    supabase.from("products").select("id, user_id, collection_id, name, stock, cartonQty, rate, length, color, unit_type, description, warehouse, created_at").eq("user_id", userId),
    supabase.from("warehouse_rows").select("*").eq("user_id", userId),
    supabase.from("warehouse_slots").select("*").eq("user_id", userId),
    supabase.from("warehouse_assignments").select("*").eq("user_id", userId),
    supabase.from("quotations").select("*").eq("user_id", userId),
    supabase.from("clients").select("*").eq("user_id", userId),
    getUserSettings(true),
    getUserProfile()
  ]);

  if (prodsRes.error) console.error("Products backup fetch error:", prodsRes.error);
  if (colsRes.error) console.error("Collections backup fetch error:", colsRes.error);

  return {
    collections: colsRes.data || [],
    products: prodsRes.data || [],
    warehouse_rows: rowsRes.data || [],
    warehouse_slots: slotsRes.data || [],
    warehouse_assignments: assignsRes.data || [],
    quotations: quotesRes.data || [],
    clients: clientsRes.data || [],
    user_settings: userSettings || {},
    user_profile: userProfile || {}
  };
}

const PART_LIMIT = 30000;

/** Splits any string values longer than Excel's 32767 character cell limit into multiple columns. */
export function splitLongFieldsInArray(arr: any[]): any[] {
  if (!arr || arr.length === 0) return arr;
  
  return arr.map(item => {
    if (!item || typeof item !== "object") return item;
    const newItem = { ...item };
    
    Object.keys(newItem).forEach(key => {
      const val = newItem[key];
      if (typeof val === "string" && val.length > PART_LIMIT) {
        let partIndex = 1;
        for (let i = 0; i < val.length; i += PART_LIMIT) {
          newItem[`${key}_part${partIndex}`] = val.substring(i, i + PART_LIMIT);
          partIndex++;
        }
        delete newItem[key];
      }
    });
    
    return newItem;
  });
}

/** Reconstructs split fields from part columns back into the original long string. */
export function reconstructLongFieldsInArray(arr: any[]): any[] {
  if (!arr || arr.length === 0) return arr;
  
  return arr.map(item => {
    if (!item || typeof item !== "object") return item;
    const newItem = { ...item };
    
    const partKeys = Object.keys(newItem).filter(key => /_part\d+$/.test(key));
    if (partKeys.length === 0) return newItem;
    
    const groups: { [baseKey: string]: { index: number; key: string }[] } = {};
    partKeys.forEach(key => {
      const match = key.match(/^(.*)_part(\d+)$/);
      if (match) {
        const [_, baseKey, indexStr] = match;
        const index = parseInt(indexStr, 10);
        if (!groups[baseKey]) groups[baseKey] = [];
        groups[baseKey].push({ index, key });
      }
    });
    
    Object.keys(groups).forEach(baseKey => {
      const sortedParts = groups[baseKey].sort((a, b) => a.index - b.index);
      const combinedVal = sortedParts.map(part => newItem[part.key] || "").join("");
      newItem[baseKey] = combinedVal;
      
      sortedParts.forEach(part => {
        delete newItem[part.key];
      });
    });
    
    return newItem;
  });
}

/** Triggers download of the backup payload as an Excel workbook. */
export function downloadExcelFromBackupPayload(backup: any) {
  const wb = XLSX.utils.book_new();
 
  // Helper to append sheet if array has data
  const appendArrayToSheet = (arr: any[], name: string) => {
    const cleanedArr = arr.map(item => {
      if (!item || typeof item !== "object") return item;
      // Remove created_at and createdAt from all tabs
      const { created_at, createdAt, user_id, id, ...rest } = item;
      return rest;
    });
    const processedArr = splitLongFieldsInArray(cleanedArr);
    const ws = XLSX.utils.json_to_sheet(processedArr.length > 0 ? processedArr : [{ message: "No data found" }]);
    XLSX.utils.book_append_sheet(wb, ws, name);
  };
 
  appendArrayToSheet(backup.collections || [], "Collections");
  
  const productsForExcel = (backup.products || []).map((p: any) => {
    const { created_at, createdAt, user_id, id, ...rest } = p;
    return {
      ...rest,
      image: "" // Include empty image field as requested
    };
  });
  
  const processedProducts = splitLongFieldsInArray(productsForExcel);
  const productsWs = XLSX.utils.json_to_sheet(processedProducts.length > 0 ? processedProducts : [{ message: "No data found" }]);
  XLSX.utils.book_append_sheet(wb, productsWs, "Products");
  
  appendArrayToSheet(backup.warehouse_rows || [], "Warehouse_Rows");
  appendArrayToSheet(backup.warehouse_slots || [], "Warehouse_Slots");
  appendArrayToSheet(backup.warehouse_assignments || [], "Warehouse_Assignments");
 
  // Format quotations: serialize nested items array for Excel compatibility
  const formattedQuotations = (backup.quotations || []).map((q: any) => ({
    ...q,
    items: typeof q.items === "object" ? JSON.stringify(q.items) : q.items
  }));
  appendArrayToSheet(formattedQuotations, "Quotations");
  
  appendArrayToSheet(backup.clients || [], "Clients");
  appendArrayToSheet([backup.user_settings || {}], "User_Settings");
  appendArrayToSheet([backup.user_profile || {}], "User_Profile");
 
  const userProfile = backup.user_profile || {};
  const userSettings = backup.user_settings || {};
  let prefix = "Digiscale";
  
  // Name backup after user profile if available, else company, else Digiscale
  if (userProfile.name) {
    prefix = userProfile.name.replace(/[^a-zA-Z0-9\u0A80-\u0AFF\s]/g, "").trim().replace(/\s+/g, "_");
  } else if (userSettings.company_name) {
    prefix = userSettings.company_name.replace(/[^a-zA-Z0-9\u0A80-\u0AFF\s]/g, "").trim().replace(/\s+/g, "_");
  } else {
    // try to get from localStorage if profile fetch failed
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem("digiscale_user_profile") : null;
    if (stored) {
      try {
        const p = JSON.parse(stored);
        if (p.name) prefix = p.name.replace(/[^a-zA-Z0-9\u0A80-\u0AFF\s]/g, "").trim().replace(/\s+/g, "_");
      } catch (e) {}
    }
  }

  XLSX.writeFile(wb, `${prefix}_Backup_${new Date().toISOString().split("T")[0]}.xlsx`);
}

/** Deletes current user data from Supabase and restores backup records. */
export async function restoreBackupPayload(backup: any, userId: string): Promise<void> {
  // 1. Delete all current data for user in reverse dependency order
  await Promise.all([
    supabase.from("warehouse_assignments").delete().eq("user_id", userId),
    supabase.from("warehouse_slots").delete().eq("user_id", userId),
    supabase.from("warehouse_rows").delete().eq("user_id", userId),
    supabase.from("products").delete().eq("user_id", userId),
    supabase.from("collections").delete().eq("user_id", userId),
    supabase.from("quotations").delete().eq("user_id", userId),
    supabase.from("clients").delete().eq("user_id", userId)
  ]);

  // 2. Restore in correct dependency order
  // Save collections first
  if (backup.collections && backup.collections.length > 0) {
    const { error } = await supabase.from("collections").insert(backup.collections);
    if (error) throw new Error(`Collections restore failed: ${error.message}`);
  }

  // Save products
  if (backup.products && backup.products.length > 0) {
    const { error } = await supabase.from("products").insert(backup.products);
    if (error) throw new Error(`Products restore failed: ${error.message}`);
  }

  // Save warehouse rows
  if (backup.warehouse_rows && backup.warehouse_rows.length > 0) {
    const { error } = await supabase.from("warehouse_rows").insert(backup.warehouse_rows);
    if (error) throw new Error(`Warehouse rows restore failed: ${error.message}`);
  }

  // Save warehouse slots
  if (backup.warehouse_slots && backup.warehouse_slots.length > 0) {
    const { error } = await supabase.from("warehouse_slots").insert(backup.warehouse_slots);
    if (error) throw new Error(`Warehouse slots restore failed: ${error.message}`);
  }

  // Save warehouse assignments
  if (backup.warehouse_assignments && backup.warehouse_assignments.length > 0) {
    const { error } = await supabase.from("warehouse_assignments").insert(backup.warehouse_assignments);
    if (error) throw new Error(`Warehouse assignments restore failed: ${error.message}`);
  }

  // Save clients
  if (backup.clients && backup.clients.length > 0) {
    const { error } = await supabase.from("clients").insert(backup.clients);
    if (error) throw new Error(`Clients restore failed: ${error.message}`);
  }

  // Save quotations
  if (backup.quotations && backup.quotations.length > 0) {
    const { error } = await supabase.from("quotations").insert(backup.quotations);
    if (error) throw new Error(`Quotations restore failed: ${error.message}`);
  }

  // 3. Restore user profile and settings in Python backend if present
  if (backup.user_settings && Object.keys(backup.user_settings).length > 0) {
    try {
      // Remove ID and user_id to prevent constraint errors in update
      const { id, user_id, ...cleanSettings } = backup.user_settings;
      await updateUserSettings(cleanSettings);
    } catch (e) {
      console.error("Failed to restore user settings: ", e);
    }
  }

  if (backup.user_profile && backup.user_profile.name) {
    try {
      await updateUserProfile(backup.user_profile.name, backup.user_profile.email);
    } catch (e) {
      console.error("Failed to restore user profile: ", e);
    }
  }
}

/** Safely erases all data associated with the user workspace (Danger Zone). */
export async function deleteAllWorkspaceData(userId: string): Promise<void> {
  if (!userId) throw new Error("User ID is required to erase data.");

  // Delete all data for user in reverse dependency order
  await Promise.all([
    supabase.from("warehouse_assignments").delete().eq("user_id", userId),
    supabase.from("warehouse_slots").delete().eq("user_id", userId),
    supabase.from("warehouse_rows").delete().eq("user_id", userId),
    supabase.from("products").delete().eq("user_id", userId),
    supabase.from("collections").delete().eq("user_id", userId),
    supabase.from("quotations").delete().eq("user_id", userId),
    supabase.from("clients").delete().eq("user_id", userId)
  ]);
}

/** Parses the uploaded Excel file and performs database restore. */
export async function restoreBackupFromExcel(file: File, userId: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });

        // Helper to convert sheet back to JSON array, return empty if dummy or missing
        const parseSheet = (name: string): any[] => {
          if (!wb.SheetNames.includes(name)) return [];
          const sheet = wb.Sheets[name];
          const arr = XLSX.utils.sheet_to_json(sheet);
          if (arr.length === 1 && (arr[0] as any).message === "No data found") return [];
          return reconstructLongFieldsInArray(arr);
        };

        const collections = parseSheet("Collections");
        const products = parseSheet("Products");
        const warehouse_rows = parseSheet("Warehouse_Rows");
        const warehouse_slots = parseSheet("Warehouse_Slots");
        const warehouse_assignments = parseSheet("Warehouse_Assignments");
        const clients = parseSheet("Clients");

        // Parse quotations and safely parse the stringified items list
        const quotations = parseSheet("Quotations").map((q: any) => {
          let itemsParsed = [];
          if (q.items) {
            try {
              itemsParsed = typeof q.items === "string" ? JSON.parse(q.items) : q.items;
            } catch {
              itemsParsed = [];
            }
          }
          return { ...q, items: itemsParsed };
        });

        // Parse user settings and profile rows
        const user_settings = parseSheet("User_Settings")[0] || {};
        const user_profile = parseSheet("User_Profile")[0] || {};

        const backup = {
          collections,
          products,
          warehouse_rows,
          warehouse_slots,
          warehouse_assignments,
          quotations,
          clients,
          user_settings,
          user_profile
        };

        await restoreBackupPayload(backup, userId);
        
        // Return count of total items restored
        const totalCount =
          collections.length +
          products.length +
          warehouse_rows.length +
          warehouse_slots.length +
          warehouse_assignments.length +
          clients.length +
          quotations.length;

        resolve(totalCount);
      } catch (err: any) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Error reading spreadsheet file"));
    reader.readAsArrayBuffer(file);
  });
}

/** Background auto-backup runner. Triggered on app initialization/layout mount. */
export async function checkAndRunAutoBackup(userId: string): Promise<void> {
  if (typeof window === "undefined") return;

  const frequencyStr = localStorage.getItem("digiscale_auto_backup_frequency") || "7"; // default to weekly
  if (frequencyStr === "off") return;

  const frequencyDays = parseInt(frequencyStr, 10);
  if (isNaN(frequencyDays) || frequencyDays <= 0) return;

  const lastBackupStr = localStorage.getItem("digiscale_last_backup_time");
  const now = Date.now();

  const isDue =
    !lastBackupStr ||
    now - new Date(lastBackupStr).getTime() >= frequencyDays * 24 * 60 * 60 * 1000;

  if (isDue) {
    try {
      console.log(`[Auto-Backup] Due. Running automatic backup for user ${userId}...`);
      const payload = await createBackupPayload(userId);
      const timestamp = new Date().toISOString();
      
      // Save snapshot to local IndexedDB store
      await saveBackupToIndexedDB(timestamp, {
        fileName: `Auto_Backup_${timestamp.split("T")[0]}.xlsx`,
        ...payload
      });

      // Update timestamps
      localStorage.setItem("digiscale_last_backup_time", timestamp);
      console.log("[Auto-Backup] Complete. Snapshot stored to local IndexedDB.");
    } catch (e) {
      console.error("[Auto-Backup] Auto backup failed:", e);
    }
  }
}
