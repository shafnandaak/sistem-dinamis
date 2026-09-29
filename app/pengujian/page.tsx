"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import initModel from "@/lib/sfd-model-fix-2.js";
import { runSimulation } from "@/lib/engine";
import { buildModelFunctions } from "@/lib/modelFunctions";
import ModelPrintNotice from "@/components/ModelPrintNotice";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { canAccessPengujian } from "@/lib/access";
import { BASELINE_YEARS, MAPE_VARIABLES, getModelValue, mapeCategory } from "@/lib/historicalActuals";
import { LOOKUP_ITEMS } from "@/lib/lookupData";
import { SFD } from "@/lib/sfdData";
import { exportCsv, formatValue, num, rowAt, type DataRow } from "@/lib/policies";
import { LOOKUP_APE_LIMIT, POLICY_OUTPUTS, REFERENCE_TOLERANCE, VENSIM_REFERENCES } from "@/lib/verification";

const MODEL_FILE = "FIX-SFD-19.mdl";
const FIRST_YEAR = BASELINE_YEARS[0];
const LAST_YEAR = BASELINE_YEARS[BASELINE_YEARS.length - 1];

type Kind = "endogen" | "lookup" | "konstanta";
const KIND_INFO: Record<Kind, { label: string; desc: string }> = {
  endogen: {
    label: "Variabel endogen",
    desc: "Dihitung oleh model dari variabel lain (stok, aliran, dan variabel bantu). Bila tersedia, data aktual ditampilkan di bawah hasil model.",
  },
  lookup: { label: "Lookup", desc: "Data historis yang dimasukkan ke model sebagai tabel per tahun; nilainya tidak dihitung, tetapi dibaca dari tabel." },
  konstanta: { label: "Konstanta", desc: "Parameter bernilai tetap sepanjang simulasi. Nilai di aplikasi dibandingkan dengan nilai yang tertulis di file model." },
};
const KINDS: Kind[] = ["endogen", "lookup", "konstanta"];

/** Satu variabel model beserta nilainya 2018-2025 dan (bila ada) data aktual pembandingnya. */
type Entry = {
  name: string;
  kind: Kind;
  sub: string;
  unit: string;
  equation: string;
  doc: string;
  model: (number | null)[];
  actual: (number | null)[] | null;
  /** "validasi" = dibandingkan untuk MAPE; "konsistensi" = variabel yang digerakkan lookup. */
  actualRole: "validasi" | "konsistensi" | null;
  actualNote?: string;
  ape: (number | null)[];
  mape: number | null;
};

type TestStatus = "pass" | "fail" | "info";
type TestResult = { name: string; expected: string; obtained: string; status: TestStatus };

const isLookupEq = (eq: string) => /^(WITH LOOKUP|LOOKUP)\b/i.test(eq);
const isConstantEq = (eq: string) => /^-?[\d.]+(e[+-]?\d+)?$/i.test(eq.trim());
const FLOWS = new Set(SFD.nodes.filter((n) => n.kind === "flow").map((n) => n.name.toLowerCase()));

/** Titik (tahun, nilai) dari tabel LOOKUP di persamaan, tanpa pasangan batas [(x,y)-(x,y)]. */
function lookupPoints(equation: string): Map<number, number> {
  const body = equation.replace(/\[[^\]]*\]/, "");
  return new Map([...body.matchAll(/\((-?[\d.]+)\s*,\s*(-?[\d.e+-]+)\)/gi)].map((m) => [Number(m[1]), Number(m[2])]));
}

function withActual(entry: Omit<Entry, "ape" | "mape">): Entry {
  const ape = BASELINE_YEARS.map((_, i) => {
    const a = entry.actual?.[i] ?? null;
    const m = entry.model[i];
    return a !== null && m !== null && a !== 0 ? (Math.abs(m - a) / Math.abs(a)) * 100 : null;
  });
  const valid = ape.filter((v): v is number => v !== null);
  return { ...entry, ape, mape: valid.length ? valid.reduce((s, v) => s + v, 0) / valid.length : null };
}

