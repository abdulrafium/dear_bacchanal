// IndexedDB helper to persist pre-rendered clean production PDFs locally
// Survives page reloads, tab closes, browser crashes, and laptop restarts.

const DB_NAME = "DearBacchanalPdfCache";
const DB_VERSION = 1;
const STORE_NAME = "rendered_books";

export interface CachedBookPdf {
  bookId: string;
  type: "soft" | "hard";
  softPdfBlob?: Blob;
  coverPdfBlob?: Blob;
  textPdfBlob?: Blob;
  fingerprint?: string;
  timestamp: number;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not available"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "bookId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCleanPdfToCache(
  bookId: string,
  data: {
    type: "soft" | "hard";
    softPdfBlob?: Blob;
    coverPdfBlob?: Blob;
    textPdfBlob?: Blob;
    fingerprint?: string;
  }
): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      const record: CachedBookPdf = {
        bookId,
        type: data.type,
        softPdfBlob: data.softPdfBlob,
        coverPdfBlob: data.coverPdfBlob,
        textPdfBlob: data.textPdfBlob,
        fingerprint: data.fingerprint,
        timestamp: Date.now(),
      };

      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[pdf-cache] Could not save to IndexedDB:", err);
  }
}

export async function getCleanPdfFromCache(bookId: string): Promise<CachedBookPdf | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(bookId);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[pdf-cache] Could not read from IndexedDB:", err);
    return null;
  }
}

export async function clearCleanPdfFromCache(bookId: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(bookId);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("[pdf-cache] Could not delete from IndexedDB:", err);
  }
}
