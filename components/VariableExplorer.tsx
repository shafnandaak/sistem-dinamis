"use client";

import { Fragment, useMemo, useState } from "react";
import Chart from "@/components/Chart";
import { BASELINE_YEARS, mapeCategory } from "@/lib/historicalActuals";
import {
  DERIVED_VALIDATIONS,
  FUNGSI_LABEL,
  SUBSISTEMS,
  SUBSISTEM_LABEL,
  actualFor,
  describeVariables,
  lookupPoints,
  type ActualData,
  type Fungsi,
  type Subsistem,
} from "@/lib/modelVariables";
import { exportCsv, formatValue } from "@/lib/policies";

// Satu tempat untuk semua variabel model pada periode baseline, dikelompokkan menurut subsistem dan fungsi
// (endogen / lookup / parameter). Variabel dengan data aktual menampilkan nilai aktual, APE, dan MAPE.

type DataRow = Record<string, number | string | null | undefined>;

type Item = {
  name: string;
  fungsi: Fungsi;
  subsistem: Subsistem;
  jenis: string;
  unit: string;
  equation: string;
  doc: string;
  model: (number | null)[];
  actual: ActualData | null;
  ape: (number | null)[];
  mape: number | null;
};

const FUNGSI_ORDER: Fungsi[] = ["endogen", "lookup", "parameter"];
const FUNGSI_STYLE: Record<Fungsi, string> = {
  endogen: "bg-lime-100 text-lime-800",
  lookup: "bg-sky-100 text-sky-800",
  parameter: "bg-amber-100 text-amber-800",
};
const FUNGSI_DESC: Record<Fungsi, string> = {
  endogen: "dihitung model dari variabel lain (stok, aliran, variabel bantu)",
  lookup: "data historis per tahun yang dibaca model",
  parameter: "nilai tetap sepanjang simulasi (konstanta)",
};

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Nilai kecil ditampilkan dengan 4 angka penting agar tidak terpotong (mis. 0,0634). */
function formatCell(value: number): string {
  if (value !== 0 && Math.abs(value) < 1) return value.toLocaleString("id-ID", { maximumSignificantDigits: 4 });
  return formatValue(value);
}

function withApe(base: Omit<Item, "ape" | "mape">): Item {
  const ape = BASELINE_YEARS.map((_, i) => {
    const a = base.actual?.values[i] ?? null;
    const m = base.model[i];
    return a !== null && m !== null && a !== 0 ? (Math.abs(m - a) / Math.abs(a)) * 100 : null;
  });
  const valid = ape.filter((v): v is number => v !== null);
  return { ...base, ape, mape: valid.length ? valid.reduce((s, v) => s + v, 0) / valid.length : null };
}

function buildItems(rows: DataRow[]): Item[] {
  const at = (year: number) => rows.find((r) => Number(r["Time"]) === year) ?? {};
  const items = describeVariables(Object.keys(rows[0] ?? {})).map((v) => {
    const points = v.jenis === "Tabel lookup" ? lookupPoints(v.equation) : null;
    return withApe({
      ...v,
      model: BASELINE_YEARS.map((y) => (points ? (points.get(y) ?? null) : num(at(y)[v.name]))),
      actual: actualFor(v.name),
    });
  });
  for (const d of DERIVED_VALIDATIONS) {
    items.push(
      withApe({
        name: d.name,
        fungsi: "endogen",
        subsistem: "Produksi",
        jenis: "Turunan",
        unit: d.unit,
        equation: d.note,
        doc: "Dihitung dari keluaran model untuk dibandingkan dengan data resmi.",
        model: BASELINE_YEARS.map((y) => d.value(at(y))),
        actual: { values: d.actual, role: "validasi", note: d.note },
      }),
    );
  }
  const rank = (i: Item) => (i.actual?.role === "validasi" ? 0 : i.actual ? 1 : 2);
  return items.sort(
    (a, b) =>
      SUBSISTEMS.indexOf(a.subsistem) - SUBSISTEMS.indexOf(b.subsistem) ||
      FUNGSI_ORDER.indexOf(a.fungsi) - FUNGSI_ORDER.indexOf(b.fungsi) ||
      rank(a) - rank(b) ||
      a.name.localeCompare(b.name, "id"),
  );
}