function buildEntries(rows: DataRow[]): Entry[] {
  const actualByVar = new Map(MAPE_VARIABLES.filter((v) => v.modelVar && v.actual.some((a) => a !== null)).map((v) => [v.modelVar!.toLowerCase(), v]));
  const lookupRefByVar = new Map(
    LOOKUP_ITEMS.filter((item) => item.reference && item.reference !== "lookup").map((item) => [item.drivenVar.toLowerCase(), item]),
  );
  const modelValues = (name: string) => BASELINE_YEARS.map((y) => {
    const v = rowAt(rows, y)[name];
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  });

  const entries: Entry[] = [];
  const outputs = Object.keys(rows[0] ?? {}).filter((k) => k !== "Time");
  for (const name of outputs) {
    const key = name.toLowerCase();
    const eq = SFD.equations[key];
    const generated = !eq && name.endsWith(" Tertunda");
    const equation = eq?.equation ?? (generated ? "DELAY1I(…) — dipisah dari persamaan Harga Produsen saat kompilasi" : "");
    const kind: Kind = eq && isLookupEq(eq.equation) ? "lookup" : eq && isConstantEq(eq.equation) ? "konstanta" : "endogen";
    const sub =
      kind === "lookup" ? "Lookup" : kind === "konstanta" ? "Konstanta" : /^INTEG\b/i.test(equation) ? "Stok" : FLOWS.has(key) ? "Aliran" : "Variabel bantu";

    const validation = actualByVar.get(key);
    const consistency = lookupRefByVar.get(key);
    const actual = validation ? validation.actual : consistency && consistency.reference !== "lookup" ? consistency.reference!.values : null;
    entries.push(
      withActual({
        name,
        kind,
        sub,
        unit: eq?.unit ?? "",
        equation,
        doc: eq?.doc ?? (generated ? "Variabel teknis hasil pra-proses DELAY1I; identik secara matematis dengan persamaan Vensim." : ""),
        model: modelValues(name),
        actual,
        actualRole: validation ? "validasi" : consistency ? "konsistensi" : null,
        actualNote: validation?.note ?? (consistency ? `Digerakkan ${consistency.lookupLabel}: cek konsistensi input, bukan validasi.` : undefined),
      }),
    );
  }

  // Tabel lookup yang tidak menjadi output model (dibaca melalui fungsi LOOKUP()).
  for (const eq of Object.values(SFD.equations)) {
    if (!/^LOOKUP\b/.test(eq.equation) || outputs.some((o) => o.toLowerCase() === eq.name.toLowerCase())) continue;
    const points = lookupPoints(eq.equation);
    entries.push(
      withActual({
        name: eq.name,
        kind: "lookup",
        sub: "Tabel lookup",
        unit: eq.unit,
        equation: eq.equation,
        doc: eq.doc || "Tabel lookup yang dibaca variabel lain melalui fungsi LOOKUP().",
        model: BASELINE_YEARS.map((y) => points.get(y) ?? null),
        actual: null,
        actualRole: null,
      }),
    );
  }

  // Variabel turunan yang divalidasi tetapi bukan variabel model (mis. Produksi Beras).
  for (const v of MAPE_VARIABLES.filter((x) => x.derive && x.actual.some((a) => a !== null))) {
    entries.push(
      withActual({
        name: v.label,
        kind: "endogen",
        sub: "Turunan",
        unit: v.unit,
        equation: v.note ?? "",
        doc: "Dihitung dari keluaran model untuk dibandingkan dengan data resmi.",
        model: BASELINE_YEARS.map((y) => getModelValue(v, rowAt(rows, y))),
        actual: v.actual,
        actualRole: "validasi",
        actualNote: v.note,
      }),
    );
  }

  const rank = (e: Entry) => (e.actualRole === "validasi" ? 0 : e.actualRole === "konsistensi" ? 1 : 2);
  return entries.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, "id"));
}

