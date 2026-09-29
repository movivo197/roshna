"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dayKey, emptyData, growthDataSchema, makeBackup, parseBackup, uid, type GrowthData } from "@/lib/growth-data";

const DATABASE = "roshan-personal-v1";
const STORE = "data";
const RECORD = "primary";
const STORAGE_KEY = "roshan:personal:v1";
const SIGNAL_KEY = "roshan:personal:change";
const LOCK_KEY = "roshan:personal:write";
const CHANNEL = "roshan:personal";
const CONFLICT_MESSAGE = "اطلاعات در زبانهٔ دیگری تغییر کرده است. برای جلوگیری از بازنویسی، ذخیره متوقف شد. ابتدا از تغییرات این صفحه پشتیبان بگیرید و سپس صفحه را تازه کنید.";

type Envelope = { revision: string; data: GrowthData };
type Backend = {
  read: () => Promise<Envelope | null>;
  write: (data: GrowthData, expected: string) => Promise<Envelope>;
  close: () => void;
  writable: boolean;
  notice: string;
};

class ConflictError extends Error {
  constructor() { super(CONFLICT_MESSAGE); this.name = "ConflictError"; }
}

function decode(value: unknown): Envelope | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "object" || !("revision" in value) || typeof value.revision !== "string" || !value.revision || !("data" in value)) {
    throw new Error("دادهٔ ذخیره‌شده قابل خواندن نیست. برای محافظت از اطلاعات، ذخیره متوقف شد؛ فایل پشتیبان خود را نگه دارید.");
  }
  const result = growthDataSchema.safeParse(value.data);
  if (!result.success) throw new Error("نسخه یا ساختار دادهٔ ذخیره‌شده پشتیبانی نمی‌شود. اطلاعات قبلی دست‌نخورده باقی مانده است.");
  return { revision: value.revision, data: result.data };
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) { reject(new Error("IndexedDB unavailable")); return; }
    let request: IDBOpenDBRequest;
    let abandoned = false;
    try { request = window.indexedDB.open(DATABASE, 1); } catch (error) { reject(error); return; }
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => {
      const database = request.result;
      if (abandoned) { database.close(); return; }
      database.onversionchange = () => database.close();
      resolve(database);
    };
    request.onerror = () => reject(request.error ?? new Error("پایگاه داده باز نشد."));
    request.onblocked = () => { abandoned = true; reject(new Error("پایگاه داده در زبانهٔ دیگری باز است.")); };
  });
}

function indexedBackend(database: IDBDatabase): Backend {
  return {
    writable: true,
    notice: "",
    close: () => database.close(),
    read: () => new Promise((resolve, reject) => {
      try {
        const transaction = database.transaction(STORE, "readonly");
        const request = transaction.objectStore(STORE).get(RECORD);
        let result: Envelope | null = null;
        request.onsuccess = () => {
          try { result = decode(request.result); } catch (error) { reject(error); }
        };
        transaction.oncomplete = () => resolve(result);
        transaction.onerror = () => reject(transaction.error ?? new Error("خواندن اطلاعات ناموفق بود."));
        transaction.onabort = () => reject(transaction.error ?? new Error("خواندن اطلاعات لغو شد."));
      } catch (error) { reject(error); }
    }),
    write: (data, expected) => new Promise((resolve, reject) => {
      try {
        // IndexedDB serializes readwrite transactions across tabs; comparison and
        // replacement must be in the same transaction to prevent lost updates.
        const transaction = database.transaction(STORE, "readwrite");
        const objectStore = transaction.objectStore(STORE);
        const request = objectStore.get(RECORD);
        const next: Envelope = { revision: uid(), data };
        request.onsuccess = () => {
          try {
            const previous = decode(request.result);
            if ((previous?.revision ?? "") !== expected) throw new ConflictError();
            objectStore.put(next, RECORD);
          } catch (error) { reject(error); transaction.abort(); }
        };
        transaction.oncomplete = () => resolve(next);
        transaction.onerror = () => reject(transaction.error ?? new Error("ذخیرهٔ اطلاعات ناموفق بود."));
        transaction.onabort = () => reject(transaction.error ?? new Error("ذخیرهٔ اطلاعات لغو شد."));
      } catch (error) { reject(error); }
    }),
  };
}

