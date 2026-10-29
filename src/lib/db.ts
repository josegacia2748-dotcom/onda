const DB_NAME = "onda-db";
const DB_VERSION = 1;
const STORE = "downloads";

export type StoredTrack = {
  id: string;
  blob: Blob;
  title: string;
  artist: string;
  album: string;
  savedAt: number;
};

let dbPromise: Promise<IDBDatabase> | null = null;

const openDb = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB no disponible"));
  });
  return dbPromise;
};

const run = async <T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = fn(tx.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Fallo de IndexedDB"));
  });
};

export const putDownload = async (track: StoredTrack): Promise<void> => {
  await run("readwrite", (store) => store.put(track));
};

export const getDownload = async (id: string): Promise<StoredTrack | undefined> => {
  return run<StoredTrack | undefined>("readonly", (store) => store.get(id));
};

export const deleteDownload = async (id: string): Promise<void> => {
  await run("readwrite", (store) => store.delete(id));
};

export const listDownloads = async (): Promise<StoredTrack[]> => {
  return run<StoredTrack[]>("readonly", (store) => store.getAll());
};

export const downloadBytes = async (): Promise<number> => {
  const all = await listDownloads();
  return all.reduce((sum, item) => sum + (item.blob?.size ?? 0), 0);
};
