import { useCallback, useSyncExternalStore, type Dispatch, type SetStateAction } from "react";

// Pengaturan halaman (tahap Baseline, slider & pembanding Simulasi, tab Skenario) disimpan per tab browser
// (sessionStorage), sehingga tidak hilang saat pindah halaman atau memuat ulang; hilang saat tab ditutup.
// Hasil model tidak disimpan: model dijalankan ulang dari pengaturan ini (cepat dan selalu sesuai data aktif).
// Bila sessionStorage diblokir, nilai tetap diingat di memori selama halaman tidak dimuat ulang.

const PREFIX = "sd-sesi:";
const memory = new Map<string, string>();
const parsed = new Map<string, { raw: string; value: unknown }>();
const initials = new Map<string, unknown>();
const listeners = new Set<() => void>();

function readRaw(key: string): string | null {
  try {
    const raw = window.sessionStorage.getItem(PREFIX + key);
    if (raw !== null) return raw;
  } catch {
    // sessionStorage tidak tersedia
  }
  return memory.get(key) ?? null;
}

function writeRaw(key: string, raw: string) {
  memory.set(key, raw);
  try {
    window.sessionStorage.setItem(PREFIX + key, raw);
  } catch {
    // penyimpanan penuh atau diblokir: tetap berjalan di memori
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Nilai awal pertama untuk sebuah kunci; disimpan agar referensinya stabil antar-render. */
function initialFor<T>(key: string, initial: T): T {
  if (!initials.has(key)) initials.set(key, initial);
  return initials.get(key) as T;
}

/** Seperti useState, tetapi nilainya diingat selama tab browser masih terbuka. */
export function useSessionState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const fallback = initialFor(key, initial);

  const getSnapshot = useCallback((): T => {
    const raw = readRaw(key);
    if (raw === null) return fallback;
    const cached = parsed.get(key);
    if (cached && cached.raw === raw) return cached.value as T;
    try {
      const value = JSON.parse(raw) as T;
      parsed.set(key, { raw, value });
      return value;
    } catch {
      return fallback;
    }
  }, [key, fallback]);

  // Saat render di server belum ada sessionStorage: pakai nilai awal.
  const value = useSyncExternalStore(subscribe, getSnapshot, () => fallback);

  const setValue = useCallback<Dispatch<SetStateAction<T>>>(
    (action) => {
      const next = typeof action === "function" ? (action as (prev: T) => T)(getSnapshot()) : action;
      writeRaw(key, JSON.stringify(next));
    },
    [key, getSnapshot],
  );

  return [value, setValue];
}

/** Hapus semua pengaturan halaman yang tersimpan, mis. saat data provinsi diganti. */
export function clearSessionState() {
  memory.clear();
  parsed.clear();
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const k = window.sessionStorage.key(i);
      if (k?.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => window.sessionStorage.removeItem(k));
  } catch {
    // abaikan
  }
  listeners.forEach((listener) => listener());
}
