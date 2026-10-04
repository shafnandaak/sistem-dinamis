"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_PROVINCE, activeProvinceName } from "@/lib/provinceDataset";

// Provinsi aktif hanya berubah lewat pemuatan ulang halaman, jadi tidak perlu berlangganan.
const subscribe = () => () => {};

/** Nama provinsi aktif; render server memakai Jawa Barat agar hydration konsisten. */
export function useProvinceName() {
  return useSyncExternalStore(subscribe, activeProvinceName, () => DEFAULT_PROVINCE);
}