function runTests(rows: DataRow[], entries: Entry[]): TestResult[] {
  const fmt = (v: number) => v.toLocaleString("id-ID", { maximumFractionDigits: 2 });
  const tests: TestResult[] = [];

  const times = rows.map((r) => num(r["Time"]));
  const sequential = times.every((t, i) => t === 2018 + i);
  tests.push({
    name: "Periode simulasi 2018–2035 dengan langkah 1 tahun",
    expected: "18 tahun: 2018, 2019, …, 2035",
    obtained: `${times.length} tahun: ${times[0]}–${times[times.length - 1]}${sequential ? "" : " (tidak berurutan)"}`,
    status: times.length === 18 && sequential ? "pass" : "fail",
  });

  const nonZero = POLICY_OUTPUTS.flatMap((name) => rows.filter((r) => num(r[name]) !== 0).map((r) => `${name} ${r["Time"]}`));
  tests.push({
    name: "Baseline berjalan tanpa intervensi kebijakan",
    expected: `${POLICY_OUTPUTS.join(", ")} = 0 di semua tahun`,
    obtained: nonZero.length === 0 ? "semua bernilai 0" : `tidak nol: ${nonZero.slice(0, 3).join("; ")}`,
    status: nonZero.length === 0 ? "pass" : "fail",
  });

  for (const ref of VENSIM_REFERENCES) {
    const value = num(rowAt(rows, ref.year)[ref.variable]);
    const diff = Math.abs(value - ref.value);
    tests.push({
      name: `${ref.variable} ${ref.year} sama dengan Vensim`,
      expected: `${fmt(ref.value)} ${ref.unit} (${ref.source})`,
      obtained: `${fmt(value)} ${ref.unit} (selisih ${fmt(diff)})`,
      status: diff <= REFERENCE_TOLERANCE ? "pass" : "fail",
    });
  }

  const constants = entries.filter((e) => e.kind === "konstanta");
  const mismatched = constants.filter((e) => {
    const expected = Number(e.equation);
    return rows.some((r) => Math.abs(num(r[e.name]) - expected) > Math.abs(expected) * 1e-9 + 1e-12);
  });
  tests.push({
    name: "Konstanta di aplikasi sama dengan nilai di file model",
    expected: `${constants.length} konstanta bernilai sama dengan ${MODEL_FILE} di semua tahun`,
    obtained: mismatched.length === 0 ? `${constants.length} konstanta sesuai` : `berbeda: ${mismatched.map((e) => e.name).slice(0, 4).join(", ")}`,
    status: mismatched.length === 0 ? "pass" : "fail",
  });

  const columns = Object.keys(rows[0] ?? {});
  let invalid = 0;
  for (const row of rows) for (const c of columns) if (typeof row[c] !== "number" || !Number.isFinite(row[c] as number)) invalid += 1;
  tests.push({
    name: "Semua keluaran model bernilai valid",
    expected: "tidak ada nilai kosong, NaN, atau tak hingga",
    obtained: `${(rows.length * columns.length).toLocaleString("id-ID")} nilai diperiksa, ${invalid} tidak valid`,
    status: invalid === 0 ? "pass" : "fail",
  });

  let worst: { label: string; ape: number } | null = null;
  for (const e of entries.filter((x) => x.actualRole === "konsistensi")) {
    e.ape.forEach((ape, i) => {
      if (ape !== null && (!worst || ape > worst.ape)) worst = { label: `${e.name} ${BASELINE_YEARS[i]}`, ape };
    });
  }
  const worstResult = worst as { label: string; ape: number } | null;
  tests.push({
    name: "Data lookup luas panen konsisten dengan data resmi",
    expected: `APE setiap tahun < ${LOOKUP_APE_LIMIT}%`,
    obtained: worstResult ? `APE terbesar ${fmt(worstResult.ape)}% (${worstResult.label})` : "tidak ada data",
    status: worstResult && worstResult.ape < LOOKUP_APE_LIMIT ? "pass" : "fail",
  });

  const count = (k: Kind) => entries.filter((e) => e.kind === k).length;
  const validated = entries.filter((e) => e.actualRole === "validasi");
  const points = validated.reduce((n, e) => n + (e.actual?.filter((a) => a !== null).length ?? 0), 0);
  const missing = MAPE_VARIABLES.filter((v) => v.actual.every((a) => a === null)).map((v) => v.label);
  tests.push({
    name: "Cakupan variabel dan data aktual",
    expected: "setiap variabel model terklasifikasi; data aktual untuk variabel validasi",
    obtained:
      `${count("endogen")} endogen, ${count("lookup")} lookup, ${count("konstanta")} konstanta; ` +
      `${validated.length} variabel divalidasi (${points} titik data)` +
      (missing.length ? `; data aktual belum ada: ${missing.join(", ")}` : ""),
    status: "info",
  });
  return tests;
}

