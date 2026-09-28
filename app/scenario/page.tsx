"use client";

import { useEffect, useMemo, useState } from "react";
import initModel from "@/lib/sfd-model-fix-2.js";
import { runSimulation } from "@/lib/engine";
import { buildModelFunctions } from "@/lib/modelFunctions";
import Chart from "@/components/Chart";
import ModelPrintNotice from "@/components/ModelPrintNotice";
import Reveal from "@/components/Reveal";
import NextStep from "@/components/NextStep";
import AnalysisDetail from "@/components/AnalysisDetail";
import { useViewMode } from "@/lib/viewMode";

import {
  FINAL_YEAR,
  FORECAST_START,
  METRICS as ALL_METRICS,
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
  type Scenario,
} from "@/lib/policies";

// Kolom sama dengan tabel analisis kombinasi kebijakan.
const METRICS = ALL_METRICS;

const HIGHLIGHT_KEYS = ["padi", "pph", "ntp", "pdrb"];
// Mode Ringkas: angka kunci yang mudah dipahami pengguna awam.
const HIGHLIGHT_KEYS_RINGKAS = ["padi", "ntp"];

function PolicyChips({ scenario }: { scenario: Scenario }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {POLICY_ORDER.map((key) => {
        const on = scenario.policies.includes(key);
        return (
          <span
            key={key}
            title={on ? POLICIES[key].detail(POLICIES[key].high) : `${POLICIES[key].label} tidak dijalankan`}
            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
              on ? "border-lime-300 bg-lime-100 text-lime-800" : "border-dashed border-gray-300 bg-white text-gray-400 line-through"
            }`}
          >
            {POLICIES[key].label}
          </span>
        );
      })}
    </div>
  );
}

function ChangeValue({ value, lowerIsBetter = false }: { value: number; lowerIsBetter?: boolean }) {
  return <span className={`font-semibold tabular-nums ${changeTone(value, lowerIsBetter)}`}>{formatPct(value)}</span>;
}

export default function ScenarioPage() {
  const viewMode = useViewMode();
  const [baseline, setBaseline] = useState<DataRow[]>([]);
  const [results, setResults] = useState<Record<string, DataRow[]>>({});
  const [error, setError] = useState("");
  const [selectedMetric, setSelectedMetric] = useState(METRICS[0].key);
  // Skenario yang ditampilkan di grafik (bisa 1, 2, atau 3), plus garis baseline.
  const [shown, setShown] = useState<string[]>(SCENARIOS.map((sc) => sc.id));
  const [showBaseline, setShowBaseline] = useState(true);
  const allShown = shown.length === SCENARIOS.length && showBaseline;
  const toggleShown = (id: string) => setShown((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // Jalankan baseline dan ketiga skenario sekali saat halaman dibuka.
  useEffect(() => {
    const run = async () => {
      try {
        const model = await initModel();
        model.setModelFunctions(buildModelFunctions());
        const base = runSimulation(model) as unknown as DataRow[];
        const next: Record<string, DataRow[]> = {};
        for (const scenario of SCENARIOS) {
          next[scenario.id] = runSimulation(model, { constants: toModelConstants(scenarioValues(scenario)) }) as unknown as DataRow[];
        }
        setBaseline(base);
        setResults(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menjalankan model.");
      }
    };
    void run();
  }, []);

  const ready = baseline.length > 0 && Object.keys(results).length === SCENARIOS.length;

  // Perubahan terhadap baseline: nilai tahun 2035 dan rata-rata 2026-2035.
  const summary = useMemo(() => {
    if (!ready) return {} as Record<string, Record<string, { final: number; average: number }>>;
    const out: Record<string, Record<string, { final: number; average: number }>> = {};
    for (const scenario of SCENARIOS) {
      const rows = results[scenario.id];
      out[scenario.id] = {};
      for (const metric of METRICS) {
        const final = pctChange(metric.value(rowAt(rows, FINAL_YEAR)), metric.value(rowAt(baseline, FINAL_YEAR)));
        let sum = 0;
        for (let year = FORECAST_START; year <= FINAL_YEAR; year += 1) {
          sum += pctChange(metric.value(rowAt(rows, year)), metric.value(rowAt(baseline, year)));
        }
        out[scenario.id][metric.key] = { final, average: sum / (FINAL_YEAR - FORECAST_START + 1) };
      }
    }
    return out;
  }, [ready, results, baseline]);

  const metric = METRICS.find((m) => m.key === selectedMetric) ?? METRICS[0];
  const toPoints = (rows: DataRow[]) => rows.map((r) => ({ x: num(r["Time"]), y: metric.value(r) }));
  const chartSeries = ready
    ? [
        ...(showBaseline ? [{ name: "Baseline", points: toPoints(baseline), lineColor: "#9ca3af" }] : []),
        ...SCENARIOS.filter((s) => shown.includes(s.id)).map((s) => ({
          name: `${s.rank}. ${s.name}`,
          points: toPoints(results[s.id]),
          lineColor: s.color,
        })),
      ]
    : [];

  const exportTable = () => {
    const header = [
      "Peringkat",
      "Skenario",
      "Kombinasi",
      ...METRICS.map((m) => `${m.label} ${FINAL_YEAR} (%)`),
      ...METRICS.filter((m) => m.average).map((m) => `Rata-rata ${FORECAST_START}-${FINAL_YEAR}: ${m.label} (%)`),
    ];
    const lines = SCENARIOS.map((s) => [
      s.rank,
      s.name,
      s.policies.map((p) => POLICIES[p].label).join(" + "),
      ...METRICS.map((m) => summary[s.id][m.key].final.toFixed(2)),
      ...METRICS.filter((m) => m.average).map((m) => summary[s.id][m.key].average.toFixed(2)),
    ]);
    exportCsv("skenario-terbaik.csv", header, lines);
  };

  const exportSeries = () => {
    const visibleScenarios = SCENARIOS.filter((s) => shown.includes(s.id));
    const header = ["Tahun", "Baseline", ...visibleScenarios.map((s) => `${s.rank}. ${s.name}`)];
    const lines = baseline.map((row) => {
      const year = num(row["Time"]);
      return [year, metric.value(row), ...visibleScenarios.map((s) => metric.value(rowAt(results[s.id], year)))];
    });
    exportCsv(`skenario-${metric.key}.csv`, header, lines);
  };

  return (
    <div className="space-y-6">
      <Reveal>
        <section className="rounded-3xl border border-lime-200 bg-white p-5 shadow-sm md:p-7">
          <p className="text-xs uppercase tracking-wide text-lime-700">Tahap 5 · Skenario kebijakan</p>
          <h1 className="mt-1 text-2xl font-bold text-lime-900 md:text-3xl">Tiga Skenario Terbaik</h1>
          <p className="mt-2 max-w-3xl text-sm text-lime-900/75">
            Hasil analisis kombinasi empat kebijakan pada tingkat tinggi. Setiap skenario dijalankan dengan model yang sama, mulai
            berlaku tahun {FORECAST_START}, lalu dibandingkan dengan baseline (tanpa kebijakan) pada tahun {FINAL_YEAR}.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {POLICY_ORDER.map((key) => (
              <div key={key} className="rounded-xl border border-lime-100 bg-lime-50 px-3 py-2">
                <p className="text-xs font-semibold text-lime-800">{POLICIES[key].label}</p>
                <p className="text-sm text-lime-900">{POLICIES[key].detail(POLICIES[key].high)}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Gagal menjalankan model: {error}</p>}
      {!ready && !error && <p className="text-sm text-lime-900/70">Menjalankan model untuk baseline dan tiga skenario…</p>}

      {ready && (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            {SCENARIOS.map((scenario) => {
              const active = shown.includes(scenario.id);
              return (
                <Reveal key={scenario.id} delay={(scenario.rank - 1) * 60}>
                  <div
                    className={`card-hover flex h-full w-full flex-col gap-3 rounded-2xl border bg-white p-5 text-left shadow-sm transition ${
                      active ? "border-lime-200" : "border-dashed border-gray-300 opacity-70"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: scenario.color }}>
                          Peringkat {scenario.rank}
                        </p>
                        <h2 className="text-lg font-bold text-lime-950">{scenario.name}</h2>
                        <p className="text-xs text-lime-900/60">{scenario.tagline}</p>
                      </div>
                      <span className="mt-1 h-1 w-8 shrink-0 rounded-full" style={{ backgroundColor: scenario.color }} />
                    </div>
                    <PolicyChips scenario={scenario} />
                    <p className="text-sm text-lime-900/75">{scenario.description}</p>
                    <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-2 border-t border-lime-100 pt-3">
                      {METRICS.filter((m) => (viewMode === "lengkap" ? HIGHLIGHT_KEYS : HIGHLIGHT_KEYS_RINGKAS).includes(m.key)).map((m) => (
                        <div key={m.key}>
                          <dt className="text-xs text-lime-900/60">{m.label}</dt>
                          <dd className="text-base">
                            <ChangeValue value={summary[scenario.id][m.key].final} lowerIsBetter={m.lowerIsBetter} />
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-lime-900/50">Perubahan {FINAL_YEAR} vs baseline</p>
                      <button
                        type="button"
                        onClick={() => toggleShown(scenario.id)}
                        aria-pressed={active}
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                          active ? "border-lime-300 bg-lime-50 text-lime-800 hover:bg-lime-100" : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {active ? "✓ Tampil di grafik" : "+ Tampilkan di grafik"}
                      </button>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal>
            <section className="space-y-4 rounded-2xl border border-lime-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-lime-900">Grafik Skenario vs Baseline</h3>
                  <p className="text-sm text-lime-900/70">Kebijakan mulai berlaku tahun {FORECAST_START}. Pilih skenario yang ingin dibandingkan.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="rounded-lg border border-lime-300 bg-white px-3 py-1.5 text-sm"
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value)}
                    aria-label="Pilih variabel grafik skenario"
                  >
                    {METRICS.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={exportSeries}
                    className="rounded-lg border border-lime-700 bg-white px-3 py-1.5 text-xs font-semibold text-lime-700 transition hover:bg-lime-50"
                  >
                    Export CSV
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-sm font-semibold text-lime-900">Tampilkan:</span>
                <button
                  type="button"
                  onClick={() => setShowBaseline((v) => !v)}
                  aria-pressed={showBaseline}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    showBaseline ? "border-gray-400 bg-gray-100 text-gray-800" : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="h-0.5 w-3 rounded-full bg-gray-400" />
                  {showBaseline ? "✓ " : ""}Baseline
                </button>
                {SCENARIOS.map((sc) => {
                  const on = shown.includes(sc.id);
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={() => toggleShown(sc.id)}
                      aria-pressed={on}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                        on ? "bg-white shadow-sm" : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                      }`}
                      style={on ? { borderColor: sc.color, color: sc.color } : undefined}
                    >
                      <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: sc.color }} />
                      {on ? "✓ " : ""}
                      {sc.rank}. {sc.name}
                    </button>
                  );
                })}
                {!allShown && (
                  <button
                    type="button"
                    onClick={() => {
                      setShown(SCENARIOS.map((sc) => sc.id));
                      setShowBaseline(true);
                    }}
                    className="rounded-full px-3 py-1 text-xs font-semibold text-lime-700 underline-offset-2 hover:underline"
                  >
                    Tampilkan semua
                  </button>
                )}
              </div>
              {chartSeries.length === 0 ? (
                <p className="rounded-xl border border-dashed border-lime-300 bg-lime-50 px-4 py-8 text-center text-sm text-lime-900/70">
                  Pilih minimal satu garis untuk ditampilkan.
                </p>
              ) : (
              <div className="rounded-xl border border-lime-200 bg-lime-50 p-3">
                <Chart
                  title={metric.label}
                  yAxisLabel={metric.unit}
                  points={chartSeries[0]?.points ?? []}
                  series={chartSeries}
                  valueFormatter={formatValue}
                  xFormatter={(value) => String(value)}
                />
              </div>
              )}
            </section>
          </Reveal>

          <Reveal>
            <AnalysisDetail title="Tabel perbandingan lengkap" description="Perubahan semua indikator tahun 2035 dan rata-rata 2026–2035 untuk ketiga skenario, dapat diekspor ke CSV.">
            <section className="space-y-4 rounded-2xl border border-lime-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-lime-900">Perbandingan terhadap Baseline</h3>
                  <p className="text-sm text-lime-900/70">
                    Persentase perubahan tahun {FINAL_YEAR} dan rata-rata {FORECAST_START}–{FINAL_YEAR} dibanding baseline.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={exportTable}
                  className="self-start rounded-lg bg-lime-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-lime-800 md:self-auto"
                >
                  Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-lime-200 bg-lime-50 text-xs uppercase text-lime-800">
                      <th className="px-3 py-2 text-left">#</th>
                      <th className="px-3 py-2 text-left">Skenario</th>
                      {METRICS.map((m) => (
                        <th key={m.key} className="whitespace-nowrap px-3 py-2 text-right">
                          {m.label}
                        </th>
                      ))}
                      {METRICS.filter((m) => m.average).map((m) => (
                        <th key={`avg-${m.key}`} className="whitespace-nowrap border-l border-lime-200 px-3 py-2 text-right">
                          Rata-rata: {m.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SCENARIOS.map((s) => (
                      <tr key={s.id} className="border-b border-lime-100 last:border-none">
                        <td className="px-3 py-2.5 font-semibold" style={{ color: s.color }}>
                          {s.rank}
                        </td>
                        <td className="min-w-[220px] px-3 py-2.5">
                          <p className="font-semibold text-lime-950">{s.name}</p>
                          <p className="text-xs text-lime-900/60">{s.policies.map((p) => POLICIES[p].label).join(" + ")}</p>
                        </td>
                        {METRICS.map((m) => (
                          <td key={m.key} className="px-3 py-2.5 text-right">
                            <ChangeValue value={summary[s.id][m.key].final} lowerIsBetter={m.lowerIsBetter} />
                          </td>
                        ))}
                        {METRICS.filter((m) => m.average).map((m) => (
                          <td key={`avg-${m.key}`} className="border-l border-lime-100 px-3 py-2.5 text-right">
                            <ChangeValue value={summary[s.id][m.key].average} lowerIsBetter={m.lowerIsBetter} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            </AnalysisDetail>
          </Reveal>

          <Reveal>
            <ModelPrintNotice onPrint={() => window.print()} />
          </Reveal>

          <Reveal>
            <NextStep current={5} />
          </Reveal>
        </>
      )}
    </div>
  );
}
