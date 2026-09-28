"use client";

import { useState, type ReactNode } from "react";
import { setViewMode, useViewMode } from "@/lib/viewMode";

/**
 * Bagian analisis rinci. Mode "lengkap": isi langsung tampil. Mode "ringkas": disembunyikan di balik tombol
 * "Lihat analisis lengkap" agar pengguna awam tidak langsung dibanjiri tabel dan angka.
 */
export default function AnalysisDetail({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  const mode = useViewMode();
  const [open, setOpen] = useState(false);

  if (mode === "lengkap") return <>{children}</>;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-lime-300 bg-white/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-lime-900">{title}</p>
          {description && <p className="text-xs text-lime-900/65">{description}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="rounded-lg border border-lime-700 bg-white px-3 py-1.5 text-xs font-semibold text-lime-700 transition hover:bg-lime-50"
          >
            {open ? "Sembunyikan" : "Lihat analisis lengkap"}
          </button>
          {!open && (
            <button type="button" onClick={() => setViewMode("lengkap")} className="text-xs font-medium text-lime-700/80 underline-offset-2 hover:underline">
              Buka semua (mode Lengkap)
            </button>
          )}
        </div>
      </div>
      {open && children}
    </div>
  );
}