function localBackend(): Backend {
  // Fallback is only selected when opening IndexedDB fails, never after a
  // validation or write failure, which could otherwise hide an existing record.
  const read = async () => {
    const text = window.localStorage.getItem(STORAGE_KEY);
    if (!text) return null;
    let value: unknown;
    try { value = JSON.parse(text); } catch { throw new Error("دادهٔ ذخیره‌شده آسیب دیده است؛ بازنویسی آن متوقف شد."); }
    return decode(value);
  };
  const locks = navigator.locks;
  return {
    writable: Boolean(locks),
    notice: locks
      ? "مرورگر از حافظهٔ جایگزین استفاده می‌کند؛ از اطلاعات خود مرتب پشتیبان بگیرید."
      : "حافظهٔ امن مرورگر در دسترس نیست. اطلاعات فقط قابل مشاهده است؛ از مرورگر جدید و HTTPS استفاده کنید.",
    close: () => {},
    read,
    write: async (data, expected) => {
      if (!locks) throw new Error("ذخیرهٔ امن در این مرورگر در دسترس نیست.");
      return locks.request(LOCK_KEY, { mode: "exclusive" }, async () => {
        const previous = await read();
        if ((previous?.revision ?? "") !== expected) throw new ConflictError();
        const next = { revision: uid(), data };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
  };
}

async function createBackend(): Promise<Backend> {
  // Once this browser has written a fallback record, keep using that backend.
  // A later recovery of IndexedDB must not make the user's existing data vanish.
  try { if (window.localStorage.getItem(STORAGE_KEY) !== null) return localBackend(); } catch { /* IndexedDB may still work. */ }
  let database: IDBDatabase;
  try { database = await openDatabase(); } catch { return localBackend(); }
  return indexedBackend(database);
}

function storageError(error: unknown): string {
  if (error instanceof ConflictError) return error.message;
  if (error instanceof DOMException && error.name === "QuotaExceededError") {
    return "فضای ذخیرهٔ مرورگر پر شده است. آخرین تغییرات ذخیره نشد؛ همین حالا پشتیبان بگیرید و فضای مرورگر را آزاد کنید.";
  }
  return "آخرین تغییرات ذخیره نشد. از اطلاعات این صفحه پشتیبان بگیرید و دسترسی حافظهٔ مرورگر را بررسی کنید.";
}

export function useGrowthData() {
  const [data, setData] = useState<GrowthData>(emptyData);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const dataRef = useRef(data);
  const backendRef = useRef<Backend | null>(null);
  const revisionRef = useRef("");
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const pendingRef = useRef(0);
  const dirtyRef = useRef(false);
  const blockedRef = useRef(false);
  const mountedRef = useRef(false);
  const generationRef = useRef(0);
  const failureRef = useRef("");
  const channelRef = useRef<BroadcastChannel | null>(null);

  const presentError = useCallback((message: string) => {
    failureRef.current = message;
    if (mountedRef.current) setError(message);
  }, []);

  const refresh = useCallback(async () => {
    const backend = backendRef.current;
    if (!backend || pendingRef.current > 0 || blockedRef.current) return;
    const generation = generationRef.current;
    try {
      const stored = await backend.read();
      if (!mountedRef.current || generation !== generationRef.current || pendingRef.current > 0) return;
      if ((stored?.revision ?? "") === revisionRef.current) return;
      if (dirtyRef.current) {
        blockedRef.current = true;
        presentError(CONFLICT_MESSAGE);
        return;
      }
      revisionRef.current = stored?.revision ?? "";
      dataRef.current = stored?.data ?? emptyData();
      setData(dataRef.current);
    } catch (cause) {
      blockedRef.current = true;
      presentError(cause instanceof Error ? cause.message : "خواندن اطلاعات ذخیره‌شده ناموفق بود.");
    }
  }, [presentError]);

  useEffect(() => {
    mountedRef.current = true;
    const generation = ++generationRef.current;
    let disposed = false;
    let ownedBackend: Backend | null = null;
    void (async () => {
      try {
        const backend = await createBackend();
        ownedBackend = backend;
        if (disposed) { backend.close(); return; }
        const stored = await backend.read();
        if (disposed || generation !== generationRef.current) { backend.close(); return; }
        backendRef.current = backend;
        blockedRef.current = !backend.writable;
        revisionRef.current = stored?.revision ?? "";
        dataRef.current = stored?.data ?? emptyData();
        setData(dataRef.current);
        if (backend.notice) presentError(backend.notice);
        setReady(true);
      } catch (cause) {
        if (disposed) return;
        blockedRef.current = true;
        presentError(cause instanceof Error ? cause.message : "حافظهٔ مرورگر در دسترس نیست؛ ذخیرهٔ اطلاعات ممکن نیست.");
        setReady(true);
      }
    })();
    const onVisibility = () => { if (document.visibilityState === "visible") void refresh(); };
    const onStorage = (event: StorageEvent) => { if (event.key === STORAGE_KEY || event.key === SIGNAL_KEY || event.key === null) void refresh(); };
    const onFocus = () => { void refresh(); };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current || pendingRef.current > 0) { event.preventDefault(); event.returnValue = ""; }
    };
    try {
      const channel = new BroadcastChannel(CHANNEL);
      channel.onmessage = () => { void refresh(); };
      channelRef.current = channel;
    } catch { /* Storage events and focus refresh also cover older browsers. */ }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      disposed = true;
      mountedRef.current = false;
      generationRef.current += 1;
      backendRef.current = null;
      // Let already-authorized serial writes finish before closing their connection.
      void queueRef.current.finally(() => ownedBackend?.close());
      channelRef.current?.close();
      channelRef.current = null;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [presentError, refresh]);

  const persist = useCallback((next: GrowthData): Promise<void> => {
    const backend = backendRef.current;
    if (!backend || blockedRef.current) {
      const message = failureRef.current || "ذخیره هنوز آماده نیست؛ چند لحظه صبر کنید.";
      presentError(message);
      return Promise.reject(new Error(message));
    }
    const generation = generationRef.current;
    dataRef.current = next;
    setData(next);
    dirtyRef.current = true;
    pendingRef.current += 1;
    const operation = queueRef.current.then(async () => {
      if (blockedRef.current) throw new ConflictError();
      const saved = await backend.write(next, revisionRef.current);
      revisionRef.current = saved.revision;
      channelRef.current?.postMessage(saved.revision);
      try { window.localStorage.setItem(SIGNAL_KEY, saved.revision); } catch { /* IndexedDB succeeded; signaling is best-effort. */ }
    }).catch((cause: unknown) => {
      if (cause instanceof ConflictError) blockedRef.current = true;
      presentError(storageError(cause));
      throw cause;
    }).finally(() => {
      pendingRef.current -= 1;
    });
    const settled = operation.then(() => {
      if (pendingRef.current === 0) {
        dirtyRef.current = false;
        if (generation === generationRef.current && mountedRef.current) {
          failureRef.current = backend.notice;
          setError(backend.notice);
          void refresh();
        }
      }
    });
    // Keep the serial queue usable after quota errors while exposing each failure.
    queueRef.current = settled.catch(() => {});
    return settled;
  }, [presentError, refresh]);

  const update = useCallback(async (change: (current: GrowthData) => GrowthData): Promise<boolean> => {
    if (!backendRef.current || blockedRef.current) {
      presentError(failureRef.current || "ذخیره هنوز آماده نیست؛ چند لحظه صبر کنید.");
      return false;
    }
    let next: GrowthData;
    try {
      // Pass a copy so accidental in-place mutations cannot corrupt current data.
      next = growthDataSchema.parse(change(structuredClone(dataRef.current)));
    } catch {
      presentError("مقادیر واردشده معتبر نیست. عنوان، تاریخ و عددها را بررسی کنید؛ اطلاعات قبلی تغییر نکرد.");
      return false;
    }
    try { await persist(next); return true; } catch { return false; }
  }, [persist, presentError]);

  const importData = useCallback(async (text: string) => {
    let next: GrowthData;
    try { next = parseBackup(text); } catch (cause) {
      presentError(cause instanceof Error ? cause.message : "فایل پشتیبان معتبر نیست.");
      throw cause;
    }
    await persist(next);
  }, [persist, presentError]);

  const exportData = useCallback(() => {
    try {
      const blob = new Blob([makeBackup(dataRef.current)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `roshan-backup-${dayKey()}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      return true;
    } catch { presentError("ساخت فایل پشتیبان ناموفق بود؛ دوباره تلاش کنید."); return false; }
  }, [presentError]);

  const clearError = useCallback(() => {
    if (dirtyRef.current || blockedRef.current) return;
    failureRef.current = "";
    setError("");
  }, []);

  return { data, ready, error, update, importData, exportData, clearError };
}
