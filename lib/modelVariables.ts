// Klasifikasi variabel model untuk halaman Baseline dan Pengujian:
// - Fungsi: endogen / lookup / parameter (konstanta), dibaca dari persamaan di file model.
// - Subsistem: Fisik / Produksi / Kependudukan / Sosial–Ekonomi / Kebijakan, dari aturan nama di bawah.
//   Subsistem tidak tercatat di file .mdl, jadi aturannya ditulis di sini agar mudah ditinjau dan dikoreksi.
import { SFD } from "@/lib/sfdData";
import { BASELINE_YEARS, MAPE_VARIABLES, getModelValue } from "@/lib/historicalActuals";
import { LOOKUP_ITEMS } from "@/lib/lookupData";

export type Fungsi = "endogen" | "lookup" | "parameter";
export type Subsistem = "Fisik" | "Produksi" | "Kependudukan" | "Sosial–Ekonomi" | "Kebijakan" | "Umum";

/** "Umum" menampung variabel bantu waktu & konversi satuan yang tidak termasuk subsistem mana pun. */
export const SUBSISTEMS: Subsistem[] = ["Fisik", "Produksi", "Kependudukan", "Sosial–Ekonomi", "Kebijakan", "Umum"];
export const SUBSISTEM_LABEL: Record<Subsistem, string> = {
  Fisik: "Fisik",
  Produksi: "Produksi",
  Kependudukan: "Kependudukan",
  "Sosial–Ekonomi": "Sosial–Ekonomi",
  Kebijakan: "Kebijakan",
  Umum: "Umum (waktu & konversi)",
};
export const FUNGSI_LABEL: Record<Fungsi, string> = { endogen: "Endogen", lookup: "Lookup", parameter: "Parameter" };

/** Pengecualian per nama (huruf kecil) bila aturan umum kurang tepat. */
const OVERRIDES: Record<string, Subsistem> = {
  "tahun simulasi": "Umum",
  "satu tahun": "Umum",
  t: "Umum",
  "hari per tahun": "Umum",
  "konversi ton kuintal": "Umum",
  "konversi kilogram gram": "Umum",
  "konversi ton kilogram": "Umum",
  "rasio nilai tambah bruto": "Sosial–Ekonomi",
  "ncpr": "Kependudukan",
  "total produksi bersih": "Kependudukan",
  "kebutuhan normatif total": "Kependudukan",
};

// Aturan diperiksa berurutan; aturan pertama yang cocok menentukan subsistem.
const RULES: [Subsistem, RegExp][] = [
  ["Kebijakan", /^%|persentase perubahan irigasi|lp2b|rab\b|subsidi|belanja|efektivitas irigasi|elastisitas irigasi|efek rab|sensitivitas rab/i],
  ["Fisik", /luas|lahan|alih fungsi|irigasi|k luas/i],
  ["Kependudukan", /penduduk|konsumsi|kontribusi energi|ake|pph|bobot (padi|umbi|kacang)|kalori|bdd|ketersediaan .*(perkapita|per hari|pertahun|per tahun|kg|gram)|ketersediaan bahan makanan|food|normatif|setara beras|berat acuan/i],
  ["Sosial–Ekonomi", /harga|indeks|ntp|nilai tukar|pdrb|nilai produksi|bobot it|ib dasar|it dasar|kelangkaan|elastisitas harga|laju kenaikan|waktu penyesuaian harga|faktor ekonomi pertanian|elastisitas produktivitas terhadap ntp/i],
  ["Produksi", /produksi|produktivitas|stok|penyediaan|penggunaan|gkg|penggilingan|pemasukan|pakan|benih|tercecer|industri|faktor ekonomi|rendemen|fraksi|beras|padi|jagung|kedelai|kacang|ubi|regresi|shock|baseline|waktu penyesuaian produktivitas/i],
];

export function subsistemOf(name: string): Subsistem | null {
  const key = name.toLowerCase().replace(/\s+tertunda$/, "");
  if (OVERRIDES[key]) return OVERRIDES[key];
  for (const [sub, re] of RULES) if (re.test(key)) return sub;
  return null;
}

export function fungsiOf(equation: string | undefined): Fungsi {
  if (!equation) return "endogen";
  if (/^(WITH LOOKUP|LOOKUP)\b/i.test(equation)) return "lookup";
  if (/^-?[\d.]+(e[+-]?\d+)?$/i.test(equation.trim())) return "parameter";
  return "endogen";
}

