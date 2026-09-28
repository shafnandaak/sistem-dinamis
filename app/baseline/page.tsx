"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import initModel from "@/lib/sfd-model-fix-2.js";
import { runSimulation } from "@/lib/engine";
import { buildModelFunctions } from "@/lib/modelFunctions";
import { BASELINE_END_YEAR, BASELINE_START_YEAR, BASELINE_YEARS, MAPE_VARIABLES, computeMape, mapeCategory } from "@/lib/historicalActuals";
import AnalysisDetail from "@/components/AnalysisDetail";
import { changeTone } from "@/lib/policies";
import { useViewMode } from "@/lib/viewMode";
import Toast from "@/components/Toast";
import ModelPrintNotice from "@/components/ModelPrintNotice";
import Chart from "@/components/Chart";
import Reveal from "@/components/Reveal";

type DataRow = Record<string, number | string | null | undefined>;

// Tabel variabel memuat rumus seluruh model (~200 KB), jadi dimuat terpisah dan hanya di browser.
const VariableExplorer = dynamic(() => import("@/components/VariableExplorer"), {
  ssr: false,
  loading: () => <p className="text-sm text-lime-900/60">Memuat tabel variabel…</p>,
});

type Stage = 0 | 1 | 2;

// Periode forecasting: setelah baseline hingga FINAL TIME model sfd-model-fix-2 model 17 (2035)
const FORECAST_START_YEAR = BASELINE_END_YEAR + 1;
const FORECAST_END_YEAR = 2035;

const METRICS = [
  { label: "NTP Tanaman Pangan (NTPP)", variable: "NTP Tanaman Pangan", unit: "Indeks" },
  { label: "Indeks yang Diterima Petani (It)", variable: "Indeks yang Diterima Petani", unit: "Indeks" },
  { label: "NCPR (konsumsi normatif / produksi)", variable: "NCPR", unit: "Rasio" },
  { label: "Produksi Padi", variable: "Produksi Padi", unit: "ton/tahun" },
  { label: "Luas Panen Padi", variable: "Luas Panen Padi", unit: "ha/tahun" },
  { label: "Luas Lahan Pertanian", variable: "Luas Lahan Pertanian", unit: "ha" },
  { label: "PDRB Tanaman Pangan", variable: "PDRB Pertanian Tanaman Pangan", unit: "Rupiah/tahun" },
  { label: "PDRB per Kapita", variable: "PDRB Per Kapita Pertanian Tanaman Pangan", unit: "Rupiah/jiwa/tahun" },
  { label: "Jumlah Penduduk", variable: "Jumlah Penduduk", unit: "jiwa" },
] as const;

const KEY_COLUMNS = ["Time", ...METRICS.map((m) => m.variable)];

function toNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function formatValue(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} T`;
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} M`;
  return value.toLocaleString("id-ID", { maximumFractionDigits: abs < 10 ? 3 : 2 });
}

