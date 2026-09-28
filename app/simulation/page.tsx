"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import initModel from "@/lib/sfd-model-fix-2.js";
import { runSimulation } from "@/lib/engine";
import { buildModelFunctions } from "@/lib/modelFunctions";
import Chart from "@/components/Chart";
import ModelPrintNotice from "@/components/ModelPrintNotice";
import LeaveGuard from "@/components/LeaveGuard";
import AnalysisDetail from "@/components/AnalysisDetail";
import { setViewMode, useViewMode } from "@/lib/viewMode";
import {
  BELANJA_DASAR,
  FINAL_YEAR,
  FORECAST_START,
  METRICS,
  NO_POLICY,
  POLICIES,
  POLICY_ORDER,
  SCENARIOS,
  changeTone,
  exportCsv,
  formatPct,
  formatValue,
  num,
  pctChange,
  rowAt,
  scenarioValues,
  toModelConstants,
  type DataRow,
  type PolicyKey,
  type PolicyValues,
} from "@/lib/policies";

type Model = Awaited<ReturnType<typeof initModel>>;
type Snapshot = { id: number; tag: string; label: string; values: PolicyValues; rows: DataRow[]; color: string };
/** Hasil pembanding (skenario terbaik atau pembanding yang disimpan) yang ditampilkan di grafik & tabel. */
type Reference = { key: string; tag: string; label: string; rows: DataRow[]; color: string };

const SNAPSHOT_COLORS = ["#9333ea", "#db2777", "#0891b2"];
// Warna pembanding skenario dibedakan dari warna "Simulasi saat ini" (hijau).
const SCENARIO_COLORS: Record<string, string> = { s1: "#0f766e", s2: "#d97706", s3: "#2563eb" };
const MAX_SNAPSHOTS = SNAPSHOT_COLORS.length;
const SIM_COLOR = "#3f7d20";
const BASE_COLOR = "#9ca3af";

const PRESETS: { id: string; label: string; values: PolicyValues }[] = [
  { id: "baseline", label: "Tanpa kebijakan", values: NO_POLICY },
  ...SCENARIOS.map((s) => ({ id: s.id, label: `${s.rank}. ${s.name}`, values: scenarioValues(s) })),
];

const sameValues = (a: PolicyValues, b: PolicyValues) => POLICY_ORDER.every((key) => a[key] === b[key]);

function describe(values: PolicyValues): string {
  const parts = POLICY_ORDER.filter((key) => values[key] !== 0).map((key) => {
    const p = POLICIES[key];
    return `${p.label} ${key === "lp2b" ? "" : "+"}${values[key].toLocaleString("id-ID")}${key === "irigasi" ? "%/th" : "%"}`;
  });
  return parts.length > 0 ? parts.join(" · ") : "Tanpa kebijakan";
}

function formatRupiahMiliar(value: number): string {
  return `Rp ${(value / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} miliar`;
}

function PolicySlider({ policyKey, value, onChange }: { policyKey: PolicyKey; value: number; onChange: (value: number) => void }) {
  const p = POLICIES[policyKey];
  const id = `policy-${policyKey}`;
  // Teks yang sedang diketik; null = tampilkan nilai tersimpan. Menerima koma atau titik desimal.
  const [draft, setDraft] = useState<string | null>(null);
  const clamp = (v: number) => Math.min(p.max, Math.max(p.min, v));
  const parse = (text: string) => Number(text.replace(",", ".").trim());

  const onType = (text: string) => {
    setDraft(text);
    const parsed = parse(text);
    if (text.trim() !== "" && Number.isFinite(parsed)) onChange(clamp(parsed));
  };
  const commit = () => setDraft(null);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-lime-900">
          {p.title}
        </label>
        <span className="inline-flex shrink-0 items-center rounded-md border border-lime-300 bg-lime-50 focus-within:border-lime-600 focus-within:ring-2 focus-within:ring-lime-200">
          {policyKey !== "lp2b" && <span className="pl-2 text-sm font-bold text-lime-900">+</span>}
          <input
            type="text"
            inputMode="decimal"
            value={draft ?? value.toLocaleString("id-ID")}
            onChange={(e) => onType(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                setDraft(null);
                onChange(clamp(Number((value + (e.key === "ArrowUp" ? p.step : -p.step)).toFixed(4))));
              }
            }}
            aria-label={`${p.title} (${p.unit}), ketik angka ${p.min}–${p.max}`}
            className="w-14 bg-transparent py-0.5 pl-1 text-right text-sm font-bold tabular-nums text-lime-900 outline-none"
          />
          <span className="pr-2 text-xs font-semibold text-lime-900/70">{p.unit}</span>
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={p.min}
        max={p.max}
        step={p.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-lime-700"
      />
      <div className="flex justify-between text-[11px] text-lime-900/50">
        <span>{p.min}</span>
        <span>tinggi: {p.high.toLocaleString("id-ID")}</span>
        <span>{p.max}</span>
      </div>
      <p className="text-xs text-lime-900/60">
        {p.help}
        {policyKey === "rab" && ` ≈ ${formatRupiahMiliar(BELANJA_DASAR * (1 + value / 100))}/tahun.`}
      </p>
    </div>
  );
}

