// Data aktual Jawa Barat untuk validasi baseline (MAPE) periode 2018-2025.
//
// CARA MENGISI: isi array `actual` dengan 8 angka sesuai urutan BASELINE_YEARS
// (2018, 2019, ..., 2025). Gunakan `null` untuk tahun yang datanya belum ada.
// Satuan harus sama dengan satuan variabel di model (lihat `unit`).
// MAPE hanya dihitung dari tahun yang datanya terisi.

type DataRow = Record<string, number | string | null | undefined>;

export const BASELINE_START_YEAR = 2018;
export const BASELINE_END_YEAR = 2025;
export const BASELINE_YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

export type Subsistem = "Fisik" | "Produksi" | "Kependudukan" | "Sosial–Ekonomi";

export type MapeVariable = {
  key: string;
  subsistem: Subsistem;
  label: string;
  unit: string;
  /** Nama variabel output model. */
  modelVar?: string;
  /** Dipakai bila variabel tidak ada langsung di model dan perlu diturunkan. */
  derive?: (row: DataRow) => number;
  /** Keterangan singkat, mis. cara variabel diturunkan. */
  note?: string;
  /** 8 nilai: 2018-2025. */
  actual: (number | null)[];
};

const EMPTY: (number | null)[] = [null, null, null, null, null, null, null, null];

const KOMODITAS = [
  { name: "Padi", hargaVar: "Harga Produsen Padi GKG", energiVar: "Kontribusi Energi Beras", energiLabel: "Beras" },
  { name: "Jagung", hargaVar: "Harga Produsen Jagung", energiVar: "Kontribusi Energi Jagung", energiLabel: "Jagung" },
  { name: "Kedelai", hargaVar: "Harga Produsen Kedelai", energiVar: "Kontribusi Energi Kedelai", energiLabel: "Kedelai" },
  { name: "Kacang Tanah", hargaVar: "Harga Produsen Kacang Tanah", energiVar: "Kontribusi Energi Kacang Tanah", energiLabel: "Kacang Tanah" },
  { name: "Kacang Hijau", hargaVar: "Harga Produsen Kacang Hijau", energiVar: "Kontribusi Energi Kacang Hijau", energiLabel: "Kacang Hijau" },
  { name: "Ubi Kayu", hargaVar: "Harga Produsen Ubi Kayu", energiVar: "Kontribusi Energi Ubi Kayu", energiLabel: "Ubi Kayu" },
  { name: "Ubi Jalar", hargaVar: "Harga Produsen Ubi Jalar", energiVar: "Kontribusi Energi Ubi Jalar", energiLabel: "Ubi Jalar" },
];

/** Rendemen GKG -> beras, sama dengan yang dipakai model pada "Penyediaan Beras". */
const RENDEMEN_BERAS = 0.6411;

// Data resmi pembanding Jawa Barat 2018-2025 (urutan: 2018 ... 2025).
// Catatan konversi:
// - Harga GKG pada data sumber dalam Rp/kg, dikalikan 100 agar sama dengan satuan model (Rp/kuintal).
// - Produktivitas jagung tidak tersedia di data sumber (kolomnya berisi luas panen), sehingga dihitung
//   dari Produksi / Luas Panen x 10 (ton/ha -> ku/ha).
// - Nilai 2025 ubi jalar pada data sumber ditandai (kuning) sebagai angka sementara.
const LUAS_PANEN_JAGUNG = [135671, 130659, 56598, 68214, 95690, 76901, 77993, 90510.62652];
const PRODUKSI_JAGUNG = [1001927, 981204, 565980, 664899, 983518, 780770, 763327, 1038518.98];
const HARGA_GKG_PER_KG = [5600.12, 5440.54, 5460.84, 4987.84, 5270.59, 6624.0, 7423.0, 5829.56];

