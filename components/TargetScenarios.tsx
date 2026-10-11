"use client";

// Skenario berbasis target (tahap 5 bagian kedua): kombinasi kebijakan dengan intervensi terkecil yang cukup
// mencapai target produksi Renstra Dinas Tanaman Pangan dan Hortikultura Provinsi Jawa Barat 2025–2029.
import Chart from "@/components/Chart";
import Reveal from "@/components/Reveal";
import {
  NO_POLICY,
  POLICIES,
  POLICY_ORDER,
  PRODUCTION_TARGET,
  TARGET_GROWTH_PCT,
  TARGET_SCENARIOS,
  exportCsv,
  formatPct,
  num,
  productionTarget,
  rowAt,
  totalProduction,
  type DataRow,
  type PolicyKey,
  type PolicyValues,
} from "@/lib/policies";

const BASE_COLOR = "#9ca3af";
const TARGET_COLOR = "#dc2626";
const { baseYear, targetYear } = PRODUCTION_TARGET;

const ton = (v: number) => `${Math.round(v).toLocaleString("id-ID")} ton`;
const jutaTon = (v: number) => (v / 1_000_000).toLocaleString("id-ID", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

/** Nilai kebijakan seperti di Tabel skripsi: "–" bila tidak dijalankan. */
function policyText(key: PolicyKey, value: number): string {
  if (value === 0) return "–";
  const v = value.toLocaleString("id-ID");
  if (key === "lp2b") return `${v}%`;
  if (key === "irigasi") return `${v}%/th`;
  return `+${v}%`;
}

type Run = { id: string; code: string; name: string; tagline?: string; description?: string; values: PolicyValues; color: string; rows: DataRow[] };

export default function TargetScenarios({ baseline, results }: { baseline: DataRow[]; results: Record<string, DataRow[]> }) {
  const target = productionTarget(baseline);
  const base2024 = totalProduction(rowAt(baseline, baseYear));

  const runs: Run[] = [
    { id: "baseline", code: "Baseline", name: "Tanpa kebijakan", values: NO_POLICY, color: BASE_COLOR, rows: baseline },
    ...TARGET_SCENARIOS.map((s) => ({ ...s, rows: results[s.id] ?? [] })),
  ];
  const stats = runs.map((r) => {
    const value = totalProduction(rowAt(r.rows, targetYear));
    return { ...r, value, growth: (value / base2024 - 1) * 100, gap: value - target, reached: value >= target };
  });
  const scenarios = stats.filter((s) => s.id !== "baseline");
  const baselineStat = stats[0];
  const maxGrowth = Math.max(TARGET_GROWTH_PCT, ...stats.map((s) => s.growth)) * 1.12;

  const chartYears = baseline.map((r) => num(r["Time"])).filter((y) => y >= baseYear);
  const series = [
    ...stats.map((s) => ({
      name: s.id === "baseline" ? "Baseline" : `${s.code} · ${s.name}`,
      points: chartYears.map((y) => ({ x: y, y: totalProduction(rowAt(s.rows, y)) / 1_000_000 })),
      lineColor: s.color,
    })),
    { name: `Target ${targetYear}`, points: chartYears.map((y) => ({ x: y, y: target / 1_000_000 })), lineColor: TARGET_COLOR, dashed: true },
  ];

  const exportTable = () =>
    exportCsv(
      "skenario-berbasis-target.csv",
      [
        "Skenario",
        ...POLICY_ORDER.map((k) => `${POLICIES[k].label} (${POLICIES[k].unit})`),
        `Produksi total ${targetYear} (ton)`,
        `Kenaikan terhadap ${baseYear} (%)`,
        `Selisih terhadap target (ton)`,
        "Mencapai target",
      ],
      stats.map((s) => [
        s.code,
        ...POLICY_ORDER.map((k) => s.values[k]),
        Math.round(s.value),
        s.growth.toFixed(2),
        Math.round(s.gap),
        s.reached ? "Ya" : "Tidak",
      ]),
    );

  return (
    <div className="space-y-6">
      {/* Pengantar */}
      <Reveal>
        <section className="rounded-3xl border border-lime-200 bg-white p-5 shadow-sm md:p-7">
          <p className="text-xs font-semibold uppercase tracking-wide text-lime-700">Skenario berbasis target</p>
          <h2 className="mt-1 text-2xl font-bold text-lime-900">Intervensi terkecil untuk mencapai target daerah</h2>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-lime-900/75">
            Berbeda dari skenario terbaik, skenario ini mencari <strong>kombinasi kebijakan dengan intervensi terkecil</strong> yang cukup untuk
            mencapai target produksi pemerintah daerah dalam {PRODUCTION_TARGET.source}.
          </p>

          {/* Penurunan target: Renstra -> model tujuh komoditas */}
          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">Target Renstra</p>
              <p className="mt-0.5 text-xs text-amber-900/70">Produksi tanaman pangan dan hortikultura</p>
              <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
                <div>
                  <p className="text-[11px] text-amber-900/60">{baseYear}</p>
                  <p className="font-semibold tabular-nums text-amber-950">{ton(PRODUCTION_TARGET.renstraBase)}</p>
                </div>
                <span className="pb-0.5 text-amber-700" aria-hidden="true">→</span>
                <div>
                  <p className="text-[11px] text-amber-900/60">{targetYear}</p>
                  <p className="font-semibold tabular-nums text-amber-950">{ton(PRODUCTION_TARGET.renstraTarget)}</p>
                </div>
              </div>
              <p className="mt-3 inline-flex rounded-full bg-amber-200/70 px-2.5 py-0.5 text-sm font-bold text-amber-900">
                naik {formatPct(TARGET_GROWTH_PCT).replace("+", "")}
              </p>
            </div>

            <div className="flex items-center justify-center text-center text-xs text-lime-900/60 md:w-40">
              <p>
                <span className="block text-2xl text-lime-700" aria-hidden="true">
                  ⇢
                </span>
                diterapkan sebagai kenaikan relatif ke 7 komoditas model
              </p>
            </div>

            <div className="rounded-2xl border border-lime-300 bg-lime-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-lime-800">Target di model</p>
              <p className="mt-0.5 text-xs text-lime-900/70">Produksi total tujuh komoditas tanaman pangan</p>
              <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
                <div>
                  <p className="text-[11px] text-lime-900/60">{baseYear}</p>
                  <p className="font-semibold tabular-nums text-lime-950">{jutaTon(base2024)} juta ton</p>
                </div>
                <span className="pb-0.5 text-lime-700" aria-hidden="true">→</span>
                <div>
                  <p className="text-[11px] text-lime-900/60">{targetYear}</p>
                  <p className="font-semibold tabular-nums text-lime-950">≥ {jutaTon(target)} juta ton</p>
                </div>
              </div>
              <p className="mt-3 inline-flex rounded-full bg-lime-700 px-2.5 py-0.5 text-sm font-bold text-white">target minimum</p>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Kartu skenario */}
      <div className="grid gap-4 lg:grid-cols-3">
        {scenarios.map((s, i) => (
          <Reveal key={s.id} delay={i * 60}>
            <div className="card-hover flex h-full flex-col gap-3 rounded-2xl border border-lime-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: s.color }}>
                    Skenario {s.code}
                  </p>
                  <h3 className="text-lg font-bold text-lime-950">{s.name}</h3>
                  <p className="text-xs text-lime-900/60">{s.tagline}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    s.reached ? "border-lime-300 bg-lime-100 text-lime-800" : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {s.reached ? "✓ Target tercapai" : "✗ Belum tercapai"}
                </span>
              </div>

              <dl className="grid grid-cols-4 gap-1.5 text-center">
                {POLICY_ORDER.map((k) => {
                  const on = s.values[k] !== 0;
                  return (
                    <div key={k} className={`rounded-lg border px-1 py-1.5 ${on ? "border-lime-200 bg-lime-50" : "border-dashed border-gray-200 bg-white"}`}>
                      <dt className="text-[10px] font-semibold uppercase text-lime-900/55">{POLICIES[k].label}</dt>
                      <dd className={`text-xs font-bold tabular-nums ${on ? "text-lime-900" : "text-gray-400"}`}>{policyText(k, s.values[k])}</dd>
                    </div>
                  );
                })}
              </dl>

              <p className="text-sm text-lime-900/75">{s.description}</p>

              <div className="mt-auto grid grid-cols-2 gap-3 border-t border-lime-100 pt-3">
                <div>
                  <p className="text-xs text-lime-900/60">Produksi total {targetYear}</p>
                  <p className="font-bold tabular-nums text-lime-950">{jutaTon(s.value)} juta ton</p>
                </div>
                <div>
                  <p className="text-xs text-lime-900/60">Kenaikan dari {baseYear}</p>
                  <p className="font-bold tabular-nums text-lime-700">{formatPct(s.growth)}</p>
                </div>
              </div>
              <p className="text-xs text-lime-900/60">
                {s.reached ? "Di atas" : "Di bawah"} target sebesar{" "}
                <span className="font-semibold text-lime-900">{Math.abs(Math.round(s.gap / 1000)).toLocaleString("id-ID")} ribu ton</span>
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Capaian terhadap target */}
      <Reveal>
        <section className="space-y-4 rounded-2xl border border-lime-200 bg-white p-5 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-lime-900">Capaian terhadap target</h3>
            <p className="text-sm text-lime-900/70">
              Kenaikan produksi total {baseYear}–{targetYear}. Garis merah adalah target kenaikan {formatPct(TARGET_GROWTH_PCT).replace("+", "")}.
            </p>
          </div>
          <div className="space-y-4">
            {stats.map((s) => (
              <div key={s.id} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold" style={{ color: s.id === "baseline" ? "#4b5563" : s.color }}>
                    {s.code}
                    <span className="font-normal text-lime-900/60"> · {s.id === "baseline" ? "tanpa kebijakan" : s.name}</span>
                  </p>
                  <p className={`shrink-0 text-sm font-bold tabular-nums ${s.reached ? "text-lime-700" : "text-red-700"}`}>{formatPct(s.growth)}</p>
                </div>
                <div className="relative h-5 rounded-full bg-lime-50">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(Math.max(0, s.growth) / maxGrowth) * 100}%`, backgroundColor: s.color }} />
                  <div
                    className="absolute -top-1 -bottom-1 w-0.5 rounded bg-red-600"
                    style={{ left: `${(TARGET_GROWTH_PCT / maxGrowth) * 100}%` }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-lime-900/60">
            Tanpa kebijakan, produksi hanya naik {formatPct(baselineStat.growth).replace("+", "")}, sehingga target belum tercapai.
          </p>
        </section>
      </Reveal>

      {/* Grafik */}
      <Reveal>
        <section className="space-y-4 rounded-2xl border border-lime-200 bg-white p-5 shadow-sm">
          <div>
            <h3 className="text-lg font-semibold text-lime-900">Produksi total tujuh komoditas</h3>
            <p className="text-sm text-lime-900/70">
              {baseYear}–{num(chartYears.at(-1))}, dibandingkan dengan target {targetYear} (garis putus-putus).
            </p>
          </div>
          <div className="rounded-xl border border-lime-200 bg-lime-50 p-3">
            <Chart
              title="Produksi total tujuh komoditas"
              yAxisLabel="juta ton"
              points={series[0].points}
              series={series}
              valueFormatter={(v) => v.toLocaleString("id-ID", { maximumFractionDigits: 3 })}
              xFormatter={(v) => String(v)}
            />
          </div>
        </section>
      </Reveal>

      {/* Tabel seperti di skripsi */}
      <Reveal>
        <section className="space-y-4 rounded-2xl border border-lime-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-lime-900">Tiga skenario berbasis target</h3>
              <p className="text-sm text-lime-900/70">Nilai kebijakan dan hasil produksi total {targetYear}.</p>
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
                  <th className="px-3 py-2 text-left">Skenario</th>
                  <th className="px-3 py-2 text-right">LP2B</th>
                  <th className="px-3 py-2 text-right">Subsidi pupuk</th>
                  <th className="px-3 py-2 text-right">Irigasi</th>
                  <th className="px-3 py-2 text-right">Belanja pemerintah</th>
                  <th className="px-3 py-2 text-right">Produksi total {targetYear} (juta ton)</th>
                  <th className="px-3 py-2 text-right">Kenaikan terhadap {baseYear}</th>
                  <th className="px-3 py-2 text-left">Target</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s) => (
                  <tr key={s.id} className="border-b border-lime-100 last:border-none">
                    <td className="px-3 py-2.5 font-semibold" style={{ color: s.id === "baseline" ? "#4b5563" : s.color }}>
                      {s.code}
                    </td>
                    {(["lp2b", "subsidi", "irigasi", "rab"] as PolicyKey[]).map((k) => (
                      <td key={k} className="px-3 py-2.5 text-right tabular-nums text-lime-900">
                        {policyText(k, s.values[k])}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-lime-950">{jutaTon(s.value)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-lime-700">{formatPct(s.growth)}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs font-semibold ${s.reached ? "text-lime-700" : "text-red-700"}`}>{s.reached ? "✓ Tercapai" : "✗ Belum"}</span>
                    </td>
                  </tr>
                ))}
                <tr className="bg-red-50/50 text-red-800">
                  <td className="px-3 py-2.5 font-semibold">Target</td>
                  <td colSpan={4} />
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums">≥ {jutaTon(target)}</td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{formatPct(TARGET_GROWTH_PCT)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
