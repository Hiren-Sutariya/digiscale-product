// Simple IndexedDB wrapper to store and retrieve files across page reloads/redirects

const DB_NAME = "digiscale_db";
const DB_VERSION = 2; // Upgraded version to support local_backups
const STORE_NAME = "guest_files";
const BACKUP_STORE_NAME = "local_backups";
const PENDING_KEY = "pending_upload";

/** Opens (or creates) the IndexedDB database and resolves with the IDBDatabase instance. */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("IndexedDB is not available in this environment"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e: any) => {
      const db: IDBDatabase = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(BACKUP_STORE_NAME)) {
        db.createObjectStore(BACKUP_STORE_NAME);
      }
    };
    request.onsuccess = (e: any) => resolve(e.target.result);
    request.onerror = () => reject(request.error);
  });
}

/** Persist a File to IndexedDB so it survives redirects (e.g. login → projects). */
export async function saveFileToIndexedDB(file: File): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    // Store as structured data to preserve File metadata
    const putRequest = store.put({ blob: file, name: file.name, type: file.type }, PENDING_KEY);
    putRequest.onsuccess = () => resolve();
    putRequest.onerror = () => reject(putRequest.error);
  });
}

/** Retrieve and delete the pending File from IndexedDB (consumed once). Returns null if none. */
export async function getFileFromIndexedDB(): Promise<File | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getRequest = store.get(PENDING_KEY);
    getRequest.onsuccess = () => {
      const result = getRequest.result;
      if (!result) {
        resolve(null);
        return;
      }
      // Delete immediately so it's only consumed once
      store.delete(PENDING_KEY);
      try {
        resolve(new File([result.blob], result.name, { type: result.type }));
      } catch {
        resolve(result.blob as File);
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
}

/** Save a backup payload to IndexedDB. */
export async function saveBackupToIndexedDB(timestamp: string, backupData: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BACKUP_STORE_NAME, "readwrite");
    const store = tx.objectStore(BACKUP_STORE_NAME);
    const putRequest = store.put(backupData, timestamp);
    putRequest.onsuccess = () => resolve();
    putRequest.onerror = () => reject(putRequest.error);
  });
}

/** Retrieve all local backups sorted by timestamp (newest first). */
export async function getBackupsFromIndexedDB(): Promise<any[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BACKUP_STORE_NAME, "readonly");
    const store = tx.objectStore(BACKUP_STORE_NAME);
    const request = store.openCursor(null, "prev"); // newest first
    const results: any[] = [];
    request.onsuccess = (e: any) => {
      const cursor = e.target.result;
      if (cursor) {
        results.push({ timestamp: cursor.key, ...cursor.value });
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

/** Delete a backup payload from IndexedDB. */
export async function deleteBackupFromIndexedDB(timestamp: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(BACKUP_STORE_NAME, "readwrite");
    const store = tx.objectStore(BACKUP_STORE_NAME);
    const delRequest = store.delete(timestamp);
    delRequest.onsuccess = () => resolve();
    delRequest.onerror = () => reject(delRequest.error);
  });
}
