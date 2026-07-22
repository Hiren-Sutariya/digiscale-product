// Simple IndexedDB wrapper to store and retrieve files across page reloads/redirects
export function saveFileToIndexedDB(file: File): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }
    const request = indexedDB.open("digiscale_db", 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("guest_files")) {
        db.createObjectStore("guest_files");
      }
    };
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      const tx = db.transaction("guest_files", "readwrite");
      const store = tx.objectStore("guest_files");
      
      // Store as structured data to prevent prototype loss
      const dataToStore = {
        blob: file,
        name: file.name,
        type: file.type,
      };
      
      const putRequest = store.put(dataToStore, "pending_upload");
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
}

export function getFileFromIndexedDB(): Promise<File | null> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }
    const request = indexedDB.open("digiscale_db", 1);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("guest_files")) {
        db.createObjectStore("guest_files");
      }
    };
    request.onsuccess = (e: any) => {
      const db = e.target.result;
      const tx = db.transaction("guest_files", "readwrite");
      const store = tx.objectStore("guest_files");
      const getRequest = store.get("pending_upload");
      getRequest.onsuccess = () => {
        const result = getRequest.result || null;
        if (result) {
          store.delete("pending_upload");
          try {
            // Reconstruct proper File object with metadata preserved
            const reconstructedFile = new File([result.blob], result.name, {
              type: result.type,
            });
            resolve(reconstructedFile);
          } catch (err) {
            resolve(result.blob as File);
          }
        } else {
          resolve(null);
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
}