export const ACTUAL: Record<string, (number | null)[]> = {
  "luas-panen-padi": [1707253.81, 1578835.7, 1586888.63, 1604109.31, 1662403.96, 1583656.28, 1475362.09, 1755300],
  "luas-panen-jagung": LUAS_PANEN_JAGUNG,
  "luas-panen-kedelai": [76357, 36238, 53273, 18291, 26226, 27611, 8397, 34610.07],
  "luas-panen-kacang-tanah": [26280, 26862, 26582, 23775, 24724, 19426, 16674, 18026.35],
  "luas-panen-kacang-hijau": [10345, 5977, 7320, 5573, 5343, 4276, 3609, 3083.68],
  "luas-panen-ubi-kayu": [62892, 51759, 46511, 46142, 37280, 42968, 42524, 28296.75],
  "luas-panen-ubi-jalar": [19514, 21076, 20078, 17929, 16729, 19961, 19251, 18767.57],

  "produktivitas-padi": [56.51, 57.54, 56.82, 56.81, 56.75, 57.71, 58.47, 58.26],
  "produktivitas-jagung": PRODUKSI_JAGUNG.map((produksi, i) => (produksi / LUAS_PANEN_JAGUNG[i]) * 10),
  "produktivitas-kedelai": [13.37, 18.18, 16.99, 12.63, 18.6, 13.96, 15.67, 15.63],
  "produktivitas-kacang-tanah": [13.79, 15.05, 15.15, 14.92, 16.3, 16.24, 16.26, 17.65],
  "produktivitas-kacang-hijau": [9.85, 0.83, 0.88, 10.2, 12.2, 10.96, 9.76, 13.77],
  "produktivitas-ubi-kayu": [254.28, 305.1, 281.56, 281.57, 277.12, 276.66, 317.32, 307.24],
  "produktivitas-ubi-jalar": [247.08, 203.98, 221.86, 224.31, 183.65, 193.91, 238.23, 197.82],

  "produksi-padi": [9647359, 9084957, 9016773, 9113573, 9433723, 9140039, 8626880, 10226654],
  "produksi-jagung": PRODUKSI_JAGUNG,
  "produksi-kedelai": [102056, 63893, 90514, 23095, 48781, 38546, 13154, 54090.6],
  "produksi-kacang-tanah": [36253, 40417, 40280, 35480, 40292, 31544, 27114, 31808.94],
  "produksi-kacang-hijau": [10187, 498, 643, 5683, 6517, 4688, 3523, 4246.23],
  "produksi-ubi-kayu": [1599223, 1579185, 1309557, 1299196, 1033087, 1188760, 1349393, 869389.48],
  "produksi-ubi-jalar": [482140, 429900, 445440, 402162, 307223, 387061, 458605, 371252.22],
  "produksi-beras": [5542478.27, 5219374.38, 5180201.84, 5262925.39, 5447806.31, 5278209.2, 4981868.86, 5905710],

  "harga-padi": HARGA_GKG_PER_KG.map((harga) => harga * 100),
  "harga-jagung": [363773.0, 357449.92, 343446.08, 367454.17, 421277.25, 464338.33, 508705.75, 517349.42],
  "harga-kedelai": [786982.27, 857812.42, 859864.5, 874858.5, 904005.08, 969022.58, 961265.08, 1250006.33],
  "harga-kacang-tanah": [1113030.45, 954955.75, 961853.83, 937492.0, 997552.75, 1069253.5, 1006641.67, 1116601.25],
  "harga-kacang-hijau": [1189354.82, 1052181.25, 1176682.67, 1149608.42, 1126569.08, 1186716.42, 1270753.83, 1250714.08],
  "harga-ubi-kayu": [188583.09, 166956.92, 170823.17, 161095.42, 173523.83, 191246.92, 223595.25, 206595.33],
  "harga-ubi-jalar": [250133.73, 305675.5, 320867.33, 298789.08, 321900.5, 331073.5, 348730.5, 367531.33],

  // NTP Tanaman Pangan (NTPP), deret resmi dengan 2018 = 100.
  ntp: [100, 102.14, 103.28, 96.94, 97.5, 107.46, 113.2, 115.24],

  // PDRB ADHK Tanaman Pangan: data sumber dalam miliar rupiah, dikalikan 1e9 agar sama dengan satuan model (Rp).
  "pdrb-adhk": [44_305.18, 44_285.32, 45_882.5, 45_886.81, 48_048.1, 46_431.96, 45_638.95, 54_431.23].map((miliar) => miliar * 1e9),

  // Belum tersedia di data sumber: kontribusi energi per komoditas dan It.
};

