import type { NovelSource } from './types';

const DB_NAME = 'NovelST_Database';
const DB_VERSION = 1;
const STORE_NAME = 'novels';

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (e) => {
      dbInstance = (e.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (e) => {
      console.error('[Novel-ST] IndexedDB open failed', e);
      reject((e.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * 将 Vue 响应式 Proxy 对象安全转换为纯净 JS 数据，杜绝 DataCloneError
 */
function cleanForStorage<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export async function dbGetAllNovels(): Promise<NovelSource[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const list = (req.result as NovelSource[]) || [];
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      resolve(list);
    };

    req.onerror = () => reject(req.error);
  });
}

export async function dbGetNovel(id: string): Promise<NovelSource | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);

    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function dbSaveNovel(novel: NovelSource): Promise<void> {
  const db = await openDB();
  const safeData = cleanForStorage(novel);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(safeData);

    req.onsuccess = () => resolve();
    req.onerror = (e) => {
      console.error('[Novel-ST] dbSaveNovel put failed', req.error || e);
      reject(req.error);
    };
  });
}

export async function dbDeleteNovel(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