function Detail({ item }: { item: Item }) {
  const modelPoints = item.model.flatMap((v, i) => (v !== null ? [{ x: BASELINE_YEARS[i], y: v }] : []));
  const actualPoints = (item.actual?.values ?? []).flatMap((v, i) => (v !== null ? [{ x: BASELINE_YEARS[i], y: v }] : []));
  const actualLabel = item.actual?.role === "konsistensi" ? "Data resmi" : "Aktual";
  const showChart = item.fungsi !== "parameter" && modelPoints.length > 0;
  return (
    <div className="grid gap-4 border-t border-lime-100 bg-lime-50/40 p-4 lg:grid-cols-[1fr_1.2fr]">
      <div className="space-y-3">
        {item.fungsi !== "parameter" && (
          <div className="overflow-x-auto rounded-lg border border-lime-100 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-lime-200 text-xs uppercase text-lime-800">
                  <th className="px-2 py-2 text-left">Tahun</th>
                  <th className="px-2 py-2 text-right">Model</th>
                  {item.actual && <th className="px-2 py-2 text-right">{actualLabel}</th>}
                  {item.actual && <th className="px-2 py-2 text-right">APE</th>}
                </tr>
              </thead>
              <tbody>
                {BASELINE_YEARS.map((year, i) => (
                  <tr key={year} className="border-b border-lime-50 last:border-none">
                    <td className="px-2 py-1.5 font-medium text-lime-900">{year}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-lime-900">{item.model[i] !== null ? formatCell(item.model[i] as number) : "–"}</td>
                    {item.actual && (
                      <td className="px-2 py-1.5 text-right tabular-nums text-lime-950">
                        {item.actual.values[i] !== null ? formatCell(item.actual.values[i] as number) : <span className="text-gray-400">–</span>}
                      </td>
                    )}
                    {item.actual && (
                      <td className={`px-2 py-1.5 text-right font-semibold tabular-nums ${apeTone(item.ape[i])}`}>
                        {item.ape[i] !== null ? `${(item.ape[i] as number).toFixed(2)}%` : "–"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="space-y-1.5 text-sm">
          <p className="text-xs font-semibold text-lime-800">Rumus</p>
          <pre className="whitespace-pre-wrap break-words rounded-lg bg-white p-2.5 font-mono text-xs leading-relaxed text-gray-900">
            {item.name} = {item.equation || "–"}
          </pre>
          {item.unit && (
            <p className="text-xs">
              <span className="font-semibold text-lime-800">Satuan:</span> {item.unit}
            </p>
          )}
          {item.doc && <p className="text-xs text-lime-900/75">{item.doc}</p>}
          {item.actual?.note && <p className="text-xs text-lime-900/60">Catatan data aktual: {item.actual.note}</p>}
        </div>
      </div>
      {showChart && (
        <div className="rounded-xl border border-lime-200 bg-white p-2">
          <Chart
            title={`${item.name}${item.unit ? ` (${item.unit})` : ""}`}
            yAxisLabel={item.unit || undefined}
            points={modelPoints}
            series={[
              { name: "Model", points: modelPoints, lineColor: "#3f7d20" },
              ...(actualPoints.length ? [{ name: actualLabel, points: actualPoints, lineColor: "#d97706" }] : []),
            ]}
            valueFormatter={formatCell}
            xFormatter={(v) => String(v)}
          />
        </div>
      )}
    </div>
  );
}

function apeTone(ape: number | null): string {
  if (ape === null) return "text-gray-400";
  return ape < 10 ? "text-lime-700" : ape < 20 ? "text-yellow-700" : "text-red-700";
}

const TONE_CLASS = {
  good: "bg-lime-100 text-lime-800 border-lime-300",
  ok: "bg-yellow-100 text-yellow-800 border-yellow-300",
  fair: "bg-amber-100 text-amber-800 border-amber-300",
  bad: "bg-red-100 text-red-800 border-red-300",
} as const;

/** Kolom keterangan ringkas: kategori MAPE, cek konsistensi, nilai parameter, atau "tidak ada data aktual". */
function Status({ item }: { item: Item }) {
  if (item.actual && item.mape !== null) {
    if (item.actual.role === "konsistensi") {
      return <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-800">Cek konsistensi</span>;
    }
    const c = mapeCategory(item.mape);
    return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONE_CLASS[c.tone]}`}>{c.label}</span>;
  }
  if (item.fungsi === "parameter") {
    return <span className="text-xs tabular-nums text-lime-900/70">Nilai tetap: {item.model[0] !== null ? formatCell(item.model[0]) : "–"}</span>;
  }
  return <span className="text-xs text-gray-400">Tidak ada data aktual</span>;
}

export default function VariableExplorer({ rows }: { rows: DataRow[] }) {
  const items = useMemo(() => buildItems(rows), [rows]);
  const [subsistem, setSubsistem] = useState<Subsistem | "Semua">("Semua");
  const [fungsi, setFungsi] = useState<Fungsi | "Semua">("endogen");
  const [onlyActual, setOnlyActual] = useState(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const validated = items.filter((i) => i.actual?.role === "validasi" && i.mape !== null);
  const averageMape = validated.length ? validated.reduce((s, i) => s + (i.mape as number), 0) / validated.length : null;

  const inSubsistem = items.filter((i) => subsistem === "Semua" || i.subsistem === subsistem);
  const q = query.trim().toLowerCase();
  const visible = inSubsistem.filter(
    (i) => (fungsi === "Semua" || i.fungsi === fungsi) && (!onlyActual || i.actual !== null) && (!q || i.name.toLowerCase().includes(q)),
  );

  const exportVisible = () =>
    exportCsv(
      "baseline-variabel.csv",
      ["Subsistem", "Fungsi", "Jenis", "Variabel", "Satuan", ...BASELINE_YEARS.map((y) => `Model ${y}`), ...BASELINE_YEARS.map((y) => `Aktual ${y}`), "MAPE (%)"],
      visible.map((i) => [
        i.subsistem,
        FUNGSI_LABEL[i.fungsi],
        i.jenis,
        i.name,
        i.unit,
        ...i.model.map((v) => v ?? ""),
        ...BASELINE_YEARS.map((_, k) => i.actual?.values[k] ?? ""),
        i.mape !== null ? i.mape.toFixed(4) : "",
      ]),
    );

  const chip = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm font-medium transition ${active ? "bg-lime-700 text-white shadow-sm" : "bg-lime-100 text-lime-900 hover:bg-lime-200"}`;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-lime-200 bg-lime-50 p-4">
          <p className="text-xs uppercase tracking-wide text-lime-700">Rata-rata MAPE</p>
          <p className="mt-1 text-2xl font-bold text-lime-900">{averageMape !== null ? `${averageMape.toFixed(2)}%` : "–"}</p>
          <p className="text-xs text-lime-900/60">
            {averageMape !== null ? mapeCategory(averageMape).label : "belum ada data"} · {validated.length} variabel divalidasi
          </p>
        </div>
        {FUNGSI_ORDER.map((f) => (
          <div key={f} className="rounded-2xl border border-lime-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-lime-700">{FUNGSI_LABEL[f]}</p>
            <p className="mt-1 text-2xl font-bold text-lime-900">{items.filter((i) => i.fungsi === f).length}</p>
            <p className="text-xs text-lime-900/60">{FUNGSI_DESC[f]}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-20 text-xs font-semibold uppercase tracking-wide text-lime-700">Subsistem</span>
          {(["Semua", ...SUBSISTEMS] as const).map((s) => (
            <button key={s} type="button" onClick={() => setSubsistem(s)} className={chip(subsistem === s)}>
              {s === "Semua" ? "Semua" : SUBSISTEM_LABEL[s]}
              <span className="ml-1 text-xs opacity-70">{s === "Semua" ? items.length : items.filter((i) => i.subsistem === s).length}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-20 text-xs font-semibold uppercase tracking-wide text-lime-700">Fungsi</span>
          {(["Semua", ...FUNGSI_ORDER] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFungsi(f)} className={chip(fungsi === f)}>
              {f === "Semua" ? "Semua" : FUNGSI_LABEL[f]}
              <span className="ml-1 text-xs opacity-70">{f === "Semua" ? inSubsistem.length : inSubsistem.filter((i) => i.fungsi === f).length}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari variabel…"
            className="min-w-56 flex-1 rounded-lg border border-lime-300 bg-white px-3 py-1.5 text-sm"
            aria-label="Cari variabel"
          />
          <label className="inline-flex items-center gap-2 text-sm text-lime-900">
            <input type="checkbox" checked={onlyActual} onChange={(e) => setOnlyActual(e.target.checked)} />
            Hanya yang punya data aktual
          </label>
          <button
            type="button"
            onClick={exportVisible}
            className="rounded-lg border border-lime-700 bg-white px-3 py-1.5 text-xs font-semibold text-lime-700 transition hover:bg-lime-50"
          >
            Export CSV ({visible.length})
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-lime-200 bg-white">
        <div className="hidden grid-cols-[1fr_130px_110px_190px_28px] gap-3 border-b border-lime-200 bg-lime-50 px-4 py-3 text-xs font-semibold uppercase text-lime-800 md:grid">
          <span>Variabel</span>
          <span>Jenis</span>
          <span className="text-right">MAPE</span>
          <span>Keterangan</span>
          <span />
        </div>
        {visible.length === 0 && <p className="px-4 py-6 text-center text-sm text-lime-900/60">Tidak ada variabel yang cocok dengan filter.</p>}
        <div className="max-h-[75vh] overflow-y-auto">
          {visible.map((item, index) => {
            // Judul kelompok muncul setiap kali kombinasi subsistem–fungsi berganti.
            const prev = visible[index - 1];
            const header = !prev || prev.subsistem !== item.subsistem || prev.fungsi !== item.fungsi;
            const isOpen = open === item.name;
            return (
              <Fragment key={item.name}>
                {header && (
                  <p className="sticky top-0 z-[1] border-b border-lime-100 bg-white/95 px-4 pb-1.5 pt-3 text-xs font-semibold uppercase tracking-wide text-lime-700 backdrop-blur">
                    {SUBSISTEM_LABEL[item.subsistem]} · {FUNGSI_LABEL[item.fungsi]}
                  </p>
                )}
                <div className="border-b border-lime-100 last:border-none">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : item.name)}
                    aria-expanded={isOpen}
                    className={`grid w-full grid-cols-[1fr_auto] items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors duration-200 md:grid-cols-[1fr_130px_110px_190px_28px] ${
                      isOpen ? "bg-lime-50" : "hover:bg-yellow-50"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="font-medium text-lime-950">{item.name}</span>
                      {item.unit && <span className="ml-1 text-xs text-lime-900/50">({item.unit})</span>}
                      <span className="mt-1 flex flex-wrap items-center gap-2 md:hidden">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${FUNGSI_STYLE[item.fungsi]}`}>{item.jenis}</span>
                        <Status item={item} />
                      </span>
                    </span>
                    <span className="hidden md:block">
                      <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${FUNGSI_STYLE[item.fungsi]}`}>{item.jenis}</span>
                    </span>
                    <span className="text-right font-semibold tabular-nums text-lime-950">{item.mape !== null ? `${item.mape.toFixed(2)}%` : "–"}</span>
                    <span className="hidden md:block">
                      <Status item={item} />
                    </span>
                    <svg
                      viewBox="0 0 20 20"
                      className={`hidden h-4 w-4 text-lime-700 transition-transform duration-300 md:block ${isOpen ? "rotate-180" : ""}`}
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
                    </svg>
                  </button>
                  <div className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">{isOpen && <Detail item={item} />}</div>
                  </div>
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-lime-900/60">
        Klik baris variabel untuk melihat nilai per tahun, APE, grafik, dan rumusnya. Subsistem ditentukan dari nama variabel (lib/modelVariables.ts); fungsi dibaca
        dari persamaan di file model.
      </p>
    </div>
  );
}