// Mode Ringkas: kartu dampak utama saja.
const KEY_CARDS = ["padi", "ncpr", "ntp"];

export default function SimulationPage() {
  const viewMode = useViewMode();
  const modelRef = useRef<Model | null>(null);
  const [baseline, setBaseline] = useState<DataRow[]>([]);
  const [rows, setRows] = useState<DataRow[]>([]);
  const [values, setValues] = useState<PolicyValues>(NO_POLICY);
  const [year, setYear] = useState(FINAL_YEAR);
  const [metricKey, setMetricKey] = useState(METRICS[0].key);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [scenarioRuns, setScenarioRuns] = useState<Record<string, DataRow[]>>({});
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showBaseline, setShowBaseline] = useState(true);
  /** Skenario terakhir yang dimuat ke slider (untuk petunjuk "bandingkan dengan skenario aslinya"). */
  const [loadedPreset, setLoadedPreset] = useState<string | null>(null);
  const [documentedSig, setDocumentedSig] = useState("");
  const [error, setError] = useState("");
  const snapshotId = useRef(0);

  // Muat model sekali, lalu jalankan baseline.
  useEffect(() => {
    const load = async () => {
      try {
        const model = await initModel();
        model.setModelFunctions(buildModelFunctions());
        modelRef.current = model;
        const base = runSimulation(model) as unknown as DataRow[];
        // Hasil tiga skenario terbaik disiapkan sekali untuk pilihan "Bandingkan dengan".
        const runs: Record<string, DataRow[]> = {};
        for (const scenario of SCENARIOS) {
          runs[scenario.id] = runSimulation(model, { constants: toModelConstants(scenarioValues(scenario)) }) as unknown as DataRow[];
        }
        setScenarioRuns(runs);
        setBaseline(base);
        setRows(base);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal memuat model.");
      }
    };
    void load();
  }, []);

  // Simulasi ulang otomatis setiap kali slider berubah (sedikit ditunda agar geseran tetap mulus).
  useEffect(() => {
    if (!modelRef.current || baseline.length === 0) return;
    const timer = window.setTimeout(() => {
      const model = modelRef.current;
      if (!model) return;
      setRows(runSimulation(model, { constants: toModelConstants(values) }) as unknown as DataRow[]);
    }, 60);
    return () => window.clearTimeout(timer);
  }, [values, baseline]);

  const ready = baseline.length > 0 && rows.length > 0;
  const metric = METRICS.find((m) => m.key === metricKey) ?? METRICS[0];
  const activePreset = PRESETS.find((p) => sameValues(p.values, values))?.id;
  const loadedScenario = SCENARIOS.find((sc) => sc.id === loadedPreset) ?? null;

  const cards = useMemo(() => {
    if (!ready) return [];
    const sim = rowAt(rows, year);
    const base = rowAt(baseline, year);
    return METRICS.map((m) => ({ metric: m, value: m.value(sim), change: pctChange(m.value(sim), m.value(base)) }));
  }, [ready, rows, baseline, year]);

  // Pembanding aktif: skenario terbaik yang dipilih + pembanding yang disimpan (P1–P3).
  const references = useMemo<Reference[]>(
    () => [
      ...SCENARIOS.filter((sc) => compareIds.includes(sc.id) && scenarioRuns[sc.id]).map((sc) => ({
        key: `sc-${sc.id}`,
        tag: `Skenario ${sc.rank}`,
        label: sc.name,
        rows: scenarioRuns[sc.id],
        color: SCENARIO_COLORS[sc.id],
      })),
      ...snapshots.map((snap) => ({ key: `s${snap.id}`, tag: snap.tag, label: snap.label, rows: snap.rows, color: snap.color })),
    ],
    [compareIds, scenarioRuns, snapshots],
  );

  // Pengingat dokumentasi: aktif setelah ada perbandingan yang belum dicetak (Print PDF).
  const signature = JSON.stringify({ values, compareIds, snapshots: snapshots.map((snap) => snap.id) });
  const signatureRef = useRef(signature);
  useEffect(() => {
    signatureRef.current = signature;
  }, [signature]);
  const hasComparison = !sameValues(values, NO_POLICY) || compareIds.length > 0 || snapshots.length > 0;
  const markDocumented = useCallback(() => setDocumentedSig(signatureRef.current), []);

  // Baris tabel "Perbandingan hasil": setiap pembanding + simulasi saat ini, perubahan vs baseline pada `year`.
  const comparison = useMemo(() => {
    const base = rowAt(baseline, year);
    const runs = [
      ...references.map((r) => ({ key: r.key, title: r.tag, label: r.label, color: r.color, data: r.rows, current: false })),
      { key: "current", title: "Simulasi saat ini", label: describe(values), color: SIM_COLOR, data: rows, current: true },
    ].map((run) => {
      const row = rowAt(run.data, year);
      return { ...run, changes: Object.fromEntries(METRICS.map((m) => [m.key, pctChange(m.value(row), m.value(base))])) as Record<string, number> };
    });
    const best: Record<string, string> = {};
    for (const m of METRICS) {
      // Terbaik = tertinggi, kecuali indikator yang makin kecil makin baik (NCPR).
      const score = (r: (typeof runs)[number]) => (m.lowerIsBetter ? -r.changes[m.key] : r.changes[m.key]);
      const top = runs.reduce((a, b) => (score(b) > score(a) + 1e-9 ? b : a));
      // Tidak ditandai bila semua run sama (mis. luas lahan tanpa LP2B).
      if (runs.some((r) => Math.abs(r.changes[m.key] - top.changes[m.key]) > 0.0049)) best[m.key] = top.key;
    }
    return { rows: runs, best };
  }, [references, rows, baseline, year, values]);

  const toPoints = (data: DataRow[]) => data.map((r) => ({ x: num(r["Time"]), y: metric.value(r) }));
  const series = ready
    ? [
        ...(showBaseline ? [{ name: "Baseline", points: toPoints(baseline), lineColor: BASE_COLOR }] : []),
        ...references.map((r) => ({ name: `${r.tag} · ${r.label}`, points: toPoints(r.rows), lineColor: r.color })),
        { name: "Simulasi saat ini", points: toPoints(rows), lineColor: SIM_COLOR },
      ]
    : [];

  const tableYears = baseline.map((r) => num(r["Time"])).filter((y) => y >= FORECAST_START - 1);

  const saveSnapshot = () => {
    if (snapshots.length >= MAX_SNAPSHOTS) return;
    // Nomor P1–P3 dan warnanya dipakai ulang setelah pembanding dihapus.
    const slot = SNAPSHOT_COLORS.findIndex((c) => !snapshots.some((s) => s.color === c));
    snapshotId.current += 1;
    const snapshot = { id: snapshotId.current, tag: `P${slot + 1}`, label: describe(values), values, rows, color: SNAPSHOT_COLORS[slot] };
    setSnapshots((prev) => [...prev, snapshot].sort((a, b) => a.tag.localeCompare(b.tag)));
  };

  const exportIndicator = () => {
    exportCsv(
      `simulasi-${metric.key}.csv`,
      ["Tahun", "Baseline", ...references.map((r) => `${r.tag} · ${r.label}`), "Simulasi saat ini", "Perubahan vs baseline (%)"],
      baseline.map((b) => {
        const y = num(b["Time"]);
        const sim = metric.value(rowAt(rows, y));
        return [y, metric.value(b), ...references.map((r) => metric.value(rowAt(r.rows, y))), sim, pctChange(sim, metric.value(b)).toFixed(2)];
      }),
    );
  };

  const exportAll = () => {
    const columns = Object.keys(rows[0] ?? {}).filter((c) => c !== "Time");
    exportCsv(
      "simulasi-semua-variabel.csv",
      ["Tahun", ...columns],
      rows.map((r) => [num(r["Time"]), ...columns.map((c) => num(r[c]))]),
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="pt-2 text-center text-3xl font-bold text-lime-900 md:text-4xl">Simulasi Kebijakan Interaktif</h1>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Gagal memuat model: {error}</p>}

      <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* ===== 1. Input: simulasi bebas ===== */}
        <aside className="space-y-5 self-start rounded-2xl border border-lime-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <div className="flex items-start gap-2.5">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-lime-700 text-xs font-bold text-white">1</span>
            <div>
              <p className="font-semibold text-lime-950">Atur simulasi bebas</p>
              <p className="text-xs text-lime-900/60">Geser slider; hasil di kanan diperbarui langsung.</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-lime-700">Isi slider dari</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setValues(preset.values);
                    setLoadedPreset(preset.id);
                  }}
                  aria-pressed={activePreset === preset.id}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    activePreset === preset.id ? "bg-lime-700 text-white shadow-sm" : "bg-lime-100 text-lime-900 hover:bg-lime-200"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {loadedScenario && (
              <div className="mt-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
                <p>
                  {activePreset === loadedScenario.id ? "Slider memakai nilai" : "Slider diubah dari"}{" "}
                  <span className="font-semibold">
                    {loadedScenario.rank}. {loadedScenario.name}
                  </span>
                  . Ubah slider untuk mencoba variasinya, lalu bandingkan dengan skenario aslinya.
                </p>
                {compareIds.includes(loadedScenario.id) ? (
                  <p className="mt-2 font-semibold text-sky-800">✓ Skenario aslinya sudah menjadi pembanding.</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCompareIds((prev) => [...prev, loadedScenario.id])}
                    className="mt-2 w-full rounded-lg border border-sky-300 bg-white px-3 py-1.5 font-semibold text-sky-800 transition hover:bg-sky-100"
                  >
                    + Bandingkan dengan {loadedScenario.rank}. {loadedScenario.name}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-5 border-t border-lime-100 pt-4">
            {POLICY_ORDER.map((key) => (
              <PolicySlider key={key} policyKey={key} value={values[key]} onChange={(v) => setValues((prev) => ({ ...prev, [key]: v }))} />
            ))}
          </div>
        </aside>

        {/* ===== Hasil ===== */}
        <div className="min-w-0 space-y-6">
          {!ready && !error && <p className="text-sm text-lime-900/70">Memuat model…</p>}

          {ready && (
            <>
              {/* ===== 2. Pembanding: semua yang dibandingkan dengan simulasi bebas ===== */}
              <section className="space-y-3 rounded-2xl border border-lime-200 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-2.5">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-lime-700 text-xs font-bold text-white">2</span>
                  <div>
                    <p className="font-semibold text-lime-950">Pilih pembanding</p>
                    <p className="text-xs text-lime-900/60">
                      Yang dipilih tampil di grafik dan tabel bersama <span className="font-semibold text-lime-800">simulasi saat ini</span>.
                      Perubahan (%) selalu dihitung terhadap baseline.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBaseline((v) => !v)}
                    aria-pressed={showBaseline}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      showBaseline ? "border-gray-400 bg-gray-100 text-gray-800" : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: BASE_COLOR }} />
                    {showBaseline ? "✓ " : ""}Baseline
                  </button>
                  {SCENARIOS.map((sc) => {
                    const on = compareIds.includes(sc.id);
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => setCompareIds((prev) => (on ? prev.filter((id) => id !== sc.id) : [...prev, sc.id]))}
                        aria-pressed={on}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                          on ? "bg-white shadow-sm" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                        style={on ? { borderColor: SCENARIO_COLORS[sc.id], color: SCENARIO_COLORS[sc.id] } : undefined}
                      >
                        <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: SCENARIO_COLORS[sc.id] }} />
                        {on ? "✓ " : "+ "}
                        {sc.rank}. {sc.name}
                      </button>
                    );
                  })}
                  {snapshots.map((snap) => (
                    <span
                      key={snap.id}
                      className="inline-flex items-center gap-1.5 rounded-full border bg-white py-1 pl-3 pr-1 text-xs font-semibold shadow-sm"
                      style={{ borderColor: snap.color, color: snap.color }}
                      title={snap.label}
                    >
                      <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: snap.color }} />
                      {snap.tag}
                      <span className="max-w-40 truncate font-normal text-gray-600">{snap.label}</span>
                      <button
                        type="button"
                        onClick={() => setSnapshots((prev) => prev.filter((x) => x.id !== snap.id))}
                        className="rounded-full px-1.5 text-gray-400 hover:bg-red-50 hover:text-red-700"
                        aria-label={`Hapus pembanding ${snap.tag}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={saveSnapshot}
                    disabled={snapshots.length >= MAX_SNAPSHOTS}
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-lime-500 px-3 py-1 text-xs font-semibold text-lime-800 transition hover:bg-lime-50 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Simpan hasil slider saat ini sebagai pembanding, lalu ubah slider untuk mencoba kebijakan lain"
                  >
                    + Simpan simulasi saat ini {snapshots.length < MAX_SNAPSHOTS ? `sebagai P${SNAPSHOT_COLORS.findIndex((c) => !snapshots.some((snap) => snap.color === c)) + 1}` : `(maks. ${MAX_SNAPSHOTS})`}
                  </button>
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-lime-900">Dampak tahun {year}</h2>
                    <p className="text-xs text-lime-900/60">
                      Perubahan terhadap baseline. Klik kartu untuk menampilkannya di grafik.
                      {viewMode === "ringkas" && (
                        <>
                          {" "}
                          <button type="button" onClick={() => setViewMode("lengkap")} className="font-semibold text-lime-700 underline-offset-2 hover:underline">
                            Tampilkan {cards.length - KEY_CARDS.length} indikator lain
                          </button>
                        </>
                      )}
                    </p>
                  </div>
                  <label className="flex items-center gap-3 text-sm text-lime-900">
                    Tahun
                    <input
                      type="range"
                      min={FORECAST_START}
                      max={FINAL_YEAR}
                      step={1}
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-40 accent-lime-700"
                      aria-label="Tahun indikator"
                    />
                    <span className="w-10 font-bold tabular-nums">{year}</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                  {cards.filter(({ metric: m }) => viewMode === "lengkap" || KEY_CARDS.includes(m.key)).map(({ metric: m, value, change }) => {
                    const active = m.key === metricKey;
                    const tone = changeTone(change, m.lowerIsBetter);
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setMetricKey(m.key)}
                        aria-pressed={active}
                        className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-lime-400 ${
                          active ? "border-lime-500 ring-2 ring-lime-300" : "border-lime-200"
                        }`}
                      >
                        <p className="text-xs text-lime-900/60">{m.label}</p>
                        <p className={`mt-1 text-xl font-bold tabular-nums ${tone}`}>{formatPct(change)}</p>
                        <p className="mt-0.5 truncate text-xs tabular-nums text-lime-900/70">
                          {formatValue(value)} <span className="text-lime-900/40">{m.unit}</span>
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>

              <AnalysisDetail title="Tabel perbandingan semua indikator" description="Perubahan kedelapan indikator untuk setiap pembanding dan simulasi saat ini.">
              <section className="space-y-3 rounded-2xl border border-lime-200 bg-white p-5 shadow-sm">
                <div>
                  <h2 className="text-lg font-semibold text-lime-900">Perbandingan hasil tahun {year}</h2>
                  <p className="text-xs text-lime-900/60">
                    Perubahan terhadap baseline untuk setiap pembanding yang disimpan dan simulasi saat ini. Nilai terbaik di tiap kolom
                    ditebalkan (tertinggi; untuk NCPR terendah).
                  </p>
                </div>
                {references.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-lime-300 bg-lime-50 px-4 py-3 text-sm text-lime-900/70">
                    Belum ada pembanding. Pilih skenario di <span className="font-semibold">Pilih pembanding</span>, atau klik{" "}
                    <span className="font-semibold">Simpan simulasi saat ini</span> lalu ubah slider.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-lime-200 bg-lime-50 text-xs uppercase text-lime-800">
                          <th className="px-3 py-2 text-left">Run</th>
                          {METRICS.map((m) => (
                            <th key={m.key} className="whitespace-nowrap px-3 py-2 text-right">
                              {m.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {comparison.rows.map((run) => (
                          <tr key={run.key} className={`border-b border-lime-100 last:border-none ${run.current ? "bg-lime-50/60" : ""}`}>
                            <td className="min-w-[200px] px-3 py-2">
                              <p className="flex items-center gap-2 font-semibold text-lime-950">
                                <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: run.color }} />
                                {run.title}
                              </p>
                              <p className="text-xs text-lime-900/60">{run.label}</p>
                            </td>
                            {METRICS.map((m) => {
                              const change = run.changes[m.key];
                              const tone = changeTone(change, m.lowerIsBetter);
                              const best = comparison.best[m.key] === run.key;
                              return (
                                <td key={m.key} className={`px-3 py-2 text-right tabular-nums ${tone} ${best ? "font-bold underline decoration-2 underline-offset-4" : ""}`}>
                                  {formatPct(change)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
              </AnalysisDetail>

              <section className="space-y-3 rounded-2xl border border-lime-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-lime-900">{metric.label}</h2>
                  <select
                    className="rounded-lg border border-lime-300 bg-white px-3 py-1.5 text-sm"
                    value={metricKey}
                    onChange={(e) => setMetricKey(e.target.value)}
                    aria-label="Pilih indikator grafik"
                  >
                    {METRICS.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rounded-xl border border-lime-200 bg-lime-50 p-3">
                  <Chart
                    title={metric.label}
                    yAxisLabel={metric.unit}
                    points={series[0]?.points ?? []}
                    series={series}
                    valueFormatter={formatValue}
                    xFormatter={(value) => String(value)}
                  />
                </div>
              </section>

              <AnalysisDetail title="Tabel per tahun" description="Nilai indikator terpilih tiap tahun untuk baseline, pembanding, dan simulasi saat ini, dapat diekspor ke CSV.">
              <section className="space-y-3 rounded-2xl border border-lime-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-lime-900">Tabel {metric.label}</h2>
                    <p className="text-xs text-lime-900/60">{describe(values)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={exportIndicator}
                      className="rounded-lg border border-lime-700 bg-white px-3 py-1.5 text-xs font-semibold text-lime-700 transition hover:bg-lime-50"
                    >
                      Export indikator (CSV)
                    </button>
                    <button
                      type="button"
                      onClick={exportAll}
                      className="rounded-lg bg-lime-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-lime-800"
                    >
                      Export semua variabel (CSV)
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-lime-200 bg-lime-50 text-xs uppercase text-lime-800">
                        <th className="px-3 py-2 text-left">Tahun</th>
                        <th className="px-3 py-2 text-right">Baseline</th>
                        {references.map((r) => (
                          <th key={r.key} className="max-w-40 truncate px-3 py-2 text-right" title={`${r.tag} · ${r.label}`}>
                            <span className="mr-1 inline-block h-0.5 w-3 align-middle" style={{ backgroundColor: r.color }} />
                            {r.tag}
                          </th>
                        ))}
                        <th className="px-3 py-2 text-right">Simulasi</th>
                        <th className="px-3 py-2 text-right">Perubahan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableYears.map((y) => {
                        const b = metric.value(rowAt(baseline, y));
                        const s = metric.value(rowAt(rows, y));
                        const change = pctChange(s, b);
                        return (
                          <tr key={y} className={`border-b border-lime-100 last:border-none ${y === year ? "bg-yellow-50" : ""}`}>
                            <td className="px-3 py-2 font-medium text-lime-900">{y}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-lime-900/70">{formatValue(b)}</td>
                            {references.map((r) => (
                              <td key={r.key} className="px-3 py-2 text-right tabular-nums text-lime-900/70">
                                {formatValue(metric.value(rowAt(r.rows, y)))}
                              </td>
                            ))}
                            <td className="px-3 py-2 text-right font-semibold tabular-nums text-lime-950">{formatValue(s)}</td>
                            <td
                              className={`px-3 py-2 text-right font-semibold tabular-nums ${
                                changeTone(change, metric.lowerIsBetter)
                              }`}
                            >
                              {formatPct(change)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
              </AnalysisDetail>

              <ModelPrintNotice onPrint={() => window.print()} />
            </>
          )}
          <LeaveGuard active={ready && hasComparison && signature !== documentedSig} onDocumented={markDocumented} />
        </div>
      </div>
    </div>
  );
}
