// Definisi kebijakan, skenario terbaik, dan indikator yang dipakai bersama oleh halaman Scenario dan Simulation.

export type DataRow = Record<string, number | string | null | undefined>;

export const FORECAST_START = 2026;
export const FINAL_YEAR = 2035;
/** Rendemen GKG -> beras, sama dengan persamaan "Penyediaan Beras" di model. */
export const RENDEMEN_BERAS = 0.6411;
/** Belanja Dasar di model (Rp/tahun), untuk menampilkan RAB dalam rupiah. */
export const BELANJA_DASAR = 353_211_000_000;

export type PolicyKey = "lp2b" | "rab" | "subsidi" | "irigasi";

export type Policy = {
  key: PolicyKey;
  label: string;
  title: string;
  varId: string;
  /** Nilai model = nilai slider × scale (mis. persen -> fraksi). */
  scale: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  /** Nilai pada tingkat "tinggi" (dipakai tiga skenario terbaik), dalam satuan slider. */
  high: number;
  detail: (value: number) => string;
  help: string;
};

export const POLICIES: Record<PolicyKey, Policy> = {
  lp2b: {
    key: "lp2b",
    label: "LP2B",
    title: "Lahan Pertanian Pangan Berkelanjutan",
    varId: "____lp2b_",
    scale: 0.01,
    min: 0,
    max: 100,
    step: 5,
    unit: "%",
    high: 100,
    detail: (v) => `${v}% lahan pangan dilindungi`,
    help: "Porsi lahan pangan yang dilindungi dari alih fungsi.",
  },
  rab: {
    key: "rab",
    label: "RAB",
    title: "Tambahan Belanja Pertanian",
    varId: "____penambahan_rab_",
    scale: 0.01,
    min: 0,
    max: 100,
    step: 5,
    unit: "%",
    high: 30,
    detail: (v) => `belanja pertanian +${v}%`,
    help: "Kenaikan anggaran pemerintah sektor pertanian terhadap belanja dasar.",
  },
  subsidi: {
    key: "subsidi",
    label: "Subsidi",
    title: "Kenaikan Subsidi Pupuk",
    varId: "____kenaikan_subsidi_",
    scale: 0.01,
    min: 0,
    max: 100,
    step: 5,
    unit: "%",
    high: 30,
    detail: (v) => `subsidi pupuk +${v}%`,
    help: "Kenaikan volume subsidi pupuk terhadap subsidi dasar.",
  },
  irigasi: {
    key: "irigasi",
    label: "Irigasi",
    title: "Perluasan Sawah Irigasi",
    varId: "_persentase_perubahan_irigasi",
    scale: 0.01,
    min: 0,
    max: 10,
    step: 0.5,
    unit: "%/tahun",
    high: 3,
    detail: (v) => `sawah irigasi +${v.toLocaleString("id-ID")}%/tahun`,
    help: "Laju penambahan luas sawah irigasi per tahun.",
  },
};

export const POLICY_ORDER: PolicyKey[] = ["lp2b", "rab", "subsidi", "irigasi"];

export type PolicyValues = Record<PolicyKey, number>;

export const NO_POLICY: PolicyValues = { lp2b: 0, rab: 0, subsidi: 0, irigasi: 0 };

/** Ubah nilai slider menjadi konstanta model untuk runSimulation. */
export function toModelConstants(values: PolicyValues): Record<string, number> {
  return Object.fromEntries(POLICY_ORDER.map((key) => [POLICIES[key].varId, values[key] * POLICIES[key].scale]));
}

export type Scenario = {
  id: string;
  rank: number;
  name: string;
  tagline: string;
  description: string;
  policies: PolicyKey[];
  color: string;
};