const STATUS_STYLE: Record<TestStatus, { label: string; className: string }> = {
  pass: { label: "✓ Lulus", className: "border-lime-300 bg-lime-100 text-lime-800" },
  fail: { label: "✗ Gagal", className: "border-red-300 bg-red-100 text-red-800" },
  info: { label: "ℹ Info", className: "border-sky-300 bg-sky-50 text-sky-800" },
};

/** Nilai kecil (lookup, konstanta) ditampilkan dengan 4 angka penting agar tidak terpotong, mis. 0,0634 atau -0,0004. */
function formatPrecise(value: number): string {
  if (value !== 0 && Math.abs(value) < 1) return value.toLocaleString("id-ID", { maximumSignificantDigits: 4 });
  return formatValue(value);
}

function Cell({ value, precise = false }: { value: number | null; precise?: boolean }) {
  if (value === null) return <span className="text-gray-400">–</span>;
  return <>{precise ? formatPrecise(value) : formatValue(value)}</>;
}

function EndogenTable({ entries }: { entries: Entry[] }) {
  return (
    <table className="min-w-full text-sm">
      <thead className="sticky top-0 z-10 bg-lime-50">
        <tr className="border-b border-lime-200 text-xs uppercase text-lime-800">
          <th className="px-3 py-2 text-left">Variabel</th>
          <th className="px-3 py-2 text-left">Data</th>
          {BASELINE_YEARS.map((y) => (
            <th key={y} className="px-3 py-2 text-right">
              {y}
            </th>
          ))}
          <th className="px-3 py-2 text-right">MAPE</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => {
          const span = e.actual ? 3 : 1;
          return (
            <Fragment key={e.name}>
              <tr className="border-t border-lime-200">
                <td rowSpan={span} className="min-w-[220px] px-3 py-2 align-top">
                  <p className="font-semibold text-lime-950">{e.name}</p>
                  <p className="text-xs text-lime-900/60">
                    {e.sub}
                    {e.unit ? ` · ${e.unit}` : ""}
                  </p>
                  {e.actualRole === "konsistensi" && <p className="mt-1 text-[11px] text-sky-700">{e.actualNote}</p>}
                  {e.actualRole === "validasi" && e.actualNote && <p className="mt-1 text-[11px] text-lime-900/50">{e.actualNote}</p>}
                  {!e.actual && <p className="mt-1 text-[11px] text-lime-900/40">Tidak ada data aktual</p>}
                </td>
                <td className="px-3 py-1.5 text-xs font-semibold text-lime-700">Model</td>
                {e.model.map((v, i) => (
                  <td key={i} className="px-3 py-1.5 text-right tabular-nums text-lime-900">
                    <Cell value={v} />
                  </td>
                ))}
                <td rowSpan={span} className="px-3 py-2 text-right align-middle">
                  {e.mape !== null ? (
                    <>
                      <p className="font-bold tabular-nums text-lime-950">{e.mape.toFixed(2)}%</p>
                      <p className="text-[11px] text-lime-900/60">{e.actualRole === "validasi" ? mapeCategory(e.mape).label : "konsistensi"}</p>
                    </>
                  ) : (
                    <span className="text-gray-400">–</span>
                  )}
                </td>
              </tr>
              {e.actual && (
                <>
                  <tr>
                    <td className="px-3 py-1.5 text-xs font-semibold text-amber-700">Aktual</td>
                    {e.actual.map((v, i) => (
                      <td key={i} className="px-3 py-1.5 text-right tabular-nums text-lime-950">
                        <Cell value={v} />
                      </td>
                    ))}
                  </tr>
                  <tr className="text-xs text-lime-900/60">
                    <td className="px-3 pb-2 pt-0.5 font-semibold">APE</td>
                    {e.ape.map((v, i) => (
                      <td key={i} className="px-3 pb-2 pt-0.5 text-right tabular-nums">
                        {v !== null ? `${v.toFixed(2)}%` : "–"}
                      </td>
                    ))}
                  </tr>
                </>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

function LookupTable({ entries }: { entries: Entry[] }) {
  return (
    <table className="min-w-full text-sm">
      <thead className="sticky top-0 z-10 bg-lime-50">
        <tr className="border-b border-lime-200 text-xs uppercase text-lime-800">
          <th className="px-3 py-2 text-left">Lookup</th>
          {BASELINE_YEARS.map((y) => (
            <th key={y} className="px-3 py-2 text-right">
              {y}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => (
          <tr key={e.name} className="border-b border-lime-100 last:border-none">
            <td className="min-w-[240px] px-3 py-2">
              <p className="font-semibold text-lime-950">{e.name}</p>
              <p className="text-xs text-lime-900/60">
                {e.sub}
                {e.unit ? ` · ${e.unit}` : ""}
              </p>
            </td>
            {e.model.map((v, i) => (
              <td key={i} className="px-3 py-2 text-right tabular-nums text-lime-900">
                <Cell value={v} precise />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ConstantTable({ entries }: { entries: Entry[] }) {
  return (
    <table className="min-w-full text-sm">
      <thead className="sticky top-0 z-10 bg-lime-50">
        <tr className="border-b border-lime-200 text-xs uppercase text-lime-800">
          <th className="px-3 py-2 text-left">Konstanta</th>
          <th className="px-3 py-2 text-right">Nilai di file model</th>
          <th className="px-3 py-2 text-right">Nilai di aplikasi</th>
          <th className="px-3 py-2 text-left">Satuan</th>
          <th className="px-3 py-2 text-left">Keterangan</th>
          <th className="px-3 py-2 text-left">Sesuai</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => {
          const expected = Number(e.equation);
          const value = e.model[0];
          const ok = value !== null && Math.abs(value - expected) <= Math.abs(expected) * 1e-9 + 1e-12;
          return (
            <tr key={e.name} className="border-b border-lime-100 align-top last:border-none">
              <td className="min-w-[220px] px-3 py-2 font-semibold text-lime-950">{e.name}</td>
              <td className="px-3 py-2 text-right font-mono text-xs text-lime-900">{e.equation}</td>
              <td className="px-3 py-2 text-right tabular-nums text-lime-900">
                <Cell value={value} precise />
              </td>
              <td className="px-3 py-2 text-xs text-lime-900/70">{e.unit}</td>
              <td className="max-w-md px-3 py-2 text-xs text-lime-900/70">{e.doc}</td>
              <td className="px-3 py-2">
                <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${ok ? STATUS_STYLE.pass.className : STATUS_STYLE.fail.className}`}>
                  {ok ? "✓" : "✗"}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** Pengaman tambahan di sisi halaman; akses utama sudah dibatasi di proxy.ts. */
export default function PengujianPage() {
  const { data: session, status } = useSession();
  if (status === "loading") return <p className="text-sm text-lime-900/70">Memeriksa akses…</p>;
  if (!canAccessPengujian(session?.user?.email)) {
    return (
      <section className="mx-auto max-w-lg rounded-3xl border border-lime-200 bg-white p-6 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Akses terbatas</p>
        <h1 className="mt-1 text-xl font-bold text-lime-950">Halaman Pengujian tidak tersedia untuk akun ini</h1>
        <p className="mt-2 text-sm text-lime-900/70">Halaman ini hanya dapat dibuka oleh akun penguji aplikasi.</p>
        <Link href="/" className="mt-4 inline-flex rounded-lg bg-lime-700 px-4 py-2 text-sm font-semibold text-white hover:bg-lime-800">
          Kembali ke Dashboard
        </Link>
      </section>
    );
  }
  return <PengujianContent />;
}

function PengujianContent() {
  const [rows, setRows] = useState<DataRow[]>([]);
  const [testedAt, setTestedAt] = useState("");
  const [error, setError] = useState("");
  const [kind, setKind] = useState<Kind>("endogen");
  const [query, setQuery] = useState("");
  const [onlyActual, setOnlyActual] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const model = await initModel();
        model.setModelFunctions(buildModelFunctions());
        setRows(runSimulation(model) as unknown as DataRow[]);
        setTestedAt(new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Gagal menjalankan model.");
      }
    };
    void run();
  }, []);

  const entries = useMemo(() => (rows.length ? buildEntries(rows) : []), [rows]);
  const tests = useMemo(() => (rows.length ? runTests(rows, entries) : []), [rows, entries]);
  const passed = tests.filter((t) => t.status === "pass").length;
  const judged = tests.filter((t) => t.status !== "info").length;

  const q = query.trim().toLowerCase();
  const visible = entries.filter(
    (e) => e.kind === kind && (!q || e.name.toLowerCase().includes(q)) && (kind !== "endogen" || !onlyActual || e.actual !== null),
  );
  const withActual = entries.filter((e) => e.kind === "endogen" && e.actual).length;

  const exportComparison = () =>
    exportCsv(
      "pengujian-aktual-vs-model.csv",
      ["Peran data", "Variabel", "Satuan", "Tahun", "Data aktual", "Hasil model", "Selisih", "APE (%)"],
      entries
        .filter((e) => e.actual)
        .flatMap((e) =>
          BASELINE_YEARS.map((y, i) => {
            const a = e.actual?.[i] ?? null;
            const m = e.model[i];
            return [e.actualRole ?? "", e.name, e.unit, y, a ?? "", m ?? "", a !== null && m !== null ? m - a : "", e.ape[i] !== null ? e.ape[i]!.toFixed(4) : ""];
          }),
        ),
    );

  const exportVariables = () =>
    exportCsv(
      "pengujian-daftar-variabel.csv",
      ["Jenis", "Subjenis", "Variabel", "Satuan", "Rumus", ...BASELINE_YEARS.map((y) => `Model ${y}`), ...BASELINE_YEARS.map((y) => `Aktual ${y}`), "MAPE (%)"],
      entries.map((e) => [
        KIND_INFO[e.kind].label,
        e.sub,
        e.name,
        e.unit,
        e.equation,
        ...e.model.map((v) => v ?? ""),
        ...BASELINE_YEARS.map((_, i) => e.actual?.[i] ?? ""),
        e.mape !== null ? e.mape.toFixed(4) : "",
      ]),
    );

  const exportModel = () => {
    const columns = Object.keys(rows[0] ?? {}).filter((c) => c !== "Time");
    exportCsv("pengujian-hasil-model-lengkap.csv", ["Tahun", ...columns], rows.map((r) => [num(r["Time"]), ...columns.map((c) => num(r[c]))]));
  };

  const exportTests = () =>
    exportCsv(
      "pengujian-hasil-uji.csv",
      ["Pengujian", "Yang diharapkan", "Hasil", "Status", "Waktu uji", "Model"],
      tests.map((t) => [t.name, t.expected, t.obtained, STATUS_STYLE[t.status].label.replace(/^\S+\s/, ""), testedAt, MODEL_FILE]),
    );

  const buttonClass = "rounded-lg border border-lime-700 bg-white px-3 py-2 text-xs font-semibold text-lime-700 transition hover:bg-lime-50 disabled:opacity-50";

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-lime-200 bg-white p-5 shadow-sm md:p-7">
        <p className="text-xs uppercase tracking-wide text-lime-700">Pengujian aplikasi</p>
        <h1 className="mt-1 text-2xl font-bold text-lime-900 md:text-3xl">Verifikasi Data dan Hasil Model</h1>
        <p className="mt-2 max-w-3xl text-sm text-lime-900/75">
          Halaman ini menjalankan model baseline ({MODEL_FILE}) langsung di browser, lalu menampilkan seluruh variabel model beserta data
          aktual yang dipakai aplikasi. Semua angka dihitung saat halaman dibuka dan dapat diekspor ke CSV.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={exportComparison} disabled={!rows.length} className="rounded-lg bg-lime-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-lime-800 disabled:bg-lime-300">
            Export aktual vs model (CSV)
          </button>
          <button type="button" onClick={exportVariables} disabled={!rows.length} className={buttonClass}>
            Export semua variabel + data aktual (CSV)
          </button>
          <button type="button" onClick={exportModel} disabled={!rows.length} className={buttonClass}>
            Export hasil model lengkap 2018–2035 (CSV)
          </button>
          <button type="button" onClick={exportTests} disabled={!rows.length} className={buttonClass}>
            Export hasil uji (CSV)
          </button>
        </div>
      </section>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">Gagal menjalankan model: {error}</p>}
      {!rows.length && !error && <p className="text-sm text-lime-900/70">Menjalankan model dan pengujian…</p>}

      {rows.length > 0 && (
        <>
          <section className="space-y-4 rounded-2xl border border-lime-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-lime-900">Uji otomatis</h2>
                <p className="text-xs text-lime-900/60">Diuji pada {testedAt}</p>
              </div>
              <p className={`rounded-full border px-3 py-1 text-sm font-semibold ${passed === judged ? STATUS_STYLE.pass.className : STATUS_STYLE.fail.className}`}>
                {passed} dari {judged} uji lulus
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-lime-200 bg-lime-50 text-xs uppercase text-lime-800">
                    <th className="px-3 py-2 text-left">Pengujian</th>
                    <th className="px-3 py-2 text-left">Yang diharapkan</th>
                    <th className="px-3 py-2 text-left">Hasil</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((t) => (
                    <tr key={t.name} className="border-b border-lime-100 align-top last:border-none">
                      <td className="px-3 py-2.5 font-medium text-lime-950">{t.name}</td>
                      <td className="px-3 py-2.5 text-lime-900/80">{t.expected}</td>
                      <td className="px-3 py-2.5 tabular-nums text-lime-900">{t.obtained}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[t.status].className}`}>
                          {STATUS_STYLE[t.status].label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-lime-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-lime-900">
                Variabel model dan data aktual {FIRST_YEAR}–{LAST_YEAR}
              </h2>
              <p className="text-xs text-lime-900/60">
                Seluruh variabel model dari run baseline, dikelompokkan menurut jenisnya. APE = |model − aktual| / aktual × 100%.
              </p>
            </div>
            <div className="flex flex-wrap gap-2" role="tablist">
              {KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={kind === k}
                  onClick={() => setKind(k)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${kind === k ? "bg-lime-700 text-white shadow-sm" : "bg-lime-100 text-lime-900 hover:bg-lime-200"}`}
                >
                  {KIND_INFO[k].label}
                  <span className="ml-1 text-xs opacity-70">{entries.filter((e) => e.kind === k).length}</span>
                </button>
              ))}
            </div>
            <p className="text-sm text-lime-900/75">{KIND_INFO[kind].desc}</p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari variabel…"
                className="min-w-56 flex-1 rounded-lg border border-lime-300 bg-white px-3 py-1.5 text-sm"
                aria-label="Cari variabel"
              />
              {kind === "endogen" && (
                <label className="inline-flex items-center gap-2 text-sm text-lime-900">
                  <input type="checkbox" checked={onlyActual} onChange={(e) => setOnlyActual(e.target.checked)} />
                  Hanya yang punya data aktual ({withActual})
                </label>
              )}
              <span className="text-xs text-lime-900/60">{visible.length} variabel ditampilkan</span>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-lime-200">
              {kind === "endogen" && <EndogenTable entries={visible} />}
              {kind === "lookup" && <LookupTable entries={visible} />}
              {kind === "konstanta" && <ConstantTable entries={visible} />}
            </div>
          </section>

          <ModelPrintNotice onPrint={() => window.print()} />
        </>
      )}
    </div>
  );
}