export type ModelVariable = {
  name: string;
  fungsi: Fungsi;
  subsistem: Subsistem;
  /** Jenis rinci: Stok, Aliran, Variabel bantu, Lookup, Tabel lookup, Parameter. */
  jenis: string;
  unit: string;
  equation: string;
  doc: string;
};

const FLOWS = new Set(SFD.nodes.filter((n) => n.kind === "flow").map((n) => n.name.toLowerCase()));

/** Daftar variabel dari keluaran model (nama kolom hasil runSimulation) + tabel lookup yang bukan keluaran. */
export function describeVariables(outputNames: string[]): ModelVariable[] {
  const list: ModelVariable[] = [];
  const seen = new Set<string>();
  for (const name of outputNames) {
    if (name === "Time") continue;
    const eq = SFD.equations[name.toLowerCase()];
    const generated = !eq && name.endsWith(" Tertunda");
    const equation = eq?.equation ?? (generated ? "DELAY1I(…) — dipisah dari persamaan Harga Produsen saat kompilasi" : "");
    const fungsi = fungsiOf(eq?.equation);
    list.push({
      name,
      fungsi,
      subsistem: subsistemOf(name) ?? "Produksi",
      jenis:
        fungsi === "lookup" ? "Lookup" : fungsi === "parameter" ? "Parameter" : /^INTEG\b/i.test(equation) ? "Stok" : FLOWS.has(name.toLowerCase()) ? "Aliran" : "Variabel bantu",
      unit: eq?.unit ?? "",
      equation,
      doc: eq?.doc ?? (generated ? "Variabel teknis hasil pra-proses DELAY1I; identik secara matematis dengan persamaan Vensim." : ""),
    });
    seen.add(name.toLowerCase());
  }
  for (const eq of Object.values(SFD.equations)) {
    if (!/^LOOKUP\b/.test(eq.equation) || seen.has(eq.name.toLowerCase())) continue;
    list.push({
      name: eq.name,
      fungsi: "lookup",
      subsistem: subsistemOf(eq.name) ?? "Produksi",
      jenis: "Tabel lookup",
      unit: eq.unit,
      equation: eq.equation,
      doc: eq.doc || "Tabel lookup yang dibaca variabel lain melalui fungsi LOOKUP().",
    });
  }
  return list;
}

/** Titik (tahun, nilai) dari tabel LOOKUP di persamaan, tanpa pasangan batas [(x,y)-(x,y)]. */
export function lookupPoints(equation: string): Map<number, number> {
  const body = equation.replace(/\[[^\]]*\]/, "");
  return new Map([...body.matchAll(/\((-?[\d.]+)\s*,\s*(-?[\d.e+-]+)\)/gi)].map((m) => [Number(m[1]), Number(m[2])]));
}

export type ActualData = {
  values: (number | null)[];
  /** "validasi" = dipakai untuk MAPE; "konsistensi" = variabel yang digerakkan lookup (cek input, bukan validasi). */
  role: "validasi" | "konsistensi";
  note?: string;
};

const VALIDATION_BY_VAR = new Map(
  MAPE_VARIABLES.filter((v) => v.modelVar && v.actual.some((a) => a !== null)).map((v) => [v.modelVar!.toLowerCase(), v]),
);
const CONSISTENCY_BY_VAR = new Map(
  LOOKUP_ITEMS.filter((item) => item.reference && item.reference !== "lookup").map((item) => [item.drivenVar.toLowerCase(), item]),
);

/** Data aktual pembanding untuk variabel model (bila ada). */
export function actualFor(name: string): ActualData | null {
  const v = VALIDATION_BY_VAR.get(name.toLowerCase());
  if (v) return { values: v.actual, role: "validasi", note: v.note };
  const item = CONSISTENCY_BY_VAR.get(name.toLowerCase());
  if (item && item.reference && item.reference !== "lookup") {
    return { values: item.reference.values, role: "konsistensi", note: `Digerakkan ${item.lookupLabel}: cek konsistensi input, bukan validasi.` };
  }
  return null;
}

/** Variabel turunan yang divalidasi tetapi bukan variabel model (mis. Produksi Beras = Penggilingan Beras × rendemen). */
export const DERIVED_VALIDATIONS = MAPE_VARIABLES.filter((v) => v.derive && v.actual.some((a) => a !== null)).map((v) => ({
  name: v.label,
  unit: v.unit,
  note: v.note ?? "",
  actual: v.actual,
  value: (row: Record<string, number | string | null | undefined>) => getModelValue(v, row),
}));

export { BASELINE_YEARS };
