// Data provinsi lain yang diunggah pengguna (template Excel + form parameter).
// Disimpan hanya di browser (localStorage). Bila tidak ada, aplikasi memakai data Jawa Barat
// bawaan model. Semua run model membaca data aktif lewat datasetOverrides() di lib/engine.js.
//
// Mengganti provinsi aktif memuat ulang halaman, sehingga modul yang membaca data aktif saat
// dimuat (mis. ACTUAL di lib/historicalActuals.ts) selalu konsisten.
import { MODEL_CONSTANTS, MODEL_LOOKUPS, STOCK_INITIALS } from "@/lib/modelInputs";

export const DEFAULT_PROVINCE = "Jawa Barat";
export const DATA_YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025];

export type YearValues = (number | null)[];

export type ProvinceDataset = {
  province: string;
  /** Nilai awal stok (2018), kunci = nama stok. */
  initials: Record<string, number>;
  /** Tabel lookup per tahun DATA_YEARS, kunci = nama lookup. */
  lookups: Record<string, YearValues>;
  /** Data aktual pembanding per tahun DATA_YEARS, kunci = key di ACTUAL_JABAR. */
  actual: Record<string, YearValues>;
  /** Konstanta model, kunci = nama konstanta. */
  params: Record<string, number>;
  savedAt: string;
};

const STORAGE_KEY = "sd-model:province-dataset:v1";

function isRecordOf(value: unknown, check: (v: unknown) => boolean): boolean {
  return typeof value === "object" && value !== null && Object.values(value).every(check);
}
const isNum = (v: unknown) => typeof v === "number" && Number.isFinite(v);
const isYearValues = (v: unknown) => Array.isArray(v) && v.every((x) => x === null || isNum(x));

export function readDataset(): ProvinceDataset | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as ProvinceDataset;
    const ok =
      typeof d?.province === "string" &&
      isRecordOf(d.initials, isNum) &&
      isRecordOf(d.lookups, isYearValues) &&
      isRecordOf(d.actual, isYearValues) &&
      isRecordOf(d.params, isNum);
    return ok ? d : null;
  } catch {
    return null;
  }
}

/** Menyimpan data provinsi. Mengembalikan false bila penyimpanan browser tidak tersedia. */
export function writeDataset(dataset: ProvinceDataset): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
    return true;
  } catch {
    return false;
  }
}

export function clearDataset() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // abaikan: tanpa localStorage memang tidak ada data tersimpan
  }
}

let cached: ProvinceDataset | null | undefined;

/** Data provinsi aktif (null = Jawa Barat bawaan). Selalu null saat render di server. */
export function getActiveDataset(): ProvinceDataset | null {
  if (typeof window === "undefined") return null;
  if (cached === undefined) cached = readDataset();
  return cached;
}

export function activeProvinceName(): string {
  return getActiveDataset()?.province ?? DEFAULT_PROVINCE;
}

/** Override untuk runSimulation: id variabel model -> nilai / titik lookup (x0, y0, x1, y1, ...). */
export function datasetOverrides(dataset: ProvinceDataset | null = getActiveDataset()) {
  const constants: Record<string, number> = {};
  const lookups: Record<string, number[]> = {};
  if (!dataset) return { constants, lookups };

  for (const item of STOCK_INITIALS) {
    const value = dataset.initials[item.name];
    if (isNum(value)) constants[item.id] = value;
  }
  for (const item of MODEL_CONSTANTS) {
    const value = dataset.params[item.name];
    if (isNum(value)) constants[item.id] = value;
  }
  for (const item of MODEL_LOOKUPS) {
    const values = dataset.lookups[item.name];
    if (!values) continue;
    const points = DATA_YEARS.flatMap((year, i) => (isNum(values[i]) ? [year, values[i] as number] : []));
    if (points.length > 0) lookups[item.id] = points;
  }
  return { constants, lookups };
}

/** ACTUAL_JABAR yang ditimpa data aktual provinsi aktif (dipakai lib/historicalActuals.ts). */
export function withActualOverrides(base: Record<string, YearValues>): Record<string, YearValues> {
  const dataset = getActiveDataset();
  if (!dataset) return base;
  // Provinsi lain: hanya data yang diunggah; data Jawa Barat tidak dipakai sebagai pembanding.
  const keys = new Set([...Object.keys(base), ...Object.keys(dataset.actual)]);
  return Object.fromEntries([...keys].map((key) => [key, dataset.actual[key] ?? DATA_YEARS.map(() => null)]));
}

// ---- Pengelompokan konstanta untuk form parameter ----

export type ParamGroup = "dasar" | "neraca" | "lanjutan";

export const PARAM_GROUPS: { id: ParamGroup; title: string; open: boolean }[] = [
  { id: "dasar", title: "Data dasar provinsi", open: true },
  { id: "neraca", title: "Koefisien neraca bahan makanan", open: false },
  { id: "lanjutan", title: "Lanjutan: asumsi perilaku model", open: false },
];

// Konstanta tetap (kalori, skor PPH, konversi satuan, indeks dasar) dan variabel kebijakan
// (diatur di halaman Simulasi) tidak ditampilkan.
const HIDDEN =
  /^(Kalori |Skor PPH|Bobot (Padi-padian|Kacang-kacangan|Umbi-umbian)$|Konversi |Satu Tahun$|Hari per Tahun$|Berat Acuan Kalori$|Kebutuhan Normatif|Total Kalori Ideal|Faktor Setara Beras Umbi$|% |Persentase Perubahan Irigasi$|(IT|IB|NTP) Dasar$)/;
const NERACA = /^(K (Benih|Pakan|Tercecer|Industri)|BDD |Fraksi GKG Digiling$)/;
const LANJUTAN = /^(Elastisitas|Pengaruh|Sensitivitas|Bobot It|Waktu Penyesuaian)/;

export function paramGroup(name: string): ParamGroup | null {
  if (HIDDEN.test(name)) return null;
  if (NERACA.test(name)) return "neraca";
  if (LANJUTAN.test(name)) return "lanjutan";
  return "dasar";
}

export const EDITABLE_PARAMS = MODEL_CONSTANTS.filter((c) => paramGroup(c.name) !== null);
