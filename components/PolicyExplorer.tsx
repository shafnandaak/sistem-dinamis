"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { runSimulation } from "@/lib/engine";
import { buildModelFunctions } from "@/lib/modelFunctions";
import { useViewMode } from "@/lib/viewMode";
import {
  FINAL_YEAR,
  FORECAST_START,
  NO_POLICY,
  POLICIES,
  POLICY_ORDER,
  changeTone,
  formatPct,
  num,
  pctChange,
  rowAt,
  toModelConstants,
  type DataRow,
  type PolicyKey,
} from "@/lib/policies";

// Eksplorasi tiap kebijakan secara terpisah: jalur pengaruhnya di model (mengikuti persamaan) dan dampaknya
// bila dijalankan sendiri pada tingkat tinggi, dibanding baseline. Angka dihitung langsung dari model.

type Metric = { key: string; label: string; variable: string; lowerIsBetter?: boolean };

const METRICS: Record<string, Metric> = {
  padi: { key: "padi", label: "Produksi padi", variable: "Produksi Padi" },
  prodtv: { key: "prodtv", label: "Produktivitas padi", variable: "Produktivitas Padi" },
  ntp: { key: "ntp", label: "NTPP", variable: "NTP Tanaman Pangan" },
  pdrb: { key: "pdrb", label: "PDRB ADHK", variable: "PDRB Pertanian Tanaman Pangan" },
  ncpr: { key: "ncpr", label: "NCPR", variable: "NCPR", lowerIsBetter: true },
  lahan: { key: "lahan", label: "Luas lahan pertanian", variable: "Luas Lahan Pertanian" },
  irigasi: { key: "irigasi", label: "Luas sawah irigasi", variable: "Luas Sawah Irigasi" },
  subsidi: { key: "subsidi", label: "Volume subsidi pupuk", variable: "Subsidi Pupuk" },
  ib: { key: "ib", label: "Indeks yang dibayar petani (Ib)", variable: "Indeks yang Dibayar Petani", lowerIsBetter: true },
};

type PolicyStory = {
  title: string;
  description: string;
  /** Jalur pengaruh di model, mengikuti persamaan di file .mdl. */
  path: string[];
  /** Indikator khusus kebijakan ini (selain produksi padi, NTPP, PDRB, NCPR). */
  focus: string[];
};

const STORIES: Record<PolicyKey, PolicyStory> = {
  lp2b: {
    title: "Perlindungan LP2B",
    description:
      "Menetapkan lahan pertanian pangan berkelanjutan sehingga alih fungsi lahan ke non-pertanian tertahan. Luas lahan yang terjaga membuat luas panen dan produksi lebih tinggi daripada baseline.",
    path: ["% LP2B ↑", "Efektivitas LP2B ↑", "Alih fungsi lahan ↓", "Luas lahan pertanian ↑", "Luas panen ↑", "Produksi ↑"],
    focus: ["lahan"],
  },
  rab: {
    title: "Tambahan Belanja Pertanian (RAB)",
    description:
      "Menambah anggaran pemerintah sektor pertanian. Di model, tambahan anggaran bekerja lewat dua jalur: menambah volume subsidi pupuk (Efek RAB) dan membiayai pembangunan sawah irigasi (Efektivitas Irigasi).",
    path: ["Belanja pertanian ↑", "Efek RAB ↑ → volume subsidi pupuk ↑", "Efektivitas irigasi ↑ → luas sawah irigasi ↑", "Faktor irigasi ↑", "Produktivitas padi ↑"],
    focus: ["irigasi", "subsidi"],
  },
  subsidi: {
    title: "Kenaikan Subsidi Pupuk",
    description:
      "Menaikkan volume subsidi pupuk. Di model, subsidi terutama menurunkan biaya yang dibayar petani (Ib), sehingga NTPP naik; dampaknya ke produktivitas bersifat tidak langsung melalui faktor ekonomi pertanian.",
    path: ["Volume subsidi pupuk ↑", "Efek subsidi pupuk ↑", "Indeks yang dibayar petani (Ib) ↓", "NTPP ↑", "Faktor ekonomi pertanian ↑", "Produktivitas ↑ (kecil)"],
    focus: ["subsidi", "ib"],
  },
  irigasi: {
    title: "Perluasan Sawah Irigasi",
    description:
      "Menambah luas sawah irigasi setiap tahun. Sawah irigasi yang lebih luas menaikkan faktor irigasi sehingga produktivitas padi meningkat; pada model ini kebijakan tunggal dengan dampak produksi terbesar.",
    path: ["Perubahan irigasi ↑", "Luas sawah irigasi ↑", "Faktor irigasi ↑", "Produktivitas padi ↑", "Produksi padi ↑"],
    focus: ["irigasi", "prodtv"],
  },
};

