"use client";

import { setViewMode, useViewMode, type ViewMode } from "@/lib/viewMode";

const OPTIONS: { mode: ViewMode; label: string; title: string }[] = [
  { mode: "ringkas", label: "Ringkas", title: "Tampilkan angka dan grafik utama saja" },
  { mode: "lengkap", label: "Lengkap", title: "Tampilkan seluruh analisis: tabel, semua indikator, dan rincian" },
];

/** Tombol Ringkas | Lengkap untuk mode tampilan seluruh aplikasi. */
export default function ViewModeToggle({ className = "" }: { className?: string }) {
  const mode = useViewMode();
  return (
    <div role="radiogroup" aria-label="Mode tampilan" className={`inline-flex rounded-lg border border-lime-300 bg-white p-0.5 text-xs font-semibold dark:bg-gray-900 ${className}`}>
      {OPTIONS.map((option) => {
        const active = mode === option.mode;
        return (
          <button
            key={option.mode}
            type="button"
            role="radio"
            aria-checked={active}
            title={option.title}
            onClick={() => setViewMode(option.mode)}
            className={`rounded-md px-2.5 py-1 transition ${active ? "bg-lime-700 text-white shadow-sm" : "text-lime-800 hover:bg-lime-50 dark:text-lime-200"}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
