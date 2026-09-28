"use client";

import { useSyncExternalStore } from "react";

// Mode tampilan global: "ringkas" (default, untuk pengguna awam) atau "lengkap" (semua analisis terbuka).
// Disimpan di localStorage per browser; bila penyimpanan diblokir, tetap bekerja di memori selama sesi.

export type ViewMode = "ringkas" | "lengkap";

const KEY = "sd-view-mode";
const listeners = new Set<() => void>();
let memory: ViewMode | null = null;

function read(): ViewMode {
  try {
    const stored = window.localStorage.getItem(KEY);
    if (stored === "ringkas" || stored === "lengkap") return stored;
  } catch {
    // localStorage tidak tersedia (mode privat, dll.)
  }
  return memory ?? "ringkas";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function setViewMode(mode: ViewMode) {
  memory = mode;
  try {
    window.localStorage.setItem(KEY, mode);
  } catch {
    // abaikan; nilai tetap tersimpan di memori
  }
  listeners.forEach((listener) => listener());
}

/** Mode tampilan saat ini. Saat render di server selalu "ringkas" agar tidak terjadi hydration mismatch. */
export function useViewMode(): ViewMode {
  return useSyncExternalStore(subscribe, read, () => "ringkas");
}
