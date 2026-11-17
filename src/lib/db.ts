import type { Item } from "./types";

/** Petit emballage IndexedDB : l'historique reste dans le navigateur, rien n'est envoyé ailleurs. */
let db: IDBDatabase | null = null;

export function openDb(): Promise<void> {
  return new Promise((res, rej) => {
    if (db) return res();
    try {
      const r = indexedDB.open("presse-vue", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("items", { keyPath: "id" });
      r.onsuccess = () => { db = r.result; res(); };
      r.onerror = () => rej(r.error);
    } catch (e) { rej(e); }
  });
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T | null> {
  return new Promise((res, rej) => {
    if (!db) return res(null);
    try {
      const q = fn(db.transaction("items", mode).objectStore("items"));
      q.onsuccess = () => res(q.result as T);
      q.onerror = () => rej(q.error);
    } catch (e) { rej(e); }
  });
}

export const dbAll = () => run<Item[]>("readonly", (s) => s.getAll());
export const dbPut = (it: Item) => run("readwrite", (s) => s.put(it));
export const dbDel = (id: string) => run("readwrite", (s) => s.delete(id));
export const dbClear = () => run("readwrite", (s) => s.clear());