export const MAPE_VARIABLES: MapeVariable[] = [
  // Luas panen komoditas lain tidak divalidasi: s.d. 2025 nilainya diturunkan dari luas lahan x
  // rasio historis (lookup), sehingga ditampilkan di bagian Data Lookup (lib/lookupData.ts).
  {
    key: "luas-panen-padi",
    subsistem: "Fisik",
    label: "Luas Panen Padi",
    unit: "ha",
    modelVar: "Luas Panen Padi",
    actual: ACTUAL["luas-panen-padi"] ?? EMPTY,
  },
  ...KOMODITAS.map((k) => {
    const key = `produktivitas-${k.name.toLowerCase().replace(/\s+/g, "-")}`;
    return {
      key,
      subsistem: "Produksi" as const,
      label: `Produktivitas ${k.name}`,
      unit: "ku/ha",
      modelVar: `Produktivitas ${k.name}`,
      note: k.name === "Jagung" ? "Data aktual dihitung dari Produksi / Luas Panen × 10" : undefined,
      actual: ACTUAL[key] ?? EMPTY,
    };
  }),
  ...KOMODITAS.map((k) => {
    const key = `produksi-${k.name.toLowerCase().replace(/\s+/g, "-")}`;
    return {
      key,
      subsistem: "Produksi" as const,
      label: `Produksi ${k.name}`,
      unit: "ton",
      modelVar: `Produksi ${k.name}`,
      actual: ACTUAL[key] ?? EMPTY,
    };
  }),
  {
    key: "produksi-beras",
    subsistem: "Produksi",
    label: "Produksi Beras",
    unit: "ton",
    derive: (row) => Number(row["Penggilingan Beras"] ?? 0) * RENDEMEN_BERAS,
    note: `Penggilingan Beras × ${RENDEMEN_BERAS} (rendemen)`,
    actual: ACTUAL["produksi-beras"] ?? EMPTY,
  },
  ...KOMODITAS.map((k) => {
    const key = `energi-${k.energiLabel.toLowerCase().replace(/\s+/g, "-")}`;
    return {
      key,
      subsistem: "Kependudukan" as const,
      label: `Kontribusi Energi ${k.energiLabel}`,
      unit: "kkal/kapita/hari",
      modelVar: k.energiVar,
      actual: ACTUAL[key] ?? EMPTY,
    };
  }),
  ...KOMODITAS.map((k) => {
    const key = `harga-${k.name.toLowerCase().replace(/\s+/g, "-")}`;
    return {
      key,
      subsistem: "Sosial–Ekonomi" as const,
      label: k.name === "Padi" ? "Harga Produsen Padi (GKG)" : `Harga Produsen ${k.name}`,
      unit: "Rp/kuintal",
      modelVar: k.hargaVar,
      note: k.name === "Padi" ? "Data aktual harga GKG (Rp/kg) dikonversi ke Rp/kuintal (× 100)" : undefined,
      actual: ACTUAL[key] ?? EMPTY,
    };
  }),
  {
    key: "it",
    subsistem: "Sosial–Ekonomi",
    label: "Indeks Harga yang Diterima Petani (It)",
    unit: "indeks",
    modelVar: "Indeks yang Diterima Petani",
    actual: ACTUAL.it ?? EMPTY,
  },
  {
    key: "ntp",
    subsistem: "Sosial–Ekonomi",
    label: "NTP Tanaman Pangan (NTPP)",
    unit: "indeks",
    modelVar: "NTP Tanaman Pangan",
    actual: ACTUAL.ntp ?? EMPTY,
  },
  {
    key: "pdrb-adhk",
    subsistem: "Sosial–Ekonomi",
    label: "PDRB Tanaman Pangan ADHK",
    unit: "Rp",
    modelVar: "PDRB Pertanian Tanaman Pangan",
    note: "Data aktual dalam miliar rupiah, dikonversi ke Rp (× 1.000.000.000)",
    actual: ACTUAL["pdrb-adhk"] ?? EMPTY,
  },
];

export function getModelValue(variable: MapeVariable, row: DataRow): number {
  if (variable.derive) return variable.derive(row);
  const value = row[variable.modelVar ?? ""];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/** `ape` = Absolute Percentage Error = |model − aktual| / aktual × 100. */
export type MapeYear = { year: number; actual: number | null; predicted: number | null; ape: number | null };

export type MapeResult = {
  variable: MapeVariable;
  mape: number | null;
  yearsWithData: number;
  years: MapeYear[];
};

export function computeMape(variable: MapeVariable, rows: DataRow[]): MapeResult {
  const years: MapeYear[] = BASELINE_YEARS.map((year, idx) => {
    const row = rows.find((r) => Number(r["Time"]) === year);
    const actual = variable.actual[idx] ?? null;
    const predicted = row ? getModelValue(variable, row) : null;
    const ape = actual !== null && predicted !== null && actual !== 0 ? (Math.abs(predicted - actual) / Math.abs(actual)) * 100 : null;
    return { year, actual, predicted, ape };
  });

  const errors = years.filter((y) => y.ape !== null).map((y) => y.ape as number);
  return {
    variable,
    mape: errors.length > 0 ? errors.reduce((sum, e) => sum + e, 0) / errors.length : null,
    yearsWithData: errors.length,
    years,
  };
}

/** Kriteria akurasi MAPE (Lewis, 1982). */
export function mapeCategory(mape: number): { label: string; tone: "good" | "ok" | "fair" | "bad" } {
  if (mape < 10) return { label: "Sangat baik", tone: "good" };
  if (mape < 20) return { label: "Baik", tone: "ok" };
  if (mape <= 50) return { label: "Layak", tone: "fair" };
  return { label: "Tidak akurat", tone: "bad" };
}