export const SCENARIOS: Scenario[] = [
  {
    id: "s1",
    rank: 1,
    name: "Paket Terpadu",
    tagline: "Semua kebijakan dijalankan bersamaan",
    description:
      "Lahan pangan dilindungi, anggaran pertanian ditambah, subsidi pupuk dinaikkan, dan irigasi diperluas. Menghasilkan peningkatan produksi dan PDRB tertinggi.",
    policies: ["lp2b", "rab", "subsidi", "irigasi"],
    color: "#3f7d20",
  },
  {
    id: "s2",
    rank: 2,
    name: "Lindungi Lahan & Irigasi",
    tagline: "Tanpa tambahan subsidi pupuk",
    description:
      "Menjaga lahan pangan dari alih fungsi sekaligus memperluas irigasi dengan dukungan anggaran. Hasilnya hampir setara Paket Terpadu tanpa menambah subsidi pupuk.",
    policies: ["lp2b", "rab", "irigasi"],
    color: "#d97706",
  },
  {
    id: "s3",
    rank: 3,
    name: "Intensifikasi Produksi",
    tagline: "Tanpa perlindungan lahan (LP2B)",
    description:
      "Meningkatkan hasil per hektare melalui anggaran, subsidi pupuk, dan irigasi, tanpa menahan alih fungsi lahan. Luas lahan tidak berubah dari baseline.",
    policies: ["rab", "subsidi", "irigasi"],
    color: "#2563eb",
  },
];

/** Nilai slider untuk sebuah skenario: kebijakan yang aktif memakai tingkat tinggi, lainnya 0. */
export function scenarioValues(scenario: Scenario): PolicyValues {
  return Object.fromEntries(POLICY_ORDER.map((key) => [key, scenario.policies.includes(key) ? POLICIES[key].high : 0])) as PolicyValues;
}

export type Metric = {
  key: string;
  label: string;
  unit: string;
  value: (row: DataRow) => number;
  average?: boolean;
  /** True bila penurunan berarti membaik (mis. NCPR). */
  lowerIsBetter?: boolean;
};

export const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

export const METRICS: Metric[] = [
  { key: "padi", label: "Produksi padi", unit: "ton/tahun", value: (r) => num(r["Produksi Padi"]), average: true },
  { key: "beras", label: "Produksi beras", unit: "ton/tahun", value: (r) => num(r["Penggilingan Beras"]) * RENDEMEN_BERAS, average: true },
  // NCPR = kebutuhan konsumsi normatif / produksi bersih: makin kecil makin baik.
  { key: "ncpr", label: "NCPR", unit: "rasio", value: (r) => num(r["NCPR"]), average: true, lowerIsBetter: true },
  { key: "pph", label: "Skor PPH padi-padian", unit: "skor", value: (r) => num(r["Skor PPH Padi-padian"]) },
  { key: "ntp", label: "NTPP", unit: "indeks", value: (r) => num(r["NTP Tanaman Pangan"]) },
  { key: "pdrb", label: "PDRB ADHK", unit: "Rupiah/tahun", value: (r) => num(r["PDRB Pertanian Tanaman Pangan"]) },
  { key: "lahan", label: "Luas lahan", unit: "ha", value: (r) => num(r["Luas Lahan Pertanian"]) },
  { key: "irigasi", label: "Luas sawah irigasi", unit: "ha", value: (r) => num(r["Luas Sawah Irigasi"]) },
];

/** Warna teks perubahan: hijau bila membaik, merah bila memburuk, abu-abu bila ~0. */
export function changeTone(change: number, lowerIsBetter = false): string {
  const better = lowerIsBetter ? -change : change;
  return better > 0.0049 ? "text-lime-700" : better < -0.0049 ? "text-red-700" : "text-gray-500";
}

export function rowAt(rows: DataRow[], year: number): DataRow {
  return rows.find((r) => num(r["Time"]) === year) ?? {};
}

export function pctChange(value: number, base: number): number {
  return base === 0 ? 0 : (value / base - 1) * 100;
}

export function formatPct(value: number): string {
  const sign = value > 0.0049 ? "+" : value < -0.0049 ? "−" : "";
  return `${sign}${Math.abs(value).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

export function formatValue(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} T`;
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} M`;
  return value.toLocaleString("id-ID", { maximumFractionDigits: abs < 10 ? 3 : 2 });
}

export function exportCsv(filename: string, header: string[], lines: (string | number)[][]) {
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [header, ...lines].map((line) => line.map(escape).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