const COMMON = ["padi", "ntp", "pdrb", "ncpr"];

type Effects = Record<PolicyKey, Record<string, number>>;

export default function PolicyExplorer() {
  const viewMode = useViewMode();
  const [active, setActive] = useState<PolicyKey>("lp2b");
  const [effects, setEffects] = useState<Effects | null>(null);
  const [error, setError] = useState("");

  // Model dimuat terpisah (tidak memperberat halaman), lalu tiap kebijakan dijalankan sendiri pada tingkat tinggi.
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const init = (await import("@/lib/sfd-model-fix-2.js")).default;
        const model = await init();
        model.setModelFunctions(buildModelFunctions());
        const base = rowAt(runSimulation(model) as unknown as DataRow[], FINAL_YEAR);
        const out = {} as Effects;
        for (const key of POLICY_ORDER) {
          const values = { ...NO_POLICY, [key]: POLICIES[key].high };
          const row = rowAt(runSimulation(model, { constants: toModelConstants(values) }) as unknown as DataRow[], FINAL_YEAR);
          out[key] = Object.fromEntries(Object.values(METRICS).map((m) => [m.key, pctChange(num(row[m.variable]), num(base[m.variable]))]));
        }
        if (!cancelled) setEffects(out);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Gagal menjalankan model.");
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const story = STORIES[active];
  const policy = POLICIES[active];
  const allKeys = [...COMMON.slice(0, 1), ...story.focus, ...COMMON.slice(1)].filter((k, i, arr) => arr.indexOf(k) === i);
  // Mode Ringkas: produksi padi, indikator utama kebijakan ini, dan NTPP.
  const metricKeys = viewMode === "lengkap" ? allKeys : [...new Set(["padi", story.focus[0], "ntp"])];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Pilih kebijakan">
        {POLICY_ORDER.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active === key}
            onClick={() => setActive(key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              active === key ? "bg-yellow-400 text-lime-950 shadow-sm" : "bg-lime-100 text-lime-900 hover:bg-lime-200"
            }`}
          >
            {STORIES[key].title}
          </button>
        ))}
      </div>

      <div key={active} className="page-enter grid gap-5 rounded-2xl border border-yellow-200 bg-yellow-50 p-5 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-lime-900">{story.title}</h3>
            <p className="mt-1 text-xs font-semibold text-lime-800">Tingkat tinggi: {policy.detail(policy.high)} · mulai {FORECAST_START}</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-700">{story.description}</p>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-lime-700">Jalur pengaruh di model</p>
            <ol className="flex flex-wrap items-center gap-1.5 text-xs">
              {story.path.map((step, i) => (
                <li key={step} className="flex items-center gap-1.5">
                  <span className="rounded-lg border border-lime-200 bg-white px-2 py-1 font-medium text-lime-900">{step}</span>
                  {i < story.path.length - 1 && <span className="text-lime-600" aria-hidden="true">→</span>}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-lime-700">
            Dampak bila dijalankan sendiri · {FINAL_YEAR} vs baseline
          </p>
          {error && <p className="text-sm text-red-700">Gagal menghitung dampak: {error}</p>}
          <div className="grid grid-cols-2 gap-2">
            {metricKeys.map((key) => {
              const m = METRICS[key];
              const value = effects?.[active][key];
              return (
                <div key={key} className="rounded-xl border border-lime-100 bg-white px-3 py-2.5">
                  <p className="text-xs text-lime-900/60">{m.label}</p>
                  {value === undefined ? (
                    <p className="mt-1 h-6 w-16 animate-pulse rounded bg-lime-100" aria-label="Menghitung" />
                  ) : (
                    <p className={`mt-0.5 text-lg font-bold tabular-nums ${changeTone(value, m.lowerIsBetter)}`}>{formatPct(value)}</p>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[11px] leading-relaxed text-lime-900/55">
            Dihitung langsung dari model saat halaman dibuka. NCPR dan Ib: makin kecil makin baik. Kombinasi kebijakan ada di halaman Skenario.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link href="/simulation" className="rounded-lg bg-lime-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-lime-800">
              Coba di Simulasi →
            </Link>
            <Link href="/scenario" className="rounded-lg border border-lime-700 bg-white px-3 py-1.5 text-xs font-semibold text-lime-700 transition hover:bg-lime-50">
              Lihat kombinasi terbaik
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