function exportRowsToCsv(rows: DataRow[], filename: string, columns: string[]) {
  if (!rows.length) return;
  const escapeCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csvLines = [columns.join(","), ...rows.map((row) => columns.map((c) => escapeCell(row[c])).join(","))];
  const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function StepBadge({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
        done ? "bg-lime-700 text-white" : active ? "bg-yellow-400 text-lime-950 ring-4 ring-yellow-200" : "bg-gray-100 text-gray-400"
      }`}
    >
      {done ? "✓" : n}
    </span>
  );
}

function ResultsTable({ rows, title, filename }: { rows: DataRow[]; title: string; filename: string }) {
  const [showAll, setShowAll] = useState(false);
  const columns = useMemo(() => {
    if (rows.length === 0) return [] as string[];
    const all = Object.keys(rows[0]);
    const key = KEY_COLUMNS.filter((c) => all.includes(c));
    return showAll ? [...key, ...all.filter((c) => !key.includes(c))] : key;
  }, [rows, showAll]);

  return (
    <div className="overflow-hidden rounded-2xl border border-lime-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-lime-200 bg-lime-50 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-lime-700">Tabel hasil</p>
          <p className="text-sm text-lime-900/75">{title}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="rounded-lg border border-lime-700 bg-white px-3 py-2 text-xs font-semibold text-lime-700 transition hover:bg-lime-50"
          >
            {showAll ? "Tampilkan variabel utama" : "Tampilkan semua variabel"}
          </button>
          <button
            type="button"
            onClick={() => exportRowsToCsv(rows, filename, columns)}
            className="rounded-lg bg-lime-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-lime-800"
          >
            Export CSV
          </button>
        </div>
      </div>
      <div className="max-h-[480px] overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 bg-lime-50">
            <tr className="border-b border-lime-200 text-xs font-semibold uppercase text-lime-800">
              {columns.map((column) => (
                <th key={column} className="whitespace-nowrap px-4 py-3">
                  {column === "Time" ? "Tahun" : column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={String(row["Time"])} className="border-b border-lime-100 transition-colors hover:bg-yellow-50">
                {columns.map((column) => (
                  <td key={column} className="whitespace-nowrap px-4 py-2.5">
                    {column === "Time" ? String(row[column]) : formatValue(toNumber(row[column]))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Indikator utama untuk ringkasan akurasi (dipahami pengguna awam).
const KEY_ACCURACY = [
  { key: "produksi-padi", label: "Produksi padi" },
  { key: "luas-panen-padi", label: "Luas panen padi" },
  { key: "ntp", label: "NTP Tanaman Pangan" },
];

const CATEGORY_STYLE = {
  good: "bg-lime-100 text-lime-800",
  ok: "bg-yellow-100 text-yellow-800",
  fair: "bg-amber-100 text-amber-800",
  bad: "bg-red-100 text-red-800",
} as const;

function KeyAccuracy({ rows }: { rows: DataRow[] }) {
  const items = KEY_ACCURACY.flatMap(({ key, label }) => {
    const variable = MAPE_VARIABLES.find((v) => v.key === key);
    const result = variable ? computeMape(variable, rows) : null;
    return result && result.mape !== null ? [{ label, mape: result.mape, category: mapeCategory(result.mape) }] : [];
  });
  return (
    <div className="space-y-3 rounded-2xl border border-lime-200 bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-lime-900">Seberapa akurat model?</h3>
        <p className="text-sm text-lime-900/70">
          Rata-rata selisih hasil model dengan data resmi {BASELINE_START_YEAR}–{BASELINE_END_YEAR} (MAPE). Makin kecil makin akurat; di bawah 10%
          tergolong sangat baik.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl border border-lime-100 bg-lime-50/60 p-4">
            <p className="text-sm font-medium text-lime-900">{item.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-lime-950">
              {item.mape.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%
            </p>
            <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${CATEGORY_STYLE[item.category.tone]}`}>
              {item.category.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Indikator proyeksi yang tampil di mode Ringkas; mode Lengkap menampilkan semuanya.
const KEY_FORECAST = ["Produksi Padi", "NTP Tanaman Pangan", "Luas Lahan Pertanian"];

export default function BaselinePage() {
  const viewMode = useViewMode();
  const [results, setResults] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<Stage>(0);
  const [baselineMetric, setBaselineMetric] = useState<string>(METRICS[0].variable);
  const [forecastMetric, setForecastMetric] = useState<string>(METRICS[0].variable);
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const baselineRef = useRef<HTMLDivElement | null>(null);
  const forecastRef = useRef<HTMLDivElement | null>(null);

  // Jalankan model sekali saat halaman dibuka (tanpa intervensi kebijakan)
  useEffect(() => {
    const run = async () => {
      try {
        const model = await initModel();
        model.setModelFunctions(buildModelFunctions());
        setResults(runSimulation(model) as unknown as DataRow[]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Terjadi error saat menjalankan model.";
        setNotification({ type: "error", message: `Gagal menjalankan model: ${message}` });
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  const baselineRows = useMemo(
    () => results.filter((r) => toNumber(r["Time"]) >= BASELINE_START_YEAR && toNumber(r["Time"]) <= BASELINE_END_YEAR),
    [results],
  );
  const forecastRows = useMemo(
    () => results.filter((r) => toNumber(r["Time"]) >= FORECAST_START_YEAR && toNumber(r["Time"]) <= FORECAST_END_YEAR),
    [results],
  );

  const toPoints = (rows: DataRow[], variable: string) => rows.map((r) => ({ x: toNumber(r["Time"]), y: toNumber(r[variable]) }));

  const baselineMetricLabel = METRICS.find((m) => m.variable === baselineMetric)?.label ?? baselineMetric;
  const forecastMetricLabel = METRICS.find((m) => m.variable === forecastMetric)?.label ?? forecastMetric;
  const baselineMetricUnit = METRICS.find((m) => m.variable === baselineMetric)?.unit;
  const forecastMetricUnit = METRICS.find((m) => m.variable === forecastMetric)?.unit;

  // Data aktual pembanding untuk grafik baseline (diambil dari daftar validasi MAPE).
  const baselineActualPoints = useMemo(() => {
    const actual = MAPE_VARIABLES.find((v) => v.modelVar === baselineMetric)?.actual ?? [];
    return BASELINE_YEARS.flatMap((year, idx) => (actual[idx] != null ? [{ x: year, y: actual[idx] as number }] : []));
  }, [baselineMetric]);

  const forecastSummary = useMemo(() => {
    const start = baselineRows.at(-1);
    const end = forecastRows.at(-1);
    if (!start || !end) return [];
    return METRICS.slice(0, 6).map((metric) => {
      const from = toNumber(start[metric.variable]);
      const to = toNumber(end[metric.variable]);
      return { ...metric, from, to, change: from !== 0 ? ((to - from) / Math.abs(from)) * 100 : null };
    });
  }, [baselineRows, forecastRows]);

  const goTo = (target: 1 | 2) => {
    setStage((prev) => (prev < target ? target : prev));
    // tunggu section dirender sebelum scroll
    setTimeout(() => {
      (target === 1 ? baselineRef : forecastRef).current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const steps = [
    { n: 1, title: "Pelajari Baseline", period: `${BASELINE_START_YEAR}–${BASELINE_END_YEAR}`, desc: "Validasi model terhadap data aktual (MAPE)." },
    { n: 2, title: "Forecasting", period: `${FORECAST_START_YEAR}–${FORECAST_END_YEAR}`, desc: "Proyeksi tanpa intervensi kebijakan." },
  ];

  return (
    <div className="space-y-6">
      {/* ===== Intro ===== */}
      <Reveal>
        <section className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
          <div className="space-y-5 rounded-3xl border border-lime-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-lime-700">Baseline Model · Jawa Barat</p>
              <h1 className="text-2xl font-bold text-lime-900 md:text-3xl">Model Sistem Dinamis Kebijakan Pertanian Tanaman Pangan</h1>
              <p className="mt-2 text-sm text-lime-900/75">
                Halaman ini terdiri dari dua tahap. <strong>Baseline</strong> ({BASELINE_START_YEAR}–{BASELINE_END_YEAR}) menguji
                seberapa dekat model dengan data aktual melalui MAPE. Setelah itu, <strong>Forecasting</strong> ({FORECAST_START_YEAR}–
                {FORECAST_END_YEAR}) memproyeksikan kondisi ke depan tanpa intervensi kebijakan.
              </p>
            </div>

            <ol className="grid gap-3 sm:grid-cols-2">
              {steps.map((step) => {
                const unlocked = stage >= step.n || step.n === 1;
                return (
                  <li key={step.n}>
                    <button
                      type="button"
                      disabled={!unlocked || loading}
                      onClick={() => goTo(step.n as 1 | 2)}
                      className={`card-hover flex w-full items-start gap-3 rounded-2xl border p-4 text-left ${
                        stage === step.n ? "border-yellow-300 bg-yellow-50" : "border-lime-200 bg-lime-50/60"
                      } disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:transform-none`}
                    >
                      <StepBadge n={step.n} active={stage + 1 === step.n || stage === step.n} done={stage > step.n} />
                      <span>
                        <span className="block font-semibold text-lime-900">{step.title}</span>
                        <span className="block text-xs font-semibold text-lime-700">{step.period}</span>
                        <span className="mt-1 block text-xs text-lime-900/70">{step.desc}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => goTo(1)}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-lime-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-lime-800 hover:shadow-md disabled:bg-lime-300"
              >
                {loading ? "Menjalankan model..." : "Pelajari Baseline"}
                {!loading && <span aria-hidden="true">→</span>}
              </button>
              <Link
                href="/baseline/provinsi-lain"
                className="rounded-xl border border-dashed border-amber-400 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
              >
                Provinsi Lain <span className="text-[10px] uppercase tracking-wide text-amber-800/80">· Pengembangan Lanjutan</span>
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-lime-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-lime-700">Status Model</p>
            <h2 className="mt-2 text-xl font-semibold text-lime-900">sfd-model-fix-2 model 17</h2>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-lime-50 p-4">
                <p className="text-sm text-lime-900/70">Running</p>
                <p className="mt-1 flex items-center gap-2 font-semibold text-lime-900">
                  <span className={`h-2.5 w-2.5 rounded-full ${loading ? "animate-pulse bg-yellow-400" : "bg-lime-600"}`} />
                  {loading ? "Sedang berjalan..." : `Selesai · ${results.length} tahun (${BASELINE_START_YEAR}–${FORECAST_END_YEAR})`}
                </p>
              </div>
              <div className="rounded-2xl bg-lime-50 p-4">
                <p className="text-sm text-lime-900/70">Wilayah</p>
                <p className="mt-1 font-semibold text-lime-900">Jawa Barat</p>
              </div>
              <div className="rounded-2xl bg-lime-50 p-4">
                <p className="text-sm text-lime-900/70">Tahap saat ini</p>
                <p className="mt-1 font-semibold text-lime-900">
                  {stage === 0 ? "Belum dimulai" : stage === 1 ? "1 · Baseline" : "2 · Forecasting"}
                </p>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {notification && <Toast type={notification.type} message={notification.message} onClose={() => setNotification(null)} />}

      {/* ===== Tahap 1: Baseline ===== */}
      {stage >= 1 && baselineRows.length > 0 && (
        <div ref={baselineRef} className="space-y-6 scroll-mt-24">
          <Reveal>
            <div className="flex items-center gap-3 rounded-2xl border border-lime-200 bg-lime-100 p-5">
              <StepBadge n={1} active done={stage > 1} />
              <div>
                <p className="text-xs uppercase tracking-wide text-lime-700">Tahap 1</p>
                <h2 className="text-xl font-bold text-lime-900 md:text-2xl">
                  Baseline {BASELINE_START_YEAR}–{BASELINE_END_YEAR}
                </h2>
                <p className="text-sm text-lime-900/75">Hasil model dibandingkan dengan data aktual Jawa Barat.</p>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <ModelPrintNotice onPrint={() => window.print()} />
          </Reveal>

          <Reveal>
            <KeyAccuracy rows={baselineRows} />
          </Reveal>

          <Reveal>
            <div className="space-y-4 rounded-2xl border border-lime-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <h3 className="text-lg font-semibold text-lime-900">
                  Grafik Baseline {BASELINE_START_YEAR}–{BASELINE_END_YEAR}
                </h3>
                <select
                  className="rounded-lg border border-lime-300 bg-white px-3 py-1.5 text-sm"
                  value={baselineMetric}
                  onChange={(e) => setBaselineMetric(e.target.value)}
                  aria-label="Pilih variabel grafik baseline"
                >
                  {METRICS.map((m) => (
                    <option key={m.variable} value={m.variable}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="rounded-xl border border-lime-200 bg-lime-50 p-3">
                <Chart
                  title={baselineMetricLabel}
                  yAxisLabel={baselineMetricUnit}
                  points={toPoints(baselineRows, baselineMetric)}
                  series={[
                    { name: "Model (baseline)", points: toPoints(baselineRows, baselineMetric), lineColor: "#3f7d20" },
                    ...(baselineActualPoints.length > 0
                      ? [{ name: "Data aktual", points: baselineActualPoints, lineColor: "#d97706" }]
                      : []),
                  ]}
                  valueFormatter={formatValue}
                  xFormatter={(value) => String(value)}
                />
              </div>
              {baselineActualPoints.length === 0 && (
                <p className="text-xs text-lime-900/60">Data aktual untuk variabel ini belum tersedia; grafik hanya menampilkan hasil model.</p>
              )}
            </div>
          </Reveal>

          <Reveal>
            <AnalysisDetail
              title="Semua variabel model & validasi"
              description="Tabel seluruh variabel per subsistem dan fungsi, MAPE tiap variabel, nilai per tahun, rumus, dan grafik."
            >
            <div className="space-y-4 rounded-2xl border border-lime-200 bg-white p-5 shadow-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-lime-700">Variabel model & validasi</p>
                <h3 className="text-lg font-semibold text-lime-900">
                  Variabel Model {BASELINE_START_YEAR}–{BASELINE_END_YEAR}
                </h3>
                <p className="text-sm text-lime-900/70">
                  Semua variabel hasil run baseline dalam satu tabel, dikelompokkan menurut subsistem dan fungsinya (endogen, lookup,
                  parameter). Variabel yang memiliki data aktual menampilkan APE dan MAPE (kriteria Lewis, 1982: &lt; 10% sangat baik,
                  10–20% baik, 20–50% layak, &gt; 50% tidak akurat).
                </p>
              </div>
              <VariableExplorer rows={baselineRows} />
            </div>
            </AnalysisDetail>
          </Reveal>

          {stage === 1 && (
            <Reveal>
              <div className="flex flex-col items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-amber-900">Baseline sudah dipelajari?</p>
                  <p className="text-sm text-amber-900/80">
                    Lanjutkan ke proyeksi {FORECAST_START_YEAR}–{FORECAST_END_YEAR} tanpa intervensi kebijakan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => goTo(2)}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-amber-700 hover:shadow-md"
                >
                  Lanjut ke Forecasting <span aria-hidden="true">→</span>
                </button>
              </div>
            </Reveal>
          )}
        </div>
      )}

      {/* ===== Tahap 2: Forecasting ===== */}
      {stage >= 2 && forecastRows.length > 0 && (
        <div ref={forecastRef} className="space-y-6 scroll-mt-24">
          <Reveal>
            <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-100 p-5">
              <StepBadge n={2} active done={false} />
              <div>
                <p className="text-xs uppercase tracking-wide text-amber-800">Tahap 2</p>
                <h2 className="text-xl font-bold text-amber-950 md:text-2xl">
                  Forecasting {FORECAST_START_YEAR}–{FORECAST_END_YEAR}
                </h2>
                <p className="text-sm text-amber-900/80">Proyeksi tanpa intervensi kebijakan, melanjutkan kondisi baseline.</p>
              </div>
            </div>
          </Reveal>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {forecastSummary.filter((item) => viewMode === "lengkap" || KEY_FORECAST.includes(item.variable)).map((item, idx) => (
              <Reveal key={item.variable} delay={idx * 60}>
                <div className="card-hover h-full rounded-2xl border border-amber-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-amber-800">{item.label}</p>
                  <p className="mt-2 text-sm text-lime-900/70">
                    {BASELINE_END_YEAR}: <span className="font-semibold text-lime-900">{formatValue(item.from)}</span>
                    {" → "}
                    {FORECAST_END_YEAR}: <span className="font-semibold text-lime-900">{formatValue(item.to)}</span>
                  </p>
                  <p className={`mt-1 text-2xl font-bold ${item.change !== null ? changeTone(item.change, item.variable === "NCPR") : "text-gray-500"}`}>
                    {item.change !== null ? `${item.change > 0 ? "+" : ""}${item.change.toFixed(2)}%` : "–"}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="space-y-4 rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <h3 className="text-lg font-semibold text-amber-950">Grafik Baseline vs Forecasting</h3>
                <select
                  className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm"
                  value={forecastMetric}
                  onChange={(e) => setForecastMetric(e.target.value)}
                  aria-label="Pilih variabel grafik forecasting"
                >
                  {METRICS.map((m) => (
                    <option key={m.variable} value={m.variable}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <Chart
                  title={forecastMetricLabel}
                  yAxisLabel={forecastMetricUnit}
                  points={toPoints(results, forecastMetric)}
                  series={[
                    { name: `Baseline ${BASELINE_START_YEAR}–${BASELINE_END_YEAR}`, points: toPoints(baselineRows, forecastMetric), lineColor: "#3f7d20" },
                    {
                      name: `Forecast ${FORECAST_START_YEAR}–${FORECAST_END_YEAR}`,
                      // sertakan titik terakhir baseline agar garis tersambung
                      points: toPoints([...baselineRows.slice(-1), ...forecastRows], forecastMetric),
                      lineColor: "#d97706",
                    },
                  ]}
                  valueFormatter={formatValue}
                  xFormatter={(value) => String(value)}
                />
              </div>
            </div>
          </Reveal>

          <Reveal>
            <AnalysisDetail title="Tabel proyeksi per tahun" description="Nilai seluruh indikator utama tiap tahun hingga 2035, dapat diekspor ke CSV.">
              <ResultsTable
                rows={forecastRows}
                title={`Proyeksi model Jawa Barat ${FORECAST_START_YEAR}–${FORECAST_END_YEAR}.`}
                filename={`forecast-${FORECAST_START_YEAR}-${FORECAST_END_YEAR}.csv`}
              />
            </AnalysisDetail>
          </Reveal>

          <Reveal>
            <div className="flex flex-col gap-3 rounded-2xl border border-lime-200 bg-lime-50 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-lime-900">Langkah berikutnya</p>
                <p className="text-sm text-lime-900/75">Bandingkan skenario kebijakan atau atur parameter kebijakan sendiri.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/scenario" className="rounded-xl bg-lime-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-lime-800">
                  Bandingkan Skenario
                </Link>
                <Link href="/simulation" className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700">
                  Simulasi Kebijakan
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      )}
    </div>
  );
}
